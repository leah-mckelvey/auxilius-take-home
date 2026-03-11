import { useEffect, useMemo, useState, type FormEvent } from 'react';

import {
  TASK_STATUSES,
  TASKS_CHANGED_EVENT,
  type CreateTaskInput,
  type Task,
  type TaskChangeEvent,
  type TaskStatus,
  type UpdateTaskInput,
} from '@auxilius-take-home/types';
import { useMutation, useQuery, useQueryClient } from '@ts-query/react';
import { Box, Button, Heading, Stack, Text } from '@ts-query/ui-react';
import { io } from 'socket.io-client';

import {
  createTask,
  deleteTask,
  fetchTasks,
  TASKS_QUERY_KEY,
  updateTask,
  type UpdateTaskRequest,
} from './task-api';

const usernameStorageKey = 'auxilius.username';
const boardColumns: ReadonlyArray<{ title: string; status: TaskStatus }> = [
  { title: 'To Do', status: 'todo' },
  { title: 'In Progress', status: 'in_progress' },
  { title: 'Done', status: 'done' },
];

const surfaceStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#f7fafc',
  color: '#1a202c',
};

const panelStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #cbd5e0',
  borderRadius: '8px',
  padding: '10px 12px',
  font: 'inherit',
  boxSizing: 'border-box',
};

const readStoredUsername = (): string | null => {
  const storedUsername = globalThis.localStorage?.getItem(usernameStorageKey);
  const trimmedUsername = storedUsername?.trim();

  return trimmedUsername ? trimmedUsername : null;
};

const normalizeCreateDescription = (value: string) => {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const normalizeUpdateDescription = (value: string): string | null => {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
};

const toFeedbackMessage = (event: TaskChangeEvent) =>
  `Real-time sync received: task ${event.type}.`;

const renderStatusOptions = () =>
  TASK_STATUSES.map((status) => (
    <option key={status} value={status}>
      {status.replace('_', ' ')}
    </option>
  ));

interface TaskCardProps {
  task: Task;
  onFeedback: (message: string) => void;
}

const TaskCard = ({ task, onFeedback }: TaskCardProps) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [status, setStatus] = useState<TaskStatus>(task.status);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description ?? '');
    setStatus(task.status);
  }, [task.description, task.status, task.title]);

  const updateTaskMutation = useMutation<Task, UpdateTaskRequest, Error>({
    mutationFn: updateTask,
    onSuccess: () => {
      onFeedback('Task updated.');
      queryClient.invalidateQueries(TASKS_QUERY_KEY);
    },
    onError: (error) => {
      onFeedback(error.message);
    },
  });
  const deleteTaskMutation = useMutation<void, string, Error>({
    mutationFn: deleteTask,
    onSuccess: () => {
      onFeedback('Task deleted.');
      queryClient.invalidateQueries(TASKS_QUERY_KEY);
    },
    onError: (error) => {
      onFeedback(error.message);
    },
  });

  const handleSave = async () => {
    const nextTitle = title.trim();

    if (nextTitle.length === 0) {
      onFeedback('Title must be a non-empty string.');

      return;
    }

    const updates: UpdateTaskInput = {
      title: nextTitle,
      description: normalizeUpdateDescription(description),
      status,
    };

    await updateTaskMutation.mutate({ taskId: task.id, updates }).catch(() => {
      // The hook state already exposes the error; this only prevents unhandled rejections.
    });
  };

  const handleDelete = async () => {
    await deleteTaskMutation.mutate(task.id).catch(() => {
      // The hook state already exposes the error; this only prevents unhandled rejections.
    });
  };

  return (
    <Box
      as="article"
      aria-label={`Task ${task.title}`}
      p={4}
      style={panelStyle}
    >
      <Stack gap={3}>
        <label>
          <Text as="span" fontWeight={600}>
            Title
          </Text>
          <input
            aria-label="Title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
            }}
            style={inputStyle}
          />
        </label>

        <label>
          <Text as="span" fontWeight={600}>
            Description
          </Text>
          <textarea
            aria-label="Description"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
            }}
            rows={3}
            style={inputStyle}
          />
        </label>

        <label>
          <Text as="span" fontWeight={600}>
            Status
          </Text>
          <select
            aria-label="Status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as TaskStatus);
            }}
            style={inputStyle}
          >
            {renderStatusOptions()}
          </select>
        </label>

        <Text color="#4a5568" fontSize="0.875rem">
          Created by {task.createdBy}
        </Text>

        <Stack direction="row" gap={2}>
          <Button
            onClick={handleSave}
            disabled={
              updateTaskMutation.state.isLoading ||
              deleteTaskMutation.state.isLoading
            }
          >
            Save
          </Button>
          <Button
            variant="outline"
            colorScheme="red"
            onClick={handleDelete}
            disabled={
              updateTaskMutation.state.isLoading ||
              deleteTaskMutation.state.isLoading
            }
          >
            Delete
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

interface TaskBoardProps {
  username: string;
}

