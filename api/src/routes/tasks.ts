import { Router, type RequestHandler } from 'express';

const tasksRouter = Router();

const respondNotImplemented: RequestHandler = (_request, response) => {
  response
    .status(501)
    .json({ message: 'Task endpoints are not implemented yet.' });
};

tasksRouter.get('/', respondNotImplemented);
tasksRouter.post('/', respondNotImplemented);
tasksRouter.patch('/:taskId', respondNotImplemented);
tasksRouter.delete('/:taskId', respondNotImplemented);

export { tasksRouter };
