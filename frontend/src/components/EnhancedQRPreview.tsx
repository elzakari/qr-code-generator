import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { QrCode } from '@mui/icons-material';
import type { QRFormData } from '../types/models';

interface EnhancedQRPreviewProps {
  previewUrl?: string | null;
  generatedQR?: any;
  isGenerating?: boolean;
  isPreviewGenerating?: boolean;
  realTimePreview?: boolean;
  logoFile?: File | null;
  formData: QRFormData;
}

const EnhancedQRPreview: React.FC<EnhancedQRPreviewProps> = ({
  previewUrl,
  generatedQR,
  isGenerating,
  isPreviewGenerating,
  realTimePreview,
  logoFile,
  formData
}) => {
  const getFrameStyles = () => {
    if (!formData.frame_enabled) return {};

    const baseStyles: React.CSSProperties = {
      border: `${formData.frame_thickness}px solid ${formData.frame_color}`,
      padding: formData.frame_thickness * 2,
    };

    // Apply frame gradient if enabled
    if (formData.frame_gradient_enabled) {
      const gradientDirection = {
        horizontal: 'to right',
        vertical: 'to bottom',
        diagonal: 'to bottom right',
        radial: 'radial-gradient(circle,'
      }[formData.frame_gradient_direction];

      if (formData.frame_gradient_direction === 'radial') {
        baseStyles.border = `${formData.frame_thickness}px solid transparent`;
        baseStyles.background = `radial-gradient(circle, ${formData.frame_gradient_start}, ${formData.frame_gradient_end})`;
        baseStyles.backgroundClip = 'padding-box';
      } else {
        baseStyles.borderImage = `linear-gradient(${gradientDirection}, ${formData.frame_gradient_start}, ${formData.frame_gradient_end}) 1`;
      }
    }

    // Apply frame style-specific effects
    switch (formData.frame_style) {
      case 'rounded':
        baseStyles.borderRadius = '24px';
        break;
      case 'shadow':
        baseStyles.boxShadow = `0 8px 32px rgba(0,0,0,0.3)`;
        break;
      case 'neon':
        baseStyles.boxShadow = `0 0 20px ${formData.frame_color}, 0 0 40px ${formData.frame_color}, 0 0 60px ${formData.frame_color}`;
        baseStyles.borderRadius = '12px';
        break;
      case 'vintage':
        baseStyles.borderStyle = 'double';
        baseStyles.borderWidth = `${formData.frame_thickness * 1.5}px`;
        baseStyles.borderRadius = '8px';
        break;
      case 'modern':
        baseStyles.borderRadius = '16px';
        baseStyles.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
        break;
    }

    return baseStyles;
  };

  const getShadowStyles = () => {
    if (!formData.shadow_enabled) return {};

    return {
      filter: `drop-shadow(${formData.shadow_offset_x}px ${formData.shadow_offset_y}px ${formData.shadow_blur}px ${formData.shadow_color})`
    };
  };

  const getPatternOverlayStyles = () => {
    if (!formData.pattern_overlay_enabled) return {};

    const patterns = {
      dots: `radial-gradient(circle, ${formData.pattern_overlay_color} 1px, transparent 1px)`,
      lines: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${formData.pattern_overlay_color} 10px, ${formData.pattern_overlay_color} 11px)`,
      grid: `linear-gradient(${formData.pattern_overlay_color} 1px, transparent 1px), linear-gradient(90deg, ${formData.pattern_overlay_color} 1px, transparent 1px)`,
      waves: `repeating-linear-gradient(0deg, transparent, transparent 8px, ${formData.pattern_overlay_color} 8px, ${formData.pattern_overlay_color} 9px)`,
      hexagon: `radial-gradient(circle, ${formData.pattern_overlay_color} 2px, transparent 2px)`
    };

    const backgroundSizes = {
      dots: '20px 20px',
      lines: '20px 20px',
      grid: '20px 20px',
      waves: '20px 20px',
      hexagon: '30px 30px'
    };

    return {
      position: 'relative' as const,
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: patterns[formData.pattern_overlay_type],
        backgroundSize: backgroundSizes[formData.pattern_overlay_type],
        opacity: formData.pattern_overlay_opacity,
        pointerEvents: 'none',
        borderRadius: 'inherit'
      }
    };
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        minHeight: 320,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundColor: 'rgba(0,0,0,0.02)',
        ...getPatternOverlayStyles()
      }}
    >
      {(previewUrl || generatedQR?.data_uri) ? (
        <Box 
          sx={{ 
            textAlign: 'center',
            ...getShadowStyles()
          }}
        >
          <Box
            component="img"
            src={previewUrl || generatedQR?.data_uri}
            alt="QR Code"
            sx={{
              maxWidth: '100%',
              maxHeight: 280,
              borderRadius: `${formData.rounded * 20}px`,
              ...getFrameStyles()
            }}
          />
          {logoFile && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Logo integrated at {formData.logo_size}% size
            </Typography>
          )}
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
          <QrCode sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
          <Typography variant="body2">
            {isPreviewGenerating ? 'Generating preview...' : 
             realTimePreview ? 'Enter content to see preview' : 
             'Click "Generate QR Code" to create'}
          </Typography>
        </Box>
      )}

      {(isGenerating || isPreviewGenerating) && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255,255,255,0.8)',
            borderRadius: 2,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Typography variant="body2">
            {isGenerating ? 'Generating QR Code...' : 'Updating Preview...'}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default EnhancedQRPreview;