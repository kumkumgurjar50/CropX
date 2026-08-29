import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Avatar, Box, Chip, CircularProgress, Fab, IconButton,
  InputAdornment, Paper, Stack, TextField, Tooltip, Typography, alpha,
} from '@mui/material';
import { AutoAwesome, Close, Refresh, Send, SmartToy } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

const GROQ_KEY   = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_INSTRUCTION = `You are CropX AI — a friendly, expert agricultural advisor for Indian farmers and customers on the CropX platform.

You help with:
• 🌾 Crop advice (planting seasons, irrigation, fertilisers, pest control)
• 📊 Market prices and selling strategy relevant to India
• 🌦️ Weather-related farming tips
• 🏪 Platform guidance (listing crops, placing orders, using features)
• 🔬 Crop disease hints and organic treatment suggestions
• 💰 Farm economics and revenue optimisation

Rules:
- Keep responses concise and practical (2–4 short paragraphs max)
- Use bullet points for lists
- Give prices in INR where relevant
- Use occasional farming emojis to stay friendly
- End complex advice with a "💡 Key takeaway:" line`;

const SUGGESTIONS = [
  'Best crops for monsoon season?',
  'How to identify crop diseases?',
  'Current wheat market trends?',
  'Tips for organic farming profit?',
  'How to use the marketplace?',
];

