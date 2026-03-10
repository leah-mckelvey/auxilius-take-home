import type { DatabaseClient } from '../db/client';

export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface TaskListItem {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRecord {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdBy: string;
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
  createTask(task: CreateTaskRecord): Promise<TaskListItem>;
}

export const listTasksQuery = `
  SELECT id, title, description, status, created_by, created_at, updated_at
  FROM tasks
  ORDER BY created_at DESC, id DESC;
`;

export const createTaskQuery = `
  INSERT INTO tasks (id, title, description, status, created_by)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING id, title, description, status, created_by, created_at, updated_at;
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
  async createTask(task) {
    const result = await databaseClient.query<TaskRow>(createTaskQuery, [
      task.id,
      task.title,
      task.description,
      task.status,
      task.createdBy,
    ]);
    const [row] = result.rows;

    if (row === undefined) {
      throw new Error('Failed to create task.');
    }

    return mapTaskRow(row);
  },
});
