import type { ProxyOptions } from 'vite';

export const DEFAULT_API_PROXY_TARGET = 'http://localhost:3000';

export const resolveApiProxyTarget = (
  environment: NodeJS.ProcessEnv = process.env,
): string => {
  const configuredTarget = environment.VITE_API_PROXY_TARGET?.trim();

  return configuredTarget && configuredTarget.length > 0
    ? configuredTarget
    : DEFAULT_API_PROXY_TARGET;
};

export const createApiProxyConfig = (
  target: string,
): Record<string, ProxyOptions> => ({
  '/health': {
    target,
    changeOrigin: true,
  },
  '/socket.io': {
    target,
    changeOrigin: true,
    ws: true,
  },
  '/tasks': {
    target,
    changeOrigin: true,
  },
});
