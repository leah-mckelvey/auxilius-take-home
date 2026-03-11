import type { Task } from './task.js';

export const TASKS_CHANGED_EVENT = 'tasks:changed' as const;

export type TaskChangeType = 'created' | 'updated' | 'deleted';

export type TaskChangeEvent =
  | {
      type: 'created';
      task: Task;
    }
  | {
      type: 'updated';
      task: Task;
    }
  | {
      type: 'deleted';
      taskId: string;
    };

export interface ServerToClientEvents {
  [TASKS_CHANGED_EVENT]: (event: TaskChangeEvent) => void;
}

export type ClientToServerEvents = Record<string, never>;
