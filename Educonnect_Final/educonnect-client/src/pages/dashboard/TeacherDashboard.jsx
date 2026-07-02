import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { Grid, Card, CardContent, Typography, Box, List, ListItem, ListItemText, ListItemIcon, Avatar, Skeleton } from '@mui/material';
import { School, People, Announcement, EventNote, QrCode2, HistoryEdu } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';
import { dashboardApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/helpers';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartWidth, setChartWidth] = useState(300);

  useEffect(() => {
    setChartWidth(Math.min(window.innerWidth - 64, 800));
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setAuthHeader(accessToken);
        const res = await dashboardApi.teacher();
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
        <PageHeader title="Dashboard" subtitle="Loading..." />
        <Grid container spacing={3}>
          {[1, 2, 3].map(i => <Grid item xs={12} sm={4} key={i}><Skeleton variant="rounded" height={130} sx={{ borderRadius: '16px' }} /></Grid>)}
        </Grid>
      </Box>
    );
  }

  const courseData = data?.courses?.map(c => ({
    name: c.courseCode || c.title?.substring(0, 10),
    students: c.enrolledStudentIds?.length || 0,
  })) || [];

  return (
    <Box>
      <PageHeader title="Teacher Dashboard" subtitle="Manage your courses and students" />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}><StatCard title="My Subjects" value={data?.totalCourses || 0} icon={<School />} color="purple" delay={0} /></Grid>
        <Grid item xs={12} sm={4}><StatCard title="Total Students" value={data?.totalStudents || 0} icon={<People />} color="blue" delay={0.1} /></Grid>
        <Grid item xs={12} sm={4}><StatCard title="Announcements" value={data?.announcements?.length || 0} icon={<Announcement />} color="orange" delay={0.2} /></Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card sx={{ borderRadius: '16px' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Students per Course</Typography>
                {courseData.length > 0 ? (
                  <Box sx={{ height: 280, width: '100%', overflow: 'hidden' }}>
                    {Capacitor.isNativePlatform() ? (
                      <BarChart width={chartWidth} height={280} data={courseData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="students" fill="#1B3F6B" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={courseData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="students" fill="#1B3F6B" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ py: 6, textAlign: 'center' }}><Typography color="text.secondary">No courses yet</Typography></Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={4}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card sx={{ borderRadius: '16px', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Quick Actions</Typography>
                <List disablePadding>
                  {[
                    { icon: <QrCode2 />, text: 'Generate QR Attendance', color: '#4CAF50', path: '/attendance' },
                    { icon: <HistoryEdu />, text: 'Create Lesson Plan', color: '#FF9800', path: '/lesson-plans' },
                    { icon: <Announcement />, text: 'Post Announcement', color: '#2196F3', path: '/announcements' },
                    { icon: <EventNote />, text: 'View Schedule', color: '#1B3F6B', path: '/timetable' },
                  ].map((action, i) => (
                    <ListItem key={i} onClick={() => navigate(action.path)} sx={{ px: 0, py: 1, cursor: 'pointer', borderRadius: '10px', '&:hover': { bgcolor: 'action.hover' } }}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: `${action.color}15`, color: action.color, width: 36, height: 36, borderRadius: '10px' }}>
                          {action.icon}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText primary={<Typography variant="body2" sx={{ fontWeight: 500 }}>{action.text}</Typography>} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}
