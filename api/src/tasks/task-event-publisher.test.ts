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
      taskId: 'task-123',
    });

    expect(publishTaskEvent).not.toHaveBeenCalled();

    await Promise.resolve();

    expect(publishTaskEvent).toHaveBeenCalledWith({
      type: 'created',
      taskId: 'task-123',
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
