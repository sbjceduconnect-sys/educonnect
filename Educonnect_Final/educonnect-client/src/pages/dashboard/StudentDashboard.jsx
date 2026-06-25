import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Grid, Card, CardContent, Typography, Box, LinearProgress, Chip, List, ListItem, ListItemText, ListItemIcon, Avatar, Skeleton } from '@mui/material';
import { School, Assessment, FactCheck, Announcement, CalendarMonth, TrendingUp, MenuBook, Lock } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';
import { dashboardApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/helpers';

const CHART_COLORS = ['#1B3F6B', '#F07830', '#4CAF50', '#FF9800', '#F44336'];

export default function StudentDashboard() {
  const { accessToken, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartWidth, setChartWidth] = useState(300);

  useEffect(() => {
    setChartWidth(Math.min(window.innerWidth - 64, 800));
  }, []);

  const isLocked = user?.role === 'student' && !user?.feesPaid;

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setAuthHeader(accessToken);
        const res = await dashboardApi.student();
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
        <PageHeader title="Dashboard" subtitle="Loading your personalized dashboard..." />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={12} sm={6} md={3} key={i}><Skeleton variant="rounded" height={130} sx={{ borderRadius: '16px' }} /></Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const attendanceData = [
    { name: 'Attended', value: data?.attendance?.attended || 0 },
    { name: 'Missed', value: (data?.attendance?.totalClasses || 0) - (data?.attendance?.attended || 0) },
  ];

  const performanceData = data?.recentResults?.map((r, i) => ({
    name: `Sub ${i + 1}`,
    percentage: r.percentage || 0,
  })) || [];

  return (
    <Box>
      <PageHeader title="Student Dashboard" subtitle="Your academic overview at a glance" />

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Enrolled Courses" value={data?.enrolledCourses || 0} icon={<School />} color="purple" delay={0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Attendance" value={`${data?.attendance?.percentage || 0}%`} subtitle={`${data?.attendance?.attended || 0}/${data?.attendance?.totalClasses || 0} classes`} icon={<FactCheck />} color={data?.attendance?.percentage >= 75 ? 'green' : 'red'} delay={0.1} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Overall Grade" value={isLocked ? 'Locked' : (data?.performance?.overallGrade || 'N/A')} subtitle={isLocked ? 'Clear fees to view' : `${data?.performance?.averagePercentage || 0}% average`} icon={<Assessment />} color="blue" delay={0.2} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Subjects Passed" value={isLocked ? 'Locked' : `${data?.performance?.passed || 0}/${data?.performance?.totalSubjects || 0}`} subtitle={isLocked ? 'Clear fees to view' : ''} icon={<TrendingUp />} color="green" delay={0.3} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Attendance Pie */}
        <Grid item xs={12} md={4}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card sx={{ borderRadius: '16px', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Attendance Overview</Typography>
                {data?.attendance?.totalClasses > 0 ? (
                  <>
                    <Box sx={{ height: 200, width: '100%', overflow: 'hidden' }}>
                      {Capacitor.isNativePlatform() ? (
                        <PieChart width={Math.min(chartWidth, 320)} height={200}>
                          <Pie data={attendanceData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value">
                            {attendanceData.map((entry, i) => (
                              <Cell key={i} fill={i === 0 ? '#4CAF50' : '#F44336'} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={attendanceData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value">
                              {attendanceData.map((entry, i) => (
                                <Cell key={i} fill={i === 0 ? '#4CAF50' : '#F44336'} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#4CAF50' }} />
                        <Typography variant="caption">Present</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#F44336' }} />
                        <Typography variant="caption">Absent</Typography>
                      </Box>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ height: 236, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No attendance recorded yet</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Performance Chart */}
        <Grid item xs={12} md={8}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card sx={{ borderRadius: '16px', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Recent Results</Typography>
                {isLocked ? (
                  <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                    <Lock sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Grades & Trends Locked</Typography>
                    <Typography variant="caption" color="text.secondary">Please clear outstanding fee dues to access your results.</Typography>
                  </Box>
                ) : performanceData.length > 0 ? (
                  <Box sx={{ height: 240, width: '100%', overflow: 'hidden' }}>
                    {Capacitor.isNativePlatform() ? (
                      <AreaChart width={chartWidth} height={240} data={performanceData}>
                        <defs>
                          <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1B3F6B" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#1B3F6B" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="percentage" stroke="#1B3F6B" strokeWidth={2} fill="url(#colorPercentage)" />
                      </AreaChart>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={performanceData}>
                          <defs>
                            <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1B3F6B" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#1B3F6B" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Area type="monotone" dataKey="percentage" stroke="#1B3F6B" strokeWidth={2} fill="url(#colorPercentage)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <Typography color="text.secondary">No results available yet</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Courses */}
        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card sx={{ borderRadius: '16px' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>My Courses</Typography>
                {data?.courses?.length > 0 ? (
                  <List disablePadding>
                    {data.courses.map((course, i) => (
                      <ListItem key={course.id || i} sx={{ px: 0, py: 1 }}>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: CHART_COLORS[i % CHART_COLORS.length], width: 36, height: 36, borderRadius: '10px' }}>
                            <MenuBook fontSize="small" />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{course.title || course.courseCode}</Typography>}
                          secondary={course.courseCode}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No courses enrolled</Typography>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Announcements */}
        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card sx={{ borderRadius: '16px' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Recent Announcements</Typography>
                {data?.announcements?.length > 0 ? (
                  <List disablePadding>
                    {data.announcements.map((ann, i) => (
                      <ListItem key={ann.id || i} sx={{ px: 0, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'rgba(27, 63, 107, 0.1)', color: '#1B3F6B', width: 36, height: 36, borderRadius: '10px' }}>
                            <Announcement fontSize="small" />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{ann.title}</Typography>}
                          secondary={formatDate(ann.createdAt)}
                        />
                        {ann.priority === 'high' && <Chip label="High" size="small" color="error" />}
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No announcements</Typography>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}
