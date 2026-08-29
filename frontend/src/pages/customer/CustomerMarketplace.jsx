import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Add, AddShoppingCart, CheckCircle, Close, Delete,
  Remove, SearchOutlined, ShoppingCart, ShoppingCartOutlined, Storefront,
} from '@mui/icons-material';
import {
  alpha, Badge, Box, Button, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, Drawer, Grid, IconButton,
  InputAdornment, Paper, Skeleton, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField,
  Typography,
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/common/DashboardLayout';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useCart } from '../../context/CartContext';
import { parseApiError } from '../../utils/errorParser';
import api from '../../services/api';

/* ── Cart Drawer ─────────────────────────────────────────────────────────── */
function CropCartDrawer({ open, onClose, onCheckout }) {
  const { cropCart, removeCrop, updateCrop, clearCrop, cropTotal } = useCart();
  const totalItems = cropCart.reduce((s, i) => s + i.quantity, 0);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100vw', sm: 420 }, display: 'flex', flexDirection: 'column' },
      }}
    >
      {/* Header */}
      <Box sx={{
        px: 2.5, py: 2,
        borderBottom: '1px solid', borderColor: 'divider',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ShoppingCart sx={{ color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={800}>Cart</Typography>
          <Chip
            label={totalItems}
            size="small" color="primary"
            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800 }}
          />
        </Stack>
        <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
      </Box>

      {/* Items */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1.5 }}>
        {cropCart.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <ShoppingCart sx={{ fontSize: 56, color: alpha('#2E7D32', 0.18), mb: 1.5 }} />
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Your cart is empty
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Add crops from the marketplace
            </Typography>
          </Box>
        ) : (
          <AnimatePresence>
            {cropCart.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.18 }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    mb: 1.5, p: 1.75, borderRadius: 2.5,
                    border: '1px solid', borderColor: 'divider',
                    '&:hover': { borderColor: alpha('#2E7D32', 0.3) },
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    {/* Icon */}
                    <Box sx={{
                      width: 44, height: 44, borderRadius: 2, flexShrink: 0,
                      bgcolor: alpha('#2E7D32', 0.08),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Typography sx={{ fontSize: 22 }}>🌾</Typography>
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700} noWrap>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ₹{Number(item.price).toLocaleString('en-IN')}/kg
                        {item.farmer_name ? ` · ${item.farmer_name}` : ''}
                      </Typography>

                      <Stack
                        direction="row" alignItems="center"
                        justifyContent="space-between" sx={{ mt: 1 }}
                      >
                        {/* Qty stepper */}
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <IconButton
                            size="small"
                            onClick={() =>
                              item.quantity === 1
                                ? removeCrop(item.id)
                                : updateCrop(item.id, item.quantity - 1)
                            }
                            sx={{
                              width: 26, height: 26,
                              border: '1px solid', borderColor: 'divider', borderRadius: 1,
                            }}
                          >
                            {item.quantity === 1
                              ? <Delete sx={{ fontSize: 14, color: 'error.main' }} />
                              : <Remove sx={{ fontSize: 14 }} />
                            }
                          </IconButton>
                          <Typography
                            variant="body2" fontWeight={700}
                            sx={{ minWidth: 26, textAlign: 'center' }}
                          >
                            {item.quantity}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">kg</Typography>
                          <IconButton
                            size="small"
                            onClick={() => updateCrop(item.id, item.quantity + 1)}
                            sx={{
                              width: 26, height: 26,
                              border: '1px solid', borderColor: 'divider', borderRadius: 1,
                            }}
                          >
                            <Add sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Stack>

                        <Typography variant="body2" fontWeight={800} color="primary.main">
                          ₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}
                        </Typography>
                      </Stack>
                    </Box>

                    <IconButton
                      size="small"
                      onClick={() => removeCrop(item.id)}
                      sx={{ color: 'error.light', flexShrink: 0 }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Stack>
                </Paper>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </Box>

      {/* Footer */}
      {cropCart.length > 0 && (
        <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              Subtotal ({totalItems} kg)
            </Typography>
            <Typography variant="h6" fontWeight={800} color="primary.main">
              ₹{cropTotal.toLocaleString('en-IN')}
            </Typography>
          </Stack>
          <Button
            fullWidth variant="contained" size="large"
            startIcon={<ShoppingCart />}
            sx={{ borderRadius: 2.5, fontWeight: 800, py: 1.2, mb: 1 }}
            onClick={() => { onClose(); onCheckout(); }}
          >
            Checkout — ₹{cropTotal.toLocaleString('en-IN')}
          </Button>
          <Button
            fullWidth variant="text" size="small" color="error"
            onClick={clearCrop}
            sx={{ borderRadius: 2, fontSize: '0.75rem' }}
          >
            Clear cart
          </Button>
        </Box>
      )}
    </Drawer>
  );
}

/* ── Checkout dialog (places one order per cart item) ────────────────────── */
function CheckoutDialog({ open, onClose, onDone }) {
  const { cropCart, clearCrop, cropTotal } = useCart();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => { if (open) reset(); }, [open, reset]);

  const onSubmit = async (data) => {
    try {
      await Promise.all(
        cropCart.map(item =>
          api.post('/orders/', {
            listing:          item.listingId,
            crop_name:        item.name,
            quantity_kg:      item.quantity,
            price_per_kg:     item.price,
            delivery_address: data.delivery_address || '',
          })
        )
      );
      toast.success(`${cropCart.length} order${cropCart.length > 1 ? 's' : ''} placed successfully!`);
      clearCrop();
      onDone();
      onClose();
    } catch (e) {
      toast.error(parseApiError(e, 'Could not place orders.'));
    }
  };

  return (
    <Dialog
      open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography fontWeight={700}>Checkout</Typography>
        <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack spacing={2}>
            {/* Summary */}
            <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha('#2E7D32', 0.05), border: '1px solid', borderColor: alpha('#2E7D32', 0.12) }}>
              <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                Order Summary
              </Typography>
              {cropCart.map(item => (
                <Stack key={item.id} direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
                  <Typography variant="caption" color="text.secondary">
                    {item.name} × {item.quantity} kg
                  </Typography>
                  <Typography variant="caption" fontWeight={600}>
                    ₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}
                  </Typography>
                </Stack>
              ))}
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" fontWeight={700}>Total</Typography>
                <Typography variant="body2" fontWeight={800} color="primary.main">
                  ₹{cropTotal.toLocaleString('en-IN')}
                </Typography>
              </Stack>
            </Box>

            <TextField
              label="Delivery Address"
              multiline rows={3}
              fullWidth size="small"
              placeholder="Enter your full delivery address…"
              {...register('delivery_address')}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            type="submit" variant="contained" disabled={isSubmitting}
            startIcon={<ShoppingCartOutlined />}
            sx={{ borderRadius: 2 }}
          >
            {isSubmitting ? 'Placing…' : `Place ${cropCart.length} Order${cropCart.length > 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

/* ── Single-item quick-order dialog (kept for direct row "Order" button) ─── */
function OrderDialog({ open, onClose, listing, onOrdered }) {
  const {
    register, handleSubmit, reset, watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { quantity_kg: 1 } });

  const qty   = watch('quantity_kg', 1);
  const total = listing ? (Number(listing.price_per_kg) * Number(qty || 0)) : 0;

  useEffect(() => { if (open) reset({ quantity_kg: 1 }); }, [open, reset]);

  const onSubmit = async (data) => {
    try {
      await api.post('/orders/', {
        listing:          listing.id,
        crop_name:        listing.crop_name,
        quantity_kg:      data.quantity_kg,
        price_per_kg:     listing.price_per_kg,
        delivery_address: data.delivery_address || '',
      });
      toast.success('Order placed successfully!');
      onOrdered();
      onClose();
    } catch (e) {
      toast.error(parseApiError(e, 'Could not place order.'));
    }
  };

  return (
    <Dialog
      open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography fontWeight={700}>Quick Order</Typography>
        <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
      </DialogTitle>
      {listing && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={2}>
              <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha('#2E7D32', 0.05) }}>
                <Typography variant="body2" fontWeight={700}>{listing.crop_name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  ₹{Number(listing.price_per_kg).toLocaleString('en-IN')}/kg · from {listing.farmer_name}
                </Typography>
              </Box>
              <TextField
                label="Quantity (kg) *" type="number" fullWidth size="small"
                inputProps={{ min: 0.1, max: Number(listing.quantity_kg), step: 0.1 }}
                {...register('quantity_kg', {
                  required: 'Required',
                  min: { value: 0.1, message: 'Min 0.1 kg' },
                })}
                error={!!errors.quantity_kg}
                helperText={errors.quantity_kg?.message}
              />
              <TextField
                label="Delivery Address" multiline rows={2}
                fullWidth size="small"
                {...register('delivery_address')}
              />
              <Box sx={{
                p: 1.5, borderRadius: 2,
                bgcolor: alpha('#2E7D32', 0.06),
                border: '1px solid', borderColor: alpha('#2E7D32', 0.15),
              }}>
                <Typography variant="body2" fontWeight={700}>
                  Estimated Total: ₹{total.toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button
              type="submit" variant="contained" disabled={isSubmitting}
              startIcon={<ShoppingCartOutlined />}
              sx={{ borderRadius: 2 }}
            >
              {isSubmitting ? 'Placing…' : 'Confirm Order'}
            </Button>
          </DialogActions>
        </form>
      )}
    </Dialog>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function CustomerMarketplace() {
  usePageTitle('Marketplace');

  const [listings, setListings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [orderTarget, setOrderTarget]   = useState(null);
  const [cartOpen, setCartOpen]         = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const { addCrop, cropCart, cropCount } = useCart();
  const cartIds = useMemo(() => new Set(cropCart.map(i => i.id)), [cropCart]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/listings/', {
        params: {
          status: 'ACTIVE',
          ...(search ? { search } : {}),
          ordering: 'crop_name',
        },
      });
      setListings(data.results ?? data);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleAddToCart = useCallback((l) => {
    addCrop({
      id:          l.id,
      listingId:   l.id,
      name:        l.crop_name,
      price:       Number(l.price_per_kg),
      unit:        'per kg',
      farmer_name: l.farmer_name,
    });
    toast.success(`${l.crop_name} added to cart`, { autoClose: 1800 });
  }, [addCrop]);

  const columns = ['Crop', 'Variety', 'Farmer', 'Price / kg', 'Available', 'Organic', 'Harvest Date', 'Actions'];

  return (
    <DashboardLayout title="Marketplace">
      <Stack spacing={3}>
        {/* Header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <Box>
            <Typography variant="h5" fontWeight={800}>Crop Marketplace</Typography>
            <Typography variant="body2" color="text.secondary">
              Browse and order fresh produce directly from verified farmers.
            </Typography>
          </Box>

          {/* Cart button */}
          <Button
            variant="contained"
            startIcon={
              <Badge badgeContent={cropCount} color="error" max={99}>
                <ShoppingCart />
              </Badge>
            }
            onClick={() => setCartOpen(true)}
            sx={{ borderRadius: 2.5, fontWeight: 700, px: 2.5, flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            Cart {cropCount > 0 && `(${cropCount})`}
          </Button>
        </Stack>

        {/* Search */}
        <TextField
          size="small"
          placeholder="Search crops, variety…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 420 }}
        />

        {/* Table */}
        {loading ? (
          <Stack spacing={1}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={52} sx={{ borderRadius: 2 }} />
            ))}
          </Stack>
        ) : listings.length === 0 ? (
          <Paper sx={{
            p: 6, borderRadius: 4, border: '2px dashed',
            borderColor: alpha('#2E7D32', 0.2), textAlign: 'center',
          }}>
            <Storefront sx={{ fontSize: 56, color: alpha('#2E7D32', 0.3), mb: 2 }} />
            <Typography variant="h6" fontWeight={700} color="text.secondary">
              No listings available
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Active listings from farmers will appear here.
            </Typography>
          </Paper>
        ) : (
          <TableContainer
            component={Paper}
            sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha('#2E7D32', 0.06) }}>
                  {columns.map(col => (
                    <TableCell
                      key={col}
                      sx={{
                        fontWeight: 700, fontSize: '0.78rem',
                        whiteSpace: 'nowrap', color: 'text.secondary', py: 1.5,
                      }}
                    >
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  const groups = listings.reduce((acc, l) => {
                    if (!acc[l.crop_name]) acc[l.crop_name] = [];
                    acc[l.crop_name].push(l);
                    return acc;
                  }, {});

                  return Object.entries(groups).map(([cropName, items]) => (
                    <>
                      {/* Group header */}
                      <TableRow key={`group-${cropName}`}>
                        <TableCell
                          colSpan={columns.length}
                          sx={{
                            py: 0.75, px: 2,
                            bgcolor: alpha('#2E7D32', 0.08),
                            borderBottom: '1px solid',
                            borderColor: alpha('#2E7D32', 0.15),
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography
                              variant="caption" fontWeight={800}
                              sx={{ color: 'primary.main', fontSize: '0.75rem', letterSpacing: 0.4 }}
                            >
                              🌾 {cropName}
                            </Typography>
                            <Chip
                              label={`${items.length} listing${items.length !== 1 ? 's' : ''}`}
                              size="small"
                              sx={{
                                height: 18, fontSize: '0.62rem', fontWeight: 600,
                                bgcolor: alpha('#2E7D32', 0.1), color: '#15803d',
                              }}
                            />
                          </Stack>
                        </TableCell>
                      </TableRow>

                      {/* Group rows */}
                      {items.map((l, idx) => {
                        const inCart = cartIds.has(l.id);
                        return (
                          <TableRow
                            key={l.id}
                            component={motion.tr}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            sx={{
                              bgcolor: inCart
                                ? alpha('#22c55e', 0.04)
                                : idx % 2 === 0 ? 'transparent' : alpha('#2E7D32', 0.015),
                              '&:hover': { bgcolor: alpha('#2E7D32', 0.05) },
                              transition: 'background 0.12s',
                            }}
                          >
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={0.75}>
                                {inCart && (
                                  <CheckCircle sx={{ fontSize: 14, color: '#22c55e' }} />
                                )}
                                <Typography variant="body2" fontWeight={600}>
                                  {l.crop_name}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {l.variety || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{l.farmer_name || '—'}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={800} color="primary.main">
                                ₹{Number(l.price_per_kg).toLocaleString('en-IN')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {Number(l.quantity_kg).toLocaleString('en-IN')} kg
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {l.is_organic
                                ? <Chip label="Organic ✓" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: alpha('#22c55e', 0.1), color: '#15803d' }} />
                                : <Typography variant="caption" color="text.disabled">—</Typography>
                              }
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                {l.harvest_date || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={0.75}>
                                {/* Add to Cart */}
                                <Button
                                  size="small"
                                  variant={inCart ? 'outlined' : 'contained'}
                                  startIcon={
                                    inCart
                                      ? <CheckCircle fontSize="small" />
                                      : <AddShoppingCart fontSize="small" />
                                  }
                                  onClick={() => handleAddToCart(l)}
                                  sx={{
                                    borderRadius: 2, fontSize: '0.70rem',
                                    py: 0.4, px: 1.1, whiteSpace: 'nowrap',
                                    ...(inCart ? {
                                      borderColor: '#22c55e', color: '#15803d',
                                      '&:hover': { bgcolor: alpha('#22c55e', 0.08) },
                                    } : {}),
                                  }}
                                >
                                  {inCart ? 'Added' : 'Add to Cart'}
                                </Button>

                                {/* Quick order */}
                                <Button
                                  size="small" variant="outlined"
                                  startIcon={<ShoppingCartOutlined fontSize="small" />}
                                  onClick={() => setOrderTarget(l)}
                                  sx={{
                                    borderRadius: 2, fontSize: '0.70rem',
                                    py: 0.4, px: 1.1, whiteSpace: 'nowrap',
                                  }}
                                >
                                  Order
                                </Button>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </>
                  ));
                })()}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'center' }}>
          {listings.length} active listing{listings.length !== 1 ? 's' : ''} · Refresh to see latest prices
        </Typography>
      </Stack>

      {/* Drawers & Dialogs */}
      <CropCartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => setCheckoutOpen(true)}
      />
      <CheckoutDialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onDone={fetchListings}
      />
      <OrderDialog
        open={Boolean(orderTarget)}
        onClose={() => setOrderTarget(null)}
        listing={orderTarget}
        onOrdered={fetchListings}
      />
    </DashboardLayout>
  );
}
