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

export interface UpdateTaskRecord {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
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
  updateTask(
    taskId: string,
    updates: UpdateTaskRecord,
  ): Promise<TaskListItem | null>;
  deleteTask(taskId: string): Promise<boolean>;
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

export const deleteTaskQuery = `
  DELETE FROM tasks
  WHERE id = $1
  RETURNING id;
`;

export const buildUpdateTaskQuery = (
  taskId: string,
  updates: UpdateTaskRecord,
) => {
  const assignments: string[] = [];
  const values: unknown[] = [];

  if (updates.title !== undefined) {
    values.push(updates.title);
    assignments.push(`title = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'description')) {
    values.push(updates.description);
    assignments.push(`description = $${values.length}`);
  }

  if (updates.status !== undefined) {
    values.push(updates.status);
    assignments.push(`status = $${values.length}`);
  }

  if (assignments.length === 0) {
    throw new Error('No task fields to update.');
  }

  values.push(taskId);

  return {
    text: `
      UPDATE tasks
      SET ${assignments.join(', ')}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING id, title, description, status, created_by, created_at, updated_at;
    `,
    values,
  };
};

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
  async updateTask(taskId, updates) {
    const query = buildUpdateTaskQuery(taskId, updates);
    const result = await databaseClient.query<TaskRow>(
      query.text,
      query.values,
    );
    const [row] = result.rows;

    return row === undefined ? null : mapTaskRow(row);
  },
  async deleteTask(taskId) {
    const result = await databaseClient.query<{ id: string }>(deleteTaskQuery, [
      taskId,
    ]);

    return result.rows.length > 0;
  },
});
