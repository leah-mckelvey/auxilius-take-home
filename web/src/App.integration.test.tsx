import {
  TASKS_CHANGED_EVENT,
  type Task,
  type TaskChangeEvent,
} from '@auxilius-take-home/types';
import { QueryClientProvider } from '@ts-query/react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { usernameStorageKey } from './auth/username-storage';
import { createAppQueryClient } from './query-client';

interface MockSocket {
  on: (eventName: string, handler: unknown) => MockSocket;
  off: (eventName: string, handler: unknown) => MockSocket;
  disconnect: () => void;
}

const { disconnectMock, ioMock, offMock, onMock, socketMock } = vi.hoisted(
  () => {
    const onMock = vi.fn<MockSocket['on']>();
    const offMock = vi.fn<MockSocket['off']>();
    const disconnectMock = vi.fn<MockSocket['disconnect']>();

    const socket: MockSocket = {
      on: onMock,
      off: offMock,
      disconnect: disconnectMock,
    };

    onMock.mockImplementation(() => socket);
    offMock.mockImplementation(() => socket);

    return {
      disconnectMock,
      ioMock: vi.fn(() => socket),
      offMock,
      onMock,
      socketMock: socket,
    };
  },
);

vi.mock('socket.io-client', () => ({ io: ioMock }));

const fetchMock = vi.fn<typeof fetch>();

const buildJsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

const buildTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-123',
  title: 'Draft architecture write-up',
  description: null,
  status: 'todo',
  createdBy: 'leah',
  createdAt: '2026-03-11T00:00:00.000Z',
  updatedAt: '2026-03-11T00:00:00.000Z',
  ...overrides,
});

const renderApp = () =>
  render(
    <QueryClientProvider client={createAppQueryClient()}>
      <App />
    </QueryClientProvider>,
  );

describe('App integration', () => {
  let realtimeHandler: ((event: TaskChangeEvent) => void) | undefined;

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    ioMock.mockClear();
    onMock.mockReset();
    offMock.mockReset();
    disconnectMock.mockReset();
    realtimeHandler = undefined;

    onMock.mockImplementation((eventName: string, handler: unknown) => {
      if (eventName === TASKS_CHANGED_EVENT) {
        realtimeHandler = handler as (event: TaskChangeEvent) => void;
      }

      return socketMock;
    });
    offMock.mockImplementation(() => socketMock);
  });

  it('logs in, loads tasks, applies realtime updates, and creates a task', async () => {
    const remoteTask = buildTask({
      id: 'task-remote',
      title: 'Review Docker startup path',
      description: 'Confirm the compose flow in a second tab.',
      status: 'in_progress',
      createdBy: 'sam',
    });
    const createdTask = buildTask({
      id: 'task-created',
      title: 'Document the architecture',
      description: 'Explain the app and code organization clearly.',
      status: 'done',
      createdBy: 'Leah',
    });

    fetchMock
      .mockResolvedValueOnce(buildJsonResponse([]))
      .mockResolvedValueOnce(buildJsonResponse(createdTask, { status: 201 }));

    const user = userEvent.setup();
    const { unmount } = renderApp();

    await user.type(screen.getByLabelText('Username'), '  Leah  ');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Signed in as Leah')).toBeInTheDocument();
    expect(localStorage.getItem(usernameStorageKey)).toBe('Leah');

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(1, '/tasks');
    });

    expect(ioMock).toHaveBeenCalledTimes(1);
    expect(socketMock.on).toHaveBeenCalledWith(
      TASKS_CHANGED_EVENT,
      expect.any(Function),
    );

    if (realtimeHandler === undefined) {
      throw new Error(
        'Expected the task board to register a realtime handler.',
      );
    }

    const handleRealtime = realtimeHandler;

    act(() => {
      handleRealtime({ type: 'created', task: remoteTask });
    });

    expect(
      await screen.findByRole('article', {
        name: `Task ${remoteTask.title}`,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Real-time sync received: task created.'),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText('New task title'), createdTask.title);
    await user.type(
      screen.getByLabelText('New task description'),
      createdTask.description ?? '',
    );
    await user.selectOptions(
      screen.getByLabelText('New task status'),
      createdTask.status,
    );
    await user.click(screen.getByRole('button', { name: 'Add task' }));

    expect(await screen.findByText('Task created.')).toBeInTheDocument();
    expect(
      await screen.findByRole('article', {
        name: `Task ${createdTask.title}`,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Created by ${createdTask.createdBy}`),
    ).toBeInTheDocument();

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/tasks',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual({
      title: createdTask.title,
      description: createdTask.description,
      status: createdTask.status,
      createdBy: 'Leah',
    });

    unmount();

    expect(disconnectMock).toHaveBeenCalledTimes(1);
  });
});
