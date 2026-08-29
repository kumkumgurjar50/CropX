import { useCallback, useEffect, useState } from 'react';
import {
  Box, Chip, MenuItem, Paper, Select, Skeleton, Stack,
  Step, StepLabel, Stepper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography, alpha,
  Button, Dialog, CircularProgress
} from '@mui/material';
import { ShoppingCartOutlined, PaymentOutlined, TaskAlt, KeyOutlined } from '@mui/icons-material';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/common/DashboardLayout';
import { usePageTitle } from '../../hooks/usePageTitle';
import api from '../../services/api';

const STATUS_STEPS = ['PENDING', 'ACCEPTED', 'PACKED', 'IN_TRANSIT', 'DELIVERED'];
const STATUS_COLORS = {
  PENDING: '#f59e0b', ACCEPTED: '#3b82f6', PACKED: '#8b5cf6',
  IN_TRANSIT: '#f97316', DELIVERED: '#22c55e', CANCELLED: '#ef4444',
};
const PAY_COLORS = { PENDING: '#f59e0b', PAID: '#22c55e', FAILED: '#ef4444', REFUNDED: '#3b82f6' };
const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function CustomerOrders() {
  usePageTitle('My Orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);

  // Payment Gateway Simulator State
  const [payModal, setPayModal] = useState(false);
  const [payStep, setPayStep] = useState(0); // 0: Idle, 1: Processing, 2: Success

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'ALL' ? { status: filter } : {};
      const { data } = await api.get('/orders/', { params });
      setOrders(data.results ?? data);
    } catch { setOrders([]); } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <DashboardLayout title="My Orders">
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>My Orders</Typography>
            <Typography variant="body2" color="text.secondary">{orders.length} order{orders.length !== 1 ? 's' : ''}</Typography>
          </Box>
          <Select value={filter} onChange={e => setFilter(e.target.value)} size="small" sx={{ borderRadius: 2, minWidth: 150, ml: 'auto', flexShrink: 0 }}>
            <MenuItem value="ALL">All Status</MenuItem>
            {[...STATUS_STEPS, 'CANCELLED'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </Stack>

        {loading ? <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 4 }} /> : orders.length === 0 ? (
          <Paper sx={{ p: 6, borderRadius: 4, border: '2px dashed', borderColor: alpha('#3b82f6', 0.2), textAlign: 'center' }}>
            <ShoppingCartOutlined sx={{ fontSize: 56, color: alpha('#3b82f6', 0.3), mb: 2 }} />
            <Typography variant="h6" fontWeight={700} color="text.secondary">No orders yet</Typography>
            <Typography variant="body2" color="text.disabled">Head to the Marketplace to place your first order.</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha('#3b82f6', 0.04) }}>
                  {['Order ID', 'Crop', 'Qty', 'Total', 'Farmer', 'Payment', 'Status'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map(o => (
                  <TableRow key={o.id} hover onClick={() => setSelected(o === selected ? null : o)}
                    sx={{ cursor: 'pointer', bgcolor: selected?.id === o.id ? alpha('#3b82f6', 0.04) : 'transparent' }}>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#1d4ed8', fontWeight: 700 }}>{o.order_id}</TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>{o.crop_name}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{o.quantity_kg} kg</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={700}>{fmt(o.total_price)}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{o.farmer_name || '—'}</Typography></TableCell>
                    <TableCell><Chip label={o.payment_status} size="small" sx={{ bgcolor: alpha(PAY_COLORS[o.payment_status] || '#64748b', 0.1), color: PAY_COLORS[o.payment_status] || '#64748b', fontWeight: 700, fontSize: '0.68rem', height: 22 }} /></TableCell>
                    <TableCell><Chip label={o.status} size="small" sx={{ bgcolor: alpha(STATUS_COLORS[o.status] || '#64748b', 0.12), color: STATUS_COLORS[o.status] || '#64748b', fontWeight: 700, fontSize: '0.68rem', height: 22 }} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {selected && (
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ flexShrink: 1 }}>
                Order Timeline — {selected.order_id}
              </Typography>

              {selected.payment_status === 'PENDING' && (
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<PaymentOutlined />}
                  onClick={() => {
                    setPayStep(0);
                    setPayModal(true);
                  }}
                  sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                >
                  Pay {fmt(selected.total_price)}
                </Button>
              )}
            </Stack>

            <Stepper alternativeLabel activeStep={STATUS_STEPS.indexOf(selected.status)}>
              {STATUS_STEPS.map(s => (
                <Step key={s}>
                  <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.72rem' } }}>
                    {s.replace('_', ' ')}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {selected.status === 'DELIVERED' && (
              <Box sx={{ mt: 2, p: 2, borderRadius: 3, bgcolor: alpha('#22c55e', 0.08), border: '1px solid', borderColor: alpha('#22c55e', 0.25) }}>
                <Typography variant="body2" fontWeight={700} color="#15803d">✅ This order has been delivered!</Typography>
              </Box>
            )}
            {selected.status === 'ACCEPTED' && (
              <Box sx={{ mt: 2, p: 2, borderRadius: 3, bgcolor: alpha('#3b82f6', 0.08), border: '1px solid', borderColor: alpha('#3b82f6', 0.25) }}>
                <Typography variant="body2" fontWeight={700} color="#1d4ed8">🤝 Deal confirmed by farmer. Your crop is being prepared.</Typography>
              </Box>
            )}
          </Paper>
        )}
      </Stack>

      {/* Simulated Payment Gateway */}
      <Dialog
        open={payModal}
        onClose={() => payStep !== 1 && setPayModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 5,
            overflow: 'hidden',
            backgroundImage: 'none' // override dark mode default overlays
          }
        }}
      >
        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
          {/* Decorative ambient blobs */}
          <Box sx={{ position: 'absolute', top: -100, left: -50, width: 300, height: 300, bgcolor: payStep === 2 ? 'success.main' : 'primary.main', opacity: 0.08, borderRadius: '50%', filter: 'blur(50px)', pointerEvents: 'none' }} />
          <Box sx={{ position: 'absolute', bottom: -50, right: -100, width: 250, height: 250, bgcolor: payStep === 2 ? 'success.main' : 'primary.main', opacity: 0.08, borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }} />

          <Stack spacing={4} alignItems="center" textAlign="center" sx={{ px: { xs: 3, sm: 6 }, py: 6, position: 'relative', zIndex: 1 }}>

            <Box sx={{
              width: 88, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: payStep === 2 ? alpha('#22c55e', 0.15) : alpha('#1d4ed8', 0.15),
              borderRadius: '50%', color: payStep === 2 ? '#22c55e' : '#1d4ed8',
              boxShadow: payStep === 2 ? `0 12px 32px ${alpha('#22c55e', 0.25)}` : `0 12px 32px ${alpha('#1d4ed8', 0.25)}`
            }}>
              {payStep === 2 ? <TaskAlt sx={{ fontSize: 44 }} /> : <KeyOutlined sx={{ fontSize: 44 }} />}
            </Box>

            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.02em' }}>
                {payStep === 2 ? 'Payment Successful!' : 'Secure Checkout'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '90%', mx: 'auto', lineHeight: 1.6, fontSize: '1.05rem' }}>
                {payStep === 2
                  ? `Your payment of ${fmt(selected?.total_price)} for ${selected?.crop_name} has been secured.`
                  : `You are paying ${fmt(selected?.total_price)} to ${selected?.farmer_name} for order ${selected?.order_id}.`
                }
              </Typography>
            </Box>

            {payStep === 0 && (
              <Stack spacing={2} width="100%">
                <Button
                  variant="contained" size="large" fullWidth
                  sx={{ borderRadius: 3, fontWeight: 700, py: 1.8, fontSize: '1.1rem', backgroundImage: `linear-gradient(135deg, #1d4ed8, #3b82f6)`, textTransform: 'none' }}
                  onClick={async () => {
                    setPayStep(1);
                    try {
                      await api.post(`/orders/${selected.id}/pay/`);
                      setTimeout(() => {
                        setPayStep(2);
                        toast.success('Payment completed successfully!');
                        setSelected(s => ({ ...s, payment_status: 'PAID' }));
                        setOrders(os => os.map(o => o.id === selected.id ? { ...o, payment_status: 'PAID' } : o));
                      }, 1500);
                    } catch (e) {
                      toast.error('Payment gateway error. Please try again.');
                      setPayStep(0);
                    }
                  }}
                >
                  Pay {fmt(selected?.total_price)}
                </Button>
                <Button variant="text" color="inherit" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'none' }} onClick={() => setPayModal(false)}>
                  Cancel Checkout
                </Button>
              </Stack>
            )}

            {payStep === 1 && (
              <Stack direction="row" spacing={2.5} alignItems="center" color="text.secondary" sx={{ py: 2 }}>
                <CircularProgress size={28} sx={{ color: 'primary.main' }} />
                <Typography variant="body1" fontWeight={600}>Processing your payment securely...</Typography>
              </Stack>
            )}

            {payStep === 2 && (
              <Button
                variant="outlined" size="large" fullWidth
                sx={{ borderRadius: 3, fontWeight: 700, py: 1.5, fontSize: '1.05rem', color: 'text.primary', borderColor: 'divider', textTransform: 'none', '&:hover': { bgcolor: alpha('#000', 0.04) } }}
                onClick={() => setPayModal(false)}
              >
                Back to Orders
              </Button>
            )}
          </Stack>
        </Box>
      </Dialog>
    </DashboardLayout>
  );
}
