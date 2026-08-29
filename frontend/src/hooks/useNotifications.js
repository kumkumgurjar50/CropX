/**
 * useNotifications
 *
 * Opens a WebSocket to ws://…/ws/notifications/?token=<jwt>
 * and keeps a local list of notifications + unread count in sync.
 *
 * When WebSocket is disconnected it falls back to REST polling every 20 s
 * so the badge stays up-to-date even without a live connection.
 *
 * Exported values:
 *   notifications  – array of notification objects (newest first)
 *   unreadCount    – integer badge count
 *   connected      – boolean WebSocket status
 *   markOne(id)    – mark a single notification read
 *   markAll()      – mark all read
 *   deleteOne(id)  – permanently delete a single notification
 *   deleteAll()    – permanently delete all notifications
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';

const WS_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api')
  .replace(/^http/, 'ws')
  .replace(/\/api\/?$/, '');

const RECONNECT_DELAY_MS = 4000;
const POLL_INTERVAL_MS = 20000; // REST fallback when WS is down

export function useNotifications() {
  const accessToken = useSelector(s => s.auth.accessToken);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);

  const wsRef = useRef(null);
  const timerRef = useRef(null);
  const pollRef = useRef(null);
  const mountedRef = useRef(true);

  // ── REST fetch helper ───────────────────────────────────────────────────
  const restFetch = useCallback(async () => {
    if (!accessToken || !mountedRef.current) return;
    try {
      const { data } = await api.get('/notifications/');
      const list = (data.results ?? data).slice().reverse(); // newest first
      if (mountedRef.current) {
        setNotifications(list);
        setUnreadCount(list.filter(n => !n.is_read).length);
      }
    } catch { /* silently ignore */ }
  }, [accessToken]);

  // ── Start/stop REST polling based on WS connection state ───────────────
  const startPolling = useCallback(() => {
    if (pollRef.current) return; // already running
    pollRef.current = setInterval(restFetch, POLL_INTERVAL_MS);
  }, [restFetch]);

  const stopPolling = useCallback(() => {
    clearInterval(pollRef.current);
    pollRef.current = null;
  }, []);

  // ── Initial REST fetch ──────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    restFetch();
  }, [accessToken, restFetch]);

  // ── WebSocket connection ────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!accessToken || !mountedRef.current) return;

    const url = `${WS_BASE}/ws/notifications/?token=${accessToken}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setConnected(true);
      stopPolling(); // WS is live — no need to poll
    };

    ws.onmessage = (evt) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(evt.data);

        if (msg.type === 'unread_count') {
          setUnreadCount(msg.count);
        }

        if (msg.type === 'notification') {
          setNotifications(prev => {
            // Avoid duplicates
            if (prev.find(n => n.id === msg.id)) return prev;
            return [msg, ...prev];
          });
          setUnreadCount(c => c + 1);
        }
      } catch { /* ignore malformed frames */ }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      startPolling(); // fall back to REST while reconnecting
      timerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };

    ws.onerror = () => { ws.close(); };
  }, [accessToken, startPolling, stopPolling]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(timerRef.current);
      clearInterval(pollRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  // ── Mark read helpers ───────────────────────────────────────────────────
  const markOne = useCallback((id) => {
    // Send over WS if connected, otherwise hit REST
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'mark_read', id }));
    } else {
      api.post(`/notifications/${id}/read/`).catch(() => { });
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  }, []);

  const markAll = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'mark_read', id: 'all' }));
    } else {
      api.post('/notifications/read/').catch(() => { });
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  // ── Delete helpers ──────────────────────────────────────────────────────
  const deleteOne = useCallback((id) => {
    api.delete(`/notifications/${id}/delete/`).catch(() => { });
    setNotifications(prev => {
      const removed = prev.find(n => n.id === id);
      const next = prev.filter(n => n.id !== id);
      if (removed && !removed.is_read) setUnreadCount(c => Math.max(0, c - 1));
      return next;
    });
  }, []);

  const deleteAll = useCallback(() => {
    api.delete('/notifications/delete/').catch(() => { });
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, connected, markOne, markAll, deleteOne, deleteAll };
}
