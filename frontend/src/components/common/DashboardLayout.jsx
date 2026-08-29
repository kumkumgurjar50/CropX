import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppBar, Avatar, Badge, Box, Button, Chip, ClickAwayListener,
  Divider, Drawer, Grow, IconButton, InputAdornment, List,
  ListItemButton, ListItemIcon, ListItemText, MenuItem, MenuList,
  Paper, Popper, Stack, TextField, Toolbar, Tooltip, Typography, alpha,
} from '@mui/material';
import {
  AgricultureOutlined, BugReport, ChevronLeft, DarkMode,
  Dashboard, GrassOutlined, Inbox, LightMode, Logout as LogoutIcon,
  Menu as MenuIcon, Message, Notifications as NotifIcon,
  Person, Science, Settings, ShoppingCartOutlined, Storefront,
  ThermostatAuto, TrendingUp, SearchOutlined,
  Add, Remove, Delete, Close as CloseIcon,
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useThemeToggle } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { getDashboardPath, ROLE_LABELS } from '../../constants/roles';
import api from '../../services/api';
import NotificationBell from './NotificationBell';
import ChatSupport from './ChatSupport';
import { toast } from 'react-toastify';
import { AnimatePresence, motion } from 'framer-motion';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

const ROLE_COLORS = {
  FARMER: { bg: alpha('#22c55e', 0.12), color: '#15803d' },
  CUSTOMER: { bg: alpha('#3b82f6', 0.1), color: '#1d4ed8' },
  ADMIN: { bg: alpha('#8b5cf6', 0.1), color: '#7c3aed' },
};

const FARMER_NAV = [
  { label: 'Dashboard', path: '/farmer/dashboard', icon: <Dashboard fontSize="small" /> },
  { label: 'Farm Manager', path: '/farmer/farms', icon: <AgricultureOutlined fontSize="small" /> },
  { label: 'My Crops', path: '/farmer/crops', icon: <GrassOutlined fontSize="small" /> },
  { label: 'Marketplace', path: '/farmer/marketplace', icon: <Storefront fontSize="small" /> },
  { label: 'Orders', path: '/farmer/orders', icon: <Inbox fontSize="small" /> },
  { label: 'Bookings', path: '/farmer/bookings', icon: <ShoppingCartOutlined fontSize="small" /> },
  { divider: true },
  { label: 'Disease Scanner', path: '/farmer/disease-scanner', icon: <BugReport fontSize="small" /> },
  { label: 'Fertilizer Center', path: '/farmer/fertilizer', icon: <Science fontSize="small" /> },
  { divider: true },
  { label: 'Weather', path: '/farmer/weather', icon: <ThermostatAuto fontSize="small" /> },
  { label: 'Crop Prices', path: '/farmer/crop-prices', icon: <TrendingUp fontSize="small" /> },
  { divider: true },
  { label: 'Messages', path: '/farmer/messages', icon: <Message fontSize="small" /> },
  { label: 'Notifications', path: '/farmer/notifications', icon: <NotifIcon fontSize="small" /> },
  { divider: true },
  { label: 'Profile', path: '/profile', icon: <Person fontSize="small" /> },
  { label: 'Settings', path: '/settings', icon: <Settings fontSize="small" /> },
];

const CUSTOMER_NAV = [
  { label: 'Dashboard', path: '/customer/dashboard', icon: <Dashboard fontSize="small" /> },
  { divider: true },
  { label: 'Browse Farms', path: '/customer/farms', icon: <AgricultureOutlined fontSize="small" /> },
  { label: 'Marketplace', path: '/customer/marketplace', icon: <Storefront fontSize="small" /> },
  { label: 'My Orders', path: '/customer/orders', icon: <ShoppingCartOutlined fontSize="small" /> },
  { label: 'My Bookings', path: '/customer/bookings', icon: <Inbox fontSize="small" /> },
  { divider: true },
  { label: 'Messages', path: '/customer/messages', icon: <Message fontSize="small" /> },
  { label: 'Notifications', path: '/customer/notifications', icon: <NotifIcon fontSize="small" /> },
  { divider: true },
  { label: 'Profile', path: '/profile', icon: <Person fontSize="small" /> },
  { label: 'Settings', path: '/settings', icon: <Settings fontSize="small" /> },
];

