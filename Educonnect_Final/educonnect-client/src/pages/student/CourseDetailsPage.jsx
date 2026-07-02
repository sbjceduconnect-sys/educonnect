import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CardActions,
  Avatar,
  Tab,
  Tabs,
  Paper,
  FormHelperText,
} from '@mui/material';
import { Add, Edit, Delete, School, People, Person, ManageAccounts } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { courseApi, departmentApi, userApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';

const mapErrors = (backendErrors) => {
  const errors = {};
  if (!backendErrors) return errors;
  for (const key in backendErrors) {
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    errors[camelKey] = Array.isArray(backendErrors[key]) ? backendErrors[key][0] : backendErrors[key];
    errors[key] = errors[camelKey];
  }
  return errors;
};

export default function CourseDetailsPage() {
  const { user, accessToken } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    courseCode: '',
    departmentId: '',
    teacherId: '',
    academicYear: '2026-27',
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState({});
  
  // Enrollment management states
  const [students, setStudents] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [enrollSearch, setEnrollSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      setAuthHeader(accessToken);
      // Construct filter params based on role
      const params = {};
      if (isTeacher) params.teacherId = user.id;
      if (isStudent) params.studentId = user.id; // getEnrolledCourses will be called on backend if studentId is passed

      const promises = [
        courseApi.list(params),
        departmentApi.list(),
      ];

      if (isAdmin) {
        promises.push(userApi.listUsers({ role: 'teacher' }));
      }

      const [courseRes, deptRes, teacherRes] = await Promise.all(promises);

      setCourses(courseRes.data.data || []);
      setDepartments(deptRes.data.data || []);
      if (isAdmin && teacherRes) {
        setTeachers(teacherRes.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load courses data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchData();
    }
  }, [accessToken, user?.role]);

  const handleOpenCreate = () => {
    setSelectedCourse(null);
    setFormData({
      title: '',
      courseCode: '',
      departmentId: '',
      teacherId: '',
      academicYear: '2026-27',
      isActive: true,
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEdit = (course) => {
    setSelectedCourse(course);
    setFormData({
      title: course.title || '',
      courseCode: course.courseCode || '',
      departmentId: course.departmentId || '',
      teacherId: course.teacherId || '',
      academicYear: course.academicYear || '2026-27',
      isActive: course.isActive !== false,
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleDeleteTrigger = (course) => {
    setSelectedCourse(course);
    setDeleteOpen(true);
  };

  // Open enrollment manager
  const handleOpenEnroll = async (course) => {
    setSelectedCourse(course);
    setActionLoading(true);
    setEnrollOpen(true);
    try {
      setAuthHeader(accessToken);
      
      const promises = [courseApi.getStudents(course.id)];
      if (isAdmin) {
        promises.push(userApi.listUsers({ role: 'student' }));
      }
      
      const [enrolledRes, allStudentsRes] = await Promise.all(promises);
      setEnrolledStudents(enrolledRes.data.data || []);
      
      if (isAdmin && allStudentsRes) {
        setStudents(allStudentsRes.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load students roster');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnrollStudent = async (studentId) => {
    try {
      setAuthHeader(accessToken);
      await courseApi.enrollStudents(selectedCourse.id, [studentId]);
      toast.success('Student enrolled successfully');
      
      // Refresh enrolled list
      const enrolledRes = await courseApi.getStudents(selectedCourse.id);
      setEnrolledStudents(enrolledRes.data.data || []);
      fetchData();
    } catch (err) {
      toast.error('Failed to enroll student');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    try {
      setAuthHeader(accessToken);
      await courseApi.removeStudent(selectedCourse.id, studentId);
      toast.success('Student removed from enrollment');
      
      // Refresh enrolled list
      const enrolledRes = await courseApi.getStudents(selectedCourse.id);
      setEnrolledStudents(enrolledRes.data.data || []);
      fetchData();
    } catch (err) {
      toast.error('Failed to remove student');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      if (selectedCourse) {
        await courseApi.update(selectedCourse.id, formData);
        toast.success('Course updated successfully');
      } else {
        await courseApi.create(formData);
        toast.success('Course created successfully');
      }
      setOpenDialog(false);
      fetchData();
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.errors) {
        setFormErrors(mapErrors(err.response.data.errors));
      }
      toast.error(err.response?.data?.message || 'Failed to save course');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCourse) return;
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      await courseApi.delete(selectedCourse.id);
      toast.success('Course deleted/deactivated successfully');
      setDeleteOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete course');
    } finally {
      setActionLoading(false);
    }
  };

  const getDeptName = (deptId) => {
    const dept = departments.find((d) => d.id === deptId);
    return dept ? dept.name : 'General';
  };

  const getTeacherName = (tId) => {
    if (!tId) return 'Not Assigned';
    const t = teachers.find((teacher) => teacher.id === tId);
    return t ? `${t.firstName} ${t.lastName}` : 'Assigned (No Profile)';
  };

  // Admin DataGrid Columns
  const columns = [
    { field: 'courseCode', headerName: 'Code', flex: 0.8, renderCell: ({ value }) => <Chip label={value} size="small" variant="outlined" sx={{ fontWeight: 700 }} /> },
    { field: 'title', headerName: 'Course Title', flex: 1.2, renderCell: ({ row }) => <Typography sx={{ fontWeight: 600 }}>{row.title}</Typography> },
    { field: 'departmentId', headerName: 'Stream/Dept', flex: 1.2, valueGetter: ({ row }) => getDeptName(row.departmentId) },
    {
      field: 'enrolled',
      headerName: 'Students Enrolled',
      flex: 0.8,
      valueGetter: ({ row }) => row.enrolledCount ?? row.enrolledStudentIds?.length ?? 0,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1.2,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton color="secondary" onClick={() => handleOpenEnroll(row)} size="small" title="Manage Enrollment">
            <People />
          </IconButton>
          <IconButton color="primary" onClick={() => handleOpenEdit(row)} size="small" title="Edit">
            <Edit />
          </IconButton>
          <IconButton color="error" onClick={() => handleDeleteTrigger(row)} size="small" title="Delete">
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title={isAdmin ? 'Course Administration' : 'My Courses'}
        subtitle={isAdmin ? 'Create academic courses, assign teachers, and manage student enrollment maps' : 'View your courses and classes'}
        action={isAdmin ? handleOpenCreate : null}
        actionLabel="Add Course"
        actionIcon={<Add />}
      />

      {isAdmin ? (
        // Admin Management View
        <DataTable
          rows={courses}
          columns={columns}
          loading={loading}
          searchPlaceholder="Search courses by name or code..."
          searchField={['title', 'courseCode']}
          exportFilename="college_courses_list.csv"
        />
      ) : (
        // Student/Teacher Grid Card View
        <Grid container spacing={3}>
          {courses.length === 0 ? (
            <Grid item xs={12}>
              <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
                <Typography color="text.secondary">No courses found matching your profile.</Typography>
              </Card>
            </Grid>
          ) : (
            courses.map((course) => (
              <Grid item xs={12} sm={6} md={4} key={course.id}>
                <Card
                  sx={{
                    borderRadius: '16px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 8px 32px rgba(108, 99, 255, 0.04)',
                    border: '1px solid',
                    borderColor: 'divider',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Chip label={course.courseCode} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                      <Chip label={course.academicYear} size="small" color="primary" variant="outlined" />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, lineHeight: 1.2 }}>
                      {course.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Stream: {getDeptName(course.departmentId)}
                    </Typography>
                  </Box>

                  {isTeacher && (
                    <CardActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
                      <Button
                        size="small"
                        startIcon={<People />}
                        onClick={() => handleOpenEnroll(course)}
                        fullWidth
                        variant="outlined"
                        sx={{ borderRadius: '8px', textTransform: 'none' }}
                      >
                        Student Roster ({course.enrolledStudentIds?.length || 0})
                      </Button>
                    </CardActions>
                  )}
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>
            {selectedCourse ? 'Edit Course Details' : 'Create Course Details'}
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Course Title"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                setFormErrors({ ...formErrors, title: null });
              }}
              error={!!formErrors.title}
              helperText={formErrors.title}
              required
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <TextField
              label="Course Code"
              value={formData.courseCode}
              onChange={(e) => {
                setFormData({ ...formData, courseCode: e.target.value.toUpperCase() });
                setFormErrors({ ...formErrors, courseCode: null });
              }}
              error={!!formErrors.courseCode || !!formErrors.code}
              helperText={formErrors.courseCode || formErrors.code}
              required
              fullWidth
              placeholder="e.g. 11SCI-PHY"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <FormControl fullWidth required error={!!formErrors.departmentId}>
              <InputLabel id="select-dept-label">Academic Stream</InputLabel>
              <Select
                labelId="select-dept-label"
                value={formData.departmentId}
                label="Academic Stream"
                onChange={(e) => {
                  setFormData({ ...formData, departmentId: e.target.value });
                  setFormErrors({ ...formErrors, departmentId: null });
                }}
                sx={{ borderRadius: '10px' }}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.departmentId && <FormHelperText>{formErrors.departmentId}</FormHelperText>}
            </FormControl>

            <TextField
              label="Academic Year"
              value={formData.academicYear}
              onChange={(e) => {
                setFormData({ ...formData, academicYear: e.target.value });
                setFormErrors({ ...formErrors, academicYear: null });
              }}
              error={!!formErrors.academicYear}
              helperText={formErrors.academicYear}
              required
              fullWidth
              placeholder="e.g. 2026-27"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenDialog(false)} disabled={actionLoading}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={actionLoading}
              sx={{
                borderRadius: '10px',
                px: 3,
                background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
              }}
            >
              {selectedCourse ? 'Save Changes' : 'Create Course'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Enrollment Manager Dialog */}
      <Dialog open={enrollOpen} onClose={() => setEnrollOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Student Roster & Enrollment</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Course: <strong>{selectedCourse?.title} ({selectedCourse?.courseCode})</strong>
            </Typography>
            <TextField
              size="small"
              placeholder="Filter students by name..."
              value={enrollSearch}
              onChange={(e) => setEnrollSearch(e.target.value)}
              fullWidth
              sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Box>

          <Grid container spacing={3}>
            {/* Enrolled Students */}
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'success.main' }}>
                Enrolled Students ({enrolledStudents.length})
              </Typography>
              <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', borderRadius: '10px' }}>
                <List size="small">
                  {enrolledStudents.length === 0 ? (
                    <ListItem><ListItemText primary="No students enrolled" /></ListItem>
                  ) : (
                    enrolledStudents.map((s) => (
                      <ListItem key={s.id} divider>
                        <ListItemText
                          primary={`${s.firstName} ${s.lastName}`}
                          secondary={s.profile?.enrollmentNo || 'No Roll No'}
                        />
                        {isAdmin && (
                          <ListItemSecondaryAction>
                            <Button size="small" color="error" onClick={() => handleRemoveStudent(s.id)}>
                              Remove
                            </Button>
                          </ListItemSecondaryAction>
                        )}
                      </ListItem>
                    ))
                  )}
                </List>
              </Paper>
            </Grid>

            {/* Unenrolled Students */}
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
                Available Students
              </Typography>
              <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', borderRadius: '10px' }}>
                <List size="small">
                  {students
                    .filter((s) => !enrolledStudents.some((es) => es.id === s.id))
                    .filter((s) => `${s.firstName} ${s.lastName}`.toLowerCase().includes(enrollSearch.toLowerCase()))
                    .map((s) => (
                      <ListItem key={s.id} divider>
                        <ListItemText
                          primary={`${s.firstName} ${s.lastName}`}
                          secondary={s.profile?.enrollmentNo || 'No Roll No'}
                        />
                        {isAdmin && (
                          <ListItemSecondaryAction>
                            <Button size="small" color="primary" onClick={() => handleEnrollStudent(s.id)}>
                              Enroll
                            </Button>
                          </ListItemSecondaryAction>
                        )}
                      </ListItem>
                    ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEnrollOpen(false)} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete/Deactivate Course"
        message={`Are you sure you want to delete the course "${selectedCourse?.title}"?`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={actionLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
