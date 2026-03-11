import { useEffect, useState } from 'react';

import {
  type Task,
  type TaskStatus,
  type UpdateTaskInput,
} from '@auxilius-take-home/types';
import { useMutation, useQueryClient } from '@ts-query/react';
import { Box, Button, Stack, Text } from '@ts-query/ui-react';

import {
  deleteTask,
  TASKS_QUERY_KEY,
  updateTask,
  type UpdateTaskRequest,
} from '../api/tasks';
import { inputStyle, panelStyle } from './task-board-styles';
import { renderTaskStatusOptions } from './task-status-options';

const normalizeUpdateDescription = (value: string): string | null => {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
};

interface TaskCardProps {
  task: Task;
  onFeedback: (message: string) => void;
}

export const TaskCard = ({ task, onFeedback }: TaskCardProps) => {
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
            {renderTaskStatusOptions()}
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
