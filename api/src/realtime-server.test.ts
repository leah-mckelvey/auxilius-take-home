import type { AddressInfo } from 'node:net';

import {
  TASKS_CHANGED_EVENT,
  type TaskChangeEvent,
} from '@auxilius-take-home/types';
import { io as createSocketClient } from 'socket.io-client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createRealtimeServer } from './realtime-server';
import type {
  CreateTaskRecord,
  TaskListItem,
  TaskRepository,
  UpdateTaskRecord,
} from './tasks/task-repository';

const buildTaskRepository = (): TaskRepository => ({
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
  updateTask: vi.fn<(_: string, __: UpdateTaskRecord) => Promise<null>>(),
  deleteTask: vi.fn().mockResolvedValue(true),
});

describe('createRealtimeServer', () => {
  const servers: Array<ReturnType<typeof createRealtimeServer>> = [];

  afterEach(async () => {
    while (servers.length > 0) {
      await new Promise<void>((resolve) => {
        servers.pop()?.io.close(() => resolve());
      });
    }
  });

  it('serves HTTP routes and emits task events over polling without crashing', async () => {
    const server = createRealtimeServer({
      taskRepository: buildTaskRepository(),
    });
    servers.push(server);
    await new Promise<void>((resolve) => {
      server.httpServer.listen(0, '127.0.0.1', () => resolve());
    });

    const address = server.httpServer.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const socket = createSocketClient(baseUrl, {
      transports: ['polling'],
      forceNew: true,
    });

    try {
      await new Promise<void>((resolve, reject) => {
        socket.once('connect', () => resolve());
        socket.once('connect_error', reject);
      });

      const eventPromise = new Promise<TaskChangeEvent>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timed out waiting for the task change event.'));
        }, 5_000);

        socket.once(TASKS_CHANGED_EVENT, (event) => {
          clearTimeout(timeout);
          resolve(event);
        });
        socket.once('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      const createResponse = await fetch(`${baseUrl}/tasks`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Smoke task',
          description: 'created from the realtime server test',
          status: 'todo',
          createdBy: 'leah',
        }),
      });

      expect(createResponse.status).toBe(201);

      const event = await eventPromise;

      expect(event.type).toBe('created');

      if (event.type !== 'created') {
        throw new Error('Expected a created task event.');
      }

      expect(event.task).toMatchObject({
        id: expect.any(String),
        title: 'Smoke task',
        description: 'created from the realtime server test',
        status: 'todo',
        createdBy: 'leah',
      });

      const healthResponse = await fetch(`${baseUrl}/health`);

      expect(healthResponse.status).toBe(200);
      await expect(healthResponse.json()).resolves.toEqual({ status: 'ok' });
    } finally {
      socket.close();
    }
  });
});