const ADMIN_NAV = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <Dashboard fontSize="small" /> },
  { divider: true },
  { label: 'Profile', path: '/profile', icon: <Person fontSize="small" /> },
  { label: 'Settings', path: '/settings', icon: <Settings fontSize="small" /> },
];

function getNavItems(role) {
  if (role === 'FARMER') return FARMER_NAV;
  if (role === 'CUSTOMER') return CUSTOMER_NAV;
  return ADMIN_NAV;
}

// ── Farmer top bar ───────────────────────────────────────────────────────────
function FarmerTopBar({ initials, onMenuOpen, onMobileToggle, title }) {
  const { toggleTheme, isDark } = useThemeToggle();
  const navigate = useNavigate();
  const [avatarAnchor, setAvatarAnchor] = useState(null);
  const { user, logout } = useAuth();
  const { fertCount, setFertCartOpen } = useCart();

  const handleLogout = async () => {
    setAvatarAnchor(null);
    await logout();
    navigate('/login');
  };

  const farmerMenuItems = [
    { label: 'My Profile', to: '/profile' },
    { label: 'Farm Information', to: '/farmer/farms' },
    { label: 'Account Settings', to: '/settings' },
  ];

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>
      <Toolbar sx={{ minHeight: { xs: 60, sm: 64 }, gap: 1.5 }}>
        <IconButton edge="start" onClick={onMobileToggle} sx={{ display: { md: 'none' } }}>
          <MenuIcon />
        </IconButton>

        {/* Logo mark visible on mobile */}
        <Box component={Link} to="/" sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1, textDecoration: 'none' }}>
          <Box sx={{ width: 30, height: 30, borderRadius: 1.5, background: 'linear-gradient(135deg,#2E7D32,#4caf50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AgricultureOutlined sx={{ color: 'white', fontSize: 18 }} />
          </Box>
        </Box>

        {title && <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ display: { xs: 'none', sm: 'block' } }}>{title}</Typography>}
        <Box sx={{ flex: 1 }} />

        {/* Live notification bell */}
        <NotificationBell notifPath="/farmer/notifications" />

        {/* Messages */}
        <Tooltip title="Messages">
          <IconButton size="small" component={Link} to="/farmer/messages" sx={{ color: 'text.secondary' }}>
            <Message fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Fertilizer cart badge */}
        <Tooltip title="Fertilizer Cart">
          <IconButton
            size="small"
            onClick={() => setFertCartOpen(true)}
            sx={{ color: 'text.secondary' }}
          >
            <Badge badgeContent={fertCount} color="error" max={99}>
              <ShoppingCartOutlined fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Theme toggle */}
        <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
          <IconButton size="small" onClick={toggleTheme} sx={{ color: 'text.secondary' }}>
            {isDark ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1.5 }} />

        {/* Avatar + role chip */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ cursor: 'pointer' }} onClick={e => setAvatarAnchor(e.currentTarget)}>
          <Avatar sx={{ width: 32, height: 32, fontSize: 12, fontWeight: 800 }}>{initials}</Avatar>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="caption" fontWeight={700} display="block" lineHeight={1.2}>{user?.name?.split(' ')[0] || 'Farmer'}</Typography>
            <Chip label="Farmer" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha('#22c55e', 0.1), color: '#15803d', borderRadius: 0.75 }} />
          </Box>
        </Stack>
      </Toolbar>

      {/* Avatar dropdown */}
      {Boolean(avatarAnchor) && (
        <ClickAwayListener onClickAway={() => setAvatarAnchor(null)}>
          <Paper sx={{ position: 'fixed', top: 72, right: 16, zIndex: 1400, minWidth: 200, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" fontWeight={700}>{user?.name || user?.email}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
            </Box>
            {farmerMenuItems.map(item => (
              <MenuItem key={item.to} onClick={() => { navigate(item.to); setAvatarAnchor(null); }} sx={{ py: 1 }}>
                <Typography variant="body2">{item.label}</Typography>
              </MenuItem>
            ))}
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ py: 1, color: 'error.main' }}>
              <Typography variant="body2" color="error.main">Log out</Typography>
            </MenuItem>
          </Paper>
        </ClickAwayListener>
      )}
    </AppBar>
  );
}

