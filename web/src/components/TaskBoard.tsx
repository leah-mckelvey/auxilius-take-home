import { useEffect, useMemo, useState } from 'react';

import {
  TASKS_CHANGED_EVENT,
  type Task,
  type TaskChangeEvent,
  type TaskStatus,
} from '@auxilius-take-home/types';
import { useQuery } from '@ts-query/react';
import { Box, Heading, Stack, Text } from '@ts-query/ui-react';
import { io } from 'socket.io-client';

import { fetchTasks, TASKS_QUERY_KEY } from '../api/tasks';
import { CreateTaskForm } from './CreateTaskForm';
import { boardGridStyle, surfaceStyle } from './task-board-styles';
import { TaskColumn } from './TaskColumn';

const boardColumns: ReadonlyArray<{ title: string; status: TaskStatus }> = [
  { title: 'To Do', status: 'todo' },
  { title: 'In Progress', status: 'in_progress' },
  { title: 'Done', status: 'done' },
];

const toFeedbackMessage = (event: TaskChangeEvent) =>
  `Real-time sync received: task ${event.type}.`;

interface TaskDeltaState {
  deletedTaskIds: Record<string, true>;
  upsertedTasks: Record<string, Task>;
}

const emptyTaskDeltaState = (): TaskDeltaState => ({
  deletedTaskIds: {},
  upsertedTasks: {},
});

const applyTaskChange = (
  taskDeltaState: TaskDeltaState,
  event: TaskChangeEvent,
): TaskDeltaState => {
  switch (event.type) {
    case 'created':
    case 'updated': {
      const remainingDeletedTaskIds = { ...taskDeltaState.deletedTaskIds };

      delete remainingDeletedTaskIds[event.task.id];

      return {
        deletedTaskIds: remainingDeletedTaskIds,
        upsertedTasks: {
          ...taskDeltaState.upsertedTasks,
          [event.task.id]: event.task,
        },
      };
    }
    case 'deleted': {
      const remainingUpsertedTasks = { ...taskDeltaState.upsertedTasks };

      delete remainingUpsertedTasks[event.taskId];

      return {
        deletedTaskIds: {
          ...taskDeltaState.deletedTaskIds,
          [event.taskId]: true,
        },
        upsertedTasks: remainingUpsertedTasks,
      };
    }
  }
};

const mergeTasks = (
  baseTasks: Task[],
  taskDeltaState: TaskDeltaState,
): Task[] => {
  const mergedBaseTasks = baseTasks
    .filter((task) => taskDeltaState.deletedTaskIds[task.id] !== true)
    .map((task) => taskDeltaState.upsertedTasks[task.id] ?? task);
  const mergedBaseTaskIds = new Set(mergedBaseTasks.map((task) => task.id));
  const addedTasks = Object.values(taskDeltaState.upsertedTasks).filter(
    (task) => mergedBaseTaskIds.has(task.id) === false,
  );

  return [...addedTasks, ...mergedBaseTasks];
};

interface TaskBoardProps {
  username: string;
}

export const TaskBoard = ({ username }: TaskBoardProps) => {
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [taskDeltaState, setTaskDeltaState] =
    useState<TaskDeltaState>(emptyTaskDeltaState);
  const tasksState = useQuery<Task[], Error>({
    queryKey: TASKS_QUERY_KEY,
    queryFn: fetchTasks,
    retry: 0,
  });
  const tasks = useMemo(
    () => mergeTasks(tasksState.data ?? [], taskDeltaState),
    [taskDeltaState, tasksState.data],
  );

  useEffect(() => {
    const socket = io();
    const handleTasksChanged = (event: TaskChangeEvent) => {
      setFeedbackMessage(toFeedbackMessage(event));
      setTaskDeltaState((currentTaskDeltaState) =>
        applyTaskChange(currentTaskDeltaState, event),
      );
    };

    socket.on(TASKS_CHANGED_EVENT, handleTasksChanged);

    return () => {
      socket.off(TASKS_CHANGED_EVENT, handleTasksChanged);
      socket.disconnect();
    };
  }, []);

  const groupedTasks = useMemo(
    () =>
      boardColumns.map((column) => ({
        ...column,
        tasks: tasks.filter((task) => task.status === column.status),
      })),
    [tasks],
  );

  const loadErrorMessage = tasksState.error?.message ?? 'Failed to load tasks.';

  return (
    <Box p={6} style={surfaceStyle}>
      <Stack gap={6}>
        <Stack gap={2}>
          <Heading level={1}>Auxilius Task Board</Heading>
          <Text>Signed in as {username}</Text>
          {feedbackMessage ? (
            <Text role="status" color="#2b6cb0">
              {feedbackMessage}
            </Text>
          ) : null}
          {tasksState.isFetching && tasks.length > 0 ? (
            <Text role="status" color="#4a5568">
              Syncing tasks…
            </Text>
          ) : null}
        </Stack>

        <CreateTaskForm
          username={username}
          onFeedback={setFeedbackMessage}
          onTaskCreated={(task) => {
            setTaskDeltaState((currentTaskDeltaState) =>
              applyTaskChange(currentTaskDeltaState, {
                type: 'created',
                task,
              }),
            );
          }}
        />

        {tasksState.isLoading && tasks.length === 0 ? (
          <Text role="status">Loading tasks…</Text>
        ) : null}
        {tasksState.isError && tasks.length === 0 ? (
          <Text role="alert" color="#c53030">
            {loadErrorMessage}
          </Text>
        ) : null}

        <div style={boardGridStyle}>
          {groupedTasks.map((column) => (
            <TaskColumn
              key={column.status}
              title={column.title}
              tasks={column.tasks}
              onFeedback={setFeedbackMessage}
              onTaskUpdated={(task) => {
                setTaskDeltaState((currentTaskDeltaState) =>
                  applyTaskChange(currentTaskDeltaState, {
                    type: 'updated',
                    task,
                  }),
                );
              }}
              onTaskDeleted={(taskId) => {
                setTaskDeltaState((currentTaskDeltaState) =>
                  applyTaskChange(currentTaskDeltaState, {
                    type: 'deleted',
                    taskId,
                  }),
                );
              }}
            />
          ))}
        </div>
      </Stack>
    </Box>
  );
};
