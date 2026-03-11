import { useState, type FormEvent } from 'react';

import {
  type CreateTaskInput,
  type Task,
  type TaskStatus,
} from '@auxilius-take-home/types';
import { useMutation, useQueryClient } from '@ts-query/react';
import { Box, Button, Heading, Stack, Text } from '@ts-query/ui-react';

import { createTask, TASKS_QUERY_KEY } from '../api/tasks';
import { inputStyle, panelStyle } from './task-board-styles';
import { renderTaskStatusOptions } from './task-status-options';

const normalizeCreateDescription = (value: string) => {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

interface CreateTaskFormProps {
  username: string;
  onFeedback: (message: string) => void;
}

export const CreateTaskForm = ({
  username,
  onFeedback,
}: CreateTaskFormProps) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const createTaskMutation = useMutation<Task, CreateTaskInput, Error>({
    mutationFn: createTask,
    onSuccess: () => {
      setTitle('');
      setDescription('');
      setStatus('todo');
      onFeedback('Task created.');
      queryClient.invalidateQueries(TASKS_QUERY_KEY);
    },
    onError: (error) => {
      onFeedback(error.message);
    },
  });

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextTitle = title.trim();
    const nextDescription = normalizeCreateDescription(description);

    if (nextTitle.length === 0) {
      onFeedback('Title is required.');

      return;
    }

    await createTaskMutation
      .mutate({
        title: nextTitle,
        status,
        createdBy: username,
        ...(nextDescription === undefined
          ? {}
          : { description: nextDescription }),
      })
      .catch(() => {
        // The hook state already exposes the error; this only prevents unhandled rejections.
      });
  };

  return (
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
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
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
              New task status
            </Text>
            <select
              aria-label="New task status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as TaskStatus);
              }}
              style={inputStyle}
            >
              {renderTaskStatusOptions()}
            </select>
          </label>

          <Stack direction="row" justify="flex-end">
            <Button type="submit" disabled={createTaskMutation.state.isLoading}>
              Add task
            </Button>
          </Stack>
        </Stack>
      </form>
    </Box>
  );
};
