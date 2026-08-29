import { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, IconButton, MenuItem, Paper, Skeleton,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Tooltip, Typography, alpha,
} from '@mui/material';
import {
  AddCircleOutlineOutlined, AgricultureOutlined,
  Close, DeleteOutlined, EditOutlined,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/common/DashboardLayout';
import { usePageTitle } from '../../hooks/usePageTitle';
import { parseApiError } from '../../utils/errorParser';
import api from '../../services/api';

const SOIL_TYPES       = ['CLAY','SANDY','LOAMY','SILT','PEATY','CHALKY','OTHER'];
const IRRIGATION_TYPES = ['DRIP','SPRINKLER','FLOOD','RAINFED','CANAL','BOREWELL'];

/* ── Add / Edit dialog ───────────────────────────────────────────────────── */
function FarmFormDialog({ open, onClose, onSaved, editFarm }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  useEffect(() => { if (editFarm) reset(editFarm); else reset({}); }, [editFarm, reset]);

  const onSubmit = async (data) => {
    try {
      if (editFarm) { await api.patch(`/farms/${editFarm.id}/`, data); toast.success('Farm updated'); }
      else { await api.post('/farms/', data); toast.success('Farm created!'); }
      onSaved(); onClose();
    } catch (e) { toast.error(parseApiError(e, 'Could not save farm')); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography fontWeight={700}>{editFarm ? 'Edit Farm' : 'Add New Farm'}</Typography>
        <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField label="Farm Name *" fullWidth {...register('name', { required: 'Required' })} error={!!errors.name} helperText={errors.name?.message} /></Grid>
            <Grid item xs={6}><TextField label="Area (Acres)" type="number" fullWidth {...register('area_acres')} /></Grid>
            <Grid item xs={6}>
              <TextField select label="Soil Type" fullWidth defaultValue="LOAMY" {...register('soil_type')}>
                {SOIL_TYPES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField select label="Irrigation" fullWidth defaultValue="DRIP" {...register('irrigation_type')}>
                {IRRIGATION_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}><TextField label="Water Source" fullWidth {...register('water_source')} /></Grid>
            <Grid item xs={6}><TextField label="Village" fullWidth {...register('village')} /></Grid>
            <Grid item xs={6}><TextField label="Taluka" fullWidth {...register('taluka')} /></Grid>
            <Grid item xs={6}><TextField label="District" fullWidth {...register('district')} /></Grid>
            <Grid item xs={6}><TextField label="State" fullWidth {...register('state')} /></Grid>
            <Grid item xs={6}><TextField label="PIN Code" fullWidth {...register('pin_code')} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ borderRadius: 2 }}>
            {isSubmitting ? 'Saving…' : editFarm ? 'Update Farm' : 'Create Farm'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function FarmManager() {
  usePageTitle('Farm Manager');
  const [farms, setFarms]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editFarm, setEditFarm] = useState(null);

  const fetchFarms = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/farms/'); setFarms(data.results ?? data); }
    catch { setFarms([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFarms(); }, [fetchFarms]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this farm?')) return;
    try { await api.delete(`/farms/${id}/`); toast.success('Farm deleted'); fetchFarms(); }
    catch (e) { toast.error(parseApiError(e)); }
  };

  const columns = ['Farm Name', 'Code', 'Area', 'Soil', 'Irrigation', 'Location', 'Crops', 'Actions'];

  return (
    <DashboardLayout title="Farm Manager">
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>My Farms</Typography>
            <Typography variant="body2" color="text.secondary">
              {farms.length} farm{farms.length !== 1 ? 's' : ''} registered
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineOutlined />}
            onClick={() => { setEditFarm(null); setDialogOpen(true); }}
            sx={{ borderRadius: 2.5, ml: 'auto', flexShrink: 0 }}
          >
            Add Farm
          </Button>
        </Stack>

        {/* Table */}
        {loading ? (
          <Stack spacing={1}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={52} sx={{ borderRadius: 2 }} />)}</Stack>
        ) : farms.length === 0 ? (
          <Paper sx={{ p: 6, borderRadius: 4, border: '2px dashed', borderColor: alpha('#2E7D32', 0.2), textAlign: 'center' }}>
            <AgricultureOutlined sx={{ fontSize: 56, color: alpha('#2E7D32', 0.3), mb: 2 }} />
            <Typography variant="h6" fontWeight={700} color="text.secondary">No farms yet</Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
              Add your first farm to start managing your operations
            </Typography>
            <Button variant="contained" startIcon={<AddCircleOutlineOutlined />} onClick={() => setDialogOpen(true)}>
              Add First Farm
            </Button>
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
                {farms.map((farm, idx) => (
                  <TableRow
                    key={farm.id}
                    component={motion.tr}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    hover
                    sx={{
                      bgcolor: idx % 2 === 0 ? 'transparent' : alpha('#2E7D32', 0.02),
                      '&:hover': { bgcolor: alpha('#2E7D32', 0.05) },
                      transition: 'background 0.15s',
                    }}
                  >
                    {/* Farm Name */}
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>{farm.name}</Typography>
                    </TableCell>
                    {/* Code */}
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                        {farm.farm_code}
                      </Typography>
                    </TableCell>
                    {/* Area */}
                    <TableCell>
                      <Typography variant="body2">{farm.area_acres} ac</Typography>
                    </TableCell>
                    {/* Soil */}
                    <TableCell>
                      <Chip label={farm.soil_type} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, bgcolor: alpha('#8b5cf6', 0.08), color: '#7c3aed' }} />
                    </TableCell>
                    {/* Irrigation */}
                    <TableCell>
                      <Chip label={farm.irrigation_type} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, bgcolor: alpha('#3b82f6', 0.08), color: '#1d4ed8' }} />
                    </TableCell>
                    {/* Location */}
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 180, display: 'block' }}>
                        📍 {[farm.village, farm.taluka, farm.district, farm.state].filter(Boolean).join(', ') || '—'}
                      </Typography>
                    </TableCell>
                    {/* Crops count */}
                    <TableCell>
                      <Chip label={`${farm.crops_count ?? 0} crops`} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, bgcolor: alpha('#22c55e', 0.08), color: '#15803d' }} />
                    </TableCell>
                    {/* Actions */}
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => { setEditFarm(farm); setDialogOpen(true); }}>
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDelete(farm.id)}>
                            <DeleteOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      <FarmFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={fetchFarms}
        editFarm={editFarm}
      />
    </DashboardLayout>
  );
}
