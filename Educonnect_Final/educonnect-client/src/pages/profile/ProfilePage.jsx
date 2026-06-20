import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Avatar, Grid, Button,
  Chip, Divider, Alert, CircularProgress, Tab, Tabs, IconButton, InputAdornment,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Edit, Save, Cancel, Visibility, VisibilityOff, AccountCircle, CameraAlt } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { userApi, authApi, departmentApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import { STREAMS } from '../../utils/constants';
import { getAvatarUrl } from '../../utils/helpers';

export default function ProfilePage() {
  const { user, accessToken, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState(0);
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);
  const fileInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file must be under 5MB');
      return;
    }

    setAvatarUploading(true);
    const uploadToastId = toast.loading('Uploading profile picture...');
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      setAuthHeader(accessToken);
      const res = await userApi.uploadAvatar(user.id, formData);
      if (res.data.success) {
        setUser(res.data.data);
        toast.success('Profile picture updated successfully!', { id: uploadToastId });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to upload profile picture', { id: uploadToastId });
    } finally {
      setAvatarUploading(false);
    }
  };

  const fetchDepts = async () => {
    try {
      const res = await departmentApi.list();
      setDepartments(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        profile: { ...user.profile },
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      setAuthHeader(accessToken);
      const res = await userApi.updateUser(user.id, formData);
      if (res.data.success) {
        setUser(res.data.data);
        setEditing(false);
        toast.success('Profile updated!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      setAuthHeader(accessToken);
      await authApi.changePassword(passwordData);
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  const getDeptName = (id) => {
    const d = departments.find((x) => x.id === id);
    return d ? d.name : 'Unknown Department';
  };

  return (
    <Box>
      <PageHeader title="My Profile" subtitle="Manage your account information and academic details" />

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card sx={{ borderRadius: '16px', textAlign: 'center' }}>
              <Box sx={{ height: 120, background: 'linear-gradient(135deg, #1B3F6B, #143052)', borderRadius: '16px 16px 0 0', position: 'relative' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
                <Box
                  onClick={handleAvatarClick}
                  sx={{
                    position: 'absolute',
                    bottom: -45,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    '&:hover .avatar-overlay': { opacity: 1 },
                  }}
                >
                  <Avatar
                    src={getAvatarUrl(user?.avatar)}
                    sx={{
                      width: 90, height: 90, fontSize: '2rem', fontWeight: 800,
                      background: 'linear-gradient(135deg, #3A69A0, #1B3F6B)',
                      border: '4px solid white',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                    }}
                  >
                    {(user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')}
                  </Avatar>
                  <Box
                    className="avatar-overlay"
                    sx={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                      bgcolor: 'rgba(0, 0, 0, 0.4)', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0, transition: 'opacity 0.2s ease',
                      border: '4px solid white',
                      boxSizing: 'border-box'
                    }}
                  >
                    {avatarUploading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      <CameraAlt sx={{ color: 'white', fontSize: '1.8rem' }} />
                    )}
                  </Box>
                </Box>
              </Box>
              <CardContent sx={{ pt: 7 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{user?.firstName} {user?.lastName}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{user?.email}</Typography>
                <Chip label={user?.role} color="secondary" size="small" sx={{ textTransform: 'capitalize', fontWeight: 600, mb: 2 }} />
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ textAlign: 'left', px: 1 }}>
                  {user?.profile?.enrollmentNo && <Typography variant="body2" sx={{ mb: 0.8 }}><strong>Reg No / Roll:</strong> {user.profile.enrollmentNo}</Typography>}
                  {user?.profile?.employeeId && <Typography variant="body2" sx={{ mb: 0.8 }}><strong>Employee ID:</strong> {user.profile.employeeId}</Typography>}
                  {user?.profile?.departmentId && <Typography variant="body2" sx={{ mb: 0.8 }}><strong>Department:</strong> {getDeptName(user.profile.departmentId)}</Typography>}
                  {user?.profile?.stream && <Typography variant="body2" sx={{ mb: 0.8 }}><strong>Stream:</strong> {user.profile.stream}</Typography>}
                  {user?.profile?.section && <Typography variant="body2" sx={{ mb: 0.8 }}><strong>Section:</strong> {user.profile.section}</Typography>}
                  {user?.profile?.phone && <Typography variant="body2" sx={{ mb: 0.8 }}><strong>Phone:</strong> {user.profile.phone}</Typography>}
                  {user?.profile?.dateOfBirth && <Typography variant="body2" sx={{ mb: 0.8 }}><strong>Date of Birth:</strong> {user.profile.dateOfBirth.split('T')[0]}</Typography>}
                  {user?.profile?.guardianName && <Typography variant="body2" sx={{ mb: 0.8 }}><strong>Guardian:</strong> {user.profile.guardianName} ({user.profile.guardianPhone})</Typography>}
                  {user?.profile?.qualification && <Typography variant="body2" sx={{ mb: 0.8 }}><strong>Qualification:</strong> {user.profile.qualification}</Typography>}
                  {user?.profile?.specialization && <Typography variant="body2" sx={{ mb: 0.8 }}><strong>Specialization:</strong> {user.profile.specialization}</Typography>}
                  {user?.profile?.address && <Typography variant="body2" sx={{ mb: 0.8 }}><strong>Address:</strong> {user.profile.address}</Typography>}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Edit Section */}
        <Grid item xs={12} md={8}>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card sx={{ borderRadius: '16px' }}>
              <CardContent>
                <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
                  <Tab label="Edit Profile Details" />
                  <Tab label="Change Password" />
                </Tabs>

                {tab === 0 && (
                  <Box>
                    <Grid container spacing={2.5}>
                      <Grid item xs={6}><TextField fullWidth label="First Name" value={formData.firstName || ''} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} disabled={!editing} /></Grid>
                      <Grid item xs={6}><TextField fullWidth label="Last Name" value={formData.lastName || ''} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} disabled={!editing} /></Grid>
                      <Grid item xs={6}><TextField fullWidth label="Phone" value={formData.profile?.phone || ''} onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, phone: e.target.value } })} disabled={!editing} /></Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Date of Birth"
                          type="date"
                          value={formData.profile?.dateOfBirth ? formData.profile.dateOfBirth.split('T')[0] : ''}
                          onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, dateOfBirth: e.target.value } })}
                          disabled={!editing}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>

                      {user?.role === 'student' && (
                        <>
                          <Grid item xs={6}><TextField fullWidth label="Roll / Reg No" value={formData.profile?.enrollmentNo || ''} onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, enrollmentNo: e.target.value } })} disabled={!editing} /></Grid>
                          <Grid item xs={6}>
                            <FormControl fullWidth disabled={!editing}>
                              <InputLabel id="profile-dept-select-label">Stream Department</InputLabel>
                              <Select
                                labelId="profile-dept-select-label"
                                value={formData.profile?.departmentId || ''}
                                label="Stream Department"
                                onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, departmentId: e.target.value } })}
                              >
                                <MenuItem value=""><em>None</em></MenuItem>
                                {departments.map((dept) => (
                                  <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={6}>
                            <FormControl fullWidth disabled={!editing}>
                              <InputLabel id="profile-stream-select-label">Academic Stream</InputLabel>
                              <Select
                                labelId="profile-stream-select-label"
                                value={formData.profile?.stream || ''}
                                label="Academic Stream"
                                onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, stream: e.target.value } })}
                              >
                                <MenuItem value=""><em>None</em></MenuItem>
                                {STREAMS.map((s) => (
                                  <MenuItem key={s} value={s}>{s}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={6}>
                            <FormControl fullWidth disabled={!editing}>
                              <InputLabel id="profile-section-select-label">Class Section</InputLabel>
                              <Select
                                labelId="profile-section-select-label"
                                value={formData.profile?.section || ''}
                                label="Class Section"
                                onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, section: e.target.value } })}
                              >
                                <MenuItem value=""><em>None</em></MenuItem>
                                <MenuItem value="A">A</MenuItem>
                                <MenuItem value="B">B</MenuItem>
                                <MenuItem value="C">C</MenuItem>
                                <MenuItem value="D">D</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={6}><TextField fullWidth label="Guardian Name" value={formData.profile?.guardianName || ''} onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, guardianName: e.target.value } })} disabled={!editing} /></Grid>
                          <Grid item xs={6}><TextField fullWidth label="Guardian Phone" value={formData.profile?.guardianPhone || ''} onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, guardianPhone: e.target.value } })} disabled={!editing} /></Grid>
                        </>
                      )}

                      {user?.role === 'teacher' && (
                        <>
                          <Grid item xs={6}><TextField fullWidth label="Employee ID" value={formData.profile?.employeeId || ''} onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, employeeId: e.target.value } })} disabled={!editing} /></Grid>
                          <Grid item xs={6}>
                            <FormControl fullWidth disabled={!editing}>
                              <InputLabel id="profile-dept-select-label">Stream Department</InputLabel>
                              <Select
                                labelId="profile-dept-select-label"
                                value={formData.profile?.departmentId || ''}
                                label="Stream Department"
                                onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, departmentId: e.target.value } })}
                              >
                                <MenuItem value=""><em>None</em></MenuItem>
                                {departments.map((dept) => (
                                  <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={6}><TextField fullWidth label="Qualification" value={formData.profile?.qualification || ''} onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, qualification: e.target.value } })} disabled={!editing} /></Grid>
                          <Grid item xs={6}><TextField fullWidth label="Specialization" value={formData.profile?.specialization || ''} onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, specialization: e.target.value } })} disabled={!editing} /></Grid>
                        </>
                      )}

                      <Grid item xs={12}><TextField fullWidth label="Address" multiline rows={2} value={formData.profile?.address || ''} onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, address: e.target.value } })} disabled={!editing} /></Grid>
                    </Grid>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3 }}>
                      {editing ? (
                        <>
                          <Button startIcon={<Cancel />} onClick={() => setEditing(false)} sx={{ borderRadius: '10px' }}>Cancel</Button>
                           <Button variant="contained" startIcon={loading ? <CircularProgress size={18} /> : <Save />} onClick={handleSaveProfile} disabled={loading}
                            sx={{ background: 'linear-gradient(135deg, #1B3F6B, #143052)', borderRadius: '10px' }}>Save</Button>
                        </>
                      ) : (
                        <Button variant="outlined" startIcon={<Edit />} onClick={() => setEditing(true)} sx={{ borderRadius: '10px' }}>Edit Profile</Button>
                      )}
                    </Box>
                  </Box>
                )}

                {tab === 1 && (
                  <form onSubmit={handleChangePassword}>
                    {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }} onClose={() => setError('')}>{error}</Alert>}
                    <TextField fullWidth label="Current Password" type={showPwd ? 'text' : 'password'} value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} required sx={{ mb: 2 }}
                      InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPwd(!showPwd)} size="small">{showPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment> }}
                    />
                    <TextField fullWidth label="New Password" type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} required sx={{ mb: 3 }}
                      helperText="Minimum 6 characters"
                    />
                    <Button type="submit" variant="contained" disabled={loading} sx={{ background: 'linear-gradient(135deg, #1B3F6B, #143052)', borderRadius: '10px' }}>
                      {loading ? 'Changing...' : 'Change Password'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}
