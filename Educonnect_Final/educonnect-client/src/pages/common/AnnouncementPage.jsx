import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
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
  Avatar,
  Stack,
  FormHelperText,
} from '@mui/material';
import {
  Add,
  Delete,
  Campaign,
  PriorityHigh,
  Event,
  Person,
  PinDrop,
  Layers,
  School,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { announcementApi, departmentApi, courseApi, userApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';

const mapErrors = (backendErrors) => {
  const errors = {};
  if (!backendErrors) return errors;
  for (const key in backendErrors) {
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    errors[camelKey] = Array.isArray(backendErrors[key]) ? backendErrors[key][0] : backendErrors[key];
    errors[key] = errors[camelKey];
  }
  return errors;
};

export default function AnnouncementPage() {
  const { user, accessToken } = useAuth();

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';
  const canPublish = isTeacher || isAdmin;

  const [announcements, setAnnouncements] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    scope: 'system', // system, department, course
    targetDepartmentId: '',
    targetCourseId: '',
    priority: 'normal', // normal, high, low
  });
  const [formErrors, setFormErrors] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      setAuthHeader(accessToken);
      
      const promises = [
        announcementApi.list(),
        departmentApi.list(),
        courseApi.list(),
      ];

      // Only load users if user is admin (teachers/students cannot list users)
      if (isAdmin) {
        promises.push(userApi.listUsers());
      }

      const [annRes, deptRes, courseRes, userRes] = await Promise.all(promises);

      setAnnouncements(annRes.data.data || []);
      setDepartments(deptRes.data.data || []);
      setCourses(courseRes.data.data || []);
      if (userRes) {
        setUsers(userRes.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load announcements');
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
    setSelectedAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      scope: isAdmin ? 'system' : 'department',
      targetDepartmentId: '',
      targetCourseId: '',
      priority: 'normal',
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleDeleteTrigger = (ann) => {
    setSelectedAnnouncement(ann);
    setDeleteOpen(true);
  };

  // Submit announcement
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast.error('Title and content are required');
      return;
    }

    if (formData.scope === 'department' && !formData.targetDepartmentId) {
      toast.error('Please select a target department');
      return;
    }

    if (formData.scope === 'course' && !formData.targetCourseId) {
      toast.error('Please select a target course');
      return;
    }

    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      const payload = {
        title: formData.title,
        content: formData.content,
        scope: formData.scope,
        priority: formData.priority,
        targetDepartmentId: formData.scope === 'department' ? formData.targetDepartmentId : null,
        targetCourseId: formData.scope === 'course' ? formData.targetCourseId : null,
      };

      await announcementApi.create(payload);
      toast.success('Announcement published successfully!');
      setOpenDialog(false);
      fetchData();
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.errors) {
        setFormErrors(mapErrors(err.response.data.errors));
      }
      toast.error(err.response?.data?.message || 'Failed to publish announcement');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAnnouncement) return;
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      await announcementApi.delete(selectedAnnouncement.id);
      toast.success('Announcement deleted successfully');
      setDeleteOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to delete announcement');
    } finally {
      setActionLoading(false);
    }
  };

  const getAuthorName = (authorId) => {
    const matched = users.find((u) => u.id === authorId);
    if (matched) {
      return `${matched.firstName} ${matched.lastName} (${matched.role})`;
    }
    return authorId === user.id ? `${user.firstName} ${user.lastName} (${user.role})` : 'College Administration';
  };

  const getDepartmentName = (deptId) => {
    const dept = departments.find((d) => d.id === deptId);
    return dept ? dept.name : 'Unknown Department';
  };

  const getCourseName = (courseId) => {
    const crs = courses.find((c) => c.id === courseId);
    return crs ? crs.title : 'Unknown Course';
  };

  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'error';
    if (priority === 'low') return 'info';
    return 'primary';
  };

  const getScopeBadge = (ann) => {
    if (ann.scope === 'system') return <Chip icon={<Layers fontSize="small" />} label="System-wide" size="small" variant="outlined" color="secondary" sx={{ fontWeight: 600 }} />;
    if (ann.scope === 'department') return <Chip icon={<PinDrop fontSize="small" />} label={`Dept: ${getDepartmentName(ann.targetDepartmentId)}`} size="small" variant="outlined" color="primary" sx={{ fontWeight: 600 }} />;
    if (ann.scope === 'course') return <Chip icon={<School fontSize="small" />} label={`Course: ${getCourseName(ann.targetCourseId)}`} size="small" variant="outlined" color="success" sx={{ fontWeight: 600 }} />;
    return null;
  };

  const formatAnnouncementDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString || 'Recent';
    }
  };

  return (
    <Box>
      <PageHeader
        title="Announcements Board"
        subtitle="Stay updated with notices, guidelines, and priority updates from SaiBalaji College"
        action={canPublish ? handleOpenCreate : null}
        actionLabel="Publish Announcement"
        actionIcon={<Add />}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={50} sx={{ color: '#6C63FF' }} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {announcements.length === 0 ? (
            <Grid item xs={12}>
              <Card sx={{ p: 6, textAlign: 'center', borderRadius: '20px', border: '1px solid', borderColor: 'divider' }}>
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'rgba(108, 99, 255, 0.08)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <Campaign sx={{ fontSize: 36, color: '#6C63FF' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>No Announcements Yet</Typography>
                <Typography color="text.secondary">All clear! Check back later for important updates and academic announcements.</Typography>
              </Card>
            </Grid>
          ) : (
            announcements.map((ann) => {
              const isHigh = ann.priority === 'high';
              const canDelete = isAdmin || ann.authorId === user.id;

              return (
                <Grid item xs={12} key={ann.id}>
                  <Card
                    sx={{
                      borderRadius: '16px',
                      boxShadow: isHigh ? '0 8px 32px rgba(244, 67, 54, 0.08)' : '0 8px 32px rgba(108, 99, 255, 0.04)',
                      border: '1px solid',
                      borderColor: isHigh ? 'error.main' : 'divider',
                      borderLeft: '6px solid',
                      borderLeftColor: isHigh ? 'error.main' : ann.priority === 'low' ? 'info.main' : 'primary.main',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 40px rgba(108, 99, 255, 0.08)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                            {ann.title}
                            {isHigh && <PriorityHigh color="error" sx={{ fontSize: 20 }} />}
                          </Typography>
                          <Chip
                            label={`${ann.priority} priority`}
                            color={getPriorityColor(ann.priority)}
                            size="small"
                            sx={{ textTransform: 'capitalize', fontWeight: 700, height: 20, fontSize: '0.7rem' }}
                          />
                          {getScopeBadge(ann)}
                        </Box>
                        
                        {canDelete && (
                          <IconButton color="error" onClick={() => handleDeleteTrigger(ann)} size="small">
                            <Delete />
                          </IconButton>
                        )}
                      </Box>

                      <Typography variant="body1" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap', mb: 3, lineHeight: 1.6 }}>
                        {ann.content}
                      </Typography>

                      <Divider sx={{ mb: 2 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ width: 28, height: 28, background: 'linear-gradient(135deg, #6C63FF, #3F51B5)', fontSize: '0.75rem', fontWeight: 700 }}>
                            <Person fontSize="small" sx={{ fontSize: '1rem' }} />
                          </Avatar>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {getAuthorName(ann.authorId)}
                          </Typography>
                        </Stack>

                        <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
                          <Event sx={{ fontSize: 16 }} />
                          <Typography variant="caption" sx={{ fontWeight: 500 }}>
                            {formatAnnouncementDate(ann.createdAt)}
                          </Typography>
                        </Stack>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>
      )}

      {/* Publish Announcement Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: '20px' } }}>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>Publish a New Announcement</DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, p: 3 }}>
            <TextField
              label="Announcement Title"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                setFormErrors({ ...formErrors, title: null });
              }}
              error={!!formErrors.title}
              helperText={formErrors.title}
              required
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <TextField
              label="Content details"
              placeholder="Write the full announcement contents here..."
              value={formData.content}
              onChange={(e) => {
                setFormData({ ...formData, content: e.target.value });
                setFormErrors({ ...formErrors, content: null, body: null });
              }}
              error={!!formErrors.content || !!formErrors.body}
              helperText={formErrors.content || formErrors.body}
              required
              fullWidth
              multiline
              rows={5}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!formErrors.priority}>
                  <InputLabel id="ann-priority-label">Priority Level</InputLabel>
                  <Select
                    labelId="ann-priority-label"
                    value={formData.priority}
                    label="Priority Level"
                    onChange={(e) => {
                      setFormData({ ...formData, priority: e.target.value });
                      setFormErrors({ ...formErrors, priority: null });
                    }}
                    sx={{ borderRadius: '10px' }}
                  >
                    <MenuItem value="low">Low Priority</MenuItem>
                    <MenuItem value="normal">Normal Priority</MenuItem>
                    <MenuItem value="high">High Priority</MenuItem>
                  </Select>
                  {formErrors.priority && <FormHelperText>{formErrors.priority}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!formErrors.scope}>
                  <InputLabel id="ann-scope-label">Audience Scope</InputLabel>
                  <Select
                    labelId="ann-scope-label"
                    value={formData.scope}
                    label="Audience Scope"
                    onChange={(e) => {
                      setFormData({ ...formData, scope: e.target.value });
                      setFormErrors({ ...formErrors, scope: null });
                    }}
                    sx={{ borderRadius: '10px' }}
                  >
                    {isAdmin && <MenuItem value="system">System-wide (Everyone)</MenuItem>}
                    <MenuItem value="department">Department-Specific</MenuItem>
                    <MenuItem value="course">Course-Specific</MenuItem>
                  </Select>
                  {formErrors.scope && <FormHelperText>{formErrors.scope}</FormHelperText>}
                </FormControl>
              </Grid>
            </Grid>

            {formData.scope === 'department' && (
              <FormControl fullWidth required error={!!formErrors.targetDepartmentId}>
                <InputLabel id="ann-dept-label">Select Target Department</InputLabel>
                <Select
                  labelId="ann-dept-label"
                  value={formData.targetDepartmentId}
                  label="Select Target Department"
                  onChange={(e) => {
                    setFormData({ ...formData, targetDepartmentId: e.target.value });
                    setFormErrors({ ...formErrors, targetDepartmentId: null });
                  }}
                  sx={{ borderRadius: '10px' }}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.targetDepartmentId && <FormHelperText>{formErrors.targetDepartmentId}</FormHelperText>}
              </FormControl>
            )}

            {formData.scope === 'course' && (
              <FormControl fullWidth required error={!!formErrors.targetCourseId}>
                <InputLabel id="ann-course-label">Select Target Course</InputLabel>
                <Select
                  labelId="ann-course-label"
                  value={formData.targetCourseId}
                  label="Select Target Course"
                  onChange={(e) => {
                    setFormData({ ...formData, targetCourseId: e.target.value });
                    setFormErrors({ ...formErrors, targetCourseId: null });
                  }}
                  sx={{ borderRadius: '10px' }}
                >
                  {courses.map((crs) => (
                    <MenuItem key={crs.id} value={crs.id}>
                      {crs.title} ({crs.courseCode})
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.targetCourseId && <FormHelperText>{formErrors.targetCourseId}</FormHelperText>}
              </FormControl>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenDialog(false)} disabled={actionLoading}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={actionLoading}
              sx={{
                borderRadius: '10px',
                px: 3.5,
                background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
              }}
            >
              Publish Notice
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Announcement"
        message={`Are you sure you want to permanently delete the announcement "${selectedAnnouncement?.title}"?`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={actionLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
