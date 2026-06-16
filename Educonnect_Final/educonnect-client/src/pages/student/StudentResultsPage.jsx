import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { PictureAsPdf, Assessment, Star, TrendingUp, Book } from '@mui/icons-material';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { resultApi, subjectApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { downloadBlob } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function StudentResultsPage() {
  const { user, accessToken } = useAuth();
  const theme = useTheme();

  const [results, setResults] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);

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

  useEffect(() => {
    if (accessToken && user?.id) {
      fetchData();
    }
  }, [accessToken, user?.id]);

  const handleDownloadPDF = async () => {
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

  // Map results to Recharts chart structure
  const chartData = [...results]
    .reverse() // show in chronological order
    .map((r, i) => ({
      name: r.examId?.title || `Exam ${i + 1}`,
      percentage: Math.round(((r.marksObtained || 0) / (r.maxMarks || 100)) * 100),
    }));

  return (
    <Box>
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
                  <Box sx={{ width: '100%', height: 250 }}>
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
