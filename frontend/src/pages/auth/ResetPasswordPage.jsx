import { useState } from 'react';
import {
  Box, Button, CircularProgress, IconButton,
  InputAdornment, Stack, TextField, Typography, alpha,
} from '@mui/material';
import { CheckCircleOutlined, Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/slices/authSlice';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardPath } from '../../constants/roles';
import { tabId } from '../../App';
import AuthShell from '../../components/common/AuthShell';
import { parseApiError } from '../../utils/errorParser';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function ResetPasswordPage() {
  usePageTitle('Set new password');
  const [done, setDone] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

  const uidb64 = searchParams.get('uidb64') || '';
  const token = searchParams.get('token') || '';

  // ── Missing / malformed link ──────────────────────────────────────────────
  if (!uidb64 || !token) {
    return (
      <AuthShell title="Invalid link" subtitle="">
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography sx={{ fontSize: 52, mb: 2 }}>⚠️</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This reset link is missing required parameters.
            Please request a new one.
          </Typography>
          <Button
            variant="contained" fullWidth
            component={Link} to="/forgot-password"
            sx={{ borderRadius: 2.5, fontWeight: 700 }}
          >
            Request new link
          </Button>
        </Box>
      </AuthShell>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (done) {
    const dash = user && user.role ? getDashboardPath(user.role) : '/';

    // Automatically redirect!
    setTimeout(() => {
      navigate(dash);
    }, 2000);

    return (
      <AuthShell title="Password reset!" subtitle="">
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Box sx={{
            width: 72, height: 72, borderRadius: '50%', mx: 'auto', mb: 2.5,
            bgcolor: alpha('#22c55e', 0.1),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircleOutlined sx={{ fontSize: 36, color: '#22c55e' }} />
          </Box>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>All done!</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your password has been reset successfully. Routing you to your dashboard...
          </Typography>
          <Button
            variant="contained" fullWidth
            onClick={() => navigate(dash)}
            sx={{ borderRadius: 2.5, fontWeight: 700, mb: 1.5 }}
          >
            Go to Dashboard
          </Button>
        </Box>
      </AuthShell>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    try {
      const res = await api.post('/auth/reset-password/', {
        uidb64,
        token,
        new_password: data.new_password,
        new_password_confirm: data.confirm_password,
      });

      if (res.data.access && res.data.user) {
        // Broadcast force logout to old tabs
        const bc = new BroadcastChannel('cropx_auth');
        bc.postMessage({ type: 'FORCE_LOGOUT', tabId });
        bc.close();

        dispatch(loginSuccess(res.data));
      }

      setDone(true);
      toast.success('Password reset successfully!');
    } catch (e) {
      const msg = parseApiError(e, 'Failed to reset password.');
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
        toast.error(msg + ' Please request a new reset link.');
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password — at least 8 characters."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          <TextField
            label="New password"
            type={showNew ? 'text' : 'password'}
            fullWidth autoFocus autoComplete="new-password"
            {...register('new_password', {
              required: 'Required',
              minLength: { value: 8, message: 'Minimum 8 characters' },
            })}
            error={Boolean(errors.new_password)}
            helperText={errors.new_password?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowNew(v => !v)}>
                    {showNew ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Confirm new password"
            type={showCon ? 'text' : 'password'}
            fullWidth autoComplete="new-password"
            {...register('confirm_password', {
              required: 'Required',
              validate: v => v === watch('new_password') || 'Passwords do not match',
            })}
            error={Boolean(errors.confirm_password)}
            helperText={errors.confirm_password?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowCon(v => !v)}>
                    {showCon ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit" variant="contained" size="large" fullWidth
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ borderRadius: 2.5, fontWeight: 700 }}
          >
            {isSubmitting ? 'Resetting…' : 'Reset Password'}
          </Button>
        </Stack>
      </form>

      <Box sx={{ mt: 2.5, textAlign: 'center' }}>
        <Typography
          component={Link} to="/forgot-password" variant="body2"
          sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
        >
          Request a new link instead
        </Typography>
      </Box>
    </AuthShell>
  );
}
