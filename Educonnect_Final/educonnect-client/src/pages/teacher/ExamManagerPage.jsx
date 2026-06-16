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
import { Add, Edit, Delete, EventNote, Score } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { examApi, courseApi, subjectApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';


export default function ExamManagerPage() {
  const { user, accessToken } = useAuth();
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    examType: 'mid',
    courseId: '',
    subjectId: '',
    examDate: '',
    maxMarks: 100,
    academicYear: '2026-27',
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      setAuthHeader(accessToken);
      // Fetch teacher's exams, subjects, and courses
      const [examRes, courseRes, subjectRes] = await Promise.all([
        examApi.list({ teacherId: user.role === 'admin' ? undefined : user.id }),
        courseApi.list({ teacherId: user.role === 'admin' ? undefined : user.id }),
        subjectApi.list({ teacherId: user.role === 'admin' ? undefined : user.id }),
      ]);

      setExams(examRes.data.data || []);
      setCourses(courseRes.data.data || []);
      setSubjects(subjectRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load examination data');
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
    setSelectedExam(null);
    setFormData({
      title: '',
      examType: 'mid',
      courseId: '',
      subjectId: '',
      examDate: '',
      maxMarks: 100,
      academicYear: '2026-27',
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (exam) => {
    setSelectedExam(exam);
    setFormData({
      title: exam.title || '',
      examType: exam.examType || 'mid',
      courseId: exam.courseId || '',
      subjectId: exam.subjectId || '',
      examDate: exam.examDate ? exam.examDate.split('T')[0] : '',
      maxMarks: exam.maxMarks || 100,
      academicYear: exam.academicYear || '2026-27',
    });
    setOpenDialog(true);
  };

  const handleDeleteTrigger = (exam) => {
    setSelectedExam(exam);
    setDeleteOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      const payload = {
        ...formData,
        maxMarks: formData.maxMarks === '' ? 100 : parseInt(formData.maxMarks, 10)
      };
      if (selectedExam) {
        await examApi.update(selectedExam.id, payload);
        toast.success('Exam updated successfully');
      } else {
        await examApi.create(payload);
        toast.success('Exam scheduled successfully');
      }
      setOpenDialog(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save exam');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedExam) return;
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      await examApi.delete(selectedExam.id);
      toast.success('Exam cancelled/deleted');
      setDeleteOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete exam');
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
    { field: 'title', headerName: 'Exam Title', flex: 1.2, renderCell: ({ row }) => <Typography sx={{ fontWeight: 600 }}>{row.title}</Typography> },
    {
      field: 'examType',
      headerName: 'Type',
      flex: 0.8,
      renderCell: ({ value }) => {
        let color = 'primary';
        if (value === 'final') color = 'error';
        if (value === 'quiz') color = 'secondary';
        return <Chip label={value} color={color} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />;
      },
    },
    { field: 'courseId', headerName: 'Course/Class', flex: 1.2, valueGetter: ({ row }) => getCourseName(row.courseId) },
    { field: 'subjectId', headerName: 'Subject', flex: 1, valueGetter: ({ row }) => getSubjectName(row.subjectId) },
    {
      field: 'examDate',
      headerName: 'Exam Date',
      flex: 1,
      valueGetter: ({ row }) => (row.examDate ? formatDate(row.examDate, 'DD/MM/YYYY') : ''),
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventNote fontSize="small" color="action" />
          <Typography variant="body2">
            {row.examDate ? formatDate(row.examDate, 'DD/MM/YYYY') : 'TBD'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'maxMarks',
      headerName: 'Max Marks',
      flex: 0.8,
      renderCell: ({ value }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Score fontSize="small" color="primary" />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {value}
          </Typography>
        </Box>
      ),
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
        title="Exam Scheduler"
        subtitle="Manage examinations, schedule dates, and configure grading marks"
        action={handleOpenCreate}
        actionLabel="Create Exam"
        actionIcon={<Add />}
      />

      <DataTable
        rows={exams}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search exams by title..."
        searchField="title"
        exportFilename="college_exams_list.csv"
      />

      {/* Edit/Create Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>
            {selectedExam ? 'Edit Scheduled Exam' : 'Create Examination Schedule'}
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Exam Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth required>
                  <InputLabel id="exam-type-label">Exam Type</InputLabel>
                  <Select
                    labelId="exam-type-label"
                    value={formData.examType}
                    label="Exam Type"
                    onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                    sx={{ borderRadius: '10px' }}
                  >
                    <MenuItem value="mid">Mid Term</MenuItem>
                    <MenuItem value="final">Final Term</MenuItem>
                    <MenuItem value="quiz">Quiz</MenuItem>
                    <MenuItem value="assignment">Assignment</MenuItem>
                    <MenuItem value="practical">Practical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Max Marks"
                  type="number"
                  value={formData.maxMarks}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, maxMarks: val === '' ? '' : parseInt(val, 10) });
                  }}
                  required
                  fullWidth
                  InputProps={{ inputProps: { min: 1, max: 1000 } }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
              </Grid>
            </Grid>

            <FormControl fullWidth required>
              <InputLabel id="exam-course-label">Target Course</InputLabel>
              <Select
                labelId="exam-course-label"
                value={formData.courseId}
                label="Target Course"
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
              <InputLabel id="exam-subject-label">Subject</InputLabel>
              <Select
                labelId="exam-subject-label"
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
                  label="Exam Date"
                  type="date"
                  value={formData.examDate}
                  onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Academic Year"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  required
                  fullWidth
                  placeholder="e.g. 2026-27"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
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
              {selectedExam ? 'Save Changes' : 'Schedule Exam'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        title="Cancel/Delete Scheduled Exam"
        message={`Are you sure you want to cancel and delete the exam "${selectedExam?.title}"? All results associated with this exam might be deleted.`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={actionLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
