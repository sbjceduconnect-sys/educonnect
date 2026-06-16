import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, IconButton, InputAdornment,
  Alert, MenuItem, Grid, CircularProgress, useTheme, Stepper, Step, StepLabel,
} from '@mui/material';
import { Visibility, VisibilityOff, PersonAdd, ArrowBack, ArrowForward } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { STREAMS } from '../../utils/constants';

const steps = ['Account Info', 'Personal Details', 'Academic Info'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { register } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '', username: '', password: '', role: 'student', institutionCode: '',
    firstName: '', lastName: '', profile: {
      phone: '', dateOfBirth: '', stream: '', section: '', enrollmentNo: '',
      employeeId: '', guardianName: '', guardianPhone: '', qualification: '', specialization: '',
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('profile.')) {
      const key = name.split('.')[1];
      setFormData({ ...formData, profile: { ...formData.profile, [key]: value } });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(formData);
      setSuccess('Registration successful! Please wait for admin approval.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      const details = err.response?.data?.errors;
      if (details && Array.isArray(details) && details.length > 0) {
        setError(`${msg}: ${details.join('; ')}`);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (activeStep === 0) return formData.email && formData.username && formData.password;
    if (activeStep === 1) return formData.firstName && formData.lastName;
    return true;
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <>
            <TextField fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required sx={{ mb: 2 }} />
            <TextField fullWidth label="Username" name="username" value={formData.username} onChange={handleChange} required sx={{ mb: 2 }} />
            <TextField fullWidth label="Password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} required sx={{ mb: 2 }}
              helperText="Minimum 6 characters"
              InputProps={{ endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              )}}
            />
            <TextField fullWidth select label="Role" name="role" value={formData.role} onChange={handleChange} sx={{ mb: 2 }}>
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="teacher">Teacher</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
            {formData.role !== 'student' && (
              <TextField fullWidth label="Institution Code" name="institutionCode" value={formData.institutionCode} onChange={handleChange} required sx={{ mb: 2 }}
                helperText={`Required for ${formData.role} registration`}
              />
            )}
          </>
        );
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField fullWidth label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Phone" name="profile.phone" value={formData.profile.phone} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Date of Birth" name="profile.dateOfBirth" type="date" value={formData.profile.dateOfBirth} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            </Grid>
            {formData.role === 'student' && (
              <>
                <Grid item xs={12}><TextField fullWidth label="Guardian Name" name="profile.guardianName" value={formData.profile.guardianName} onChange={handleChange} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Guardian Phone" name="profile.guardianPhone" value={formData.profile.guardianPhone} onChange={handleChange} /></Grid>
              </>
            )}
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={2}>
            {formData.role === 'student' ? (
              <>
                <Grid item xs={12}><TextField fullWidth select label="Stream" name="profile.stream" value={formData.profile.stream} onChange={handleChange}>
                  {STREAMS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField></Grid>
                <Grid item xs={6}><TextField fullWidth label="Section" name="profile.section" value={formData.profile.section} onChange={handleChange} /></Grid>
                <Grid item xs={6}><TextField fullWidth label="Enrollment No" name="profile.enrollmentNo" value={formData.profile.enrollmentNo} onChange={handleChange} /></Grid>
              </>
            ) : (
              <>
                <Grid item xs={12}><TextField fullWidth label="Employee ID" name="profile.employeeId" value={formData.profile.employeeId} onChange={handleChange} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Qualification" name="profile.qualification" value={formData.profile.qualification} onChange={handleChange} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Specialization" name="profile.specialization" value={formData.profile.specialization} onChange={handleChange} /></Grid>
              </>
            )}
          </Grid>
        );
      default: return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0F0F23, #1A1A2E, #16213E)'
          : 'linear-gradient(135deg, #667eea, #764ba2, #6C63FF)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <Box sx={{ position: 'absolute', top: -80, left: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(108, 99, 255, 0.08)', filter: 'blur(60px)' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff', mb: 0.5 }}>Create Account</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Join EduConnect - SaiBalaji Junior College</Typography>
        </Box>

        <Card sx={{ borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', background: theme.palette.mode === 'dark' ? 'rgba(26,26,46,0.95)' : 'rgba(255,255,255,0.95)' }}>
          <CardContent sx={{ p: 4 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 3 }} alternativeLabel>
              {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
            </Stepper>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '10px' }}>{success}</Alert>}

            <form onSubmit={handleSubmit}>
              {renderStep()}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, gap: 2 }}>
                <Button
                  type="button"
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep(prev => prev - 1)}
                  startIcon={<ArrowBack />}
                  sx={{ borderRadius: '10px' }}
                >
                  Back
                </Button>
                {activeStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    variant="contained"
                    onClick={() => setActiveStep(prev => prev + 1)}
                    endIcon={<ArrowForward />}
                    disabled={!canProceed()}
                    sx={{ background: 'linear-gradient(135deg, #6C63FF, #3F51B5)', borderRadius: '10px', px: 3 }}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PersonAdd />}
                    sx={{ background: 'linear-gradient(135deg, #6C63FF, #3F51B5)', borderRadius: '10px', px: 3 }}
                  >
                    {loading ? 'Registering...' : 'Register'}
                  </Button>
                )}
              </Box>
            </form>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Typography component={RouterLink} to="/login" variant="body2" sx={{ color: 'secondary.main', textDecoration: 'none', fontWeight: 600 }}>
                  Sign In
                </Typography>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
}