// ── Customer top bar ─────────────────────────────────────────────────────────
function CustomerTopBar({ initials, onMobileToggle, title }) {
  const { toggleTheme, isDark } = useThemeToggle();
  const navigate = useNavigate();
  const [avatarAnchor, setAvatarAnchor] = useState(null);
  const { user, logout } = useAuth();
  const { cropCount, setCropCartOpen } = useCart();

  const handleLogout = async () => {
    setAvatarAnchor(null);
    await logout();
    navigate('/login');
  };

  const customerMenuItems = [
    { label: 'My Profile', to: '/profile' },
    { label: 'My Orders', to: '/customer/orders' },
    { label: 'Account Settings', to: '/settings' },
  ];

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>
      <Toolbar sx={{ minHeight: { xs: 60, sm: 64 }, gap: 1.5 }}>
        <IconButton edge="start" onClick={onMobileToggle} sx={{ display: { md: 'none' } }}>
          <MenuIcon />
        </IconButton>

        {/* Logo on mobile */}
        <Box component={Link} to="/" sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1, textDecoration: 'none' }}>
          <Box sx={{ width: 30, height: 30, borderRadius: 1.5, background: 'linear-gradient(135deg,#2E7D32,#4caf50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AgricultureOutlined sx={{ color: 'white', fontSize: 18 }} />
          </Box>
        </Box>

        {title && <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ display: { xs: 'none', sm: 'block' } }}>{title}</Typography>}
        <Box sx={{ flex: 1 }} />

        {/* Live notification bell for customers */}
        <NotificationBell notifPath="/customer/notifications" />

        {/* Messages */}
        <Tooltip title="Messages">
          <IconButton size="small" component={Link} to="/customer/messages" sx={{ color: 'text.secondary' }}>
            <Message fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Crop cart badge */}
        <Tooltip title="Cart">
          <IconButton
            size="small"
            onClick={() => setCropCartOpen(true)}
            sx={{ color: 'text.secondary' }}
          >
            <Badge badgeContent={cropCount} color="error" max={99}>
              <ShoppingCartOutlined fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Theme toggle */}
        <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
          <IconButton size="small" onClick={toggleTheme} sx={{ color: 'text.secondary' }}>
            {isDark ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1.5 }} />

        {/* Avatar + role chip */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ cursor: 'pointer' }} onClick={e => setAvatarAnchor(e.currentTarget)}>
          <Avatar sx={{ width: 32, height: 32, fontSize: 12, fontWeight: 800, background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' }}>{initials}</Avatar>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="caption" fontWeight={700} display="block" lineHeight={1.2}>{user?.name?.split(' ')[0] || 'Customer'}</Typography>
            <Chip label="Customer" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha('#3b82f6', 0.1), color: '#1d4ed8', borderRadius: 0.75 }} />
          </Box>
        </Stack>
      </Toolbar>

      {Boolean(avatarAnchor) && (
        <ClickAwayListener onClickAway={() => setAvatarAnchor(null)}>
          <Paper sx={{ position: 'fixed', top: 72, right: 16, zIndex: 1400, minWidth: 200, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" fontWeight={700}>{user?.name || user?.email}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
            </Box>
            {customerMenuItems.map(item => (
              <MenuItem key={item.to} onClick={() => { navigate(item.to); setAvatarAnchor(null); }} sx={{ py: 1 }}>
                <Typography variant="body2">{item.label}</Typography>
              </MenuItem>
            ))}
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ py: 1, color: 'error.main' }}>
              <Typography variant="body2" color="error.main">Log out</Typography>
            </MenuItem>
          </Paper>
        </ClickAwayListener>
      )}
    </AppBar>
  );
}

