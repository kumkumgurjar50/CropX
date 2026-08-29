import { useEffect, useState, useCallback } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  AgricultureOutlined,
  CheckCircleOutlined,
  DeleteOutlined as DeleteIcon,
  EditOutlined as EditIcon,
  GrassOutlined,
  GroupOutlined,
  InventoryOutlined,
  MonetizationOnOutlined,
  PersonOutlined,
  Refresh,
  SearchOutlined,
  ScienceOutlined,
  ShoppingCartOutlined,
  StorefrontOutlined,
  VerifiedUserOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';
import api from '../../services/api';
import { toast } from 'react-toastify';

const PURPLE = '#8b5cf6';
const GREEN  = '#22c55e';
const BLUE   = '#3b82f6';
const AMBER  = '#f59e0b';
const TEAL   = '#14b8a6';
const ROSE   = '#f43f5e';

const FERTILIZER_TYPES = [
  'Chemical',
  'Organic',
  'Fungicide',
  'Pesticide',
  'Micronutrient',
  'Biofertilizer',
];

/* ─── Stat Card Component ────────────────────────────────────────────────── */
function StatCard({ icon, label, value, sub, accent }) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          height: '100%',
          boxShadow: '0 4px 20px -4px rgba(0,0,0,0.05)',
        }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 3.5,
            bgcolor: alpha(accent, 0.1),
            color: accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h5" fontWeight={800} sx={{ color: accent, lineHeight: 1.15 }}>
            {value ?? <CircularProgress size={18} sx={{ color: accent }} />}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={600} noWrap sx={{ mt: 0.3 }}>
            {label}
          </Typography>
          {sub && (
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.2 }}>
              {sub}
            </Typography>
          )}
        </Box>
      </Paper>
    </motion.div>
  );
}

/* ─── Status Chip Component ──────────────────────────────────────────────── */
const STATUS_COLORS = {
  DELIVERED:  { color: '#22c55e', bg: alpha('#22c55e', 0.12) },
  COMPLETED:  { color: '#22c55e', bg: alpha('#22c55e', 0.12) },
  BOOKED:     { color: '#22c55e', bg: alpha('#22c55e', 0.12) },
  PENDING:    { color: '#f59e0b', bg: alpha('#f59e0b', 0.12) },
  ACCEPTED:   { color: '#3b82f6', bg: alpha('#3b82f6', 0.12) },
  ACTIVE:     { color: '#22c55e', bg: alpha('#22c55e', 0.12) },
  IN_TRANSIT: { color: '#8b5cf6', bg: alpha('#8b5cf6', 0.12) },
  CANCELLED:  { color: '#f43f5e', bg: alpha('#f43f5e', 0.12) },
};
function StatusChip({ status }) {
  const norm = (status || 'PENDING').toUpperCase();
  const c = STATUS_COLORS[norm] || { color: '#94a3b8', bg: alpha('#94a3b8', 0.12) };
  return (
    <Chip
      label={norm}
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: '0.68rem',
        letterSpacing: '0.03em',
        color: c.color,
        bgcolor: c.bg,
        border: 'none',
        borderRadius: 1.5,
      }}
    />
  );
}

/* ─── Role Chip Component ────────────────────────────────────────────────── */
function RoleChip({ role }) {
  const map = {
    FARMER:   { color: GREEN,  label: 'Farmer' },
    CUSTOMER: { color: BLUE,   label: 'Customer' },
    ADMIN:    { color: PURPLE, label: 'Admin' },
  };
  const { color, label } = map[role] || { color: '#94a3b8', label: role };
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: '0.68rem',
        color,
        bgcolor: alpha(color, 0.1),
        border: 'none',
        borderRadius: 1.5,
      }}
    />
  );
}

