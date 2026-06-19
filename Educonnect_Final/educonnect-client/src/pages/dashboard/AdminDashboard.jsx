import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { Grid, Card, CardContent, Typography, Box, List, ListItem, ListItemText, ListItemIcon, Avatar, Chip, Button, Skeleton } from '@mui/material';
import { People, School, AdminPanelSettings, Pending, Announcement, Assessment, PersonAdd, CheckCircle } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';
import { dashboardApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, getInitials } from '../../utils/helpers';

export default function AdminDashboard() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartWidth, setChartWidth] = useState(300);

  useEffect(() => {
    setChartWidth(Math.min(window.innerWidth - 64, 600));
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setAuthHeader(accessToken);
        const res = await dashboardApi.admin();
        setData(res.data.data);
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (accessToken) fetchDashboard();
  }, [accessToken]);

  if (loading) {
    return (
      <Box>
        <PageHeader title="Admin Dashboard" subtitle="Loading..." />
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5].map(i => <Grid item xs={12} sm={6} md={i <= 3 ? 4 : 6} key={i}><Skeleton variant="rounded" height={130} sx={{ borderRadius: '16px' }} /></Grid>)}
        </Grid>
      </Box>
    );
  }

  const stats = data?.stats || {};
  const userChart = [
    { name: 'Students', count: stats.totalStudents || 0 },
    { name: 'Teachers', count: stats.totalTeachers || 0 },
    { name: 'Admins', count: stats.totalAdmins || 0 },
  ];

  return (
    <Box>
      <PageHeader title="Admin Dashboard" subtitle="System overview and management" />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}><StatCard title="Total Students" value={stats.totalStudents || 0} icon={<People />} color="blue" delay={0} /></Grid>
        <Grid item xs={12} sm={6} md={2.4}><StatCard title="Total Teachers" value={stats.totalTeachers || 0} icon={<School />} color="green" delay={0.1} /></Grid>
        <Grid item xs={12} sm={6} md={2.4}><StatCard title="Admins" value={stats.totalAdmins || 0} icon={<AdminPanelSettings />} color="purple" delay={0.2} /></Grid>
        <Grid item xs={12} sm={6} md={2.4}><StatCard title="Pending Approvals" value={stats.pendingApprovals || 0} icon={<Pending />} color={stats.pendingApprovals > 0 ? 'red' : 'green'} delay={0.3} /></Grid>
        <Grid item xs={12} sm={6} md={2.4}><StatCard title="Total Courses" value={stats.totalCourses || 0} icon={<Assessment />} color="orange" delay={0.4} /></Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* User Distribution */}
        <Grid item xs={12} md={5}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card sx={{ borderRadius: '16px', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>User Distribution</Typography>
                <Box sx={{ height: 250, width: '100%', overflow: 'hidden' }}>
                  {Capacitor.isNativePlatform() ? (
                    <BarChart width={chartWidth} height={250} data={userChart} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={70} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#6C63FF" radius={[0, 6, 6, 0]} barSize={30} />
                    </BarChart>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={userChart} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={70} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#6C63FF" radius={[0, 6, 6, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Recent Users */}
        <Grid item xs={12} md={7}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card sx={{ borderRadius: '16px' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Recent Users</Typography>
                  <Button size="small" onClick={() => navigate('/users')} sx={{ color: 'secondary.main' }}>View All</Button>
                </Box>
                <List disablePadding>
                  {(data?.recentUsers || []).slice(0, 6).map((user, i) => (
                    <ListItem key={user.id || i} sx={{ px: 0, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <ListItemIcon>
                        <Avatar sx={{ width: 36, height: 36, fontSize: '0.8rem', background: 'linear-gradient(135deg, #6C63FF, #3F51B5)' }}>
                          {getInitials(user.firstName, user.lastName)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{user.firstName} {user.lastName}</Typography>}
                        secondary={user.email}
                      />
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip label={user.role} size="small" variant="outlined" sx={{ textTransform: 'capitalize', borderRadius: '6px' }} />
                        {user.isApproved ? (
                          <CheckCircle sx={{ fontSize: 18, color: '#4CAF50' }} />
                        ) : (
                          <Chip label="Pending" size="small" color="warning" sx={{ borderRadius: '6px' }} />
                        )}
                      </Box>
                    </ListItem>
                  ))}
                </List>
                {stats.pendingApprovals > 0 && (
                  <Button fullWidth variant="outlined" color="warning" onClick={() => navigate('/users?isApproved=false')} sx={{ mt: 2, borderRadius: '10px' }}>
                    {stats.pendingApprovals} Pending Approval{stats.pendingApprovals > 1 ? 's' : ''}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}
