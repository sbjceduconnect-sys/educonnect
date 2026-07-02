import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
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
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Add,
  Delete,
  CloudDownload,
  UploadFile,
  Assignment,
  People,
  Grade,
  CheckCircle,
  Pending,
  Close,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { assignmentApi, courseApi, subjectApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { formatDate, downloadBlob } from '../../utils/helpers';

export default function TeacherAssignmentsPage() {
  const { user, accessToken } = useAuth();

  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Dialog (Create/Edit)
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    subjectId: '',
    dueDate: '',
    maxMarks: 100,
    removeFile: false,
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Submissions Modal
  const [subsOpen, setSubsOpen] = useState(false);
  const [subsAssignment, setSubsAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);

  // Grading Modal
  const [gradeOpen, setGradeOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeData, setGradeData] = useState({
    marks: '',
    feedback: '',
  });

  // Delete Confirm
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteAssignment, setDeleteAssignment] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      setAuthHeader(accessToken);
      const [assignmentsRes, coursesRes, subjectsRes] = await Promise.all([
        assignmentApi.list(),
        courseApi.list(),
        subjectApi.list(),
      ]);

      setAssignments(assignmentsRes.data.data || []);
      setCourses(coursesRes.data.data || []);
      setSubjects(subjectsRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load assignments');
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
    setSelectedAssignment(null);
    setUploadFile(null);
    setFormData({
      title: '',
      description: '',
      courseId: '',
      subjectId: '',
      dueDate: '',
      maxMarks: 100,
      removeFile: false,
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (assignment) => {
    setSelectedAssignment(assignment);
    setUploadFile(null);
    // Format due date for datetime-local input (YYYY-MM-DDTHH:MM)
    const formattedDate = assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 16) : '';
    setFormData({
      title: assignment.title,
      description: assignment.description,
      courseId: assignment.courseId,
      subjectId: assignment.subjectId || '',
      dueDate: formattedDate,
      maxMarks: assignment.maxMarks,
      removeFile: false,
    });
    setOpenDialog(true);
  };

  const handleDownloadAttachment = async (assignmentId, originalFileUrl) => {
    try {
      setAuthHeader(accessToken);
      const res = await assignmentApi.downloadAssignmentFile(assignmentId);
      const filename = originalFileUrl ? originalFileUrl.split('/').pop().split('?')[0] : `assignment_${assignmentId}_guidelines.pdf`;
      downloadBlob(res.data, filename);
      toast.success('Download started!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to download file');
    }
  };

  const handleDeleteTrigger = (assignment) => {
    setDeleteAssignment(assignment);
    setDeleteOpen(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const uploadData = new FormData();
      if (uploadFile) {
        uploadData.append('file', uploadFile);
      } else if (formData.removeFile) {
        uploadData.append('file', '');
      }
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description);
      if (formData.courseId) uploadData.append('courseId', formData.courseId);
      if (formData.subjectId) uploadData.append('subjectId', formData.subjectId);
      uploadData.append('dueDate', new Date(formData.dueDate).toISOString());
      
      const parsedMaxMarks = formData.maxMarks === '' ? 100 : parseInt(formData.maxMarks) || 100;
      uploadData.append('maxMarks', parsedMaxMarks);

      setAuthHeader(accessToken);
      if (selectedAssignment) {
        await assignmentApi.update(selectedAssignment.id, uploadData);
        toast.success('Assignment updated successfully!');
      } else {
        await assignmentApi.create(uploadData);
        toast.success('Assignment created successfully!');
      }
      setOpenDialog(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save assignment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteAssignment) return;
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      await assignmentApi.delete(deleteAssignment.id);
      toast.success('Assignment deleted successfully');
      setDeleteOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete assignment');
    } finally {
      setActionLoading(false);
    }
  };

  // Submissions Handling
  const handleOpenSubmissions = async (assignment) => {
    setSubsAssignment(assignment);
    setSubsOpen(true);
    setSubsLoading(true);
    try {
      setAuthHeader(accessToken);
      const res = await assignmentApi.getSubmissions(assignment.id);
      setSubmissions(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load submissions');
    } finally {
      setSubsLoading(false);
    }
  };

  const handleDownloadSolution = async (submission) => {
    try {
      setAuthHeader(accessToken);
      const res = await assignmentApi.downloadSubmissionFile(submission.id);
      const originalName = submission.file ? submission.file.split('/').pop().split('?')[0] : `submission_${submission.id}.pdf`;
      downloadBlob(res.data, originalName);
      toast.success('Download started!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to download solution');
    }
  };

  // Grading Handling
  const handleOpenGrade = (submission) => {
    setSelectedSubmission(submission);
    setGradeData({
      marks: submission.marks !== null ? submission.marks : '',
      feedback: submission.feedback || '',
    });
    setGradeOpen(true);
  };

  const handleSubmitGrade = async (e) => {
    e.preventDefault();
    if (gradeData.marks === '') {
      toast.error('Please enter a grade score');
      return;
    }
    
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      await assignmentApi.gradeSubmission(selectedSubmission.id, {
        marks: parseFloat(gradeData.marks),
        feedback: gradeData.feedback,
      });
      toast.success('Submission graded successfully!');
      setGradeOpen(false);
      
      // Refresh submissions list
      const res = await assignmentApi.getSubmissions(subsAssignment.id);
      setSubmissions(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to grade submission');
    } finally {
      setActionLoading(false);
    }
  };

  const getCourseName = (courseId) => {
    const c = courses.find((course) => course.id === courseId);
    return c ? c.title : 'General Course';
  };

  const getSubjectName = (subjectId) => {
    const s = subjects.find((subj) => subj.id === subjectId);
    return s ? `${s.name} (${s.code})` : 'General Subject';
  };

  return (
    <Box>
      <PageHeader
        title="Assignment Manager"
        subtitle="Create assignments, manage guidelines, and grade student submissions online"
        action={handleOpenCreate}
        actionLabel="Create Assignment"
        actionIcon={<Add />}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {assignments.length === 0 ? (
            <Grid item xs={12}>
              <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                <Typography color="text.secondary">No assignments posted yet. Click "Create Assignment" to post one.</Typography>
              </Card>
            </Grid>
          ) : (
            assignments.map((item) => (
              <Grid item xs={12} md={6} lg={4} key={item.id}>
                <Card
                  sx={{
                    borderRadius: '16px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 8px 32px rgba(108, 99, 255, 0.03)',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Chip label={getSubjectName(item.subjectId)} size="small" variant="outlined" color="primary" sx={{ fontWeight: 600 }} />
                      <Chip label={getCourseName(item.courseId)} size="small" sx={{ fontWeight: 600 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, lineHeight: 1.2 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      height: '60px'
                    }}>
                      {item.description || 'No description provided.'}
                    </Typography>
                    
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Due Date: <strong>{formatDate(item.dueDate, 'DD/MM/YYYY, hh:mm A')}</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Max Marks: <strong>{item.maxMarks} points</strong>
                      </Typography>
                      {item.file && (
                        <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                          <Typography variant="caption" color="text.secondary">
                            Attachment:
                          </Typography>
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<CloudDownload sx={{ fontSize: '14px' }} />}
                            onClick={() => handleDownloadAttachment(item.id, item.file)}
                            sx={{ p: 0, minWidth: 0, textTransform: 'none', fontSize: '11px', fontWeight: 700, display: 'inline-flex', verticalAlign: 'middle' }}
                          >
                            {item.file.split('/').pop().split('?')[0]}
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<People />}
                      onClick={() => handleOpenSubmissions(item)}
                      sx={{ borderRadius: '8px', textTransform: 'none', background: 'linear-gradient(135deg, #1B3F6B, #F07830)' }}
                    >
                      Submissions
                    </Button>
                    <Box>
                      <Button size="small" onClick={() => handleOpenEdit(item)} sx={{ textTransform: 'none', mr: 0.5 }}>
                        Edit
                      </Button>
                      <IconButton color="error" size="small" onClick={() => handleDeleteTrigger(item)}>
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>
            {selectedAssignment ? 'Edit Assignment' : 'Create Assignment'}
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Assignment Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <TextField
              label="Description / Prompt"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            <FormControl fullWidth required>
              <InputLabel id="select-course-label">Select Class/Course</InputLabel>
              <Select
                labelId="select-course-label"
                value={formData.courseId}
                label="Select Class/Course"
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

            <FormControl fullWidth>
              <InputLabel id="select-subject-label">Subject (optional)</InputLabel>
              <Select
                labelId="select-subject-label"
                value={formData.subjectId}
                label="Subject (optional)"
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                sx={{ borderRadius: '10px' }}
              >
                <MenuItem value="">None</MenuItem>
                {subjects.filter(s => user?.role !== 'teacher' || String(s.teacherId) === String(user.id)).map((subj) => (
                  <MenuItem key={subj.id} value={subj.id}>
                    {subj.name} ({subj.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Due Date & Time"
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            <TextField
              label="Max Marks"
              type="number"
              value={formData.maxMarks}
              onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
              required
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            {/* File guidelines */}
            <Card variant="outlined" sx={{ borderStyle: 'dashed', borderRadius: '12px', textAlign: 'center', p: 3, bgcolor: 'action.hover' }}>
              <input
                style={{ display: 'none' }}
                id="assignment-file-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="assignment-file-upload">
                <Button variant="contained" component="span" startIcon={<UploadFile />} sx={{ borderRadius: '8px', mb: 1 }}>
                  {selectedAssignment?.file ? 'Replace Prompt/Template File' : 'Upload Prompt/Template File'}
                </Button>
              </label>
              <Typography variant="body2" color="text.secondary">
                {uploadFile 
                  ? `Selected: ${uploadFile.name}` 
                  : selectedAssignment?.file 
                    ? `Current File: ${selectedAssignment.file.split('/').pop().split('?')[0]}` 
                    : 'Select PDF or Document for guidelines'
                }
              </Typography>
              {selectedAssignment?.file && !uploadFile && (
                <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'center', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CloudDownload />}
                    onClick={() => handleDownloadAttachment(selectedAssignment.id, selectedAssignment.file)}
                    sx={{ textTransform: 'none' }}
                  >
                    Download
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      setFormData({ ...formData, removeFile: true });
                      toast.success('Current file marked for removal. Save changes to apply.');
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    Remove File
                  </Button>
                </Box>
              )}
              {formData.removeFile && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                  File will be removed upon saving.
                </Typography>
              )}
            </Card>

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
                background: 'linear-gradient(135deg, #1B3F6B, #F07830)',
              }}
            >
              {actionLoading ? 'Saving...' : 'Save Assignment'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog open={subsOpen} onClose={() => setSubsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Submissions: {subsAssignment?.title}
          </Typography>
          <IconButton onClick={() => setSubsOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {subsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          ) : submissions.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No students have submitted this assignment yet.</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table sx={{ minWidth: 600 }}>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Submission Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Student Remarks</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Marks</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissions.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {row.student ? `${row.student.firstName} ${row.student.lastName}` : 'N/A'}
                      </TableCell>
                      <TableCell>{formatDate(row.submittedAt, 'DD/MM/YYYY, hh:mm A')}</TableCell>
                      <TableCell sx={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.remarks || '-'}
                      </TableCell>
                      <TableCell>
                        {row.graded ? (
                          <Chip label="Graded" color="success" size="small" icon={<CheckCircle />} />
                        ) : (
                          <Chip label="Pending Grade" color="warning" size="small" icon={<Pending />} />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {row.graded ? `${row.marks}/${row.assignmentMaxMarks}` : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<CloudDownload />}
                          onClick={() => handleDownloadSolution(row)}
                          sx={{ mr: 1, borderRadius: '6px', textTransform: 'none' }}
                        >
                          Solution
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="secondary"
                          startIcon={<Grade />}
                          onClick={() => handleOpenGrade(row)}
                          sx={{ borderRadius: '6px', textTransform: 'none' }}
                        >
                          Grade
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* Grade Dialog */}
      <Dialog open={gradeOpen} onClose={() => setGradeOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmitGrade}>
          <DialogTitle sx={{ fontWeight: 800 }}>Grade Solution</DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              Grading submission for <strong>{selectedSubmission?.student ? `${selectedSubmission.student.firstName} ${selectedSubmission.student.lastName}` : ''}</strong>
              <br />
              Max allowed marks: <strong>{selectedSubmission?.assignmentMaxMarks} points</strong>
            </Typography>

            <TextField
              label="Marks Obtained"
              type="number"
              value={gradeData.marks}
              onChange={(e) => setGradeData({ ...gradeData, marks: e.target.value })}
              required
              fullWidth
              inputProps={{ step: '0.5', min: '0', max: selectedSubmission?.assignmentMaxMarks }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            <TextField
              label="Teacher Feedback"
              value={gradeData.feedback}
              onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="Leave feedback on their work..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setGradeOpen(false)} disabled={actionLoading}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="success"
              disabled={actionLoading}
              sx={{ borderRadius: '10px', px: 3 }}
            >
              {actionLoading ? 'Saving...' : 'Submit Grade'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Assignment"
        message={`Are you sure you want to delete "${deleteAssignment?.title}"? All student submissions will be lost.`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={actionLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
