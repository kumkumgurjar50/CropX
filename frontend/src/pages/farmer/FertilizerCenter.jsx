import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Add, AddShoppingCart, CheckCircle, Close, Delete,
  FilterList, Remove, Science, SearchOutlined, ShoppingCart,
  VerifiedUser, ChevronLeft, ChevronRight, ShoppingCartCheckout,
} from '@mui/icons-material';
import {
  alpha, Badge, Box, Button, Chip, Drawer, Grid,
  IconButton, InputAdornment, Paper, Skeleton,
  Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/common/DashboardLayout';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';
import FertilizerOrderDialog from '../../components/fertilizer/FertilizerOrderDialog';

// ── type colours ──────────────────────────────────────────────────────────────
const TYPE_META = {
  Chemical:      { color: '#3b82f6', bg: alpha('#3b82f6', 0.10) },
  Organic:       { color: '#22c55e', bg: alpha('#22c55e', 0.10) },
  Fungicide:     { color: '#a855f7', bg: alpha('#a855f7', 0.10) },
  Pesticide:     { color: '#f97316', bg: alpha('#f97316', 0.10) },
  Micronutrient: { color: '#f59e0b', bg: alpha('#f59e0b', 0.10) },
  Biofertilizer: { color: '#14b8a6', bg: alpha('#14b8a6', 0.10) },
};

const ALL_TYPES = ['All', ...Object.keys(TYPE_META)];
const PAGE_SIZE = 24;

// ── single fertilizer card ────────────────────────────────────────────────────
function FertCard({ item, onAddToCart, inCart }) {
  const meta       = TYPE_META[item.fertilizer_type] ?? TYPE_META.Chemical;
  const discount   = item.discount_percent;
  const cropsList  = item.crops_list  ?? [];
  const prevList   = item.prevents_list ?? [];

  return (
    <Paper
      component={motion.div}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.22 }}
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: inCart ? alpha('#22c55e', 0.5) : 'divider',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: 480,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:hover': {
          boxShadow: `0 6px 28px ${alpha('#000', 0.12)}`,
          borderColor: alpha('#2E7D32', 0.35),
        },
      }}
    >
      {/* Image area — fixed 180px height, vector product image */}
      <Box sx={{
        position: 'relative',
        height: 180,
        width: '100%',
        flexShrink: 0,
        bgcolor: alpha('#2E7D32', 0.04),
        overflow: 'hidden',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        {item.image_url || item.image ? (
          <Box
            component="img"
            src={item.image_url || item.image}
            alt={item.name}
            loading="lazy"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              p: 1,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          />
        ) : (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Science sx={{ fontSize: 56, color: alpha('#2E7D32', 0.2) }} />
          </Box>
        )}

        {/* Type badge top-left */}
        <Chip
          label={item.fertilizer_type}
          size="small"
          sx={{
            position: 'absolute', top: 10, left: 10,
            height: 22, fontSize: '0.65rem', fontWeight: 700,
            bgcolor: meta.bg, color: meta.color,
            backdropFilter: 'blur(4px)',
            border: `1px solid ${alpha(meta.color, 0.3)}`,
          }}
        />

        {/* Discount badge top-right */}
        {discount > 0 && (
          <Chip
            label={`-${discount}%`}
            size="small"
            sx={{
              position: 'absolute', top: 10, right: 10,
              height: 22, fontSize: '0.65rem', fontWeight: 800,
              bgcolor: '#ef4444', color: '#fff', borderRadius: 1,
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
            }}
          />
        )}

        {/* In-cart badge */}
        {inCart && (
          <Box sx={{
            position: 'absolute', bottom: 8, right: 8,
            bgcolor: '#22c55e', color: '#fff', borderRadius: '50%',
            width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}>
            <CheckCircle sx={{ fontSize: 16 }} />
          </Box>
        )}
      </Box>

      {/* Body — strictly uniform inner spacing */}
      <Box sx={{ p: 1.75, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Name — fixed height for 2 lines */}
        <Typography variant="body2" fontWeight={700} sx={{ 
          height: '2.6em',
          lineHeight: 1.3, 
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          fontSize: '0.875rem',
          mb: 0.75,
        }}>
          {item.name}
        </Typography>

        {/* Brand — fixed height */}
        <Typography variant="caption" color="text.secondary" sx={{ height: '1.4em', fontSize: '0.72rem', display: 'block' }} noWrap>
          🏭 <strong>Brand:</strong> {item.brand || 'CropX Verified'}
        </Typography>

        {/* Dose — fixed height */}
        <Typography variant="caption" color="text.secondary" sx={{ height: '1.4em', fontSize: '0.72rem', display: 'block' }} noWrap>
          📏 <strong>Dose:</strong> {item.dose || 'As per crop requirement'}
        </Typography>

        {/* Crops — fixed height */}
        <Typography variant="caption" color="text.secondary" sx={{ height: '1.4em', fontSize: '0.72rem', display: 'block' }} noWrap>
          🌾 <strong>Crops:</strong> {cropsList.length > 0 ? cropsList.slice(0, 3).join(', ') : 'All Crops'}
        </Typography>

        {/* Prevents — fixed height */}
        <Typography variant="caption" color="text.secondary" sx={{ height: '1.4em', fontSize: '0.72rem', display: 'block' }} noWrap>
          🛡️ <strong>Prevents:</strong> {prevList.length > 0 ? prevList.slice(0, 2).join(', ') : 'Nutrient Deficiency'}
        </Typography>

        {/* Flexible spacer pushing price & button to bottom */}
        <Box sx={{ flex: 1 }} />

        {/* Price row — fixed height */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ height: '2em', my: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" fontWeight={800} color="primary.main" sx={{ fontSize: '1.05rem' }}>
              ₹{Number(item.price).toLocaleString('en-IN')}
            </Typography>
            {item.original_price && Number(item.original_price) > Number(item.price) && (
              <Typography variant="caption" color="text.disabled" sx={{ textDecoration: 'line-through', fontSize: '0.75rem' }}>
                ₹{Number(item.original_price).toLocaleString('en-IN')}
              </Typography>
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
            {item.unit}
          </Typography>
        </Stack>

        {/* Action Button — Single Add to Cart Button */}
        <Button
          fullWidth
          variant={inCart ? 'outlined' : 'contained'}
          size="small"
          color={inCart ? 'success' : 'primary'}
          startIcon={inCart ? <CheckCircle fontSize="small" /> : <AddShoppingCart fontSize="small" />}
          onClick={() => onAddToCart(item)}
          sx={{
            height: 38,
            borderRadius: 2, 
            fontWeight: 700, 
            fontSize: '0.8rem',
            textTransform: 'none',
            bgcolor: inCart ? 'transparent' : '#2E7D32',
            '&:hover': {
              bgcolor: inCart ? alpha('#22c55e', 0.1) : '#1b5e20',
            },
          }}
        >
          {inCart ? 'Added to Cart' : 'Add to Cart'}
        </Button>
      </Box>
    </Paper>
  );
}

// ── Cart Drawer ───────────────────────────────────────────────────────────────
function CartDrawer({ open, onClose, onProceedToOrder }) {
  const { fertCart, removeFert, updateFert, clearFert, fertTotal } = useCart();

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
      <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ShoppingCart sx={{ color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={800}>Fertilizer Cart</Typography>
          <Chip label={fertCart.reduce((s, i) => s + i.quantity, 0)} size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800 }} />
        </Stack>
        <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
      </Box>

      {/* Items List */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1.5 }}>
        {fertCart.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 10 }}>
            <ShoppingCart sx={{ fontSize: 60, color: alpha('#2E7D32', 0.2), mb: 1.5 }} />
            <Typography variant="body2" color="text.secondary" fontWeight={600}>Your fertilizer cart is empty</Typography>
            <Typography variant="caption" color="text.disabled">Click "Add to Cart" on any product to get started</Typography>
          </Box>
        ) : (
          <AnimatePresence>
            {fertCart.map(item => (
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
                    mb: 1.5, p: 1.5, borderRadius: 2.5,
                    border: '1px solid', borderColor: 'divider',
                    '&:hover': { borderColor: alpha('#2E7D32', 0.3) },
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    {/* Item Image */}
                    <Box sx={{
                      width: 54, height: 54, borderRadius: 2, flexShrink: 0,
                      bgcolor: alpha('#2E7D32', 0.05),
                      border: '1px solid', borderColor: 'divider',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', p: 0.5,
                    }}>
                      {item.image
                        ? <Box component="img" src={item.image} alt={item.name} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        : <Science sx={{ fontSize: 26, color: alpha('#2E7D32', 0.4) }} />
                      }
                    </Box>

                    {/* Details */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700} noWrap sx={{ fontSize: '0.85rem' }}>{item.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.fertilizer_type || 'Fertilizer'} · {item.unit}</Typography>

                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
                        {/* Qty stepper */}
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <IconButton
                            size="small"
                            onClick={() => item.quantity === 1 ? removeFert(item.id) : updateFert(item.id, item.quantity - 1)}
                            sx={{ width: 26, height: 26, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                          >
                            {item.quantity === 1 ? <Delete sx={{ fontSize: 14, color: 'error.main' }} /> : <Remove sx={{ fontSize: 14 }} />}
                          </IconButton>
                          <Typography variant="body2" fontWeight={700} sx={{ minWidth: 24, textAlign: 'center' }}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => updateFert(item.id, item.quantity + 1)}
                            sx={{ width: 26, height: 26, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                          >
                            <Add sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Stack>

                        <Typography variant="body2" fontWeight={800} color="primary.main">
                          ₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}
                        </Typography>
                      </Stack>
                    </Box>

                    <IconButton size="small" onClick={() => removeFert(item.id)} sx={{ color: 'error.light', flexShrink: 0 }}>
                      <Close fontSize="small" />
                    </IconButton>
                  </Stack>
                </Paper>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </Box>

      {/* Cart Footer */}
      {fertCart.length > 0 && (
        <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">Total ({fertCart.reduce((s, i) => s + i.quantity, 0)} items)</Typography>
            <Typography variant="h6" fontWeight={800} color="primary.main">
              ₹{fertTotal.toLocaleString('en-IN')}
            </Typography>
          </Stack>

          <Button
            fullWidth variant="contained" size="large"
            startIcon={<ShoppingCartCheckout />}
            sx={{ borderRadius: 2.5, fontWeight: 800, py: 1.2, mb: 1, bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1b5e20' } }}
            onClick={() => {
              onClose();
              onProceedToOrder();
            }}
          >
            Place Order — ₹{fertTotal.toLocaleString('en-IN')}
          </Button>

          <Button
            fullWidth variant="text" size="small" color="error"
            onClick={clearFert}
            sx={{ borderRadius: 2, fontSize: '0.75rem' }}
          >
            Clear cart
          </Button>
        </Box>
      )}
    </Drawer>
  );
}

// ── Pagination Controls ───────────────────────────────────────────────────────
function PaginationBar({ page, totalPages, totalCount, onPageChange }) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * PAGE_SIZE + 1;
  const end   = Math.min(page * PAGE_SIZE, totalCount);

  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems="center"
      justifyContent="space-between"
      spacing={1.5}
      sx={{ mt: 2, mb: 1 }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        Showing {start}–{end} of {totalCount} products
      </Typography>

      <Stack direction="row" alignItems="center" spacing={0.5}>
        <IconButton
          size="small"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          sx={{
            width: 34, height: 34, borderRadius: 2,
            border: '1px solid', borderColor: 'divider',
          }}
        >
          <ChevronLeft fontSize="small" />
        </IconButton>

        {pages.map((p, idx) =>
          p === '...' ? (
            <Typography key={`e${idx}`} variant="body2" color="text.disabled" sx={{ px: 0.5, userSelect: 'none' }}>
              …
            </Typography>
          ) : (
            <Button
              key={p}
              size="small"
              variant={p === page ? 'contained' : 'text'}
              onClick={() => onPageChange(p)}
              sx={{
                minWidth: 34, height: 34, borderRadius: 2, fontWeight: 700,
                fontSize: '0.8rem', px: 0,
                ...(p !== page ? {
                  border: '1px solid', borderColor: 'divider',
                  color: 'text.secondary',
                } : {}),
              }}
            >
              {p}
            </Button>
          )
        )}

        <IconButton
          size="small"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          sx={{
            width: 34, height: 34, borderRadius: 2,
            border: '1px solid', borderColor: 'divider',
          }}
        >
          <ChevronRight fontSize="small" />
        </IconButton>
      </Stack>
    </Stack>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FertilizerCenter() {
  usePageTitle('Fertilizer Center');

  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter]   = useState('All');
  const [page, setPage]               = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState([]);

  const { fertCart, addFert, fertCount, clearFert } = useCart();
  const gridRef = useRef(null);

  const cartIds = useMemo(() => new Set(fertCart.map(i => i.id)), [fertCart]);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // ── debounce search input ──────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [typeFilter]);

  // ── fetch from API ──────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { is_active: true, page };
      if (debouncedSearch)        params.search = debouncedSearch;
      if (typeFilter !== 'All')   params.fertilizer_type = typeFilter;
      const { data } = await api.get('/fertilizers/', { params });
      if (data.results !== undefined) {
        setProducts(data.results);
        setTotalCount(data.count ?? data.results.length);
      } else {
        setProducts(Array.isArray(data) ? data : []);
        setTotalCount(Array.isArray(data) ? data.length : 0);
      }
    } catch {
      setProducts([]);
      setTotalCount(0);
      toast.error('Failed to load fertilizer catalog.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, typeFilter, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // ── handle Add to Cart ──────────────────────────────────────────────────────
  const handleAddToCart = useCallback((item) => {
    addFert({
      id:              item.id,
      name:            item.name,
      price:           Number(item.price),
      unit:            item.unit,
      image:           item.image_url || item.image || '',
      fertilizer_type: item.fertilizer_type,
    });
    toast.success(`${item.name} added to cart`, { autoClose: 1800 });
  }, [addFert]);

  // ── handle Proceed to Order from Cart Drawer ────────────────────────────────
  const handleProceedFromCart = useCallback(() => {
    if (fertCart.length === 0) return;
    setCheckoutItems(fertCart);
    setOrderDialogOpen(true);
  }, [fertCart]);

  const handleOrderSuccess = useCallback(() => {
    clearFert();
    toast.success('All orders placed & saved in database!');
  }, [clearFert]);

  // ── skeleton cards ──────────────────────────────────────────────────────────
  const skeletons = Array.from({ length: 12 }).map((_, i) => (
    <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', height: 480 }}>
        <Skeleton variant="rectangular" height={180} />
        <Box sx={{ p: 1.75 }}>
          <Skeleton width="70%" height={20} sx={{ mb: 0.75 }} />
          <Skeleton width="50%" height={16} sx={{ mb: 0.5 }} />
          <Skeleton width="90%" height={14} sx={{ mb: 0.5 }} />
          <Skeleton width="80%" height={14} sx={{ mb: 1 }} />
          <Skeleton width="45%" height={22} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={38} sx={{ borderRadius: 2 }} />
        </Box>
      </Paper>
    </Grid>
  ));

  return (
    <DashboardLayout title="Fertilizer Center">
      <Stack spacing={2.5}>
        {/* Header row with Cart button */}
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={1.5}>
          <Box>
            <Typography variant="h5" fontWeight={800}>Fertilizer Center</Typography>
            <Typography variant="body2" color="text.secondary">
              Browse and order fertilizers, pesticides & nutrients for your crops.
            </Typography>
          </Box>

          {/* Cart Header Button */}
          <Button
            variant="contained"
            color="primary"
            startIcon={
              <Badge badgeContent={fertCount} color="error" max={99}>
                <ShoppingCart />
              </Badge>
            }
            onClick={() => setCartDrawerOpen(true)}
            sx={{ borderRadius: 2.5, fontWeight: 700, px: 2.5, py: 1, flexShrink: 0, whiteSpace: 'nowrap', bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1b5e20' } }}
          >
            View Cart {fertCount > 0 && `(${fertCount})`}
          </Button>
        </Stack>

        {/* Search + type filter */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
          <TextField
            size="small"
            placeholder="Search name, crop, disease…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 260 }}
          />

          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
            <FilterList fontSize="small" sx={{ color: 'text.secondary' }} />
            {ALL_TYPES.map(t => {
              const meta = TYPE_META[t];
              const active = typeFilter === t;
              return (
                <Chip
                  key={t}
                  label={t}
                  size="small"
                  onClick={() => setTypeFilter(t)}
                  sx={{
                    height: 26, fontSize: '0.72rem', fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    bgcolor: active
                      ? (meta ? meta.color : '#2E7D32')
                      : (meta ? meta.bg : alpha('#2E7D32', 0.08)),
                    color: active ? '#fff' : (meta ? meta.color : '#2E7D32'),
                    border: '1px solid',
                    borderColor: active ? 'transparent' : (meta ? alpha(meta.color, 0.25) : alpha('#2E7D32', 0.2)),
                    transition: 'all 0.15s',
                    '&:hover': { opacity: 0.85 },
                  }}
                />
              );
            })}
          </Stack>
        </Stack>

        {/* Results count */}
        {!loading && (
          <Typography variant="caption" color="text.secondary">
            {totalCount} product{totalCount !== 1 ? 's' : ''} found
            {typeFilter !== 'All' ? ` · ${typeFilter}` : ''}
            {debouncedSearch ? ` · "${debouncedSearch}"` : ''}
          </Typography>
        )}

        {/* Top pagination */}
        {!loading && <PaginationBar page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={handlePageChange} />}

        {/* Product grid */}
        <Grid container spacing={2} ref={gridRef}>
          {loading
            ? skeletons
            : products.length === 0
            ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4, border: '2px dashed', borderColor: alpha('#2E7D32', 0.2) }}>
                  <Science sx={{ fontSize: 64, color: alpha('#2E7D32', 0.2), mb: 2 }} />
                  <Typography variant="h6" fontWeight={700} color="text.secondary">No products found</Typography>
                  <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                    Try a different search term or filter.
                  </Typography>
                </Paper>
              </Grid>
            )
            : (
              <AnimatePresence mode="popLayout">
                {products.map(item => (
                  <Grid item xs={12} sm={6} md={4} lg={3} xl={2.4} key={item.id} sx={{ display: 'flex' }}>
                    <FertCard
                      item={item}
                      onAddToCart={handleAddToCart}
                      inCart={cartIds.has(item.id)}
                    />
                  </Grid>
                ))}
              </AnimatePresence>
            )
          }
        </Grid>

        {/* Bottom pagination */}
        {!loading && <PaginationBar page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={handlePageChange} />}
      </Stack>

      {/* Cart Drawer */}
      <CartDrawer
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        onProceedToOrder={handleProceedFromCart}
      />

      {/* Order Dialog */}
      <FertilizerOrderDialog
        open={orderDialogOpen}
        onClose={() => setOrderDialogOpen(false)}
        items={checkoutItems}
        onSuccess={handleOrderSuccess}
      />
    </DashboardLayout>
  );
}
