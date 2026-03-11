import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

import {
  createApiProxyConfig,
  resolveApiProxyTarget,
} from './src/dev-server-config';

const repoRootUrl = new URL('..', import.meta.url);
const repoRoot = fileURLToPath(repoRootUrl);
const resolveFromRepoRoot = (relativePath: string) =>
  fileURLToPath(new URL(relativePath, repoRootUrl));
const apiProxyTarget = resolveApiProxyTarget();

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@auxilius-take-home/types': resolveFromRepoRoot('types/src/index.ts'),
      '@ts-query/core': resolveFromRepoRoot(
        'vendor/ts-query/packages/core/src/index.ts',
      ),
      '@ts-query/react': resolveFromRepoRoot(
        'vendor/ts-query/packages/react/src/index.ts',
      ),
      '@ts-query/ui-react': resolveFromRepoRoot(
        'vendor/ts-query/packages/ui-react/src/index.ts',
      ),
    },
  },
  server: {
    fs: {
      allow: [repoRoot],
    },
    proxy: createApiProxyConfig(apiProxyTarget),
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
