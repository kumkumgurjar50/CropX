import {
  Box, Button, Chip, Container, Grid, Paper,
  Stack, Typography, alpha, useTheme,
} from '@mui/material';
import {
  AgricultureOutlined, AnalyticsOutlined, ArrowForward,
  BugReportOutlined, CheckCircleOutlined, LockOutlined,
  StorefrontOutlined, TrendingUpOutlined,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import LandingNavbar from '../components/common/LandingNavbar';
import { usePageTitle } from '../hooks/usePageTitle';

/* ── Animation variant ───────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

/* ── Data ────────────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: <AgricultureOutlined sx={{ fontSize: 26 }} />, title: 'Farm Management',    desc: 'Manage farms, crops, soil health and irrigation from one dashboard.',          color: '#2E7D32' },
  { icon: <StorefrontOutlined  sx={{ fontSize: 26 }} />, title: 'Live Marketplace',   desc: 'List produce and connect with verified buyers. Close deals in real time.',      color: '#0284c7' },
  { icon: <BugReportOutlined   sx={{ fontSize: 26 }} />, title: 'AI Disease Scanner', desc: 'Upload a leaf photo — instant disease ID, severity, and treatment plan.',       color: '#dc2626' },
  { icon: <TrendingUpOutlined  sx={{ fontSize: 26 }} />, title: 'Market Prices',      desc: 'Live mandi prices across India so you always sell at the right time.',          color: '#d97706' },
  { icon: <AnalyticsOutlined   sx={{ fontSize: 26 }} />, title: 'Crop Analytics',     desc: 'Track yield, revenue trends, and water usage with clear visual charts.',        color: '#7c3aed' },
  { icon: <LockOutlined        sx={{ fontSize: 26 }} />, title: 'Secure & Verified',  desc: 'JWT auth, email verification, and role-based access control on every request.', color: '#0891b2' },
];

const STEPS = [
  { step: '01', role: 'Farmer',   title: 'Create your farm profile', body: 'Register, verify your email, and add your farm. List crops with quantity and price.' },
  { step: '02', role: 'Customer', title: 'Browse & scan crops',      body: 'Explore listings, scan a crop photo to identify it, get the market price, then order.' },
  { step: '03', role: 'Both',     title: 'Negotiate & confirm',      body: 'Chat directly with the farmer. Once confirmed, the deal status updates instantly.' },
];

const STATS = [
  { value: '4.8K+', label: 'Active farms' },
  { value: '92K+',  label: 'Orders placed' },
  { value: '107',   label: 'Disease classes' },
  { value: '99.9%', label: 'Platform uptime' },
];

const FARMER_FEATURES = [
  'Manage unlimited farms & crops',
  'List produce on the marketplace',
  'AI disease detection from your phone',
  'Track orders, revenue & deliveries',
  'Chat directly with buyers',
];

const CUSTOMER_FEATURES = [
  'Browse verified farm listings',
  'Scan a crop photo for instant ID',
  'See live market prices before buying',
  'Place orders & track deliveries',
  'Message farmers directly',
];

/* ── Section heading helper ──────────────────────────────────────────────── */
function SectionHead({ overline, title, subtitle }) {
  return (
    <Box sx={{ textAlign: 'center', mb: 7 }}>
      <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: 2 }}>
        {overline}
      </Typography>
      <Typography variant="h3" fontWeight={800} sx={{ mt: 0.75, mb: 1.5, letterSpacing: '-0.02em' }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, maxWidth: 520, mx: 'auto', lineHeight: 1.7 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  usePageTitle('Home');
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', overflowX: 'hidden' }}>
      <LandingNavbar />

      {/* ══════════════ HERO ════════════════════════════════════════════════ */}
      <Box sx={{ position: 'relative', pt: { xs: 10, md: 16 }, pb: { xs: 10, md: 18 }, overflow: 'hidden' }}>
        {/* Background glow */}
        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <Box sx={{
            position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
            width: '120vw', height: '80vh',
            background: isDark
              ? 'radial-gradient(ellipse at 50% 0%,rgba(46,125,50,0.18) 0%,transparent 65%)'
              : 'radial-gradient(ellipse at 50% 0%,rgba(46,125,50,0.10) 0%,transparent 65%)',
          }} />
        </Box>

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={{ xs: 5, md: 8 }} alignItems="center" justifyContent="center">

            {/* Headline */}
            <Grid item xs={12} md={6}>
              <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                <Chip label="🌱 AgriTech Platform" size="small" sx={{
                  mb: 3, fontWeight: 700, px: 1,
                  bgcolor: alpha('#2E7D32', isDark ? 0.2 : 0.08),
                  color: isDark ? '#86efac' : '#15803d',
                  border: `1px solid ${alpha('#2E7D32', 0.2)}`,
                }} />
                <Typography variant="h1" sx={{
                  fontSize: { xs: '2.5rem', sm: '3rem', md: '3.75rem' },
                  fontWeight: 900, lineHeight: 1.08, mb: 3, letterSpacing: '-0.03em',
                }}>
                  The smarter way{' '}
                  <Box component="span" sx={{
                    background: 'linear-gradient(135deg,#2E7D32 0%,#4caf50 50%,#81c784 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>
                    to grow & sell
                  </Box>{' '}crops.
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4.5, maxWidth: 480, lineHeight: 1.8, fontSize: '1.05rem' }}>
                  CropX connects farmers and customers on one intelligent platform — from listing crops
                  to AI-powered disease detection, live market prices, and real-time deal management.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button component={Link} to="/signup" variant="contained" size="large" endIcon={<ArrowForward />}
                    sx={{ px: 4, py: 1.6, fontWeight: 700, fontSize: '0.95rem', background: 'linear-gradient(135deg,#2E7D32,#4caf50)', boxShadow: '0 8px 24px rgba(46,125,50,0.38)', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 32px rgba(46,125,50,0.48)' } }}>
                    Get started free
                  </Button>
                  <Button component={Link} to="/login" variant="outlined" size="large"
                    sx={{ px: 4, py: 1.6, fontWeight: 600, fontSize: '0.95rem', borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } }}>
                    Sign in
                  </Button>
                </Stack>
              </motion.div>
            </Grid>

            {/* Feature card */}
            <Grid item xs={12} sm={10} md={6} sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
              <motion.div initial={{ opacity: 0, scale: 0.93, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}>
                <Paper sx={{
                  p: { xs: 3, md: 3.5 }, borderRadius: 4,
                  width: '100%', maxWidth: { xs: 480, md: '100%' },
                  border: '1px solid', borderColor: 'divider',
                  bgcolor: isDark ? alpha('#152015', 0.9) : 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: isDark ? '0 24px 56px rgba(0,0,0,0.4)' : '0 24px 56px rgba(46,125,50,0.10)',
                }}>
                  <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1.8 }}>
                    Platform at a glance
                  </Typography>
                  <Stack spacing={1.5} sx={{ mt: 2 }}>
                    {[
                      { icon: '🌾', label: 'Farmer Dashboard',    desc: 'Manage farms, crops, orders & listings' },
                      { icon: '🛒', label: 'Customer Portal',     desc: 'Browse, scan, order, and track deliveries' },
                      { icon: '🔬', label: 'AI Disease Scanner',  desc: 'Upload a leaf — instant diagnosis' },
                      { icon: '📊', label: 'Live Crop Prices',    desc: 'Real-time mandi data across India' },
                      { icon: '💬', label: 'Direct Messaging',    desc: 'Negotiate deals with farmers live' },
                    ].map(item => (
                      <Box key={item.label} sx={{
                        display: 'flex', alignItems: 'center', gap: 1.75,
                        p: 1.25, borderRadius: 2.5,
                        bgcolor: alpha('#2E7D32', isDark ? 0.07 : 0.04),
                        '&:hover': { bgcolor: alpha('#2E7D32', isDark ? 0.12 : 0.08) },
                        transition: 'background 0.15s',
                      }}>
                        <Typography sx={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>{item.icon}</Typography>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={700}>{item.label}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
                        </Box>
                        <CheckCircleOutlined sx={{ fontSize: 17, color: 'primary.main', flexShrink: 0 }} />
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ══════════════ STATS BAR ══════════════════════════════════════════ */}
      <Box sx={{ py: 4, borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider', bgcolor: isDark ? alpha('#172419', 0.7) : 'background.paper' }}>
        <Container maxWidth="lg">
          <Grid container spacing={2} justifyContent="center">
            {STATS.map((s, i) => (
              <Grid item xs={6} sm={3} key={s.label}>
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={900} sx={{ background: 'linear-gradient(135deg,#2E7D32,#4caf50)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      {s.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>{s.label}</Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ══════════════ HOW IT WORKS ════════════════════════════════════════ */}
      <Box sx={{ py: { xs: 9, md: 13 } }}>
        <Container maxWidth="lg">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <SectionHead overline="How it works" title="Three simple steps" subtitle="From registration to confirmed deal in minutes." />
          </motion.div>
          <Grid container spacing={3}>
            {STEPS.map((s, i) => (
              <Grid item xs={12} md={4} key={s.step}>
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} custom={i} variants={fadeUp}>
                  <Typography sx={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1, color: alpha('#2E7D32', isDark ? 0.14 : 0.07), mb: -1.5, userSelect: 'none' }}>
                    {s.step}
                  </Typography>
                  <Paper sx={{
                    p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider',
                    '&:hover': { boxShadow: '0 16px 48px rgba(46,125,50,0.10)', transform: 'translateY(-4px)' },
                    transition: 'all 0.22s ease',
                  }}>
                    <Chip label={s.role} size="small" sx={{ mb: 1.5, fontWeight: 700, fontSize: '0.7rem', bgcolor: alpha('#2E7D32', isDark ? 0.18 : 0.08), color: isDark ? '#86efac' : '#15803d' }} />
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 0.75 }}>{s.title}</Typography>
                    <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{s.body}</Typography>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ══════════════ FEATURES ════════════════════════════════════════════ */}
      <Box sx={{ py: { xs: 9, md: 13 }, bgcolor: isDark ? alpha('#152015', 0.4) : alpha('#f0fdf4', 0.6) }}>
        <Container maxWidth="lg">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <SectionHead overline="Platform capabilities" title="Everything in one place" subtitle="Built for the full farm-to-market journey." />
          </motion.div>
          <Grid container spacing={2.5}>
            {FEATURES.map((f, i) => (
              <Grid item xs={12} sm={6} md={4} key={f.title}>
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} custom={i} variants={fadeUp} style={{ height: '100%' }}>
                  <Paper sx={{
                    p: 3, height: '100%', borderRadius: 4,
                    border: '1px solid', borderColor: 'divider',
                    transition: 'all 0.22s ease',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 16px 40px ${alpha(f.color, 0.13)}`, borderColor: alpha(f.color, 0.3) },
                  }}>
                    <Box sx={{ width: 50, height: 50, borderRadius: 2.5, bgcolor: alpha(f.color, isDark ? 0.15 : 0.1), color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                      {f.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 0.75 }}>{f.title}</Typography>
                    <Typography variant="body2" color="text.secondary" lineHeight={1.75}>{f.desc}</Typography>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ══════════════ FARMER vs CUSTOMER CTA ═════════════════════════════ */}
      <Box sx={{ py: { xs: 9, md: 13 } }}>
        <Container maxWidth="lg">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <SectionHead overline="Who is CropX for?" title="Purpose-built for every role" subtitle="Two tailored portals, one connected platform." />
          </motion.div>
          <Grid container spacing={3}>
            {/* Farmer */}
            <Grid item xs={12} md={6}>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
                <Paper sx={{
                  p: { xs: 3.5, md: 4.5 }, borderRadius: 4, height: '100%',
                  background: isDark ? 'linear-gradient(145deg,#0d1b0e,#1a2e1a)' : 'linear-gradient(145deg,#f0fdf4,#dcfce7)',
                  border: '1px solid', borderColor: alpha('#2E7D32', 0.2),
                  boxShadow: `0 20px 56px ${alpha('#2E7D32', 0.10)}`,
                }}>
                  <Typography sx={{ fontSize: 48, mb: 1.5, lineHeight: 1 }}>🧑‍🌾</Typography>
                  <Chip label="Farmer" size="small" sx={{ mb: 2, bgcolor: alpha('#2E7D32', 0.14), color: '#15803d', fontWeight: 700 }} />
                  <Typography variant="h5" fontWeight={800} sx={{ mb: 1.5 }}>Grow your farm business</Typography>
                  <Stack spacing={0.75} sx={{ mb: 3 }}>
                    {FARMER_FEATURES.map(t => (
                      <Box key={t} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#2E7D32', flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary">{t}</Typography>
                      </Box>
                    ))}
                  </Stack>
                  <Button component={Link} to="/signup" variant="contained" size="large" fullWidth endIcon={<ArrowForward />}
                    sx={{ py: 1.4, fontWeight: 700, background: 'linear-gradient(135deg,#2E7D32,#4caf50)', boxShadow: '0 6px 20px rgba(46,125,50,0.35)' }}>
                    Join as Farmer
                  </Button>
                </Paper>
              </motion.div>
            </Grid>

            {/* Customer */}
            <Grid item xs={12} md={6}>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp}>
                <Paper sx={{
                  p: { xs: 3.5, md: 4.5 }, borderRadius: 4, height: '100%',
                  background: isDark ? 'linear-gradient(145deg,#0c1a2e,#0f2040)' : 'linear-gradient(145deg,#eff6ff,#dbeafe)',
                  border: '1px solid', borderColor: alpha('#1d4ed8', 0.2),
                  boxShadow: `0 20px 56px ${alpha('#1d4ed8', 0.08)}`,
                }}>
                  <Typography sx={{ fontSize: 48, mb: 1.5, lineHeight: 1 }}>🛒</Typography>
                  <Chip label="Customer" size="small" sx={{ mb: 2, bgcolor: alpha('#1d4ed8', 0.12), color: '#1d4ed8', fontWeight: 700 }} />
                  <Typography variant="h5" fontWeight={800} sx={{ mb: 1.5 }}>Source the freshest produce</Typography>
                  <Stack spacing={0.75} sx={{ mb: 3 }}>
                    {CUSTOMER_FEATURES.map(t => (
                      <Box key={t} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#1d4ed8', flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary">{t}</Typography>
                      </Box>
                    ))}
                  </Stack>
                  <Button component={Link} to="/signup" variant="contained" size="large" fullWidth endIcon={<ArrowForward />}
                    sx={{ py: 1.4, fontWeight: 700, bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af', transform: 'translateY(-1px)', boxShadow: '0 8px 24px rgba(29,78,216,0.35)' } }}>
                    Join as Customer
                  </Button>
                </Paper>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ══════════════ FINAL CTA BANNER ════════════════════════════════════ */}
      <Box sx={{
        py: { xs: 10, md: 15 },
        background: isDark
          ? 'linear-gradient(135deg,#0d2b0e 0%,#1b5e20 50%,#1a3a1a 100%)'
          : 'linear-gradient(135deg,#1b5e20 0%,#2E7D32 50%,#388e3c 100%)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 50%,rgba(255,255,255,0.04) 0%,transparent 60%)' }} />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <Typography variant="h2" sx={{ color: 'white', mb: 2, fontWeight: 900, letterSpacing: '-0.02em' }}>
              Ready to grow with CropX?
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.72)', mb: 5, fontWeight: 400, maxWidth: 460, mx: 'auto', lineHeight: 1.7 }}>
              Join thousands of farmers and buyers building the future of agriculture together.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button component={Link} to="/signup" variant="contained" size="large" endIcon={<ArrowForward />}
                sx={{ px: 5, py: 1.6, fontWeight: 800, fontSize: '1rem', bgcolor: 'white', color: '#2E7D32', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', '&:hover': { bgcolor: 'rgba(255,255,255,0.92)', transform: 'translateY(-2px)', boxShadow: '0 12px 40px rgba(0,0,0,0.22)' } }}>
                Create free account
              </Button>
              <Button component={Link} to="/login" variant="outlined" size="large"
                sx={{ px: 5, py: 1.6, fontWeight: 700, fontSize: '1rem', borderColor: 'rgba(255,255,255,0.45)', borderWidth: 1.5, color: 'white', '&:hover': { borderColor: 'white', borderWidth: 1.5, bgcolor: 'rgba(255,255,255,0.08)' } }}>
                Sign in
              </Button>
            </Stack>
          </motion.div>
        </Container>
      </Box>

      {/* ══════════════ FOOTER ══════════════════════════════════════════════ */}
      <Box component="footer" sx={{ py: 3.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Stack spacing={1.5} alignItems="center" justifyContent="center">
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box sx={{ width: 26, height: 26, borderRadius: 1.5, background: 'linear-gradient(135deg,#2E7D32,#4caf50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AgricultureOutlined sx={{ color: 'white', fontSize: 15 }} />
              </Box>
              <Typography variant="body2" fontWeight={700}>CropX</Typography>
              <Typography variant="body2" color="text.disabled">·</Typography>
              <Typography variant="body2" color="text.secondary">Smart Agriculture Platform</Typography>
            </Stack>
            <Typography variant="caption" color="text.disabled">
              © {new Date().getFullYear()} CropX. All rights reserved.
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
