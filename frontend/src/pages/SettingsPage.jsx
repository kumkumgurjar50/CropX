import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Divider, Grid,
  IconButton, InputAdornment, Paper, Skeleton, Stack,
  Switch, TextField, Typography, alpha,
} from '@mui/material';
import {
  CheckCircleOutlined, DarkModeOutlined, EmailOutlined, LockOutlined,
  MarkEmailReadOutlined, NotificationsOutlined, SaveOutlined,
  Visibility, VisibilityOff, VisibilityOutlined,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DashboardLayout from '../components/common/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { useThemeToggle } from '../context/ThemeContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { parseApiError } from '../utils/errorParser';
import api from '../services/api';

/* ── Shared section wrapper ─────────────────────────────────────────────── */
function Section({ icon, title, children }) {
  return (
    <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 2.5,
          bgcolor: alpha('#2E7D32', 0.08), color: 'primary.main',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </Box>
        <Typography variant="h6" fontWeight={700}>{title}</Typography>
      </Stack>
      {children}
    </Paper>
  );
}

/* ── Toggle row ─────────────────────────────────────────────────────────── */
function ToggleRow({ label, description, checked, onChange, disabled }) {
  return (
    <Box sx={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      py: 1.75,
      '&:not(:last-child)': { borderBottom: '1px solid', borderColor: 'divider' },
    }}>
      <Box sx={{ flex: 1, pr: 2 }}>
        <Typography variant="body2" fontWeight={600}>{label}</Typography>
        <Typography variant="caption" color="text.secondary">{description}</Typography>
      </Box>
      <Switch checked={checked} onChange={onChange} disabled={disabled} size="small" />
    </Box>
  );
}

/* ── Change password form ───────────────────────────────────────────────── */
function ChangePasswordSection() {
  const [show, setShow]       = useState({ cur: false, new: false, con: false });
  const [done, setDone]       = useState(false);
  const { logout }            = useAuth();
  const navigate              = useNavigate();
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      await api.post('/auth/change-password/', {
        current_password:  data.current_password,
        new_password:      data.new_password,
        confirm_password:  data.confirm_password,
      });
      reset();
      setDone(true);
    } catch (e) {
      toast.error(parseApiError(e, 'Failed to change password.'));
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const inp = (key, label, fieldName, rules) => (
    <TextField
      label={label} type={show[key] ? 'text' : 'password'} fullWidth size="small"
      {...register(fieldName, rules)}
      error={!!errors[fieldName]} helperText={errors[fieldName]?.message}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton size="small" onClick={() => setShow(s => ({ ...s, [key]: !s[key] }))}>
              {show[key] ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );

  if (done) {
    return (
      <Section icon={<LockOutlined fontSize="small" />} title="Change Password">
        <Alert
          severity="success"
          sx={{ borderRadius: 2, mb: 2 }}
          icon={<CheckCircleOutlined fontSize="small" />}
        >
          <Typography variant="body2" fontWeight={700}>Password changed successfully!</Typography>
          <Typography variant="caption" color="text.secondary">
            A confirmation email has been sent to your address. Your current session
            remains active, but you should sign out of other devices.
          </Typography>
        </Alert>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined" size="small" sx={{ borderRadius: 2 }}
            onClick={() => setDone(false)}
          >
            Change again
          </Button>
          <Button
            variant="contained" size="small" color="error" sx={{ borderRadius: 2 }}
            onClick={handleSignOut}
          >
            Sign out now
          </Button>
        </Stack>
      </Section>
    );
  }

  return (
    <Section icon={<LockOutlined fontSize="small" />} title="Change Password">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          {inp('cur', 'Current password', 'current_password', { required: 'Required' })}
          {inp('new', 'New password', 'new_password', {
            required: 'Required',
            minLength: { value: 8, message: 'Minimum 8 characters' },
          })}
          {inp('con', 'Confirm new password', 'confirm_password', {
            required: 'Required',
            validate: v => v === watch('new_password') || 'Passwords do not match',
          })}
          <Button
            type="submit" variant="contained" disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={14} color="inherit" /> : <SaveOutlined />}
            sx={{ borderRadius: 2, alignSelf: 'flex-start' }}
          >
            {isSubmitting ? 'Saving…' : 'Update Password'}
          </Button>
        </Stack>
      </form>
    </Section>
  );
}

