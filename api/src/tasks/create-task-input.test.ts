import { describe, expect, it } from 'vitest';

import { parseCreateTaskInput, toCreateTaskRecord } from './create-task-input';

describe('parseCreateTaskInput', () => {
  it('parses a valid create-task payload', () => {
    expect(
      parseCreateTaskInput({
        title: '  Draft architecture  ',
        description: 'Write down the main constraints.',
        status: 'todo',
        createdBy: '  leah  ',
      }),
    ).toEqual({
      success: true,
      data: {
        title: 'Draft architecture',
        description: 'Write down the main constraints.',
        status: 'todo',
        createdBy: 'leah',
      },
    });
  });

  it('defaults description to null when it is omitted', () => {
    expect(
      parseCreateTaskInput({
        title: 'Draft architecture',
        status: 'todo',
        createdBy: 'leah',
      }),
    ).toEqual({
      success: true,
      data: {
        title: 'Draft architecture',
        description: null,
        status: 'todo',
        createdBy: 'leah',
      },
    });
  });

  it('rejects non-object payloads', () => {
    expect(parseCreateTaskInput('nope')).toEqual({
      success: false,
      message: 'Invalid task payload.',
    });
  });

  it('rejects a missing title', () => {
    expect(
      parseCreateTaskInput({
        status: 'todo',
        createdBy: 'leah',
      }),
    ).toEqual({
      success: false,
      message: 'Title is required.',
    });
  });

  it('rejects an invalid status', () => {
    expect(
      parseCreateTaskInput({
        title: 'Draft architecture',
        status: 'blocked',
        createdBy: 'leah',
      }),
    ).toEqual({
      success: false,
      message: 'Status must be todo, in_progress, or done.',
    });
  });

  it('rejects a missing createdBy value', () => {
    expect(
      parseCreateTaskInput({
        title: 'Draft architecture',
        status: 'todo',
        createdBy: '   ',
      }),
    ).toEqual({
      success: false,
      message: 'createdBy is required.',
    });
  });

  it('rejects a non-string description', () => {
    expect(
      parseCreateTaskInput({
        title: 'Draft architecture',
        description: 123,
        status: 'todo',
        createdBy: 'leah',
      }),
    ).toEqual({
      success: false,
      message: 'Description must be a string.',
    });
  });
});

describe('toCreateTaskRecord', () => {
  it('adds the generated id to a validated task payload', () => {
    expect(
      toCreateTaskRecord(
        {
          title: 'Draft architecture',
          description: null,
          status: 'todo',
          createdBy: 'leah',
        },
        'task-123',
      ),
    ).toEqual({
      id: 'task-123',
      title: 'Draft architecture',
      description: null,
      status: 'todo',
      createdBy: 'leah',
    });
  });
});
