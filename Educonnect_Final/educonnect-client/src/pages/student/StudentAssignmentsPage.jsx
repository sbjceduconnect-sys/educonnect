import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Tabs,
  Tab,
  Button,
  Divider,
  CircularProgress,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  EventNote,
  Assignment,
  CloudDownload,
  CloudUpload,
  AccessTime,
  Book,
  School,
  CheckCircle,
  Warning,
  PendingActions,
  Grade,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { assignmentApi, courseApi, subjectApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import toast from 'react-hot-toast';
import { formatDate, downloadBlob } from '../../utils/helpers';

export default function StudentAssignmentsPage() {
  const { user, accessToken } = useAuth();
  const theme = useTheme();

  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Dialog & Submission States
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getCourseName = (courseId) => {
    const c = courses.find((course) => course.id === courseId);
    return c ? c.title : 'General Course';
  };

  const getSubjectName = (subjectId) => {
    const s = subjects.find((subj) => subj.id === subjectId);
    return s ? s.name : 'General Subject';
  };

  // Split assignments into pending vs submitted
  const pendingAssignments = assignments.filter((a) => !a.studentSubmission);
  const submittedAssignments = assignments.filter((a) => !!a.studentSubmission);

  // Analytics/KPIs
  const totalCount = assignments.length;
  const pendingCount = pendingAssignments.length;
  const gradedCount = submittedAssignments.filter((a) => a.studentSubmission.graded).length;
  
  // Calculate average grade score
  const gradedSubmissions = submittedAssignments.filter((a) => a.studentSubmission.graded);
  const averageGrade = gradedSubmissions.length > 0
    ? (gradedSubmissions.reduce((acc, curr) => acc + (curr.studentSubmission.marks / curr.maxMarks * 100), 0) / gradedSubmissions.length).toFixed(1)
    : 'N/A';

  const handleOpenDetail = (assignment) => {
    setSelectedAssignment(assignment);
    setUploadFile(null);
    setRemarks(assignment.studentSubmission?.remarks || '');
    setDetailOpen(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
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

  const handleDownloadSubmittedFile = async (submissionId, originalFileUrl) => {
    try {
      setAuthHeader(accessToken);
      const res = await assignmentApi.downloadSubmissionFile(submissionId);
      const filename = originalFileUrl ? originalFileUrl.split('/').pop().split('?')[0] : `my_submission_${submissionId}.pdf`;
      downloadBlob(res.data, filename);
      toast.success('Download started!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to download submission');
    }
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!uploadFile && !selectedAssignment?.studentSubmission) {
      toast.error('Please select a file to upload');
      return;
    }

    setSubmitLoading(true);
    try {
      const formData = new FormData();
      if (uploadFile) {
        formData.append('file', uploadFile);
      }
      formData.append('remarks', remarks);

      setAuthHeader(accessToken);
      await assignmentApi.submit(selectedAssignment.id, formData);
      toast.success('Assignment submitted successfully!');
      setDetailOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmitLoading(false);
    }
  };

  const isOverdue = (dueDateStr) => {
    return new Date(dueDateStr) < new Date();
  };

  const getStatusChip = (assignment) => {
    const sub = assignment.studentSubmission;
    if (!sub) {
      return isOverdue(assignment.dueDate) 
        ? <Chip label="Overdue" color="error" size="small" icon={<Warning />} />
        : <Chip label="Pending" color="warning" size="small" icon={<AccessTime />} />;
    }
    if (sub.graded) {
      return <Chip label={`Graded: ${sub.marks}/${assignment.maxMarks}`} color="success" size="small" icon={<CheckCircle />} />;
    }
    return <Chip label="Submitted" color="info" size="small" icon={<CheckCircle />} />;
  };

  return (
    <Box>
      <PageHeader
        title="My Assignments"
        subtitle="Manage, upload, and track grades for your class assignments online"
      />

      {/* Analytics Dashboard Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Assignments"
            value={totalCount}
            icon={<Assignment />}
            color="blue"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Submissions"
            value={pendingCount}
            icon={<PendingActions />}
            color="orange"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Graded"
            value={gradedCount}
            icon={<Grade />}
            color="green"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg. Grade Score"
            value={averageGrade !== 'N/A' ? `${averageGrade}%` : 'N/A'}
            icon={<School />}
            color="purple"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} textColor="secondary" indicatorColor="secondary">
          <Tab label={`Pending (${pendingAssignments.length})`} sx={{ fontWeight: 600 }} />
          <Tab label={`Submitted (${submittedAssignments.length})`} sx={{ fontWeight: 600 }} />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {((activeTab === 0 ? pendingAssignments : submittedAssignments).length === 0) ? (
            <Grid item xs={12}>
              <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                <Typography color="text.secondary">No assignments found in this category.</Typography>
              </Card>
            </Grid>
          ) : (
            (activeTab === 0 ? pendingAssignments : submittedAssignments).map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
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
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Chip label={getSubjectName(item.subjectId)} size="small" variant="outlined" color="primary" sx={{ fontWeight: 600 }} />
                      {getStatusChip(item)}
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <School fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          Class: <strong>{getCourseName(item.courseId)}</strong>
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EventNote fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          Due Date: <strong>{formatDate(item.dueDate, 'DD/MM/YYYY, hh:mm A')}</strong>
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      Max Marks: {item.maxMarks}
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleOpenDetail(item)}
                      sx={{ borderRadius: '8px', textTransform: 'none', background: 'linear-gradient(135deg, #1B3F6B, #F07830)' }}
                    >
                      {item.studentSubmission ? 'View Submission' : 'Submit Now'}
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Submission & Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        {selectedAssignment && (
          <form onSubmit={handleSubmitAssignment}>
            <DialogTitle sx={{ fontWeight: 800 }}>{selectedAssignment.title}</DialogTitle>
            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              
              {/* Info block */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>Assignment Description</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{selectedAssignment.description || 'No description provided.'}</Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Subject</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{getSubjectName(selectedAssignment.subjectId)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Max Marks</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedAssignment.maxMarks}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Due Date</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: isOverdue(selectedAssignment.dueDate) && !selectedAssignment.studentSubmission ? 'error.main' : 'inherit' }}>
                    {formatDate(selectedAssignment.dueDate, 'DD/MM/YYYY, hh:mm A')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Assigned By</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedAssignment.teacher ? `Prof. ${selectedAssignment.teacher.firstName} ${selectedAssignment.teacher.lastName}` : 'System'}
                  </Typography>
                </Grid>
              </Grid>

              {/* Guidelines Download */}
              {selectedAssignment.file && (
                <Card variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'rgba(27,63,107,0.03)', borderRadius: '12px' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Guidelines/Prompt Attachment</Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CloudDownload />}
                    onClick={() => handleDownloadAttachment(selectedAssignment.id, selectedAssignment.file)}
                  >
                    Download File
                  </Button>
                </Card>
              )}

              <Divider />

              {/* Submission Grade Panel */}
              {selectedAssignment.studentSubmission?.graded && (
                <Alert severity="success" icon={<Grade />} sx={{ borderRadius: '12px' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Graded Assignment Details</Typography>
                  <Typography variant="body2">
                    Score: <strong>{selectedAssignment.studentSubmission.marks} / {selectedAssignment.maxMarks}</strong>
                  </Typography>
                  {selectedAssignment.studentSubmission.feedback && (
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                      Teacher Feedback: "{selectedAssignment.studentSubmission.feedback}"
                    </Typography>
                  )}
                </Alert>
              )}

              {/* Submission Details/Upload Block */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 1.5 }}>
                  {selectedAssignment.studentSubmission ? 'My Submitted File' : 'Upload Submission'}
                </Typography>

                {selectedAssignment.studentSubmission ? (
                  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: '10px' }}>
                    <Typography variant="body2" noWrap sx={{ maxWidth: '70%', fontWeight: 500 }}>
                      📄 {selectedAssignment.studentSubmission.file ? selectedAssignment.studentSubmission.file.split('/').pop().split('?')[0] : 'Solution_Attachment.pdf'}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CloudDownload />}
                      onClick={() => handleDownloadSubmittedFile(selectedAssignment.studentSubmission.id, selectedAssignment.studentSubmission.file)}
                    >
                      Download solution
                    </Button>
                  </Box>
                ) : null}

                {/* File input (always show if not graded, allowing re-submission) */}
                {!selectedAssignment.studentSubmission?.graded && (
                  <Box>
                    <Card
                      variant="outlined"
                      sx={{
                        borderStyle: 'dashed',
                        borderColor: uploadFile ? 'secondary.main' : 'divider',
                        borderRadius: '12px',
                        textAlign: 'center',
                        p: 3.5,
                        bgcolor: 'action.hover',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: 'secondary.main',
                          bgcolor: 'action.selected',
                        }
                      }}
                    >
                      <input
                        style={{ display: 'none' }}
                        id="assignment-solution-upload"
                        type="file"
                        onChange={handleFileChange}
                      />
                      <label htmlFor="assignment-solution-upload" style={{ cursor: 'pointer' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                          <CloudUpload color="secondary" sx={{ fontSize: 40 }} />
                          <Button variant="contained" component="span" size="small" sx={{ borderRadius: '8px' }}>
                            {selectedAssignment.studentSubmission ? 'Replace File' : 'Choose File'}
                          </Button>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                            {uploadFile ? `Selected: ${uploadFile.name}` : 'Upload PDF, Word or Image solution (Max 10MB)'}
                          </Typography>
                        </Box>
                      </label>
                    </Card>

                    <TextField
                      label="Remarks (optional)"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Leave any comments or notes for your teacher..."
                      sx={{ mt: 2.5, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                  </Box>
                )}
              </Box>

            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={() => setDetailOpen(false)}>Close</Button>
              {!selectedAssignment.studentSubmission?.graded && (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitLoading}
                  sx={{
                    borderRadius: '10px',
                    px: 3,
                    background: 'linear-gradient(135deg, #1B3F6B, #F07830)',
                  }}
                >
                  {submitLoading ? 'Uploading...' : selectedAssignment.studentSubmission ? 'Resubmit Assignment' : 'Submit Assignment'}
                </Button>
              )}
            </DialogActions>
          </form>
        )}
      </Dialog>
    </Box>
  );
}
