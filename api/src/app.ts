import express from 'express';

import { createDatabaseClient } from './db/client';
import { healthRouter } from './routes/health';
import { createTasksRouter } from './routes/tasks';
import {
  createPostgresTaskRepository,
  type TaskRepository,
} from './tasks/task-repository';

interface CreateAppOptions {
  taskRepository?: TaskRepository;
}

export const createApp = (options: CreateAppOptions = {}) => {
  const app = express();
  const taskRepository =
    options.taskRepository ??
    createPostgresTaskRepository(createDatabaseClient());

  app.use(express.json());
  app.use('/health', healthRouter);
  app.use('/tasks', createTasksRouter({ taskRepository }));

  return app;
};
