import React, { useState, useEffect } from 'react';
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
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Add, Delete, Edit, Schedule, Room, People, Person, CheckCircle, Cancel } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { officeHourApi, courseApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { formatTime12Hour } from '../../utils/helpers';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function OfficeHoursPage() {
  const { user, accessToken } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  const [slots, setSlots] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    day: 'Monday',
    startTime: '14:00',
    endTime: '15:00',
    room: '',
    maxSlots: 5,
  });
  
  // Student view filter
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      setAuthHeader(accessToken);
      
      if (isTeacher) {
        // Teacher lists only their own slots
        const res = await officeHourApi.list({ teacherId: user.id });
        setSlots(res.data.data || []);
      } else if (isStudent) {
        // Load student's enrolled courses to extract teachers
        const courseRes = await courseApi.list({ studentId: user.id });
        const enrolledCourses = courseRes.data.data || [];
        setCourses(enrolledCourses);

        // Fetch office hours based on selected teacher filter
        const res = await officeHourApi.list({ teacherId: selectedTeacherId || undefined });
        setSlots(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load office hours');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchData();
    }
  }, [accessToken, selectedTeacherId]);

  // Extract unique teachers from student enrolled courses
  const studentTeachers = [];
  courses.forEach(c => {
    if (c.teacherId && c.teacherName && c.teacherName !== 'Not Assigned') {
      if (!studentTeachers.some(t => t.id === c.teacherId)) {
        studentTeachers.push({ id: c.teacherId, name: c.teacherName });
      }
    }
  });

  const handleOpenCreate = () => {
    setSelectedSlot(null);
    setFormData({
      day: 'Monday',
      startTime: '14:00',
      endTime: '15:00',
      room: '',
      maxSlots: 5,
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (slot) => {
    setSelectedSlot(slot);
    setFormData({
      day: slot.day || 'Monday',
      startTime: slot.startTime || '14:00',
      endTime: slot.endTime || '15:00',
      room: slot.room || '',
      maxSlots: slot.maxSlots || 5,
    });
    setOpenDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      const payload = {
        ...formData,
        maxSlots: parseInt(formData.maxSlots, 10),
      };

      if (selectedSlot) {
        await officeHourApi.update(selectedSlot.id, payload);
        toast.success('Office hours updated successfully');
      } else {
        await officeHourApi.create(payload);
        toast.success('Office hours slot created successfully');
      }

      setOpenDialog(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save slot');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTrigger = (slot) => {
    setSelectedSlot(slot);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSlot) return;
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      await officeHourApi.delete(selectedSlot.id);
      toast.success('Office hours slot deleted');
      setDeleteOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to delete slot');
    } finally {
      setActionLoading(false);
    }
  };

  // Student booking slot
  const handleBookSlot = async (slotId) => {
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      await officeHourApi.book(slotId);
      toast.success('Consultation slot booked successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book slot');
    } finally {
      setActionLoading(false);
    }
  };

  // Student or Teacher cancelling a booking
  const handleCancelBooking = async (slotId, bookingIndex) => {
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      await officeHourApi.cancel(slotId, bookingIndex);
      toast.success('Booking cancelled');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Teacher Office Hours"
        subtitle={isTeacher ? 'Manage your availability slots and view booked student consultations' : 'Browse available teacher slots and book consultations'}
        action={isTeacher ? handleOpenCreate : null}
        actionLabel="Add Availability Slot"
        actionIcon={<Add />}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 15 }}>
          <CircularProgress size={45} />
        </Box>
      ) : (
        <Box>
          {/* Student Filter */}
          {isStudent && (
            <Card sx={{ p: 2.5, mb: 4, borderRadius: '15px', border: '1px solid', borderColor: 'divider' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="teacher-filter-label">Filter by Teacher</InputLabel>
                    <Select
                      labelId="teacher-filter-label"
                      value={selectedTeacherId}
                      label="Filter by Teacher"
                      onChange={(e) => setSelectedTeacherId(e.target.value)}
                      sx={{ borderRadius: '10px' }}
                    >
                      <MenuItem value="">All Teachers</MenuItem>
                      {studentTeachers.map((t) => (
                        <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Select a class teacher to see their specific availability hours for academic consultations.
                  </Typography>
                </Grid>
              </Grid>
            </Card>
          )}

          {/* Availability Grid */}
          <Grid container spacing={3}>
            {slots.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '15px' }}>
                  <Typography variant="body1" color="text.secondary">
                    No available office hours declared.
                  </Typography>
                </Paper>
              </Grid>
            ) : (
              slots.map((slot) => {
                const activeBookings = (slot.bookings || []).filter((b) => b.status === 'booked');
                const studentBookingIndex = (slot.bookings || []).findIndex((b) => b.studentId === user.id && b.status === 'booked');
                const hasStudentBooked = studentBookingIndex !== -1;
                const isFullyBooked = activeBookings.length >= (slot.maxSlots || 5);

                return (
                  <Grid item xs={12} md={6} key={slot.id}>
                    <Card
                      sx={{
                        borderRadius: '20px',
                        border: '1px solid',
                        borderColor: hasStudentBooked ? 'primary.main' : 'divider',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.02)',
                        '&:hover': {
                          boxShadow: '0 12px 30px rgba(108, 99, 255, 0.06)',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                          <Box>
                            <Chip label={slot.day} color="primary" size="small" sx={{ borderRadius: '6px', fontWeight: 600, mr: 1 }} />
                            {isStudent && (
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 1 }}>
                                {slot.teacherName}
                              </Typography>
                            )}
                          </Box>
                          <Stack direction="row" spacing={1}>
                            {hasStudentBooked && (
                              <Chip label="Your Booking" color="success" size="small" sx={{ borderRadius: '6px', fontWeight: 700 }} />
                            )}
                            {isFullyBooked && !hasStudentBooked && (
                              <Chip label="Fully Booked" color="error" size="small" sx={{ borderRadius: '6px', fontWeight: 700 }} />
                            )}
                          </Stack>
                        </Stack>

                        <Grid container spacing={2} sx={{ mb: 2.5 }}>
                          <Grid item xs={6}>
                            <Stack direction="row" alignItems="center" spacing={1} color="text.secondary">
                              <Schedule fontSize="small" />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {formatTime12Hour(slot.startTime)} - {formatTime12Hour(slot.endTime)}
                              </Typography>
                            </Stack>
                          </Grid>
                          <Grid item xs={6}>
                            <Stack direction="row" alignItems="center" spacing={1} color="text.secondary">
                              <Room fontSize="small" />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {slot.room || 'No Room Assigned'}
                              </Typography>
                            </Stack>
                          </Grid>
                          <Grid item xs={6}>
                            <Stack direction="row" alignItems="center" spacing={1} color="text.secondary">
                              <People fontSize="small" />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Capacity: {activeBookings.length} / {slot.maxSlots || 5} slots
                              </Typography>
                            </Stack>
                          </Grid>
                        </Grid>

                        <Divider sx={{ my: 2 }} />

                        {/* Booking controls for Student */}
                        {isStudent && (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            {hasStudentBooked ? (
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<Cancel />}
                                onClick={() => handleCancelBooking(slot.id, studentBookingIndex)}
                                disabled={actionLoading}
                                sx={{ borderRadius: '8px' }}
                              >
                                Cancel Booking
                              </Button>
                            ) : (
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<CheckCircle />}
                                onClick={() => handleBookSlot(slot.id)}
                                disabled={isFullyBooked || actionLoading}
                                sx={{
                                  borderRadius: '8px',
                                  background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
                                }}
                              >
                                Book Consultation
                              </Button>
                            )}
                          </Box>
                        )}

                        {/* List Bookings for Teacher */}
                        {isTeacher && (
                          <Box>
                            <Box sx={{ display: 'flex', justify: 'space-between', mb: 1, alignItems: 'center' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Student Bookings ({activeBookings.length})</Typography>
                              <Box>
                                <IconButton color="primary" onClick={() => handleOpenEdit(slot)} size="small">
                                  <Edit fontSize="small" />
                                </IconButton>
                                <IconButton color="error" onClick={() => handleDeleteTrigger(slot)} size="small">
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>

                            {activeBookings.length === 0 ? (
                              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                No active student bookings for this slot.
                              </Typography>
                            ) : (
                              <List dense sx={{ bgcolor: 'action.hover', borderRadius: '10px', p: 1 }}>
                                {(slot.bookings || []).map((booking, bIdx) => {
                                  if (booking.status !== 'booked') return null;
                                  return (
                                    <ListItem key={bIdx} divider={bIdx < slot.bookings.length - 1}>
                                      <ListItemText
                                        primary={booking.studentName}
                                        secondary={booking.studentEmail}
                                        primaryTypographyProps={{ fontWeight: 700, fontSize: '0.8rem' }}
                                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                      />
                                      <ListItemSecondaryAction>
                                        <IconButton
                                          color="error"
                                          size="small"
                                          onClick={() => handleCancelBooking(slot.id, bIdx)}
                                        >
                                          <Cancel fontSize="small" />
                                        </IconButton>
                                      </ListItemSecondaryAction>
                                    </ListItem>
                                  );
                                })}
                              </List>
                            )}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })
            )}
          </Grid>
        </Box>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: '24px' } }}>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>
            {selectedSlot ? 'Edit Availability Slot' : 'Add Availability Slot'}
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, p: 3 }}>
            <FormControl fullWidth required>
              <InputLabel id="oh-day-label">Day of Week</InputLabel>
              <Select
                labelId="oh-day-label"
                value={formData.day}
                label="Day of Week"
                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                sx={{ borderRadius: '10px' }}
              >
                {DAYS_OF_WEEK.map((d) => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Start Time"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="End Time"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <TextField
              label="Room / Location (e.g. Cabin 4)"
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            <TextField
              label="Maximum Bookable Slots"
              type="number"
              value={formData.maxSlots}
              onChange={(e) => setFormData({ ...formData, maxSlots: e.target.value })}
              required
              fullWidth
              InputProps={{ inputProps: { min: 1, max: 20 } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
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
              Save Slot
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Slot Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Availability Slot"
        message="Are you sure you want to permanently delete this office hours slot? All active student bookings for this slot will be cancelled."
        confirmLabel="Delete"
        confirmColor="error"
        loading={actionLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
