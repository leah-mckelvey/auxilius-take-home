import { randomUUID } from 'node:crypto';

import { Router, type RequestHandler } from 'express';

import {
  parseCreateTaskInput,
  toCreateTaskRecord,
} from '../tasks/create-task-input';
import { parseUpdateTaskInput } from '../tasks/update-task-input';
import type { TaskRepository } from '../tasks/task-repository';

interface CreateTasksRouterOptions {
  taskRepository: TaskRepository;
}

const notImplementedMessage = 'Task endpoints are not implemented yet.';
const listTasksErrorMessage = 'Failed to load tasks.';
const createTaskErrorMessage = 'Failed to create task.';
const updateTaskErrorMessage = 'Failed to update task.';
const taskNotFoundMessage = 'Task not found.';

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

  tasksRouter.post('/', async (request, response) => {
    const parseResult = parseCreateTaskInput(request.body);

    if (!parseResult.success) {
      response.status(400).json({ message: parseResult.message });

      return;
    }

    try {
      const task = await taskRepository.createTask(
        toCreateTaskRecord(parseResult.data, randomUUID()),
      );

      response.status(201).json(task);
    } catch {
      response.status(500).json({ message: createTaskErrorMessage });
    }
  });

  tasksRouter.patch('/:taskId', async (request, response) => {
    const parseResult = parseUpdateTaskInput(request.body);

    if (!parseResult.success) {
      response.status(400).json({ message: parseResult.message });

      return;
    }

    try {
      const task = await taskRepository.updateTask(
        request.params.taskId,
        parseResult.data,
      );

      if (task === null) {
        response.status(404).json({ message: taskNotFoundMessage });

        return;
      }

      response.status(200).json(task);
    } catch {
      response.status(500).json({ message: updateTaskErrorMessage });
    }
  });

  const respondNotImplemented: RequestHandler = (_request, response) => {
    response.status(501).json({ message: notImplementedMessage });
  };

  tasksRouter.delete('/:taskId', respondNotImplemented);

  return tasksRouter;
};
