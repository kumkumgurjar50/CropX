import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Avatar, Box, Chip, CircularProgress, Divider, Grid, IconButton,
  InputAdornment, Paper, Skeleton, Stack, TextField, Typography, alpha,
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

function getInitials(name, email) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return (email?.[0] ?? '?').toUpperCase();
}

function timeLabel(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function Messages() {
  usePageTitle('Messages');
  const { user } = useAuth();
  const location = useLocation();

  const [partners, setPartners] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const initDone = useRef(false);

  const prevMsgCount = useRef(0);

  const fetchPartners = useCallback(async () => {
    try {
      const { data } = await api.get('/messages/');
      const list = Array.isArray(data) ? data : [];
      setPartners(list);
      return list;
    } catch { setPartners([]); return []; }
    finally { setLoadingPartners(false); }
  }, []);

  const fetchMessages = useCallback(async (partnerId, isSilent = false) => {
    if (!isSilent) setLoadingMessages(true);
    try {
      const { data } = await api.get(`/messages/?with=${partnerId}`);
      const newMsgs = Array.isArray(data) ? data : [];
      setMessages((prev) => {
        if (prev.length === newMsgs.length && prev.length > 0 && prev[prev.length - 1]?.id === newMsgs[newMsgs.length - 1]?.id) {
          return prev;
        }
        return newMsgs;
      });
    } catch {
      if (!isSilent) setMessages([]);
    } finally {
      if (!isSilent) setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    fetchPartners().then((list) => {
      const pre = location.state?.openWith;
      if (!pre) return;
      const existing = list.find(p => p.id === pre.id);
      setActivePartner(existing ?? pre);
      if (!existing) {
        setPartners(prev => {
          if (prev.find(p => p.id === pre.id)) return prev;
          return [pre, ...prev];
        });
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activePartner) fetchMessages(activePartner.id, false);
  }, [activePartner, fetchMessages]);

  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMsgCount.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (!activePartner) return;
    const t = setInterval(() => fetchMessages(activePartner.id, true), 4000);
    return () => clearInterval(t);
  }, [activePartner, fetchMessages]);

  const handleSend = async () => {
    if (!input.trim() || !activePartner) return;
    setSending(true);
    const body = input.trim();
    setInput('');
    try {
      const { data } = await api.post('/messages/', { recipient: activePartner.id, body });
      setMessages(prev => [...prev, data]);
      setPartners(prev => {
        if (prev.find(p => p.id === activePartner.id)) return prev;
        return [activePartner, ...prev];
      });
    } catch {
      toast.error('Failed to send message');
      setInput(body);
    } finally { setSending(false); }
  };

  return (
    <DashboardLayout title="Messages">
      <Grid container spacing={0} sx={{ height: 'calc(100vh - 120px)', minHeight: 520 }}>

        {/* ── Contact list ── */}
        <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
          <Paper sx={{
            borderRadius: { xs: 3, md: '16px 0 0 16px' },
            border: '1px solid', borderColor: 'divider',
            width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight={700}>Messages</Typography>
              <Typography variant="caption" color="text.secondary">Your conversations</Typography>
            </Box>

            <Box sx={{ overflowY: 'auto', flex: 1 }}>
              {loadingPartners ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Box key={i} sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Skeleton variant="circular" width={42} height={42} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton width="60%" height={16} />
                        <Skeleton width="80%" height={13} sx={{ mt: 0.5 }} />
                      </Box>
                    </Stack>
                  </Box>
                ))
              ) : partners.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: 40, mb: 1 }}>💬</Typography>
                  <Typography variant="body2" color="text.secondary">No conversations yet</Typography>
                  <Typography variant="caption" color="text.disabled">
                    Messages from customers will appear here
                  </Typography>
                </Box>
              ) : (
                partners.map((partner, i) => (
                  <Box key={partner.id}>
                    <Box
                      onClick={() => setActivePartner(partner)}
                      sx={{
                        p: 2, cursor: 'pointer',
                        bgcolor: activePartner?.id === partner.id ? alpha('#2E7D32', 0.09) : 'transparent',
                        borderLeft: activePartner?.id === partner.id ? '3px solid #2E7D32' : '3px solid transparent',
                        '&:hover': { bgcolor: alpha('#2E7D32', 0.04) },
                        transition: 'all 0.15s',
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ width: 42, height: 42, fontWeight: 800, fontSize: 14 }}>
                          {getInitials(partner.name, partner.email)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={700} noWrap>
                            {partner.name || partner.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap display="block">
                            {partner.role} · {partner.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                    {i < partners.length - 1 && <Divider />}
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Grid>

        {/* ── Chat area ── */}
        <Grid item xs={12} md={8} sx={{ display: 'flex' }}>
          <Paper sx={{
            borderRadius: { xs: 3, md: '0 16px 16px 0' },
            border: '1px solid', borderLeft: { md: 'none' }, borderColor: 'divider',
            width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            {!activePartner ? (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                <Typography sx={{ fontSize: 56, mb: 2 }}>💬</Typography>
                <Typography variant="h6" fontWeight={700} color="text.secondary">Select a conversation</Typography>
                <Typography variant="body2" color="text.disabled">Choose a contact from the left to start messaging</Typography>
              </Box>
            ) : (
              <>
                {/* Header */}
                <Box sx={{
                  p: 2, borderBottom: '1px solid', borderColor: 'divider',
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  bgcolor: alpha('#2E7D32', 0.03),
                }}>
                  <Avatar sx={{ width: 38, height: 38, fontWeight: 800, fontSize: 13 }}>
                    {getInitials(activePartner.name, activePartner.email)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {activePartner.name || activePartner.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activePartner.role} · {activePartner.email}
                    </Typography>
                  </Box>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e' }} />
                </Box>

                {/* Messages */}
                <Box sx={{
                  flex: 1, overflowY: 'auto', p: 2,
                  display: 'flex', flexDirection: 'column', gap: 1,
                  '&::-webkit-scrollbar': { width: 4 },
                  '&::-webkit-scrollbar-thumb': { bgcolor: alpha('#2E7D32', 0.2), borderRadius: 2 },
                }}>
                  {loadingMessages ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                      <CircularProgress size={28} />
                    </Box>
                  ) : messages.length === 0 ? (
                    <Box sx={{ textAlign: 'center', mt: 6 }}>
                      <Typography sx={{ fontSize: 40, mb: 1 }}>👋</Typography>
                      <Typography variant="body2" color="text.disabled">No messages yet — say hello!</Typography>
                    </Box>
                  ) : (
                    messages.map(m => {
                      const isMine = m.sender === user?.id;
                      return (
                        <Box key={m.id} sx={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                          {!isMine && (
                            <Avatar sx={{
                              width: 26, height: 26, fontSize: 11, fontWeight: 800, mr: 0.75, mt: 0.25, flexShrink: 0,
                            }}>
                              {getInitials(activePartner.name, activePartner.email)}
                            </Avatar>
                          )}
                          <Box sx={{
                            maxWidth: '68%', px: 2, py: 1,
                            borderRadius: isMine ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                            bgcolor: isMine ? '#2E7D32' : 'action.hover',
                            border: isMine ? 'none' : '1px solid', borderColor: 'divider',
                          }}>
                            <Typography variant="body2" sx={{ color: isMine ? 'white' : 'text.primary', lineHeight: 1.55 }}>
                              {m.body}
                            </Typography>
                            <Typography variant="caption" sx={{
                              color: isMine ? 'rgba(255,255,255,0.55)' : 'text.disabled',
                              display: 'block', mt: 0.25, fontSize: '0.62rem',
                            }}>
                              {timeLabel(m.created_at)}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </Box>

                {/* Input */}
                <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <TextField
                    fullWidth size="small"
                    placeholder={`Message ${activePartner.name || activePartner.email}…`}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    disabled={sending}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small" onClick={handleSend} color="primary"
                            disabled={!input.trim() || sending}
                            sx={{
                              width: 30, height: 30,
                              bgcolor: input.trim() && !sending ? '#2E7D32' : 'transparent',
                              color: input.trim() && !sending ? 'white' : 'text.disabled',
                              '&:hover': { bgcolor: input.trim() && !sending ? '#1b5e20' : undefined },
                              transition: 'all 0.15s',
                            }}
                          >
                            {sending ? <CircularProgress size={14} color="inherit" /> : <Send sx={{ fontSize: 15 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
}