/* ── Change email form ──────────────────────────────────────────────────── */
function ChangeEmailSection({ currentEmail }) {
  const [showPw, setShowPw]       = useState(false);
  // pending = { email, sentAt } while waiting for user to click link
  const [pending, setPending]     = useState(null);
  const [cooldown, setCooldown]   = useState(0);   // seconds until resend allowed
  const { register, handleSubmit, reset, getValues, formState: { errors, isSubmitting } } = useForm();

  // Countdown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const sendLink = async (newEmail, password) => {
    await api.post('/auth/change-email/', {
      new_email:        newEmail,
      current_password: password,
    });
    setPending({ email: newEmail, sentAt: Date.now() });
    setCooldown(60);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      await sendLink(data.new_email, data.current_password);
      toast.success(`Confirmation link sent to ${data.new_email}`);
    } catch (e) {
      toast.error(parseApiError(e, 'Failed to request email change.'));
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !pending) return;
    try {
      // Ask the user to re-enter their password for resend (security)
      const password = window.prompt('Re-enter your current password to resend the link:');
      if (!password) return;
      await api.post('/auth/resend-email-change/', {
        new_email:        pending.email,
        current_password: password,
      });
      setCooldown(60);
      toast.success(`New link sent to ${pending.email}`);
    } catch (e) {
      toast.error(parseApiError(e, 'Could not resend link.'));
    }
  };

  const handleCancel = () => {
    setPending(null);
    setCooldown(0);
    reset();
  };

  // ── Pending state: link sent, waiting for click ──────────────────────────
  if (pending) {
    return (
      <Section icon={<EmailOutlined fontSize="small" />} title="Change Email Address">
        <Alert severity="info" sx={{ borderRadius: 2, mb: 2 }} icon={<MarkEmailReadOutlined fontSize="small" />}>
          <Typography variant="body2" fontWeight={700}>Confirmation link sent!</Typography>
          <Typography variant="caption">
            We emailed a confirmation link to <strong>{pending.email}</strong>.
            Click it to complete the change. The link expires in 1 hour.
          </Typography>
        </Alert>

        <Stack spacing={1.5}>
          {/* Resend */}
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Button
              variant="outlined" size="small"
              onClick={handleResend}
              disabled={cooldown > 0}
              sx={{ borderRadius: 2, minWidth: 140 }}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend link'}
            </Button>
            <Typography variant="caption" color="text.disabled">
              {cooldown > 0 ? 'Please wait before requesting another link.' : "Didn't receive it? Check spam or resend."}
            </Typography>
          </Stack>

          {/* Change a different email */}
          <Button
            variant="text" size="small" color="inherit"
            onClick={handleCancel}
            sx={{ borderRadius: 2, alignSelf: 'flex-start', color: 'text.secondary', fontSize: '0.78rem' }}
          >
            Use a different email instead
          </Button>
        </Stack>
      </Section>
    );
  }

  // ── Default: form ────────────────────────────────────────────────────────
  return (
    <Section icon={<EmailOutlined fontSize="small" />} title="Change Email Address">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <TextField
            label="Current email" fullWidth size="small" disabled value={currentEmail}
          />
          <TextField
            label="New email address" type="email" fullWidth size="small"
            {...register('new_email', {
              required: 'Required',
              pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
              validate: v => v.toLowerCase() !== currentEmail.toLowerCase() || 'Same as current email',
            })}
            error={!!errors.new_email} helperText={errors.new_email?.message}
          />
          <TextField
            label="Current password (to confirm)"
            type={showPw ? 'text' : 'password'} fullWidth size="small"
            {...register('current_password', { required: 'Required' })}
            error={!!errors.current_password} helperText={errors.current_password?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowPw(s => !s)}>
                    {showPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Typography variant="caption" color="text.secondary">
            A confirmation link will be sent to your <strong>new</strong> email address.
            Your email won't change until you click it.
          </Typography>
          <Button
            type="submit" variant="contained" disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={14} color="inherit" /> : <EmailOutlined />}
            sx={{ borderRadius: 2, alignSelf: 'flex-start' }}
          >
            {isSubmitting ? 'Sending…' : 'Send Confirmation Link'}
          </Button>
        </Stack>
      </form>
    </Section>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  usePageTitle('Settings');
  const { user } = useAuth();
  const { toggleTheme, isDark } = useThemeToggle();

  const [prefs, setPrefs]         = useState(null);
  const [loadingPrefs, setLoading] = useState(true);
  const [saving, setSaving]        = useState(false);

  const fetchPrefs = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/preferences/');
      setPrefs(data);
    } catch { setPrefs({ email_order_updates: true, email_booking_updates: true, email_messages: false, email_marketing: false, profile_visible: true, activity_status: false }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPrefs(); }, [fetchPrefs]);

  const updatePref = async (key, value) => {
    const optimistic = { ...prefs, [key]: value };
    setPrefs(optimistic);
    setSaving(true);
    try {
      const { data } = await api.patch('/auth/preferences/', { [key]: value });
      setPrefs(data);
    } catch {
      setPrefs(prefs); // revert
      toast.error('Failed to save preference.');
    } finally { setSaving(false); }
  };

  return (
    <DashboardLayout>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h4" fontWeight={800}>Settings</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage preferences for {user?.name || user?.email || 'your account'}.
            {saving && <CircularProgress size={13} sx={{ ml: 1.5, verticalAlign: 'middle' }} />}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* ── Email Notifications ── */}
          <Grid item xs={12} md={6}>
            <Section icon={<NotificationsOutlined fontSize="small" />} title="Email Notifications">
              {loadingPrefs ? (
                <Stack spacing={1}>{[1,2,3,4].map(i => <Skeleton key={i} height={52} sx={{ borderRadius: 2 }} />)}</Stack>
              ) : (
                <>
                  <ToggleRow
                    label="Order updates" description="Emails when your order status changes."
                    checked={prefs?.email_order_updates ?? true}
                    onChange={e => updatePref('email_order_updates', e.target.checked)}
                  />
                  <ToggleRow
                    label="Booking updates" description="Emails when your booking is confirmed or declined."
                    checked={prefs?.email_booking_updates ?? true}
                    onChange={e => updatePref('email_booking_updates', e.target.checked)}
                  />
                  <ToggleRow
                    label="Message notifications" description="Email when you receive a new message."
                    checked={prefs?.email_messages ?? false}
                    onChange={e => updatePref('email_messages', e.target.checked)}
                  />
                  <ToggleRow
                    label="Marketing emails" description="News, tips, and platform announcements."
                    checked={prefs?.email_marketing ?? false}
                    onChange={e => updatePref('email_marketing', e.target.checked)}
                  />
                </>
              )}
            </Section>
          </Grid>

          {/* ── Appearance ── */}
          <Grid item xs={12} md={6}>
            <Section icon={<DarkModeOutlined fontSize="small" />} title="Appearance">
              <ToggleRow
                label="Dark mode" description="Switch the platform to a dark colour scheme."
                checked={isDark}
                onChange={toggleTheme}
              />
              <ToggleRow
                label="Profile visibility" description="Allow other users to find your profile."
                checked={prefs?.profile_visible ?? true}
                onChange={e => updatePref('profile_visible', e.target.checked)}
                disabled={loadingPrefs}
              />
              <ToggleRow
                label="Activity status" description="Show when you were last active."
                checked={prefs?.activity_status ?? false}
                onChange={e => updatePref('activity_status', e.target.checked)}
                disabled={loadingPrefs}
              />
            </Section>
          </Grid>

          {/* ── Change Email ── */}
          <Grid item xs={12} md={6}>
            <ChangeEmailSection currentEmail={user?.email || ''} />
          </Grid>

          {/* ── Change Password ── */}
          <Grid item xs={12} md={6}>
            <ChangePasswordSection />
          </Grid>
        </Grid>
      </Stack>
    </DashboardLayout>
  );
}
