import { describe, expect, it } from 'vitest';

import { TASK_STATUSES } from '@auxilius-take-home/types';

describe('the shared types package entrypoint', () => {
  it('exposes runtime values from the built package', () => {
    expect(TASK_STATUSES).toEqual(['todo', 'in_progress', 'done']);
  });
});
