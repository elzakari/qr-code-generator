import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Box,
  Button,
  TextField,
  Alert,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Typography,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from './AuthLayout';
import type { AuthFormData } from '../../types/models';

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, clearError } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>();

  const onSubmit = async (data: AuthFormData) => {
    clearError();
    try {
      await login(data.username, data.password);
      
      // Get the return URL from location state or default to dashboard
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      
      // Ensure we don't redirect to login or register pages
      const redirectTo = ['/login', '/register'].includes(from) ? '/dashboard' : from;
      
      navigate(redirectTo, { replace: true });
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  return (
    <AuthLayout 
      title="Sign In" 
      subtitle="Welcome back! Please sign in to your account."
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          {...register('username', {
            required: 'Username is required',
            minLength: {
              value: 3,
              message: 'Username must be at least 3 characters',
            },
          })}
          fullWidth
          label="Username"
          margin="normal"
          autoComplete="username"
          autoFocus
          error={!!errors.username}
          helperText={errors.username?.message}
          disabled={loading}
        />

        <TextField
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters',
            },
          })}
          fullWidth
          label="Password"
          type="password"
          margin="normal"
          autoComplete="current-password"
          error={!!errors.password}
          helperText={errors.password?.message}
          disabled={loading}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              color="primary"
              disabled={loading}
            />
          }
          label="Remember me"
          sx={{ mt: 1, mb: 2 }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          sx={{ mt: 2, mb: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Sign In'}
        </Button>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2">
            Don't have an account?{' '}
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <Typography component="span" color="primary" sx={{ fontWeight: 'medium' }}>
                Sign up
              </Typography>
            </Link>
          </Typography>
        </Box>
      </Box>
    </AuthLayout>
  );
};

export default LoginForm;