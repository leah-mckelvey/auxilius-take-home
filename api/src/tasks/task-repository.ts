import type { DatabaseClient } from '../db/client';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface TaskListItem {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TaskRepository {
  listTasks(): Promise<TaskListItem[]>;
}

export const listTasksQuery = `
  SELECT id, title, description, status, created_by, created_at, updated_at
  FROM tasks
  ORDER BY created_at DESC, id DESC;
`;

export const mapTaskRow = (row: TaskRow): TaskListItem => ({
  id: row.id,
  title: row.title,
  description: row.description,
  status: row.status,
  createdBy: row.created_by,
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString(),
});

export const createPostgresTaskRepository = (
  databaseClient: DatabaseClient,
): TaskRepository => ({
  async listTasks() {
    const result = await databaseClient.query<TaskRow>(listTasksQuery);

    return result.rows.map(mapTaskRow);
  },
});
