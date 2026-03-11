export const TASKS_CHANGED_EVENT = 'tasks:changed' as const;

export type TaskChangeType = 'created' | 'updated' | 'deleted';

export interface TaskChangeEvent {
  type: TaskChangeType;
  taskId: string;
}

export interface ServerToClientEvents {
  [TASKS_CHANGED_EVENT]: (event: TaskChangeEvent) => void;
}

export type ClientToServerEvents = Record<string, never>;
