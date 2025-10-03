import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Card,
  CardContent,
  CardActions,
  Divider,
  Switch,
  FormControlLabel,
  Grid,
  Avatar,
  Chip,
  Stack
} from '@mui/material';
import {
  Save,
  Edit,
  AccountCircle,
  Security,
  Palette,
  Download,
  Delete
} from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';
import { useQRStore } from '../store/qrStore';

interface ProfileFormData {
  username: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface SettingsData {
  notifications: boolean;
  darkMode: boolean;
  autoDownload: boolean;
  defaultErrorCorrection: 'L' | 'M' | 'Q' | 'H';
}

const UserProfile: React.FC = () => {
  const { user } = useAuthStore();
  const { recentQRs } = useQRStore();
  const [isEditing, setIsEditing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsData>({
    notifications: true,
    darkMode: false,
    autoDownload: false,
    defaultErrorCorrection: 'M'
  });

  const { control, handleSubmit, reset, formState: { errors }, watch } = useForm<ProfileFormData>({
    defaultValues: {
      username: user?.username || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const newPassword = watch('newPassword');

  // Add the missing handleProfileUpdate function
  const handleProfileUpdate = async (data: ProfileFormData) => {
    try {
      setError(null);
      setSuccess(null);
  
      // Implement actual API call for profile update
      const updateData: any = {
        username: data.username
      };

      // Only include password if it's being changed
      if (data.newPassword) {
        if (data.newPassword !== data.confirmPassword) {
          setError('New passwords do not match');
          return;
        }
        updateData.currentPassword = data.currentPassword;
        updateData.newPassword = data.newPassword;
      }

      // Here you would make the actual API call
      // await authService.updateProfile(updateData);
      
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      
      // Reset password fields
      reset({
        username: data.username,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    }
  };

  const handleSettingsChange = (setting: keyof SettingsData, value: any) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    
    // Here you would save settings to localStorage or API
    localStorage.setItem('userSettings', JSON.stringify({
      ...settings,
      [setting]: value
    }));
  };

  const handleExportData = () => {
    // Export user's QR codes data
    const dataStr = JSON.stringify(recentQRs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'qr-codes-export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        setError(null);
        
        // Implement actual account deletion API call
        const response = await fetch('/api/auth/account', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete account');
        }
        
        // Clear local storage and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete account');
      }
    }
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Alert severity="error">Please log in to access your profile.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        User Profile
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ width: 80, height: 80, mr: 2 }}>
                  <AccountCircle sx={{ fontSize: 60 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5">{user?.username}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Member since {new Date().getFullYear()}
                  </Typography>
                  <Chip
                    label={user?.is_admin ? 'Admin' : 'User'}
                    color={user?.is_admin ? 'primary' : 'default'}
                    size="small"
                  />
                </Box>
              </Box>

              <form onSubmit={handleSubmit(handleProfileUpdate)}>
                <Stack spacing={3}>
                  <Controller
                    name="username"
                    control={control}
                    rules={{ required: 'Username is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Username"
                        disabled={!isEditing}
                        error={!!errors.username}
                        helperText={errors.username?.message}
                        fullWidth
                      />
                    )}
                  />

                  {isEditing && (
                    <>
                      <Divider>
                        <Typography variant="body2" color="text.secondary">
                          Change Password (Optional)
                        </Typography>
                      </Divider>

                      <Controller
                        name="currentPassword"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="password"
                            label="Current Password"
                            error={!!errors.currentPassword}
                            helperText={errors.currentPassword?.message}
                            fullWidth
                          />
                        )}
                      />

                      <Controller
                        name="newPassword"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="password"
                            label="New Password"
                            error={!!errors.newPassword}
                            helperText={errors.newPassword?.message}
                            fullWidth
                          />
                        )}
                      />

                      <Controller
                        name="confirmPassword"
                        control={control}
                        rules={{
                          validate: (value) =>
                            !newPassword || value === newPassword || 'Passwords do not match'
                        }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="password"
                            label="Confirm New Password"
                            error={!!errors.confirmPassword}
                            helperText={errors.confirmPassword?.message}
                            fullWidth
                          />
                        )}
                      />
                    </>
                  )}
                </Stack>
              </form>
            </CardContent>

            <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
              {!isEditing ? (
                <Button
                  variant="contained"
                  startIcon={<Edit />}
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSubmit(handleProfileUpdate)}
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setIsEditing(false);
                      reset();
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </CardActions>
          </Card>
        </Grid>

        {/* Settings Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                Settings
              </Typography>

              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications}
                      onChange={(e) =>
                        setSettings({ ...settings, notifications: e.target.checked })
                      }
                    />
                  }
                  label="Email Notifications"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.darkMode}
                      onChange={(e) =>
                        setSettings({ ...settings, darkMode: e.target.checked })
                      }
                    />
                  }
                  label="Dark Mode"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoDownload}
                      onChange={(e) =>
                        setSettings({ ...settings, autoDownload: e.target.checked })
                      }
                    />
                  }
                  label="Auto Download QR Codes"
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Recent QR Codes */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent QR Codes
              </Typography>
              
              {recentQRs && recentQRs.length > 0 ? (
                <Stack spacing={1}>
                  {recentQRs.slice(0, 5).map((qr: any, index: number) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1
                      }}
                    >
                      <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                        {qr.content || 'QR Code'}
                      </Typography>
                      <Box>
                        <Button size="small" startIcon={<Download />}>
                          Download
                        </Button>
                        <Button size="small" color="error" startIcon={<Delete />}>
                          Delete
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No recent QR codes
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserProfile;