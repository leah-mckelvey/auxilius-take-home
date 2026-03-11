import express from 'express';

import { createDatabaseClient } from './db/client';
import { healthRouter } from './routes/health';
import { createTasksRouter } from './routes/tasks';
import type { TaskEventPublisher } from './tasks/task-event-publisher';
import {
  createPostgresTaskRepository,
  type TaskRepository,
} from './tasks/task-repository';

interface CreateAppOptions {
  taskRepository?: TaskRepository;
  publishTaskEvent?: TaskEventPublisher;
}

export const createApp = (options: CreateAppOptions = {}) => {
  const app = express();
  const taskRepository =
    options.taskRepository ??
    createPostgresTaskRepository(createDatabaseClient());

  app.use(express.json());
  app.use('/health', healthRouter);
  app.use(
    '/tasks',
    createTasksRouter(
      options.publishTaskEvent === undefined
        ? { taskRepository }
        : {
            taskRepository,
            publishTaskEvent: options.publishTaskEvent,
          },
    ),
  );

  return app;
};
