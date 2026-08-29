import { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, Chip, Grid, Paper, Skeleton,
  Stack, Typography, alpha,
} from '@mui/material';
import {
  AddShoppingCartOutlined, AgricultureOutlined, AutoAwesome,
  CheckCircleOutlined, LocalShippingOutlined,
  Refresh, ShoppingCartOutlined, TrendingUp,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';
import api from '../../services/api';

const GROQ_KEY   = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';

const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: i => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.07 } }) };

function StatCard({ icon, label, value, sub, color, loading, i, to }) {
  const inner = (
    <Paper sx={{
      p: 2.5, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%',
      position: 'relative', overflow: 'hidden',
      '&:hover': { boxShadow: `0 8px 32px ${alpha(color, 0.15)}`, transform: 'translateY(-2px)' },
      transition: 'all 0.2s ease', cursor: to ? 'pointer' : 'default',
    }}>
      <Box sx={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '50%', bgcolor: alpha(color, 0.08), transform: 'translate(20px,-20px)' }} />
      <Box sx={{ width: 40, height: 40, borderRadius: 2.5, bgcolor: alpha(color, 0.12), color, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>{icon}</Box>
      {loading ? <Skeleton width={80} height={32} /> : <Typography variant="h5" fontWeight={800} sx={{ color, lineHeight: 1 }}>{value}</Typography>}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{label}</Typography>
      {sub && <Typography variant="caption" color="text.disabled">{sub}</Typography>}
    </Paper>
  );
  return (
    <motion.div initial="hidden" animate="visible" custom={i} variants={fadeUp} style={{ height: '100%' }}>
      {to ? <Box component={Link} to={to} sx={{ textDecoration: 'none', display: 'block', height: '100%' }}>{inner}</Box> : inner}
    </motion.div>
  );
}

/* ── Fetch AI insights via Groq (or fall back to backend Gemini) ─────────── */
async function fetchGroqInsights(stats, orders) {
  // Try Groq first if key is set
  if (GROQ_KEY) {
    const orderSummary = orders.length
      ? orders.slice(0, 5).map(o => `${o.crop_name} (${o.quantity_kg}kg, ₹${o.price_per_kg}/kg)`).join(', ')
      : 'No orders yet';

    const prompt = `You are an expert agricultural market advisor for Indian customers.
A customer on CropX has:
- Total orders: ${stats.total_orders}, Active: ${stats.active_orders}, Delivered: ${stats.delivered_orders}
- Total spent: ₹${stats.total_spent?.toLocaleString('en-IN') || 0}
- Available listings in marketplace: ${stats.available_listings}
- Recent purchases: ${orderSummary}

Generate exactly 5 personalised, actionable market and buying insights.
Return ONLY a valid JSON array (no markdown, no code fences):
[{"icon":"<emoji>","title":"Short title (max 8 words)","text":"Practical advice (2 sentences)","type":"market|weather|crop|health|price","color":"<hex>"}]
Colors: market=#22c55e, weather=#3b82f6, crop=#2E7D32, health=#f59e0b, price=#8b5cf6`;

    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: 'user', content: prompt }], max_tokens: 600, temperature: 0.7 }),
      });
      if (res.ok) {
        const data = await res.json();
        let raw = data?.choices?.[0]?.message?.content?.trim() || '';
        raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
        return JSON.parse(raw);
      }
    } catch { /* fall through */ }
  }

  // Fall back to backend Gemini endpoint
  try {
    const { data } = await api.get('/ai/insights/');
    return data.insights || [];
  } catch {
    return null;
  }
}

const FALLBACK_INSIGHTS = (stats) => [
  { icon: '🛒', title: 'Great time to stock up', text: `${stats?.available_listings || 0} active listings are available. Buying in bulk from farmers often gets you better rates.`, type: 'market', color: '#22c55e' },
  { icon: '📦', title: 'Track active orders', text: `You have ${stats?.active_orders || 0} active order(s). Keep an eye on the Orders page for status updates.`, type: 'market', color: '#3b82f6' },
  { icon: '🌾', title: 'Seasonal crop advice', text: 'Monsoon season boosts supply of rice, vegetables, and pulses. Prices typically dip 10–15% during harvest months.', type: 'crop', color: '#2E7D32' },
  { icon: '💰', title: 'Spending optimisation', text: `You've spent ${fmt(stats?.total_spent || 0)} so far. Booking directly with farmers via the booking feature saves 5–12%.`, type: 'price', color: '#8b5cf6' },
  { icon: '🔬', title: 'Try the Crop Scanner', text: 'Upload any crop photo to instantly identify it, check its health, and see the live market price — all AI-powered.', type: 'health', color: '#f59e0b' },
];

