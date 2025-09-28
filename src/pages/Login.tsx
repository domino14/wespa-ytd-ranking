import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Container,
  Stack,
  Alert,
} from '@mantine/core';
import { supabase } from '../lib/supabase';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user has admin access
      const { checkAdminAccess } = await import('../lib/auth');
      const admin = await checkAdminAccess();

      if (!admin) {
        await supabase.auth.signOut();
        throw new Error('Admin access required. Contact your administrator.');
      }

      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100vw',
      height: '100vh'
    }}>
      <Container size={420}>
        <Title ta="center" order={2}>
          WESPA YTD Admin Login
        </Title>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleLogin}>
          <Stack>
            {error && (
              <Alert color="red" variant="light">
                {error}
              </Alert>
            )}

            <TextInput
              label="Email"
              placeholder="admin@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />

            <Button type="submit" fullWidth loading={loading}>
              Sign in
            </Button>
          </Stack>
        </form>
      </Paper>
      </Container>
    </div>
  );
}