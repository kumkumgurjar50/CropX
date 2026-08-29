import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, Grid, IconButton, Paper, Stack, TextField, Typography, alpha,
  Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, CircularProgress,
} from '@mui/material';
import {
  Close, ShoppingCartCheckout, CheckCircle, LocalShipping, Science,
  PaymentOutlined, ArrowBack, Verified,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';

/**
 * FertilizerOrderDialog
 * 
 * Multi-step checkout dialog following the exact sequence:
 * Step 1: Customer Details Form & Order Summary
 * Step 2: Cash on Delivery (COD) Selection & Confirm Order
 * Step 3: Order Placed Successfully Confirmation
 */
export default function FertilizerOrderDialog({ open, onClose, items = [], onSuccess }) {
  const [step, setStep] = useState(1); // 1: Form, 2: COD Payment, 3: Success
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);

  const orderItems = items;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      full_name: '',
      mobile: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    },
  });

  const totalAmount = orderItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity || 1), 0);

  // Reset wizard on dialog open
  useEffect(() => {
    if (open) {
      setStep(1);
      setFormData(null);
      setOrderDetails(null);
      setIsSubmitting(false);
      reset({
        full_name: '',
        mobile: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
      });
    }
  }, [open, reset]);

  // Step 1 Submit handler (validates details form & moves to Step 2 COD)
  const onFormSubmit = (data) => {
    setFormData(data);
    setStep(2);
  };

  // Step 2 Submit handler (confirms order and posts to backend database)
  const handleConfirmOrder = async () => {
    if (!formData || orderItems.length === 0) return;

    setIsSubmitting(true);
    try {
      const createdOrders = [];

      for (const item of orderItems) {
        const payload = {
          fertilizer: item.id,
          quantity: Number(item.quantity || 1),
          full_name: formData.full_name.trim(),
          mobile_number: formData.mobile.trim(),
          delivery_address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
          payment_type: 'COD',
        };

        const response = await api.post('/fertilizers/orders/', payload);
        createdOrders.push(response.data);
      }

      const refId = createdOrders[0]?.order_id || `FO-${Math.floor(100000 + Math.random() * 900000)}`;

      setOrderDetails({
        orders: createdOrders,
        totalAmount,
        itemCount: orderItems.length,
        referenceId: refId,
        customerName: formData.full_name.trim(),
        addressSummary: `${formData.address.trim()}, ${formData.city.trim()}, ${formData.state.trim()} - ${formData.pincode.trim()}`,
        mobile: formData.mobile.trim(),
      });

      setStep(3); // Success Screen
      toast.success('Order confirmed & saved in database!');

      if (onSuccess) {
        onSuccess(createdOrders);
      }
    } catch (error) {
      console.error('Order placement error:', error);
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const firstError = Object.values(errorData)[0];
          const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          toast.error(errorMessage || 'Failed to place order. Please check your details.');
        } else {
          toast.error('Failed to place order. Please try again.');
        }
      } else {
        toast.error('Failed to place order. Please check your connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!open) return null;

  // STEP 3: Order Placed Successfully Confirmation
  if (step === 3 && orderDetails) {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: { xs: 2, sm: 4 }, p: 1 } }}
      >
        <DialogContent sx={{ textAlign: 'center', py: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              width: { xs: 64, sm: 76 },
              height: { xs: 64, sm: 76 },
              borderRadius: '50%',
              bgcolor: alpha('#22c55e', 0.15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <CheckCircle sx={{ fontSize: { xs: 40, sm: 46 }, color: '#22c55e' }} />
          </Box>
          
          <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5, fontSize: { xs: '1.2rem', sm: '1.4rem' } }}>
            Order Placed Successfully!
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, fontSize: '0.85rem' }}>
            Your fertilizer order has been saved in the database
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: alpha('#2E7D32', 0.05),
              border: '1px solid',
              borderColor: alpha('#2E7D32', 0.15),
              textAlign: 'left',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Order Reference Number
            </Typography>
            <Typography variant="h6" fontWeight={800} color="primary.main" sx={{ mb: 1.5 }}>
              {orderDetails.referenceId}
            </Typography>

            <Divider sx={{ my: 1.5 }} />

            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                ITEMS PURCHASED ({orderDetails.itemCount})
              </Typography>
              {orderItems.map((it, idx) => (
                <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: '65%' }}>
                    {it.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {it.quantity} × ₹{Number(it.price).toLocaleString('en-IN')}
                  </Typography>
                </Stack>
              ))}

              <Divider sx={{ my: 1 }} />

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" fontWeight={700}>Total Amount</Typography>
                <Typography variant="h6" fontWeight={800} color="primary.main">
                  ₹{orderDetails.totalAmount.toLocaleString('en-IN')}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Payment Method</Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <LocalShipping sx={{ fontSize: 16, color: 'success.main' }} />
                  <Typography variant="body2" fontWeight={700} color="success.main">
                    Cash on Delivery (COD)
                  </Typography>
                </Stack>
              </Stack>

              <Box sx={{ pt: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block">Delivery To:</Typography>
                <Typography variant="caption" fontWeight={700} color="text.primary" display="block">{orderDetails.customerName} ({orderDetails.mobile})</Typography>
                <Typography variant="caption" color="text.secondary" display="block">{orderDetails.addressSummary}</Typography>
              </Box>
            </Stack>
          </Paper>
        </DialogContent>
        
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleClose}
            sx={{ borderRadius: 2.5, py: 1.2, fontWeight: 700, bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1b5e20' } }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // STEP 2: Cash on Delivery (COD) Selection & Order Confirmation
  if (step === 2) {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: { xs: 2, sm: 4 }, overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton size="small" onClick={() => setStep(1)} disabled={isSubmitting}>
              <ArrowBack fontSize="small" />
            </IconButton>
            <PaymentOutlined sx={{ color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={800} sx={{ fontSize: '1.1rem' }}>
              Select Payment Method
            </Typography>
          </Stack>
          <IconButton size="small" onClick={handleClose} disabled={isSubmitting}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 0, px: { xs: 2, sm: 3 } }}>
          <Stack spacing={2.5}>
            {/* Delivery Address Review */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: alpha('#2E7D32', 0.04), border: '1px solid', borderColor: alpha('#2E7D32', 0.15) }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>DELIVERING TO</Typography>
              <Typography variant="body2" fontWeight={700}>{formData?.full_name} ({formData?.mobile})</Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {formData?.address}, {formData?.city}, {formData?.state} - {formData?.pincode}
              </Typography>
            </Paper>

            {/* Payment Method Card - Cash on Delivery */}
            <Box>
              <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                Payment Option
              </Typography>

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: '2px solid',
                  borderColor: '#2E7D32',
                  bgcolor: alpha('#2E7D32', 0.06),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <LocalShipping sx={{ color: '#2E7D32', fontSize: 28 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={800} color="#2E7D32">
                      Cash on Delivery (COD)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pay with cash when your fertilizer items are delivered.
                    </Typography>
                  </Box>
                </Stack>
                <Radio checked color="success" />
              </Paper>
            </Box>

            {/* Final Order Summary Box */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
              <Stack spacing={1}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>ORDER SUMMARY ({orderItems.length} ITEMS)</Typography>
                {orderItems.map((item, idx) => (
                  <Stack key={idx} direction="row" justifyContent="space-between">
                    <Typography variant="body2" noWrap sx={{ maxWidth: '65%' }}>{item.name}</Typography>
                    <Typography variant="body2" fontWeight={600}>{item.quantity} × ₹{Number(item.price).toLocaleString('en-IN')}</Typography>
                  </Stack>
                ))}
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1" fontWeight={800}>Total Payable (COD):</Typography>
                  <Typography variant="h6" fontWeight={800} color="primary.main">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2.5 }, gap: 1 }}>
          <Button onClick={() => setStep(1)} variant="outlined" disabled={isSubmitting} sx={{ borderRadius: 2, px: 2.5 }}>
            Back
          </Button>
          <Button
            onClick={handleConfirmOrder}
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}
            sx={{ borderRadius: 2, px: 3, fontWeight: 700, bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1b5e20' } }}
          >
            {isSubmitting ? 'Saving Order...' : `Confirm Order — ₹${totalAmount.toLocaleString('en-IN')}`}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // STEP 1: Customer Details Form
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: { xs: 2, sm: 4 }, overflow: 'hidden' } }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        pb: 1.5,
        px: { xs: 2, sm: 3 },
        pt: { xs: 2, sm: 2.5 },
      }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ShoppingCartCheckout sx={{ color: 'primary.main', fontSize: { xs: 22, sm: 26 } }} />
          <Typography variant="h6" fontWeight={800} sx={{ fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>
            Checkout ({orderItems.length} Fertilizer Item{orderItems.length > 1 ? 's' : ''})
          </Typography>
        </Stack>
        <IconButton size="small" onClick={handleClose} disabled={isSubmitting}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit(onFormSubmit)}>
        <DialogContent sx={{ pt: 0, px: { xs: 2, sm: 3 } }}>
          <Stack spacing={2.5}>
            {/* Order Summary Header */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: { xs: 2, sm: 3 },
                bgcolor: alpha('#2E7D32', 0.04),
                border: '1px solid',
                borderColor: alpha('#2E7D32', 0.12),
              }}
            >
              <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                Order Items Summary
              </Typography>
              
              <Stack spacing={1} sx={{ maxHeight: 150, overflowY: 'auto', pr: 0.5 }}>
                {orderItems.map((item, idx) => (
                  <Stack key={idx} direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 40, height: 40, borderRadius: 1.5,
                          bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden',
                        }}
                      >
                        {item.image || item.image_url ? (
                          <Box component="img" src={item.image || item.image_url} alt={item.name} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <Science sx={{ fontSize: 20, color: alpha('#2E7D32', 0.4) }} />
                        )}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} noWrap sx={{ fontSize: '0.825rem' }}>{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.fertilizer_type || 'Fertilizer'} · {item.unit}</Typography>
                      </Box>
                    </Stack>
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      {item.quantity} × ₹{Number(item.price).toLocaleString('en-IN')}
                    </Typography>
                  </Stack>
                ))}
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Total Amount:</Typography>
                <Typography variant="h6" fontWeight={800} color="primary.main">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </Typography>
              </Stack>
            </Paper>

            {/* Customer Details Form */}
            <Box>
              <Typography variant="body2" fontWeight={700} sx={{ mb: 1.5 }}>
                Customer & Delivery Details
              </Typography>

              <Grid container spacing={1.5}>
                {/* Full Name */}
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="full_name"
                    control={control}
                    rules={{
                      required: 'Full name is required',
                      minLength: { value: 2, message: 'Minimum 2 characters' },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Full Name *"
                        fullWidth
                        size="small"
                        error={!!errors.full_name}
                        helperText={errors.full_name?.message}
                        placeholder="Enter full name"
                        disabled={isSubmitting}
                      />
                    )}
                  />
                </Grid>

                {/* Mobile Number */}
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="mobile"
                    control={control}
                    rules={{
                      required: 'Mobile number is required',
                      pattern: {
                        value: /^[6-9]\d{9}$/,
                        message: 'Enter 10-digit Indian mobile number',
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Mobile Number *"
                        fullWidth
                        size="small"
                        error={!!errors.mobile}
                        helperText={errors.mobile?.message}
                        placeholder="10-digit mobile"
                        disabled={isSubmitting}
                        inputProps={{ maxLength: 10 }}
                      />
                    )}
                  />
                </Grid>

                {/* Delivery Address */}
                <Grid item xs={12}>
                  <Controller
                    name="address"
                    control={control}
                    rules={{
                      required: 'Delivery address is required',
                      minLength: { value: 5, message: 'Please enter complete address' },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Delivery Address *"
                        fullWidth
                        size="small"
                        multiline
                        rows={2}
                        error={!!errors.address}
                        helperText={errors.address?.message}
                        placeholder="House no, street, landmark, area"
                        disabled={isSubmitting}
                      />
                    )}
                  />
                </Grid>

                {/* City */}
                <Grid item xs={12} sm={4}>
                  <Controller
                    name="city"
                    control={control}
                    rules={{ required: 'City is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="City *"
                        fullWidth
                        size="small"
                        error={!!errors.city}
                        helperText={errors.city?.message}
                        placeholder="City"
                        disabled={isSubmitting}
                      />
                    )}
                  />
                </Grid>

                {/* State */}
                <Grid item xs={12} sm={4}>
                  <Controller
                    name="state"
                    control={control}
                    rules={{ required: 'State is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="State *"
                        fullWidth
                        size="small"
                        error={!!errors.state}
                        helperText={errors.state?.message}
                        placeholder="State"
                        disabled={isSubmitting}
                      />
                    )}
                  />
                </Grid>

                {/* Pincode */}
                <Grid item xs={12} sm={4}>
                  <Controller
                    name="pincode"
                    control={control}
                    rules={{
                      required: 'Pincode is required',
                      pattern: {
                        value: /^\d{6}$/,
                        message: 'Must be 6 digits',
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Pincode *"
                        fullWidth
                        size="small"
                        error={!!errors.pincode}
                        helperText={errors.pincode?.message}
                        placeholder="6-digit pincode"
                        disabled={isSubmitting}
                        inputProps={{ maxLength: 6 }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2.5 }, pt: 1, gap: 1 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            disabled={isSubmitting}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={<LocalShipping />}
            sx={{ borderRadius: 2, px: 3, fontWeight: 700, bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1b5e20' } }}
          >
            Proceed to Payment (COD)
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
