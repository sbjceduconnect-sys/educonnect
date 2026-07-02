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
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import { Save, CheckCircle, Assessment } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { examApi, courseApi, resultApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

export default function ResultEntryPage() {
  const { user, accessToken } = useAuth();
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);
  
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [marksData, setMarksData] = useState({}); // studentId: { marksObtained: '', remarks: '' }
  const [isPublished, setIsPublished] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Helper to calculate grade in real-time
  const getGradeInfo = (marks, maxMarks) => {
    const numericMarks = parseFloat(marks);
    if (isNaN(numericMarks) || maxMarks <= 0) return { grade: '-', remark: '' };
    
    const percentage = (numericMarks / maxMarks) * 100;
    if (percentage >= 90) return { grade: 'A+', remark: 'Outstanding' };
    if (percentage >= 80) return { grade: 'A', remark: 'Excellent' };
    if (percentage >= 70) return { grade: 'B', remark: 'Good' };
    if (percentage >= 60) return { grade: 'C', remark: 'Average' };
    if (percentage >= 50) return { grade: 'D', remark: 'Pass' };
    return { grade: 'F', remark: 'Fail' };
  };

  // Fetch teacher's exams
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setAuthHeader(accessToken);
        const res = await examApi.list({ teacherId: user.role === 'admin' ? undefined : user.id });
        setExams(res.data.data || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load exams');
      }
    };
    if (accessToken) {
      fetchExams();
    }
  }, [accessToken]);

  // Fetch students & existing results when exam changes
  useEffect(() => {
    const fetchExamDetails = async () => {
      if (!selectedExamId) {
        setSelectedExam(null);
        setStudents([]);
        return;
      }

      setStudentsLoading(true);
      try {
        setAuthHeader(accessToken);
        const examObj = exams.find((e) => e.id === selectedExamId);
        setSelectedExam(examObj);

        // Fetch enrolled students for the course
        const studentRes = await courseApi.getStudents(examObj.courseId);
        const enrolledStudents = studentRes.data.data || [];
        setStudents(enrolledStudents);

        // Fetch existing results for this exam
        const resultRes = await resultApi.getByExam(selectedExamId);
        const existingResults = resultRes.data.data || [];

        // Map existing results to marksData structure
        const initialMarks = {};
        let publishedStatus = false;
        
        enrolledStudents.forEach((student) => {
          const match = existingResults.find((r) => r.studentId === student.id);
          initialMarks[student.id] = {
            marksObtained: match ? String(match.marksObtained) : '',
            remarks: match ? match.remarks || '' : '',
            resultId: match ? match.id : null,
          };
          if (match && match.isPublished) {
            publishedStatus = true;
          }
        });

        setMarksData(initialMarks);
        setIsPublished(publishedStatus);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load students or existing results');
      } finally {
        setStudentsLoading(false);
      }
    };

    fetchExamDetails();
  }, [selectedExamId, accessToken]);

  const handleMarksChange = (studentId, value) => {
    const maxVal = selectedExam ? selectedExam.maxMarks : 100;
    const numericVal = parseFloat(value);
    
    if (value !== '' && (isNaN(numericVal) || numericVal < 0 || numericVal > maxVal)) {
      toast.error(`Marks must be between 0 and ${maxVal}`);
      return;
    }

    setMarksData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marksObtained: value,
      },
    }));
  };

  const handleRemarksChange = (studentId, value) => {
    setMarksData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks: value,
      },
    }));
  };

  // Save/Enter results batch
  const handleSaveResults = async () => {
    if (!selectedExamId || !selectedExam) return;
    setActionLoading(true);

    try {
      setAuthHeader(accessToken);
      
      const payload = Object.keys(marksData)
        .filter((studentId) => marksData[studentId].marksObtained !== '')
        .map((studentId) => {
          const data = marksData[studentId];
          const gradeInfo = getGradeInfo(data.marksObtained, selectedExam.maxMarks);
          
          return {
            id: data.resultId, // send resultId if updating
            examId: selectedExamId,
            studentId,
            subjectId: selectedExam.subjectId,
            courseId: selectedExam.courseId,
            marksObtained: parseFloat(data.marksObtained),
            maxMarks: selectedExam.maxMarks,
            grade: gradeInfo.grade,
            remarks: data.remarks || gradeInfo.remark,
          };
        });

      if (payload.length === 0) {
        toast.error('No marks entered to save');
        setActionLoading(false);
        return;
      }

      await resultApi.enter(payload);
      toast.success('Results saved successfully!');
      
      // Reload exam details to refresh result IDs
      const resultRes = await resultApi.getByExam(selectedExamId);
      const existingResults = resultRes.data.data || [];
      setMarksData((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((studentId) => {
          const match = existingResults.find((r) => r.studentId === studentId);
          if (match) {
            updated[studentId].resultId = match.id;
          }
        });
        return updated;
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save results');
    } finally {
      setActionLoading(false);
    }
  };

  // Publish results
  const handlePublishResults = async () => {
    if (!selectedExamId) return;
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      await resultApi.publish(selectedExamId);
      setIsPublished(true);
      toast.success('Exam results published to student portals!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish results');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader title="Result Entry Panel" subtitle="Enter exam marks, calculate grades, and publish results to students" />

      {/* Select Exam Card */}
      <Card sx={{ borderRadius: '16px', mb: 4, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <FormControl fullWidth>
                <InputLabel id="result-exam-label">Select Scheduled Exam</InputLabel>
                <Select
                  labelId="result-exam-label"
                  value={selectedExamId}
                  label="Select Scheduled Exam"
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  sx={{ borderRadius: '10px' }}
                >
                  {exams.map((exam) => (
                    <MenuItem key={exam.id} value={exam.id}>
                      {exam.title} {exam.subjectCode ? `[${exam.subjectCode}]` : ''} (Max Marks: {exam.maxMarks})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {selectedExam && (
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Exam Type: <strong style={{ textTransform: 'capitalize' }}>{selectedExam.examType}</strong>
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Max Marks: <strong>{selectedExam.maxMarks}</strong>
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Marks Table */}
      <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Student Grades Register</Typography>
            {isPublished && (
              <Chip label="Published" color="success" size="small" sx={{ fontWeight: 700 }} />
            )}
          </Box>
          
          <Divider />

          {studentsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          ) : students.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">Please select an exam to load student listings.</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Roll No</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Marks Obtained (/{selectedExam?.maxMarks})</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Grade</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => {
                    const studentMarks = marksData[student.id] || { marksObtained: '', remarks: '' };
                    const gradeInfo = getGradeInfo(studentMarks.marksObtained, selectedExam.maxMarks);
                    
                    return (
                      <TableRow key={student.id} hover>
                        <TableCell>{student.profile?.enrollmentNo || 'N/A'}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{student.firstName} {student.lastName}</TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            placeholder="Enter marks"
                            value={studentMarks.marksObtained}
                            onChange={(e) => handleMarksChange(student.id, e.target.value)}
                            disabled={isPublished && user?.role !== 'admin'}
                            InputProps={{ inputProps: { min: 0, max: selectedExam?.maxMarks } }}
                            sx={{ width: 130, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={gradeInfo.grade}
                            color={gradeInfo.grade === 'F' ? 'error' : gradeInfo.grade === '-' ? 'default' : 'primary'}
                            size="small"
                            sx={{ fontWeight: 700, minWidth: 40 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            placeholder={gradeInfo.remark || 'Add comments'}
                            value={studentMarks.remarks}
                            onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                            disabled={isPublished && user?.role !== 'admin'}
                            sx={{ width: '100%', maxWidth: 300, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Divider />

          <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', gap: 2, alignItems: 'center' }}>
            {isPublished && user?.role === 'admin' && (
              <Typography variant="body2" color="warning.main" sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, mr: 'auto' }}>
                ⚠️ Notice: Results are published. You are editing live grades.
              </Typography>
            )}
            {(!isPublished || user?.role === 'admin') && (
              <Button
                variant="outlined"
                onClick={handleSaveResults}
                disabled={actionLoading || students.length === 0}
                startIcon={<Save />}
                sx={{ borderRadius: '10px', px: 3 }}
              >
                {isPublished ? 'Save Published Changes' : 'Save Draft Marks'}
              </Button>
            )}
            <Button
              variant="contained"
              onClick={handlePublishResults}
              disabled={actionLoading || students.length === 0 || isPublished}
              startIcon={<CheckCircle />}
              sx={{
                borderRadius: '10px',
                px: 3.5,
                background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
              }}
            >
              Publish Results
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
