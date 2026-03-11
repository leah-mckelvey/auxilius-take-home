import { useState } from 'react';

import {
  readStoredUsername,
  writeStoredUsername,
} from './auth/username-storage';
import { LoginForm } from './components/LoginForm';
import { TaskBoard } from './components/TaskBoard';

export const App = () => {
  const [username, setUsername] = useState<string | null>(() =>
    readStoredUsername(),
  );

  const handleLogin = (nextUsername: string) => {
    writeStoredUsername(nextUsername);
    setUsername(nextUsername);
  };

  if (username === null) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return <TaskBoard username={username} />;
};
