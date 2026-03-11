import { useState, type FormEvent } from 'react';

import { Box, Button, Heading, Stack, Text } from '@ts-query/ui-react';

import {
  centeredPanelStyle,
  inputStyle,
  surfaceStyle,
} from './task-board-styles';

interface LoginFormProps {
  onLogin: (username: string) => void;
}

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [draftUsername, setDraftUsername] = useState('');

  const handleLoginSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextUsername = draftUsername.trim();

    if (nextUsername.length === 0) {
      return;
    }

    onLogin(nextUsername);
  };

  return (
    <Box p={6} style={surfaceStyle}>
      <Box p={6} style={centeredPanelStyle}>
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
};
