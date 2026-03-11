export const usernameStorageKey = 'auxilius.username';

export const readStoredUsername = (): string | null => {
  try {
    const storedUsername = globalThis.localStorage?.getItem(usernameStorageKey);
    const trimmedUsername = storedUsername?.trim();

    return trimmedUsername ? trimmedUsername : null;
  } catch {
    return null;
  }
};

export const writeStoredUsername = (username: string) => {
  try {
    globalThis.localStorage?.setItem(usernameStorageKey, username);
  } catch {
    // Storage can be unavailable in some environments; continue without persistence.
  }
};
