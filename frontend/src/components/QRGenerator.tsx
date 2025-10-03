import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Slider,
  Stack,
  Container,
  IconButton,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Grid,
  ButtonGroup,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  Download,
  Refresh,
  Delete,
  Save,
  QrCode,
  Image as ImageIcon,
  CheckCircle
} from '@mui/icons-material';
import { qrService } from '../services/qr.service';
import { useQRStore } from '../store/qrStore';
import { useAuthStore } from '../store/authStore';
import type { GenerateQRResponse, QRFormData, WiFiData, VCardData, EmailData, SMSData, QRTemplate } from '../types';
import EnhancedLogoUpload from './EnhancedLogoUpload';
import EnhancedQRPreview from './EnhancedQRPreview';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const QRGenerator: React.FC = () => {
  const { addQR, setLoading, isLoading } = useQRStore();
  const { user } = useAuthStore();
  
  // State management
  const [generatedQR, setGeneratedQR] = useState<GenerateQRResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [realTimePreview, setRealTimePreview] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [savedTemplates, setSavedTemplates] = useState<QRTemplate[]>([]);
  const [logoQuality, setLogoQuality] = useState<'standard' | 'high'>('high');
  const [autoErrorCorrection, setAutoErrorCorrection] = useState(true);
  
  // Generation control state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewGenerating, setIsPreviewGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const previewAbortControllerRef = useRef<AbortController | null>(null);
  const lastGenerationRef = useRef<string>('');
  const generationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Content-specific state
  const [wifiData, setWifiData] = useState<WiFiData>({
    ssid: '',
    password: '',
    security: 'WPA',
    hidden: false
  });
  const [vCardData, setVCardData] = useState<VCardData>({
    firstName: '',
    lastName: '',
    organization: '',
    phone: '',
    email: '',
    url: '',
    address: ''
  });
  const [emailData, setEmailData] = useState<EmailData>({
    email: '',
    subject: '',
    body: ''
  });
  const [smsData, setSMSData] = useState<SMSData>({
    phone: '',
    message: ''
  });

  // Form setup with enhanced default values
  const { control, handleSubmit, reset, formState: { errors }, setValue, watch, getValues } = useForm<QRFormData>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      content: '',
      content_type: 'url',
      error_correction: 'M',
      size_px: 512,
      box_size: 10,
      margin: 4,
      fg_color: '#000000',
      bg_color: '#FFFFFF',
      rounded: 0.15,
      logo_size: 20,
      gradient_enabled: false,
      gradient_start: '#000000',
      gradient_end: '#333333',
      gradient_direction: 'horizontal',
      pattern_style: 'square',
      eye_style: 'square',
      data_pattern: 'square',
      // Frame and decorative options
      frame_enabled: false,
      frame_style: 'simple',
      frame_thickness: 8,
      frame_color: '#000000',
      frame_gradient_enabled: false,
      frame_gradient_start: '#000000',
      frame_gradient_end: '#333333',
      frame_gradient_direction: 'horizontal',
      // Advanced styling options
      shadow_enabled: false,
      shadow_blur: 10,
      shadow_offset_x: 4,
      shadow_offset_y: 4,
      shadow_color: 'rgba(0,0,0,0.3)',
      // Pattern overlays
      pattern_overlay_enabled: false,
      pattern_overlay_type: 'dots',
      pattern_overlay_opacity: 0.1,
      pattern_overlay_color: '#000000'
    }
  });

  const watchedValues = watch();
  const contentType = watch('content_type');

  // Content generation helpers
  const generateContentByType = useCallback((type: string, data?: any): string => {
    switch (type) {
      case 'wifi':
        const wifi = data || wifiData;
        if (!wifi.ssid) return '';
        return `WIFI:T:${wifi.security};S:${wifi.ssid};P:${wifi.password};H:${wifi.hidden ? 'true' : 'false'};;`;
      
      case 'vcard':
        const vcard = data || vCardData;
        if (!vcard.firstName && !vcard.lastName) return '';
        let vcardContent = 'BEGIN:VCARD\nVERSION:3.0\n';
        if (vcard.firstName || vcard.lastName) {
          vcardContent += `FN:${vcard.firstName} ${vcard.lastName}\n`;
          vcardContent += `N:${vcard.lastName};${vcard.firstName};;;\n`;
        }
        if (vcard.organization) vcardContent += `ORG:${vcard.organization}\n`;
        if (vcard.phone) vcardContent += `TEL:${vcard.phone}\n`;
        if (vcard.email) vcardContent += `EMAIL:${vcard.email}\n`;
        if (vcard.url) vcardContent += `URL:${vcard.url}\n`;
        if (vcard.address) vcardContent += `ADR:;;${vcard.address};;;;\n`;
        vcardContent += 'END:VCARD';
        return vcardContent;
      
      case 'email':
        const email = data || emailData;
        if (!email.email) return '';
        return `mailto:${email.email}?subject=${encodeURIComponent(email.subject || '')}&body=${encodeURIComponent(email.body || '')}`;
      
      case 'sms':
        const sms = data || smsData;
        if (!sms.phone) return '';
        return `sms:${sms.phone}?body=${encodeURIComponent(sms.message || '')}`;
      
      case 'phone':
        return `tel:${data || ''}`;
      
      default:
        return data || '';
    }
  }, [wifiData, vCardData, emailData, smsData]);

  // Update functions for different content types
  const updateWiFiContent = useCallback((field: keyof WiFiData, value: string | boolean) => {
    const updatedData = { ...wifiData, [field]: value };
    setWifiData(updatedData);
    
    if (realTimePreview) {
      const content = generateContentByType('wifi', updatedData);
      setValue('content', content);
    }
  }, [wifiData, realTimePreview, generateContentByType, setValue]);

  const updateVCardContent = useCallback((field: keyof VCardData, value: string) => {
    const updatedData = { ...vCardData, [field]: value };
    setVCardData(updatedData);
    
    if (realTimePreview) {
      const content = generateContentByType('vcard', updatedData);
      setValue('content', content);
    }
  }, [vCardData, realTimePreview, generateContentByType, setValue]);

  const updateEmailContent = useCallback((field: keyof EmailData, value: string) => {
    const updatedData = { ...emailData, [field]: value };
    setEmailData(updatedData);
    
    if (realTimePreview) {
      const content = generateContentByType('email', updatedData);
      setValue('content', content);
    }
  }, [emailData, realTimePreview, generateContentByType, setValue]);

  const updateSMSContent = useCallback((field: keyof SMSData, value: string) => {
    const updatedData = { ...smsData, [field]: value };
    setSMSData(updatedData);
    
    if (realTimePreview) {
      const content = generateContentByType('sms', updatedData);
      setValue('content', content);
    }
  }, [smsData, realTimePreview, generateContentByType, setValue]);

  // Optimized preview generation
  const generatePreview = useCallback(async () => {
    if (!realTimePreview || !watchedValues.content) return;
    if (isPreviewGenerating || isGenerating || isLoading) return;
    
    if (previewAbortControllerRef.current) {
      previewAbortControllerRef.current.abort();
    }
    
    previewAbortControllerRef.current = new AbortController();
    const signal = previewAbortControllerRef.current.signal;
    
    try {
      setIsPreviewGenerating(true);
      setError(null);
      
      let content = watchedValues.content;
      const contentType = watchedValues.content_type || 'text';
      
      switch (contentType) {
        case 'wifi':
          content = generateContentByType('wifi', wifiData);
          break;
        case 'vcard':
          content = generateContentByType('vcard', vCardData);
          break;
        case 'email':
          content = generateContentByType('email', emailData);
          break;
        case 'sms':
          content = generateContentByType('sms', smsData);
          break;
        case 'phone':
          content = `tel:${watchedValues.content}`;
          break;
      }
      
      if (!content || content.trim() === '') return;
      if (signal.aborted) return;
      
      const result = await qrService.generateQR(
        { ...watchedValues, content }, 
        1,
        false,
        signal
      );
      
      if (signal.aborted) return;
      
      if (result.data_uri) {
        if (previewUrl && previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(result.data_uri);
      }
      
    } catch (err) {
      if (!signal.aborted) {
        console.warn('Preview generation failed:', err);
      }
    } finally {
      setIsPreviewGenerating(false);
      if (previewAbortControllerRef.current) {
        previewAbortControllerRef.current = null;
      }
    }
  }, [
    watchedValues, 
    realTimePreview, 
    isPreviewGenerating, 
    isGenerating, 
    isLoading, 
    generateContentByType, 
    wifiData, 
    vCardData, 
    emailData, 
    smsData,
    previewUrl
  ]);

  // Debounced effect for real-time preview
  useEffect(() => {
    if (realTimePreview && watchedValues.content && watchedValues.content.trim() !== '') {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
      
      previewTimeoutRef.current = setTimeout(generatePreview, 1500);
      
      return () => {
        if (previewTimeoutRef.current) {
          clearTimeout(previewTimeoutRef.current);
        }
      };
    }
  }, [watchedValues, realTimePreview, generatePreview]);

  // Enhanced logo upload handler
  const handleLogoUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, JPEG, WEBP)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo file size must be less than 5MB');
      return;
    }

    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      if (aspectRatio < 0.5 || aspectRatio > 2) {
        setError('For best results, use logos with aspect ratio between 1:2 and 2:1');
        return;
      }
      
      setLogoFile(file);
      setValue('logo', file);
      
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
      setError(null);
      
      if (autoErrorCorrection) {
        const currentEC = watchedValues.error_correction;
        if (currentEC === 'L' || currentEC === 'M') {
          setValue('error_correction', 'Q');
        }
      }
    };
    
    img.onerror = () => {
      setError('Invalid image file. Please try a different image.');
    };
    
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [setValue, watchedValues.error_correction, autoErrorCorrection]);

  const handleLogoRemove = useCallback(() => {
    setLogoFile(null);
    setLogoPreview(null);
    setValue('logo', undefined);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
  }, [logoPreview, setValue]);

  const handleLogoSizeChange = useCallback((size: number) => {
    setValue('logo_size', size);
    
    if (size > 25) {
      setError('Large logos may affect QR code scanning reliability');
    } else {
      setError(null);
    }
  }, [setValue]);

  const handleDeleteTemplate = useCallback((templateId: string) => {
    setSavedTemplates(prev => prev.filter(t => t.id !== templateId));
  }, []);

  const onSubmit: SubmitHandler<QRFormData> = useCallback(async (formData: QRFormData) => {
    if (isGenerating || isLoading) return;
    
    try {
      setIsGenerating(true);
      setError(null);
      setGenerationProgress(0);
      
      const requestId = Date.now().toString();
      lastGenerationRef.current = requestId;
      
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }

      let content = formData.content;
      
      switch (contentType) {
        case 'wifi':
          content = generateContentByType('wifi', wifiData);
          break;
        case 'vcard':
          content = generateContentByType('vcard', vCardData);
          break;
        case 'email':
          content = generateContentByType('email', emailData);
          break;
        case 'sms':
          content = generateContentByType('sms', smsData);
          break;
        case 'phone':
          content = `tel:${formData.content}`;
          break;
      }
      
      if (!content || content.trim() === '') {
        throw new Error('Content is required');
      }

      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Request was cancelled');
      }
      
      setGenerationProgress(50);
      
      const result = await qrService.generateQR(
        { ...formData, content }, 
        1,
        false,
        abortControllerRef.current?.signal
      );

      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Request was cancelled');
      }
      
      setGenerationProgress(80);
      setGeneratedQR(result);
      
      if (result.data_uri) {
        setPreviewUrl(result.data_uri);
      }
      
      console.log(`✅ QR Code generated successfully (ID: ${result.id})`);
      
      if (user && result.id) {
        addQR({
          id: result.id,
          content,
          created_at: new Date().toISOString(),
          user_id: user.id,
          download_url: result.download_url,
          content_type: contentType
        });
      }
      
      generationTimeoutRef.current = setTimeout(() => {
        setGenerationProgress(0);
        if (lastGenerationRef.current === requestId) {
          lastGenerationRef.current = '';
        }
      }, 1000);

    } catch (error: any) {
      console.error('❌ QR generation failed:', error);
      if (error.name !== 'AbortError' && !error.message.includes('cancelled')) {
        setError(error.message || 'Failed to generate QR code');
      }
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [
    isGenerating, 
    isLoading, 
    contentType, 
    generateContentByType, 
    wifiData, 
    vCardData, 
    emailData, 
    smsData,
    user,
    addQR,
    setLoading
  ]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      if (previewAbortControllerRef.current) {
        previewAbortControllerRef.current.abort();
      }
      
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }
      
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
      
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [previewUrl, logoPreview]);

  const handleDownload = useCallback(async (format: 'png' | 'svg' | 'pdf' = 'png') => {
    if (!generatedQR?.id) return;

    try {
      const blob = await qrService.downloadQR(generatedQR.id, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${generatedQR.id}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download QR code');
    }
  }, [generatedQR]);

  const handleSaveTemplate = useCallback(() => {
    const template: QRTemplate = {
      id: Date.now().toString(),
      name: `Template ${savedTemplates.length + 1}`,
      description: 'Custom QR template',
      config: getValues(),
      category: 'personal'
    };
    setSavedTemplates(prev => [...prev, template]);
  }, [savedTemplates.length, getValues]);

  const handleLoadTemplate = useCallback((template: QRTemplate) => {
    Object.entries(template.config).forEach(([key, value]) => {
      setValue(key as keyof QRFormData, value);
    });
  }, [setValue]);

  const resetForm = useCallback(() => {
    console.log('🔄 Resetting form and clearing state...');
    
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setPreviewUrl(null);
    setError(null);
    setIsGenerating(false);
    setGenerationProgress(0);
    setLogoFile(null);
    setLogoPreview(null);
    
    reset({
      content: '',
      content_type: 'url',
      error_correction: 'M',
      size_px: 512,
      box_size: 10,
      margin: 4,
      fg_color: '#000000',
      bg_color: '#FFFFFF',
      rounded: 0.15,
      logo_size: 20,
      gradient_enabled: false,
      gradient_start: '#000000',
      gradient_end: '#333333',
      gradient_direction: 'horizontal',
      pattern_style: 'square',
      eye_style: 'square',
      data_pattern: 'square',
      // Frame and decorative options
      frame_enabled: false,
      frame_style: 'simple',
      frame_thickness: 8,
      frame_color: '#000000',
      frame_gradient_enabled: false,
      frame_gradient_start: '#000000',
      frame_gradient_end: '#333333',
      frame_gradient_direction: 'horizontal',
      // Advanced styling options
      shadow_enabled: false,
      shadow_blur: 10,
      shadow_offset_x: 4,
      shadow_offset_y: 4,
      shadow_color: 'rgba(0,0,0,0.3)',
      // Pattern overlays
      pattern_overlay_enabled: false,
      pattern_overlay_type: 'dots',
      pattern_overlay_opacity: 0.1,
      pattern_overlay_color: '#000000'
    });
    
    setWifiData({
      ssid: '',
      password: '',
      security: 'WPA',
      hidden: false
    });
    
    setVCardData({
      firstName: '',
      lastName: '',
      organization: '',
      phone: '',
      email: '',
      url: '',
      address: ''
    });
    
    setEmailData({
      email: '',
      subject: '',
      body: ''
    });
    
    setSMSData({
      phone: '',
      message: ''
    });
    
    setGeneratedQR(null);
  }, [previewUrl, reset]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4, fontWeight: 'bold' }}>
          Enhanced QR Code Generator
        </Typography>

        {/* Progress indicator */}
        {generationProgress > 0 && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress variant="determinate" value={generationProgress} />
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              Generating QR Code... {generationProgress}%
            </Typography>
          </Box>
        )}

        {/* Error display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Left Panel - Form */}
          <Grid item xs={12} lg={8}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                  <Tab label="Content" />
                  <Tab label="Style" />
                  <Tab label="Logo" />
                  <Tab label="Templates" />
                </Tabs>
              </Box>

              {/* Content Tab */}
              <TabPanel value={activeTab} index={0}>
                <Stack spacing={3}>
                  {/* Content Type Selection */}
                  <Controller
                    name="content_type"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Content Type</InputLabel>
                        <Select {...field} label="Content Type">
                          <MenuItem value="url">URL/Website</MenuItem>
                          <MenuItem value="text">Plain Text</MenuItem>
                          <MenuItem value="wifi">WiFi Network</MenuItem>
                          <MenuItem value="vcard">Contact Card</MenuItem>
                          <MenuItem value="email">Email</MenuItem>
                          <MenuItem value="sms">SMS</MenuItem>
                          <MenuItem value="phone">Phone Number</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />

                  {/* Dynamic Content Fields */}
                  {contentType === 'url' && (
                    <Controller
                      name="content"
                      control={control}
                      rules={{ required: 'URL is required' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Website URL"
                          placeholder="https://example.com"
                          fullWidth
                          error={!!errors.content}
                          helperText={errors.content?.message}
                        />
                      )}
                    />
                  )}

                  {contentType === 'text' && (
                    <Controller
                      name="content"
                      control={control}
                      rules={{ required: 'Text is required' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Text Content"
                          placeholder="Enter your text here"
                          multiline
                          rows={4}
                          fullWidth
                          error={!!errors.content}
                          helperText={errors.content?.message}
                        />
                      )}
                    />
                  )}

                  {contentType === 'phone' && (
                    <Controller
                      name="content"
                      control={control}
                      rules={{ required: 'Phone number is required' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Phone Number"
                          placeholder="+1234567890"
                          fullWidth
                          error={!!errors.content}
                          helperText={errors.content?.message}
                        />
                      )}
                    />
                  )}

                  {/* WiFi Fields */}
                  {contentType === 'wifi' && (
                    <Stack spacing={2}>
                      <TextField
                        label="Network Name (SSID)"
                        value={wifiData.ssid}
                        onChange={(e) => updateWiFiContent('ssid', e.target.value)}
                        fullWidth
                        required
                      />
                      <TextField
                        label="Password"
                        type="password"
                        value={wifiData.password}
                        onChange={(e) => updateWiFiContent('password', e.target.value)}
                        fullWidth
                      />
                      <FormControl fullWidth>
                        <InputLabel>Security Type</InputLabel>
                        <Select
                          value={wifiData.security}
                          onChange={(e) => updateWiFiContent('security', e.target.value)}
                          label="Security Type"
                        >
                          <MenuItem value="WPA">WPA/WPA2</MenuItem>
                          <MenuItem value="WEP">WEP</MenuItem>
                          <MenuItem value="nopass">Open Network</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={wifiData.hidden}
                            onChange={(e) => updateWiFiContent('hidden', e.target.checked)}
                          />
                        }
                        label="Hidden Network"
                      />
                    </Stack>
                  )}

                  {/* vCard Fields */}
                  {contentType === 'vcard' && (
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          label="First Name"
                          value={vCardData.firstName}
                          onChange={(e) => updateVCardContent('firstName', e.target.value)}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Last Name"
                          value={vCardData.lastName}
                          onChange={(e) => updateVCardContent('lastName', e.target.value)}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Organization"
                          value={vCardData.organization}
                          onChange={(e) => updateVCardContent('organization', e.target.value)}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Phone"
                          value={vCardData.phone}
                          onChange={(e) => updateVCardContent('phone', e.target.value)}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Email"
                          type="email"
                          value={vCardData.email}
                          onChange={(e) => updateVCardContent('email', e.target.value)}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Website"
                          value={vCardData.url}
                          onChange={(e) => updateVCardContent('url', e.target.value)}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Address"
                          value={vCardData.address}
                          onChange={(e) => updateVCardContent('address', e.target.value)}
                          multiline
                          rows={2}
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  )}

                  {/* Email Fields */}
                  {contentType === 'email' && (
                    <Stack spacing={2}>
                      <TextField
                        label="Email Address"
                        type="email"
                        value={emailData.email}
                        onChange={(e) => updateEmailContent('email', e.target.value)}
                        fullWidth
                        required
                      />
                      <TextField
                        label="Subject"
                        value={emailData.subject}
                        onChange={(e) => updateEmailContent('subject', e.target.value)}
                        fullWidth
                      />
                      <TextField
                        label="Message Body"
                        value={emailData.body}
                        onChange={(e) => updateEmailContent('body', e.target.value)}
                        multiline
                        rows={4}
                        fullWidth
                      />
                    </Stack>
                  )}

                  {/* SMS Fields */}
                  {contentType === 'sms' && (
                    <Stack spacing={2}>
                      <TextField
                        label="Phone Number"
                        value={smsData.phone}
                        onChange={(e) => updateSMSContent('phone', e.target.value)}
                        fullWidth
                        required
                      />
                      <TextField
                        label="Message"
                        value={smsData.message}
                        onChange={(e) => updateSMSContent('message', e.target.value)}
                        multiline
                        rows={3}
                        fullWidth
                      />
                    </Stack>
                  )}

                  {/* Error Correction */}
                  <Controller
                    name="error_correction"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Error Correction Level</InputLabel>
                        <Select {...field} label="Error Correction Level">
                          <MenuItem value="L">Low (~7%)</MenuItem>
                          <MenuItem value="M">Medium (~15%)</MenuItem>
                          <MenuItem value="Q">Quartile (~25%)</MenuItem>
                          <MenuItem value="H">High (~30%)</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />

                  {/* Real-time Preview Toggle */}
                  <FormControlLabel
                    control={
                      <Switch
                        checked={realTimePreview}
                        onChange={(e) => setRealTimePreview(e.target.checked)}
                      />
                    }
                    label="Real-time Preview (may slow down typing)"
                  />
                </Stack>
              </TabPanel>

              {/* Enhanced Style Tab */}
              <TabPanel value={activeTab} index={1}>
                <Stack spacing={4}>
                  {/* Basic Colors */}
                  <Box>
                    <Typography variant="h6" gutterBottom>Basic Colors</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Controller
                          name="fg_color"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Foreground Color"
                              type="color"
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Controller
                          name="bg_color"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Background Color"
                              type="color"
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Gradient Options */}
                  <Box>
                    <Typography variant="h6" gutterBottom>Gradient Options</Typography>
                    <Stack spacing={2}>
                      <Controller
                        name="gradient_enabled"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={<Switch {...field} checked={field.value} />}
                            label="Enable Gradient"
                          />
                        )}
                      />
                      
                      {watchedValues.gradient_enabled && (
                        <>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Controller
                                name="gradient_start"
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    label="Gradient Start"
                                    type="color"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                  />
                                )}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <Controller
                                name="gradient_end"
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    label="Gradient End"
                                    type="color"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                  />
                                )}
                              />
                            </Grid>
                          </Grid>
                          
                          <Controller
                            name="gradient_direction"
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth>
                                <InputLabel>Gradient Direction</InputLabel>
                                <Select {...field} label="Gradient Direction">
                                  <MenuItem value="horizontal">Horizontal</MenuItem>
                                  <MenuItem value="vertical">Vertical</MenuItem>
                                  <MenuItem value="diagonal">Diagonal</MenuItem>
                                  <MenuItem value="radial">Radial</MenuItem>
                                </Select>
                              </FormControl>
                            )}
                          />
                        </>
                      )}
                    </Stack>
                  </Box>

                  {/* QR Code Patterns */}
                  <Box>
                    <Typography variant="h6" gutterBottom>QR Code Patterns</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Controller
                          name="pattern_style"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel>Pattern Style</InputLabel>
                              <Select {...field} label="Pattern Style">
                                <MenuItem value="square">Square</MenuItem>
                                <MenuItem value="circle">Circle</MenuItem>
                                <MenuItem value="rounded">Rounded</MenuItem>
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <Controller
                          name="eye_style"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel>Eye Style</InputLabel>
                              <Select {...field} label="Eye Style">
                                <MenuItem value="square">Square</MenuItem>
                                <MenuItem value="circle">Circle</MenuItem>
                                <MenuItem value="rounded">Rounded</MenuItem>
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <Controller
                          name="data_pattern"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel>Data Pattern</InputLabel>
                              <Select {...field} label="Data Pattern">
                                <MenuItem value="square">Square</MenuItem>
                                <MenuItem value="circle">Circle</MenuItem>
                                <MenuItem value="diamond">Diamond</MenuItem>
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Size and Rounded Corners */}
                  <Box>
                    <Typography variant="h6" gutterBottom>Size & Shape</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography gutterBottom>Size (pixels)</Typography>
                        <Controller
                          name="size_px"
                          control={control}
                          render={({ field }) => (
                            <Slider
                              {...field}
                              min={128}
                              max={1024}
                              step={32}
                              valueLabelDisplay="on"
                              marks={[
                                { value: 128, label: '128px' },
                                { value: 512, label: '512px' },
                                { value: 1024, label: '1024px' }
                              ]}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography gutterBottom>Rounded Corners</Typography>
                        <Controller
                          name="rounded"
                          control={control}
                          render={({ field }) => (
                            <Slider
                              {...field}
                              min={0}
                              max={0.5}
                              step={0.05}
                              valueLabelDisplay="on"
                              valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Decorative Frames */}
                  <Box>
                    <Typography variant="h6" gutterBottom>Decorative Frames</Typography>
                    <Stack spacing={2}>
                      <Controller
                        name="frame_enabled"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={<Switch {...field} checked={field.value} />}
                            label="Enable Frame"
                          />
                        )}
                      />
                      
                      {watchedValues.frame_enabled && (
                        <>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Controller
                                name="frame_style"
                                control={control}
                                render={({ field }) => (
                                  <FormControl fullWidth>
                                    <InputLabel>Frame Style</InputLabel>
                                    <Select {...field} label="Frame Style">
                                      <MenuItem value="simple">Simple Border</MenuItem>
                                      <MenuItem value="rounded">Rounded Border</MenuItem>
                                      <MenuItem value="shadow">Shadow Frame</MenuItem>
                                      <MenuItem value="double">Double Border</MenuItem>
                                      <MenuItem value="dashed">Dashed Border</MenuItem>
                                      <MenuItem value="dotted">Dotted Border</MenuItem>
                                    </Select>
                                  </FormControl>
                                )}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <Typography gutterBottom>Frame Thickness</Typography>
                              <Controller
                                name="frame_thickness"
                                control={control}
                                render={({ field }) => (
                                  <Slider
                                    {...field}
                                    min={2}
                                    max={20}
                                    step={1}
                                    valueLabelDisplay="on"
                                    valueLabelFormat={(value) => `${value}px`}
                                  />
                                )}
                              />
                            </Grid>
                          </Grid>
                          
                          <Controller
                            name="frame_color"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="Frame Color"
                                type="color"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                              />
                            )}
                          />
                          
                          <Controller
                            name="frame_gradient_enabled"
                            control={control}
                            render={({ field }) => (
                              <FormControlLabel
                                control={<Switch {...field} checked={field.value} />}
                                label="Enable Frame Gradient"
                              />
                            )}
                          />
                          
                          {watchedValues.frame_gradient_enabled && (
                            <>
                              <Grid container spacing={2}>
                                <Grid item xs={6}>
                                  <Controller
                                    name="frame_gradient_start"
                                    control={control}
                                    render={({ field }) => (
                                      <TextField
                                        {...field}
                                        label="Frame Gradient Start"
                                        type="color"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                      />
                                    )}
                                  />
                                </Grid>
                                <Grid item xs={6}>
                                  <Controller
                                    name="frame_gradient_end"
                                    control={control}
                                    render={({ field }) => (
                                      <TextField
                                        {...field}
                                        label="Frame Gradient End"
                                        type="color"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                      />
                                    )}
                                  />
                                </Grid>
                              </Grid>
                              
                              <Controller
                                name="frame_gradient_direction"
                                control={control}
                                render={({ field }) => (
                                  <FormControl fullWidth>
                                    <InputLabel>Frame Gradient Direction</InputLabel>
                                    <Select {...field} label="Frame Gradient Direction">
                                      <MenuItem value="horizontal">Horizontal</MenuItem>
                                      <MenuItem value="vertical">Vertical</MenuItem>
                                      <MenuItem value="diagonal">Diagonal</MenuItem>
                                      <MenuItem value="radial">Radial</MenuItem>
                                    </Select>
                                  </FormControl>
                                )}
                              />
                            </>
                          )}
                        </>
                      )}
                    </Stack>
                  </Box>

                  {/* Shadow Effects */}
                  <Box>
                    <Typography variant="h6" gutterBottom>Shadow Effects</Typography>
                    <Stack spacing={2}>
                      <Controller
                        name="shadow_enabled"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={<Switch {...field} checked={field.value} />}
                            label="Enable Shadow"
                          />
                        )}
                      />
                      
                      {watchedValues.shadow_enabled && (
                        <>
                          <Controller
                            name="shadow_color"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="Shadow Color"
                                type="color"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                              />
                            )}
                          />
                          
                          <Grid container spacing={2}>
                            <Grid item xs={4}>
                              <Typography gutterBottom>Shadow Blur</Typography>
                              <Controller
                                name="shadow_blur"
                                control={control}
                                render={({ field }) => (
                                  <Slider
                                    {...field}
                                    min={0}
                                    max={30}
                                    step={1}
                                    valueLabelDisplay="on"
                                    valueLabelFormat={(value) => `${value}px`}
                                  />
                                )}
                              />
                            </Grid>
                            <Grid item xs={4}>
                              <Typography gutterBottom>Horizontal Offset</Typography>
                              <Controller
                                name="shadow_offset_x"
                                control={control}
                                render={({ field }) => (
                                  <Slider
                                    {...field}
                                    min={-20}
                                    max={20}
                                    step={1}
                                    valueLabelDisplay="on"
                                    valueLabelFormat={(value) => `${value}px`}
                                  />
                                )}
                              />
                            </Grid>
                            <Grid item xs={4}>
                              <Typography gutterBottom>Vertical Offset</Typography>
                              <Controller
                                name="shadow_offset_y"
                                control={control}
                                render={({ field }) => (
                                  <Slider
                                    {...field}
                                    min={-20}
                                    max={20}
                                    step={1}
                                    valueLabelDisplay="on"
                                    valueLabelFormat={(value) => `${value}px`}
                                  />
                                )}
                              />
                            </Grid>
                          </Grid>
                        </>
                      )}
                    </Stack>
                  </Box>

                  {/* Pattern Overlays */}
                  <Box>
                    <Typography variant="h6" gutterBottom>Pattern Overlays</Typography>
                    <Stack spacing={2}>
                      <Controller
                        name="pattern_overlay_enabled"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={<Switch {...field} checked={field.value} />}
                            label="Enable Pattern Overlay"
                          />
                        )}
                      />
                      
                      {watchedValues.pattern_overlay_enabled && (
                        <>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Controller
                                name="pattern_overlay_type"
                                control={control}
                                render={({ field }) => (
                                  <FormControl fullWidth>
                                    <InputLabel>Overlay Pattern</InputLabel>
                                    <Select {...field} label="Overlay Pattern">
                                      <MenuItem value="dots">Dots</MenuItem>
                                      <MenuItem value="lines">Lines</MenuItem>
                                      <MenuItem value="grid">Grid</MenuItem>
                                      <MenuItem value="diagonal">Diagonal</MenuItem>
                                      <MenuItem value="waves">Waves</MenuItem>
                                    </Select>
                                  </FormControl>
                                )}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <Controller
                                name="pattern_overlay_color"
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    label="Overlay Color"
                                    type="color"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                  />
                                )}
                              />
                            </Grid>
                          </Grid>
                          
                          <Box>
                            <Typography gutterBottom>Overlay Opacity</Typography>
                            <Controller
                              name="pattern_overlay_opacity"
                              control={control}
                              render={({ field }) => (
                                <Slider
                                  {...field}
                                  min={0.05}
                                  max={0.5}
                                  step={0.05}
                                  valueLabelDisplay="on"
                                  valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                                />
                              )}
                            />
                          </Box>
                        </>
                      )}
                    </Stack>
                  </Box>
                </Stack>
              </TabPanel>

              {/* Logo Tab */}
              <TabPanel value={activeTab} index={2}>
                <Stack spacing={3}>
                  <EnhancedLogoUpload
                    onLogoUpload={handleLogoUpload}
                    onLogoRemove={handleLogoRemove}
                    logoPreview={logoPreview}
                    logoFile={logoFile}
                    logoSize={watchedValues.logo_size || 20}
                    onLogoSizeChange={handleLogoSizeChange}
                  />

                  {logoFile && (
                    <>
                      <Box>
                        <Typography gutterBottom>Logo Size (%)</Typography>
                        <Controller
                          name="logo_size"
                          control={control}
                          render={({ field }) => (
                            <Slider
                              {...field}
                              min={5}
                              max={30}
                              step={1}
                              valueLabelDisplay="on"
                              onChange={(_, value) => handleLogoSizeChange(value as number)}
                              marks={[
                                { value: 10, label: '10%' },
                                { value: 20, label: '20%' },
                                { value: 30, label: '30%' }
                              ]}
                            />
                          )}
                        />
                      </Box>

                      <FormControlLabel
                        control={
                          <Switch
                            checked={autoErrorCorrection}
                            onChange={(e) => setAutoErrorCorrection(e.target.checked)}
                          />
                        }
                        label="Auto-adjust error correction for logo compatibility"
                      />

                      <FormControl fullWidth>
                        <InputLabel>Logo Quality</InputLabel>
                        <Select
                          value={logoQuality}
                          onChange={(e) => setLogoQuality(e.target.value as 'standard' | 'high')}
                          label="Logo Quality"
                        >
                          <MenuItem value="standard">Standard Quality</MenuItem>
                          <MenuItem value="high">High Quality (slower)</MenuItem>
                        </Select>
                      </FormControl>
                    </>
                  )}
                </Stack>
              </TabPanel>

              {/* Templates Tab */}
              <TabPanel value={activeTab} index={3}>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="h6" gutterBottom>Save Current Settings</Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Save />}
                      onClick={handleSaveTemplate}
                      fullWidth
                    >
                      Save as Template
                    </Button>
                  </Box>

                  {savedTemplates.length > 0 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>Saved Templates</Typography>
                      <Stack spacing={2}>
                        {savedTemplates.map((template) => (
                          <Paper key={template.id} sx={{ p: 2 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Box>
                                <Typography variant="subtitle1">{template.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {template.description}
                                </Typography>
                              </Box>
                              <Box>
                                <Button
                                  size="small"
                                  onClick={() => handleLoadTemplate(template)}
                                  sx={{ mr: 1 }}
                                >
                                  Load
                                </Button>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteTemplate(template.id)}
                                  color="error"
                                >
                                  <Delete />
                                </IconButton>
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </TabPanel>

              {/* Action Buttons */}
              <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={isGenerating ? <CircularProgress size={20} /> : <QrCode />}
                  disabled={isGenerating || isLoading}
                  sx={{ minWidth: 150 }}
                >
                  {isGenerating ? 'Generating...' : 'Generate QR Code'}
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={resetForm}
                  disabled={isGenerating}
                >
                  Reset
                </Button>

                {generatedQR && (
                  <ButtonGroup variant="outlined">
                    <Button
                      startIcon={<Download />}
                      onClick={() => handleDownload('png')}
                    >
                      PNG
                    </Button>
                    <Button onClick={() => handleDownload('svg')}>SVG</Button>
                    <Button onClick={() => handleDownload('pdf')}>PDF</Button>
                  </ButtonGroup>
                )}
              </Box>
            </form>
          </Grid>

          {/* Right Panel - Preview */}
          <Grid item xs={12} lg={4}>
            <Paper elevation={2} sx={{ p: 3, position: 'sticky', top: 20 }}>
              <Typography variant="h6" gutterBottom align="center">
                QR Code Preview
                {isPreviewGenerating && (
                  <CircularProgress size={16} sx={{ ml: 1 }} />
                )}
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 300,
                  border: '2px dashed',
                  borderColor: 'grey.300',
                  borderRadius: 2,
                  mb: 3
                }}
              >
                {previewUrl ? (
                  <EnhancedQRPreview 
                    previewUrl={previewUrl} 
                    formData={watchedValues}
                    isGenerating={isGenerating}
                    isPreviewGenerating={isPreviewGenerating}
                    realTimePreview={realTimePreview}
                    logoFile={logoFile}
                  />
                ) : (
                  <Typography color="text.secondary" align="center">
                    {isGenerating || isPreviewGenerating 
                      ? 'Generating preview...' 
                      : 'QR code will appear here'
                    }
                  </Typography>
                )}
              </Box>

              {/* QR Code Information */}
              {generatedQR && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    QR Code Information
                  </Typography>
                  <Stack spacing={1}>
                    <Chip
                      label={`Size: ${watchedValues.size_px}×${watchedValues.size_px}px`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`Error Correction: ${watchedValues.error_correction}`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`Type: ${contentType.toUpperCase()}`}
                      size="small"
                      variant="outlined"
                    />
                    {logoFile && (
                      <Chip
                        icon={<ImageIcon />}
                        label="Logo Embedded"
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    )}
                    {watchedValues.frame_enabled && (
                      <Chip
                        label="Frame Enabled"
                        size="small"
                        variant="outlined"
                        color="secondary"
                      />
                    )}
                    {generatedQR.id && (
                      <Chip
                        icon={<CheckCircle />}
                        label="Successfully Generated"
                        size="small"
                        color="success"
                      />
                    )}
                  </Stack>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default QRGenerator;