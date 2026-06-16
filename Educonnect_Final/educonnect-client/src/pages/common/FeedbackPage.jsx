import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Tabs,
  Tab,
  CircularProgress,
  Paper,
  Divider,
  Alert,
  Stack,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Feedback, Star, Message, Send, CheckCircleOutline, StarBorder, Assignment } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { feedbackApi, courseApi, departmentApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

const FEEDBACK_CATEGORIES = [
  { value: 'teaching', label: 'Teaching Quality' },
  { value: 'content', label: 'Course Content' },
  { value: 'facilities', label: 'College Facilities' },
  { value: 'other', label: 'Other' }
];

export default function FeedbackPage() {
  const { user, accessToken } = useAuth();
  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Student Form states
  const [targetType, setTargetType] = useState('general'); // general, course, teacher
  const [targetId, setTargetId] = useState('');
  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState('other');

  // Admin states
  const [feedbacks, setFeedbacks] = useState([]);
  const [summary, setSummary] = useState({ averageRating: 0, totalResponses: 0, ratingDistribution: {} });
  const [selectedDeptId, setSelectedDeptId] = useState('');

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      setAuthHeader(accessToken);
      if (isStudent) {
        // Fetch student's enrolled courses to populate selectors
        const res = await courseApi.list({ studentId: user.id });
        setCourses(res.data.data || []);
      } else if (isAdmin) {
        // Load feedback logs, summary, and departments
        const [feedbackRes, summaryRes, deptRes] = await Promise.all([
          feedbackApi.list(),
          feedbackApi.getSummary(),
          departmentApi.list(),
        ]);
        setFeedbacks(feedbackRes.data.data || []);
        setSummary(summaryRes.data.data || { averageRating: 0, totalResponses: 0, ratingDistribution: {} });
        setDepartments(deptRes.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load feedback resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      if (isStudent || isAdmin) {
        fetchInitialData();
      } else {
        setLoading(false);
      }
    }
  }, [accessToken]);

  // Handle department feedback load for admin
  const handleDeptChange = async (deptId) => {
    setSelectedDeptId(deptId);
    setLoading(true);
    try {
      setAuthHeader(accessToken);
      if (deptId === '') {
        const [feedbackRes, summaryRes] = await Promise.all([
          feedbackApi.list(),
          feedbackApi.getSummary(),
        ]);
        setFeedbacks(feedbackRes.data.data || []);
        setSummary(summaryRes.data.data || { averageRating: 0, totalResponses: 0, ratingDistribution: {} });
      } else {
        const res = await feedbackApi.getDepartment(deptId);
        setFeedbacks(res.data.data.feedbacks || []);
        setSummary(res.data.data.summary || { averageRating: 0, totalResponses: 0, ratingDistribution: {} });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to filter by department');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      setAuthHeader(accessToken);
      
      const payload = {
        targetType,
        targetId: targetType === 'general' ? null : targetId,
        departmentId: user.profile?.departmentId || null,
        rating,
        comment,
        category,
      };

      await feedbackApi.submit(payload);
      toast.success('Feedback submitted anonymously! Thank you.');
      
      // Reset form
      setTargetType('general');
      setTargetId('');
      setRating(3);
      setComment('');
      setCategory('other');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Feedback submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Compile unique teachers list from student enrolled courses
  const studentTeachers = [];
  courses.forEach(c => {
    if (c.teacherId && c.teacherName && c.teacherName !== 'Not Assigned') {
      if (!studentTeachers.some(t => t.id === c.teacherId)) {
        studentTeachers.push({ id: c.teacherId, name: c.teacherName });
      }
    }
  });

  const getCourseTitle = (id) => {
    const c = courses.find((x) => x.id === id);
    return c ? c.title : 'General';
  };

  const getDeptName = (id) => {
    const d = departments.find((x) => x.id === id);
    return d ? d.name : 'All Streams';
  };

  if (!isStudent && !isAdmin) {
    return (
      <Box>
        <PageHeader
          title="College Feedback Portal"
          subtitle="Feedback access restriction"
        />
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px', border: '1px solid', borderColor: 'divider', mt: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Access Restricted</Typography>
          <Typography color="text.secondary">
            Only students can submit feedback, and only administrators can access feedback reports and metrics.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="College Feedback Portal"
        subtitle={isStudent ? 'Share your anonymous feedback to help improve the college' : 'Analyze students anonymous feedback and ratings metrics'}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 15 }}>
          <CircularProgress size={45} />
        </Box>
      ) : isStudent ? (
        /* Student submission view */
        <Grid container justifyContent="center">
          <Grid item xs={12} sm={8} md={6}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card
                sx={{
                  borderRadius: '24px',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 8px 32px rgba(108, 99, 255, 0.04)',
                  p: 3,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(108, 99, 255, 0.1)', color: '#6C63FF' }}>
                      <Feedback />
                    </Box>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>Anonymous Feedback</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Your identity will not be shared. Submissions are fully anonymized.
                      </Typography>
                    </Box>
                  </Box>

                  <form onSubmit={handleSubmitFeedback}>
                    <Stack spacing={3}>
                      <FormControl fullWidth>
                        <InputLabel id="target-type-label">Feedback Target</InputLabel>
                        <Select
                          labelId="target-type-label"
                          value={targetType}
                          label="Feedback Target"
                          onChange={(e) => {
                            setTargetType(e.target.value);
                            setTargetId('');
                          }}
                          sx={{ borderRadius: '10px' }}
                        >
                          <MenuItem value="general">General College/Campus</MenuItem>
                          <MenuItem value="course">Specific Course/Class</MenuItem>
                          <MenuItem value="teacher">Specific Teacher/Instructor</MenuItem>
                        </Select>
                      </FormControl>

                      {targetType === 'course' && (
                        <FormControl fullWidth required>
                          <InputLabel id="target-course-label">Select Course</InputLabel>
                          <Select
                            labelId="target-course-label"
                            value={targetId}
                            label="Select Course"
                            onChange={(e) => setTargetId(e.target.value)}
                            sx={{ borderRadius: '10px' }}
                          >
                            {courses.map((course) => (
                              <MenuItem key={course.id} value={course.id}>{course.title}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}

                      {targetType === 'teacher' && (
                        <FormControl fullWidth required>
                          <InputLabel id="target-teacher-label">Select Teacher</InputLabel>
                          <Select
                            labelId="target-teacher-label"
                            value={targetId}
                            label="Select Teacher"
                            onChange={(e) => setTargetId(e.target.value)}
                            sx={{ borderRadius: '10px' }}
                          >
                            {studentTeachers.map((teacher) => (
                              <MenuItem key={teacher.id} value={teacher.id}>{teacher.name}</MenuItem>
                            ))}
                            {studentTeachers.length === 0 && (
                              <MenuItem value="" disabled>No teachers mapped to your classes</MenuItem>
                            )}
                          </Select>
                        </FormControl>
                      )}

                      <FormControl fullWidth required>
                        <InputLabel id="category-label">Category</InputLabel>
                        <Select
                          labelId="category-label"
                          value={category}
                          label="Category"
                          onChange={(e) => setCategory(e.target.value)}
                          sx={{ borderRadius: '10px' }}
                        >
                          {FEEDBACK_CATEGORIES.map((cat) => (
                            <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Rating</Typography>
                        <Rating
                          value={rating}
                          onChange={(e, val) => setRating(val || 3)}
                          size="large"
                          emptyIcon={<StarBorder fontSize="inherit" />}
                        />
                      </Box>

                      <TextField
                        label="Comments/Suggestions"
                        multiline
                        rows={4}
                        placeholder="Please write constructive criticism, general suggestions or reviews..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                        fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                      />

                      <Button
                        type="submit"
                        variant="contained"
                        disabled={submitting}
                        startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Send />}
                        sx={{
                          py: 1.5,
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
                          fontWeight: 700,
                        }}
                      >
                        Submit Feedback
                      </Button>
                    </Stack>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      ) : (
        /* Admin analysis dashboard */
        <Box>
          <Grid container spacing={4} sx={{ mb: 4 }}>
            {/* Summary cards */}
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: '20px', height: '100%', border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>Average Score</Typography>
                  <Typography variant="h2" sx={{ fontWeight: 900, color: '#6C63FF', my: 2 }}>
                    {summary.averageRating || 0}
                  </Typography>
                  <Rating value={summary.averageRating || 0} precision={0.1} readOnly size="large" />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
                    Based on {summary.totalResponses || 0} student reviews
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Distribution Card */}
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: '20px', height: '100%', border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 2 }}>Rating Distribution</Typography>
                  <Stack spacing={1.5}>
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = summary.ratingDistribution?.[stars] || 0;
                      const pct = summary.totalResponses > 0 ? (count / summary.totalResponses) * 100 : 0;
                      return (
                        <Box key={stars} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography variant="caption" sx={{ minWidth: 40, fontWeight: 700 }}>
                            {stars} Stars
                          </Typography>
                          <Box sx={{ flexGrow: 1 }}>
                            <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3 }} />
                          </Box>
                          <Typography variant="caption" sx={{ minWidth: 20, textAlign: 'right', fontWeight: 600 }}>
                            {count}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Department Filter Card */}
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: '20px', height: '100%', border: '1px solid', borderColor: 'divider', p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <FormControl fullWidth>
                  <InputLabel id="dept-filter-label">Filter Stream</InputLabel>
                  <Select
                    labelId="dept-filter-label"
                    value={selectedDeptId}
                    label="Filter Stream"
                    onChange={(e) => handleDeptChange(e.target.value)}
                    sx={{ borderRadius: '10px' }}
                  >
                    <MenuItem value="">All Streams/Departments</MenuItem>
                    {departments.map((d) => (
                      <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
                  Filter dashboard logs and average ratings by academic department target
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Feedback Timeline comments logs */}
          <Card sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2.5 }}>Feedback Timeline Comments ({feedbacks.length})</Typography>
            
            {feedbacks.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No feedback entries recorded.</Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }} width="130px">Category</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} width="150px">Feedback Target</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} width="140px">Rating</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Comment Description</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} width="150px">Date Submitted</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {feedbacks.map((f, index) => {
                      const d = f.submittedAt ? (f.submittedAt._seconds ? new Date(f.submittedAt._seconds * 1000) : new Date(f.submittedAt)) : null;
                      const dateStr = d && !isNaN(d.getTime()) ? d.toLocaleDateString('en-GB') : ''; // dd/mm/yyyy format
                      return (
                        <TableRow key={index} hover>
                          <TableCell sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
                            {f.category}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.85rem' }}>
                            {f.targetDisplay || 'General'}
                          </TableCell>
                          <TableCell>
                            <Rating value={f.rating || 3} readOnly size="small" />
                          </TableCell>
                          <TableCell sx={{ fontStyle: 'italic', color: 'text.secondary', py: 1.5 }}>
                            "{f.comment}"
                          </TableCell>
                          <TableCell>{dateStr}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Box>
      )}
    </Box>
  );
}
