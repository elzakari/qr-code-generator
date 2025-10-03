import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Paper,
  Slider,
  FormControlLabel,
  Switch,
  Alert,
  Chip,
  Stack,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Upload,
  Delete,
  CropFree,
  Visibility,
  VisibilityOff,
  Info,
  CheckCircle,
  Warning
} from '@mui/icons-material';

interface EnhancedLogoUploadProps {
  logoFile: File | null;
  logoPreview: string | null;
  logoSize: number;
  onLogoUpload: (file: File) => void;
  onLogoRemove: () => void;
  onLogoSizeChange: (size: number) => void;
  error?: string | null;
}

const EnhancedLogoUpload: React.FC<EnhancedLogoUploadProps> = ({
  logoFile,
  logoPreview,
  logoSize,
  onLogoUpload,
  onLogoRemove,
  onLogoSizeChange,
  error
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, []);

  const handleFileSelection = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing time for better UX
    setTimeout(() => {
      onLogoUpload(file);
      setIsProcessing(false);
    }, 500);
  }, [onLogoUpload]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  }, [handleFileSelection]);

  const getLogoSizeRecommendation = (size: number) => {
    if (size < 10) return { level: 'low', message: 'Logo may be too small to be visible' };
    if (size <= 15) return { level: 'good', message: 'Good size for scanability' };
    if (size <= 25) return { level: 'optimal', message: 'Optimal balance of visibility and scanability' };
    return { level: 'warning', message: 'Large logo may affect QR code scanning' };
  };

  const recommendation = getLogoSizeRecommendation(logoSize);

  return (
    <Stack spacing={3}>
      <Typography variant="h6" gutterBottom>
        Logo Upload
      </Typography>

      {/* Upload Area */}
      <Paper
        elevation={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          p: 3,
          border: '2px dashed #e0e0e0',
          borderRadius: 3, // 24px - upload areas need more prominence
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backgroundColor: 'rgba(0,0,0,0.02)',
          borderColor: isDragOver ? 'primary.main' : error ? 'error.main' : '#e0e0e0',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'rgba(25, 118, 210, 0.04)'
          }
        }}
      >
        {logoPreview && showPreview ? (
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={logoPreview}
              alt="Logo preview"
              style={{
                maxWidth: '100%',
                maxHeight: 120,
                borderRadius: 12 // Preview images - standard rounding
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                display: 'flex',
                gap: 1
              }}
            >
              <Tooltip title="Toggle preview">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPreview(!showPreview);
                  }}
                  sx={{
                    backgroundColor: 'background.paper',
                    boxShadow: 1,
                    '&:hover': { backgroundColor: 'grey.100' }
                  }}
                >
                  {showPreview ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove logo">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLogoRemove();
                  }}
                  sx={{
                    backgroundColor: 'background.paper',
                    boxShadow: 1,
                    '&:hover': { backgroundColor: 'error.light', color: 'error.contrastText' }
                  }}
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ) : (
          <Stack spacing={2} alignItems="center">
            <Upload sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography variant="h6" color="text.secondary">
              {isProcessing ? 'Processing...' : 'Drop your logo here or click to browse'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supports PNG, JPG, SVG • Max 5MB
            </Typography>
            {isProcessing && <LinearProgress sx={{ width: '100%', mt: 2 }} />}
          </Stack>
        )}
      </Paper>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {logoFile && (
        <Stack spacing={2}>
          {/* Logo Size Control */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Logo Size: {logoSize}%
            </Typography>
            <Slider
              value={logoSize}
              onChange={(_, value) => onLogoSizeChange(value as number)}
              min={5}
              max={35}
              step={1}
              marks={[
                { value: 10, label: '10%' },
                { value: 20, label: '20%' },
                { value: 30, label: '30%' }
              ]}
              sx={{
                '& .MuiSlider-thumb': {
                  borderRadius: '50%' // Circular slider thumbs
                }
              }}
            />
          </Box>

          {/* Size Recommendation */}
          <Alert
            severity={
              recommendation.level === 'optimal' ? 'success' :
              recommendation.level === 'good' ? 'info' :
              recommendation.level === 'warning' ? 'warning' : 'error'
            }
            icon={
              recommendation.level === 'optimal' ? <CheckCircle /> :
              recommendation.level === 'warning' ? <Warning /> : <Info />
            }
            sx={{ borderRadius: 2 }}
          >
            {recommendation.message}
          </Alert>

          {/* Logo Info */}
          <Paper sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <Chip
                label={`${logoFile.name}`}
                size="small"
                sx={{ borderRadius: 1.5 }} // Small chips - subtle rounding
              />
              <Chip
                label={`${(logoFile.size / 1024).toFixed(1)} KB`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ borderRadius: 1.5 }}
              />
              <Chip
                label={logoFile.type}
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ borderRadius: 1.5 }}
              />
            </Stack>
          </Paper>
        </Stack>
      )}

      {/* Tips */}
      <Paper sx={{ p: 2, backgroundColor: 'info.light', borderRadius: 2 }}>
        <Typography variant="body2" color="info.contrastText">
          <strong>Tips for best results:</strong><br/>
          • Keep logo size between 15-25% for optimal scanning<br/>
          • PNG format with transparency is recommended<br/>
          • Maximum file size: 5MB
        </Typography>
      </Paper>
    </Stack>
  );
};

export default EnhancedLogoUpload;