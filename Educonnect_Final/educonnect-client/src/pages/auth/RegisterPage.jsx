import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, IconButton, InputAdornment,
  Alert, MenuItem, Grid, CircularProgress, useTheme, Stepper, Step, StepLabel,
  Checkbox, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions,
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
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    email: '', username: '', password: '', role: 'student', institutionCode: '',
    firstName: '', lastName: '', profile: {
      phone: '', dateOfBirth: '', stream: '', section: '', enrollmentNo: '',
      employeeId: '', guardianName: '', guardianPhone: '', qualification: '', specialization: '',
    },
    agreeTerms: false,
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
    if (activeStep === 2) return formData.agreeTerms;
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
            <Grid item xs={12} sx={{ mt: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="agreeTerms"
                    checked={formData.agreeTerms || false}
                    onChange={(e) => {
                      setFormData({ ...formData, agreeTerms: e.target.checked });
                      setError('');
                    }}
                    color="primary"
                    required
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    I agree to the{' '}
                    <span
                      style={{ color: theme.palette.primary.main, cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTermsDialogOpen(true);
                      }}
                    >
                      Terms & Conditions
                    </span>{' '}
                    and authorize data collection for college records.
                  </Typography>
                }
              />
            </Grid>
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
          ? '#0F1E33'
          : '#F5EDE0',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '35vh',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        {/* Layered background curve 1 (lower opacity/accent orange) */}
        <svg
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: theme.palette.mode === 'dark' ? 0.1 : 0.25 }}
        >
          <path
            fill="#F07830"
            d="M0,160L80,176C160,192,320,224,480,229.3C640,235,800,213,960,186.7C1120,160,1280,128,1360,112L1440,96L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"
          />
        </svg>
        {/* Layered background curve 2 (main gradient wave) */}
        <svg
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '90%' }}
        >
          <defs>
            <linearGradient id="reg-wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1B3F6B" />
              <stop offset="100%" stopColor="#F07830" />
            </linearGradient>
          </defs>
          <path
            fill="url(#reg-wave-grad)"
            d="M0,192L80,186.7C160,181,320,171,480,181.3C640,192,800,224,960,229.3C1120,235,1280,213,1360,202.7L1440,192L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"
          />
        </svg>
      </Box>

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

        <Card sx={{ borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', background: theme.palette.mode === 'dark' ? 'rgba(20,37,61,0.95)' : 'rgba(255,255,255,0.95)' }}>
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
                    sx={{ background: 'linear-gradient(135deg, #1B3F6B, #143052)', borderRadius: '10px', px: 3 }}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PersonAdd />}
                    sx={{ background: 'linear-gradient(135deg, #1B3F6B, #143052)', borderRadius: '10px', px: 3 }}
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

      {/* Terms & Conditions Dialog */}
      <Dialog
        open={termsDialogOpen}
        onClose={() => setTermsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Terms & Conditions</DialogTitle>
        <DialogContent dividers sx={{ pb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: theme.palette.primary.main }}>1. Data Collection & Usage</Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            EduConnect securely stores and processes your academic data, including registration details (name, email, phone number, guardian contact details), enrollment information, attendance records, and examination grades. This data is solely used to facilitate college operations and performance analytics.
          </Typography>
          
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: theme.palette.primary.main }}>2. Device Permissions Required</Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            By registering, you authorize the application to access and utilize:
            <br />
            • <b>Storage Space:</b> Required to read and write/download official PDF progress reports and academic transcripts to your device storage.
            <br />
            • <b>Network Connection:</b> Required to interact with backend services for grades syncing and real-time announcements.
          </Typography>
          
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: theme.palette.primary.main }}>3. Academic Results Lock</Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Student profiles are subject to administrator approval. Furthermore, the college reserves the right to lock grade views and progress report downloads for accounts with outstanding or unpaid fee dues until cleared.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setTermsDialogOpen(false)} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', px: 3 }}>
            I Understand
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
