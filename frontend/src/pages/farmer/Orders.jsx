import { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, Chip, MenuItem, Paper, Select, Skeleton, Stack, Step,
  StepLabel, Stepper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, alpha,
} from '@mui/material';
import {
  CheckCircleOutlined, Inbox, LocalShippingOutlined,
  InventoryOutlined, ThumbUpOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/common/DashboardLayout';
import { usePageTitle } from '../../hooks/usePageTitle';
import api from '../../services/api';

const STATUS_STEPS = ['PENDING', 'ACCEPTED', 'PACKED', 'IN_TRANSIT', 'DELIVERED'];
const STATUS_COLORS = {
  PENDING: '#f59e0b',
  ACCEPTED: '#3b82f6',
  PACKED: '#8b5cf6',
  IN_TRANSIT: '#f97316',
  DELIVERED: '#22c55e',
  CANCELLED: '#ef4444',
};
const PAY_COLORS = { PENDING: '#f59e0b', PAID: '#22c55e', FAILED: '#ef4444', REFUNDED: '#3b82f6' };
const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

// Next logical status transition for a farmer
const NEXT_STATUS = {
  PENDING: { label: 'Accept', value: 'ACCEPTED', icon: <ThumbUpOutlined fontSize="small" />, color: '#3b82f6' },
  ACCEPTED: { label: 'Mark Packed', value: 'PACKED', icon: <InventoryOutlined fontSize="small" />, color: '#8b5cf6' },
  PACKED: { label: 'Ship', value: 'IN_TRANSIT', icon: <LocalShippingOutlined fontSize="small" />, color: '#f97316' },
  IN_TRANSIT: { label: 'Delivered', value: 'DELIVERED', icon: <CheckCircleOutlined fontSize="small" />, color: '#22c55e' },
};

export default function Orders() {
  usePageTitle('Orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(null); // id of order being updated

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders/');
      setOrders(data.results ?? data);
    } catch { setOrders([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);



  const handleStatusUpdate = async (order, newStatus) => {
    setUpdating(order.id);
    try {
      await api.patch(`/orders/${order.id}/`, { status: newStatus });
      toast.success(`Order ${order.order_id} marked as ${newStatus}`);
      // Optimistically update local state
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
      if (selected?.id === order.id) setSelected(s => ({ ...s, status: newStatus }));
    } catch {
      toast.error('Failed to update order status');
    } finally { setUpdating(null); }
  };

  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.status === filter);

  return (
    <DashboardLayout title="Orders">
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>Orders</Typography>
            <Typography variant="body2" color="text.secondary">
              {filtered.length} order{filtered.length !== 1 ? 's' : ''}
              {orders.filter(o => o.status === 'PENDING').length > 0 && (
                <Box component="span" sx={{ ml: 1, color: '#f59e0b', fontWeight: 700 }}>
                  · {orders.filter(o => o.status === 'PENDING').length} pending action
                </Box>
              )}
            </Typography>
          </Box>
          <Select value={filter} onChange={e => setFilter(e.target.value)} size="small" sx={{ borderRadius: 2, minWidth: 140, ml: 'auto', flexShrink: 0 }}>
            <MenuItem value="ALL">All Status</MenuItem>
            {[...STATUS_STEPS, 'CANCELLED'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </Stack>

        {loading ? (
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 4 }} />
        ) : filtered.length === 0 ? (
          <Paper sx={{ p: 6, borderRadius: 4, border: '2px dashed', borderColor: alpha('#3b82f6', 0.2), textAlign: 'center' }}>
            <Inbox sx={{ fontSize: 56, color: alpha('#3b82f6', 0.3), mb: 2 }} />
            <Typography variant="h6" fontWeight={700} color="text.secondary">No orders yet</Typography>
            <Typography variant="body2" color="text.disabled">
              {filter === 'ALL' ? 'Orders from customers will appear here.' : `No ${filter.toLowerCase()} orders.`}
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha('#2E7D32', 0.04) }}>
                  {['Order ID', 'Crop', 'Qty', 'Total', 'Customer', 'Payment', 'Status', 'Action'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((o, idx) => {
                  const next = NEXT_STATUS[o.status];
                  const isUpdating = updating === o.id;
                  return (
                    <TableRow
                      key={o.id}
                      component={motion.tr}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                      hover
                      onClick={() => setSelected(s => s?.id === o.id ? null : o)}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: selected?.id === o.id ? alpha('#2E7D32', 0.04) : 'transparent',
                        '&:hover': { bgcolor: alpha('#2E7D32', 0.03) },
                      }}
                    >
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'primary.main', fontWeight: 700 }}>
                        {o.order_id}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{o.crop_name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{o.quantity_kg} kg</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>{fmt(o.total_price)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{o.customer_name || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={o.payment_status} size="small" sx={{
                          bgcolor: alpha(PAY_COLORS[o.payment_status] || '#64748b', 0.1),
                          color: PAY_COLORS[o.payment_status] || '#64748b',
                          fontWeight: 700, fontSize: '0.68rem', height: 22,
                        }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={o.status.replace('_', ' ')} size="small" sx={{
                          bgcolor: alpha(STATUS_COLORS[o.status] || '#64748b', 0.12),
                          color: STATUS_COLORS[o.status] || '#64748b',
                          fontWeight: 700, fontSize: '0.68rem', height: 22,
                        }} />
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        {next ? (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={next.icon}
                            disabled={isUpdating}
                            onClick={() => handleStatusUpdate(o, next.value)}
                            sx={{
                              borderRadius: 2, fontSize: '0.7rem', py: 0.4, px: 1.25,
                              borderColor: next.color, color: next.color,
                              '&:hover': { bgcolor: alpha(next.color, 0.08), borderColor: next.color },
                            }}
                          >
                            {isUpdating ? '…' : next.label}
                          </Button>
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            {o.status === 'DELIVERED' ? '✅ Done' : o.status === 'CANCELLED' ? '🚫 Cancelled' : '—'}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Order timeline */}
        {selected && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                <Typography variant="h6" fontWeight={700}>
                  Order Timeline — {selected.order_id}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Customer: {selected.customer_name} · {fmt(selected.total_price)}
                </Typography>
              </Stack>
              <Stepper alternativeLabel activeStep={STATUS_STEPS.indexOf(selected.status)}>
                {STATUS_STEPS.map(s => (
                  <Step key={s}>
                    <StepLabel
                      sx={{
                        '& .MuiStepLabel-label': { fontSize: '0.72rem' },
                        '& .MuiStepIcon-root.Mui-completed': { color: '#22c55e' },
                        '& .MuiStepIcon-root.Mui-active': { color: STATUS_COLORS[selected.status] || '#2E7D32' },
                      }}
                    >
                      {s.replace('_', ' ')}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>

              {/* Quick action from timeline too */}
              {NEXT_STATUS[selected.status] && (
                <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    startIcon={NEXT_STATUS[selected.status].icon}
                    disabled={updating === selected.id}
                    onClick={() => handleStatusUpdate(selected, NEXT_STATUS[selected.status].value)}
                    sx={{
                      borderRadius: 2.5, px: 3,
                      bgcolor: NEXT_STATUS[selected.status].color,
                      '&:hover': { bgcolor: NEXT_STATUS[selected.status].color, filter: 'brightness(0.88)' },
                    }}
                  >
                    {updating === selected.id ? 'Updating…' : `Move to ${NEXT_STATUS[selected.status].value.replace('_', ' ')}`}
                  </Button>
                </Box>
              )}
            </Paper>
          </motion.div>
        )}
      </Stack>
    </DashboardLayout>
  );
}
