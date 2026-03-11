import type {
  CreateTaskInput,
  Task,
  UpdateTaskInput,
} from '@auxilius-take-home/types';

const jsonHeaders = { 'Content-Type': 'application/json' };

export const TASKS_QUERY_KEY = ['tasks'] as const;

interface ApiErrorBody {
  message?: string;
}

export interface UpdateTaskRequest {
  taskId: string;
  updates: UpdateTaskInput;
}

const readResponse = async <T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> => {
  if (response.ok) {
    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
  throw new Error(body?.message ?? fallbackMessage);
};

export const fetchTasks = async (): Promise<Task[]> => {
  const response = await fetch('/tasks');

  return readResponse<Task[]>(response, 'Failed to load tasks.');
};

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  const response = await fetch('/tasks', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(input),
  });

  return readResponse<Task>(response, 'Failed to create task.');
};

export const updateTask = async ({
  taskId,
  updates,
}: UpdateTaskRequest): Promise<Task> => {
  const response = await fetch(`/tasks/${taskId}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(updates),
  });

  return readResponse<Task>(response, 'Failed to update task.');
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const response = await fetch(`/tasks/${taskId}`, {
    method: 'DELETE',
  });

  await readResponse<void>(response, 'Failed to delete task.');
};