/* ─── Main Admin Dashboard Component ─────────────────────────────────────── */
export default function AdminDashboard() {
  usePageTitle('Admin Dashboard — CropX');
  const { user } = useAuth();

  // Tab State
  const [currentTab, setCurrentTab] = useState(0);

  // Stats State
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // User Directory State
  const [usersList, setUsersList] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Farms & Crops Directory State
  const [farmsList, setFarmsList] = useState([]);
  const [loadingFarms, setLoadingFarms] = useState(false);
  const [farmSearch, setFarmSearch] = useState('');

  // Fertilizer Catalog State
  const [fertilizers, setFertilizers] = useState([]);
  const [loadingFertilizers, setLoadingFertilizers] = useState(false);
  const [fertSearch, setFertSearch] = useState('');
  const [fertCategoryFilter, setFertCategoryFilter] = useState('ALL');

  // Fertilizer Add/Edit Modal State
  const [openFertModal, setOpenFertModal] = useState(false);
  const [editingFert, setEditingFert] = useState(null);
  const [savingFert, setSavingFert] = useState(false);
  const [fertForm, setFertForm] = useState({
    name: '',
    brand: '',
    fertilizer_type: 'Chemical',
    price: '',
    original_price: '',
    unit: '50kg Bag',
    stock: '100',
    crops: 'Wheat, Rice, Maize, Vegetables',
    prevents: 'Nutrient Deficiency, Stunted Growth',
    description: '',
    image_url: '',
  });

  // Fetch Stats
  const fetchStats = useCallback(() => {
    setLoadingStats(true);
    api.get('/dashboard/admin-stats/')
      .then((res) => {
        setStats(res.data);
        setLoadingStats(false);
      })
      .catch(() => {
        setStatsError('Failed to refresh dashboard stats.');
        setLoadingStats(false);
      });
  }, []);

  // Fetch Users
  const fetchUsers = useCallback(() => {
    setLoadingUsers(true);
    let url = '/auth/users/';
    if (userRoleFilter !== 'ALL') {
      url += `?role=${userRoleFilter}`;
    }
    api.get(url)
      .then((res) => {
        setUsersList(res.data.results || res.data || []);
        setLoadingUsers(false);
      })
      .catch(() => setLoadingUsers(false));
  }, [userRoleFilter]);

  // Fetch Farms
  const fetchFarms = useCallback(() => {
    setLoadingFarms(true);
    api.get('/farms/public/')
      .then((res) => {
        setFarmsList(res.data.results || res.data || []);
        setLoadingFarms(false);
      })
      .catch(() => setLoadingFarms(false));
  }, []);

  // Fetch Fertilizers
  const fetchFertilizers = useCallback(() => {
    setLoadingFertilizers(true);
    api.get('/fertilizers/')
      .then((res) => {
        setFertilizers(res.data.results || res.data || []);
        setLoadingFertilizers(false);
      })
      .catch(() => setLoadingFertilizers(false));
  }, []);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchFarms();
    fetchFertilizers();
  }, [fetchStats, fetchUsers, fetchFarms, fetchFertilizers]);

  // Fertilizer Modal Handlers
  const handleOpenAddFert = () => {
    setEditingFert(null);
    setFertForm({
      name: '',
      brand: 'IFFCO',
      fertilizer_type: 'Chemical',
      price: '850',
      original_price: '990',
      unit: '50kg Bag',
      stock: '100',
      crops: 'Wheat, Rice, Maize, Cotton',
      prevents: 'Nitrogen Deficiency, Stunted Growth',
      description: 'High-quality agricultural fertilizer for robust crop growth and maximum yield.',
      image_url: '',
    });
    setOpenFertModal(true);
  };

  const handleOpenEditFert = (fert) => {
    setEditingFert(fert);
    setFertForm({
      name: fert.name || '',
      brand: fert.brand || '',
      fertilizer_type: fert.fertilizer_type || 'Chemical',
      price: fert.price || '',
      original_price: fert.original_price || '',
      unit: fert.unit || '50kg Bag',
      stock: fert.stock != null ? String(fert.stock) : '100',
      crops: fert.crops || '',
      prevents: fert.prevents || '',
      description: fert.description || '',
      image_url: fert.image_url || '',
    });
    setOpenFertModal(true);
  };

  const handleSaveFertilizer = async (e) => {
    e.preventDefault();
    if (!fertForm.name || !fertForm.brand || !fertForm.price) {
      toast.error('Please fill in product name, brand, and price.');
      return;
    }
    setSavingFert(true);

    const payload = {
      ...fertForm,
      price: parseFloat(fertForm.price),
      original_price: fertForm.original_price ? parseFloat(fertForm.original_price) : parseFloat(fertForm.price) * 1.15,
      stock: parseInt(fertForm.stock || '100', 10),
      is_active: true,
    };

    try {
      if (editingFert) {
        await api.patch(`/fertilizers/${editingFert.id}/`, payload);
        toast.success(`Fertilizer "${fertForm.name}" updated successfully!`);
      } else {
        await api.post('/fertilizers/', payload);
        toast.success(`New Fertilizer "${fertForm.name}" added to catalog!`);
      }
      setOpenFertModal(false);
      fetchFertilizers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save fertilizer product.');
    } finally {
      setSavingFert(false);
    }
  };

  const handleDeleteFertilizer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`/fertilizers/${id}/`);
      toast.success(`Fertilizer "${name}" removed.`);
      fetchFertilizers();
      fetchStats();
    } catch (err) {
      toast.error('Failed to delete fertilizer product.');
    }
  };

  // Filtered lists
  const filteredUsers = usersList.filter(
    (u) =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredFarms = farmsList.filter(
    (f) =>
      f.name?.toLowerCase().includes(farmSearch.toLowerCase()) ||
      f.district?.toLowerCase().includes(farmSearch.toLowerCase()) ||
      f.state?.toLowerCase().includes(farmSearch.toLowerCase()) ||
      f.owner_name?.toLowerCase().includes(farmSearch.toLowerCase())
  );

  const filteredFertilizers = fertilizers.filter((f) => {
    const matchesSearch =
      f.name?.toLowerCase().includes(fertSearch.toLowerCase()) ||
      f.brand?.toLowerCase().includes(fertSearch.toLowerCase()) ||
      f.fertilizer_type?.toLowerCase().includes(fertSearch.toLowerCase());
    const matchesCategory =
      fertCategoryFilter === 'ALL' || f.fertilizer_type === fertCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const u = stats?.users ?? {};
  const f = stats?.farms ?? {};
  const m = stats?.marketplace ?? {};
  const b = stats?.bookings ?? {};
  const n = stats?.notifications ?? {};

  return (
    <DashboardLayout>
      <Box sx={{ pb: 6 }}>
        {/* ── Top Header ──────────────────────────────────────────────────── */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
                Admin Control Center
              </Typography>
              <Chip
                label="LIVE SYSTEM"
                size="small"
                color="success"
                sx={{ fontWeight: 800, fontSize: '0.65rem', height: 22 }}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Welcome, <b>{user?.name || 'Administrator'}</b> 👋 — Manage users, platform metrics, and fertilizer catalog.
            </Typography>
          </Box>
        </Stack>

        {statsError && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(ROSE, 0.1), border: '1px solid', borderColor: alpha(ROSE, 0.3), color: ROSE, borderRadius: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <WarningAmberOutlined />
              <Typography variant="body2" fontWeight={600}>{statsError}</Typography>
            </Stack>
          </Paper>
        )}

        {/* ── Overview Stat Cards Grid ────────────────────────────────────── */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<GroupOutlined />} label="Total Registered Users" value={loadingStats ? null : u.total} sub={`Farmers: ${u.farmers ?? 0} | Customers: ${u.customers ?? 0}`} accent={PURPLE} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<AgricultureOutlined />} label="Active Farms & Crops" value={loadingStats ? null : f.active} sub={`${f.active_crops ?? 0} active crops registered`} accent={GREEN} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<ShoppingCartOutlined />} label="Total Orders & Bookings" value={loadingStats ? null : m.total_orders} sub={`Pending: ${m.pending_orders ?? 0} orders`} accent={BLUE} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<MonetizationOnOutlined />}
              label="Total Revenue"
              value={loadingStats ? null : (m.total_revenue != null ? `₹${Number(m.total_revenue).toLocaleString('en-IN')}` : '₹0')}
              sub={`${m.orders_this_week ?? 0} orders this week`}
              accent={ROSE}
            />
          </Grid>
        </Grid>

        {/* ── Tabs Navigation Bar ─────────────────────────────────────────── */}
        <Paper sx={{ borderRadius: 3.5, border: '1px solid', borderColor: 'divider', mb: 3, px: 2 }}>
          <Tabs
            value={currentTab}
            onChange={(_, val) => setCurrentTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.9rem',
                minHeight: 54,
              },
            }}
          >
            <Tab icon={<StorefrontOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="Overview & Activity" />
            <Tab icon={<GroupOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label={`Users Directory (${usersList.length})`} />
            <Tab icon={<AgricultureOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label={`Farms & Crops (${farmsList.length})`} />
            <Tab icon={<ScienceOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label={`Fertilizer Catalog (${fertilizers.length})`} />
          </Tabs>
        </Paper>

        {/* ── TAB 0: OVERVIEW & RECENT ACTIVITY ────────────────────────────── */}
        {currentTab === 0 && (
          <Grid container spacing={3}>
            {/* Recent Orders */}
            <Grid item xs={12} lg={7}>
              <Paper sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography fontWeight={800} variant="subtitle1">Recent Orders</Typography>
                  <Chip label={`${stats?.recent_orders?.length ?? 0} Recent`} size="small" variant="outlined" />
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: (t) => alpha(t.palette.action.hover, 0.5) }}>
                        <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem' }}>Order ID</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem' }}>Crop</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem' }}>Customer</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem' }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loadingStats ? (
                        <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
                      ) : stats?.recent_orders?.length === 0 ? (
                        <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No recent orders.</TableCell></TableRow>
                      ) : (
                        stats?.recent_orders?.map((order) => (
                          <TableRow key={order.order_id} hover>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: PURPLE, fontWeight: 700 }}>
                              {order.order_id}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{order.crop_name}</TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>{order.customer}</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: GREEN }}>₹{Number(order.total_price).toLocaleString('en-IN')}</TableCell>
                            <TableCell><StatusChip status={order.status} /></TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* Recent Users */}
            <Grid item xs={12} lg={5}>
              <Paper sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden', height: '100%' }}>
                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography fontWeight={800} variant="subtitle1">Recent Registrations</Typography>
                  <Chip label="Latest 5" size="small" variant="outlined" />
                </Box>
                <Stack divider={<Divider />}>
                  {loadingStats ? (
                    <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={24} /></Box>
                  ) : stats?.recent_users?.map((u) => (
                    <Stack key={u.email} direction="row" alignItems="center" spacing={1.5} sx={{ px: 2.5, py: 1.6 }}>
                      <Avatar sx={{ width: 38, height: 38, bgcolor: alpha(PURPLE, 0.12), color: PURPLE, fontSize: '0.9rem', fontWeight: 800 }}>
                        {u.name?.[0]?.toUpperCase() ?? '?'}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>{u.name}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>{u.email}</Typography>
                      </Box>
                      <RoleChip role={u.role} />
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* ── TAB 1: USERS DIRECTORY ───────────────────────────────────────── */}
        {currentTab === 1 && (
          <Paper sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between" sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <TextField
                select
                size="small"
                label="Role Filter"
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="ALL">All Roles</MenuItem>
                <MenuItem value="FARMER">Farmers</MenuItem>
                <MenuItem value="CUSTOMER">Customers</MenuItem>
              </TextField>
              <TextField
                size="small"
                placeholder="Search user by name or email address..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                sx={{ flex: 1, maxWidth: 420, ml: { sm: 'auto' } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>

            <TableContainer sx={{ maxHeight: 520 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: (t) => alpha(t.palette.action.hover, 0.5) }}>
                    <TableCell sx={{ fontWeight: 800 }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Email Address</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Registered Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingUsers ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}><CircularProgress size={24} /></TableCell></TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>No registered users found.</TableCell></TableRow>
                  ) : (
                    filteredUsers.map((u) => (
                      <TableRow key={u.id || u.email} hover>
                        <TableCell sx={{ fontWeight: 600 }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(BLUE, 0.1), color: BLUE, fontSize: '0.8rem', fontWeight: 700 }}>
                              {u.name?.[0]?.toUpperCase() ?? '?'}
                            </Avatar>
                            <Typography variant="body2" fontWeight={700}>{u.name}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{u.email}</TableCell>
                        <TableCell><RoleChip role={u.role} /></TableCell>
                        <TableCell>
                          <Chip label={u.is_active ? 'Active' : 'Inactive'} size="small" color={u.is_active ? 'success' : 'default'} variant="outlined" sx={{ fontWeight: 700, fontSize: '0.68rem' }} />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* ── TAB 2: FARMS & CROPS DIRECTORY ──────────────────────────────── */}
        {currentTab === 2 && (
          <Paper sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <TextField
                size="small"
                placeholder="Search farm by name, district, or owner..."
                value={farmSearch}
                onChange={(e) => setFarmSearch(e.target.value)}
                sx={{ maxWidth: 420, flex: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                Total Farms: <b>{farmsList.length}</b>
              </Typography>
            </Box>

            <TableContainer sx={{ maxHeight: 520 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: (t) => alpha(t.palette.action.hover, 0.5) }}>
                    <TableCell sx={{ fontWeight: 800 }}>Farm Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Owner Farmer</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Size (Acres)</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Active Crops</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingFarms ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><CircularProgress size={24} /></TableCell></TableRow>
                  ) : filteredFarms.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>No active farms found.</TableCell></TableRow>
                  ) : (
                    filteredFarms.map((farm) => (
                      <TableRow key={farm.id} hover>
                        <TableCell sx={{ fontWeight: 700, color: GREEN }}>{farm.name}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{farm.owner_name || 'Farmer'}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                          {farm.district}, {farm.state}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{farm.area_acres} Acres</TableCell>
                        <TableCell>
                          <Chip label={`${farm.active_crops_count || 0} Crops`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell><StatusChip status="ACTIVE" /></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* ── TAB 3: FERTILIZER CATALOG MANAGEMENT ───────────────────────── */}
        {currentTab === 3 && (
          <Paper sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between" sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, width: '100%' }}>
                <TextField
                  select
                  size="small"
                  label="Category"
                  value={fertCategoryFilter}
                  onChange={(e) => setFertCategoryFilter(e.target.value)}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="ALL">All Categories</MenuItem>
                  {FERTILIZER_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  size="small"
                  placeholder="Search fertilizer products by name, brand..."
                  value={fertSearch}
                  onChange={(e) => setFertSearch(e.target.value)}
                  sx={{ flex: 1, maxWidth: 360 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ ml: 'auto' }}>
                <Typography variant="caption" color="text.secondary">
                  Showing <b>{filteredFertilizers.length}</b> products
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAddFert}
                  sx={{
                    bgcolor: '#22c55e',
                    '&:hover': { bgcolor: '#16a34a' },
                    fontWeight: 700,
                    borderRadius: 2.5,
                    textTransform: 'none',
                    ml: 'auto',
                  }}
                >
                  Add Fertilizer
                </Button>
              </Stack>
            </Stack>

            <TableContainer sx={{ maxHeight: 520 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: (t) => alpha(t.palette.action.hover, 0.5) }}>
                    <TableCell sx={{ fontWeight: 800 }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Brand</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Price (₹)</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Packaging Unit</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Stock</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingFertilizers ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}><CircularProgress size={24} /></TableCell></TableRow>
                  ) : filteredFertilizers.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>No fertilizer products found.</TableCell></TableRow>
                  ) : (
                    filteredFertilizers.map((fert) => (
                      <TableRow key={fert.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            {fert.image_url ? (
                              <Box
                                component="img"
                                src={fert.image_url}
                                alt={fert.name}
                                sx={{ width: 36, height: 36, borderRadius: 2, objectFit: 'contain', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}
                              />
                            ) : (
                              <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(GREEN, 0.1), color: GREEN }}>
                                <ScienceOutlined fontSize="small" />
                              </Avatar>
                            )}
                            <Typography variant="body2" fontWeight={700}>{fert.name}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{fert.brand}</TableCell>
                        <TableCell>
                          <Chip label={fert.fertilizer_type} size="small" variant="outlined" color="primary" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, color: GREEN }}>₹{fert.price}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>{fert.unit}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{fert.stock}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Edit Product">
                              <IconButton size="small" onClick={() => handleOpenEditFert(fert)} color="primary">
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Product">
                              <IconButton size="small" onClick={() => handleDeleteFertilizer(fert.id, fert.name)} color="error">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

      </Box>

      {/* ── Add / Edit Fertilizer Dialog Modal ──────────────────────────── */}
      <Dialog open={openFertModal} onClose={() => setOpenFertModal(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSaveFertilizer}>
          <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid', borderColor: 'divider' }}>
            {editingFert ? 'Edit Fertilizer Product' : 'Add New Fertilizer Product'}
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    label="Product Name"
                    fullWidth
                    required
                    value={fertForm.name}
                    onChange={(e) => setFertForm({ ...fertForm, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Brand Name"
                    fullWidth
                    required
                    value={fertForm.brand}
                    onChange={(e) => setFertForm({ ...fertForm, brand: e.target.value })}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Category / Type"
                    fullWidth
                    value={fertForm.fertilizer_type}
                    onChange={(e) => setFertForm({ ...fertForm, fertilizer_type: e.target.value })}
                  >
                    {FERTILIZER_TYPES.map((t) => (
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Packaging Unit"
                    fullWidth
                    placeholder="e.g. 50kg Bag, 1 Litre Bottle"
                    value={fertForm.unit}
                    onChange={(e) => setFertForm({ ...fertForm, unit: e.target.value })}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={6} sm={4}>
                  <TextField
                    label="Price (₹)"
                    type="number"
                    fullWidth
                    required
                    value={fertForm.price}
                    onChange={(e) => setFertForm({ ...fertForm, price: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField
                    label="Original Price (₹)"
                    type="number"
                    fullWidth
                    value={fertForm.original_price}
                    onChange={(e) => setFertForm({ ...fertForm, original_price: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Stock Quantity"
                    type="number"
                    fullWidth
                    value={fertForm.stock}
                    onChange={(e) => setFertForm({ ...fertForm, stock: e.target.value })}
                  />
                </Grid>
              </Grid>

              <TextField
                label="Suitable Crops"
                fullWidth
                placeholder="e.g. Wheat, Rice, Maize, Vegetables"
                value={fertForm.crops}
                onChange={(e) => setFertForm({ ...fertForm, crops: e.target.value })}
              />

              <TextField
                label="Prevents / Treats"
                fullWidth
                placeholder="e.g. Nitrogen Deficiency, Stunted Growth"
                value={fertForm.prevents}
                onChange={(e) => setFertForm({ ...fertForm, prevents: e.target.value })}
              />

              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={fertForm.description}
                onChange={(e) => setFertForm({ ...fertForm, description: e.target.value })}
              />

              <TextField
                label="Image URL (Optional)"
                fullWidth
                placeholder="Leave blank for automatic category packaging visual"
                value={fertForm.image_url}
                onChange={(e) => setFertForm({ ...fertForm, image_url: e.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenFertModal(false)} color="inherit" sx={{ fontWeight: 700 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={savingFert}
              sx={{ bgcolor: '#22c55e', '&:hover': { bgcolor: '#16a34a' }, fontWeight: 700 }}
            >
              {savingFert ? <CircularProgress size={20} color="inherit" /> : (editingFert ? 'Update Product' : 'Add Product')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </DashboardLayout>
  );
}
