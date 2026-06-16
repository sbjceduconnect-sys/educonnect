import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress, useTheme,
} from '@mui/material';
import { ArrowBack, Send } from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export default function ForgotPasswordPage() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
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
          ? 'linear-gradient(135deg, #0F0F23 0%, #1A1A2E 30%, #16213E 60%, #0F0F23 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6C63FF 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(108, 99, 255, 0.1)', filter: 'blur(60px)' }} />
      <Box sx={{ position: 'absolute', bottom: -120, left: -80, width: 500, height: 500, borderRadius: '50%', background: 'rgba(63, 81, 181, 0.1)', filter: 'blur(80px)' }} />

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
                background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(108, 99, 255, 0.4)',
              }}
            >
              <Typography sx={{ fontSize: '2rem' }}>🔑</Typography>
            </Box>
          </motion.div>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff', mb: 0.5 }}>
            Reset Password
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Enter your email to receive a reset link
          </Typography>
        </Box>

        <Card
          sx={{
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(20px)',
            background: theme.palette.mode === 'dark'
              ? 'rgba(26, 26, 46, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {sent ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Check Your Email
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  If an account with that email exists, we've sent a password reset link.
                </Typography>
                <Button
                  component={RouterLink}
                  to="/login"
                  startIcon={<ArrowBack />}
                  sx={{ fontWeight: 600 }}
                >
                  Back to Login
                </Button>
              </Box>
            ) : (
              <>
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

                <form onSubmit={handleSubmit}>
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
                      background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      boxShadow: '0 4px 15px rgba(108, 99, 255, 0.4)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5B52EE, #3545A0)',
                        boxShadow: '0 6px 20px rgba(108, 99, 255, 0.5)',
                      },
                    }}
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </form>

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
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
}
