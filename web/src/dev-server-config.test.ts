import { describe, expect, it } from 'vitest';

import {
  createApiProxyConfig,
  DEFAULT_API_PROXY_TARGET,
  resolveApiProxyTarget,
} from './dev-server-config';

describe('resolveApiProxyTarget', () => {
  it('falls back to localhost when the env var is missing', () => {
    expect(resolveApiProxyTarget({})).toBe(DEFAULT_API_PROXY_TARGET);
  });

  it('falls back to localhost when the env var is blank', () => {
    expect(resolveApiProxyTarget({ VITE_API_PROXY_TARGET: '   ' })).toBe(
      DEFAULT_API_PROXY_TARGET,
    );
  });

  it('uses the configured proxy target when provided', () => {
    expect(
      resolveApiProxyTarget({ VITE_API_PROXY_TARGET: 'http://api:3000' }),
    ).toBe('http://api:3000');
  });
});

describe('createApiProxyConfig', () => {
  it('creates consistent proxy entries for the API routes and websocket', () => {
    expect(createApiProxyConfig('http://api:3000')).toEqual({
      '/health': {
        target: 'http://api:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://api:3000',
        changeOrigin: true,
        ws: true,
      },
      '/tasks': {
        target: 'http://api:3000',
        changeOrigin: true,
      },
    });
  });
});