// ── Global Fertilizer Cart Drawer ────────────────────────────────────────────
function GlobalFertCartDrawer({ open, onClose, fertCart, removeFert, updateFert, clearFert, fertTotal }) {
  const totalItems = fertCart.reduce((s, i) => s + i.quantity, 0);
  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100vw', sm: 400 }, display: 'flex', flexDirection: 'column' } }}>
      <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ShoppingCartOutlined sx={{ color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={800}>Fertilizer Cart</Typography>
          <Chip label={totalItems} size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800 }} />
        </Stack>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1.5 }}>
        {fertCart.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <ShoppingCartOutlined sx={{ fontSize: 56, color: alpha('#2E7D32', 0.18), mb: 1.5 }} />
            <Typography variant="body2" color="text.secondary" fontWeight={600}>Your fertilizer cart is empty</Typography>
            <Typography variant="caption" color="text.disabled">Go to Fertilizer Center to add products</Typography>
          </Box>
        ) : fertCart.map(item => (
          <Paper key={item.id} elevation={0} sx={{ mb: 1.5, p: 1.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 52, height: 52, borderRadius: 2, flexShrink: 0, bgcolor: alpha('#2E7D32', 0.07), display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {item.image
                  ? <Box component="img" src={item.image} alt={item.name} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  : <Science sx={{ fontSize: 26, color: alpha('#2E7D32', 0.4) }} />}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} noWrap>{item.name}</Typography>
                <Typography variant="caption" color="text.secondary">{item.fertilizer_type} · {item.unit}</Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.75 }}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <IconButton size="small" onClick={() => item.quantity === 1 ? removeFert(item.id) : updateFert(item.id, item.quantity - 1)}
                      sx={{ width: 26, height: 26, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      {item.quantity === 1 ? <Delete sx={{ fontSize: 14, color: 'error.main' }} /> : <Remove sx={{ fontSize: 14 }} />}
                    </IconButton>
                    <Typography variant="body2" fontWeight={700} sx={{ minWidth: 22, textAlign: 'center' }}>{item.quantity}</Typography>
                    <IconButton size="small" onClick={() => updateFert(item.id, item.quantity + 1)}
                      sx={{ width: 26, height: 26, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Add sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Stack>
                  <Typography variant="body2" fontWeight={800} color="primary.main">
                    ₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}
                  </Typography>
                </Stack>
              </Box>
              <IconButton size="small" onClick={() => removeFert(item.id)} sx={{ color: 'error.light' }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Paper>
        ))}
      </Box>
      {fertCart.length > 0 && (
        <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">Subtotal ({totalItems} items)</Typography>
            <Typography variant="h6" fontWeight={800} color="primary.main">₹{fertTotal.toLocaleString('en-IN')}</Typography>
          </Stack>
          <Button fullWidth variant="contained" size="large" startIcon={<ShoppingCartOutlined />}
            sx={{ borderRadius: 2.5, fontWeight: 800, py: 1.2, mb: 1 }}
            onClick={() => { toast.success('Order placed! (Payment integration coming soon)'); clearFert(); onClose(); }}>
            Place Order — ₹{fertTotal.toLocaleString('en-IN')}
          </Button>
          <Button fullWidth variant="text" size="small" color="error" onClick={clearFert} sx={{ borderRadius: 2, fontSize: '0.75rem' }}>
            Clear cart
          </Button>
        </Box>
      )}
    </Drawer>
  );
}

