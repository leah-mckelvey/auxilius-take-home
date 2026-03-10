import { describe, expect, it } from 'vitest';

import { parseUpdateTaskInput } from './update-task-input';

describe('parseUpdateTaskInput', () => {
  it('parses a valid partial update payload', () => {
    expect(
      parseUpdateTaskInput({
        title: '  Refine architecture  ',
        description: null,
        status: 'in_progress',
      }),
    ).toEqual({
      success: true,
      data: {
        title: 'Refine architecture',
        description: null,
        status: 'in_progress',
      },
    });
  });

  it('parses a description-only update', () => {
    expect(
      parseUpdateTaskInput({
        description: 'Add more detail.',
      }),
    ).toEqual({
      success: true,
      data: {
        description: 'Add more detail.',
      },
    });
  });

  it('rejects non-object payloads', () => {
    expect(parseUpdateTaskInput('nope')).toEqual({
      success: false,
      message: 'Invalid task payload.',
    });
  });

  it('rejects an empty update payload', () => {
    expect(parseUpdateTaskInput({})).toEqual({
      success: false,
      message: 'At least one of title, description, or status is required.',
    });
  });

  it('rejects an empty title when provided', () => {
    expect(
      parseUpdateTaskInput({
        title: '   ',
      }),
    ).toEqual({
      success: false,
      message: 'Title must be a non-empty string.',
    });
  });

  it('rejects an invalid status', () => {
    expect(
      parseUpdateTaskInput({
        status: 'blocked',
      }),
    ).toEqual({
      success: false,
      message: 'Status must be todo, in_progress, or done.',
    });
  });

  it('rejects a non-string and non-null description', () => {
    expect(
      parseUpdateTaskInput({
        description: 123,
      }),
    ).toEqual({
      success: false,
      message: 'Description must be a string or null.',
    });
  });
});
