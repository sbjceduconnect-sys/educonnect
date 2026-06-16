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
  CardActions,
  Button,
  Divider,
  Paper,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  EventNote,
  Score,
  AccessTime,
  Book,
  CalendarMonth,
  NotificationImportant,
  ListAlt,
  School,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { examApi, courseApi, subjectApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';


export default function StudentExamsPage() {
  const { user, accessToken } = useAuth();
  const theme = useTheme();

  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      setAuthHeader(accessToken);
      // Fetch only exams relevant to this student, plus all courses and subjects to resolve details
      const [examRes, courseRes, subjectRes] = await Promise.all([
        examApi.list({ studentId: user.id }),
        courseApi.list({ studentId: user.id }),
        subjectApi.list(),
      ]);

      setExams(examRes.data.data || []);
      setCourses(courseRes.data.data || []);
      setSubjects(subjectRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load examination schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken && user?.id) {
      fetchData();
    }
  }, [accessToken, user?.id]);

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

  // Filter exams into upcoming and past
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingExams = exams
    .filter((e) => new Date(e.examDate) >= today)
    .sort((a, b) => new Date(a.examDate) - new Date(b.examDate));

  const pastExams = exams
    .filter((e) => new Date(e.examDate) < today)
    .sort((a, b) => new Date(b.examDate) - new Date(a.examDate));

  // Determine the next exam
  const nextExam = upcomingExams[0] || null;

  // Format date helper
  const formatDateString = (dateStr) => {
    if (!dateStr) return 'TBD';
    return formatDate(dateStr, 'DD/MM/YYYY');
  };

  // Columns for DataTable
  const columns = [
    {
      field: 'title',
      headerName: 'Exam Title',
      flex: 1.2,
      renderCell: ({ row }) => (
        <Typography sx={{ fontWeight: 600 }}>{row.title}</Typography>
      ),
    },
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
    {
      field: 'courseId',
      headerName: 'Course/Class',
      flex: 1.2,
      valueGetter: ({ row }) => getCourseName(row.courseId),
    },
    {
      field: 'subjectId',
      headerName: 'Subject',
      flex: 1,
      valueGetter: ({ row }) => getSubjectName(row.subjectId),
    },
    {
      field: 'examDate',
      headerName: 'Exam Date',
      flex: 1,
      valueGetter: ({ row }) => (row.examDate ? formatDate(row.examDate, 'DD/MM/YYYY') : ''),
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventNote fontSize="small" color="action" />
          <Typography variant="body2">
            {row.examDate ? formatDateString(row.examDate) : 'TBD'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'duration',
      headerName: 'Duration',
      flex: 0.8,
      renderCell: ({ value }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <AccessTime fontSize="small" color="action" />
          <Typography variant="body2">{value || 'N/A'}</Typography>
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
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="My Examinations"
        subtitle="Track scheduled exams, check dates, subject syllabus, and format patterns"
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Key Indicators */}
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Total Scheduled Exams"
              value={exams.length}
              icon={<ListAlt />}
              color="#6C63FF"
              description="Total examinations this academic year"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Upcoming Exams"
              value={upcomingExams.length}
              icon={<CalendarMonth />}
              color="#4CAF50"
              description="Pending examinations scheduled next"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Next Exam"
              value={nextExam ? formatDateString(nextExam.examDate) : 'None Scheduled'}
              icon={<NotificationImportant />}
              color="#FF9800"
              description={nextExam ? `${nextExam.title} (${getSubjectName(nextExam.subjectId)})` : 'Keep studying!'}
            />
          </Grid>

          {/* Tabs for Upcoming vs All */}
          <Grid item xs={12}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                mb: 3,
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTabs-indicator': {
                  background: 'linear-gradient(90deg, #6C63FF, #3F51B5)',
                },
              }}
            >
              <Tab label={`Upcoming Exams (${upcomingExams.length})`} sx={{ fontWeight: 600, textTransform: 'none' }} />
              <Tab label={`Past Exams (${pastExams.length})`} sx={{ fontWeight: 600, textTransform: 'none' }} />
              <Tab label={`All Scheduled Exams (${exams.length})`} sx={{ fontWeight: 600, textTransform: 'none' }} />
            </Tabs>

            {/* Tab 0: Upcoming Exams Cards */}
            {activeTab === 0 && (
              <Box>
                {upcomingExams.length === 0 ? (
                  <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                    <Typography color="text.secondary">No upcoming exams scheduled at this time.</Typography>
                  </Paper>
                ) : (
                  <Grid container spacing={3}>
                    {upcomingExams.map((exam) => (
                      <Grid item xs={12} sm={6} md={4} key={exam.id}>
                        <Card
                          sx={{
                            borderRadius: '16px',
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: '0 8px 24px rgba(108, 99, 255, 0.1)',
                            },
                          }}
                        >
                          <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Chip
                                label={exam.examType}
                                color={exam.examType === 'final' ? 'error' : 'primary'}
                                size="small"
                                sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                {exam.academicYear}
                              </Typography>
                            </Box>

                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, height: 56, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {exam.title}
                            </Typography>

                            <Divider sx={{ my: 1.5 }} />

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Book fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Subject:</strong> {getSubjectName(exam.subjectId)}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <School fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Class/Course:</strong> {getCourseName(exam.courseId)}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EventNote fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Date:</strong> {formatDateString(exam.examDate)}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccessTime fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Duration:</strong> {exam.duration || 'N/A'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Score fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Max Marks:</strong> {exam.maxMarks}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}

            {/* Tab 1: Past Exams List/Cards */}
            {activeTab === 1 && (
              <Box>
                {pastExams.length === 0 ? (
                  <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                    <Typography color="text.secondary">No past exams found.</Typography>
                  </Paper>
                ) : (
                  <Grid container spacing={3}>
                    {pastExams.map((exam) => (
                      <Grid item xs={12} sm={6} md={4} key={exam.id}>
                        <Card
                          sx={{
                            borderRadius: '16px',
                            border: '1px solid',
                            borderColor: 'divider',
                            opacity: 0.85,
                            bgcolor: 'action.hover',
                          }}
                        >
                          <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Chip
                                label={exam.examType}
                                color="default"
                                size="small"
                                sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Completed
                              </Typography>
                            </Box>

                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, height: 56, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {exam.title}
                            </Typography>

                            <Divider sx={{ my: 1.5 }} />

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Book fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Subject:</strong> {getSubjectName(exam.subjectId)}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <School fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Class/Course:</strong> {getCourseName(exam.courseId)}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EventNote fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Date:</strong> {formatDateString(exam.examDate)}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}

            {/* Tab 2: All Exams Data Table */}
            {activeTab === 2 && (
              <Box>
                <DataTable
                  rows={exams}
                  columns={columns}
                  loading={loading}
                  searchPlaceholder="Search exams by title..."
                  searchField="title"
                  exportFilename="my_exams_schedule.csv"
                />
              </Box>
            )}
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
