import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, Divider, Grid, LinearProgress,
  Paper, Stack, Typography, alpha,
} from '@mui/material';
import { BugReport, CloudUploadOutlined, HistoryOutlined, WarningAmber } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/common/DashboardLayout';
import { usePageTitle } from '../../hooks/usePageTitle';
import { parseApiError } from '../../utils/errorParser';
import api from '../../services/api';

const SEV_COLORS = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#ef4444', CRITICAL: '#dc2626' };

function ResultPanel({ result }) {
  if (result.is_unknown || result.disease_name === 'Unknown Image') {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Paper sx={{ p: 3.5, borderRadius: 4, border: '1px solid', borderColor: alpha('#f59e0b', 0.4), bgcolor: alpha('#f59e0b', 0.04) }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: alpha('#f59e0b', 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <WarningAmber sx={{ fontSize: 28, color: '#d97706' }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} color="#b45309">
                Unknown Image
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Image Identification Notice
              </Typography>
            </Box>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.65 }}>
            {result.message || 'Unknown Image — Please upload a clear image of a supported crop leaf.'}
          </Typography>
        </Paper>
      </motion.div>
    );
  }

  const sev = result.severity;
  const sc = SEV_COLORS[sev] || (result.is_healthy ? '#22c55e' : '#64748b');
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: alpha(sc, 0.3), bgcolor: alpha(sc, 0.03) }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
              {result.crop_name || 'Crop'}
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ color: sc }}>
              {result.disease_name || 'Analyzing…'}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.75 }}>
              {result.confidence != null && (
                <Chip label={`${result.confidence}% confidence`} size="small" sx={{ bgcolor: alpha(sc, 0.1), color: sc, fontWeight: 700, height: 22 }} />
              )}
              {sev && sev !== 'NONE' && (
                <Chip label={`${sev} severity`} size="small" sx={{ bgcolor: alpha(sc, 0.1), color: sc, fontWeight: 700, height: 22 }} />
              )}
              {result.is_healthy && (
                <Chip label="✓ Healthy" size="small" sx={{ bgcolor: alpha('#22c55e', 0.1), color: '#15803d', fontWeight: 700, height: 22 }} />
              )}
            </Stack>
          </Box>
          <BugReport sx={{ fontSize: 40, color: alpha(sc, 0.4) }} />
        </Stack>

        {result.confidence != null && (
          <LinearProgress variant="determinate" value={result.confidence}
            sx={{ height: 6, borderRadius: 3, bgcolor: alpha(sc, 0.15), '& .MuiLinearProgress-bar': { bgcolor: sc }, mb: 2 }} />
        )}

        {[
          { label: '🔍 Symptoms',            val: result.symptoms },
          { label: '🌿 Organic Treatment',   val: result.organic_treatment },
          { label: '💊 Chemical Treatment',  val: result.chemical_treatment },
        ].map(r => r.val ? (
          <Box key={r.label} sx={{ mb: 1.5 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary">{r.label}</Typography>
            <Typography variant="body2" sx={{ mt: 0.25, lineHeight: 1.65 }}>{r.val}</Typography>
          </Box>
        ) : null)}

        {/* Top-5 predictions */}
        {result.top_predictions?.length > 1 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary">📊 Top Predictions</Typography>
            <Stack spacing={0.75} sx={{ mt: 0.75 }}>
              {result.top_predictions.map((p, i) => (
                <Stack key={i} direction="row" alignItems="center" spacing={1}>
                  <Typography variant="caption" sx={{ minWidth: 140, color: i === 0 ? 'text.primary' : 'text.secondary', fontWeight: i === 0 ? 700 : 400 }} noWrap>
                    {p.class}
                  </Typography>
                  <LinearProgress variant="determinate" value={p.confidence}
                    sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: i === 0 ? sc : 'text.disabled' } }} />
                  <Typography variant="caption" sx={{ minWidth: 38, textAlign: 'right', color: i === 0 ? sc : 'text.secondary', fontWeight: i === 0 ? 700 : 400 }}>
                    {p.confidence}%
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}

        <Typography variant="caption" color="text.disabled" sx={{ mt: 2, display: 'block' }}>
          Powered by {result.model || 'CropX ML Model'}
        </Typography>
      </Paper>
    </motion.div>
  );
}