async function callGroq(history, userText) {
  if (!GROQ_KEY) throw new Error('Groq API key not set. Add VITE_GROQ_API_KEY to frontend/.env');
  const messages = [
    { role: 'system', content: SYSTEM_INSTRUCTION },
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userText },
  ];
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({ model: GROQ_MODEL, messages, max_tokens: 700, temperature: 0.7 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `AI error ${res.status}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty response from AI.');
  return text;
}

function TypingDots() {
  return (
    <Box sx={{ display: 'flex', gap: 0.5, px: 1.5, py: 0.75, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <Box key={i} sx={{
          width: 7, height: 7, borderRadius: '50%', bgcolor: '#2E7D32',
          animation: 'bounce 1.2s infinite', animationDelay: `${i * 0.2}s`,
          '@keyframes bounce': { '0%,80%,100%': { transform: 'translateY(0)', opacity: 0.4 }, '40%': { transform: 'translateY(-6px)', opacity: 1 } },
        }} />
      ))}
    </Box>
  );
}

function Bubble({ msg }) {
  const isAI = msg.role === 'assistant';
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <Box sx={{ display: 'flex', justifyContent: isAI ? 'flex-start' : 'flex-end', mb: 1.5 }}>
        {isAI && (
          <Avatar sx={{ width: 28, height: 28, mr: 1, mt: 0.25, flexShrink: 0, background: 'linear-gradient(135deg,#2E7D32,#4caf50)', fontSize: 14 }}>
            <SmartToy sx={{ fontSize: 16 }} />
          </Avatar>
        )}
        <Box sx={{
          maxWidth: '82%', px: 1.75, py: 1,
          borderRadius: isAI ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
          bgcolor: isAI ? alpha('#2E7D32', 0.08) : '#2E7D32',
          border: isAI ? `1px solid ${alpha('#2E7D32', 0.15)}` : 'none',
        }}>
          <Typography variant="body2" sx={{ color: isAI ? 'text.primary' : 'white', fontSize: '0.82rem', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {msg.content}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 0.4, fontSize: '0.62rem', color: isAI ? 'text.disabled' : 'rgba(255,255,255,0.65)' }}>
            {msg.time}
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
}

const INITIAL_MSG = () => [{
  role: 'assistant',
  content: "👋 Hi! I'm CropX AI — your agricultural expert.\n\nAsk me anything about farming, crops, market prices, or how to use the platform!",
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
}];

export default function ChatSupport() {
  // Only render for authenticated users
  const { user } = useAuth();

  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState(INITIAL_MSG);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 300); }, [open]);

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const sendMessage = useCallback(async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');
    setError(null);
    const userMsg = { role: 'user', content, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const history = messages.map(({ role, content }) => ({ role, content }));
      const reply = await callGroq(history, content);
      setMessages(prev => [...prev, { role: 'assistant', content: reply, time: now() }]);
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: '🌱 Fresh start! How can I help with your farming needs today?', time: now() }]);
    setError(null);
  };

  // Don't mount widget at all if not logged in
  if (!user) return null;

  return (
    <Box sx={{ position: 'fixed', bottom: 28, right: 28, zIndex: 1300 }}>

      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          >
            <Tooltip title="CropX AI Assistant" placement="left">
              <Fab onClick={() => setOpen(true)} sx={{
                width: 56, height: 56,
                background: 'linear-gradient(135deg,#2E7D32,#4caf50)', color: 'white',
                boxShadow: '0 8px 24px rgba(46,125,50,0.45)',
                '&:hover': { background: 'linear-gradient(135deg,#1b5e20,#2E7D32)', transform: 'translateY(-2px)' },
                transition: 'all 0.2s ease',
              }}>
                <SmartToy />
              </Fab>
            </Tooltip>
            <Box sx={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '2px solid rgba(46,125,50,0.45)',
              animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite',
              '@keyframes ping': { '75%,100%': { transform: 'scale(1.8)', opacity: 0 } },
              pointerEvents: 'none',
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 16 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            style={{ position: 'absolute', bottom: 0, right: 0 }}
          >
            <Paper elevation={0} sx={{
              width: { xs: 'calc(100vw - 32px)', sm: 360 }, height: 520,
              borderRadius: 4, border: '1px solid', borderColor: 'divider',
              boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              bgcolor: 'background.paper',
            }}>
              {/* Header */}
              <Box sx={{
                px: 2, py: 1.5,
                background: 'linear-gradient(135deg,#1b5e20,#2E7D32)',
                display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0,
              }}>
                <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(255,255,255,0.15)', flexShrink: 0 }}>
                  <SmartToy sx={{ fontSize: 20, color: 'white' }} />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'white', lineHeight: 1.2 }}>
                    CropX AI
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#4ade80' }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.67rem' }}>
                      Agricultural Expert · Llama 3.3
                    </Typography>
                  </Box>
                </Box>
                <Tooltip title="Clear chat">
                  <IconButton size="small" onClick={clearChat} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                    <Refresh fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Close">
                  <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                    <Close fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Messages */}
              <Box sx={{
                flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column',
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: alpha('#2E7D32', 0.2), borderRadius: 2 },
              }}>
                {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}

                {loading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Avatar sx={{ width: 28, height: 28, background: 'linear-gradient(135deg,#2E7D32,#4caf50)', fontSize: 14 }}>
                      <SmartToy sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Box sx={{ bgcolor: alpha('#2E7D32', 0.08), borderRadius: '4px 14px 14px 14px', border: `1px solid ${alpha('#2E7D32', 0.15)}` }}>
                      <TypingDots />
                    </Box>
                  </Box>
                )}

                {error && (
                  <Box sx={{ mb: 1.5, p: 1.5, borderRadius: 2, bgcolor: alpha('#ef4444', 0.07), border: `1px solid ${alpha('#ef4444', 0.2)}` }}>
                    <Typography variant="caption" color="error.main" sx={{ fontSize: '0.75rem' }}>⚠️ {error}</Typography>
                  </Box>
                )}

                {messages.length === 1 && !loading && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.75, fontSize: '0.7rem' }}>
                      💡 Try asking:
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                      {SUGGESTIONS.map(s => (
                        <Chip key={s} label={s} size="small" onClick={() => sendMessage(s)} sx={{
                          fontSize: '0.68rem', height: 24, cursor: 'pointer',
                          bgcolor: alpha('#2E7D32', 0.06), color: '#2E7D32',
                          border: `1px solid ${alpha('#2E7D32', 0.15)}`,
                          '&:hover': { bgcolor: alpha('#2E7D32', 0.12) }, fontWeight: 500,
                        }} />
                      ))}
                    </Stack>
                  </Box>
                )}
                <div ref={bottomRef} />
              </Box>

              {/* Input */}
              <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0, bgcolor: 'background.paper' }}>
                <TextField
                  inputRef={inputRef} fullWidth size="small"
                  placeholder="Ask about crops, markets, weather…"
                  value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  disabled={loading} multiline maxRows={3}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => sendMessage()} disabled={!input.trim() || loading} sx={{
                          width: 30, height: 30,
                          bgcolor: input.trim() && !loading ? '#2E7D32' : 'transparent',
                          color: input.trim() && !loading ? 'white' : 'text.disabled',
                          '&:hover': { bgcolor: input.trim() && !loading ? '#1b5e20' : undefined },
                          transition: 'all 0.15s',
                        }}>
                          {loading ? <CircularProgress size={14} color="inherit" /> : <Send sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, fontSize: '0.83rem', '&.Mui-focused': { boxShadow: `0 0 0 3px ${alpha('#2E7D32', 0.12)}` } } }}
                />
                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.75, textAlign: 'center', fontSize: '0.62rem' }}>
                  <AutoAwesome sx={{ fontSize: 10, mr: 0.5, verticalAlign: 'middle' }} />
                  Powered by Groq · Llama 3.3 · Logged in as {user?.name?.split(' ')[0] || user?.email}
                </Typography>
              </Box>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}
