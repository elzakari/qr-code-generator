import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Collapse,
  IconButton,
  Divider,
  Chip,
  Tooltip,
  Fade
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Help,
  Star,
  Lightbulb
} from '@mui/icons-material';

interface EnhancedFormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  premium?: boolean;
  tip?: string;
  icon?: React.ReactNode;
  badge?: string;
}

const EnhancedFormSection: React.FC<EnhancedFormSectionProps> = ({
  title,
  description,
  children,
  collapsible = false,
  defaultExpanded = true,
  premium = false,
  tip,
  icon,
  badge
}) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  return (
    <Paper 
      sx={{ 
        mb: 3, 
        overflow: 'hidden',
        border: 1,
        borderColor: premium ? 'warning.main' : 'grey.200',
        background: premium ? 'linear-gradient(135deg, #fff8e1 0%, #ffffff 100%)' : 'white'
      }}
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: collapsible ? 'pointer' : 'default',
          '&:hover': collapsible ? { bgcolor: 'grey.50' } : {}
        }}
        onClick={collapsible ? () => setExpanded(!expanded) : undefined}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {icon && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: 'primary.main',
              color: 'white'
            }}>
              {icon}
            </Box>
          )}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                {title}
              </Typography>
              {premium && (
                <Chip
                  icon={<Star />}
                  label="Premium"
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}
              {badge && (
                <Chip
                  label={badge}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
            {description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {description}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {tip && (
            <Tooltip title={tip} arrow>
              <IconButton size="small">
                <Help />
              </IconButton>
            </Tooltip>
          )}
          {collapsible && (
            <IconButton size="small">
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </Box>
      </Box>

      <Collapse in={expanded} timeout="auto">
        <Divider />
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
        
        {tip && expanded && (
          <Fade in={expanded}>
            <Box sx={{ 
              p: 2, 
              bgcolor: 'info.light', 
              color: 'info.contrastText',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Lightbulb fontSize="small" />
              <Typography variant="body2">
                <strong>Tip:</strong> {tip}
              </Typography>
            </Box>
          </Fade>
        )}
      </Collapse>
    </Paper>
  );
};

export default EnhancedFormSection;