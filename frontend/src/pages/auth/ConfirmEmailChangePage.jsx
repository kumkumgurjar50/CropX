import { useEffect, useRef, useState } from 'react';
import { Box, Button, CircularProgress, Typography, alpha } from '@mui/material';
import { CheckCircleOutlined, ErrorOutlined } from '@mui/icons-material';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser, loginSuccess } from '../../store/slices/authSlice';
import api from '../../services/api';
import AuthShell from '../../components/common/AuthShell';
import { usePageTitle } from '../../hooks/usePageTitle';
import { toast } from 'react-toastify';
import { getDashboardPath } from '../../constants/roles';
import { tabId } from '../../App';

export default function ConfirmEmailChangePage() {
  usePageTitle('Confirm email change');
  const [searchParams] = useSearchParams();
  const [state, setState] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);
  const called = useRef(false); // prevent double-call in StrictMode

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const token = searchParams.get('token');
    if (!token) {
      setState('error');
      setMessage('Missing token in confirmation link. Please request a new one from Settings.');
      return;
    }

    api.post('/auth/confirm-email-change/', { token })
      .then(res => {
        const email = res.data.new_email;
        setNewEmail(email);
        setMessage(res.data.message || `Email updated to ${email}.`);

        // Sync the new email into Redux + localStorage/sessionStorage immediately
        if (res.data.access && res.data.user) {
          // Broadcast to other tabs to forcefully log them out of the old session
          const bc = new BroadcastChannel('cropx_auth');
          bc.postMessage({ type: 'FORCE_LOGOUT', tabId });
          bc.close();
          dispatch(loginSuccess(res.data));
        } else if (isAuthenticated && res.data.user) {
          dispatch(updateUser(res.data.user));
        } else if (isAuthenticated) {
          dispatch(updateUser({ email }));
        }

        setState('success');
      })
      .catch(err => {
        setState('error');
        setMessage(
          err.response?.data?.detail ||
          'This confirmation link is invalid or has expired.'
        );
      });
  }, [searchParams, dispatch, isAuthenticated]);

  // Handle automatic redirection safely once success state is reached
  useEffect(() => {
    if (state === 'success') {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          const dash = user && user.role ? getDashboardPath(user.role) : '/';
          navigate(dash);
          toast.success(`Email updated to ${newEmail}`);
        } else {
          navigate('/login');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state, isAuthenticated, user, newEmail, navigate]);

  return (
    <AuthShell title="Email Change Confirmation" subtitle="">
      <Box sx={{ textAlign: 'center', py: 2 }}>

        {/* ── Loading ── */}
        {state === 'loading' && (
          <>
            <CircularProgress sx={{ mb: 2.5 }} />
            <Typography variant="body2" color="text.secondary">
              Verifying your new email address…
            </Typography>
          </>
        )}

        {/* ── Success ── */}
        {state === 'success' && (
          <>
            <Box sx={{
              width: 72, height: 72, borderRadius: '50%', mx: 'auto', mb: 2.5,
              bgcolor: alpha('#22c55e', 0.1),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircleOutlined sx={{ fontSize: 36, color: '#22c55e' }} />
            </Box>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
              Email updated!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Your email address has been changed to
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ mb: 1.5 }}>
              {newEmail}
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 3 }}>
              {isAuthenticated
                ? "You are still signed in — routing you back to Dashboard..."
                : "Please sign in with your new email address."}
            </Typography>

            {isAuthenticated ? (
              <Button
                variant="contained" fullWidth sx={{ borderRadius: 2.5, fontWeight: 700, mb: 1.5 }}
                onClick={() => {
                  const dash = user && user.role ? getDashboardPath(user.role) : '/';
                  navigate(dash);
                  toast.success(`Email updated to ${newEmail}`);
                }}
              >
                Go to Dashboard
              </Button>
            ) : (
              <Button
                variant="contained" fullWidth sx={{ borderRadius: 2.5, fontWeight: 700, mb: 1.5 }}
                onClick={() => navigate('/login')}
              >
                Sign In Now
              </Button>
            )}
          </>
        )}

        {/* ── Error ── */}
        {state === 'error' && (
          <>
            <Box sx={{
              width: 72, height: 72, borderRadius: '50%', mx: 'auto', mb: 2.5,
              bgcolor: alpha('#ef4444', 0.1),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ErrorOutlined sx={{ fontSize: 36, color: '#ef4444' }} />
            </Box>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
              Confirmation failed
            </Typography>
            <Typography
              variant="body2" color="text.secondary"
              sx={{ mb: 3, maxWidth: 340, mx: 'auto' }}
            >
              {message}
            </Typography>
            <Button
              variant="contained" fullWidth sx={{ borderRadius: 2.5, fontWeight: 700, mb: 1.5 }}
              component={Link} to="/settings"
            >
              Back to Settings
            </Button>
            <Typography variant="caption" color="text.disabled">
              You can request a new link from Settings → Change Email Address
            </Typography>
          </>
        )}

      </Box>
    </AuthShell>
  );
}
