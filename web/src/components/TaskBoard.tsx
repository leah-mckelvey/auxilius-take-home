import { useEffect, useMemo, useState } from 'react';

import {
  TASKS_CHANGED_EVENT,
  type Task,
  type TaskChangeEvent,
  type TaskStatus,
} from '@auxilius-take-home/types';
import { useQuery, useQueryClient } from '@ts-query/react';
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

interface TaskBoardProps {
  username: string;
}

export const TaskBoard = ({ username }: TaskBoardProps) => {
  const queryClient = useQueryClient();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const tasksState = useQuery<Task[], Error>({
    queryKey: TASKS_QUERY_KEY,
    queryFn: fetchTasks,
    retry: 0,
  });

  useEffect(() => {
    const socket = io();
    const handleTasksChanged = (event: TaskChangeEvent) => {
      setFeedbackMessage(toFeedbackMessage(event));
      queryClient.invalidateQueries(TASKS_QUERY_KEY);
    };

    socket.on(TASKS_CHANGED_EVENT, handleTasksChanged);

    return () => {
      socket.off(TASKS_CHANGED_EVENT, handleTasksChanged);
      socket.disconnect();
    };
  }, [queryClient]);

  const groupedTasks = useMemo(
    () =>
      boardColumns.map((column) => ({
        ...column,
        tasks: (tasksState.data ?? []).filter(
          (task) => task.status === column.status,
        ),
      })),
    [tasksState.data],
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
          {tasksState.isFetching && tasksState.data ? (
            <Text role="status" color="#4a5568">
              Syncing tasks…
            </Text>
          ) : null}
        </Stack>

        <CreateTaskForm username={username} onFeedback={setFeedbackMessage} />

        {tasksState.isLoading && tasksState.data === undefined ? (
          <Text role="status">Loading tasks…</Text>
        ) : null}
        {tasksState.isError && tasksState.data === undefined ? (
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
            />
          ))}
        </div>
      </Stack>
    </Box>
  );
};
