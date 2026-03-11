import { createServer } from 'node:http';

import {
  TASKS_CHANGED_EVENT,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from '@auxilius-take-home/types';
import { Server } from 'socket.io';

import { createApp } from './app';
import type { TaskRepository } from './tasks/task-repository';

interface CreateRealtimeServerOptions {
  taskRepository?: TaskRepository;
}

export const createRealtimeServer = (
  options: CreateRealtimeServerOptions = {},
) => {
  const app = createApp({
    ...(options.taskRepository === undefined
      ? {}
      : { taskRepository: options.taskRepository }),
    publishTaskEvent: (event) => {
      io.emit(TASKS_CHANGED_EVENT, event);
    },
  });
  const httpServer = createServer(app);
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);

  return { httpServer, io };
};
