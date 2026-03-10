import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from './app';
import type { TaskListItem, TaskRepository } from './tasks/task-repository';

const buildTaskRepository = (
  overrides: Partial<TaskRepository> = {},
): TaskRepository => ({
  listTasks: vi.fn().mockResolvedValue([] satisfies TaskListItem[]),
  ...overrides,
});

describe('createApp', () => {
  it('returns application health', async () => {
    const app = createApp({ taskRepository: buildTaskRepository() });
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('lists tasks from the repository', async () => {
    const listTasks = vi.fn().mockResolvedValue([
      {
        id: 'task-123',
        title: 'Draft architecture',
        description: 'Write down the main constraints.',
        status: 'todo',
        createdBy: 'leah',
        createdAt: '2026-03-10T00:00:00.000Z',
        updatedAt: '2026-03-10T00:00:00.000Z',
      },
    ] satisfies TaskListItem[]);
    const app = createApp({
      taskRepository: buildTaskRepository({ listTasks }),
    });
    const response = await request(app).get('/tasks');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: 'task-123',
        title: 'Draft architecture',
        description: 'Write down the main constraints.',
        status: 'todo',
        createdBy: 'leah',
        createdAt: '2026-03-10T00:00:00.000Z',
        updatedAt: '2026-03-10T00:00:00.000Z',
      },
    ]);
    expect(listTasks).toHaveBeenCalledTimes(1);
  });

  it('returns an internal server error when loading tasks fails', async () => {
    const app = createApp({
      taskRepository: buildTaskRepository({
        listTasks: vi.fn().mockRejectedValue(new Error('database unavailable')),
      }),
    });
    const response = await request(app).get('/tasks');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Failed to load tasks.' });
  });

  it('returns not implemented for creating tasks', async () => {
    const app = createApp({ taskRepository: buildTaskRepository() });
    const response = await request(app).post('/tasks').send({
      title: 'Draft architecture',
    });

    expect(response.status).toBe(501);
    expect(response.body).toEqual({
      message: 'Task endpoints are not implemented yet.',
    });
  });

  it('returns not implemented for updating tasks', async () => {
    const app = createApp({ taskRepository: buildTaskRepository() });
    const response = await request(app).patch('/tasks/task-123').send({
      title: 'Refine architecture',
    });

    expect(response.status).toBe(501);
    expect(response.body).toEqual({
      message: 'Task endpoints are not implemented yet.',
    });
  });

  it('returns not implemented for deleting tasks', async () => {
    const app = createApp({ taskRepository: buildTaskRepository() });
    const response = await request(app).delete('/tasks/task-123');

    expect(response.status).toBe(501);
    expect(response.body).toEqual({
      message: 'Task endpoints are not implemented yet.',
    });
  });
});
