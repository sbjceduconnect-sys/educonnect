import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tabs,
  Tab,
  Divider,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  IconButton,
} from '@mui/material';
import { CheckCircle, QrCode, People, Timer, Refresh, History, Delete } from '@mui/icons-material';
import { QRCode } from 'react-qr-code';
import { useAuth } from '../../contexts/AuthContext';
import { courseApi, attendanceApi, subjectApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import PermissionRationaleDialog from '../../components/common/PermissionRationaleDialog';
import { useAppPermissions } from '../../hooks/useAppPermissions';
import toast from 'react-hot-toast';

export default function AttendanceMarkerPage() {
  const { user, accessToken } = useAuth();
  const { requestCameraPermission, isNative } = useAppPermissions();

  const [activeTab, setActiveTab] = useState(0);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  
  // Subject states
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  // Manual attendance states
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setRecords] = useState({}); // studentId: status

  // QR code states
  const [qrDuration, setQrDuration] = useState(10); // in minutes
  const [qrToken, setQrToken] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [qrTimer, setQrTimer] = useState(0);

  // Past attendance records states
  const [pastRecords, setPastRecords] = useState([]);
  const [pastLoading, setPastLoading] = useState(false);

  // Camera permission rationale dialog state
  // The dialog is shown once before the native OS permission prompt fires.
  const [cameraRationaleOpen, setCameraRationaleOpen] = useState(false);
  // Pending action to run after permission is confirmed
  const [pendingQrAction, setPendingQrAction] = useState(null);

  // Fetch teacher's courses and subjects
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setAuthHeader(accessToken);
        const [courseRes, subjectRes] = await Promise.all([
          courseApi.list({ teacherId: user.id }),
          subjectApi.list({ teacherId: user.id }),
        ]);
        setCourses(courseRes.data.data || []);
        setSubjects(subjectRes.data.data || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load courses or subjects');
      }
    };
    if (accessToken && user?.id) {
      fetchInitialData();
    }
  }, [accessToken, user?.id]);

  // Fetch students when course changes
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedCourseId) {
        setStudents([]);
        return;
      }
      setStudentsLoading(true);
      try {
        setAuthHeader(accessToken);
        const res = await courseApi.getStudents(selectedCourseId);
        const studentList = res.data.data || [];
        setStudents(studentList);
        
        // Initialize records to 'present'
        const initial = {};
        studentList.forEach((s) => {
          initial[s.id] = 'present';
        });
        setRecords(initial);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load enrolled students');
      } finally {
        setStudentsLoading(false);
      }
    };
    fetchStudents();
  }, [selectedCourseId, accessToken]);

  // QR timer countdown
  useEffect(() => {
    let interval = null;
    if (qrTimer > 0) {
      interval = setInterval(() => {
        setQrTimer((prev) => prev - 1);
      }, 1000);
    } else if (qrTimer === 0 && qrToken) {
      setQrToken('');
      toast.error('QR Code expired');
    }
    return () => clearInterval(interval);
  }, [qrTimer, qrToken]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const filteredSubjects = subjects.filter((s) => s.departmentId === selectedCourse?.departmentId);

  // Auto-select subject if there's only one matching
  useEffect(() => {
    if (filteredSubjects.length === 1) {
      setSelectedSubjectId(filteredSubjects[0].id);
    } else {
      setSelectedSubjectId('');
    }
  }, [selectedCourseId]);

  const handleStatusChange = (studentId, status) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setRecords(updated);
  };

  // Submit manual attendance
  const handleSubmitManual = async () => {
    if (!selectedCourseId) {
      toast.error('Please select a course');
      return;
    }
    if (!selectedSubjectId) {
      toast.error('Please select a subject');
      return;
    }
    const recordsArray = Object.keys(attendanceRecords).map((studentId) => ({
      studentId,
      status: attendanceRecords[studentId],
    }));

    try {
      setAuthHeader(accessToken);
      await attendanceApi.mark({
        courseId: selectedCourseId,
        subjectId: selectedSubjectId,
        date: attendanceDate,
        records: recordsArray,
      });

      toast.success('Attendance records saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit attendance');
    }
  };

  // ── Internal: actually generate QR after permission is confirmed ───────────
  const _doGenerateQR = async () => {
    setQrLoading(true);
    try {
      setAuthHeader(accessToken);
      const res = await attendanceApi.generateQR({
        courseId: selectedCourseId,
        subjectId: selectedSubjectId,
        durationMinutes: qrDuration,
      });
      setQrToken(res.data.data.qrToken);
      setQrTimer(qrDuration * 60);
      toast.success('QR Code generated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate QR Code');
    } finally {
      setQrLoading(false);
    }
  };

  /**
   * Generate QR Code — entry point.
   *
   * On native platforms: shows a rationale dialog first, then requests the
   * CAMERA permission via @capacitor/camera before generating the QR token.
   * On web: generates directly (browser handles camera via WebRTC if needed).
   *
   * Principle of Least Privilege: Camera permission is ONLY requested here,
   * not on app mount or in any other context.
   */
  const handleGenerateQR = async () => {
    if (!selectedCourseId) {
      toast.error('Please select a course');
      return;
    }
    if (!selectedSubjectId) {
      toast.error('Please select a subject');
      return;
    }

    if (isNative) {
      // Show rationale dialog before firing the native OS prompt
      setPendingQrAction(() => _doGenerateQR);
      setCameraRationaleOpen(true);
    } else {
      // On web, generate directly
      await _doGenerateQR();
    }
  };

  /**
   * Called when user confirms the camera rationale dialog.
   * Requests the native camera permission, then proceeds with QR generation
   * or shows a guidance toast if the user denies.
   */
  const handleCameraRationaleConfirm = async () => {
    setCameraRationaleOpen(false);
    setTimeout(async () => {
      const granted = await requestCameraPermission();
      if (granted) {
        if (pendingQrAction) {
          await pendingQrAction();
          setPendingQrAction(null);
        }
      } else {
        toast.error(
          'Camera permission denied. Please enable it in Device Settings → Apps → EduConnect → Permissions.',
          { duration: 5000 }
        );
      }
    }, 200);
  };

  const fetchPastRecords = async () => {
    if (!selectedSubjectId) return;
    setPastLoading(true);
    try {
      setAuthHeader(accessToken);
      const res = await attendanceApi.getBySubject(selectedSubjectId);
      setPastRecords(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load past attendance logs');
    } finally {
      setPastLoading(false);
    }
  };

  const handleDeleteAttendance = async (id) => {
    if (!window.confirm('Are you sure you want to delete this attendance session? This will remove all student attendance records for this session.')) {
      return;
    }
    try {
      setAuthHeader(accessToken);
      await attendanceApi.delete(id);
      toast.success('Attendance record deleted successfully');
      fetchPastRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete attendance record');
    }
  };

  useEffect(() => {
    if (activeTab === 2 && selectedSubjectId) {
      fetchPastRecords();
    }
  }, [activeTab, selectedSubjectId]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box>
      <PageHeader title="Attendance Marker" subtitle="Mark class attendance manually or generate dynamic student-scan QR codes" />

      {/* Camera Permission Rationale Dialog — shown before native OS prompt */}
      <PermissionRationaleDialog
        open={cameraRationaleOpen}
        permissionType="camera"
        onConfirm={handleCameraRationaleConfirm}
        onDismiss={() => {
          setCameraRationaleOpen(false);
          setPendingQrAction(null);
        }}
      />

      {/* Course & Subject Selector */}
      <Card sx={{ borderRadius: '16px', mb: 4, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="attendance-course-label">Select Course / Class</InputLabel>
                <Select
                  labelId="attendance-course-label"
                  value={selectedCourseId}
                  label="Select Course / Class"
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  sx={{ borderRadius: '10px' }}
                >
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.title} ({course.courseCode})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth disabled={!selectedCourseId}>
                <InputLabel id="attendance-subject-label">Select Subject</InputLabel>
                <Select
                  labelId="attendance-subject-label"
                  value={selectedSubjectId}
                  label="Select Subject"
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  sx={{ borderRadius: '10px' }}
                >
                  {filteredSubjects.map((sub) => (
                    <MenuItem key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </MenuItem>
                  ))}
                  {selectedCourseId && filteredSubjects.length === 0 && (
                    <MenuItem value="" disabled>No subjects mapped for this class</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Attendance Date"
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, val) => setActiveTab(val)}
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTabs-indicator': {
            background: 'linear-gradient(90deg, #6C63FF, #3F51B5)',
          },
        }}
      >
        <Tab icon={<People sx={{ mr: 1 }} />} label="Manual Marking" iconPosition="start" sx={{ textTransform: 'none', fontWeight: 600 }} />
        <Tab icon={<QrCode sx={{ mr: 1 }} />} label="QR Code Attendance" iconPosition="start" sx={{ textTransform: 'none', fontWeight: 600 }} />
        <Tab icon={<History sx={{ mr: 1 }} />} label="Attendance Logs" iconPosition="start" sx={{ textTransform: 'none', fontWeight: 600 }} />
      </Tabs>

      {/* Tab Contents */}
      {activeTab === 0 ? (
        <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Enrolled Student List</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="outlined" onClick={() => handleMarkAll('present')} color="success" sx={{ borderRadius: '8px', textTransform: 'none' }}>
                  Mark All Present
                </Button>
                <Button size="small" variant="outlined" onClick={() => handleMarkAll('absent')} color="error" sx={{ borderRadius: '8px', textTransform: 'none' }}>
                  Mark All Absent
                </Button>
              </Box>
            </Box>
            
            <Divider />

            {studentsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
              </Box>
            ) : students.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No students enrolled or no course selected.</Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Roll / Reg No</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Status Selection</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id} hover>
                        <TableCell>{student.profile?.enrollmentNo || 'N/A'}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', background: 'linear-gradient(135deg, #6C63FF, #3F51B5)' }}>
                              {(student.firstName?.[0] || '') + (student.lastName?.[0] || '')}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {student.firstName} {student.lastName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <RadioGroup
                            row
                            value={attendanceRecords[student.id] || 'present'}
                            onChange={(e) => handleStatusChange(student.id, e.target.value)}
                            sx={{ justifyContent: 'center', gap: 1 }}
                          >
                            <FormControlLabel value="present" control={<Radio color="success" />} label="Present" />
                            <FormControlLabel value="absent" control={<Radio color="error" />} label="Absent" />
                            <FormControlLabel value="late" control={<Radio color="warning" />} label="Late" />
                            <FormControlLabel value="excused" control={<Radio color="info" />} label="Excused" />
                          </RadioGroup>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Divider />

            <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleSubmitManual}
                disabled={students.length === 0}
                startIcon={<CheckCircle />}
                sx={{
                  borderRadius: '10px',
                  px: 4,
                  py: 1.2,
                  background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
                }}
              >
                Submit Attendance
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : activeTab === 1 ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>QR Code Configuration</Typography>
                
                <Grid container spacing={3.5}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel id="qr-duration-label">QR Validity Duration</InputLabel>
                      <Select
                        labelId="qr-duration-label"
                        value={qrDuration}
                        label="QR Validity Duration"
                        onChange={(e) => setQrDuration(e.target.value)}
                        sx={{ borderRadius: '10px' }}
                      >
                        <MenuItem value={1}>1 Minute</MenuItem>
                        <MenuItem value={5}>5 Minutes</MenuItem>
                        <MenuItem value={10}>10 Minutes</MenuItem>
                        <MenuItem value={15}>15 Minutes</MenuItem>
                        <MenuItem value={30}>30 Minutes</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={handleGenerateQR}
                      fullWidth
                      disabled={qrLoading || !selectedCourseId}
                      startIcon={qrLoading ? <CircularProgress size={16} color="inherit" /> : <QrCode />}
                      sx={{
                        borderRadius: '10px',
                        py: 1.5,
                        background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
                      }}
                    >
                      Generate QR Code
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CardContent sx={{ p: 4, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                {qrToken ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <Box sx={{ p: 3, bgcolor: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                      <QRCode value={qrToken} size={200} />
                    </Box>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: 'error.main', mb: 1 }}>
                        <Timer />
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                          {formatTimer(qrTimer)}
                        </Typography>
                      </Box>
                      <Box sx={{ bgcolor: 'action.hover', px: 3, py: 1.5, borderRadius: '12px', mb: 2, border: '1px dashed', borderColor: 'primary.light' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>
                          Manual Entry Token
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', letterSpacing: 4, fontFamily: 'monospace' }}>
                          {qrToken}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Students should scan this QR code or manually enter the 6-character token to mark attendance.
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Refresh />}
                      onClick={handleGenerateQR}
                      sx={{ borderRadius: '8px' }}
                    >
                      Regenerate QR
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ color: 'text.secondary' }}>
                    <QrCode sx={{ fontSize: 80, color: 'action.disabled', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>No Active QR Code</Typography>
                    <Typography variant="body2" sx={{ maxWidth: 320, mt: 1 }}>
                      Configure the settings and generate a QR Code to display on-screen for class scanning.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Attendance History Logs</Typography>
              <Button size="small" startIcon={<Refresh />} onClick={fetchPastRecords} sx={{ borderRadius: '8px' }}>
                Refresh
              </Button>
            </Box>
            
            <Divider />

            {pastLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
              </Box>
            ) : !selectedSubjectId ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">Please select a course and subject first.</Typography>
              </Box>
            ) : pastRecords.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No past attendance records found for this subject.</Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Students Marked</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pastRecords.map((record) => {
                      const presentCount = record.records?.filter(r => r.status === 'present' || r.status === 'late').length || 0;
                      const totalCount = record.records?.length || 0;
                      return (
                        <TableRow key={record.id} hover>
                          <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                          <TableCell sx={{ textTransform: 'capitalize' }}>
                            <Chip 
                              label={record.method || 'manual'} 
                              size="small" 
                              color={record.method === 'qr' ? 'secondary' : 'default'} 
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {presentCount} Present / {totalCount} Total
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton 
                              color="error" 
                              onClick={() => handleDeleteAttendance(record.id)} 
                              size="small"
                              title="Delete Session"
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
