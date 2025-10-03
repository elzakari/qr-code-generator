import React from 'react';
import {
  Box,
  Paper,
  Typography,
  ButtonGroup,
  Button,
  Chip,
  Fade,
  Zoom,
  CircularProgress,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  Skeleton
} from '@mui/material';
import {
  Download,
  Share,
  Fullscreen,
  ContentCopy,
  ZoomIn,
  ZoomOut,
  Info
} from '@mui/icons-material';

interface EnhancedQRPreviewProps {
  previewUrl: string | null;
  generatedQR: any;
  isGenerating: boolean;
  isPreviewGenerating: boolean;
  onDownload: (format: 'png' | 'svg' | 'pdf') => void;
  onShare?: () => void;
  onFullscreen?: () => void;
}

const EnhancedQRPreview: React.FC<EnhancedQRPreviewProps> = ({
  previewUrl,
  generatedQR,
  isGenerating,
  isPreviewGenerating,
  onDownload,
  onShare,
  onFullscreen
}) => {
  const [zoom, setZoom] = React.useState(1);
  const [showInfo, setShowInfo] = React.useState(false);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));

  const copyToClipboard = async () => {
    if (generatedQR?.content) {
      await navigator.clipboard.writeText(generatedQR.content);
    }
  };

  if (!previewUrl && !isPreviewGenerating && !isGenerating) {
    return (
      <Card 
        sx={{ 
          minHeight: 400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          border: '2px dashed',
          borderColor: 'grey.300',
          borderRadius: 3
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              mx: 'auto'
            }}
          >
            <Typography variant="h2" sx={{ color: 'white', fontWeight: 'bold' }}>
              QR
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
            Ready to Generate
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Fill in your content and customize the style to create your QR code
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Chip label="URL" size="small" variant="outlined" />
            <Chip label="Text" size="small" variant="outlined" />
            <Chip label="Email" size="small" variant="outlined" />
            <Chip label="WiFi" size="small" variant="outlined" />
            <Chip label="vCard" size="small" variant="outlined" />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ overflow: 'visible' }}>
      <CardContent sx={{ p: 0 }}>
        {/* Header with controls */}
        <Box sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            QR Code Preview
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Zoom Out">
              <IconButton size="small" onClick={handleZoomOut} disabled={zoom <= 0.5}>
                <ZoomOut />
              </IconButton>
            </Tooltip>
            <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'center', alignSelf: 'center' }}>
              {Math.round(zoom * 100)}%
            </Typography>
            <Tooltip title="Zoom In">
              <IconButton size="small" onClick={handleZoomIn} disabled={zoom >= 2}>
                <ZoomIn />
              </IconButton>
            </Tooltip>
            <Tooltip title="Toggle Info">
              <IconButton size="small" onClick={() => setShowInfo(!showInfo)}>
                <Info />
              </IconButton>
            </Tooltip>
            {onFullscreen && (
              <Tooltip title="Fullscreen">
                <IconButton size="small" onClick={onFullscreen}>
                  <Fullscreen />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* QR Code Display */}
        <Box sx={{ 
          position: 'relative',
          minHeight: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          background: 'linear-gradient(45deg, #f8f9fa 25%, transparent 25%), linear-gradient(-45deg, #f8f9fa 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f8f9fa 75%), linear-gradient(-45deg, transparent 75%, #f8f9fa 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }}>
          {(isGenerating || isPreviewGenerating) ? (
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={40} sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                {isGenerating ? 'Generating QR Code...' : 'Creating Preview...'}
              </Typography>
            </Box>
          ) : previewUrl ? (
            <Zoom in={true} timeout={500}>
              <Box
                sx={{
                  transform: `scale(${zoom})`,
                  transition: 'transform 0.2s ease-in-out',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  background: 'white',
                  p: 2
                }}
              >
                <img
                  src={previewUrl}
                  alt="QR Code"
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    display: 'block',
                    borderRadius: 8
                  }}
                />
              </Box>
            </Zoom>
          ) : (
            <Skeleton variant="rectangular" width={200} height={200} sx={{ borderRadius: 2 }} />
          )}
        </Box>

        {/* QR Info Panel */}
        <Fade in={showInfo && generatedQR}>
          <Box sx={{ 
            p: 2, 
            bgcolor: 'grey.50', 
            borderTop: 1, 
            borderColor: 'divider' 
          }}>
            {generatedQR && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Content:
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    fontFamily: 'monospace',
                    bgcolor: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'grey.200',
                    flex: 1
                  }}>
                    {generatedQR.content?.length > 50 
                      ? `${generatedQR.content.substring(0, 50)}...` 
                      : generatedQR.content}
                  </Typography>
                  <Tooltip title="Copy Content">
                    <IconButton size="small" onClick={copyToClipboard}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Type:
                  </Typography>
                  <Chip 
                    label={generatedQR.content_type?.toUpperCase()} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Fade>
      </CardContent>

      {/* Action Buttons */}
      {generatedQR && !isPreviewGenerating && (
        <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
          <ButtonGroup variant="outlined" size="small">
            <Button onClick={() => onDownload('png')} startIcon={<Download />}>
              PNG
            </Button>
            <Button onClick={() => onDownload('svg')} startIcon={<Download />}>
              SVG
            </Button>
            <Button onClick={() => onDownload('pdf')} startIcon={<Download />}>
              PDF
            </Button>
          </ButtonGroup>
          
          {onShare && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Share />}
              onClick={onShare}
            >
              Share
            </Button>
          )}
        </CardActions>
      )}
    </Card>
  );
};

export default EnhancedQRPreview;