const TaskBoard = ({ username }: TaskBoardProps) => {
  const queryClient = useQueryClient();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createStatus, setCreateStatus] = useState<TaskStatus>('todo');
  const tasksState = useQuery<Task[], Error>({
    queryKey: TASKS_QUERY_KEY,
    queryFn: fetchTasks,
    retry: 0,
  });
  const createTaskMutation = useMutation<Task, CreateTaskInput, Error>({
    mutationFn: createTask,
    onSuccess: () => {
      setCreateTitle('');
      setCreateDescription('');
      setCreateStatus('todo');
      setFeedbackMessage('Task created.');
      queryClient.invalidateQueries(TASKS_QUERY_KEY);
    },
    onError: (error) => {
      setFeedbackMessage(error.message);
    },
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

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextTitle = createTitle.trim();
    const nextDescription = normalizeCreateDescription(createDescription);

    if (nextTitle.length === 0) {
      setFeedbackMessage('Title is required.');

      return;
    }

    await createTaskMutation
      .mutate({
        title: nextTitle,
        status: createStatus,
        createdBy: username,
        ...(nextDescription === undefined
          ? {}
          : { description: nextDescription }),
      })
      .catch(() => {
        // The hook state already exposes the error; this only prevents unhandled rejections.
      });
  };

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

        <Box p={5} style={panelStyle}>
          <form onSubmit={handleCreateSubmit}>
            <Stack gap={3}>
              <Heading level={2}>Create a task</Heading>
              <label>
                <Text as="span" fontWeight={600}>
                  New task title
                </Text>
                <input
                  aria-label="New task title"
                  value={createTitle}
                  onChange={(event) => {
                    setCreateTitle(event.target.value);
                  }}
                  style={inputStyle}
                />
              </label>

              <label>
                <Text as="span" fontWeight={600}>
                  New task description
                </Text>
                <textarea
                  aria-label="New task description"
                  value={createDescription}
                  onChange={(event) => {
                    setCreateDescription(event.target.value);
                  }}
                  rows={3}
                  style={inputStyle}
                />
              </label>

              <label>
                <Text as="span" fontWeight={600}>
                  New task status
                </Text>
                <select
                  aria-label="New task status"
                  value={createStatus}
                  onChange={(event) => {
                    setCreateStatus(event.target.value as TaskStatus);
                  }}
                  style={inputStyle}
                >
                  {renderStatusOptions()}
                </select>
              </label>

              <Stack direction="row" justify="flex-end">
                <Button
                  type="submit"
                  disabled={createTaskMutation.state.isLoading}
                >
                  Add task
                </Button>
              </Stack>
            </Stack>
          </form>
        </Box>

        {tasksState.isLoading && tasksState.data === undefined ? (
          <Text role="status">Loading tasks…</Text>
        ) : null}
        {tasksState.isError && tasksState.data === undefined ? (
          <Text role="alert" color="#c53030">
            {loadErrorMessage}
          </Text>
        ) : null}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '16px',
            alignItems: 'start',
          }}
        >
          {groupedTasks.map((column) => (
            <Box key={column.status} p={4} style={panelStyle}>
              <Stack gap={3}>
                <Heading level={2}>{column.title}</Heading>
                <Text color="#4a5568">{column.tasks.length} tasks</Text>

                {column.tasks.length === 0 ? (
                  <Text color="#718096">No tasks yet.</Text>
                ) : null}

                <Stack gap={3}>
                  {column.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onFeedback={setFeedbackMessage}
                    />
                  ))}
                </Stack>
              </Stack>
            </Box>
          ))}
        </div>
      </Stack>
    </Box>
  );
};

export const App = () => {
  const storedUsername = readStoredUsername();
  const [username, setUsername] = useState<string | null>(storedUsername);
  const [draftUsername, setDraftUsername] = useState(storedUsername ?? '');

  const handleLoginSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextUsername = draftUsername.trim();

    if (nextUsername.length === 0) {
      return;
    }

    globalThis.localStorage?.setItem(usernameStorageKey, nextUsername);
    setUsername(nextUsername);
  };

  if (username === null) {
    return (
      <Box p={6} style={surfaceStyle}>
        <Box
          p={6}
          style={{ ...panelStyle, maxWidth: '480px', margin: '64px auto' }}
        >
          <form onSubmit={handleLoginSubmit}>
            <Stack gap={4}>
              <Heading level={1}>Choose a username</Heading>
              <Text>
                Pick the name you want the board to use when you create tasks.
              </Text>
              <label>
                <Text as="span" fontWeight={600}>
                  Username
                </Text>
                <input
                  aria-label="Username"
                  value={draftUsername}
                  onChange={(event) => {
                    setDraftUsername(event.target.value);
                  }}
                  style={inputStyle}
                />
              </label>
              <Stack direction="row" justify="flex-end">
                <Button type="submit">Continue</Button>
              </Stack>
            </Stack>
          </form>
        </Box>
      </Box>
    );
  }

  return <TaskBoard username={username} />;
};
