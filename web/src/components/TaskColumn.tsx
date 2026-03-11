import type { Task } from '@auxilius-take-home/types';
import { Box, Heading, Stack, Text } from '@ts-query/ui-react';

import { panelStyle } from './task-board-styles';
import { TaskCard } from './TaskCard';

interface TaskColumnProps {
  title: string;
  tasks: Task[];
  onFeedback: (message: string) => void;
}

export const TaskColumn = ({ title, tasks, onFeedback }: TaskColumnProps) => {
  return (
    <Box p={4} style={panelStyle}>
      <Stack gap={3}>
        <Heading level={2}>{title}</Heading>
        <Text color="#4a5568">{tasks.length} tasks</Text>

        {tasks.length === 0 ? <Text color="#718096">No tasks yet.</Text> : null}

        <Stack gap={3}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onFeedback={onFeedback} />
          ))}
        </Stack>
      </Stack>
    </Box>
  );
};
