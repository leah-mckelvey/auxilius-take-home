import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  readStoredUsername,
  usernameStorageKey,
  writeStoredUsername,
} from './username-storage';

describe('username storage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads and trims the stored username', () => {
    globalThis.localStorage.setItem(usernameStorageKey, '  leah  ');

    expect(readStoredUsername()).toBe('leah');
  });

  it('returns null when reading storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    expect(readStoredUsername()).toBeNull();
  });

  it('swallows write failures so login can continue', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    expect(() => writeStoredUsername('leah')).not.toThrow();
  });
});
