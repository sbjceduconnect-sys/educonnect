import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Avatar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import { FactCheck, Refresh, Visibility, Delete, CheckCircle, Cancel, History, CalendarToday, CompareArrows } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { courseApi, subjectApi, attendanceApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import toast from 'react-hot-toast';

export default function AttendanceReportsPage() {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);

  // Filter states
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Detailed modal state
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  // Daily roster reporting states
  const [rosterCourseId, setRosterCourseId] = useState('');
  const [rosterSubjectId, setRosterSubjectId] = useState('');
  const [rosterDate, setRosterDate] = useState(new Date().toISOString().split('T')[0]);
  const [rosterStudents, setRosterStudents] = useState([]);
  const [rosterRecords, setRosterRecords] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  // Edit requests states
  const [editRequests, setEditRequests] = useState([]);
  const [editRequestsLoading, setEditRequestsLoading] = useState(false);

  const fetchEditRequests = async () => {
    setEditRequestsLoading(true);
    try {
      setAuthHeader(accessToken);
      const res = await attendanceApi.listEditRequests();
      setEditRequests(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load edit requests');
    } finally {
      setEditRequestsLoading(false);
    }
  };

  const handleActionRequest = async (requestId, action) => {
    try {
      setAuthHeader(accessToken);
      await attendanceApi.actionEditRequest(requestId, action);
      toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      fetchEditRequests();
      fetchReports();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update request status.');
    }
  };

  const fetchDailyRoster = async () => {
    if (!rosterCourseId || !rosterSubjectId || !rosterDate) return;
    setRosterLoading(true);
    try {
      setAuthHeader(accessToken);
      const [studentsRes, recordsRes] = await Promise.all([
        courseApi.getStudents(rosterCourseId),
        attendanceApi.list({ courseId: rosterCourseId, subjectId: rosterSubjectId, date: rosterDate })
      ]);
      setRosterStudents(studentsRes.data.data || []);
      setRosterRecords(recordsRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load daily roster');
    } finally {
      setRosterLoading(false);
    }
  };

  useEffect(() => {
    if (rosterCourseId && rosterSubjectId && rosterDate) {
      fetchDailyRoster();
    }
  }, [rosterCourseId, rosterSubjectId, rosterDate]);

  useEffect(() => {
    if (activeTab === 2) {
      fetchEditRequests();
    }
  }, [activeTab]);

  const rosterCourse = courses.find((c) => c.id === rosterCourseId);
  const filteredRosterSubjects = rosterCourse
    ? subjects.filter((s) => s.departmentId === rosterCourse.departmentId)
    : subjects;

  useEffect(() => {
    if (filteredRosterSubjects.length === 1) {
      setRosterSubjectId(filteredRosterSubjects[0].id);
    } else {
      setRosterSubjectId('');
    }
  }, [rosterCourseId]);

  // Load filter options (Courses and Subjects)
  useEffect(() => {
    const loadFilters = async () => {
      try {
        setAuthHeader(accessToken);
        const [courseRes, subjectRes] = await Promise.all([
          courseApi.list(),
          subjectApi.list(),
        ]);
        setCourses(courseRes.data.data || []);
        setSubjects(subjectRes.data.data || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load filters');
      }
    };
    if (accessToken) {
      loadFilters();
    }
  }, [accessToken]);

  // Load reports based on filters
  const fetchReports = async () => {
    setLoading(true);
    try {
      setAuthHeader(accessToken);
      
      const params = {};
      if (selectedCourseId) {
        const course = courses.find(c => c.id === selectedCourseId);
        if (course?.departmentId) {
          params.departmentId = course.departmentId;
        }
      }
      if (selectedSubjectId) {
        params.subjectId = selectedSubjectId;
      }
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await attendanceApi.getReports(params);
      setReports(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load attendance reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken && courses.length > 0) {
      fetchReports();
    }
  }, [accessToken, selectedCourseId, selectedSubjectId, startDate, endDate, courses]);

  const handleOpenDetail = (session) => {
    setSelectedSession(session);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedSession(null);
  };

  const handleDeleteAttendance = async (id) => {
    if (!window.confirm('Are you sure you want to delete this attendance session? This will remove all student attendance records for this session.')) {
      return;
    }
    try {
      setAuthHeader(accessToken);
      await attendanceApi.delete(id);
      toast.success('Attendance record deleted successfully');
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete attendance record');
    }
  };

  // Filter subjects based on selected course department
  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const filteredSubjects = selectedCourse
    ? subjects.filter((s) => s.departmentId === selectedCourse.departmentId)
    : subjects;

  const getStatusColor = (status) => {
    if (status === 'present') return 'success';
    if (status === 'absent') return 'error';
    if (status === 'late') return 'warning';
    return 'info';
  };

  const columns = [
    {
      field: 'date',
      headerName: 'Date',
      flex: 1,
      valueGetter: ({ row }) => new Date(row.date).toLocaleDateString('en-GB'),
    },
    { field: 'courseTitle', headerName: 'Class / Course', flex: 1.2 },
    { field: 'subjectName', headerName: 'Subject', flex: 1.2 },
    { field: 'markedByName', headerName: 'Marked By', flex: 1.2 },
    {
      field: 'rate',
      headerName: 'Attendance Rate',
      flex: 1,
      renderCell: ({ row }) => {
        const rate = row.totalCount > 0 ? (row.presentCount / row.totalCount) * 100 : 0;
        let color = 'error';
        if (rate >= 75) color = 'success';
        else if (rate >= 50) color = 'warning';
        return (
          <Chip
            label={`${rate.toFixed(1)}% (${row.presentCount}/${row.totalCount})`}
            color={color}
            variant="outlined"
            size="small"
            sx={{ fontWeight: 700 }}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.8,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton color="primary" onClick={() => handleOpenDetail(row)} size="small" title="View Student Checklist">
            <Visibility />
          </IconButton>
          <IconButton color="error" onClick={() => handleDeleteAttendance(row.id)} size="small" title="Delete Session">
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Attendance Reports"
        subtitle="Inspect class attendance records and rates across all departments"
        action={activeTab === 0 ? fetchReports : (activeTab === 2 ? fetchEditRequests : fetchDailyRoster)}
        actionLabel="Refresh Data"
        actionIcon={<Refresh />}
        actionVariant="contained"
      />

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
        <Tab icon={<History sx={{ mr: 1 }} />} label="Session Reports" iconPosition="start" sx={{ textTransform: 'none', fontWeight: 600 }} />
        <Tab icon={<CalendarToday sx={{ mr: 1 }} />} label="Daily Roster View" iconPosition="start" sx={{ textTransform: 'none', fontWeight: 600 }} />
        <Tab icon={<CompareArrows sx={{ mr: 1 }} />} label="Edit Requests" iconPosition="start" sx={{ textTransform: 'none', fontWeight: 600 }} />
      </Tabs>

      {activeTab === 0 && (
        <>
          {/* Filter card */}
          <Card sx={{ borderRadius: '16px', mb: 4, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                Filter Attendance History
              </Typography>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="course-filter-label">Course / Class</InputLabel>
                    <Select
                      labelId="course-filter-label"
                      value={selectedCourseId}
                      label="Course / Class"
                      onChange={(e) => {
                        setSelectedCourseId(e.target.value);
                        setSelectedSubjectId('');
                      }}
                      sx={{ borderRadius: '8px' }}
                    >
                      <MenuItem value="">All Courses</MenuItem>
                      {courses.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="subject-filter-label">Subject</InputLabel>
                    <Select
                      labelId="subject-filter-label"
                      value={selectedSubjectId}
                      label="Subject"
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      sx={{ borderRadius: '8px' }}
                    >
                      <MenuItem value="">All Subjects</MenuItem>
                      {filteredSubjects.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6} md={3}>
                  <TextField
                    label="Start Date"
                    type="date"
                    size="small"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                </Grid>

                <Grid item xs={6} md={3}>
                  <TextField
                    label="End Date"
                    type="date"
                    size="small"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Reports DataTable */}
          <DataTable
            rows={reports}
            columns={columns}
            loading={loading}
            searchPlaceholder="Search by subject or teacher..."
            searchField={['subjectName', 'markedByName', 'courseTitle']}
            exportFilename="college_attendance_reports.csv"
          />
        </>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Daily Attendance Roster View</Typography>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel id="roster-course-label">Select Course / Class</InputLabel>
                      <Select
                        labelId="roster-course-label"
                        value={rosterCourseId}
                        label="Select Course / Class"
                        onChange={(e) => setRosterCourseId(e.target.value)}
                        sx={{ borderRadius: '10px' }}
                      >
                        {courses.map((course) => (
                          <MenuItem key={course.id} value={course.id}>
                            {course.title}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth disabled={!rosterCourseId}>
                      <InputLabel id="roster-subject-label">Select Subject</InputLabel>
                      <Select
                        labelId="roster-subject-label"
                        value={rosterSubjectId}
                        label="Select Subject"
                        onChange={(e) => setRosterSubjectId(e.target.value)}
                        sx={{ borderRadius: '10px' }}
                      >
                        {filteredRosterSubjects.map((sub) => (
                          <MenuItem key={sub.id} value={sub.id}>
                            {sub.name} ({sub.code})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Attendance Date"
                      type="date"
                      value={rosterDate}
                      onChange={(e) => setRosterDate(e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {rosterLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                    <CircularProgress />
                  </Box>
                ) : !rosterCourseId || !rosterSubjectId ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">Please select a course and subject to inspect the daily roster.</Typography>
                  </Box>
                ) : rosterStudents.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">No students enrolled in this course.</Typography>
                  </Box>
                ) : (
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
                    <Table>
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Roll / Reg No</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Verification Method</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rosterStudents.map((student) => {
                          const record = rosterRecords.find(
                            (r) => String(r.student) === String(student.id) || String(r.studentId) === String(student.id)
                          );
                          const isPresent = record && (record.status.toLowerCase() === 'present' || record.status.toLowerCase() === 'late');
                          const statusText = record ? record.status : 'Absent';
                          let chipColor = 'error';
                          if (isPresent) chipColor = 'success';
                          else if (record?.status?.toLowerCase() === 'excused') chipColor = 'info';

                          return (
                            <TableRow key={student.id} hover>
                              <TableCell>{student.profile?.enrollmentNo || 'N/A'}</TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {student.firstName} {student.lastName}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={statusText}
                                  color={chipColor}
                                  size="small"
                                  sx={{ fontWeight: 700, textTransform: 'capitalize', minWidth: 80 }}
                                />
                              </TableCell>
                              <TableCell align="center" sx={{ textTransform: 'capitalize' }}>
                                {record ? (
                                  <Chip
                                    label={record.method || 'manual'}
                                    variant="outlined"
                                    size="small"
                                    color={record.method === 'qr' ? 'secondary' : 'default'}
                                    sx={{ fontWeight: 600 }}
                                  />
                                ) : (
                                  '—'
                                )}
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
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Attendance Edit Requests</Typography>
                </Box>
                <Divider />

                {editRequestsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                    <CircularProgress />
                  </Box>
                ) : editRequests.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">No attendance edit requests submitted yet.</Typography>
                  </Box>
                ) : (
                  <TableContainer component={Paper} elevation={0}>
                    <Table>
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Class / Subject</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Requested By</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Proposed Status</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Request Status</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {editRequests.map((req) => {
                          let statusColor = 'warning';
                          if (req.status === 'Approved') statusColor = 'success';
                          else if (req.status === 'Rejected') statusColor = 'error';

                          return (
                            <TableRow key={req.id} hover>
                              <TableCell>{new Date(req.date).toLocaleDateString('en-GB')}</TableCell>
                              <TableCell>{req.courseTitle} / {req.subjectName}</TableCell>
                              <TableCell>{req.studentName}</TableCell>
                              <TableCell>{req.requestedByName}</TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                  <Typography variant="caption" color="text.secondary">{req.oldStatus}</Typography>
                                  <Typography variant="caption">➔</Typography>
                                  <Chip label={req.newStatus} color="primary" size="small" sx={{ fontWeight: 700 }} />
                                </Box>
                              </TableCell>
                              <TableCell sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.reason}>
                                {req.reason}
                              </TableCell>
                              <TableCell align="center">
                                <Chip label={req.status} color={statusColor} size="small" sx={{ fontWeight: 700 }} />
                              </TableCell>
                              <TableCell align="center">
                                {req.status === 'Pending' ? (
                                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                    <IconButton
                                      color="success"
                                      size="small"
                                      onClick={() => handleActionRequest(req.id, 'approve')}
                                      title="Approve Request"
                                    >
                                      <CheckCircle />
                                    </IconButton>
                                    <IconButton
                                      color="error"
                                      size="small"
                                      onClick={() => handleActionRequest(req.id, 'reject')}
                                      title="Reject Request"
                                    >
                                      <Cancel />
                                    </IconButton>
                                  </Box>
                                ) : (
                                  <Typography variant="caption" color="text.disabled">—</Typography>
                                )}
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
          </Grid>
        </Grid>
      )}

      {/* Session Details Modal */}
      <Dialog open={detailOpen} onClose={handleCloseDetail} maxWidth="md" fullWidth>
        {selectedSession && (
          <>
            <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Attendance Checklist Detail
                </Typography>
                <Chip
                  label={new Date(selectedSession.date).toLocaleDateString('en-GB')}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Course: <strong>{selectedSession.courseTitle}</strong> | Subject: <strong>{selectedSession.subjectName}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Marked By: <strong>{selectedSession.markedByName}</strong> | Method: <strong>{selectedSession.method?.toUpperCase()}</strong>
              </Typography>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 0 }}>
              {selectedSession.records?.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No student records marked in this session.</Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Roll / Reg No</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedSession.records.map((r) => (
                        <TableRow key={r.studentId} hover>
                          <TableCell>{r.enrollmentNo}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', background: 'linear-gradient(135deg, #6C63FF, #3F51B5)' }}>
                                {r.studentName?.[0] || ''}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {r.studentName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={r.status}
                              color={getStatusColor(r.status)}
                              size="small"
                              sx={{ fontWeight: 700, textTransform: 'capitalize', minWidth: 80 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={handleCloseDetail} variant="contained" sx={{ borderRadius: '8px' }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
