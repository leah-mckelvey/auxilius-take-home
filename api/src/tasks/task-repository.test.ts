import { describe, expect, it, vi } from 'vitest';

import type { DatabaseClient } from '../db/client';
import {
  createTaskQuery,
  createPostgresTaskRepository,
  listTasksQuery,
  mapTaskRow,
} from './task-repository';

describe('mapTaskRow', () => {
  it('maps string-backed database timestamps into ISO API fields', () => {
    expect(
      mapTaskRow({
        id: 'task-123',
        title: 'Draft architecture',
        description: null,
        status: 'in_progress',
        created_by: 'leah',
        created_at: '2026-03-10T00:00:00.000Z',
        updated_at: '2026-03-10T01:00:00.000Z',
      }),
    ).toEqual({
      id: 'task-123',
      title: 'Draft architecture',
      description: null,
      status: 'in_progress',
      createdBy: 'leah',
      createdAt: '2026-03-10T00:00:00.000Z',
      updatedAt: '2026-03-10T01:00:00.000Z',
    });
  });
});

describe('createPostgresTaskRepository', () => {
  it('queries tasks and maps the results', async () => {
    const databaseClient: DatabaseClient = {
      query: vi.fn().mockResolvedValue({
        rows: [
          {
            id: 'task-123',
            title: 'Draft architecture',
            description: 'Write down the main constraints.',
            status: 'todo',
            created_by: 'leah',
            created_at: '2026-03-10T00:00:00.000Z',
            updated_at: '2026-03-10T00:15:00.000Z',
          },
        ],
      }),
    };

    const repository = createPostgresTaskRepository(databaseClient);

    await expect(repository.listTasks()).resolves.toEqual([
      {
        id: 'task-123',
        title: 'Draft architecture',
        description: 'Write down the main constraints.',
        status: 'todo',
        createdBy: 'leah',
        createdAt: '2026-03-10T00:00:00.000Z',
        updatedAt: '2026-03-10T00:15:00.000Z',
      },
    ]);
    expect(databaseClient.query).toHaveBeenCalledWith(listTasksQuery);
  });

  it('normalizes timestamp strings with offsets into ISO strings', async () => {
    const databaseClient: DatabaseClient = {
      query: vi.fn().mockResolvedValue({
        rows: [
          {
            id: 'task-456',
            title: 'Review PR',
            description: null,
            status: 'done',
            created_by: 'leah',
            created_at: '2026-03-10T00:00:00-05:00',
            updated_at: '2026-03-10T00:30:00-05:00',
          },
        ],
      }),
    };

    const repository = createPostgresTaskRepository(databaseClient);

    await expect(repository.listTasks()).resolves.toEqual([
      {
        id: 'task-456',
        title: 'Review PR',
        description: null,
        status: 'done',
        createdBy: 'leah',
        createdAt: '2026-03-10T05:00:00.000Z',
        updatedAt: '2026-03-10T05:30:00.000Z',
      },
    ]);
  });

  it('inserts a task and maps the returned row', async () => {
    const databaseClient: DatabaseClient = {
      query: vi.fn().mockResolvedValue({
        rows: [
          {
            id: 'task-123',
            title: 'Draft architecture',
            description: null,
            status: 'todo',
            created_by: 'leah',
            created_at: '2026-03-10T00:00:00.000Z',
            updated_at: '2026-03-10T00:00:00.000Z',
          },
        ],
      }),
    };

    const repository = createPostgresTaskRepository(databaseClient);

    await expect(
      repository.createTask({
        id: 'task-123',
        title: 'Draft architecture',
        description: null,
        status: 'todo',
        createdBy: 'leah',
      }),
    ).resolves.toEqual({
      id: 'task-123',
      title: 'Draft architecture',
      description: null,
      status: 'todo',
      createdBy: 'leah',
      createdAt: '2026-03-10T00:00:00.000Z',
      updatedAt: '2026-03-10T00:00:00.000Z',
    });
    expect(databaseClient.query).toHaveBeenCalledWith(createTaskQuery, [
      'task-123',
      'Draft architecture',
      null,
      'todo',
      'leah',
    ]);
  });

  it('throws when the insert does not return a row', async () => {
    const databaseClient: DatabaseClient = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    };

    const repository = createPostgresTaskRepository(databaseClient);

    await expect(
      repository.createTask({
        id: 'task-123',
        title: 'Draft architecture',
        description: null,
        status: 'todo',
        createdBy: 'leah',
      }),
    ).rejects.toThrow('Failed to create task.');
  });
});
