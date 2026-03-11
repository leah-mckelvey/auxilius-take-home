import type { TaskChangeEvent } from '@auxilius-take-home/types';

export type TaskEventPublisher = (
  event: TaskChangeEvent,
) => void | Promise<void>;

export const publishTaskEventInBackground = (
  publishTaskEvent: TaskEventPublisher,
  event: TaskChangeEvent,
): void => {
  void Promise.resolve()
    .then(() => publishTaskEvent(event))
    .catch(() => {
      // Real-time fanout failures should not undo a successful write.
    });
};
