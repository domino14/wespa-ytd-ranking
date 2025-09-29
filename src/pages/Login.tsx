import { useState, useEffect } from 'react';
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
  Group,
} from '@mantine/core';
import { supabase } from '../lib/supabase';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const navigate = useNavigate();

  // Handle password recovery
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetting(true);
        setError('');
        setSuccess('');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccess('Password updated successfully! You can now login.');
      setIsResetting(false);
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/login`
      });

      if (error) throw error;

      setSuccess('Password reset email sent! Check your inbox.');
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

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
          {isResetting ? 'Reset Your Password' : 'WESPA YTD Admin Login'}
        </Title>


      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {isResetting ? (
          <form onSubmit={handlePasswordReset}>
            <Stack>
              {error && (
                <Alert color="red" variant="light">
                  {error}
                </Alert>
              )}

              {success && (
                <Alert color="green" variant="light">
                  {success}
                </Alert>
              )}

              <PasswordInput
                label="New Password"
                placeholder="Enter new password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.currentTarget.value)}
                description="Minimum 6 characters"
              />

              <PasswordInput
                label="Confirm New Password"
                placeholder="Confirm new password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.currentTarget.value)}
              />

              <Button type="submit" fullWidth loading={loading}>
                Update Password
              </Button>

              <Button
                variant="subtle"
                fullWidth
                onClick={() => setIsResetting(false)}
                disabled={loading}
              >
                Back to Login
              </Button>
            </Stack>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <Stack>
              {error && (
                <Alert color="red" variant="light">
                  {error}
                </Alert>
              )}

              {success && (
                <Alert color="green" variant="light">
                  {success}
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

              <Button
                variant="subtle"
                fullWidth
                onClick={() => setShowForgotPassword(true)}
                disabled={loading}
              >
                Forgot Password?
              </Button>
            </Stack>
          </form>
        )}

        {showForgotPassword && !isResetting && (
          <Paper withBorder p="md" mt="md" style={{ backgroundColor: '#f8f9fa' }}>
            <form onSubmit={handleForgotPassword}>
              <Stack>
                <TextInput
                  label="Email Address"
                  placeholder="Enter your email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.currentTarget.value)}
                  description="We'll send you a password reset link"
                />

                <Group justify="flex-end">
                  <Button
                    variant="subtle"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail('');
                      setError('');
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={loading}>
                    Send Reset Link
                  </Button>
                </Group>
              </Stack>
            </form>
          </Paper>
        )}
      </Paper>
      </Container>
    </div>
  );
}