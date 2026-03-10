import express from 'express';

import { healthRouter } from './routes/health';
import { tasksRouter } from './routes/tasks';

export const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use('/health', healthRouter);
  app.use('/tasks', tasksRouter);

  return app;
};
