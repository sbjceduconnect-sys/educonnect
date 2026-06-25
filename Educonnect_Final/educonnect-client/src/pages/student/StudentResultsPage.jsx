import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Button,
  Divider,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  Alert,
} from '@mui/material';
import { PictureAsPdf, Assessment, Star, TrendingUp, Book, Lock } from '@mui/icons-material';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { resultApi, subjectApi, userApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import PermissionRationaleDialog from '../../components/common/PermissionRationaleDialog';
import { useAppPermissions } from '../../hooks/useAppPermissions';
import { downloadBlob } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function StudentResultsPage() {
  const { user, setUser, accessToken } = useAuth();
  const theme = useTheme();
  const { requestStoragePermission, isNative } = useAppPermissions();

  const [results, setResults] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [chartWidth, setChartWidth] = useState(300);

  // Storage permission rationale state for PDF download
  const [storageRationaleOpen, setStorageRationaleOpen] = useState(false);

  useEffect(() => {
    setChartWidth(Math.min(window.innerWidth - 64, 800));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      setAuthHeader(accessToken);
      const [resultRes, subjectRes] = await Promise.all([
        resultApi.getByStudent(user.id),
        subjectApi.list(),
      ]);
      setResults(resultRes.data.data || []);
      setSubjects(subjectRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load results registry');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    try {
      setAuthHeader(accessToken);
      const res = await userApi.getMe();
      if (res.data.success) {
        const updatedUser = res.data.data;
        setUser(updatedUser);
        sessionStorage.setItem('edu_user', JSON.stringify(updatedUser));
        
        if (updatedUser.feesPaid) {
          toast.success('Your results have been unlocked!');
        } else {
          toast.error('Outstanding fees still pending. Please contact the administrator.', { icon: '🔒' });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to check payment status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken && user?.id) {
      if (user?.feesPaid) {
        fetchData();
      } else {
        setLoading(false);
      }
    }
  }, [accessToken, user?.id, user?.feesPaid]);

  /**
   * Download PDF progress report.
   * On native: shows storage rationale dialog first, then downloads.
   * On web: downloads directly.
   */
  const _doDownloadPDF = async () => {
    setDownloadLoading(true);
    try {
      setAuthHeader(accessToken);
      const res = await resultApi.getProgressReport(user.id);
      downloadBlob(res.data, `${user.firstName}_progress_report.pdf`);
      toast.success('Report card downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate progress report PDF');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (isNative) {
      setStorageRationaleOpen(true);
    } else {
      await _doDownloadPDF();
    }
  };

  const handleStorageRationaleConfirm = async () => {
    setStorageRationaleOpen(false);
    setTimeout(async () => {
      const granted = await requestStoragePermission();
      if (granted) {
        await _doDownloadPDF();
      } else {
        toast.error(
          'Storage permission denied. Enable it in Device Settings → Apps → EduConnect → Permissions.',
          { duration: 5000 }
        );
      }
    }, 200);
  };

  const getSubjectName = (subjId) => {
    const s = subjects.find((subj) => subj.id === subjId);
    return s ? s.name : 'Unknown Subject';
  };

  // Calculate Overall GPA / Grade Info
  const getOverallStats = () => {
    if (results.length === 0) return { avgPercentage: 0, gpa: '0.00', passed: 0 };
    
    let totalObtained = 0;
    let totalMax = 0;
    let passed = 0;

    results.forEach((r) => {
      totalObtained += r.marksObtained || 0;
      totalMax += r.maxMarks || 100;
      if (r.grade !== 'F') passed++;
    });

    const avgPercentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    // Map percentage to standard GPA scale (e.g. 10.0 scale)
    const gpa = ((avgPercentage / 100) * 10).toFixed(2);

    return { avgPercentage, gpa, passed };
  };

  const stats = getOverallStats();

  if (!loading && !user?.feesPaid) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Card sx={{ maxWidth: 500, width: '100%', borderRadius: '24px', textAlign: 'center', p: 4, boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid', borderColor: 'divider', background: theme.palette.mode === 'dark' ? 'rgba(30, 50, 80, 0.4)' : '#fff' }}>
          <Box sx={{ display: 'inline-flex', p: 2.5, borderRadius: '50%', bgcolor: 'rgba(244, 67, 54, 0.1)', color: 'error.main', mb: 3 }}>
            <Lock sx={{ fontSize: 50 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Results Locked</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your academic progress report, grade registry, and performance analysis have been locked by the administration due to pending fee payments.
          </Typography>
          <Alert severity="warning" variant="outlined" sx={{ borderRadius: '12px', mb: 3, textAlign: 'left' }}>
            To unlock your results, please clear any outstanding dues and contact the college administration desk. Once approved, your reports will be instantly accessible.
          </Alert>
          <Button variant="contained" color="primary" onClick={handleCheckStatus} sx={{ borderRadius: '12px', textTransform: 'none', px: 4, py: 1.2, fontWeight: 600 }}>
            Check Status Again
          </Button>
        </Card>
      </Box>
    );
  }

  // Map results to Recharts chart structure
  const chartData = [...results]
    .reverse() // show in chronological order
    .map((r, i) => ({
      name: r.examId?.title || `Exam ${i + 1}`,
      percentage: Math.round(((r.marksObtained || 0) / (r.maxMarks || 100)) * 100),
    }));

  return (
    <Box>
      {/* Storage Rationale Dialog for PDF download — shown before native OS prompt */}
      <PermissionRationaleDialog
        open={storageRationaleOpen}
        permissionType="storage"
        onConfirm={handleStorageRationaleConfirm}
        onDismiss={() => setStorageRationaleOpen(false)}
      />

      <PageHeader
        title="My Grades & Performance"
        subtitle="Review your class examination results, GPA indices, and download official report cards"
        action={results.length > 0 ? handleDownloadPDF : null}
        actionLabel="Download Progress Report PDF"
        actionIcon={<PictureAsPdf />}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Key Indicators */}
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Average Percentage"
              value={`${stats.avgPercentage.toFixed(1)}%`}
              icon={<TrendingUp />}
              color="#6C63FF"
              description={`Pass rate: ${stats.passed} / ${results.length} exams`}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Academic GPA"
              value={`${stats.gpa} / 10.0`}
              icon={<Star />}
              color="#FF9800"
              description="Calculated based on overall exam marks"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Passed Exams"
              value={stats.passed}
              icon={<Assessment />}
              color="#4CAF50"
              description="Exams cleared with passing grade"
            />
          </Grid>

          {/* Performance Area Chart */}
          {chartData.length > 0 && (
            <Grid item xs={12}>
              <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Exam-Wise Performance Trend</Typography>
                  <Box sx={{ width: '100%', height: 250, overflow: 'hidden' }}>
                    {Capacitor.isNativePlatform() ? (
                      <AreaChart width={chartWidth} height={250} data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPercent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#6C63FF" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                        <XAxis dataKey="name" stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                        <YAxis stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} domain={[0, 100]} />
                        <Tooltip />
                        <Area type="monotone" dataKey="percentage" stroke="#6C63FF" strokeWidth={3} fillOpacity={1} fill="url(#colorPercent)" />
                      </AreaChart>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorPercent" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#6C63FF" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                          <XAxis dataKey="name" stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                          <YAxis stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} domain={[0, 100]} />
                          <Tooltip />
                          <Area type="monotone" dataKey="percentage" stroke="#6C63FF" strokeWidth={3} fillOpacity={1} fill="url(#colorPercent)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Table list */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 2.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Detailed Grades Registry</Typography>
                </Box>
                
                <Divider />

                {results.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">No grades published for your account yet.</Typography>
                  </Box>
                ) : (
                  <TableContainer component={Paper} elevation={0} sx={{ overflowX: 'auto' }}>
                    <Table>
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Exam Title</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Marks Obtained</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Grade</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.map((res) => (
                          <TableRow key={res.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{res.examId?.title || 'General'}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Book fontSize="small" color="action" />
                                <Typography variant="body2">{getSubjectName(res.subjectId)}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{res.marksObtained} / {res.maxMarks}</TableCell>
                            <TableCell>
                              <Chip
                                label={res.grade}
                                color={res.grade === 'F' ? 'error' : 'primary'}
                                size="small"
                                sx={{ fontWeight: 700, minWidth: 40 }}
                              />
                            </TableCell>
                            <TableCell color="text.secondary">{res.remarks}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
