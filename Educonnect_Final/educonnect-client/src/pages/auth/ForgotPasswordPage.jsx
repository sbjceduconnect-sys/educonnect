import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress, useTheme, IconButton, InputAdornment,
} from '@mui/material';
import { ArrowBack, Send, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export default function ForgotPasswordPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setSent(true);
      setSuccessMsg(res.data?.message || 'Verification code sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await axios.post(`${API_URL}/auth/reset-password`, { email, code, password });
      setSuccessMsg(res.data?.message || 'Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setSuccessMsg(res.data?.message || 'A new verification code has been sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: theme.palette.mode === 'dark'
          ? '#0F1E33'
          : '#1B3F6B',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ position: 'absolute', top: -150, left: -150, width: 450, height: 450, borderRadius: '50%', background: 'rgba(240, 120, 48, 0.45)', filter: 'blur(100px)' }} />
      <Box sx={{ position: 'absolute', bottom: -180, right: -150, width: 550, height: 550, borderRadius: '50%', background: 'rgba(240, 120, 48, 0.35)', filter: 'blur(120px)' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
            <Box
              sx={{
                width: 64, height: 64, borderRadius: '20px', mx: 'auto', mb: 2,
                background: 'linear-gradient(135deg, #1B3F6B, #F07830)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(27, 63, 107, 0.4)',
              }}
            >
              <Typography sx={{ fontSize: '2rem' }}>🎓</Typography>
            </Box>
          </motion.div>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff', mb: 0.5 }}>
            EduConnect
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            SaiBalaji Junior College
          </Typography>
        </Box>

        <Card
          sx={{
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(20px)',
            background: theme.palette.mode === 'dark'
              ? 'rgba(20, 37, 61, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <AnimatePresence mode="wait">
              {!sent ? (
                <motion.div
                  key="send-code-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, textAlign: 'center' }}>
                    Forgot Password?
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                    No worries, we'll help you reset it
                  </Typography>

                  {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }} onClose={() => setError('')}>
                      {error}
                    </Alert>
                  )}

                  <form onSubmit={handleSendCode}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      required
                      sx={{ mb: 3 }}
                      autoFocus
                    />
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
                      sx={{
                        py: 1.5,
                        background: 'linear-gradient(135deg, #1B3F6B, #143052)',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        boxShadow: '0 4px 15px rgba(27, 63, 107, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #143052, #0A1C32)',
                          boxShadow: '0 6px 20px rgba(27, 63, 107, 0.5)',
                        },
                      }}
                    >
                      {loading ? 'Sending...' : 'Send Verification Code'}
                    </Button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="reset-password-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, textAlign: 'center' }}>
                    Verify & Reset
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                    Enter verification code and your new password
                  </Typography>

                  {successMsg && (
                    <Alert severity="success" sx={{ mb: 2, borderRadius: '10px' }} onClose={() => setSuccessMsg('')}>
                      {successMsg}
                    </Alert>
                  )}

                  {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }} onClose={() => setError('')}>
                      {error}
                    </Alert>
                  )}

                  <form onSubmit={handleResetPassword}>
                    <TextField
                      fullWidth
                      label="Verification Code (OTP)"
                      type="text"
                      value={code}
                      onChange={(e) => { setCode(e.target.value); setError(''); }}
                      required
                      sx={{ mb: 2 }}
                      placeholder="e.g. 123456"
                      autoFocus
                    />
                    <TextField
                      fullWidth
                      label="New Password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      required
                      sx={{ mb: 2 }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                              {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      required
                      sx={{ mb: 3 }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small">
                              {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Lock />}
                      sx={{
                        py: 1.5,
                        background: 'linear-gradient(135deg, #1B3F6B, #143052)',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        boxShadow: '0 4px 15px rgba(27, 63, 107, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #143052, #0A1C32)',
                          boxShadow: '0 6px 20px rgba(27, 63, 107, 0.5)',
                        },
                      }}
                    >
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                  </form>

                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button
                      variant="text"
                      size="small"
                      onClick={handleResendCode}
                      disabled={loading}
                      sx={{ color: 'secondary.main', fontWeight: 600 }}
                    >
                      Resend Verification Code
                    </Button>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography
                component={RouterLink}
                to="/login"
                variant="body2"
                sx={{
                  color: 'secondary.main',
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                <ArrowBack fontSize="small" /> Back to Login
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
}
