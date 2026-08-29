import { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, Grid, IconButton, MenuItem, Paper, Skeleton,
  Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Typography, alpha,
} from '@mui/material';
import { AddCircleOutlineOutlined, CheckCircleOutlined, Close, DeleteOutlined, EditOutlined, Storefront } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/common/DashboardLayout';
import { usePageTitle } from '../../hooks/usePageTitle';
import { parseApiError } from '../../utils/errorParser';
import api from '../../services/api';

const STATUS_COLORS = { DRAFT: '#94a3b8', ACTIVE: '#22c55e', SOLD: '#3b82f6', EXPIRED: '#ef4444' };

function ListingFormDialog({ open, onClose, onSaved, editListing }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  useEffect(() => { if (editListing) reset(editListing); else reset({}); }, [editListing, reset]);
  const onSubmit = async (data) => {
    try {
      if (editListing) { await api.patch(`/listings/${editListing.id}/`, data); toast.success('Listing updated'); }
      else { await api.post('/listings/', data); toast.success('Listing created!'); }
      onSaved(); onClose();
    } catch (e) { toast.error(parseApiError(e)); }
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography fontWeight={700}>{editListing ? 'Edit Listing' : 'New Listing'}</Typography>
        <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField label="Crop Name *" fullWidth {...register('crop_name', { required: 'Required' })} error={!!errors.crop_name} helperText={errors.crop_name?.message} /></Grid>
            <Grid item xs={6}><TextField label="Variety" fullWidth {...register('variety')} /></Grid>
            <Grid item xs={6}><TextField label="Quantity (kg) *" type="number" fullWidth {...register('quantity_kg', { required: 'Required' })} /></Grid>
            <Grid item xs={6}><TextField label="Price per kg (₹) *" type="number" fullWidth {...register('price_per_kg', { required: 'Required' })} /></Grid>
            <Grid item xs={6}><TextField label="Harvest Date" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register('harvest_date')} /></Grid>
            <Grid item xs={12}><TextField label="Description" multiline rows={3} fullWidth {...register('description')} /></Grid>
            <Grid item xs={12}><FormControlLabel control={<Switch {...register('is_organic')} />} label="Organic Certified" /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ borderRadius: 2 }}>{isSubmitting ? 'Saving…' : editListing ? 'Update' : 'Create Listing'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default function Marketplace() {
  usePageTitle('Marketplace');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editListing, setEditListing] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/listings/'); setListings(data.results ?? data); }
    catch { setListings([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing?')) return;
    try { await api.delete(`/listings/${id}/`); toast.success('Deleted'); fetch(); }
    catch (e) { toast.error(parseApiError(e)); }
  };

  const handlePublish = async (id) => {
    try { await api.patch(`/listings/${id}/`, { status: 'ACTIVE' }); toast.success('Listing published!'); fetch(); }
    catch (e) { toast.error(parseApiError(e)); }
  };

  const columns = ['Crop', 'Variety', 'Price / kg', 'Quantity', 'Status', 'Organic', 'Harvest Date', 'Actions'];

  return (
    <DashboardLayout title="Marketplace">
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>My Listings</Typography>
            <Typography variant="body2" color="text.secondary">{listings.length} listing{listings.length !== 1 ? 's' : ''}</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddCircleOutlineOutlined />} onClick={() => { setEditListing(null); setDialogOpen(true); }} sx={{ borderRadius: 2.5, ml: 'auto', flexShrink: 0 }}>New Listing</Button>
        </Stack>

        {loading ? (
          <Stack spacing={1}>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={52} sx={{ borderRadius: 2 }} />)}</Stack>
        ) : listings.length === 0 ? (
          <Paper sx={{ p: 6, borderRadius: 4, border: '2px dashed', borderColor: alpha('#2E7D32', 0.2), textAlign: 'center' }}>
            <Storefront sx={{ fontSize: 56, color: alpha('#2E7D32', 0.3), mb: 2 }} />
            <Typography variant="h6" fontWeight={700} color="text.secondary">No listings yet</Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>Create your first crop listing to start selling</Typography>
            <Button variant="contained" startIcon={<AddCircleOutlineOutlined />} onClick={() => setDialogOpen(true)}>Create Listing</Button>
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha('#2E7D32', 0.06) }}>
                  {columns.map(col => (
                    <TableCell key={col} sx={{ fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap', color: 'text.secondary', py: 1.5 }}>
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {listings.map((listing, idx) => {
                  const sc = STATUS_COLORS[listing.status] || '#94a3b8';
                  return (
                    <TableRow
                      key={listing.id}
                      sx={{
                        bgcolor: idx % 2 === 0 ? 'transparent' : alpha('#2E7D32', 0.02),
                        '&:hover': { bgcolor: alpha('#2E7D32', 0.05) },
                        transition: 'background 0.15s',
                      }}
                    >
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{listing.crop_name}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{listing.variety || '—'}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', fontWeight: 700, color: 'primary.main' }}>₹{listing.price_per_kg}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem' }}>{listing.quantity_kg} kg</TableCell>
                      <TableCell>
                        <Chip label={listing.status} size="small" sx={{ bgcolor: alpha(sc, 0.12), color: sc, fontWeight: 700, fontSize: '0.68rem', height: 22 }} />
                      </TableCell>
                      <TableCell>
                        {listing.is_organic
                          ? <Chip label="Organic" size="small" sx={{ bgcolor: alpha('#22c55e', 0.1), color: '#15803d', fontWeight: 700, fontSize: '0.68rem', height: 22 }} />
                          : <Typography variant="caption" color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{listing.harvest_date || '—'}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          {listing.status === 'DRAFT' && (
                            <IconButton size="small" color="success" title="Publish" onClick={() => handlePublish(listing.id)}>
                              <CheckCircleOutlined fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton size="small" onClick={() => { setEditListing(listing); setDialogOpen(true); }}>
                            <EditOutlined fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(listing.id)}>
                            <DeleteOutlined fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>
      <ListingFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSaved={fetch} editListing={editListing} />
    </DashboardLayout>
  );
}
