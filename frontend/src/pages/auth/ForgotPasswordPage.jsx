import { useEffect, useRef, useState } from 'react';
import { Box, Button, CircularProgress, Stack, TextField, Typography, alpha } from '@mui/material';
import { MarkEmailReadOutlined } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import AuthShell from '../../components/common/AuthShell';
import { usePageTitle } from '../../hooks/usePageTitle';

const COOLDOWN_SECS = 60;

export default function ForgotPasswordPage() {
  usePageTitle('Reset password');
  const [sent, setSent]               = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [cooldown, setCooldown]       = useState(0);
  const [resending, setResending]     = useState(false);

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm();

  // ── Countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    try {
      await api.post('/auth/forgot-password/', { email: data.email });
    } catch {
      // Always look successful — prevents email enumeration
    }
    setSubmittedEmail(data.email);
    setSent(true);
    setCooldown(COOLDOWN_SECS);
  };

  // ── Resend ─────────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      await api.post('/auth/forgot-password/', { email: submittedEmail });
    } catch {
      // Silently succeed for security
    } finally {
      setResending(false);
    }
    setCooldown(COOLDOWN_SECS);
    toast.success('A new reset link has been sent.');
  };

  // ── Sent state ─────────────────────────────────────────────────────────────
  if (sent) {
    return (
      <AuthShell title="Check your inbox" subtitle="">
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Box sx={{
            width: 72, height: 72, borderRadius: '50%', mx: 'auto', mb: 2.5,
            bgcolor: alpha('#2E7D32', 0.08),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MarkEmailReadOutlined sx={{ fontSize: 36, color: 'primary.main' }} />
          </Box>

          <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>Email sent!</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            We sent a password reset link to
          </Typography>
          <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
            {submittedEmail}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 3 }}>
            Click the link in the email to set a new password.
            It expires in 1 hour. Check your spam folder if you don't see it.
          </Typography>

          <Stack spacing={1.5}>
            {/* Resend with cooldown */}
            <Button
              variant="outlined" fullWidth
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              startIcon={resending ? <CircularProgress size={14} color="inherit" /> : null}
              sx={{ borderRadius: 2.5, fontWeight: 600 }}
            >
              {resending
                ? 'Sending…'
                : cooldown > 0
                ? `Resend in ${cooldown}s`
                : 'Resend reset link'}
            </Button>

            <Button
              variant="contained" fullWidth
              component={Link} to="/login"
              sx={{ borderRadius: 2.5, fontWeight: 700 }}
            >
              Back to sign in
            </Button>

            <Button
              variant="text" fullWidth size="small"
              onClick={() => { setSent(false); setCooldown(0); }}
              sx={{ color: 'text.secondary', borderRadius: 2 }}
            >
              Try a different email
            </Button>
          </Stack>
        </Box>
      </AuthShell>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your account email and we'll send you a reset link."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          <TextField
            label="Email address" type="email" fullWidth autoFocus autoComplete="email"
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email address' },
            })}
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
          />
          <Button
            type="submit" variant="contained" size="large" fullWidth
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ borderRadius: 2.5, fontWeight: 700 }}
          >
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </Button>
        </Stack>
      </form>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography
          component={Link} to="/login" variant="body2"
          sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          ← Back to sign in
        </Typography>
      </Box>
    </AuthShell>
  );
}
