import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
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
  CircularProgress,
  Stack,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Alert,
  AlertTitle,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Add, Delete, Edit, CalendarToday, ErrorOutline, CheckCircleOutline, Room, AccessTime, Person, FilterList, School, Search } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { timetableApi, departmentApi, subjectApi, userApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { STREAMS } from '../../utils/constants';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Stream metadata for UI display
const STREAM_META = {
  '11th Science': { emoji: '🔬', color: '#2196f3', label: '11th Science' },
  '11th Commerce': { emoji: '📊', color: '#4caf50', label: '11th Commerce' },
  '12th Science': { emoji: '🔬', color: '#1565c0', label: '12th Science' },
  '12th Commerce': { emoji: '📊', color: '#2e7d32', label: '12th Commerce' },
};

export default function TimetablePage() {
  const { user, accessToken } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  const [timetables, setTimetables] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active view filters/states
  const [activeDay, setActiveDay] = useState('Monday');
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState(null);

  // Wizard / Form States
  const [formMeta, setFormMeta] = useState({
    departmentId: '',
    stream: '11th Science',
    section: 'A',
    academicYear: '2026-27',
  });
  
  // Schedule state: array of days, each day has array of slots
  const [scheduleData, setScheduleData] = useState(
    DAYS_OF_WEEK.map((d) => ({ day: d, slots: [] }))
  );
  const [formActiveDay, setFormActiveDay] = useState('Monday');
  const [conflicts, setConflicts] = useState([]);
  const [validationRun, setValidationRun] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Teacher/Student specific schedule state
  const [personalSchedule, setPersonalSchedule] = useState({});

  // Student class selector state
  const [selectedClass, setSelectedClass] = useState({
    departmentId: '',
    stream: '11th Science',
    section: 'A',
  });
  const [classLoading, setClassLoading] = useState(false);
  const [noTimetableFound, setNoTimetableFound] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      setAuthHeader(accessToken);
      
      const [deptRes, subRes] = await Promise.all([
        departmentApi.list(),
        subjectApi.list(),
      ]);
      const depts = deptRes.data.data || [];
      setDepartments(depts);
      setSubjects(subRes.data.data || []);

      if (isAdmin) {
        const [ttRes, userRes] = await Promise.all([
          timetableApi.list(),
          userApi.listUsers({ role: 'teacher' }),
        ]);
        setTimetables(ttRes.data.data || []);
        setTeachers(userRes.data.data || []);
      } else if (isTeacher) {
        const ttRes = await timetableApi.getTeacherSchedule(user.id);
        const compiled = compileTeacherSchedule(ttRes.data.data || []);
        setPersonalSchedule(compiled);
      } else if (isStudent) {
        // Initialize class selector from student profile
        const initClass = {
          departmentId: user?.profile?.departmentId || (depts[0]?.id ?? ''),
          stream: user?.profile?.stream || '11th Science',
          section: user?.profile?.section || 'A',
        };
        setSelectedClass(initClass);
        // Fetch timetable for the initial class
        if (initClass.departmentId) {
          const ttRes = await timetableApi.list({
            departmentId: initClass.departmentId,
            stream: initClass.stream,
            section: initClass.section,
          });
          const match = ttRes.data.data?.[0];
          if (match) {
            setPersonalSchedule(compileStudentSchedule(match));
            setNoTimetableFound(false);
          } else {
            setNoTimetableFound(true);
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load timetable details');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentTimetable = async (classFilter) => {
    if (!classFilter.departmentId) return;
    setClassLoading(true);
    setPersonalSchedule({});
    setNoTimetableFound(false);
    try {
      setAuthHeader(accessToken);
      const ttRes = await timetableApi.list({
        departmentId: classFilter.departmentId,
        stream: classFilter.stream,
        section: classFilter.section,
      });
      const match = ttRes.data.data?.[0];
      if (match) {
        setPersonalSchedule(compileStudentSchedule(match));
        setNoTimetableFound(false);
      } else {
        setNoTimetableFound(true);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch timetable for selected class');
    } finally {
      setClassLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchData();
    }
  }, [accessToken, user]);

  const compileTeacherSchedule = (timetablesList) => {
    const dailyMap = {};
    DAYS_OF_WEEK.forEach((d) => {
      dailyMap[d] = [];
    });

    timetablesList.forEach((tt) => {
      const dept = departments.find((d) => d.id === tt.departmentId);
      const deptName = dept ? `${dept.code} (${tt.stream}-${tt.section})` : 'Unknown';
      
      tt.schedule?.forEach((dayObj) => {
        const slots = dayObj.slots || [];
        slots.forEach((slot) => {
          if (slot.teacherId === user.id) {
            dailyMap[dayObj.day].push({
              ...slot,
              timetableId: tt.id,
              departmentName: deptName,
              academicYear: tt.academicYear,
            });
          }
        });
      });
    });

    // Sort slots by start time
    DAYS_OF_WEEK.forEach((d) => {
      dailyMap[d].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return dailyMap;
  };

  const compileStudentSchedule = (timetableObj) => {
    const dailyMap = {};
    DAYS_OF_WEEK.forEach((d) => {
      dailyMap[d] = [];
    });

    timetableObj.schedule?.forEach((dayObj) => {
      const slots = dayObj.slots || [];
      slots.forEach((slot) => {
        dailyMap[dayObj.day].push(slot);
      });
    });

    // Sort slots by start time
    DAYS_OF_WEEK.forEach((d) => {
      dailyMap[d].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return dailyMap;
  };

  const handleOpenCreate = () => {
    setSelectedTimetable(null);
    setFormMeta({
      departmentId: departments[0]?.id || '',
      stream: '11th Science',
      section: 'A',
      academicYear: '2026-27',
    });
    setScheduleData(DAYS_OF_WEEK.map((d) => ({ day: d, slots: [] })));
    setConflicts([]);
    setValidationRun(false);
    setFormActiveDay('Monday');
    setOpenDialog(true);
  };

  const handleEditClick = (tt) => {
    setSelectedTimetable(tt);
    setFormMeta({
      departmentId: tt.departmentId || '',
      stream: tt.stream || '11th Science',
      section: tt.section || 'A',
      academicYear: tt.academicYear || '2026-27',
    });
    
    // Construct full schedule with all days
    const fullSchedule = DAYS_OF_WEEK.map((d) => {
      const match = tt.schedule?.find((s) => s.day === d);
      return {
        day: d,
        slots: match ? [...match.slots] : [],
      };
    });
    setScheduleData(fullSchedule);
    setConflicts([]);
    setValidationRun(false);
    setFormActiveDay('Monday');
    setOpenDialog(true);
  };

  const handleAddSlot = () => {
    setScheduleData(
      scheduleData.map((d) => {
        if (d.day === formActiveDay) {
          return {
            ...d,
            slots: [
              ...d.slots,
              {
                subjectId: subjects[0]?.id || '',
                teacherId: teachers[0]?.id || '',
                startTime: '09:00',
                endTime: '10:00',
                room: '',
              },
            ],
          };
        }
        return d;
      })
    );
    setValidationRun(false);
  };

  const handleRemoveSlot = (index) => {
    setScheduleData(
      scheduleData.map((d) => {
        if (d.day === formActiveDay) {
          const updated = [...d.slots];
          updated.splice(index, 1);
          return { ...d, slots: updated };
        }
        return d;
      })
    );
    setValidationRun(false);
  };

  const handleSlotChange = (index, field, value) => {
    setScheduleData(
      scheduleData.map((d) => {
        if (d.day === formActiveDay) {
          const updated = [...d.slots];
          updated[index] = { ...updated[index], [field]: value };
          return { ...d, slots: updated };
        }
        return d;
      })
    );
    setValidationRun(false);
  };

  const handleValidate = async () => {
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      const res = await timetableApi.validate({
        schedule: scheduleData,
        departmentId: formMeta.departmentId,
      });
      setConflicts(res.data.data.conflicts || []);
      setValidationRun(true);
      if (res.data.data.hasConflicts) {
        toast.warning('Schedule conflicts detected!');
      } else {
        toast.success('No conflicts detected!');
      }
    } catch (err) {
      toast.error('Validation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formMeta.departmentId) {
      toast.error('Department is required');
      return;
    }

    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      const payload = {
        ...formMeta,
        schedule: scheduleData,
      };

      if (selectedTimetable) {
        await timetableApi.update(selectedTimetable.id, payload);
        toast.success('Timetable updated successfully');
      } else {
        await timetableApi.create(payload);
        toast.success('Timetable created successfully');
      }

      setOpenDialog(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save timetable');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTrigger = (tt) => {
    setSelectedTimetable(tt);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTimetable) return;
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      await timetableApi.delete(selectedTimetable.id);
      toast.success('Timetable deleted successfully');
      setDeleteOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to delete timetable');
    } finally {
      setActionLoading(false);
    }
  };

  const getSubjectName = (id) => {
    const sub = subjects.find((s) => s.id === id);
    return sub ? `${sub.name} (${sub.code})` : 'Unknown Subject';
  };

  const getTeacherName = (id) => {
    const t = teachers.find((u) => u.id === id);
    return t ? `${t.firstName} ${t.lastName}` : 'Unknown Teacher';
  };

  const getDeptName = (id) => {
    const dept = departments.find((d) => d.id === id);
    return dept ? dept.name : 'Unknown Department';
  };

  // Render teacher/student schedule timeline cards
  const renderScheduleTimeline = (slots = []) => {
    if (slots.length === 0) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, opacity: 0.8 }}>
          <CheckCircleOutline sx={{ fontSize: 48, color: 'success.main', mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>No Classes Scheduled</Typography>
          <Typography variant="body2" color="text.secondary">Enjoy your day off!</Typography>
        </Box>
      );
    }

    return (
      <Stack spacing={2}>
        {slots.map((slot, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Card
              sx={{
                borderRadius: '16px',
                borderLeft: '5px solid #6C63FF',
                boxShadow: '0 4px 20px rgba(108, 99, 255, 0.03)',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  boxShadow: '0 8px 30px rgba(108, 99, 255, 0.08)',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease',
                },
              }}
            >
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* Top row: Time on left, Room on right */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary' }}>
                      <AccessTime fontSize="small" color="primary" />
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {slot.startTime} - {slot.endTime}
                      </Typography>
                    </Stack>

                    {slot.room && (
                      <Chip
                        icon={<Room fontSize="small" />}
                        label={slot.room}
                        size="small"
                        sx={{
                          borderRadius: '10px',
                          bgcolor: 'rgba(108, 99, 255, 0.06)',
                          color: '#6C63FF',
                          fontWeight: 700,
                        }}
                      />
                    )}
                  </Box>

                  {/* Main section: Subject Name and Teacher/Department info */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                      {getSubjectName(slot.subjectId)}
                    </Typography>
                    {isStudent && (
                      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary' }}>
                        <Person sx={{ fontSize: '0.9rem' }} />
                        <Typography variant="caption">{getTeacherName(slot.teacherId)}</Typography>
                      </Stack>
                    )}
                    {isTeacher && slot.departmentName && (
                      <Chip 
                        label={slot.departmentName} 
                        size="small" 
                        variant="outlined" 
                        sx={{ borderRadius: '6px', fontWeight: 600, mt: 0.5 }} 
                      />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </Stack>
    );
  };

  return (
    <Box>
      <PageHeader
        title="Class Timetable"
        subtitle="View and manage weekly lecture structures and classroom locations"
        action={isAdmin ? handleOpenCreate : null}
        actionLabel="Create Timetable"
        actionIcon={<Add />}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 15 }}>
          <CircularProgress size={45} />
        </Box>
      ) : (
        <Box>
          {/* Admin Schedule List */}
          {isAdmin && (
            <Box sx={{ mb: 6 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2.5 }}>Published Timetables</Typography>
              <Grid container spacing={3}>
                {timetables.length === 0 ? (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '20px' }}>
                      <Typography variant="body1" color="text.secondary">
                        No timetables have been created yet. Click "Create Timetable" to set up the schedule.
                      </Typography>
                    </Paper>
                  </Grid>
                ) : (
                  timetables.map((tt) => {
                    const dept = departments.find((d) => d.id === tt.departmentId);
                    return (
                      <Grid item xs={12} sm={6} md={4} key={tt.id}>
                        <Card
                          sx={{
                            borderRadius: '20px',
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.03)',
                            '&:hover': { boxShadow: '0 12px 30px rgba(108, 99, 255, 0.08)' },
                          }}
                        >
                          <CardContent sx={{ p: 3 }}>
                            <Chip label={tt.academicYear} size="small" color="primary" sx={{ mb: 1.5, borderRadius: '6px', fontWeight: 600 }} />
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                              {dept ? dept.name : 'Unknown Department'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                              Class: <strong>{tt.stream}</strong> | Section: <strong>{tt.section}</strong>
                            </Typography>
                            
                            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                              <IconButton color="primary" size="small" onClick={() => handleEditClick(tt)}>
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton color="error" size="small" onClick={() => handleDeleteTrigger(tt)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })
                )}
              </Grid>
            </Box>
          )}

          {/* Student / Teacher Schedule Panel */}
          {(isStudent || isTeacher) && (
            <Box>
              {/* Student Class Selector */}
              {isStudent && (
                <Card
                  sx={{
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 4px 20px rgba(108, 99, 255, 0.05)',
                    p: 3,
                    mb: 3,
                    background: 'linear-gradient(135deg, rgba(108,99,255,0.03) 0%, rgba(63,81,181,0.03) 100%)',
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <School sx={{ fontSize: 20, color: '#fff' }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                        Select Class
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Choose a department, stream and section to view its timetable
                      </Typography>
                    </Box>
                  </Stack>

                  <Grid container spacing={2} alignItems="flex-end">
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="student-dept-label">Department</InputLabel>
                        <Select
                          labelId="student-dept-label"
                          value={selectedClass.departmentId}
                          label="Department"
                          onChange={(e) =>
                            setSelectedClass((prev) => ({ ...prev, departmentId: e.target.value }))
                          }
                          sx={{ borderRadius: '10px' }}
                        >
                          {departments.map((d) => (
                            <MenuItem key={d.id} value={d.id}>
                              {d.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="student-stream-label">Class</InputLabel>
                        <Select
                          labelId="student-stream-label"
                          value={selectedClass.stream}
                          label="Class"
                          onChange={(e) =>
                            setSelectedClass((prev) => ({ ...prev, stream: e.target.value }))
                          }
                          sx={{ borderRadius: '10px' }}
                        >
                          {STREAMS.map((s) => {
                            const meta = STREAM_META[s] || {};
                            return (
                              <MenuItem key={s} value={s}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Typography sx={{ fontSize: '0.95rem' }}>{meta.emoji}</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: meta.color }}>{s}</Typography>
                                </Stack>
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Section"
                        size="small"
                        fullWidth
                        value={selectedClass.section}
                        onChange={(e) =>
                          setSelectedClass((prev) => ({
                            ...prev,
                            section: e.target.value.toUpperCase(),
                          }))
                        }
                        placeholder="e.g. A"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={2}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={classLoading ? <CircularProgress size={16} color="inherit" /> : <Search />}
                        disabled={classLoading || !selectedClass.departmentId}
                        onClick={() => fetchStudentTimetable(selectedClass)}
                        sx={{
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
                          py: 1,
                          fontWeight: 700,
                          textTransform: 'none',
                        }}
                      >
                        {classLoading ? 'Loading...' : 'View'}
                      </Button>
                    </Grid>
                  </Grid>

                  {/* Quick-select own class chip */}
                  {user?.profile?.departmentId && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                        Quick select:
                      </Typography>
                      <Chip
                        label={`My Class — ${user.profile.stream} / ${user.profile.section}`}
                        size="small"
                        icon={<Person fontSize="small" />}
                        onClick={() => {
                          const myClass = {
                            departmentId: user.profile.departmentId,
                            stream: user.profile.stream,
                            section: user.profile.section,
                          };
                          setSelectedClass(myClass);
                          fetchStudentTimetable(myClass);
                        }}
                        sx={{
                          borderRadius: '8px',
                          fontWeight: 600,
                          bgcolor: 'rgba(108, 99, 255, 0.08)',
                          color: '#6C63FF',
                          '&:hover': { bgcolor: 'rgba(108, 99, 255, 0.15)' },
                          cursor: 'pointer',
                        }}
                      />
                    </Box>
                  )}
                </Card>
              )}

              {/* Schedule view card */}
              <Card
                sx={{
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 8px 32px rgba(108, 99, 255, 0.04)',
                  p: 3,
                }}
              >
                {classLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress size={40} />
                  </Box>
                ) : isStudent && noTimetableFound ? (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <CalendarToday sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                      No Timetable Found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      No timetable is currently published for{' '}
                      <strong>
                        {departments.find((d) => d.id === selectedClass.departmentId)?.name || 'this department'}
                        {' — '}{selectedClass.stream} / {selectedClass.section}
                      </strong>.
                    </Typography>
                  </Box>
                ) : isStudent && !selectedClass.departmentId ? (
                  <Alert severity="warning" variant="outlined" sx={{ borderRadius: '15px' }}>
                    <AlertTitle sx={{ fontWeight: 700 }}>Select a Class</AlertTitle>
                    Please choose a Department, Stream, and Section above and click "View" to load the timetable.
                  </Alert>
                ) : (
                  <Box>
                    {isStudent && (
                      <Box sx={{ mb: 2.5 }}>
                        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" gap={1}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                            Showing timetable for:
                          </Typography>
                          <Chip
                            label={departments.find((d) => d.id === selectedClass.departmentId)?.name || 'Department'}
                            size="small"
                            color="primary"
                            sx={{ borderRadius: '6px', fontWeight: 600 }}
                          />
                          <Chip
                            label={selectedClass.stream}
                            size="small"
                            variant="outlined"
                            sx={{ borderRadius: '6px', fontWeight: 600 }}
                          />
                          <Chip
                            label={`Section ${selectedClass.section}`}
                            size="small"
                            variant="outlined"
                            sx={{ borderRadius: '6px', fontWeight: 600 }}
                          />
                        </Stack>
                        <Divider sx={{ mt: 2 }} />
                      </Box>
                    )}
                    {isMobile ? (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                          <InputLabel id="day-select-label">Select Day</InputLabel>
                          <Select
                            labelId="day-select-label"
                            value={activeDay}
                            label="Select Day"
                            onChange={(e) => setActiveDay(e.target.value)}
                            sx={{ borderRadius: '10px', fontWeight: 700 }}
                          >
                            {DAYS_OF_WEEK.map((d) => (
                              <MenuItem key={d} value={d} sx={{ fontWeight: 600 }}>
                                {d}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    ) : (
                      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3.5 }}>
                        <Tabs
                          value={activeDay}
                          onChange={(e, val) => setActiveDay(val)}
                          variant="scrollable"
                          scrollButtons="auto"
                          textColor="primary"
                          indicatorColor="primary"
                        >
                          {DAYS_OF_WEEK.map((d) => (
                            <Tab
                              key={d}
                              label={d}
                              value={d}
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                textTransform: 'none',
                              }}
                            />
                          ))}
                        </Tabs>
                      </Box>
                    )}

                    {renderScheduleTimeline(personalSchedule[activeDay] || [])}
                  </Box>
                )}
              </Card>
            </Box>
          )}
        </Box>
      )}

      {/* Create / Edit Timetable Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: '24px' } }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>
            {selectedTimetable ? 'Update Timetable' : 'Create New Timetable'}
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            {/* ── Class Selection Block ── */}
            <Box
              sx={{
                borderRadius: '16px',
                border: '1.5px solid',
                borderColor: 'primary.light',
                background: 'linear-gradient(135deg, rgba(108,99,255,0.04) 0%, rgba(63,81,181,0.04) 100%)',
                p: 2.5,
                mb: 3.5,
              }}
            >
              {/* Block header */}
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                alignItems={{ xs: 'flex-start', sm: 'center' }} 
                spacing={1.5} 
                sx={{ mb: 2 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <School sx={{ fontSize: 18, color: '#fff' }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                      Class Details
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Select the class this timetable belongs to
                    </Typography>
                  </Box>
                </Box>
                {/* Live preview chip */}
                {formMeta.departmentId && (
                  <Chip
                    label={`${departments.find((d) => d.id === formMeta.departmentId)?.code || ''} · ${formMeta.stream} · Sec ${formMeta.section} · ${formMeta.academicYear}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ 
                      borderRadius: '8px', 
                      fontWeight: 700, 
                      fontSize: '0.72rem',
                      mt: { xs: 1, sm: 0 },
                      alignSelf: { xs: 'flex-start', sm: 'center' },
                      maxWidth: '100%',
                    }}
                  />
                )}
              </Stack>

              <Divider sx={{ mb: 2.5 }} />

              {/* Selectors */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth required size="small">
                    <InputLabel id="tt-dept-label">Department</InputLabel>
                    <Select
                      labelId="tt-dept-label"
                      value={formMeta.departmentId}
                      label="Department"
                      onChange={(e) => setFormMeta({ ...formMeta, departmentId: e.target.value })}
                      sx={{ borderRadius: '10px' }}
                    >
                      {departments.map((d) => (
                        <MenuItem key={d.id} value={d.id}>
                          <Stack>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.name}</Typography>
                            {d.code && <Typography variant="caption" color="text.secondary">{d.code}</Typography>}
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth required size="small">
                    <InputLabel id="tt-stream-label">Class</InputLabel>
                    <Select
                      labelId="tt-stream-label"
                      value={formMeta.stream}
                      label="Class"
                      onChange={(e) => setFormMeta({ ...formMeta, stream: e.target.value })}
                      sx={{ borderRadius: '10px' }}
                    >
                      {STREAMS.map((s) => {
                        const meta = STREAM_META[s] || {};
                        return (
                          <MenuItem key={s} value={s}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography sx={{ fontSize: '1rem' }}>{meta.emoji}</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: meta.color }}>
                                {s}
                              </Typography>
                            </Stack>
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Section"
                    value={formMeta.section}
                    onChange={(e) =>
                      setFormMeta({ ...formMeta, section: e.target.value.toUpperCase() })
                    }
                    required
                    fullWidth
                    size="small"
                    placeholder="e.g. A"
                    inputProps={{ maxLength: 3 }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    helperText="Class section identifier"
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth required size="small">
                    <InputLabel id="tt-year-label">Academic Year</InputLabel>
                    <Select
                      labelId="tt-year-label"
                      value={formMeta.academicYear}
                      label="Academic Year"
                      onChange={(e) =>
                        setFormMeta({ ...formMeta, academicYear: e.target.value })
                      }
                      sx={{ borderRadius: '10px' }}
                    >
                      <MenuItem value="2025-26">2025-26</MenuItem>
                      <MenuItem value="2026-27">2026-27</MenuItem>
                      <MenuItem value="2027-28">2027-28</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

            </Box>

            {/* Validation Conflicts Alert */}
            {validationRun && (
              <Box sx={{ mb: 3 }}>
                {conflicts.length > 0 ? (
                  <Alert severity="error" variant="outlined" sx={{ borderRadius: '14px' }}>
                    <AlertTitle sx={{ fontWeight: 700 }}>Conflict Detection Warnings ({conflicts.length})</AlertTitle>
                    <Stack spacing={0.5}>
                      {conflicts.map((c, idx) => (
                        <Typography key={idx} variant="caption" display="block">
                          • <strong>{c.day} @ {c.time}</strong>: {c.message} {c.room ? `(Room: ${c.room})` : `(Teacher: ${getTeacherName(c.teacher)})`}
                        </Typography>
                      ))}
                    </Stack>
                  </Alert>
                ) : (
                  <Alert severity="success" variant="outlined" sx={{ borderRadius: '14px' }}>
                    <AlertTitle sx={{ fontWeight: 700 }}>Validation Complete</AlertTitle>
                    No schedule collisions or teacher double-booking conflicts detected.
                  </Alert>
                )}
              </Box>
            )}

            {/* Schedule Slot Switcher & Builder */}
            <Box>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                  value={formActiveDay}
                  onChange={(e, val) => setFormActiveDay(val)}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <Tab key={d} label={d} value={d} sx={{ fontWeight: 700 }} />
                  ))}
                </Tabs>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                  {formActiveDay} Period Slots ({scheduleData.find((d) => d.day === formActiveDay)?.slots.length || 0})
                </Typography>
                <Button variant="outlined" size="small" startIcon={<Add />} onClick={handleAddSlot}>
                  Add Period Slot
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '14px' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Teacher</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} width="130px">Start Time</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} width="130px">End Time</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} width="120px">Room</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center" width="60px">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(scheduleData.find((d) => d.day === formActiveDay)?.slots || []).map((slot, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <FormControl fullWidth size="small">
                            <Select
                              value={slot.subjectId}
                              onChange={(e) => handleSlotChange(index, 'subjectId', e.target.value)}
                            >
                              {subjects.map((s) => (
                                <MenuItem key={s.id} value={s.id}>{s.name} ({s.code})</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small">
                            <Select
                              value={slot.teacherId}
                              onChange={(e) => handleSlotChange(index, 'teacherId', e.target.value)}
                            >
                              {teachers.map((t) => (
                                <MenuItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="time"
                            size="small"
                            fullWidth
                            value={slot.startTime}
                            onChange={(e) => handleSlotChange(index, 'startTime', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="time"
                            size="small"
                            fullWidth
                            value={slot.endTime}
                            onChange={(e) => handleSlotChange(index, 'endTime', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            placeholder="Room 101"
                            fullWidth
                            value={slot.room}
                            onChange={(e) => handleSlotChange(index, 'room', e.target.value)}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton color="error" size="small" onClick={() => handleRemoveSlot(index)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(scheduleData.find((d) => d.day === formActiveDay)?.slots.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No period slots defined. Click "Add Period Slot" to build.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button variant="outlined" onClick={handleValidate} disabled={actionLoading} sx={{ borderRadius: '10px' }}>
              Check Conflicts
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={actionLoading}
              sx={{
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
                px: 3,
              }}
            >
              Save Timetable
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Timetable"
        message="Are you sure you want to permanently delete this timetable? This will remove it for all students and teachers in this department."
        confirmLabel="Delete"
        confirmColor="error"
        loading={actionLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
