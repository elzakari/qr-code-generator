import React from 'react';
import { Snackbar, Alert, AlertTitle, Slide } from '@mui/material';
import type { SlideProps } from '@mui/material';
import { useNotification } from '../components/common/NotificationProvider';

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

const NotificationSystem = () => {
  const { showNotification } = useNotification();

  // This component is no longer needed since the NotificationProvider
  // handles rendering notifications directly
  return null;
};

export default NotificationSystem;