export default function CustomerDashboard() {
  usePageTitle('Dashboard');
  const { user } = useAuth();

  const [stats, setStats]               = useState(null);
  const [orders, setOrders]             = useState([]);
  const [insights, setInsights]         = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const fetchStats = useCallback(async () => {
    try { const { data } = await api.get('/dashboard/customer-stats/'); setStats(data); return data; }
    catch { const f = { total_orders: 0, active_orders: 0, delivered_orders: 0, total_spent: 0, available_listings: 0 }; setStats(f); return f; }
    finally { setLoadingStats(false); }
  }, []);

  const fetchOrders = useCallback(async () => {
    try { const { data } = await api.get('/orders/'); return data.results ?? data; }
    catch { return []; }
  }, []);

  const loadInsights = useCallback(async (statsData, ordersData) => {
    setLoadingInsights(true);
    try {
      const result = await fetchGroqInsights(statsData, ordersData || []);
      setInsights(result?.slice(0, 5) || FALLBACK_INSIGHTS(statsData));
    } catch {
      setInsights(FALLBACK_INSIGHTS(statsData));
    } finally { setLoadingInsights(false); }
  }, []);

  useEffect(() => {
    fetchStats().then(statsData => {
      fetchOrders().then(ordersData => {
        setOrders(ordersData);
        loadInsights(statsData, ordersData);
      });
    });
  }, [fetchStats, fetchOrders, loadInsights]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const kpis = [
    { icon: <ShoppingCartOutlined />,  label: 'Total Orders',      value: stats?.total_orders ?? 0,     color: '#3b82f6', sub: 'All time',     to: '/customer/orders' },
    { icon: <LocalShippingOutlined />, label: 'Active Orders',     value: stats?.active_orders ?? 0,    color: '#f59e0b', sub: 'In progress',  to: '/customer/orders' },
    { icon: <CheckCircleOutlined />,   label: 'Delivered',         value: stats?.delivered_orders ?? 0, color: '#22c55e', sub: 'Completed',    to: '/customer/orders' },
    { icon: <TrendingUp />,            label: 'Total Spent',       value: fmt(stats?.total_spent ?? 0), color: '#8b5cf6', sub: 'Lifetime' },
    { icon: <AgricultureOutlined />,   label: 'Active Listings',   value: stats?.available_listings ?? 0, color: '#2E7D32', sub: 'From farmers', to: '/customer/marketplace' },
  ];

  return (
    <DashboardLayout title={`${greeting}, ${user?.name?.split(' ')[0] || 'there'} 👋`}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h4" fontWeight={800}>{greeting}, {user?.name || 'Customer'} 👋</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>Here's your activity overview.</Typography>
        </Box>

        {/* KPI Cards */}
        <Grid container spacing={2.5}>
          {kpis.map((k, i) => (
            <Grid item xs={6} sm={4} key={k.label} sx={{ minWidth: 160 }}>
              <StatCard {...k} i={i} loading={loadingStats} />
            </Grid>
          ))}
        </Grid>

        {/* AI Insights Panel */}
        <motion.div initial="hidden" animate="visible" custom={5} variants={fadeUp}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha('#f97316', 0.1), color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AutoAwesome fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700}>AI Market Insights</Typography>
                  <Typography variant="caption" color="text.secondary">Personalised for you · Powered by Groq & Gemini</Typography>
                </Box>
              </Stack>
              <Button size="small" startIcon={<Refresh />} onClick={() => stats && loadInsights(stats, orders)} disabled={loadingInsights} sx={{ borderRadius: 2 }}>
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
                <Typography variant="body2" color="text.secondary">Click Refresh to generate personalised recommendations.</Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {insights.map((ins, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.07 }}>
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
                        <Chip label={ins.type} size="small" sx={{ ml: 'auto', alignSelf: 'flex-start', height: 20, fontSize: '0.62rem', fontWeight: 700, bgcolor: alpha(ins.color || '#f97316', 0.1), color: ins.color || '#f97316', flexShrink: 0 }} />
                      )}
                    </Box>
                  </motion.div>
                ))}
              </Stack>
            )}
          </Paper>
        </motion.div>

        {/* Quick Actions */}
        <Grid container spacing={3}>
          {[
            { icon: <AgricultureOutlined sx={{ fontSize: 44 }} />, color: '#2E7D32', title: 'Browse Farms', desc: 'View farms, message farmers directly, and book crops.', to: '/customer/farms', label: 'View farms' },
            { icon: <AddShoppingCartOutlined sx={{ fontSize: 44 }} />, color: '#3b82f6', title: 'Marketplace', desc: 'Browse active crop listings and place orders instantly.', to: '/customer/marketplace', label: 'Browse crops', btnColor: '#3b82f6' },
            { icon: <Typography sx={{ fontSize: 44 }}>🔬</Typography>, color: '#ef4444', title: 'Crop Scanner', desc: 'Upload a photo — AI identifies the crop and shows live price.', to: '/customer/scan', label: 'Scan a crop', btnColor: '#ef4444' },
          ].map((a, i) => (
            <Grid item xs={12} md={4} key={a.title}>
              <motion.div initial="hidden" animate="visible" custom={6 + i} variants={fadeUp}>
                <Paper sx={{ p: 3, borderRadius: 4, border: '2px dashed', borderColor: alpha(a.color, 0.2), textAlign: 'center', bgcolor: alpha(a.color, 0.02), height: '100%' }}>
                  <Box sx={{ color: alpha(a.color, 0.35), mb: 1.5 }}>{a.icon}</Box>
                  <Typography variant="subtitle1" fontWeight={700}>{a.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 0.5 }}>{a.desc}</Typography>
                  <Button component={Link} to={a.to} variant="contained" size="small"
                    sx={{ borderRadius: 2, bgcolor: a.btnColor, '&:hover': a.btnColor ? { bgcolor: a.btnColor, filter: 'brightness(0.85)' } : undefined }}>
                    {a.label}
                  </Button>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </DashboardLayout>
  );
}
