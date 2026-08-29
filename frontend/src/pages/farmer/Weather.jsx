import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, Grid, InputAdornment,
  Paper, Skeleton, Stack, TextField, Typography, alpha,
} from '@mui/material';
import { MyLocation, Search, WifiOffOutlined } from '@mui/icons-material';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/common/DashboardLayout';
import { usePageTitle } from '../../hooks/usePageTitle';
import api from '../../services/api';

const OW_ICON = code => `https://openweathermap.org/img/wn/${code}@2x.png`;

/* ── Stat box inside the hero card ───────────────────────────────────────── */
function WeatherStatBox({ emoji, label, value }) {
  return (
    <Box sx={{
      bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 3, p: 1.5, textAlign: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      <Typography sx={{ fontSize: 22 }}>{emoji}</Typography>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block' }}>{label}</Typography>
      <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'white' }}>{value}</Typography>
    </Box>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function Weather() {
  usePageTitle('Weather');

  const [city, setCity]           = useState('Ahmedabad');
  const [inputCity, setInputCity] = useState('Ahmedabad');
  const [weather, setWeather]     = useState(null);
  const [forecast, setForecast]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [isMock, setIsMock]       = useState(false);
  const [isGemini, setIsGemini]   = useState(false);

  const fetchWeather = useCallback(async (cityName, lat, lon) => {
    setLoading(true);
    setError(null);
    try {
      const params = lat && lon
        ? { lat, lon }
        : { city: cityName };
      const { data } = await api.get('/weather/', { params });
      setWeather(data.current);
      setForecast(data.forecast || []);
      setIsMock(Boolean(data.mock));
      setIsGemini(Boolean(data.gemini_weather));
      if (data.current?.city) {
        setCity(data.current.city);
        setInputCity(data.current.city);
      }
    } catch (e) {
      const msg = e.response?.data?.detail || 'Could not fetch weather data.';
      setError(msg);
      setWeather(null);
      setForecast([]);
      setIsMock(false);
      setIsGemini(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => fetchWeather(null, pos.coords.latitude, pos.coords.longitude),
      ()  => fetchWeather('New Delhi'),
    );
  };

  useEffect(() => { fetchWeather(city); }, [city, fetchWeather]);

  const handleSearch = e => {
    e.preventDefault();
    const trimmed = inputCity.trim();
    if (trimmed) setCity(trimmed);
  };

  const chartData = forecast.map(d => ({
    day:  d.day?.slice(0, 3),
    high: d.temp_max,
    low:  d.temp_min,
    rain: d.rain_prob,
  }));

  return (
    <DashboardLayout title="Weather">
      <Stack spacing={3}>

        {/* ── Header + search ── */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ sm: 'center' }}
          spacing={1.5}
        >
          <Box>
            <Typography variant="h5" fontWeight={800}>Weather Forecast</Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time agricultural weather data with AI farming advice
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} component="form" onSubmit={handleSearch}>
            <TextField
              size="small"
              value={inputCity}
              onChange={e => setInputCity(e.target.value)}
              placeholder="City name…"
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
              sx={{ width: 200, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Button type="submit" variant="contained" size="small" sx={{ borderRadius: 2, px: 2 }}>Go</Button>
            <Button
              variant="outlined" size="small"
              onClick={detectLocation}
              startIcon={<MyLocation fontSize="small" />}
              sx={{ borderRadius: 2 }}
            >
              Auto
            </Button>
          </Stack>
        </Stack>

        {/* ── Status banner ── */}
        {!loading && (isMock || isGemini) && (
          <Alert
            severity={isGemini ? 'info' : 'warning'}
            icon={isGemini ? undefined : <WifiOffOutlined fontSize="inherit" />}
            sx={{ borderRadius: 3 }}
          >
            {isGemini
              ? <><strong>Gemini AI Weather</strong> — Your OpenWeatherMap key is activating (can take up to 2 hours after signup). Showing AI-generated forecast for {weather?.city}.</>
              : <><strong>Demo mode</strong> — Add your <code>OPENWEATHER_API_KEY</code> to <code>backend/.env</code> for live data.</>
            }
          </Alert>
        )}

        {/* ── Loading skeletons ── */}
        {loading && (
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 4 }} />
            <Grid container spacing={2}>
              {Array.from({ length: 7 }).map((_, i) => (
                <Grid item xs={6} sm={3} md key={i}>
                  <Skeleton height={110} sx={{ borderRadius: 3 }} />
                </Grid>
              ))}
            </Grid>
          </Stack>
        )}

        {/* ── Error state ── */}
        {error && !loading && (
          <Paper sx={{
            p: 4, borderRadius: 4, textAlign: 'center',
            border: '1px solid', borderColor: alpha('#ef4444', 0.3),
            bgcolor: alpha('#ef4444', 0.03),
          }}>
            <Typography sx={{ fontSize: 48, mb: 1 }}>⚠️</Typography>
            <Typography variant="h6" fontWeight={700} color="error.main" sx={{ mb: 0.5 }}>
              {error}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Try a different city name, e.g. "Mumbai", "Pune", "Hyderabad"
            </Typography>
            <Button
              variant="outlined"
              size="small"
              sx={{ borderRadius: 2 }}
              onClick={() => { setInputCity('Mumbai'); setCity('Mumbai'); }}
            >
              Try Mumbai
            </Button>
          </Paper>
        )}

        {/* ── Weather data ── */}
        {weather && !loading && (
          <>
            {/* ── Hero current weather card ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <Paper sx={{
                p: 3, borderRadius: 4,
                background: 'linear-gradient(135deg,#0f4c75 0%,#1b6ca8 50%,#1e88e5 100%)',
                border: 'none', overflow: 'hidden', position: 'relative',
              }}>
                {(isMock || isGemini) && (
                  <Chip
                    label={isGemini ? '🤖 Gemini AI' : 'Sample data'}
                    size="small"
                    sx={{
                      position: 'absolute', top: 12, right: 12,
                      bgcolor: 'rgba(255,255,255,0.15)', color: 'white',
                      fontWeight: 600, fontSize: '0.65rem',
                    }}
                  />
                )}
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        component="img"
                        src={OW_ICON(weather.icon_code)}
                        sx={{ width: 80, height: 80 }}
                        alt={weather.description}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      <Box>
                        <Typography variant="h2" fontWeight={900} sx={{ color: 'white', lineHeight: 1 }}>
                          {weather.temp}°C
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                          {weather.description}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.25 }}>
                          📍 {weather.city}{weather.country ? `, ${weather.country}` : ''} · Feels like {weather.feels_like}°C
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Grid container spacing={1.5}>
                      <Grid item xs={6}><WeatherStatBox emoji="💧" label="Humidity"    value={`${weather.humidity}%`} /></Grid>
                      <Grid item xs={6}><WeatherStatBox emoji="💨" label="Wind"        value={`${weather.wind_speed} km/h`} /></Grid>
                      <Grid item xs={6}><WeatherStatBox emoji="👁️" label="Visibility"  value={`${weather.visibility} km`} /></Grid>
                      <Grid item xs={6}><WeatherStatBox emoji="☁️" label="Cloud Cover" value={`${weather.clouds}%`} /></Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Paper>
            </motion.div>

            {/* ── Temperature + rain chart ── */}
            {chartData.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    7-Day Temperature &amp; Rain Forecast
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gHigh" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gLow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.06)} />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, fontSize: 12 }}
                        formatter={(v, n) => [`${v}${n.includes('rain') ? '%' : '°C'}`, n]}
                      />
                      <Area type="monotone" dataKey="high" name="High °C" stroke="#ef4444" strokeWidth={2} fill="url(#gHigh)" />
                      <Area type="monotone" dataKey="low"  name="Low °C"  stroke="#3b82f6" strokeWidth={2} fill="url(#gLow)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Paper>
              </motion.div>
            )}

            {/* ── 7-day forecast cards ── */}
            {forecast.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Grid container spacing={1.5}>
                  {forecast.map((day, i) => (
                    <Grid item xs={6} sm={4} md key={day.date} sx={{ minWidth: 110 }}>
                      <Paper sx={{
                        p: 1.5, borderRadius: 3, textAlign: 'center',
                        border: '1px solid',
                        borderColor: i === 0 ? 'primary.main' : 'divider',
                        bgcolor: i === 0 ? alpha('#2E7D32', 0.04) : 'background.paper',
                        '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)', boxShadow: 2 },
                        transition: 'all 0.15s',
                      }}>
                        <Typography variant="caption" fontWeight={700} color={i === 0 ? 'primary.main' : 'text.secondary'} display="block">
                          {i === 0 ? 'Today' : day.day}
                        </Typography>
                        <Box
                          component="img"
                          src={OW_ICON(day.icon_code)}
                          sx={{ width: 44, height: 44, mx: 'auto' }}
                          alt={day.description}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                        <Typography variant="subtitle2" fontWeight={800}>{day.temp_max}°</Typography>
                        <Typography variant="caption" color="text.secondary">{day.temp_min}°</Typography>
                        <Box sx={{ mt: 0.75 }}>
                          <Chip
                            label={`🌧️ ${day.rain_prob}%`}
                            size="small"
                            sx={{ fontSize: '0.6rem', height: 18, bgcolor: alpha('#3b82f6', 0.08), color: '#1d4ed8' }}
                          />
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </motion.div>
            )}

            {/* ── AI Farming Advice ── */}
            {forecast.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight={700}>🤖 AI Farming Recommendations</Typography>
                    {(isMock || isGemini) && (
                      <Chip label={isGemini ? '🤖 Gemini AI tips' : 'Sample tips'} size="small" sx={{ height: 20, fontSize: '0.62rem', bgcolor: alpha(isGemini ? '#3b82f6' : '#f59e0b', 0.1), color: isGemini ? '#1d4ed8' : '#b45309' }} />
                    )}
                  </Stack>
                  <Stack spacing={1.5}>
                    {forecast.map((day, i) => (
                      <Box
                        key={day.date}
                        sx={{
                          display: 'flex', gap: 2, p: 1.75, borderRadius: 2.5,
                          bgcolor: alpha('#2E7D32', 0.03),
                          border: '1px solid', borderColor: alpha('#2E7D32', 0.1),
                          '&:hover': { bgcolor: alpha('#2E7D32', 0.06), borderColor: alpha('#2E7D32', 0.2) },
                          transition: 'all 0.15s',
                        }}
                      >
                        <Box sx={{ textAlign: 'center', minWidth: 64, flexShrink: 0 }}>
                          <Typography variant="caption" fontWeight={700} color="primary.main" display="block">
                            {i === 0 ? 'Today' : day.day}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {day.temp_max}°/{day.temp_min}°
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                          {day.ai_advice}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </motion.div>
            )}
          </>
        )}

      </Stack>
    </DashboardLayout>
  );
}
