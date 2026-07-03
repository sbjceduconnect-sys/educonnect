import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Skeleton,
  Chip,
  LinearProgress,
  Button,
  Paper
} from '@mui/material';
import {
  School,
  People,
  Announcement,
  EventNote,
  QrCode2,
  HistoryEdu,
  Book,
  Class,
  ArrowForward
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';
import { dashboardApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import { useAuth } from '../../contexts/AuthContext';

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
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={130} sx={{ borderRadius: '16px' }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const courseData = data?.courses?.map(c => ({
    id: c.id,
    title: c.title,
    name: c.courseCode || c.title?.substring(0, 10),
    students: c.enrolledStudentIds?.length || 0,
  })) || [];

  return (
    <Box>
      <PageHeader title="Teacher Dashboard" subtitle="Manage your courses and students" />

      {/* 4 Top Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Assigned Courses" value={data?.totalCourses ?? 0} icon={<Class />} color="purple" delay={0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Assigned Subjects" value={data?.totalSubjects ?? 0} icon={<Book />} color="indigo" delay={0.1} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Students" value={data?.totalStudents ?? 0} icon={<People />} color="blue" delay={0.2} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Announcements" value={data?.announcements?.length ?? 0} icon={<Announcement />} color="orange" delay={0.3} />
        </Grid>
      </Grid>

      {/* Course Showbar Section */}
      <Card sx={{ borderRadius: '16px', mb: 4, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Assigned Courses Showbar</Typography>
              <Typography variant="body2" color="text.secondary">Active courses assigned to your profile</Typography>
            </Box>
            <Button
              size="small"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/courses')}
              sx={{ fontWeight: 700 }}
            >
              View All Courses
            </Button>
          </Box>

          {data?.courses && data.courses.length > 0 ? (
            <Grid container spacing= {2}>
              {data.courses.map((course) => {
                const count = course.enrolledStudentIds?.length || 0;
                return (
                  <Grid item xs={12} sm={6} md={4} key={course.id}>
                    <Paper
                      variant="outlined"
                      onClick={() => navigate('/courses')}
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: '0 4px 12px rgba(108,99,255,0.15)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Chip
                          label={course.courseCode || 'COURSE'}
                          size="small"
                          color="primary"
                          sx={{ fontWeight: 700, borderRadius: '6px' }}
                        />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                          {count} Students
                        </Typography>
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {course.title}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, (count / Math.max(1, data?.totalStudents || 1)) * 100)}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">No courses assigned to your profile yet.</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Main Grid: Chart & Quick Actions */}
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
                        <Bar dataKey="students" fill="#6C63FF" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={courseData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="students" fill="#6C63FF" radius={[6, 6, 0, 0]} />
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
