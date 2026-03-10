import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  TASK_STATUSES,
  type CreateTaskInput,
  type Task,
  type TaskStatus,
  type UpdateTaskInput,
} from './task';

describe('TASK_STATUSES', () => {
  it('lists the supported board columns', () => {
    expect(TASK_STATUSES).toEqual(['todo', 'in_progress', 'done']);
  });
});

describe('shared task contract types', () => {
  it('keeps task status aligned with the supported status constants', () => {
    expectTypeOf<TaskStatus>().toEqualTypeOf<(typeof TASK_STATUSES)[number]>();
  });

  it('requires an author and status when creating a task', () => {
    expectTypeOf<CreateTaskInput>().toMatchTypeOf<{
      title: string;
      description?: string;
      status: TaskStatus;
      createdBy: string;
    }>();
  });

  it('allows partial updates for editable task fields', () => {
    expectTypeOf<UpdateTaskInput>().toMatchTypeOf<
      Partial<Pick<Task, 'title' | 'description' | 'status'>>
    >();
  });
});
