import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTask, deleteTask, fetchTasks, updateTask } from './tasks';

const fetchMock = vi.fn<typeof fetch>();

const buildJsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

describe('task api', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('fetches tasks from the tasks endpoint', async () => {
    fetchMock.mockResolvedValueOnce(buildJsonResponse([{ id: 'task-123' }]));

    await expect(fetchTasks()).resolves.toEqual([{ id: 'task-123' }]);
    expect(fetchMock).toHaveBeenCalledWith('/tasks');
  });

  it('creates tasks with a JSON request body', async () => {
    fetchMock.mockResolvedValueOnce(
      buildJsonResponse(
        { id: 'task-123', title: 'Ship board' },
        { status: 201 },
      ),
    );

    await expect(
      createTask({
        title: 'Ship board',
        description: 'Wire up the realtime path.',
        status: 'todo',
        createdBy: 'leah',
      }),
    ).resolves.toEqual({ id: 'task-123', title: 'Ship board' });

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/tasks');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      title: 'Ship board',
      description: 'Wire up the realtime path.',
      status: 'todo',
      createdBy: 'leah',
    });
  });

  it('updates tasks with a patch request body', async () => {
    fetchMock.mockResolvedValueOnce(
      buildJsonResponse({ id: 'task-123', title: 'Refined architecture' }),
    );

    await expect(
      updateTask({
        taskId: 'task-123',
        updates: {
          title: 'Refined architecture',
          description: null,
          status: 'done',
        },
      }),
    ).resolves.toEqual({ id: 'task-123', title: 'Refined architecture' });

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/tasks/task-123');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      title: 'Refined architecture',
      description: null,
      status: 'done',
    });
  });

  it('accepts empty delete responses and surfaces API errors', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        buildJsonResponse(
          { message: 'Failed to load tasks.' },
          { status: 500 },
        ),
      );

    await expect(deleteTask('task-123')).resolves.toBeUndefined();
    await expect(fetchTasks()).rejects.toThrow('Failed to load tasks.');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/tasks/task-123');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'DELETE' });
  });
});
