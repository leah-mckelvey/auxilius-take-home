import {
  TASK_STATUSES,
  type TaskStatus,
  type UpdateTaskRecord,
} from './task-repository';

type ParseUpdateTaskInputResult =
  | { success: true; data: UpdateTaskRecord }
  | { success: false; message: string };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isTaskStatus = (value: unknown): value is TaskStatus =>
  typeof value === 'string' && TASK_STATUSES.includes(value as TaskStatus);

const hasOwn = (value: object, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

export const parseUpdateTaskInput = (
  value: unknown,
): ParseUpdateTaskInputResult => {
  if (!isObject(value)) {
    return { success: false, message: 'Invalid task payload.' };
  }

  const data: UpdateTaskRecord = {};

  if (hasOwn(value, 'title')) {
    if (!isNonEmptyString(value.title)) {
      return { success: false, message: 'Title must be a non-empty string.' };
    }

    data.title = value.title.trim();
  }

  if (hasOwn(value, 'description')) {
    if (value.description !== null && typeof value.description !== 'string') {
      return {
        success: false,
        message: 'Description must be a string or null.',
      };
    }

    data.description = value.description;
  }

  if (hasOwn(value, 'status')) {
    if (!isTaskStatus(value.status)) {
      return {
        success: false,
        message: 'Status must be todo, in_progress, or done.',
      };
    }

    data.status = value.status;
  }

  if (
    data.title === undefined &&
    data.status === undefined &&
    !hasOwn(data, 'description')
  ) {
    return {
      success: false,
      message: 'At least one of title, description, or status is required.',
    };
  }

  return { success: true, data };
};
