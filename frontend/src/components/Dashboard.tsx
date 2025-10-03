import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  IconButton,
  Menu,
  MenuItem,
  Grid,
  Paper,
  Chip,
  Fab,
  Tooltip,
  Divider,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Avatar,
  useTheme,
  useMediaQuery,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Search,
  Download,
  Delete,
  Visibility,
  MoreVert,
  QrCode2,
  Add,
  CalendarToday,
  Analytics,
  Dashboard as DashboardIcon,
  Settings,
  Menu as MenuIcon,
  Home,
  Refresh,
  ViewModule,
  ViewList,
  Speed
} from '@mui/icons-material';
import { qrService } from '../services/qr.service';
import type { QRSearchParams } from '../services/qr.service';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import type { QRHistoryItem } from '../types';

// Utility functions
const getQRTypeFromContent = (content: string): string => {
  if (content.startsWith('http://') || content.startsWith('https://')) return 'URL';
  if (content.includes('@') && content.includes('.')) return 'Email';
  if (content.startsWith('tel:')) return 'Phone';
  if (content.startsWith('WIFI:')) return 'WiFi';
  return 'Text';
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const truncateContent = (content: string, maxLength: number = 50) => {
  return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
};

// StatCard Component
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardContent sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ 
          p: 1, 
          borderRadius: 2, 
          bgcolor: `${color}.100`,
          color: `${color}.600`,
          mr: 2 
        }}>
          {icon}
        </Box>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

// QRCodeCard Component
const QRCodeCard: React.FC<{
  qr: QRHistoryItem;
  onView: (qr: QRHistoryItem) => void;
  onDownload: (qr: QRHistoryItem) => void;
  onMenuClick: (event: React.MouseEvent<HTMLElement>, qr: QRHistoryItem) => void;
}> = ({ qr, onView, onDownload, onMenuClick }) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Chip 
            size="small" 
            label={getQRTypeFromContent(qr.content)}
            color="primary" 
            variant="outlined"
          />
          <IconButton 
            size="small" 
            onClick={(e) => onMenuClick(e, qr)}
            aria-label="more options"
          >
            <MoreVert />
          </IconButton>
        </Box>
        
        <Typography variant="h6" gutterBottom noWrap>
          QR Code #{qr.id}
        </Typography>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 2, 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {truncateContent(qr.content)}
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          Created: {formatDate(qr.created_at)}
        </Typography>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button 
          size="small" 
          startIcon={<Visibility />}
          onClick={() => onView(qr)}
        >
          View
        </Button>
        <Button 
          size="small" 
          startIcon={<Download />}
          onClick={() => onDownload(qr)}
        >
          Download
        </Button>
      </CardActions>
    </Card>
  );
};

// Sidebar Component
const Sidebar: React.FC<{
  user: any;
  recentActivity: QRHistoryItem[];
  onNavigate: (path: string) => void;
}> = ({ user, recentActivity, onNavigate }) => (
  <Box sx={{ width: 280, height: '100%', bgcolor: 'background.paper' }}>
    <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
          {user?.username?.charAt(0).toUpperCase() || 'U'}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            {user?.username || 'User'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email || 'user@example.com'}
          </Typography>
        </Box>
      </Box>
    </Box>

    <List sx={{ px: 2, py: 1 }}>
      <ListItemButton onClick={() => onNavigate('/dashboard')}>
        <ListItemIcon><DashboardIcon /></ListItemIcon>
        <ListItemText primary="Dashboard" />
      </ListItemButton>
      <ListItemButton onClick={() => onNavigate('/generate')}>
        <ListItemIcon><QrCode2 /></ListItemIcon>
        <ListItemText primary="Generate QR" />
      </ListItemButton>
      <ListItemButton onClick={() => onNavigate('/profile')}>
        <ListItemIcon><Settings /></ListItemIcon>
        <ListItemText primary="Profile" />
      </ListItemButton>
    </List>

    <Divider sx={{ mx: 2 }} />

    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" gutterBottom color="text.secondary">
        Recent Activity
      </Typography>
      {recentActivity.slice(0, 3).map((qr) => (
        <Box key={qr.id} sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" noWrap>
            {truncateContent(qr.content, 30)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatDate(qr.created_at)}
          </Typography>
        </Box>
      ))}
    </Box>
  </Box>
);

