import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Breadcrumbs,
  Link,
  Container,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack,
  Home,
  Person
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import UserProfile from './UserProfile';

const UserProfileLayout: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Top App Bar */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          bgcolor: 'background.paper', 
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          
          <Breadcrumbs sx={{ flexGrow: 1 }}>
            <Link 
              underline="hover" 
              color="inherit" 
              onClick={() => navigate('/dashboard')}
              sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Home sx={{ mr: 0.5 }} fontSize="inherit" />
              Dashboard
            </Link>
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              <Person sx={{ mr: 0.5 }} fontSize="inherit" />
              Profile & Settings
            </Typography>
          </Breadcrumbs>
        </Toolbar>
      </AppBar>

      {/* User Profile Content */}
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <UserProfile />
      </Container>
    </Box>
  );
};

export default UserProfileLayout;