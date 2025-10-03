import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack,
  Home,
  QrCode2
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import QRGenerator from './QRGenerator';

const QRGeneratorLayout: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  // Remove unused isMobile variable

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Top App Bar */}
      <AppBar 
        position="sticky" 
        elevation={1}
        sx={{ 
          bgcolor: 'white', 
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          
          <QrCode2 sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            QR Code Generator
          </Typography>
          
          <IconButton onClick={() => navigate('/')}>
            <Home />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ pt: 2 }}>
        <QRGenerator />
      </Box>
    </Box>
  );
};

export default QRGeneratorLayout;