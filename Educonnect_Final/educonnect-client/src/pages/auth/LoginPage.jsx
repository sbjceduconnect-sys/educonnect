import React, { useState } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, IconButton, InputAdornment,
  Alert, Divider, CircularProgress, useTheme,
} from '@mui/material';
import { Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { setAuthHeader } from '../../api/axiosInstance';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(formData.email, formData.password);
      setAuthHeader(data.accessToken);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
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
      {/* Background decoration */}
      <Box sx={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(108, 99, 255, 0.1)', filter: 'blur(60px)' }} />
      <Box sx={{ position: 'absolute', bottom: -120, left: -80, width: 500, height: 500, borderRadius: '50%', background: 'rgba(63, 81, 181, 0.1)', filter: 'blur(80px)' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <Box
              sx={{
                width: 64, height: 64, borderRadius: '20px', mx: 'auto', mb: 2,
                background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(108, 99, 255, 0.4)',
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
              ? 'rgba(26, 26, 46, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, textAlign: 'center' }}>
              Welcome Back
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              Sign in to continue learning
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
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                sx={{ mb: 2 }}
                autoFocus
              />
              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                sx={{ mb: 1 }}
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

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2.5 }}>
                <Typography
                  component={RouterLink}
                  to="/forgot-password"
                  variant="caption"
                  sx={{
                    color: 'secondary.main',
                    textDecoration: 'none',
                    fontWeight: 500,
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Forgot Password?
                </Typography>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
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
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Typography
                  component={RouterLink}
                  to="/register"
                  variant="body2"
                  sx={{ color: 'secondary.main', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                >
                  Sign Up
                </Typography>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
}
