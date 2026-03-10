import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createRequireMock, poolQueryMock, PoolMock, requireMock } = vi.hoisted(
  () => {
    const poolQueryMock = vi.fn();
    const PoolMock = vi.fn(function MockPool() {
      return { query: poolQueryMock };
    });
    const requireMock = vi.fn(() => ({ Pool: PoolMock }));
    const createRequireMock = vi.fn(() => requireMock);

    return { createRequireMock, poolQueryMock, PoolMock, requireMock };
  },
);

vi.mock('node:module', () => ({
  createRequire: createRequireMock,
}));

describe('createDatabaseClient', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.DATABASE_URL;
    poolQueryMock.mockReset();
    poolQueryMock.mockResolvedValue({ rows: [] });
  });

  it('creates a pool without config when DATABASE_URL is not set', async () => {
    const { createDatabaseClient } = await import('./client');

    const databaseClient = createDatabaseClient();

    await databaseClient.query('SELECT 1');

    expect(createRequireMock).toHaveBeenCalledTimes(1);
    expect(requireMock).toHaveBeenCalledWith('pg');
    expect(PoolMock).toHaveBeenCalledWith(undefined);
    expect(poolQueryMock).toHaveBeenCalledWith('SELECT 1');
  });

  it('creates a pool with DATABASE_URL when it is set', async () => {
    process.env.DATABASE_URL = 'postgres://localhost:5432/auxilius';
    const { createDatabaseClient } = await import('./client');

    createDatabaseClient();

    expect(PoolMock).toHaveBeenCalledWith({
      connectionString: 'postgres://localhost:5432/auxilius',
    });
  });
});
