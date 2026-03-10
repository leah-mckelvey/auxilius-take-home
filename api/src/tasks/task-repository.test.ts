import { describe, expect, it, vi } from 'vitest';

import type { DatabaseClient } from '../db/client';
import {
  createPostgresTaskRepository,
  listTasksQuery,
  mapTaskRow,
} from './task-repository';

describe('mapTaskRow', () => {
  it('maps a database row into the API task shape', () => {
    expect(
      mapTaskRow({
        id: 'task-123',
        title: 'Draft architecture',
        description: null,
        status: 'in_progress',
        created_by: 'leah',
        created_at: new Date('2026-03-10T00:00:00.000Z'),
        updated_at: new Date('2026-03-10T01:00:00.000Z'),
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
            created_at: new Date('2026-03-10T00:00:00.000Z'),
            updated_at: new Date('2026-03-10T00:15:00.000Z'),
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
});
