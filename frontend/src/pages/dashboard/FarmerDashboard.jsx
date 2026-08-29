import { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, Chip, Grid, IconButton, Paper,
  Skeleton, Stack, Tooltip, Typography, alpha,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  AgricultureOutlined, ArrowForward, AutoAwesome,
  CloudOutlined, GrassOutlined, Inbox, LocationOn,
  Refresh, TrendingDown, TrendingFlat, TrendingUp,
  WaterDropOutlined, WbSunnyOutlined, ShoppingBagOutlined,
  CheckCircle, HourglassEmpty, LocalShipping, Science,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';
import api from '../../services/api';

const GROQ_KEY   = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';

const fmt = n =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: i => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.07 } }),
};

/* ── KPI card ─────────────────────────────────────────────────────────────── */
function KpiCard({ icon, label, value, sub, color, loading, i }) {
  return (
    <motion.div initial="hidden" animate="visible" custom={i} variants={fadeUp} style={{ height: '100%' }}>
      <Paper sx={{
        p: 2.5, borderRadius: 4, border: '1px solid', borderColor: 'divider',
        height: '100%', position: 'relative', overflow: 'hidden',
        '&:hover': { boxShadow: `0 8px 32px ${alpha(color, 0.15)}`, transform: 'translateY(-2px)' },
        transition: 'all 0.2s ease',
      }}>
        <Box sx={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '50%', bgcolor: alpha(color, 0.08), transform: 'translate(20px,-20px)' }} />
        <Box sx={{ width: 40, height: 40, borderRadius: 2.5, bgcolor: alpha(color, 0.12), color, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
          {icon}
        </Box>
        {loading
          ? <Skeleton width={80} height={32} />
          : <Typography variant="h5" fontWeight={800} sx={{ color, lineHeight: 1 }}>{value}</Typography>
        }
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{label}</Typography>
        {sub && <Typography variant="caption" color="text.disabled">{sub}</Typography>}
      </Paper>
    </motion.div>
  );
}

/* ── Market crop card ─────────────────────────────────────────────────────── */
function CropPriceCard({ crop, i }) {
  const isUp = crop.trend === 'UP';
  const isDown = crop.trend === 'DOWN';
  const color = isUp ? '#22c55e' : isDown ? '#ef4444' : '#f59e0b';
  const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : TrendingFlat;
  const sparkData = (crop.sparkline || []).map((v, idx) => ({ v, idx }));

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06, duration: 0.35 }}>
      <Paper sx={{
        p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider',
        '&:hover': { boxShadow: `0 6px 24px ${alpha(color, 0.18)}`, borderColor: alpha(color, 0.4) },
        transition: 'all 0.2s ease', height: '100%',
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="caption" sx={{ fontSize: 22, lineHeight: 1 }}>{crop.emoji}</Typography>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 0.5 }}>{crop.name}</Typography>
            <Typography variant="caption" color="text.secondary">{crop.market_name}</Typography>
          </Box>
          <Chip
            icon={<TrendIcon sx={{ fontSize: '14px !important', color: `${color} !important` }} />}
            label={`${crop.change_percent > 0 ? '+' : ''}${crop.change_percent}%`}
            size="small"
            sx={{ bgcolor: alpha(color, 0.1), color, fontWeight: 700, fontSize: '0.7rem', height: 22 }}
          />
        </Stack>
        <Typography variant="h6" fontWeight={800} sx={{ color, mt: 1 }}>
          ₹{crop.price_per_quintal?.toLocaleString('en-IN')}
        </Typography>
        <Typography variant="caption" color="text.disabled">per quintal · {crop.state}</Typography>
        <Box sx={{ height: 40, mt: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`spark-${crop.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#spark-${crop.id})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </motion.div>
  );
}

/* ── AI Insight card ─────────────────────────────────────────────────────── */
function InsightCard({ ins, i }) {
  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 + i * 0.08 }}>
      <Box sx={{
        display: 'flex', gap: 1.5, p: 1.75, borderRadius: 2.5,
        bgcolor: alpha(ins.color || '#f97316', 0.05),
        border: '1px solid', borderColor: alpha(ins.color || '#f97316', 0.15),
        '&:hover': { borderColor: alpha(ins.color || '#f97316', 0.35), bgcolor: alpha(ins.color || '#f97316', 0.08) },
        transition: 'all 0.15s',
      }}>
        <Typography sx={{ fontSize: 20, flexShrink: 0, lineHeight: 1.4 }}>{ins.icon}</Typography>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {ins.title && <Typography variant="body2" fontWeight={700} sx={{ mb: 0.25 }}>{ins.title}</Typography>}
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{ins.text}</Typography>
        </Box>
        {ins.type && (
          <Chip label={ins.type} size="small" sx={{
            ml: 'auto', alignSelf: 'flex-start', height: 20, fontSize: '0.62rem', fontWeight: 700,
            bgcolor: alpha(ins.color || '#f97316', 0.1), color: ins.color || '#f97316', flexShrink: 0,
          }} />
        )}
      </Box>
    </motion.div>
  );
}

/* ── Fetch AI insights via Groq ──────────────────────────────────────────── */
async function fetchGroqInsights(stats) {
  if (!GROQ_KEY) return null;

  const prompt = `You are an expert agricultural advisor for Indian farmers.
A farmer on the CropX platform has:
- ${stats.farms_count} registered farm(s)
- ${stats.active_crops} active crop(s)
- Total orders: ${stats.total_orders} (${stats.pending_deliveries} pending delivery)
- Total revenue: ₹${stats.total_revenue?.toLocaleString('en-IN') || 0}
- Farm health score: ${stats.farm_health_score}%
- Weather risk: ${stats.weather_risk}

Generate exactly 5 personalised, actionable farming insights for this farmer.
Return ONLY a valid JSON array (no markdown, no code fences) of 5 objects:
[{"icon":"<emoji>","title":"Short title (max 8 words)","text":"Practical advice (2 sentences)","type":"market|weather|crop|health|price","color":"<hex>"}]
Colors: market=#22c55e, weather=#3b82f6, crop=#2E7D32, health=#f59e0b, price=#8b5cf6`;

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      temperature: 0.7,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  let raw = data?.choices?.[0]?.message?.content?.trim() || '';
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  return JSON.parse(raw);
}

const FALLBACK_INSIGHTS = (stats) => [
  { icon: '📈', title: 'Revenue on track', text: `You've earned ₹${(stats?.total_revenue || 0).toLocaleString('en-IN')} so far. Listing more crops during peak demand months can push this higher.`, type: 'price', color: '#8b5cf6' },
  { icon: '🌾', title: 'Crop diversification tip', text: `You have ${stats?.active_crops || 0} active crops. Adding 1–2 more varieties with staggered harvest dates reduces income risk.`, type: 'crop', color: '#2E7D32' },
  { icon: '📦', title: 'Pending orders need attention', text: `${stats?.pending_deliveries || 0} order(s) are awaiting delivery. Prompt fulfilment improves your marketplace rating.`, type: 'market', color: '#22c55e' },
  { icon: '🌤️', title: 'Weather risk is ' + (stats?.weather_risk || 'low'), text: 'Monitor your crops for moisture stress and adjust irrigation schedules according to local forecasts.', type: 'weather', color: '#3b82f6' },
  { icon: '💡', title: 'Improve farm health score', text: `Your farm health score is ${stats?.farm_health_score || 0}%. Regular soil testing and timely fertilisation can push it above 90%.`, type: 'health', color: '#f59e0b' },
];

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function FarmerDashboard() {
  usePageTitle('Dashboard');
  const { user } = useAuth();

  const [stats, setStats]           = useState(null);
  const [farms, setFarms]           = useState([]);
  const [crops, setCrops]           = useState([]);
  const [bookings, setBookings]     = useState([]);
  const [fertOrders, setFertOrders] = useState([]);
  const [market, setMarket]         = useState([]);
  const [insights, setInsights]     = useState([]);

  const [loadingStats, setLoadingStats]   = useState(true);
  const [loadingFarms, setLoadingFarms]   = useState(true);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/dashboard/stats/');
      setStats(data);
      return data;
    } catch {
      const fallback = { farms_count: 0, active_crops: 0, total_orders: 0, pending_deliveries: 0, total_revenue: 0, today_income: 0, farm_health_score: 0, weather_risk: 'N/A', market_opportunity: 0 };
      setStats(fallback);
      return fallback;
    } finally { setLoadingStats(false); }
  }, []);

  const fetchFarmsAndCrops = useCallback(async () => {
    setLoadingFarms(true);
    try {
      const [resFarms, resCrops, resBookings, resFert] = await Promise.all([
        api.get('/farms/'),
        api.get('/crops/'),
        api.get('/bookings/'),
        api.get('/fertilizers/orders/'),
      ]);

      const farmList = resFarms.data?.results || (Array.isArray(resFarms.data) ? resFarms.data : []);
      const cropList = resCrops.data?.results || (Array.isArray(resCrops.data) ? resCrops.data : []);
      const bookList = resBookings.data?.results || (Array.isArray(resBookings.data) ? resBookings.data : []);
      const fertList = resFert.data?.results || (Array.isArray(resFert.data) ? resFert.data : []);

      setFarms(farmList);
      setCrops(cropList);
      setBookings(bookList);
      setFertOrders(fertList);
    } catch (err) {
      console.error('Error fetching dashboard entities:', err);
    } finally {
      setLoadingFarms(false);
    }
  }, []);

  const fetchMarket = useCallback(async () => {
    setLoadingMarket(true);
    try {
      const { data } = await api.get('/market/highlights/');
      setMarket(data.results || []);
    } catch { setMarket([]); } finally { setLoadingMarket(false); }
  }, []);

  const loadInsights = useCallback(async (statsData) => {
    setLoadingInsights(true);
    try {
      const result = await fetchGroqInsights(statsData);
      setInsights(result?.slice(0, 5) || FALLBACK_INSIGHTS(statsData));
    } catch {
      setInsights(FALLBACK_INSIGHTS(statsData));
    } finally { setLoadingInsights(false); }
  }, []);

  useEffect(() => {
    fetchStats().then(data => loadInsights(data));
    fetchFarmsAndCrops();
    fetchMarket();
  }, [fetchStats, fetchFarmsAndCrops, fetchMarket, loadInsights]);

  // Auto-refresh market every 45 s
  useEffect(() => { const t = setInterval(fetchMarket, 45000); return () => clearInterval(t); }, [fetchMarket]);

  const kpis = [
    { icon: <TrendingUp />,          label: 'Total Revenue',    value: fmt(stats?.total_revenue ?? 0),  color: '#22c55e', sub: 'Gross crop sales' },
    { icon: <WbSunnyOutlined />,     label: 'Net Income',       value: fmt(stats?.net_income ?? 0),     color: '#10b981', sub: 'Revenue minus expenses' },
    { icon: <WbSunnyOutlined />,     label: "Today's Income",   value: fmt(stats?.today_income ?? 0),   color: '#f59e0b', sub: 'Updated live' },
    { icon: <GrassOutlined />,       label: 'Active Crops',     value: stats?.active_crops ?? crops.length, color: '#2E7D32', sub: `Across ${farms.length || stats?.farms_count || 0} farms` },
    { icon: <Inbox />,               label: 'Total Orders',     value: stats?.total_orders ?? bookings.length, color: '#3b82f6', sub: `${stats?.pending_deliveries ?? 0} pending` },
    { icon: <AgricultureOutlined />, label: 'Farm Health',      value: `${stats?.farm_health_score ?? 88}%`, color: '#22c55e', sub: 'From your farm data' },
    { icon: <CloudOutlined />,       label: 'Weather Risk',     value: stats?.weather_risk ?? 'LOW',   color: '#10b981', sub: 'Current forecast' },
    { icon: <WaterDropOutlined />,   label: 'Market Score',     value: `${stats?.market_opportunity ?? 82}`, color: '#8b5cf6', sub: 'Opportunity index' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <DashboardLayout title={`${greeting}, ${user?.name?.split(' ')[0] || 'Farmer'} 👋`}>
      <Stack spacing={3.5}>

        {/* KPI Grid */}
        <Grid container spacing={2}>
          {kpis.map((k, i) => (
            <Grid item xs={6} sm={4} md={3} key={k.label}>
              <KpiCard {...k} i={i} loading={loadingStats} />
            </Grid>
          ))}
        </Grid>

        {/* Section 1: My Registered Farms (5-4 Farms Grid) */}
        <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 36, height: 36, borderRadius: 2.5, bgcolor: alpha('#2E7D32', 0.1), color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AgricultureOutlined />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={800}>My Registered Farms ({farms.length})</Typography>
                  <Typography variant="caption" color="text.secondary">Real-time land records, soil parameters & irrigation systems</Typography>
                </Box>
              </Stack>
              <Button component={Link} to="/farmer/farms" endIcon={<ArrowForward />} size="small" variant="outlined" sx={{ borderRadius: 2.5, fontWeight: 700 }}>
                Manage All Farms
              </Button>
            </Stack>

            {loadingFarms ? (
              <Grid container spacing={2}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Grid item xs={12} sm={6} md={3} key={i}>
                    <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 3 }} />
                  </Grid>
                ))}
              </Grid>
            ) : farms.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No farms registered yet.</Typography>
                <Button component={Link} to="/farmer/farms" variant="contained" size="small" sx={{ mt: 1.5, borderRadius: 2 }}>
                  Add First Farm
                </Button>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {farms.map((farm, idx) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={farm.id || idx}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider',
                        bgcolor: alpha('#2E7D32', 0.02),
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: alpha('#2E7D32', 0.4), boxShadow: `0 6px 20px ${alpha('#000', 0.08)}`, transform: 'translateY(-2px)' },
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Typography variant="subtitle2" fontWeight={800} noWrap sx={{ maxWidth: '75%' }}>
                            {farm.name}
                          </Typography>
                          <Chip label={`${farm.area_acres} Acres`} size="small" color="success" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800 }} />
                        </Stack>

                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <LocationOn sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {farm.village || farm.district}, {farm.state}
                          </Typography>
                        </Stack>

                        <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
                          <Chip label={`Soil: ${farm.soil_type || 'Loamy'}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                          <Chip label={`Water: ${farm.irrigation_type || 'Drip'}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                        </Stack>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </motion.div>

        {/* Section 2: Recent Crop Bookings & Orders Table */}
        <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 36, height: 36, borderRadius: 2.5, bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBagOutlined />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={800}>Recent Crop Bookings & Orders ({bookings.length})</Typography>
                  <Typography variant="caption" color="text.secondary">Real-time marketplace transactions from verified buyers</Typography>
                </Box>
              </Stack>
              <Button component={Link} to="/farmer/bookings" endIcon={<ArrowForward />} size="small" variant="outlined" sx={{ borderRadius: 2.5, fontWeight: 700 }}>
                View All Deals
              </Button>
            </Stack>

            {bookings.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No bookings received yet.</Typography>
              </Box>
            ) : (
              <TableContainer component={Box} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: alpha('#3b82f6', 0.05) }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Customer Name</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Crop Item</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Total Value</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bookings.slice(0, 5).map((b, idx) => {
                      const totalVal = b.listing ? Number(b.quantity_kg) * Number(b.listing.price_per_kg) : 0;
                      const statusColor = b.status === 'COMPLETED' ? 'success' : b.status === 'BOOKED' ? 'info' : 'warning';
                      return (
                        <TableRow key={b.id || idx} hover>
                          <TableCell sx={{ fontWeight: 700 }}>{b.customer_name || b.customer_email || 'Verified Buyer'}</TableCell>
                          <TableCell>{b.crop_name || b.listing?.crop_name || 'Crop Produce'}</TableCell>
                          <TableCell>{b.quantity_kg?.toLocaleString('en-IN')} kg</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>
                            ₹{totalVal.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={b.status}
                              size="small"
                              color={statusColor}
                              sx={{ height: 22, fontSize: '0.68rem', fontWeight: 800 }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </motion.div>

        {/* Section 3: Active Crops Summary Grid */}
        <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 36, height: 36, borderRadius: 2.5, bgcolor: alpha('#2E7D32', 0.1), color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GrassOutlined />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={800}>Active Crops ({crops.length})</Typography>
                  <Typography variant="caption" color="text.secondary">Current growth stages, yield forecasts & crop health</Typography>
                </Box>
              </Stack>
              <Button component={Link} to="/farmer/crops" endIcon={<ArrowForward />} size="small" variant="outlined" sx={{ borderRadius: 2.5, fontWeight: 700 }}>
                Manage Crops
              </Button>
            </Stack>

            {crops.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No active crops registered.</Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {crops.slice(0, 6).map((crop, idx) => (
                  <Grid item xs={12} sm={6} md={4} key={crop.id || idx}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider',
                        bgcolor: alpha('#2E7D32', 0.02),
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: alpha('#2E7D32', 0.35), boxShadow: `0 6px 20px ${alpha('#000', 0.06)}` },
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle2" fontWeight={800} noWrap sx={{ maxWidth: '70%' }}>
                            {crop.name}
                          </Typography>
                          <Chip label={crop.current_stage || 'Active'} size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                        </Stack>

                        <Typography variant="caption" color="text.secondary" noWrap>
                          Variety: <strong>{crop.variety || 'Standard'}</strong> · {crop.farm_name || 'My Farm'}
                        </Typography>

                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">Est. Yield: <strong>{Number(crop.expected_yield_kg).toLocaleString('en-IN')} kg</strong></Typography>
                          <Chip label={crop.health_status || 'Good'} size="small" color={crop.health_status === 'EXCELLENT' ? 'success' : 'info'} sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }} />
                        </Stack>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </motion.div>

        {/* Live Market Highlights */}
        <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mb: 2.5 }} spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: alpha('#2E7D32', 0.1), color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Live Market Highlights</Typography>
                  <Typography variant="caption" color="text.secondary">Real-time prices · auto-refreshes every 45s</Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Refresh now">
                  <IconButton size="small" onClick={fetchMarket} disabled={loadingMarket}>
                    <Refresh fontSize="small" sx={{ animation: loadingMarket ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
                  </IconButton>
                </Tooltip>
                <Button component={Link} to="/farmer/crop-prices" endIcon={<ArrowForward />} size="small" variant="outlined" sx={{ borderRadius: 2 }}>
                  View all prices
                </Button>
              </Stack>
            </Stack>

            {loadingMarket ? (
              <Grid container spacing={2}>
                {Array.from({ length: 6 }).map((_, i) => <Grid item xs={12} sm={6} md={4} key={i}><Skeleton variant="rectangular" height={140} sx={{ borderRadius: 3 }} /></Grid>)}
              </Grid>
            ) : market.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography sx={{ fontSize: 40, mb: 1 }}>📊</Typography>
                <Typography variant="body2" color="text.secondary">Market data unavailable</Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {market.map((crop, i) => (
                  <Grid item xs={12} sm={6} md={4} key={crop.id}>
                    <CropPriceCard crop={crop} i={i} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </motion.div>

        {/* AI Insights + Weather row */}
        <Grid container spacing={3}>
          {/* AI Insights — full Groq-powered */}
          <Grid item xs={12} md={8}>
            <motion.div initial="hidden" animate="visible" custom={5} variants={fadeUp}>
              <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha('#f97316', 0.1), color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AutoAwesome fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>AI Farm Insights</Typography>
                      <Typography variant="caption" color="text.secondary">Personalised for your farm · Powered by Groq</Typography>
                    </Box>
                  </Stack>
                  <Button size="small" startIcon={<Refresh />} onClick={() => stats && loadInsights(stats)} disabled={loadingInsights} sx={{ borderRadius: 2 }}>
                    Refresh
                  </Button>
                </Stack>

                {loadingInsights ? (
                  <Stack spacing={1.5}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 1.5, p: 1.5, borderRadius: 2.5, bgcolor: alpha('#f97316', 0.04) }}>
                        <Skeleton variant="circular" width={28} height={28} />
                        <Box sx={{ flex: 1 }}>
                          <Skeleton width="40%" height={16} />
                          <Skeleton width="80%" height={13} sx={{ mt: 0.5 }} />
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                ) : insights.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: 40, mb: 1 }}>🤖</Typography>
                    <Typography variant="body2" color="text.secondary">Click Refresh to generate personalised AI insights.</Typography>
                  </Box>
                ) : (
                  <Stack spacing={1.5}>
                    {insights.map((ins, i) => <InsightCard key={i} ins={ins} i={i} />)}
                  </Stack>
                )}
              </Paper>
            </motion.div>
          </Grid>

          {/* Weather quick-link */}
          <Grid item xs={12} md={4}>
            <motion.div initial="hidden" animate="visible" custom={6} variants={fadeUp}>
              <Paper sx={{ p: 3, borderRadius: 4, border: '2px dashed', borderColor: alpha('#3b82f6', 0.25), bgcolor: alpha('#3b82f6', 0.02), height: '100%' }}>
                <Stack spacing={1} alignItems="center" justifyContent="center" sx={{ py: 4, textAlign: 'center', height: '100%' }}>
                  <Typography sx={{ fontSize: 52 }}>🌤️</Typography>
                  <Typography variant="subtitle1" fontWeight={700}>Live Weather</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }}>
                    Get real-time forecasts and AI farming tips for your location.
                  </Typography>
                  <Button component={Link} to="/farmer/weather" size="small" variant="contained" sx={{ borderRadius: 2, mt: 1 }}>
                    Check weather
                  </Button>
                </Stack>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>

      </Stack>
    </DashboardLayout>
  );
}
