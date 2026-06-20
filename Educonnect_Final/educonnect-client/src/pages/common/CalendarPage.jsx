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
  Divider,
} from '@mui/material';
import { Add, Delete, Edit, CalendarMonth, LocalActivity, School, EventAvailable } from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useAuth } from '../../contexts/AuthContext';
import { calendarApi, departmentApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';

export default function CalendarPage() {
  const { user, accessToken } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [events, setEvents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    type: 'academic', // academic, holiday, exam, event
    academicYear: '2026-27',
    departmentId: '',
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      setAuthHeader(accessToken);
      const [eventRes, deptRes] = await Promise.all([
        calendarApi.list(),
        departmentApi.list(),
      ]);
      setEvents(eventRes.data.data || []);
      setDepartments(deptRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchEvents();
    }
  }, [accessToken]);

  // Transform events for FullCalendar format
  const mappedEvents = events.map((e) => {
    let color = '#6C63FF'; // Primary blue
    if (e.type === 'holiday') color = '#EF5350'; // Red
    if (e.type === 'exam') color = '#FFA726'; // Orange
    if (e.type === 'event') color = '#66BB6A'; // Green

    return {
      id: e.id,
      title: e.title,
      start: e.startDate ? e.startDate.split('T')[0] : '',
      end: e.endDate ? e.endDate.split('T')[0] : '',
      color,
      allDay: true,
      extendedProps: {
        description: e.description || '',
        type: e.type || 'academic',
        academicYear: e.academicYear || '2026-27',
        departmentId: e.departmentId || '',
      },
    };
  });

  const handleDateClick = (arg) => {
    if (!isAdmin) return;
    setSelectedEvent(null);
    setFormData({
      title: '',
      description: '',
      startDate: arg.dateStr,
      endDate: arg.dateStr,
      type: 'academic',
      academicYear: '2026-27',
      departmentId: '',
    });
    setOpenDialog(true);
  };

  const handleEventClick = (info) => {
    const matched = events.find((e) => String(e.id) === String(info.event.id));
    if (!matched) return;
    setSelectedEvent(matched);
    setFormData({
      title: matched.title || '',
      description: matched.description || '',
      startDate: matched.startDate ? matched.startDate.split('T')[0] : '',
      endDate: matched.endDate ? matched.endDate.split('T')[0] : '',
      type: matched.type || 'academic',
      academicYear: matched.academicYear || '2026-27',
      departmentId: matched.departmentId || '',
    });
    setOpenDialog(true);
  };

  const handleOpenCreate = () => {
    setSelectedEvent(null);
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      title: '',
      description: '',
      startDate: today,
      endDate: today,
      type: 'academic',
      academicYear: '2026-27',
      departmentId: '',
    });
    setOpenDialog(true);
  };

  const handleDeleteTrigger = () => {
    setDeleteOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.startDate) {
      toast.error('Title and start date are required');
      return;
    }

    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      const payload = {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate || formData.startDate,
        type: formData.type,
        academicYear: formData.academicYear,
        departmentId: formData.departmentId || null,
      };

      if (selectedEvent) {
        await calendarApi.update(selectedEvent.id, payload);
        toast.success('Event updated successfully');
      } else {
        await calendarApi.create(payload);
        toast.success('Event created successfully');
      }

      setOpenDialog(false);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save calendar event');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEvent) return;
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      await calendarApi.delete(selectedEvent.id);
      toast.success('Event deleted successfully');
      setDeleteOpen(false);
      setOpenDialog(false);
      fetchEvents();
    } catch (err) {
      toast.error('Failed to delete event');
    } finally {
      setActionLoading(false);
    }
  };

  const getDepartmentName = (deptId) => {
    const dept = departments.find((d) => d.id === deptId);
    return dept ? dept.name : 'All Departments';
  };

  return (
    <Box>
      <PageHeader
        title="Academic Calendar"
        subtitle="View holiday schedules, exam dates, academic deadlines, and college activities"
        action={isAdmin ? handleOpenCreate : null}
        actionLabel="Add Calendar Event"
        actionIcon={<Add />}
      />

      <Grid container spacing={3}>
        {/* FullCalendar Card */}
        <Grid item xs={12} md={9}>
          <Card
            sx={{
              borderRadius: '20px',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 8px 32px rgba(108, 99, 255, 0.04)',
              p: 3,
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress size={45} />
              </Box>
            ) : (
              <Box
                sx={{
                  '& .fc': {
                    fontFamily: 'Inter, sans-serif',
                  },
                  '& .fc-toolbar-title': {
                    fontSize: '1.25rem',
                    fontWeight: 800,
                  },
                  '& .fc-button-primary': {
                    background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    boxShadow: 'none',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5b52e6, #32419c)',
                    },
                    '&:disabled': {
                      background: 'action.disabled',
                    },
                  },
                  '& .fc-daygrid-event': {
                    borderRadius: '6px',
                    padding: '2px 4px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    display: 'block',
                  },
                  '& .fc-event-title': {
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  },
                  '& .fc-col-header-cell': {
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1E1E38' : '#F1F3F9',
                    py: 1,
                  },
                  '& .fc-col-header-cell-cushion': {
                    color: (theme) => theme.palette.mode === 'dark' ? '#E8E8F0' : '#1A1A2E',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    textDecoration: 'none !important',
                  },
                }}
              >
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek',
                  }}
                  events={mappedEvents}
                  dateClick={handleDateClick}
                  eventClick={handleEventClick}
                  height="auto"
                  dayMaxEvents={true}
                />
              </Box>
            )}
          </Card>
        </Grid>

        {/* Legend / Info Card */}
        <Grid item xs={12} md={3}>
          <Card
            sx={{
              borderRadius: '20px',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 8px 32px rgba(108, 99, 255, 0.04)',
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2.5 }}>Event Types</Typography>
              
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box sx={{ width: 16, height: 16, borderRadius: '4px', bgcolor: '#6C63FF' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Academic</Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box sx={{ width: 16, height: 16, borderRadius: '4px', bgcolor: '#EF5350' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Holiday</Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box sx={{ width: 16, height: 16, borderRadius: '4px', bgcolor: '#FFA726' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Examinations</Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box sx={{ width: 16, height: 16, borderRadius: '4px', bgcolor: '#66BB6A' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>College Activities</Typography>
                </Stack>
              </Stack>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>Instructions</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {isAdmin 
                  ? 'As an administrator, you can click on any calendar date slot to schedule a new event, or click on existing events to update or delete details.'
                  : 'Calendar events represent official college notices. For details on any scheduled exam, holiday, or activities, simply click on the event title.'
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create / Edit Event Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: '20px' } }}>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>
            {selectedEvent ? 'Update Calendar Event' : 'Schedule New Calendar Event'}
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, p: 3 }}>
            <TextField
              label="Event Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              fullWidth
              disabled={!isAdmin}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
              disabled={!isAdmin}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  fullWidth
                  disabled={!isAdmin}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="End Date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  fullWidth
                  disabled={!isAdmin}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <FormControl fullWidth required>
              <InputLabel id="event-type-label">Event Type</InputLabel>
              <Select
                labelId="event-type-label"
                value={formData.type}
                label="Event Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                disabled={!isAdmin}
                sx={{ borderRadius: '10px' }}
              >
                <MenuItem value="academic">Academic Notice</MenuItem>
                <MenuItem value="holiday">Official Holiday</MenuItem>
                <MenuItem value="exam">Examination Schedule</MenuItem>
                <MenuItem value="event">College Activity/Event</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="event-dept-label">Select Department Target</InputLabel>
              <Select
                labelId="event-dept-label"
                value={formData.departmentId}
                label="Select Department Target"
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                disabled={!isAdmin}
                sx={{ borderRadius: '10px' }}
              >
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedEvent && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Target Audience: <strong style={{ color: '#6C63FF' }}>{getDepartmentName(formData.departmentId)}</strong>
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5, justifyContent: isAdmin ? 'space-between' : 'flex-end' }}>
            {isAdmin && selectedEvent ? (
              <Button
                type="button"
                variant="outlined"
                color="error"
                onClick={handleDeleteTrigger}
                startIcon={<Delete />}
                sx={{ borderRadius: '10px' }}
              >
                Delete
              </Button>
            ) : (
              <Box />
            )}
            
            <Stack direction="row" spacing={1.5}>
              <Button onClick={() => setOpenDialog(false)}>
                {isAdmin ? 'Cancel' : 'Close'}
              </Button>
              {isAdmin && (
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
                  Save Event
                </Button>
              )}
            </Stack>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Calendar Event"
        message={`Are you sure you want to permanently delete the calendar event "${selectedEvent?.title}"?`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={actionLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