export default function DiseaseScanner() {
  usePageTitle('Disease Scanner');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const inputRef = useRef();

  const fetchHistory = useCallback(async () => {
    try { const { data } = await api.get('/disease/scans/'); setHistory(data.results ?? data); }
    catch { setHistory([]); }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f); setResult(null);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); };

  const handleScan = async () => {
    if (!file) return toast.error('Please upload a leaf image first');
    setScanning(true);
    try {
      // Hit the ML inference endpoint
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/ai/scan/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);

      // Also save to scan history (fire-and-forget)
      try {
        const histFd = new FormData();
        histFd.append('image', file);
        histFd.append('disease_name', data.disease_name || '');
        histFd.append('severity', data.severity || 'MEDIUM');
        histFd.append('confidence', data.confidence || 0);
        histFd.append('symptoms', data.symptoms || '');
        histFd.append('organic_treatment', data.organic_treatment || '');
        histFd.append('chemical_treatment', data.chemical_treatment || '');
        histFd.append('scan_status', 'COMPLETED');
        await api.post('/disease/scans/', histFd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        fetchHistory();
      } catch { /* history save is optional */ }
    } catch (e) {
      toast.error(parseApiError(e, 'Scan failed. Try again.'));
    } finally {
      setScanning(false);
    }
  };

  return (
    <DashboardLayout title="Disease Scanner">
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h5" fontWeight={800}>AI Disease Scanner</Typography>
              <Typography variant="body2" color="text.secondary">Upload a clear leaf photo for instant disease detection</Typography>
            </Box>

            {/* Upload zone */}
            <Paper
              onDrop={handleDrop} onDragOver={e => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              sx={{ p: 4, borderRadius: 4, border: '2px dashed', borderColor: preview ? 'primary.main' : alpha('#2E7D32', 0.3), bgcolor: alpha('#2E7D32', 0.03), textAlign: 'center', cursor: 'pointer', '&:hover': { borderColor: 'primary.main', bgcolor: alpha('#2E7D32', 0.06) }, transition: 'all 0.2s' }}>
              <input ref={inputRef} type="file" hidden accept="image/*" onChange={e => handleFile(e.target.files[0])} />
              {preview ? (
                <Box sx={{ position: 'relative' }}>
                  <Box component="img" src={preview} sx={{ maxHeight: 200, maxWidth: '100%', borderRadius: 3, objectFit: 'cover' }} />
                  <Typography variant="caption" color="primary.main" sx={{ mt: 1, display: 'block', fontWeight: 600 }}>✓ Image ready for scan</Typography>
                </Box>
              ) : (
                <>
                  <CloudUploadOutlined sx={{ fontSize: 48, color: alpha('#2E7D32', 0.4), mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight={600}>Drop leaf image here</Typography>
                  <Typography variant="caption" color="text.secondary">or click to browse · JPG, PNG, WebP</Typography>
                </>
              )}
            </Paper>

            <Button variant="contained" size="large" fullWidth onClick={handleScan} disabled={!file || scanning}
              sx={{ borderRadius: 2.5, py: 1.5 }}>
              {scanning ? <><CircularProgress size={18} sx={{ mr: 1, color: 'white' }} />Analyzing…</> : '🔬 Scan for Disease'}
            </Button>
          </Stack>
        </Grid>

        <Grid item xs={12} md={7}>
          <Stack spacing={2.5}>
            <AnimatePresence mode="wait">
              {scanning && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Paper sx={{ p: 4, borderRadius: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                    <CircularProgress sx={{ color: '#2E7D32', mb: 2 }} />
                    <Typography variant="h6" fontWeight={700}>Analyzing leaf…</Typography>
                    <Typography variant="body2" color="text.secondary">AI model is processing the image</Typography>
                  </Paper>
                </motion.div>
              )}
              {!scanning && result && <ResultPanel key="result" result={result} />}
            </AnimatePresence>

            {/* Scan history */}
            <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <HistoryOutlined sx={{ color: 'text.secondary' }} />
                <Typography variant="h6" fontWeight={700}>Scan History</Typography>
                <Chip label={history.length} size="small" sx={{ bgcolor: alpha('#2E7D32', 0.1), color: '#2E7D32', fontWeight: 700, height: 22 }} />
              </Stack>
              {history.length === 0 ? (
                <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 3 }}>No scans yet</Typography>
              ) : (
                <Stack spacing={1}>
                  {history.slice(0, 5).map(s => (
                    <Box key={s.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderRadius: 2.5, bgcolor: alpha('#2E7D32', 0.03), border: '1px solid', borderColor: 'divider' }}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{s.disease_name || 'Pending…'}</Typography>
                        <Typography variant="caption" color="text.secondary">{new Date(s.created_at).toLocaleDateString()}</Typography>
                      </Box>
                      {s.severity && <Chip label={s.severity} size="small" sx={{ bgcolor: alpha(SEV_COLORS[s.severity] || '#64748b', 0.1), color: SEV_COLORS[s.severity] || '#64748b', fontWeight: 700, height: 22, fontSize: '0.68rem' }} />}
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
}
