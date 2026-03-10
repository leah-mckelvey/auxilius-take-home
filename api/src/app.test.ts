import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from './app';
import type {
  CreateTaskRecord,
  TaskListItem,
  TaskRepository,
} from './tasks/task-repository';

const buildTaskRepository = (
  overrides: Partial<TaskRepository> = {},
): TaskRepository => ({
  listTasks: vi.fn().mockResolvedValue([] satisfies TaskListItem[]),
  createTask: vi.fn().mockImplementation(async (task: CreateTaskRecord) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    createdBy: task.createdBy,
    createdAt: '2026-03-10T00:00:00.000Z',
    updatedAt: '2026-03-10T00:00:00.000Z',
  })),
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

  it('creates a task from a valid request payload', async () => {
    const createTask = vi.fn().mockResolvedValue({
      id: 'task-123',
      title: 'Draft architecture',
      description: null,
      status: 'todo',
      createdBy: 'leah',
      createdAt: '2026-03-10T00:00:00.000Z',
      updatedAt: '2026-03-10T00:00:00.000Z',
    } satisfies TaskListItem);
    const app = createApp({
      taskRepository: buildTaskRepository({ createTask }),
    });
    const response = await request(app).post('/tasks').send({
      title: '  Draft architecture  ',
      status: 'todo',
      createdBy: '  leah  ',
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: 'task-123',
      title: 'Draft architecture',
      description: null,
      status: 'todo',
      createdBy: 'leah',
      createdAt: '2026-03-10T00:00:00.000Z',
      updatedAt: '2026-03-10T00:00:00.000Z',
    });
    expect(createTask).toHaveBeenCalledWith({
      id: expect.any(String),
      title: 'Draft architecture',
      description: null,
      status: 'todo',
      createdBy: 'leah',
    });
  });

  it('rejects an invalid create-task payload', async () => {
    const createTask = vi.fn();
    const app = createApp({
      taskRepository: buildTaskRepository({ createTask }),
    });
    const response = await request(app).post('/tasks').send({
      title: 'Draft architecture',
      status: 'blocked',
      createdBy: 'leah',
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Status must be todo, in_progress, or done.',
    });
    expect(createTask).not.toHaveBeenCalled();
  });

  it('returns an internal server error when creating a task fails', async () => {
    const app = createApp({
      taskRepository: buildTaskRepository({
        createTask: vi
          .fn()
          .mockRejectedValue(new Error('database unavailable')),
      }),
    });
    const response = await request(app).post('/tasks').send({
      title: 'Draft architecture',
      status: 'todo',
      createdBy: 'leah',
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: 'Failed to create task.',
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
