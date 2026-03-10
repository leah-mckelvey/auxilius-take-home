import { Router, type RequestHandler } from 'express';

import type { TaskRepository } from '../tasks/task-repository';

interface CreateTasksRouterOptions {
  taskRepository: TaskRepository;
}

const notImplementedMessage = 'Task endpoints are not implemented yet.';
const listTasksErrorMessage = 'Failed to load tasks.';

export const createTasksRouter = ({
  taskRepository,
}: CreateTasksRouterOptions) => {
  const tasksRouter = Router();

  tasksRouter.get('/', async (_request, response) => {
    try {
      const tasks = await taskRepository.listTasks();

      response.status(200).json(tasks);
    } catch {
      response.status(500).json({ message: listTasksErrorMessage });
    }
  });

  const respondNotImplemented: RequestHandler = (_request, response) => {
    response.status(501).json({ message: notImplementedMessage });
  };

  tasksRouter.post('/', respondNotImplemented);
  tasksRouter.patch('/:taskId', respondNotImplemented);
  tasksRouter.delete('/:taskId', respondNotImplemented);

  return tasksRouter;
};