// ── Global Crop Cart Drawer ───────────────────────────────────────────────────
function GlobalCropCartDrawer({ open, onClose, cropCart, removeCrop, updateCrop, clearCrop, cropTotal }) {
  const totalItems = cropCart.reduce((s, i) => s + i.quantity, 0);
  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100vw', sm: 420 }, display: 'flex', flexDirection: 'column' } }}>
      <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ShoppingCartOutlined sx={{ color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={800}>Crop Cart</Typography>
          <Chip label={totalItems} size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800 }} />
        </Stack>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1.5 }}>
        {cropCart.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <ShoppingCartOutlined sx={{ fontSize: 56, color: alpha('#2E7D32', 0.18), mb: 1.5 }} />
            <Typography variant="body2" color="text.secondary" fontWeight={600}>Your crop cart is empty</Typography>
            <Typography variant="caption" color="text.disabled">Go to Marketplace to add crops</Typography>
          </Box>
        ) : cropCart.map(item => (
          <Paper key={item.id} elevation={0} sx={{ mb: 1.5, p: 1.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 44, height: 44, borderRadius: 2, flexShrink: 0, bgcolor: alpha('#2E7D32', 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: 22 }}>🌾</Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} noWrap>{item.name}</Typography>
                <Typography variant="caption" color="text.secondary">₹{Number(item.price).toLocaleString('en-IN')}/kg{item.farmer_name ? ` · ${item.farmer_name}` : ''}</Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.75 }}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <IconButton size="small" onClick={() => item.quantity === 1 ? removeCrop(item.id) : updateCrop(item.id, item.quantity - 1)}
                      sx={{ width: 26, height: 26, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      {item.quantity === 1 ? <Delete sx={{ fontSize: 14, color: 'error.main' }} /> : <Remove sx={{ fontSize: 14 }} />}
                    </IconButton>
                    <Typography variant="body2" fontWeight={700} sx={{ minWidth: 26, textAlign: 'center' }}>{item.quantity}</Typography>
                    <Typography variant="caption" color="text.secondary">kg</Typography>
                    <IconButton size="small" onClick={() => updateCrop(item.id, item.quantity + 1)}
                      sx={{ width: 26, height: 26, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Add sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Stack>
                  <Typography variant="body2" fontWeight={800} color="primary.main">
                    ₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}
                  </Typography>
                </Stack>
              </Box>
              <IconButton size="small" onClick={() => removeCrop(item.id)} sx={{ color: 'error.light' }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Paper>
        ))}
      </Box>
      {cropCart.length > 0 && (
        <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">Subtotal ({totalItems} kg)</Typography>
            <Typography variant="h6" fontWeight={800} color="primary.main">₹{cropTotal.toLocaleString('en-IN')}</Typography>
          </Stack>
          <Button fullWidth variant="contained" size="large" startIcon={<ShoppingCartOutlined />}
            sx={{ borderRadius: 2.5, fontWeight: 800, py: 1.2, mb: 1 }}
            onClick={() => { toast.success('Proceed to checkout in the Marketplace page.'); onClose(); }}>
            Checkout — ₹{cropTotal.toLocaleString('en-IN')}
          </Button>
          <Button fullWidth variant="text" size="small" color="error" onClick={clearCrop} sx={{ borderRadius: 2, fontSize: '0.75rem' }}>
            Clear cart
          </Button>
        </Box>
      )}
    </Drawer>
  );
}

