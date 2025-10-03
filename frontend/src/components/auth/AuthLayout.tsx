import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { QrCode } from '@mui/icons-material';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'grey.50',
        backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 3,
          color: 'white',
        }}
      >
        <IconButton
          size="large"
          sx={{ color: 'white', mr: 1 }}
        >
          <QrCode fontSize="large" />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight="bold">
          QR Code Generator
        </Typography>
      </Box>

      {/* Main Content */}
      <Container
        maxWidth="sm"
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: isMobile ? 3 : 4,
            width: '100%',
            maxWidth: 400,
            borderRadius: 2,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" component="h2" gutterBottom fontWeight="medium">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          
          {children}
        </Paper>
      </Container>

      {/* Footer */}
      <Box
        sx={{
          py: 2,
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.8)',
        }}
      >
        <Typography variant="body2">
          © 2024 QR Code Generator. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthLayout;