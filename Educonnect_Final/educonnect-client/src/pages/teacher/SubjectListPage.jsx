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
  FormHelperText,
} from '@mui/material';
import { Add, Edit, Delete, Book, Person, School } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { subjectApi, departmentApi, userApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
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

export default function SubjectListPage() {
  const { user, accessToken } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form dialogs
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    departmentId: '',
    teacherId: '',
    type: 'theory',
    weeklyHours: 4,
  });
  const [formErrors, setFormErrors] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      setAuthHeader(accessToken);
      // Admin gets all subjects, teachers get filtered
      const params = isAdmin ? {} : { teacherId: user.id };
      
      const promises = [
        subjectApi.list(params),
        departmentApi.list(),
      ];

      if (isAdmin) {
        promises.push(userApi.listUsers({ role: 'teacher' }));
      }

      const [subjectRes, deptRes, teacherRes] = await Promise.all(promises);
      
      setSubjects(subjectRes.data.data || []);
      setDepartments(deptRes.data.data || []);
      if (isAdmin && teacherRes) {
        setTeachers(teacherRes.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load subjects data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchData();
    }
  }, [accessToken, user?.role]);

  const handleOpenCreate = () => {
    setSelectedSubject(null);
    setFormData({
      name: '',
      code: '',
      departmentId: '',
      teacherId: '',
      type: 'theory',
      weeklyHours: 4,
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEdit = (subject) => {
    setSelectedSubject(subject);
    setFormData({
      name: subject.name || '',
      code: subject.code || '',
      departmentId: subject.departmentId || '',
      teacherId: subject.teacherId || '',
      type: subject.type || 'theory',
      weeklyHours: subject.weeklyHours || 4,
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleDeleteTrigger = (subject) => {
    setSelectedSubject(subject);
    setDeleteOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      const payload = {
        ...formData,
        weeklyHours: formData.weeklyHours === '' ? null : parseInt(formData.weeklyHours, 10)
      };
      if (selectedSubject) {
        await subjectApi.update(selectedSubject.id, payload);
        toast.success('Subject updated successfully');
      } else {
        await subjectApi.create(payload);
        toast.success('Subject created successfully');
      }
      setOpenDialog(false);
      fetchData();
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.errors) {
        setFormErrors(mapErrors(err.response.data.errors));
      }
      toast.error(err.response?.data?.message || 'Failed to save subject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSubject) return;
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      await subjectApi.delete(selectedSubject.id);
      toast.success('Subject deleted successfully');
      setDeleteOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete subject');
    } finally {
      setActionLoading(false);
    }
  };

  const getDeptName = (deptId) => {
    const dept = departments.find((d) => d.id === deptId);
    return dept ? dept.name : 'Unknown Stream';
  };

  const getTeacherName = (tId) => {
    if (!tId) return 'Not Assigned';
    const t = teachers.find((teacher) => teacher.id === tId);
    return t ? `${t.firstName} ${t.lastName}` : 'Assigned (No Profile)';
  };

  const columns = [
    { field: 'code', headerName: 'Code', flex: 0.8, renderCell: ({ value }) => <Chip label={value} size="small" variant="outlined" sx={{ fontWeight: 700 }} /> },
    { field: 'name', headerName: 'Subject Name', flex: 1.2, renderCell: ({ row }) => <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{row.name}</Typography> },
    {
      field: 'departmentId',
      headerName: 'Stream',
      flex: 1.2,
      valueGetter: ({ row }) => getDeptName(row.departmentId),
    },
    {
      field: 'teacherId',
      headerName: 'Teacher',
      flex: 1.2,
      valueGetter: ({ row }) => getTeacherName(row.teacherId),
    },
    {
      field: 'type',
      headerName: 'Type',
      flex: 0.8,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          color={value === 'theory' ? 'info' : 'success'}
          size="small"
          sx={{ textTransform: 'capitalize' }}
        />
      ),
    },
    { field: 'weeklyHours', headerName: 'Weekly Hours', flex: 0.8, type: 'number' },
    ...(isAdmin
      ? [
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
        ]
      : []),
  ];

  return (
    <Box>
      <PageHeader
        title={isAdmin ? 'Academic Subjects' : 'My Assigned Subjects'}
        subtitle={isAdmin ? 'Manage academic subject directories and map them to teachers' : 'View the subjects you are teaching this session'}
        action={isAdmin ? handleOpenCreate : null}
        actionLabel="Add Subject"
        actionIcon={<Add />}
      />

      <DataTable
        rows={subjects}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search by name or code..."
        searchField={['name', 'code']}
        exportFilename="college_subjects_export.csv"
      />

      {/* Create / Edit Modal */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>
            {selectedSubject ? 'Edit Subject Details' : 'Create New Subject'}
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Subject Name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setFormErrors({ ...formErrors, name: null });
              }}
              error={!!formErrors.name}
              helperText={formErrors.name}
              required
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <TextField
              label="Subject Code"
              value={formData.code}
              onChange={(e) => {
                setFormData({ ...formData, code: e.target.value.toUpperCase() });
                setFormErrors({ ...formErrors, code: null });
              }}
              error={!!formErrors.code}
              helperText={formErrors.code}
              required
              fullWidth
              placeholder="e.g. PHY101"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <FormControl fullWidth required error={!!formErrors.departmentId}>
              <InputLabel id="select-dept-label">Academic Stream</InputLabel>
              <Select
                labelId="select-dept-label"
                value={formData.departmentId}
                label="Academic Stream"
                onChange={(e) => {
                  setFormData({ ...formData, departmentId: e.target.value });
                  setFormErrors({ ...formErrors, departmentId: null });
                }}
                sx={{ borderRadius: '10px' }}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.departmentId && <FormHelperText>{formErrors.departmentId}</FormHelperText>}
            </FormControl>
            <FormControl fullWidth error={!!formErrors.teacherId}>
              <InputLabel id="select-teacher-label">Assigned Teacher</InputLabel>
              <Select
                labelId="select-teacher-label"
                value={formData.teacherId}
                label="Assigned Teacher"
                onChange={(e) => {
                  setFormData({ ...formData, teacherId: e.target.value });
                  setFormErrors({ ...formErrors, teacherId: null });
                }}
                sx={{ borderRadius: '10px' }}
              >
                <MenuItem value="">
                  <em>-- Unassigned --</em>
                </MenuItem>
                {teachers.map((teacher) => (
                  <MenuItem key={teacher.id} value={teacher.id}>
                    {teacher.firstName} {teacher.lastName} ({teacher.profile?.employeeId || 'No ID'})
                  </MenuItem>
                ))}
              </Select>
              {formErrors.teacherId && <FormHelperText>{formErrors.teacherId}</FormHelperText>}
            </FormControl>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth required error={!!formErrors.type}>
                  <InputLabel id="select-type-label">Type</InputLabel>
                  <Select
                    labelId="select-type-label"
                    value={formData.type}
                    label="Type"
                    onChange={(e) => {
                      setFormData({ ...formData, type: e.target.value });
                      setFormErrors({ ...formErrors, type: null });
                    }}
                    sx={{ borderRadius: '10px' }}
                  >
                    <MenuItem value="theory">Theory</MenuItem>
                    <MenuItem value="practical">Practical</MenuItem>
                    <MenuItem value="elective">Elective</MenuItem>
                  </Select>
                  {formErrors.type && <FormHelperText>{formErrors.type}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Weekly Hours"
                  type="number"
                  value={formData.weeklyHours}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, weeklyHours: val === '' ? '' : (parseInt(val, 10) || 0) });
                    setFormErrors({ ...formErrors, weeklyHours: null });
                  }}
                  error={!!formErrors.weeklyHours}
                  helperText={formErrors.weeklyHours}
                  required
                  fullWidth
                  InputProps={{ inputProps: { min: 1, max: 20 } }}
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
              {selectedSubject ? 'Save Changes' : 'Create Subject'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Subject"
        message={`Are you sure you want to delete the subject ${selectedSubject?.name}? All mapping records might be affected.`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={actionLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