// ── Main DashboardLayout ──────────────────────────────────────────────────────
export default function DashboardLayout({ children, title }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useThemeToggle();
  const {
    fertCart, removeFert, updateFert, clearFert, fertTotal, fertCount, fertCartOpen, setFertCartOpen,
    cropCart, removeCrop, updateCrop, clearCrop, cropTotal, cropCount, cropCartOpen, setCropCartOpen,
  } = useCart();

  const navItems = useMemo(() => getNavItems(user?.role), [user?.role]);
  const handleLogout = async () => { await logout(); navigate('/login'); };

  const roleStyle = ROLE_COLORS[user?.role] ?? ROLE_COLORS.CUSTOMER;
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] ?? 'U').toUpperCase();

  const drawerWidth = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  const sidebar = (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      bgcolor: isDark ? '#0f1a0f' : '#1a2e1c',
      overflow: 'hidden',
    }}>
      {/* Brand */}
      <Box sx={{
        px: collapsed ? 1 : 2.5, py: 2,
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.08)', minHeight: 64,
      }}>
        {!collapsed && (
          <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}>
            <Box sx={{ width: 34, height: 34, borderRadius: 2, background: 'linear-gradient(135deg,#2E7D32,#4caf50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AgricultureOutlined sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: 'white', lineHeight: 1.1 }}>CropX</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>
                {user?.role === 'FARMER' ? 'Farmer Portal' : user?.role === 'CUSTOMER' ? 'Customer Portal' : 'Admin Portal'}
              </Typography>
            </Box>
          </Box>
        )}
        <IconButton size="small" onClick={() => setCollapsed(p => !p)} sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.08)' } }}>
          {collapsed ? <MenuIcon fontSize="small" /> : <ChevronLeft fontSize="small" />}
        </IconButton>
      </Box>

      {/* User info */}
      {!collapsed ? (
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 800 }}>{initials}</Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700} noWrap sx={{ color: 'white', maxWidth: 140 }}>{user?.name || user?.email}</Typography>
              <Chip label={ROLE_LABELS[user?.role] ?? user?.role} size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: roleStyle.bg, color: roleStyle.color, borderRadius: 1, mt: 0.25 }} />
            </Box>
          </Stack>
        </Box>
      ) : (
        <Box sx={{ py: 1.5, display: 'flex', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Tooltip title={user?.name || user?.email} placement="right">
            <Avatar sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 800 }}>{initials}</Avatar>
          </Tooltip>
        </Box>
      )}

      {/* Nav */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2 } }}>
        <List disablePadding dense sx={{ px: collapsed ? 0.5 : 1 }}>
          {navItems.map((item, idx) => {
            if (item.divider) return <Divider key={idx} sx={{ my: 0.75, borderColor: 'rgba(255,255,255,0.08)' }} />;
            const active = location.pathname === item.path;
            return (
              <Tooltip key={item.path} title={collapsed ? item.label : ''} placement="right">
                <ListItemButton
                  component={Link} to={item.path} selected={active}
                  onClick={() => setMobileOpen(false)}
                  sx={{
                    borderRadius: 2, mb: 0.25, px: 1.5, py: 1,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    minHeight: 40,
                    bgcolor: active ? 'rgba(46,125,50,0.30)' : 'transparent',
                    '&:hover': { bgcolor: active ? 'rgba(46,125,50,0.38)' : 'rgba(255,255,255,0.07)' },
                    '&.Mui-selected': { bgcolor: 'rgba(46,125,50,0.30)' },
                    '&.Mui-selected:hover': { bgcolor: 'rgba(46,125,50,0.38)' },
                  }}
                >
                  <ListItemIcon sx={{ color: active ? '#4caf50' : 'rgba(255,255,255,0.55)', minWidth: collapsed ? 0 : 36 }}>
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <Typography
                      variant="body2" noWrap
                      sx={{ fontWeight: active ? 700 : 400, fontSize: '0.82rem', color: active ? '#fff' : 'rgba(255,255,255,0.78)', lineHeight: 1, flex: 1 }}
                    >
                      {item.label}
                    </Typography>
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>
      </Box>

      {/* Bottom */}
      <Box sx={{ p: collapsed ? 0.5 : 1.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {!collapsed ? (
          <Button
            fullWidth onClick={toggleTheme}
            startIcon={isDark ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
            sx={{ color: 'rgba(255,255,255,0.55)', justifyContent: 'flex-start', px: 1.5, py: 0.75, borderRadius: 2, mb: 0.5, fontWeight: 500, fontSize: '0.8rem', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: 'white' } }}
          >
            {isDark ? 'Light mode' : 'Dark mode'}
          </Button>
        ) : (
          <Tooltip title={isDark ? 'Light mode' : 'Dark mode'} placement="right">
            <IconButton size="small" onClick={toggleTheme} sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.08)' }, width: '100%', borderRadius: 2, mb: 0.5 }}>
              {isDark ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title={collapsed ? 'Log out' : ''} placement="right">
          <Button
            fullWidth onClick={handleLogout}
            startIcon={!collapsed ? <LogoutIcon fontSize="small" /> : null}
            sx={{ color: 'rgba(255,255,255,0.55)', justifyContent: collapsed ? 'center' : 'flex-start', px: collapsed ? 0 : 1.5, py: 1, borderRadius: 2, minWidth: 0, fontWeight: 500, fontSize: '0.8rem', '&:hover': { bgcolor: 'rgba(239,68,68,0.15)', color: '#ff8a80' } }}
          >
            {collapsed ? <LogoutIcon fontSize="small" /> : 'Log out'}
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );

  // Pick correct top bar based on role
  const TopBar = user?.role === 'FARMER'
    ? <FarmerTopBar initials={initials} onMobileToggle={() => setMobileOpen(true)} title={title} />
    : user?.role === 'CUSTOMER'
      ? <CustomerTopBar initials={initials} onMobileToggle={() => setMobileOpen(true)} title={title} />
      : (
        /* Admin / fallback generic top bar */
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Toolbar sx={{ minHeight: { xs: 60, sm: 64 }, gap: 2 }}>
            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ display: { md: 'none' } }}><MenuIcon /></IconButton>
            {title && <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ display: { xs: 'none', sm: 'block' } }}>{title}</Typography>}
            <Box sx={{ flex: 1 }} />
            <Tooltip title={isDark ? 'Light mode' : 'Dark mode'}>
              <IconButton size="small" onClick={toggleTheme} sx={{ color: 'text.secondary' }}>
                {isDark ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title={user?.name || user?.email}>
              <Avatar sx={{ width: 32, height: 32, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>{initials}</Avatar>
            </Tooltip>
          </Toolbar>
        </AppBar>
      );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box component="nav" sx={{ width: drawerWidth, flexShrink: 0, display: { xs: 'none', md: 'block' }, transition: 'width 0.25s ease' }}>
        <Box sx={{ width: drawerWidth, height: '100vh', position: 'sticky', top: 0, transition: 'width 0.25s ease' }}>{sidebar}</Box>
      </Box>

      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
        {sidebar}
      </Drawer>

      <Box component="main" sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {TopBar}
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
          <Box sx={{ maxWidth: 1280, mx: 'auto' }}>{children}</Box>
        </Box>
      </Box>

      {/* AI Chatbot — only mounts when user is logged in (ChatSupport checks internally) */}
      <ChatSupport />

      {/* ── Global Fertilizer Cart Drawer (opens from top-bar icon) ── */}
      <GlobalFertCartDrawer
        open={fertCartOpen}
        onClose={() => setFertCartOpen(false)}
        fertCart={fertCart}
        removeFert={removeFert}
        updateFert={updateFert}
        clearFert={clearFert}
        fertTotal={fertTotal}
      />

      {/* ── Global Crop Cart Drawer (opens from top-bar icon) ── */}
      <GlobalCropCartDrawer
        open={cropCartOpen}
        onClose={() => setCropCartOpen(false)}
        cropCart={cropCart}
        removeCrop={removeCrop}
        updateCrop={updateCrop}
        clearCrop={clearCrop}
        cropTotal={cropTotal}
      />
    </Box>
  );
}

