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
} from '@mui/material';
import { FactCheck, Refresh, Visibility, Delete } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { courseApi, subjectApi, attendanceApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import toast from 'react-hot-toast';

export default function AttendanceReportsPage() {
  const { accessToken } = useAuth();
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
      valueGetter: ({ row }) => new Date(row.date).toLocaleDateString(),
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
        action={fetchReports}
        actionLabel="Refresh Records"
        actionIcon={<Refresh />}
        actionVariant="contained"
      />

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
                    setSelectedSubjectId(''); // Reset subject when course changes
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
                  label={new Date(selectedSession.date).toLocaleDateString()}
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
