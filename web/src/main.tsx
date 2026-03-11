import { createRoot } from 'react-dom/client';

import { QueryClientProvider } from '@ts-query/react';

import { App } from './App';
import { createAppQueryClient } from './query-client';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Root element not found.');
}

createRoot(rootElement).render(
  <QueryClientProvider client={createAppQueryClient()}>
    <App />
  </QueryClientProvider>,
);
