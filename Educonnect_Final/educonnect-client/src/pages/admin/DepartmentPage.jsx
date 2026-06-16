import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Typography,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
} from '@mui/material';
import { Add, Edit, Delete, Person, Settings } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { departmentApi, userApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';

export default function DepartmentPage() {
  const { accessToken } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [openHodDialog, setOpenHodDialog] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  const [selectedDept, setSelectedDept] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [selectedHodId, setSelectedHodId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch departments and teachers
  const fetchData = async () => {
    setLoading(true);
    try {
      setAuthHeader(accessToken);
      const [deptRes, teacherRes] = await Promise.all([
        departmentApi.list(),
        userApi.listUsers({ role: 'teacher' }),
      ]);
      setDepartments(deptRes.data.data || []);
      setTeachers(teacherRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load department data');
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
    setSelectedDept(null);
    setFormData({ name: '', code: '', description: '' });
    setOpenDialog(true);
  };

  const handleOpenEdit = (dept) => {
    setSelectedDept(dept);
    setFormData({
      name: dept.name || '',
      code: dept.code || '',
      description: dept.description || '',
    });
    setOpenDialog(true);
  };

  const handleOpenHod = (dept) => {
    setSelectedDept(dept);
    setSelectedHodId(dept.hodId || '');
    setOpenHodDialog(true);
  };

  const handleDeleteTrigger = (dept) => {
    setSelectedDept(dept);
    setDeleteOpen(true);
  };

  // Submit department form (Create / Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      if (selectedDept) {
        // Edit mode
        await departmentApi.update(selectedDept.id, formData);
        toast.success('Department updated successfully');
      } else {
        // Create mode
        await departmentApi.create(formData);
        toast.success('Department created successfully');
      }
      setOpenDialog(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save department');
    } finally {
      setActionLoading(false);
    }
  };

  // Assign HOD
  const handleAssignHod = async () => {
    if (!selectedDept) return;
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      await departmentApi.assignHoD(selectedDept.id, selectedHodId);
      toast.success('Head of Department assigned successfully');
      setOpenHodDialog(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign HoD');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!selectedDept) return;
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      await departmentApi.delete(selectedDept.id);
      toast.success('Department deleted successfully');
      setDeleteOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete department');
    } finally {
      setActionLoading(false);
    }
  };

  const getHodName = (hodId) => {
    if (!hodId) return 'Not Assigned';
    const teacher = teachers.find((t) => t.id === hodId);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Assigned (No Profile)';
  };

  const columns = [
    { field: 'code', headerName: 'Code', flex: 0.8, renderCell: ({ value }) => <Chip label={value} variant="outlined" size="small" sx={{ fontWeight: 700 }} /> },
    { field: 'name', headerName: 'Stream/Department', flex: 1.2, renderCell: ({ row }) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.name}</Typography> },
    { field: 'description', headerName: 'Description', flex: 1.5 },
    {
      field: 'hodId',
      headerName: 'Head of Dept (HoD)',
      flex: 1.2,
      valueGetter: ({ row }) => getHodName(row.hodId),
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person fontSize="small" color={row.hodId ? 'primary' : 'disabled'} />
          <Typography variant="body2" color={row.hodId ? 'text.primary' : 'text.secondary'}>
            {getHodName(row.hodId)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton color="secondary" onClick={() => handleOpenHod(row)} size="small" title="Assign HoD">
            <Settings />
          </IconButton>
          <IconButton color="primary" onClick={() => handleOpenEdit(row)} size="small" title="Edit">
            <Edit />
          </IconButton>
          <IconButton color="error" onClick={() => handleDeleteTrigger(row)} size="small" title="Delete">
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Departments & Streams"
        subtitle="Configure academic streams and assign Head of Departments"
        action={handleOpenCreate}
        actionLabel="Add Stream"
        actionIcon={<Add />}
      />

      <DataTable
        rows={departments}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search stream name or code..."
        searchField={['name', 'code']}
        exportFilename="college_streams_export.csv"
      />

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>
            {selectedDept ? 'Edit Department/Stream' : 'Create Department/Stream'}
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Stream Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <TextField
              label="Stream Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
              fullWidth
              disabled={!!selectedDept} // Cannot edit code after creation
              placeholder="e.g. 11SCI"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
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
              {selectedDept ? 'Save Changes' : 'Create Stream'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* HoD Assignment Dialog */}
      <Dialog open={openHodDialog} onClose={() => setOpenHodDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Assign Head of Department</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ py: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose a teacher to assign as the Head of Department (HoD) for <strong>{selectedDept?.name}</strong>.
            </Typography>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel id="select-hod-label">Select Teacher</InputLabel>
              <Select
                labelId="select-hod-label"
                value={selectedHodId}
                label="Select Teacher"
                onChange={(e) => setSelectedHodId(e.target.value)}
                sx={{ borderRadius: '10px' }}
              >
                <MenuItem value="">
                  <em>-- None --</em>
                </MenuItem>
                {teachers.map((teacher) => (
                  <MenuItem key={teacher.id} value={teacher.id}>
                    {teacher.firstName} {teacher.lastName} ({teacher.profile?.employeeId || 'No ID'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenHodDialog(false)} disabled={actionLoading}>Cancel</Button>
          <Button
            onClick={handleAssignHod}
            variant="contained"
            disabled={actionLoading}
            sx={{
              borderRadius: '10px',
              px: 3,
              background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
            }}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Department/Stream"
        message={`Are you sure you want to permanently delete the stream ${selectedDept?.name}?`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={actionLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
