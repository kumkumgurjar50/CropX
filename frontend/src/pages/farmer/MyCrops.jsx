import { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, MenuItem, Paper, Skeleton, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography, alpha,
} from '@mui/material';
import { AddCircleOutlineOutlined, Close, DeleteOutlined, EditOutlined, GrassOutlined } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/common/DashboardLayout';
import { usePageTitle } from '../../hooks/usePageTitle';
import { parseApiError } from '../../utils/errorParser';
import api from '../../services/api';

const STAGES = ['SOWING','GERMINATION','VEGETATIVE','FLOWERING','FRUITING','MATURITY','HARVESTED'];
const HEALTH = ['EXCELLENT','GOOD','FAIR','POOR','CRITICAL'];
const HEALTH_COLORS = { EXCELLENT: '#22c55e', GOOD: '#4caf50', FAIR: '#f59e0b', POOR: '#ef4444', CRITICAL: '#dc2626' };
const STAGE_COLORS = { SOWING: '#94a3b8', GERMINATION: '#86efac', VEGETATIVE: '#22c55e', FLOWERING: '#f472b6', FRUITING: '#fb923c', MATURITY: '#fbbf24', HARVESTED: '#a3e635' };

function CropFormDialog({ open, onClose, onSaved, editCrop, farms }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  useEffect(() => { if (editCrop) reset(editCrop); else reset({}); }, [editCrop, reset]);
  const onSubmit = async (data) => {
    try {
      if (editCrop) { await api.patch(`/crops/${editCrop.id}/`, data); toast.success('Crop updated'); }
      else { await api.post('/crops/', data); toast.success('Crop added!'); }
      onSaved(); onClose();
    } catch (e) { toast.error(parseApiError(e, 'Could not save crop')); }
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography fontWeight={700}>{editCrop ? 'Edit Crop' : 'Add Crop'}</Typography>
        <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField select label="Farm *" fullWidth {...register('farm', { required: 'Required' })} error={!!errors.farm} helperText={errors.farm?.message}>
                {farms.map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}><TextField label="Crop Name *" fullWidth {...register('name', { required: 'Required' })} error={!!errors.name} helperText={errors.name?.message} /></Grid>
            <Grid item xs={6}><TextField label="Variety" fullWidth {...register('variety')} /></Grid>
            <Grid item xs={6}>
              <TextField select label="Stage" fullWidth defaultValue="SOWING" {...register('current_stage')}>
                {STAGES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField select label="Health" fullWidth defaultValue="GOOD" {...register('health_status')}>
                {HEALTH.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}><TextField label="Area (acres)" type="number" fullWidth {...register('area_acres')} /></Grid>
            <Grid item xs={6}><TextField label="Est. Yield (kg)" type="number" fullWidth {...register('expected_yield_kg')} /></Grid>
            <Grid item xs={6}><TextField label="Sowing Date" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register('sowing_date')} /></Grid>
            <Grid item xs={6}><TextField label="Expected Harvest" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register('expected_harvest')} /></Grid>
            <Grid item xs={12}><TextField label="Notes" multiline rows={2} fullWidth {...register('notes')} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ borderRadius: 2 }}>{isSubmitting ? 'Saving…' : editCrop ? 'Update' : 'Add Crop'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default function MyCrops() {
  usePageTitle('My Crops');
  const [crops, setCrops] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCrop, setEditCrop] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [c, f] = await Promise.all([api.get('/crops/'), api.get('/farms/')]);
      setCrops(c.data.results ?? c.data);
      setFarms(f.data.results ?? f.data);
    } catch { setCrops([]); setFarms([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this crop?')) return;
    try { await api.delete(`/crops/${id}/`); toast.success('Crop deleted'); fetchAll(); }
    catch (e) { toast.error(parseApiError(e)); }
  };

  const columns = ['Crop', 'Variety', 'Stage', 'Health', 'Area', 'Est. Yield', 'Sowing', 'Harvest', 'Farm', 'Actions'];

  return (
    <DashboardLayout title="My Crops">
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>My Crops</Typography>
            <Typography variant="body2" color="text.secondary">{crops.length} crop{crops.length !== 1 ? 's' : ''} active</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddCircleOutlineOutlined />} onClick={() => { setEditCrop(null); setDialogOpen(true); }} sx={{ borderRadius: 2.5, ml: 'auto', flexShrink: 0 }}>
            Add Crop
          </Button>
        </Stack>

        {loading ? (
          <Stack spacing={1}>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={52} sx={{ borderRadius: 2 }} />)}</Stack>
        ) : crops.length === 0 ? (
          <Paper sx={{ p: 6, borderRadius: 4, border: '2px dashed', borderColor: alpha('#2E7D32', 0.2), textAlign: 'center' }}>
            <GrassOutlined sx={{ fontSize: 56, color: alpha('#2E7D32', 0.3), mb: 2 }} />
            <Typography variant="h6" fontWeight={700} color="text.secondary">No crops yet</Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>Add your first crop to start tracking growth and health</Typography>
            <Button variant="contained" startIcon={<AddCircleOutlineOutlined />} onClick={() => setDialogOpen(true)}>Add First Crop</Button>
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
                {crops.map((crop, idx) => {
                  const hc = HEALTH_COLORS[crop.health_status] || '#64748b';
                  const sc = STAGE_COLORS[crop.current_stage] || '#94a3b8';
                  return (
                    <TableRow
                      key={crop.id}
                      sx={{
                        bgcolor: idx % 2 === 0 ? 'transparent' : alpha('#2E7D32', 0.02),
                        '&:hover': { bgcolor: alpha('#2E7D32', 0.05) },
                        transition: 'background 0.15s',
                      }}
                    >
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{crop.name}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{crop.variety || '—'}</TableCell>
                      <TableCell>
                        <Chip label={crop.current_stage} size="small" sx={{ bgcolor: alpha(sc, 0.15), color: sc, fontWeight: 700, fontSize: '0.68rem', height: 22 }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={crop.health_status} size="small" sx={{ bgcolor: alpha(hc, 0.1), color: hc, fontWeight: 700, fontSize: '0.68rem', height: 22 }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem' }}>{crop.area_acres} ac</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem' }}>{crop.expected_yield_kg} kg</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{crop.sowing_date || '—'}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{crop.expected_harvest || '—'}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem' }}>📍 {crop.farm_name}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton size="small" onClick={() => { setEditCrop(crop); setDialogOpen(true); }}>
                            <EditOutlined fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(crop.id)}>
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
      <CropFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSaved={fetchAll} editCrop={editCrop} farms={farms} />
    </DashboardLayout>
  );
}
