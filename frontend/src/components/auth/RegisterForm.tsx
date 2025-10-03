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
  LinearProgress,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from './AuthLayout';
import type { RegisterFormData } from '../../types/models';

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register: registerUser, loading, error, clearError } = useAuth();
  const [acceptTerms, setAcceptTerms] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const password = watch('password');

  // Password strength calculation
  const getPasswordStrength = (password: string): number => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    
    // Character variety checks
    if (/[a-z]/.test(password)) strength += 12.5;
    if (/[A-Z]/.test(password)) strength += 12.5;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^A-Za-z0-9]/.test(password)) strength += 12.5;
    
    return Math.min(strength, 100);
  };

  const getPasswordStrengthLabel = (strength: number): string => {
    if (strength < 25) return 'Weak';
    if (strength < 50) return 'Fair';
    if (strength < 75) return 'Good';
    return 'Strong';
  };

  const getPasswordStrengthColor = (strength: number): 'error' | 'warning' | 'info' | 'success' => {
    if (strength < 25) return 'error';
    if (strength < 50) return 'warning';
    if (strength < 75) return 'info';
    return 'success';
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (!acceptTerms) {
      return;
    }

    clearError();
    try {
      // Only send username and password to the API
      await registerUser(data.username, data.password);
      
      // Get the return URL from location state or default to dashboard
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      
      // Ensure we don't redirect to login or register pages
      const redirectTo = ['/login', '/register'].includes(from) ? '/dashboard' : from;
      
      navigate(redirectTo, { replace: true });
    } catch (err) {
      // Error is handled by the auth context
    }
  };

  const passwordStrength = getPasswordStrength(password || '');
  const strengthLabel = getPasswordStrengthLabel(passwordStrength);

  return (
    <AuthLayout title="Create Account">
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          margin="normal"
          required
          fullWidth
          id="username"
          label="Username"
          autoComplete="username"
          autoFocus
          {...register('username', {
            required: 'Username is required',
            minLength: {
              value: 3,
              message: 'Username must be at least 3 characters',
            },
            maxLength: {
              value: 20,
              message: 'Username must be less than 20 characters',
            },
            pattern: {
              value: /^[a-zA-Z0-9_]+$/,
              message: 'Username can only contain letters, numbers, and underscores',
            },
          })}
          error={!!errors.username}
          helperText={errors.username?.message}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          label="Password"
          type="password"
          id="password"
          autoComplete="new-password"
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
            validate: {
              hasUpperCase: (value) =>
                /[A-Z]/.test(value) || 'Password must contain at least one uppercase letter',
              hasLowerCase: (value) =>
                /[a-z]/.test(value) || 'Password must contain at least one lowercase letter',
              hasNumber: (value) =>
                /\d/.test(value) || 'Password must contain at least one number',
              hasSpecialChar: (value) =>
                /[!@#$%^&*(),.?":{}|<>]/.test(value) || 'Password must contain at least one special character',
            },
          })}
          error={!!errors.password}
          helperText={errors.password?.message}
        />

        {password && (
          <Box sx={{ mt: 1, mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Password Strength: {strengthLabel}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={passwordStrength}
              color={getPasswordStrengthColor(passwordStrength)}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}

        <TextField
          margin="normal"
          required
          fullWidth
          label="Confirm Password"
          type="password"
          id="confirmPassword"
          autoComplete="new-password"
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) => value === password || 'Passwords do not match',
          })}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Typography variant="body2">
              I agree to the{' '}
              <Link to="/terms" style={{ textDecoration: 'none' }}>
                <Typography component="span" color="primary">
                  Terms of Service
                </Typography>
              </Link>{' '}
              and{' '}
              <Link to="/privacy" style={{ textDecoration: 'none' }}>
                <Typography component="span" color="primary">
                  Privacy Policy
                </Typography>
              </Link>
            </Typography>
          }
          sx={{ mt: 2, mb: 2 }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading || !acceptTerms}
          sx={{ mt: 2, mb: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Create Account'}
        </Button>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2">
            Already have an account?{' '}
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Typography component="span" color="primary" sx={{ fontWeight: 'medium' }}>
                Sign in here
              </Typography>
            </Link>
          </Typography>
        </Box>
      </Box>
    </AuthLayout>
  );
};

export default RegisterForm;