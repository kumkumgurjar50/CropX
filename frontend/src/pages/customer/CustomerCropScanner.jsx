import { useRef, useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, Grid,
  LinearProgress, Paper, Stack, Typography, alpha,
} from '@mui/material';
import {
  BugReportOutlined, CloudUploadOutlined, RestartAlt,
  TrendingDown, TrendingFlat, TrendingUp, WarningAmberOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/common/DashboardLayout';
import { usePageTitle } from '../../hooks/usePageTitle';
import api from '../../services/api';

/* ── Shared constants ─────────────────────────────────────────────────────── */
const SEV_COLORS = {
  NONE:     '#22c55e',
  LOW:      '#4caf50',
  MEDIUM:   '#f59e0b',
  HIGH:     '#ef4444',
  CRITICAL: '#dc2626',
};
const TREND_COLORS = { UP: '#22c55e', DOWN: '#ef4444', STABLE: '#f59e0b' };

function TrendIcon({ trend }) {
  if (trend === 'UP')   return <TrendingUp fontSize="small" />;
  if (trend === 'DOWN') return <TrendingDown fontSize="small" />;
  return <TrendingFlat fontSize="small" />;
}

/* ── Result card — mirrors DiseaseScanner's ResultPanel ─────────────────── */
function ResultCard({ result }) {
  if (result.is_unknown || result.disease_name === 'Unknown Image') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <Paper sx={{ p: 3.5, borderRadius: 4, border: '1px solid', borderColor: alpha('#f59e0b', 0.4), bgcolor: alpha('#f59e0b', 0.04) }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: alpha('#f59e0b', 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <WarningAmberOutlined sx={{ fontSize: 28, color: '#d97706' }} />
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
  const sev = result.severity || (result.is_healthy ? 'NONE' : 'MEDIUM');
  const sc  = SEV_COLORS[sev] || '#64748b';
  const mp  = result.market_price;
  const tc  = mp ? (TREND_COLORS[mp.trend] ?? '#64748b') : '#64748b';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <Stack spacing={2.5}>

        {/* ── Crop / Disease identification ───────────────────────────── */}
        <Paper sx={{
          p: 3, borderRadius: 4,
          border: '1px solid', borderColor: alpha(sc, 0.35),
          bgcolor: alpha(sc, 0.03),
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <BugReportOutlined sx={{ fontSize: 16, color: sc }} />
                <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 1.4, color: 'text.secondary', fontSize: '0.65rem' }}>
                  CropX LOCAL MODEL · DISEASE DETECTION
                </Typography>
              </Stack>
              <Typography variant="h4" fontWeight={900} sx={{ color: sc }}>
                {result.disease_name || 'Unknown'}
              </Typography>
              {result.crop_name && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  Crop: <strong>{result.crop_name}</strong>
                </Typography>
              )}
            </Box>
            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
              <Typography variant="h4" fontWeight={900} sx={{
                color: result.confidence >= 80 ? '#22c55e'
                  : result.confidence >= 50 ? '#f59e0b' : '#ef4444',
              }}>
                {result.confidence}%
              </Typography>
              <Typography variant="caption" color="text.secondary">Confidence</Typography>
            </Box>
          </Stack>

          {/* Confidence bar */}
          <LinearProgress
            variant="determinate" value={result.confidence}
            sx={{
              height: 6, borderRadius: 3, mb: 2,
              bgcolor: alpha(sc, 0.12),
              '& .MuiLinearProgress-bar': {
                bgcolor: result.confidence >= 80 ? '#22c55e'
                  : result.confidence >= 50 ? '#f59e0b' : '#ef4444',
                borderRadius: 3,
              },
            }}
          />

          {/* Badges */}
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.75}>
            {result.is_healthy && (
              <Chip label="✓ Healthy" size="small" sx={{ bgcolor: alpha('#22c55e', 0.1), color: '#15803d', fontWeight: 700, height: 24 }} />
            )}
            <Chip
              label={`${sev === 'NONE' ? 'No disease' : sev + ' severity'}`}
              size="small"
              sx={{ bgcolor: alpha(sc, 0.1), color: sc, fontWeight: 700, height: 24 }}
            />
          </Stack>

          {/* Treatment info */}
          {[
            { label: '🔍 Symptoms',            val: result.symptoms },
            { label: '🌿 Organic Treatment',   val: result.organic_treatment },
            { label: '💊 Chemical Treatment',  val: result.chemical_treatment },
          ].map(r => r.val ? (
            <Box key={r.label} sx={{ mt: 1.75 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">{r.label}</Typography>
              <Typography variant="body2" sx={{ mt: 0.25, lineHeight: 1.7 }}>{r.val}</Typography>
            </Box>
          ) : null)}

          {/* Top-5 predictions */}
          {result.top_predictions?.length > 1 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">📊 Top 5 Predictions</Typography>
              <Stack spacing={0.75} sx={{ mt: 0.75 }}>
                {result.top_predictions.map((p, i) => (
                  <Stack key={i} direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption" sx={{
                      minWidth: 150, color: i === 0 ? 'text.primary' : 'text.secondary',
                      fontWeight: i === 0 ? 700 : 400,
                    }} noWrap>
                      {p.class}
                    </Typography>
                    <LinearProgress variant="determinate" value={p.confidence} sx={{
                      flex: 1, height: 4, borderRadius: 2, bgcolor: 'action.hover',
                      '& .MuiLinearProgress-bar': { bgcolor: i === 0 ? sc : alpha(sc, 0.35) },
                    }} />
                    <Typography variant="caption" sx={{
                      minWidth: 40, textAlign: 'right',
                      color: i === 0 ? sc : 'text.secondary',
                      fontWeight: i === 0 ? 700 : 400,
                    }}>
                      {p.confidence}%
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}

          <Typography variant="caption" color="text.disabled" sx={{ mt: 2, display: 'block' }}>
            Powered by {result.model || 'CropX Local Model'}
          </Typography>
        </Paper>

        {/* ── Live market price ────────────────────────────────────────── */}
        {mp ? (
          <Paper sx={{
            p: 2.5, borderRadius: 4,
            border: '2px solid', borderColor: alpha(tc, 0.4),
            bgcolor: alpha(tc, 0.04),
          }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 1.4, color: 'text.secondary', fontSize: '0.65rem' }}>
                  CURRENT MARKET PRICE
                </Typography>
                <Stack direction="row" spacing={1} alignItems="baseline">
                  <Typography variant="h3" fontWeight={900} sx={{ color: tc }}>
                    ₹{mp.price_per_quintal?.toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">/quintal</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">📍 {mp.market}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end" sx={{ color: tc }}>
                  <TrendIcon trend={mp.trend} />
                  <Typography variant="h5" fontWeight={800} sx={{ color: tc }}>
                    {mp.change_percent > 0 ? '+' : ''}{mp.change_percent}%
                  </Typography>
                </Stack>
                <Chip label={mp.trend} size="small" sx={{ bgcolor: alpha(tc, 0.12), color: tc, fontWeight: 700, height: 22 }} />
              </Box>
            </Stack>
          </Paper>
        ) : (
          <Paper sx={{ p: 2, borderRadius: 4, border: '1px dashed', borderColor: alpha('#94a3b8', 0.3), textAlign: 'center' }}>
            <Typography variant="body2" color="text.disabled">
              Market price not available for this crop in our database.
            </Typography>
          </Paper>
        )}
      </Stack>
    </motion.div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function CustomerCropScanner() {
  usePageTitle('Crop Scanner');
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult]   = useState(null);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) handleFile(f);
  };

  const handleScan = async () => {
    if (!file) return;
    setScanning(true);
    setResult(null);
    try {
      // Send as multipart/form-data — same as DiseaseScanner, routed to local model
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/ai/scan/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      if (data.is_healthy) {
        toast.success(`${data.crop_name} looks healthy! (${data.confidence}% confidence)`);
      } else if (data.disease_name && data.disease_name !== 'Unknown') {
        toast.info(`Detected: ${data.disease_name} on ${data.crop_name} (${data.confidence}%)`);
      } else {
        toast.warning('Could not confidently identify the crop. Try a clearer photo.');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Scan failed. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const reset = () => { setFile(null); setPreview(null); setResult(null); };

  return (
    <DashboardLayout title="Crop Scanner">
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" fontWeight={800}>AI Crop Disease Scanner</Typography>
          <Typography variant="body2" color="text.secondary">
            Upload a leaf photo — our local ML model identifies the disease, severity, and recommended treatment instantly.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* ── Upload panel ── */}
          <Grid item xs={12} md={5}>
            <Stack spacing={2}>
              <Paper
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => !file && inputRef.current?.click()}
                sx={{
                  p: { xs: 3, md: 4 }, borderRadius: 4, border: '2px dashed',
                  borderColor: preview ? 'primary.main' : alpha('#2E7D32', 0.3),
                  textAlign: 'center',
                  cursor: file ? 'default' : 'pointer',
                  bgcolor: alpha('#2E7D32', 0.03),
                  '&:hover': !file ? { borderColor: 'primary.main', bgcolor: alpha('#2E7D32', 0.06) } : {},
                  transition: 'all 0.2s',
                }}
              >
                <input ref={inputRef} type="file" hidden accept="image/*" onChange={e => handleFile(e.target.files[0])} />
                {preview ? (
                  <Box>
                    <Box component="img" src={preview} sx={{ maxHeight: 220, maxWidth: '100%', borderRadius: 3, objectFit: 'cover', mx: 'auto' }} />
                    <Typography variant="caption" color="primary.main" display="block" fontWeight={600} sx={{ mt: 1 }}>
                      ✓ Image ready to scan
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <CloudUploadOutlined sx={{ fontSize: 52, color: alpha('#2E7D32', 0.4), mb: 1.5 }} />
                    <Typography variant="subtitle1" fontWeight={700}>Drop leaf photo here</Typography>
                    <Typography variant="body2" color="text.secondary">or click to browse · JPG, PNG, WebP</Typography>
                  </>
                )}
              </Paper>

              {/* Scan button */}
              {file && !scanning && !result && (
                <Button
                  variant="contained" size="large" fullWidth onClick={handleScan}
                  startIcon={<BugReportOutlined />}
                  sx={{ py: 1.5, fontWeight: 700, borderRadius: 2.5 }}
                >
                  Scan with Local AI Model
                </Button>
              )}

              {scanning && (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <CircularProgress sx={{ color: '#2E7D32', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    Local model analysing image…
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    107-class CropX MobileNetV2 model
                  </Typography>
                </Box>
              )}

              {result && (
                <Button variant="outlined" startIcon={<RestartAlt />} onClick={reset} sx={{ borderRadius: 2 }}>
                  Scan another crop
                </Button>
              )}

              {/* Info box */}
              <Paper sx={{ p: 2, borderRadius: 3, bgcolor: alpha('#2E7D32', 0.04), border: '1px solid', borderColor: alpha('#2E7D32', 0.15) }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  🤖 About this scanner
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  Predictions are made by a <strong>local MobileNetV2 model</strong> trained on 107 crop disease classes
                  (tomato, potato, rice, wheat, apple, corn, grape and more). No data leaves your server.
                </Typography>
              </Paper>
            </Stack>
          </Grid>

          {/* ── Results panel ── */}
          <Grid item xs={12} md={7}>
            <AnimatePresence mode="wait">
              {!file && !result && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Paper sx={{
                    p: 6, borderRadius: 4, border: '2px dashed',
                    borderColor: alpha('#2E7D32', 0.15), textAlign: 'center',
                    bgcolor: alpha('#2E7D32', 0.02),
                  }}>
                    <Typography sx={{ fontSize: 56, mb: 2 }}>🌿</Typography>
                    <Typography variant="h6" fontWeight={700} color="text.secondary">Upload an image to begin</Typography>
                    <Typography variant="body2" color="text.disabled" sx={{ mt: 1, maxWidth: 340, mx: 'auto' }}>
                      Works best with clear, well-lit photos of leaves, fruits, or the whole plant.
                    </Typography>
                  </Paper>
                </motion.div>
              )}
              {result && !scanning && (
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ResultCard result={result} />
                </motion.div>
              )}
            </AnimatePresence>
          </Grid>
        </Grid>
      </Stack>
    </DashboardLayout>
  );
}
