/**
 * NotificationCenter
 *
 * Shared UI for both /farmer/notifications and /customer/notifications.
 * Accepts the return value of `useNotifications()` as props so the page
 * can own the hook and pass it straight down.
 *
 * Props:
 *   notifications  – array from useNotifications()
 *   unreadCount    – number
 *   connected      – boolean
 *   markOne(id)    – fn
 *   markAll()      – fn
 *   deleteOne(id)  – fn
 *   deleteAll()    – fn
 */

import { useMemo, useState } from 'react';
import {
    Alert,
    alpha,
    Box,
    Button,
    Chip,
    Divider,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    Close,
    DeleteSweep,
    DoneAll,
    Notifications as NotificationsIcon,
    WifiOff,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@mui/material/styles';

// ── Helpers ──────────────────────────────────────────────────────────────────

function dateBucket(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yest = new Date(today); yest.setDate(today.getDate() - 1);
    if (d >= today) return 'Today';
    if (d >= yest) return 'Yesterday';
    return 'Earlier';
}

const TYPE_META = {
    ORDER: { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', icon: '📦' },
    WEATHER: { color: '#3b82f6', bg: 'rgba(59,130,246,0.10)', icon: '🌤️' },
    MARKET: { color: '#22c55e', bg: 'rgba(34,197,94,0.10)', icon: '📈' },
    DISEASE: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)', icon: '🔬' },
    SYSTEM: { color: '#6366f1', bg: 'rgba(99,102,241,0.10)', icon: '⚙️' },
    AI: { color: '#a855f7', bg: 'rgba(168,85,247,0.10)', icon: '🤖' },
};

const FILTER_OPTIONS = ['ALL', 'ORDER', 'MARKET', 'WEATHER', 'DISEASE', 'AI', 'SYSTEM'];

function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NotificationCard({ n, onMarkRead, onDelete }) {
    const theme = useTheme();
    const [hovered, setHovered] = useState(false);
    const meta = TYPE_META[n.notification_type] ?? TYPE_META.SYSTEM;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 30, transition: { duration: 0.18 } }}
            transition={{ duration: 0.22 }}
        >
            <Box
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                sx={{
                    display: 'flex',
                    gap: 1.5,
                    p: 1.75,
                    borderRadius: 2,
                    cursor: 'default',
                    position: 'relative',
                    bgcolor: n.is_read ? theme.palette.background.paper : alpha(meta.color, theme.palette.mode === 'dark' ? 0.15 : 0.04),
                    border: '1px solid',
                    borderColor: n.is_read ? theme.palette.divider : alpha(meta.color, 0.3),
                    boxShadow: n.is_read ? theme.shadows[1] : `0 4px 12px ${alpha(meta.color, 0.15)}`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        bgcolor: alpha(meta.color, theme.palette.mode === 'dark' ? 0.2 : 0.08),
                        borderColor: alpha(meta.color, 0.5),
                        boxShadow: `0 6px 16px ${alpha(meta.color, 0.2)}`,
                    },
                }}
            >
                {/* Unread dot */}
                {!n.is_read && (
                    <Box
                        sx={{
                            position: 'absolute',
                            left: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: meta.color,
                            boxShadow: `0 0 6px ${meta.color}`,
                        }}
                    />
                )}

                {/* Icon */}
                <Box
                    sx={{
                        width: 40, height: 40, flexShrink: 0, borderRadius: 1.5,
                        bgcolor: meta.bg, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 18, ml: n.is_read ? 0 : 0.5,
                    }}
                >
                    {meta.icon}
                </Box>

                {/* Content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                        <Typography
                            variant="body2"
                            fontWeight={n.is_read ? 500 : 700}
                            sx={{ lineHeight: 1.3, color: n.is_read ? 'text.secondary' : 'text.primary' }}
                        >
                            {n.title}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0, mt: 0.1 }}>
                            {timeAgo(n.created_at)}
                        </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.4, lineHeight: 1.4 }}>
                        {n.message}
                    </Typography>
                </Box>

                {/* Hover actions */}
                <AnimatePresence>
                    {hovered && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.12 }}
                            style={{ position: 'absolute', right: 8, top: 8, display: 'flex', gap: 2 }}
                        >
                            {!n.is_read && (
                                <Tooltip title="Mark as read" placement="top">
                                    <IconButton
                                        size="small"
                                        onClick={() => onMarkRead(n.id)}
                                        sx={{ color: meta.color, bgcolor: alpha(meta.color, 0.1), width: 24, height: 24 }}
                                    >
                                        <DoneAll sx={{ fontSize: 13 }} />
                                    </IconButton>
                                </Tooltip>
                            )}
                            <Tooltip title="Delete" placement="top">
                                <IconButton
                                    size="small"
                                    onClick={() => onDelete(n.id)}
                                    sx={{ color: '#ef4444', bgcolor: alpha('#ef4444', 0.1), width: 24, height: 24 }}
                                >
                                    <Close sx={{ fontSize: 13 }} />
                                </IconButton>
                            </Tooltip>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Box>
        </motion.div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NotificationCenter({
    notifications,
    unreadCount,
    connected,
    markOne,
    markAll,
    deleteOne,
    deleteAll,
}) {
    const theme = useTheme();
    const [filter, setFilter] = useState('ALL');

    const filtered = useMemo(() => {
        if (filter === 'ALL') return notifications;
        return notifications.filter(n => n.notification_type === filter);
    }, [notifications, filter]);

    const grouped = useMemo(() => {
        const groups = { Today: [], Yesterday: [], Earlier: [] };
        filtered.forEach(n => { groups[dateBucket(n.created_at)].push(n); });
        return Object.entries(groups).filter(([, items]) => items.length > 0);
    }, [filtered]);

    return (
        <Box>
            {/* ── Header bar ─────────────────────────────────────────────────── */}
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
                gap={2}
                sx={{ mb: 3 }}
            >
                <Stack direction="row" alignItems="center" gap={1.5}>
                    <NotificationsIcon sx={{ color: 'primary.main', fontSize: 26 }} />
                    <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">
                        Notifications
                    </Typography>
                    {unreadCount > 0 && (
                        <Chip
                            label={`${unreadCount} unread`}
                            size="small"
                            sx={{
                                bgcolor: alpha(theme.palette.primary.main, 0.12),
                                color: 'primary.main',
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                height: 22,
                            }}
                        />
                    )}
                    {!connected && (
                        <Tooltip title="WebSocket offline — using REST polling">
                            <WifiOff sx={{ fontSize: 16, color: 'warning.main' }} />
                        </Tooltip>
                    )}
                </Stack>

                {notifications.length > 0 && (
                    <Stack direction="row" gap={1}>
                        {unreadCount > 0 && (
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<DoneAll sx={{ fontSize: 16 }} />}
                                onClick={markAll}
                                sx={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    boxShadow: theme.shadows[2]
                                }}
                            >
                                Mark all read
                            </Button>
                        )}
                        <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            startIcon={<DeleteSweep sx={{ fontSize: 16 }} />}
                            onClick={deleteAll}
                            sx={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                borderRadius: 2,
                                textTransform: 'none'
                            }}
                        >
                            Clear all
                        </Button>
                    </Stack>
                )}
            </Stack>

            {/* ── Filter chips ───────────────────────────────────────────────── */}
            <Stack direction="row" spacing={1} sx={{ mb: 2.5, flexWrap: 'wrap', gap: 0.75 }}>
                {FILTER_OPTIONS.map(f => {
                    const meta = TYPE_META[f] ?? null;
                    const active = filter === f;
                    return (
                        <Chip
                            key={f}
                            label={f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                            size="small"
                            onClick={() => setFilter(f)}
                            sx={{
                                fontWeight: 600,
                                fontSize: '0.73rem',
                                cursor: 'pointer',
                                bgcolor: active
                                    ? (meta ? alpha(meta.color, 0.15) : alpha(theme.palette.primary.main, 0.12))
                                    : (theme.palette.mode === 'dark' ? alpha('#fff', 0.08) : alpha('#000', 0.05)),
                                color: active
                                    ? (meta ? meta.color : 'primary.main')
                                    : 'text.secondary',
                                border: '1px solid',
                                borderColor: active
                                    ? (meta ? alpha(meta.color, 0.4) : alpha(theme.palette.primary.main, 0.3))
                                    : 'transparent',
                                transition: 'all 0.15s ease',
                                '&:hover': {
                                    bgcolor: meta ? alpha(meta.color, 0.12) : alpha(theme.palette.primary.main, 0.1),
                                },
                            }}
                        />
                    );
                })}
            </Stack>

            {/* ── Connection banner ──────────────────────────────────────────── */}
            {!connected && (
                <Alert severity="warning" variant="outlined" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem', py: 0.5 }}>
                    Real-time updates paused — polling every 20s as fallback.
                </Alert>
            )}

            {/* ── Notification groups ────────────────────────────────────────── */}
            {grouped.length === 0 ? (
                <Box
                    sx={{
                        textAlign: 'center',
                        py: 8,
                        bgcolor: alpha('#000', 0.02),
                        borderRadius: 3,
                        border: '1px dashed',
                        borderColor: 'divider',
                    }}
                >
                    <Typography sx={{ fontSize: 48, mb: 1.5 }}>🔔</Typography>
                    <Typography variant="h6" fontWeight={700} color="text.primary" gutterBottom>
                        {filter === 'ALL' ? "You're all caught up!" : `No ${filter.toLowerCase()} notifications`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {filter === 'ALL'
                            ? 'New alerts about orders, market prices, and weather will appear here.'
                            : 'Try switching to a different filter above.'}
                    </Typography>
                    {filter !== 'ALL' && (
                        <Button
                            size="small"
                            onClick={() => setFilter('ALL')}
                            sx={{ mt: 2, fontWeight: 600, borderRadius: 2 }}
                        >
                            Show all notifications
                        </Button>
                    )}
                </Box>
            ) : (
                <Stack spacing={2.5}>
                    {grouped.map(([label, items]) => (
                        <Box key={label}>
                            <Typography
                                variant="caption"
                                fontWeight={700}
                                color="text.disabled"
                                sx={{ textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 1 }}
                            >
                                {label}
                            </Typography>
                            <Stack spacing={1}>
                                <AnimatePresence mode="popLayout">
                                    {items.map(n => (
                                        <NotificationCard
                                            key={n.id}
                                            n={n}
                                            onMarkRead={markOne}
                                            onDelete={deleteOne}
                                        />
                                    ))}
                                </AnimatePresence>
                            </Stack>
                            <Divider sx={{ mt: 2 }} />
                        </Box>
                    ))}
                </Stack>
            )}
        </Box>
    );
}
