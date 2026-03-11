import { QueryClientProvider } from '@ts-query/react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  TASKS_CHANGED_EVENT,
  type Task,
  type TaskChangeEvent,
} from '@auxilius-take-home/types';

import { App } from './App';
import { createAppQueryClient } from './query-client';

const socketMocks = vi.hoisted(() => ({
  disconnect: vi.fn(),
  off: vi.fn(),
  on: vi.fn(),
}));

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => socketMocks),
}));

const buildJsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

const buildTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-123',
  title: 'Draft architecture',
  description: 'Write down the main constraints.',
  status: 'todo',
  createdBy: 'leah',
  createdAt: '2026-03-10T00:00:00.000Z',
  updatedAt: '2026-03-10T00:00:00.000Z',
  ...overrides,
});

const fetchMock = vi.fn<typeof fetch>();

const renderApp = () =>
  render(
    <QueryClientProvider client={createAppQueryClient()}>
      <App />
    </QueryClientProvider>,
  );

describe('App', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    socketMocks.disconnect.mockReset();
    socketMocks.off.mockReset();
    socketMocks.on.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('lets a user log in and stores the username', async () => {
    fetchMock.mockResolvedValueOnce(buildJsonResponse([]));
    const user = userEvent.setup();

    renderApp();

    await user.type(screen.getByLabelText('Username'), 'leah');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(globalThis.localStorage.getItem('auxilius.username')).toBe('leah');
    expect(await screen.findByText('Signed in as leah')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/tasks');
  });

  it('reuses a stored username on future visits', async () => {
    globalThis.localStorage.setItem('auxilius.username', 'sam');
    fetchMock.mockResolvedValueOnce(buildJsonResponse([buildTask()]));

    renderApp();

    expect(screen.queryByText('Choose a username')).not.toBeInTheDocument();
    expect(await screen.findByText('Signed in as sam')).toBeInTheDocument();
    expect(
      await screen.findByDisplayValue('Draft architecture'),
    ).toBeInTheDocument();
  });

  it('creates a task and refreshes the board via query invalidation', async () => {
    globalThis.localStorage.setItem('auxilius.username', 'leah');
    fetchMock
      .mockResolvedValueOnce(buildJsonResponse([]))
      .mockResolvedValueOnce(
        buildJsonResponse(buildTask({ id: 'task-999', title: 'Ship board' }), {
          status: 201,
        }),
      )
      .mockResolvedValueOnce(
        buildJsonResponse([buildTask({ id: 'task-999', title: 'Ship board' })]),
      );
    const user = userEvent.setup();

    renderApp();
    await screen.findByText('Signed in as leah');

    await user.type(screen.getByLabelText('New task title'), 'Ship board');
    await user.type(
      screen.getByLabelText('New task description'),
      'Wire up the realtime path.',
    );
    await user.selectOptions(screen.getByLabelText('New task status'), 'done');
    await user.click(screen.getByRole('button', { name: 'Add task' }));

    expect(await screen.findByDisplayValue('Ship board')).toBeInTheDocument();

    const [, createRequest] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/tasks');
    expect(createRequest.method).toBe('POST');
    expect(JSON.parse(String(createRequest.body))).toEqual({
      title: 'Ship board',
      description: 'Wire up the realtime path.',
      status: 'done',
      createdBy: 'leah',
    });
  });

  it('updates and deletes a task through the REST mutations', async () => {
    globalThis.localStorage.setItem('auxilius.username', 'leah');
    fetchMock
      .mockResolvedValueOnce(buildJsonResponse([buildTask()]))
      .mockResolvedValueOnce(
        buildJsonResponse(
          buildTask({ title: 'Refined architecture', status: 'done' }),
        ),
      )
      .mockResolvedValueOnce(
        buildJsonResponse([
          buildTask({ title: 'Refined architecture', status: 'done' }),
        ]),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(buildJsonResponse([]));
    const user = userEvent.setup();

    renderApp();

    const taskCard = await screen.findByRole('article', {
      name: 'Task Draft architecture',
    });

    await user.clear(within(taskCard).getByLabelText('Title'));
    await user.type(
      within(taskCard).getByLabelText('Title'),
      'Refined architecture',
    );
    await user.selectOptions(within(taskCard).getByLabelText('Status'), 'done');
    await user.click(within(taskCard).getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByDisplayValue('Refined architecture'),
    ).toBeInTheDocument();

    const [, updateRequest] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/tasks/task-123');
    expect(updateRequest.method).toBe('PATCH');
    expect(JSON.parse(String(updateRequest.body))).toEqual({
      title: 'Refined architecture',
      description: 'Write down the main constraints.',
      status: 'done',
    });

    const updatedTaskCard = await screen.findByRole('article', {
      name: 'Task Refined architecture',
    });
    await user.click(
      within(updatedTaskCard).getByRole('button', { name: 'Delete' }),
    );

    await waitFor(() => {
      expect(
        screen.queryByDisplayValue('Refined architecture'),
      ).not.toBeInTheDocument();
    });
    expect(fetchMock.mock.calls[3]?.[0]).toBe('/tasks/task-123');
    expect((fetchMock.mock.calls[3]?.[1] as RequestInit).method).toBe('DELETE');
  });

  it('refetches tasks on websocket callbacks and cleans up the socket subscription', async () => {
    globalThis.localStorage.setItem('auxilius.username', 'leah');
    fetchMock
      .mockResolvedValueOnce(buildJsonResponse([buildTask()]))
      .mockResolvedValueOnce(
        buildJsonResponse([buildTask({ title: 'Updated elsewhere' })]),
      );

    const rendered = renderApp();
    await screen.findByDisplayValue('Draft architecture');

    const socketHandler = socketMocks.on.mock.calls.find(
      ([eventName]) => eventName === TASKS_CHANGED_EVENT,
    )?.[1] as ((event: TaskChangeEvent) => void) | undefined;

    expect(socketHandler).toBeDefined();
    socketHandler?.({ type: 'updated', taskId: 'task-123' });

    expect(
      await screen.findByDisplayValue('Updated elsewhere'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Real-time sync received: task updated.'),
    ).toBeInTheDocument();

    rendered.unmount();

    expect(socketMocks.off).toHaveBeenCalledWith(
      TASKS_CHANGED_EVENT,
      socketHandler,
    );
    expect(socketMocks.disconnect).toHaveBeenCalledTimes(1);
  });

  it('surfaces query errors from the API', async () => {
    globalThis.localStorage.setItem('auxilius.username', 'leah');
    fetchMock.mockResolvedValueOnce(
      buildJsonResponse({ message: 'Failed to load tasks.' }, { status: 500 }),
    );

    renderApp();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to load tasks.',
    );
  });

  it('surfaces mutation errors from the API', async () => {
    globalThis.localStorage.setItem('auxilius.username', 'leah');
    fetchMock
      .mockResolvedValueOnce(buildJsonResponse([]))
      .mockResolvedValueOnce(
        buildJsonResponse(
          { message: 'Failed to create task.' },
          { status: 500 },
        ),
      );
    const user = userEvent.setup();

    renderApp();
    await screen.findByText('Signed in as leah');

    await user.type(screen.getByLabelText('New task title'), 'Broken create');
    await user.click(screen.getByRole('button', { name: 'Add task' }));

    expect(
      await screen.findByText('Failed to create task.'),
    ).toBeInTheDocument();
  });
});
