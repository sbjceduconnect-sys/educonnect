import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  TextField,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
} from '@mui/material';
import {
  Settings,
  Lock,
  Notifications,
  Palette,
  Visibility,
  VisibilityOff,
  CheckCircle,
  VpnKey,
  Shield,
  LightMode,
  DarkMode,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeMode } from '../../contexts/ThemeContext';
import { authApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, accessToken } = useAuth();
  const { mode, toggleTheme, isDark } = useThemeMode();

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password fields
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('educonnect-notifications');
    return saved
      ? JSON.parse(saved)
      : {
          announcements: true,
          examSchedules: true,
          resultsPublished: true,
          officeHoursBookings: true,
          emailDigest: false,
        };
  });

  useEffect(() => {
    localStorage.setItem('educonnect-notifications', JSON.stringify(notifications));
  }, [notifications]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
    setSuccess('');
  };

  const handleNotificationChange = (field) => (event) => {
    setNotifications((prev) => ({
      ...prev,
      [field]: event.target.checked,
    }));
    toast.success('Notification preferences updated!');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      setAuthHeader(accessToken);
      await authApi.changePassword({
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully');
      setSuccess('Your password has been changed.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Settings & Preferences"
        subtitle="Manage your profile settings, security settings, and interface view options"
      />

      <Grid container spacing={4}>
        {/* Navigation Sidebar/Tabs */}
        <Grid item xs={12} md={3}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
              <Tabs
                orientation="vertical"
                value={activeTab}
                onChange={handleTabChange}
                sx={{
                  borderRight: { md: 1 },
                  borderColor: 'divider',
                  '& .MuiTab-root': {
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    px: 3,
                    py: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: { md: '0 8px 8px 0' },
                    mr: { md: 1 },
                    '&.Mui-selected': {
                      color: '#6C63FF',
                      bgcolor: 'rgba(108, 99, 255, 0.04)',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    left: 0,
                    right: 'auto',
                    width: 3,
                    background: 'linear-gradient(180deg, #6C63FF, #3F51B5)',
                  },
                }}
              >
                <Tab label="Appearance & Theme" icon={<Palette sx={{ mr: 1 }} />} iconPosition="start" />
                <Tab label="Account Security" icon={<Lock sx={{ mr: 1 }} />} iconPosition="start" />
                <Tab label="Notification Rules" icon={<Notifications sx={{ mr: 1 }} />} iconPosition="start" />
                <Tab label="Session & Meta Info" icon={<Shield sx={{ mr: 1 }} />} iconPosition="start" />
              </Tabs>
            </Card>
          </motion.div>
        </Grid>

        {/* Setting Panel */}
        <Grid item xs={12} md={9}>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', minHeight: 400 }}>
              <CardContent sx={{ p: 4 }}>
                {/* 1. Theme Configuration */}
                {activeTab === 0 && (
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                      Appearance Settings
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                      Choose your preferred interface color system to enhance visual reading.
                    </Typography>

                    <Grid container spacing={3}>
                      {/* Light mode select */}
                      <Grid item xs={12} sm={6}>
                        <Paper
                          onClick={() => mode !== 'light' && toggleTheme()}
                          variant="outlined"
                          sx={{
                            p: 3,
                            borderRadius: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            borderColor: mode === 'light' ? '#6C63FF' : 'divider',
                            borderWidth: mode === 'light' ? 2 : 1,
                            bgcolor: 'background.paper',
                            boxShadow: mode === 'light' ? '0 8px 24px rgba(108, 99, 255, 0.08)' : 'none',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LightMode sx={{ color: mode === 'light' ? '#6C63FF' : 'action.active' }} />
                              <Typography sx={{ fontWeight: 700 }}>Light Theme</Typography>
                            </Box>
                            {mode === 'light' && <CheckCircle color="primary" />}
                          </Box>
                          <Box sx={{ p: 1.5, bgcolor: '#f5f5f7', borderRadius: '8px', border: '1px solid #e5e5ea' }}>
                            <Box sx={{ height: 10, width: '70%', bgcolor: '#6C63FF', borderRadius: 1, mb: 1 }} />
                            <Box sx={{ height: 10, width: '40%', bgcolor: '#bbb', borderRadius: 1 }} />
                          </Box>
                        </Paper>
                      </Grid>

                      {/* Dark mode select */}
                      <Grid item xs={12} sm={6}>
                        <Paper
                          onClick={() => mode !== 'dark' && toggleTheme()}
                          variant="outlined"
                          sx={{
                            p: 3,
                            borderRadius: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            borderColor: mode === 'dark' ? '#6C63FF' : 'divider',
                            borderWidth: mode === 'dark' ? 2 : 1,
                            bgcolor: 'background.paper',
                            boxShadow: mode === 'dark' ? '0 8px 24px rgba(108, 99, 255, 0.15)' : 'none',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <DarkMode sx={{ color: mode === 'dark' ? '#9c27b0' : 'action.active' }} />
                              <Typography sx={{ fontWeight: 700 }}>Dark Theme</Typography>
                            </Box>
                            {mode === 'dark' && <CheckCircle color="primary" />}
                          </Box>
                          <Box sx={{ p: 1.5, bgcolor: '#121212', borderRadius: '8px', border: '1px solid #333' }}>
                            <Box sx={{ height: 10, width: '70%', bgcolor: '#6C63FF', borderRadius: 1, mb: 1 }} />
                            <Box sx={{ height: 10, width: '40%', bgcolor: '#555', borderRadius: 1 }} />
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* 2. Account Security */}
                {activeTab === 1 && (
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                      Account Password Update
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Change your account login security credentials. Ensure your password is at least 6 characters.
                    </Typography>

                    <form onSubmit={handleChangePassword}>
                      {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setError('')}>
                          {error}
                        </Alert>
                      )}
                      {success && (
                        <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setSuccess('')}>
                          {success}
                        </Alert>
                      )}

                      <Stack spacing={3} sx={{ maxWidth: 450 }}>
                        <TextField
                          fullWidth
                          label="Current Login Password"
                          type={showCurrentPwd ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, currentPassword: e.target.value })
                          }
                          required
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowCurrentPwd(!showCurrentPwd)} size="small">
                                  {showCurrentPwd ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                        />

                        <TextField
                          fullWidth
                          label="New Secure Password"
                          type={showNewPwd ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, newPassword: e.target.value })
                          }
                          required
                          helperText="Use uppercase letters, numbers, and symbols for better safety."
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowNewPwd(!showNewPwd)} size="small">
                                  {showNewPwd ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                        />

                        <TextField
                          fullWidth
                          label="Confirm New Password"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                          }
                          required
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                        />

                        <Box sx={{ pt: 1 }}>
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            startIcon={
                              loading ? <CircularProgress size={16} color="inherit" /> : <VpnKey />
                            }
                            sx={{
                              px: 4,
                              py: 1.2,
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
                            }}
                          >
                            Update Password
                          </Button>
                        </Box>
                      </Stack>
                    </form>
                  </Box>
                )}

                {/* 3. Notification Toggles */}
                {activeTab === 2 && (
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                      Notification Rules & Preferences
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                      Toggle which events trigger alerts within the portal and your inbox.
                    </Typography>

                    <Stack spacing={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notifications.announcements}
                            onChange={handleNotificationChange('announcements')}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                              Announcements & Notifications
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Receive popups and alerts for department circulars and college news
                            </Typography>
                          </Box>
                        }
                      />
                      <Divider />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={notifications.examSchedules}
                            onChange={handleNotificationChange('examSchedules')}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                              Exam Dates & Schedules
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Get reminded when new test slots are scheduled or dates changed
                            </Typography>
                          </Box>
                        }
                      />
                      <Divider />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={notifications.resultsPublished}
                            onChange={handleNotificationChange('resultsPublished')}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                              Academic Results Publishing
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Notify immediately when your exam marks and grade-sheets are published
                            </Typography>
                          </Box>
                        }
                      />
                      <Divider />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={notifications.officeHoursBookings}
                            onChange={handleNotificationChange('officeHoursBookings')}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                              Office Hours & Booking Reminders
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Receive slot bookings updates and cancellations of counseling slots
                            </Typography>
                          </Box>
                        }
                      />
                      <Divider />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={notifications.emailDigest}
                            onChange={handleNotificationChange('emailDigest')}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                              Weekly Summary Email Digest
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Subscribe to a consolidated weekend summary of attendance and updates
                            </Typography>
                          </Box>
                        }
                      />
                    </Stack>
                  </Box>
                )}

                {/* 4. Session & Info */}
                {activeTab === 3 && (
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                      Account & Session Metadata
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Review your institutional account credentials, role clearance levels, and active tokens.
                    </Typography>

                    <Stack spacing={2} sx={{ bgcolor: 'action.hover', p: 3, borderRadius: '12px' }}>
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            User ID Ref:
                          </Typography>
                        </Grid>
                        <Grid item xs={8}>
                          <Typography variant="body2" color="text.secondary">
                            {user?.id || 'N/A'}
                          </Typography>
                        </Grid>

                        <Grid item xs={4}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            Email Address:
                          </Typography>
                        </Grid>
                        <Grid item xs={8}>
                          <Typography variant="body2" color="text.secondary">
                            {user?.email || 'N/A'}
                          </Typography>
                        </Grid>

                        <Grid item xs={4}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            Assigned Portal Role:
                          </Typography>
                        </Grid>
                        <Grid item xs={8}>
                          <Typography
                            variant="body2"
                            sx={{ textTransform: 'capitalize', fontWeight: 600, color: '#6C63FF' }}
                          >
                            {user?.role || 'N/A'}
                          </Typography>
                        </Grid>

                        <Grid item xs={4}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            Account Status:
                          </Typography>
                        </Grid>
                        <Grid item xs={8}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: user?.isApproved ? 'success.main' : 'warning.main' }}
                          >
                            {user?.isApproved ? 'Approved & Fully Verified' : 'Awaiting Approval'}
                          </Typography>
                        </Grid>

                        <Grid item xs={4}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            Date Joined:
                          </Typography>
                        </Grid>
                        <Grid item xs={8}>
                          <Typography variant="body2" color="text.secondary">
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}
