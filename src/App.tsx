import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';

import { Login } from './pages/Login';
import { Admin } from './pages/Admin';
import { Standings } from './pages/Standings';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <Notifications />
        <Router>
          <Routes>
            <Route path="/" element={<Standings />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App
