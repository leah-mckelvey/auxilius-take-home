import {
  TASK_STATUSES,
  type CreateTaskRecord,
  type TaskStatus,
} from './task-repository';

export interface CreateTaskInput {
  title: string;
  description: string | null;
  status: TaskStatus;
  createdBy: string;
}

type ParseCreateTaskInputResult =
  | { success: true; data: CreateTaskInput }
  | { success: false; message: string };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isTaskStatus = (value: unknown): value is TaskStatus =>
  typeof value === 'string' && TASK_STATUSES.includes(value as TaskStatus);

export const parseCreateTaskInput = (
  value: unknown,
): ParseCreateTaskInputResult => {
  if (!isObject(value)) {
    return { success: false, message: 'Invalid task payload.' };
  }

  if (!isNonEmptyString(value.title)) {
    return { success: false, message: 'Title is required.' };
  }

  if (!isTaskStatus(value.status)) {
    return {
      success: false,
      message: 'Status must be todo, in_progress, or done.',
    };
  }

  if (!isNonEmptyString(value.createdBy)) {
    return { success: false, message: 'createdBy is required.' };
  }

  if (
    value.description !== undefined &&
    typeof value.description !== 'string'
  ) {
    return { success: false, message: 'Description must be a string.' };
  }

  return {
    success: true,
    data: {
      title: value.title.trim(),
      description: value.description ?? null,
      status: value.status,
      createdBy: value.createdBy.trim(),
    },
  };
};

export const toCreateTaskRecord = (
  input: CreateTaskInput,
  id: string,
): CreateTaskRecord => ({
  id,
  title: input.title,
  description: input.description,
  status: input.status,
  createdBy: input.createdBy,
});
