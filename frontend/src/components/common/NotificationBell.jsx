import { useRef, useState } from 'react';
import {
  alpha, Badge, Box, ClickAwayListener, Chip,
  Divider, Grow, IconButton, Paper,
  Popper, Stack, Tooltip, Typography,
} from '@mui/material';
import { NotificationsOutlined } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';

const TYPE_ICONS = {
  ORDER: '📦', WEATHER: '🌤️', MARKET: '📈',
  DISEASE: '🦠', SYSTEM: '⚙️', AI: '🤖',
};
const TYPE_COLORS = {
  ORDER: '#3b82f6', WEATHER: '#06b6d4', MARKET: '#22c55e',
  DISEASE: '#ef4444', SYSTEM: '#8b5cf6', AI: '#f97316',
};

function timeAgo(iso) {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function NotificationBell({ notifPath = '/farmer/notifications' }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount, connected, markOne, markAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const preview = notifications.slice(0, 6);

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box>
        <Tooltip title="Notifications">
          <IconButton ref={ref} size="small" onClick={() => setOpen(o => !o)} sx={{ color: 'text.secondary' }}>
            <Badge badgeContent={unreadCount || null} color="error" max={9}
              sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}>
              <NotificationsOutlined fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        <Popper open={open} anchorEl={ref.current} placement="bottom-end" transition style={{ zIndex: 1400 }}>
          {({ TransitionProps }) => (
            <Grow {...TransitionProps} timeout={160}>
              <Paper sx={{
                width: 320, borderRadius: 3, mt: 1,
                border: '1px solid', borderColor: 'divider',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                overflow: 'hidden',
              }}>
                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center"
                  sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
                    {connected && (
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e' }} />
                    )}
                  </Stack>
                  {unreadCount > 0 && (
                    <Typography variant="caption" fontWeight={700}
                      sx={{ color: 'primary.main', cursor: 'pointer' }} onClick={markAll}>
                      Mark all read
                    </Typography>
                  )}
                </Stack>

                {/* Items */}
                <Box sx={{ maxHeight: 380, overflowY: 'auto' }}>
                  {preview.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography sx={{ fontSize: 32, mb: 0.5 }}>🔔</Typography>
                      <Typography variant="body2" color="text.secondary">No notifications yet</Typography>
                    </Box>
                  ) : preview.map((n, i) => {
                    const color = TYPE_COLORS[n.notification_type] || '#64748b';
                    return (
                      <Box key={n.id}>
                        <Box
                          onClick={() => {
                            if (!n.is_read) markOne(n.id);

                            // Navigate based on type
                            const base = user?.role === 'CUSTOMER' ? '/customer' : '/farmer';
                            if (n.notification_type === 'ORDER') navigate(`${base}/orders`);
                            else if (n.notification_type === 'SYSTEM' && n.title.toLowerCase().includes('message')) navigate(`${base}/messages`);
                            else navigate(notifPath);

                            setOpen(false);
                          }}
                          sx={{
                            px: 2, py: 1.25,
                            display: 'flex', gap: 1.25, alignItems: 'flex-start',
                            bgcolor: n.is_read ? 'transparent' : alpha(color, 0.04),
                            cursor: n.is_read ? 'default' : 'pointer',
                            '&:hover': { bgcolor: alpha(color, 0.06) },
                            transition: 'background 0.12s',
                          }}
                        >
                          {/* Icon */}
                          <Box sx={{
                            width: 30, height: 30, borderRadius: 1.5, flexShrink: 0,
                            bgcolor: alpha(color, 0.1),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, mt: 0.1,
                          }}>
                            {TYPE_ICONS[n.notification_type] || '📢'}
                          </Box>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" fontWeight={n.is_read ? 500 : 700}
                                noWrap sx={{ maxWidth: 180, color: 'text.primary' }}>
                                {n.title}
                              </Typography>
                              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0, ml: 0.5 }}>
                                {!n.is_read && (
                                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                                )}
                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
                                  {timeAgo(n.created_at)}
                                </Typography>
                              </Stack>
                            </Stack>
                            <Typography variant="caption" color="text.secondary"
                              sx={{
                                display: '-webkit-box', WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                lineHeight: 1.45, mt: 0.2,
                              }}>
                              {n.message}
                            </Typography>
                          </Box>
                        </Box>
                        {i < preview.length - 1 && <Divider />}
                      </Box>
                    );
                  })}
                </Box>

                {/* Footer */}
                <Box component={Link} to={notifPath} onClick={() => setOpen(false)}
                  sx={{
                    display: 'block', textAlign: 'center', py: 1.1,
                    borderTop: '1px solid', borderColor: 'divider',
                    color: 'primary.main', textDecoration: 'none',
                    '&:hover': { bgcolor: alpha('#2E7D32', 0.04) },
                    transition: 'background 0.12s',
                  }}>
                  <Typography variant="caption" fontWeight={700}>View all →</Typography>
                </Box>
              </Paper>
            </Grow>
          )}
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}