// Main Dashboard Component
const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State
  const [qrCodes, setQrCodes] = useState<QRHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedQR, setSelectedQR] = useState<QRHistoryItem | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedQRForMenu, setSelectedQRForMenu] = useState<QRHistoryItem | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [recentActivity, setRecentActivity] = useState<QRHistoryItem[]>([]);

  // Stats state
  const [stats, setStats] = useState({
    totalQRs: 0,
    thisWeekQRs: 0,
    todayQRs: 0,
    mostUsedType: 'Text'
  });

  const itemsPerPage = 12;

  useEffect(() => {
    if (user) {
      fetchQRCodes();
      calculateStats();
    }
  }, [user, currentPage, searchTerm]);

  const fetchQRCodes = async () => {
    try {
      if (!user) return;

      setLoading(true);
      setError(null);

      const searchParams: QRSearchParams = {
        page: currentPage,
        limit: itemsPerPage,
        ...(searchTerm && { search: searchTerm }),
      };

      const result = await qrService.getUserQRCodes(searchParams);
      setQrCodes(result.qrs);
      setTotalPages(Math.ceil(result.total / itemsPerPage));
      
      // Set recent activity (last 5 QR codes)
      setRecentActivity(result.qrs.slice(0, 5));
    } catch (err) {
      setError('Failed to fetch QR codes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async () => {
    try {
      if (!user) return;

      const result = await qrService.getUserQRCodes({ page: 1, limit: 1000 });
      const allQRs = result.qrs;
      
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const thisWeekQRs = allQRs.filter(qr => new Date(qr.created_at) >= oneWeekAgo);
      const todayQRs = allQRs.filter(qr => new Date(qr.created_at) >= today);
      
      const typeCount: Record<string, number> = {};
      allQRs.forEach(qr => {
        const type = getQRTypeFromContent(qr.content);
        typeCount[type] = (typeCount[type] || 0) + 1;
      });
      
      const mostUsedType = Object.entries(typeCount).reduce((a, b) => 
        typeCount[a[0]] > typeCount[b[0]] ? a : b, ['Text', 0])[0];

      setStats({
        totalQRs: allQRs.length,
        thisWeekQRs: thisWeekQRs.length,
        todayQRs: todayQRs.length,
        mostUsedType
      });
    } catch (err) {
      // Stats calculation is non-critical, fail silently
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handleViewQR = (qr: QRHistoryItem) => {
    setSelectedQR(qr);
    setViewDialogOpen(true);
  };

  const handleDownloadQR = async (qr: QRHistoryItem) => {
    try {
      const blob = await qrService.downloadQR(qr.id, 'png');
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-${qr.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download QR code. Please try again.');
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, qr: QRHistoryItem) => {
    setMenuAnchor(event.currentTarget);
    setSelectedQRForMenu(qr);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedQRForMenu(null);
  };

  const handleDeleteQR = async () => {
    if (!selectedQRForMenu) return;
    
    try {
      await qrService.deleteQR(selectedQRForMenu.id);
      await fetchQRCodes();
      await calculateStats();
      handleMenuClose();
    } catch (err) {
      setError('Failed to delete QR code. Please try again.');
    }
  };

  const handleRefresh = () => {
    fetchQRCodes();
    calculateStats();
  };

  const handleCreateNew = () => {
    navigate('/generate');
  };

  const drawer = (
    <Sidebar 
      user={user} 
      recentActivity={recentActivity} 
      onNavigate={navigate} 
    />
  );

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'grey.50' }}>
      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: 280 }, flexShrink: { md: 0 } }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: 280,
                position: 'relative',
                height: '100%'
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top App Bar */}
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={() => setMobileOpen(true)}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Dashboard
            </Typography>

            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} color="inherit">
                <Refresh />
              </IconButton>
            </Tooltip>

            <Tooltip title={viewMode === 'grid' ? 'List View' : 'Grid View'}>
              <IconButton 
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                color="inherit"
              >
                {viewMode === 'grid' ? <ViewList /> : <ViewModule />}
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        {/* Content Area */}
        <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
          {/* Breadcrumbs */}
          <Breadcrumbs sx={{ mb: 3 }}>
            <Link color="inherit" href="/" onClick={() => navigate('/')}>
              <Home sx={{ mr: 0.5 }} fontSize="inherit" />
              Home
            </Link>
            <Typography color="text.primary">Dashboard</Typography>
          </Breadcrumbs>

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total QR Codes"
                value={stats.totalQRs}
                icon={<QrCode2 />}
                color="primary"
                subtitle="All time"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="This Week"
                value={stats.thisWeekQRs}
                icon={<CalendarToday />}
                color="success"
                subtitle="Last 7 days"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Today"
                value={stats.todayQRs}
                icon={<Analytics />}
                color="info"
                subtitle="Generated today"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Most Used"
                value={stats.mostUsedType}
                icon={<Speed />}
                color="warning"
                subtitle="QR type"
              />
            </Grid>
          </Grid>

          {/* Search and Actions */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search QR codes..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, minWidth: 200 }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateNew}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Create New
            </Button>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {/* QR Codes Grid/List */}
          {!loading && (
            <>
              {qrCodes.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <QrCode2 sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No QR codes found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {searchTerm ? 'Try adjusting your search terms.' : 'Create your first QR code to get started.'}
                  </Typography>
                  <Button variant="contained" startIcon={<Add />} onClick={handleCreateNew}>
                    Create Your First QR Code
                  </Button>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {qrCodes.map((qr) => (
                    <Grid item xs={12} sm={6} md={4} key={qr.id}>
                      <QRCodeCard
                        qr={qr}
                        onView={handleViewQR}
                        onDownload={handleDownloadQR}
                        onMenuClick={handleMenuClick}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size={isMobile ? 'small' : 'medium'}
                  />
                </Box>
              )}
            </>
          )}
        </Box>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { md: 'none' }
          }}
          onClick={handleCreateNew}
        >
          <Add />
        </Fab>
      </Box>

      {/* View QR Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            QR Code Details
            <IconButton onClick={() => setViewDialogOpen(false)}>
              <Delete />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedQR && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Chip 
                  size="small" 
                  label={getQRTypeFromContent(selectedQR.content)}
                  color="primary" 
                  sx={{ mr: 1 }}
                />
                <Typography variant="h6">
                  QR Code #{selectedQR.id}
                </Typography>
              </Box>
              
              <Typography variant="subtitle1" gutterBottom>
                Content:
              </Typography>
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                  {selectedQR.content}
                </Typography>
              </Paper>
              
              <Typography variant="subtitle1" gutterBottom>
                Created:
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {formatDate(selectedQR.created_at)}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                QR Code ID:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                {selectedQR.id}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>
            Close
          </Button>
          {selectedQR && (
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => {
                handleDownloadQR(selectedQR);
                setViewDialogOpen(false);
              }}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedQRForMenu) handleViewQR(selectedQRForMenu);
          handleMenuClose();
        }}>
          <ListItemIcon><Visibility /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedQRForMenu) handleDownloadQR(selectedQRForMenu);
          handleMenuClose();
        }}>
          <ListItemIcon><Download /></ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteQR} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Dashboard;