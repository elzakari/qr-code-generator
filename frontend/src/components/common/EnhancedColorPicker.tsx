import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Popover,
  Grid,
  TextField,
  Tabs,
  Tab,
  Slider,
  Stack,
  Chip,
  Button
} from '@mui/material';
import {
  Palette,
  Gradient,
  ColorLens,
  Refresh,
  Save,
  Delete
} from '@mui/icons-material';

interface ColorPreset {
  name: string;
  colors: string[];
  category: 'business' | 'creative' | 'nature' | 'tech';
}

const colorPresets: ColorPreset[] = [
  { name: 'Professional', colors: ['#1976d2', '#ffffff', '#f5f5f5', '#424242'], category: 'business' },
  { name: 'Ocean', colors: ['#0077be', '#ffffff', '#e3f2fd', '#01579b'], category: 'nature' },
  { name: 'Sunset', colors: ['#ff6b35', '#ffffff', '#fff3e0', '#e65100'], category: 'creative' },
  { name: 'Forest', colors: ['#2e7d32', '#ffffff', '#e8f5e8', '#1b5e20'], category: 'nature' },
  { name: 'Tech', colors: ['#6c5ce7', '#ffffff', '#f8f7ff', '#5f3dc4'], category: 'tech' },
  { name: 'Coral', colors: ['#ff7675', '#ffffff', '#fff5f5', '#d63031'], category: 'creative' },
];

interface EnhancedColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  presets?: boolean;
  gradient?: boolean;
}

const EnhancedColorPicker: React.FC<EnhancedColorPickerProps> = ({
  label,
  value,
  onChange,
  presets = true,
  gradient = false
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleColorSelect = (color: string) => {
    onChange(color);
    handleClose();
  };

  const generateHSLColor = () => {
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const saveCustomColor = () => {
    const color = generateHSLColor();
    if (!customColors.includes(color)) {
      setCustomColors([...customColors, color]);
    }
  };

  const generateRandomColor = () => {
    const randomHue = Math.floor(Math.random() * 360);
    const randomSat = Math.floor(Math.random() * 50) + 50; // 50-100%
    const randomLight = Math.floor(Math.random() * 40) + 30; // 30-70%
    setHue(randomHue);
    setSaturation(randomSat);
    setLightness(randomLight);
    onChange(`hsl(${randomHue}, ${randomSat}%, ${randomLight}%)`);
  };

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Paper
          onClick={handleClick}
          sx={{
            width: 40,
            height: 40,
            backgroundColor: value,
            border: 2,
            borderColor: 'grey.300',
            borderRadius: 2,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }
          }}
        >
          {!value && <ColorLens sx={{ color: 'grey.500' }} />}
        </Paper>
        <TextField
          size="small"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          sx={{ flex: 1 }}
        />
        <IconButton size="small" onClick={generateRandomColor}>
          <Refresh />
        </IconButton>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Paper sx={{ width: 320, p: 2 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
            <Tab label="Presets" />
            <Tab label="Custom" />
            {gradient && <Tab label="Gradient" />}
          </Tabs>

          {activeTab === 0 && presets && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Color Presets
              </Typography>
              {['business', 'creative', 'nature', 'tech'].map((category) => (
                <Box key={category} sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ mb: 1, display: 'block', textTransform: 'capitalize' }}>
                    {category}
                  </Typography>
                  <Grid container spacing={1}>
                    {colorPresets
                      .filter(preset => preset.category === category)
                      .map((preset) => (
                        <Grid item key={preset.name}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Box
                              sx={{
                                display: 'flex',
                                width: 60,
                                height: 30,
                                borderRadius: 1,
                                overflow: 'hidden',
                                cursor: 'pointer',
                                border: 1,
                                borderColor: 'grey.300',
                                mb: 0.5
                              }}
                              onClick={() => handleColorSelect(preset.colors[0])}
                            >
                              {preset.colors.map((color, index) => (
                                <Box
                                  key={index}
                                  sx={{
                                    flex: 1,
                                    backgroundColor: color,
                                    '&:hover': { transform: 'scale(1.1)' }
                                  }}
                                />
                              ))}
                            </Box>
                            <Typography variant="caption">
                              {preset.name}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                  </Grid>
                </Box>
              ))}
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Custom Color
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption">Hue</Typography>
                  <Slider
                    value={hue}
                    onChange={(_, value) => setHue(value as number)}
                    min={0}
                    max={360}
                    sx={{
                      '& .MuiSlider-track': {
                        background: `linear-gradient(to right, 
                          hsl(0, ${saturation}%, ${lightness}%), 
                          hsl(60, ${saturation}%, ${lightness}%), 
                          hsl(120, ${saturation}%, ${lightness}%), 
                          hsl(180, ${saturation}%, ${lightness}%), 
                          hsl(240, ${saturation}%, ${lightness}%), 
                          hsl(300, ${saturation}%, ${lightness}%), 
                          hsl(360, ${saturation}%, ${lightness}%))`
                      }
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption">Saturation</Typography>
                  <Slider
                    value={saturation}
                    onChange={(_, value) => setSaturation(value as number)}
                    min={0}
                    max={100}
                  />
                </Box>
                <Box>
                  <Typography variant="caption">Lightness</Typography>
                  <Slider
                    value={lightness}
                    onChange={(_, value) => setLightness(value as number)}
                    min={0}
                    max={100}
                  />
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    height: 40,
                    backgroundColor: generateHSLColor(),
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'grey.300'
                  }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<Save />}
                    onClick={saveCustomColor}
                  >
                    Save
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleColorSelect(generateHSLColor())}
                  >
                    Use Color
                  </Button>
                </Box>
              </Stack>

              {customColors.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                    Saved Colors
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {customColors.map((color, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: 24,
                          height: 24,
                          backgroundColor: color,
                          borderRadius: 1,
                          cursor: 'pointer',
                          border: 1,
                          borderColor: 'grey.300'
                        }}
                        onClick={() => handleColorSelect(color)}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Paper>
      </Popover>
    </Box>
  );
};

export default EnhancedColorPicker;