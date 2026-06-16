import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Button,
  TextField,
  LinearProgress,
  Divider,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import { QrCodeScanner, FactCheck, AccessTime, CheckCircle, Warning, CameraAlt } from '@mui/icons-material';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAuth } from '../../contexts/AuthContext';
import { attendanceApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { getAttendanceColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function StudentAttendancePage() {
  const { user, accessToken } = useAuth();
  
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // QR scanner states
  const [scannerActive, setScannerActive] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const scannerRef = useRef(null);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      setAuthHeader(accessToken);
      const [summaryRes, historyRes] = await Promise.all([
        attendanceApi.getSummary(user.id),
        attendanceApi.getStudent(user.id),
      ]);
      setSummary(summaryRes.data.data || {});
      setHistory(historyRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken && user?.id) {
      fetchAttendance();
    }
  }, [accessToken, user?.id]);

  // Handle QR code scanning
  useEffect(() => {
    let html5QrcodeScanner = null;
    if (scannerActive) {
      // Initialize scanner after DOM mounts
      html5QrcodeScanner = new Html5QrcodeScanner(
        "reader-container",
        { fps: 10, qrbox: { width: 200, height: 200 } },
        false
      );

      const onScanSuccess = async (decodedText) => {
        html5QrcodeScanner.clear();
        setScannerActive(false);
        handleMarkQR(decodedText);
      };

      const onScanFailure = (error) => {
        // quiet fail
      };

      html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    }

    return () => {
      if (html5QrcodeScanner) {
        try {
          html5QrcodeScanner.clear();
        } catch (e) {
          // ignore cleanup errors
        }
      }
    };
  }, [scannerActive]);

  const handleMarkQR = async (tokenToUse) => {
    let token = tokenToUse || manualToken;
    if (!token) {
      toast.error('Please enter or scan a valid QR token');
      return;
    }
    token = token.trim().toUpperCase();
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      const res = await attendanceApi.scanQR(token);
      toast.success(res.data.message || 'Attendance marked successfully!');
      setManualToken('');
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark attendance. Token may be invalid or expired.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'present') return 'success';
    if (status === 'absent') return 'error';
    if (status === 'late') return 'warning';
    return 'info';
  };

  const attendancePercent = summary?.percentage || 0;

  return (
    <Box>
      <PageHeader title="My Attendance Records" subtitle="Track your daily attendance percentages and verify course sessions" />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Summary Stats Cards */}
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Overall Attendance"
              value={`${attendancePercent.toFixed(1)}%`}
              icon={<FactCheck />}
              color={getAttendanceColor(attendancePercent)}
              description={`Attended: ${summary?.attended || 0} / Total: ${summary?.totalClasses || 0}`}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Missed Sessions"
              value={summary?.absent || 0}
              icon={<Warning />}
              color="#F44336"
              description="Unexcused absents this academic year"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Late Arrivals"
              value={summary?.late || 0}
              icon={<AccessTime />}
              color="#FF9800"
              description="Late arrivals mapped by subject teacher"
            />
          </Grid>

          {/* Attendance Gauge details */}
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Attendance Threshold Status</Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>SaiBalaji Junior College threshold (75%)</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: getAttendanceColor(attendancePercent) }}>
                      {attendancePercent >= 75 ? 'Satisfactory' : 'Critical Warning'}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={attendancePercent}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: 'action.hover',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getAttendanceColor(attendancePercent),
                        borderRadius: 5,
                      },
                    }}
                  />
                </Box>
                
                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Attendance Guidelines:</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Students must maintain a minimum of <strong>75% attendance</strong> in each subject to be eligible to sit for the final term examination.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* QR Scan card */}
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, alignSelf: 'flex-start' }}>Mark Attendance via QR</Typography>
                
                {scannerActive ? (
                  <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box id="reader-container" sx={{ width: '100%', maxWidth: 250, border: '1px solid', borderColor: 'divider', borderRadius: '12px', overflow: 'hidden', mb: 2 }}></Box>
                    <Button variant="outlined" size="small" color="inherit" onClick={() => setScannerActive(false)} sx={{ borderRadius: '8px' }}>
                      Cancel Camera
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CameraAlt sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                    <Button
                      variant="contained"
                      onClick={() => setScannerActive(true)}
                      sx={{
                        borderRadius: '10px',
                        mb: 3,
                        px: 4,
                        background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
                      }}
                    >
                      Scan QR Code
                    </Button>
                    
                    <Divider sx={{ width: '100%', mb: 3 }}>
                      <Typography variant="caption" color="text.secondary">OR ENTER TOKEN</Typography>
                    </Divider>

                    <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                      <TextField
                        size="small"
                        placeholder="Paste alphanumeric QR token..."
                        value={manualToken}
                        onChange={(e) => setManualToken(e.target.value)}
                        fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />
                      <Button
                        variant="contained"
                        onClick={() => handleMarkQR(null)}
                        disabled={actionLoading || !manualToken}
                        sx={{ borderRadius: '8px', background: 'linear-gradient(135deg, #6C63FF, #3F51B5)' }}
                      >
                        Submit
                      </Button>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Historical list */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 2.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Attendance History Logs</Typography>
                </Box>
                
                <Divider />

                {history.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">No attendance logs logged yet.</Typography>
                  </Box>
                ) : (
                  <Paper sx={{ width: '100%', elevation: 0 }}>
                    <List disablePadding>
                      {history.map((log, index) => (
                        <ListItem key={log.id} divider={index < history.length - 1} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Session: {new Date(log.date).toLocaleDateString()}
                              </Typography>
                            }
                            secondary={`Subject/Course: ${log.subjectId || 'N/A'}`}
                          />
                          <Chip
                            label={log.status}
                            color={getStatusColor(log.status)}
                            size="small"
                            sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
