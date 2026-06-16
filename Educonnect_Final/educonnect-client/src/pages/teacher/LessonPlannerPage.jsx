import React, { useState, useEffect } from 'react';
import {
  Box,
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
  Chip,
  IconButton,
  Typography,
  Grid,
} from '@mui/material';
import { Add, Edit, Delete, CalendarToday } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { lessonPlanApi, courseApi, subjectApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';

export default function LessonPlannerPage() {
  const { user, accessToken } = useAuth();
  const [plans, setPlans] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    subjectId: '',
    plannedDate: '',
    status: 'planned', // draft, planned, completed
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      setAuthHeader(accessToken);
      const [planRes, courseRes, subjectRes] = await Promise.all([
        lessonPlanApi.list({ teacherId: user.id }),
        courseApi.list({ teacherId: user.id }),
        subjectApi.list({ teacherId: user.id }),
      ]);

      setPlans(planRes.data.data || []);
      setCourses(courseRes.data.data || []);
      setSubjects(subjectRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load lesson plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchData();
    }
  }, [accessToken]);

  const handleOpenCreate = () => {
    setSelectedPlan(null);
    setFormData({
      title: '',
      description: '',
      courseId: '',
      subjectId: '',
      plannedDate: '',
      status: 'planned',
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (plan) => {
    setSelectedPlan(plan);
    setFormData({
      title: plan.title || '',
      description: plan.description || '',
      courseId: plan.courseId || '',
      subjectId: plan.subjectId || '',
      plannedDate: plan.plannedDate ? plan.plannedDate.split('T')[0] : '',
      status: plan.status || 'planned',
    });
    setOpenDialog(true);
  };

  const handleDeleteTrigger = (plan) => {
    setSelectedPlan(plan);
    setDeleteOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      if (selectedPlan) {
        await lessonPlanApi.update(selectedPlan.id, formData);
        toast.success('Lesson plan updated');
      } else {
        await lessonPlanApi.create(formData);
        toast.success('Lesson plan created');
      }
      setOpenDialog(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save lesson plan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPlan) return;
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      await lessonPlanApi.delete(selectedPlan.id);
      toast.success('Lesson plan deleted');
      setDeleteOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete lesson plan');
    } finally {
      setActionLoading(false);
    }
  };

  const getCourseName = (courseId) => {
    const c = courses.find((course) => course.id === courseId);
    return c ? c.title : 'General';
  };

  const getSubjectName = (subjectId) => {
    const s = subjects.find((subj) => subj.id === subjectId);
    return s ? s.name : 'General';
  };

  const columns = [
    { field: 'title', headerName: 'Topic/Title', flex: 1.2, renderCell: ({ row }) => <Typography sx={{ fontWeight: 600 }}>{row.title}</Typography> },
    { field: 'courseId', headerName: 'Class', flex: 1, valueGetter: ({ row }) => getCourseName(row.courseId) },
    { field: 'subjectId', headerName: 'Subject', flex: 1, valueGetter: ({ row }) => getSubjectName(row.subjectId) },
    {
      field: 'plannedDate',
      headerName: 'Planned Date',
      flex: 1,
      valueGetter: ({ row }) => (row.plannedDate ? new Date(row.plannedDate).toLocaleDateString() : ''),
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarToday fontSize="small" color="action" />
          <Typography variant="body2">
            {row.plannedDate ? new Date(row.plannedDate).toLocaleDateString() : 'Unscheduled'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.8,
      renderCell: ({ value }) => {
        let color = 'default';
        if (value === 'completed') color = 'success';
        if (value === 'planned') color = 'primary';
        if (value === 'draft') color = 'warning';
        return <Chip label={value} color={color} size="small" sx={{ textTransform: 'capitalize', fontWeight: 600 }} />;
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.8,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton color="primary" onClick={() => handleOpenEdit(row)} size="small">
            <Edit />
          </IconButton>
          <IconButton color="error" onClick={() => handleDeleteTrigger(row)} size="small">
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Lesson Planner"
        subtitle="Organize lectures, syllabus topics, and check off completed items"
        action={handleOpenCreate}
        actionLabel="Create Plan"
        actionIcon={<Add />}
      />

      <DataTable
        rows={plans}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search topics..."
        searchField="title"
        exportFilename="college_lesson_plans.csv"
      />

      {/* Edit/Create Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>
            {selectedPlan ? 'Edit Lesson Plan' : 'Create Lesson Plan'}
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Topic Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            
            <TextField
              label="Details / Objectives"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            <FormControl fullWidth required>
              <InputLabel id="plan-course-label">Target Class</InputLabel>
              <Select
                labelId="plan-course-label"
                value={formData.courseId}
                label="Target Class"
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                sx={{ borderRadius: '10px' }}
              >
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel id="plan-subject-label">Subject</InputLabel>
              <Select
                labelId="plan-subject-label"
                value={formData.subjectId}
                label="Subject"
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                sx={{ borderRadius: '10px' }}
              >
                {subjects.map((subj) => (
                  <MenuItem key={subj.id} value={subj.id}>
                    {subj.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Planned Date"
                  type="date"
                  value={formData.plannedDate}
                  onChange={(e) => setFormData({ ...formData, plannedDate: e.target.value })}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required>
                  <InputLabel id="plan-status-label">Status</InputLabel>
                  <Select
                    labelId="plan-status-label"
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    sx={{ borderRadius: '10px' }}
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="planned">Planned</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
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
              {selectedPlan ? 'Save Changes' : 'Create Plan'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Lesson Plan"
        message={`Are you sure you want to delete the lesson plan for "${selectedPlan?.title}"?`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={actionLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
