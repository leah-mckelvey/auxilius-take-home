import { describe, expect, it, vi } from 'vitest';

import {
  publishTaskEventInBackground,
  type TaskEventPublisher,
} from './task-event-publisher';

describe('publishTaskEventInBackground', () => {
  it('queues task event publication without blocking the caller', async () => {
    const publishTaskEvent = vi.fn<TaskEventPublisher>(
      () => new Promise(() => {}),
    );

    publishTaskEventInBackground(publishTaskEvent, {
      type: 'created',
      task: {
        id: 'task-123',
        title: 'Draft architecture',
        description: null,
        status: 'todo',
        createdBy: 'leah',
        createdAt: '2026-03-10T00:00:00.000Z',
        updatedAt: '2026-03-10T00:00:00.000Z',
      },
    });

    expect(publishTaskEvent).not.toHaveBeenCalled();

    await Promise.resolve();

    expect(publishTaskEvent).toHaveBeenCalledWith({
      type: 'created',
      task: {
        id: 'task-123',
        title: 'Draft architecture',
        description: null,
        status: 'todo',
        createdBy: 'leah',
        createdAt: '2026-03-10T00:00:00.000Z',
        updatedAt: '2026-03-10T00:00:00.000Z',
      },
    });
  });

  it('swallows publisher failures', async () => {
    const publishTaskEvent = vi.fn<TaskEventPublisher>(() => {
      throw new Error('socket unavailable');
    });

    expect(() =>
      publishTaskEventInBackground(publishTaskEvent, {
        type: 'deleted',
        taskId: 'task-123',
      }),
    ).not.toThrow();

    await Promise.resolve();

    expect(publishTaskEvent).toHaveBeenCalledWith({
      type: 'deleted',
      taskId: 'task-123',
    });
  });
});
