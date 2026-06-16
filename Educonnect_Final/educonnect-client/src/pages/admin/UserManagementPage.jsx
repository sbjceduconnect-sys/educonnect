import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  FormControl,
  InputLabel,
  Select,
  TextField,
  CircularProgress,
} from '@mui/material';
import {
  PersonAdd,
  UploadFile,
  MoreVert,
  CheckCircle,
  Cancel,
  ArrowBack,
  Download,
  Edit,
  DeleteForever,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { userApi, departmentApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { STREAMS } from '../../utils/constants';

export default function UserManagementPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  
  // Selection/Action state
  const [selectedUser, setSelectedUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'approve', 'delete'
  const [actionLoading, setActionLoading] = useState(false);
  
  // Bulk import state
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  // Departments and Editing states
  const [departments, setDepartments] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ firstName: '', lastName: '', profile: {} });
  const [editLoading, setEditLoading] = useState(false);

  // Bulk delete state
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [bulkClassFilter, setBulkClassFilter] = useState('all');
  const [bulkSecurityCode, setBulkSecurityCode] = useState('');
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);


  const fetchDepartments = async () => {
    try {
      setAuthHeader(accessToken);
      const res = await departmentApi.list();
      setDepartments(res.data.data || []);
    } catch (err) {
      console.error('Failed to load departments', err);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchDepartments();
    }
  }, [accessToken]);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      setAuthHeader(accessToken);
      // Determine filters based on tab
      const params = {};
      if (activeTab === 1) params.role = 'student';
      if (activeTab === 2) params.role = 'teacher';
      if (activeTab === 3) params.role = 'admin';
      if (activeTab === 4) params.isApproved = false; // Pending approvals

      const res = await userApi.listUsers(params);
      setUsers(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchUsers();
    }
  }, [accessToken, activeTab]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Menu action triggers
  const handleMenuOpen = (event, user) => {
    setSelectedUser(user);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const triggerApprove = (user) => {
    setSelectedUser(user);
    setConfirmAction('approve');
    setConfirmOpen(true);
    handleMenuClose();
  };

  const triggerDelete = (user) => {
    setSelectedUser(user);
    setConfirmAction('delete');
    setConfirmOpen(true);
    handleMenuClose();
  };

  const handleConfirmAction = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      if (confirmAction === 'approve') {
        await userApi.approveUser(selectedUser.id);
        toast.success(`${selectedUser.firstName} ${selectedUser.lastName} approved successfully!`);
      } else if (confirmAction === 'delete') {
        await userApi.deleteUser(selectedUser.id);
        toast.success('User deleted successfully');
      }
      setConfirmOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = async (role) => {
    if (!selectedUser) return;
    try {
      setAuthHeader(accessToken);
      await userApi.changeRole(selectedUser.id, role);
      toast.success(`Role changed to ${role}`);
      handleMenuClose();
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change role');
    }
  };

  const handleOpenEditDialog = () => {
    if (!selectedUser) return;
    setEditFormData({
      firstName: selectedUser.firstName || '',
      lastName: selectedUser.lastName || '',
      profile: {
        enrollmentNo: selectedUser.profile?.enrollmentNo || '',
        departmentId: selectedUser.profile?.departmentId || '',
        stream: selectedUser.profile?.stream || '',
        section: selectedUser.profile?.section || '',
        guardianName: selectedUser.profile?.guardianName || '',
        guardianPhone: selectedUser.profile?.guardianPhone || '',
        employeeId: selectedUser.profile?.employeeId || '',
        qualification: selectedUser.profile?.qualification || '',
        specialization: selectedUser.profile?.specialization || '',
      }
    });
    setEditOpen(true);
    handleMenuClose();
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditLoading(true);
    try {
      setAuthHeader(accessToken);
      const profileCleaned = { ...editFormData.profile };
      if (profileCleaned.departmentId === '') {
        profileCleaned.departmentId = null;
      }
      const payload = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        profile: profileCleaned
      };
      await userApi.updateUser(selectedUser.id, payload);
      toast.success('User details updated successfully!');
      setEditOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user details');
    } finally {
      setEditLoading(false);
    }
  };

  // Bulk import handlers
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
      setImportError('');
      setImportSuccess('');
    }
  };

  const handleBulkImport = async () => {
    if (!importFile) {
      setImportError('Please select a CSV file');
      return;
    }
    setActionLoading(true);
    setImportError('');
    setImportSuccess('');
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      setAuthHeader(accessToken);
      const res = await userApi.bulkImport(formData);
      
      setImportSuccess(res.data.message || 'Users imported successfully!');
      toast.success('Import completed!');
      fetchUsers();
    } catch (err) {
      setImportError(err.response?.data?.message || 'Failed to import CSV file');
    } finally {
      setActionLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "username,email,password,firstName,lastName,role,enrollmentNo,employeeId,phone\n" +
      "johndoe,john.doe@saibalaji.edu,Student@123,John,Doe,student,SBJC-2026-001,,9876543210\n" +
      "janesmith,jane.smith@saibalaji.edu,Teacher@123,Jane,Smith,teacher,,SBJC-TEACH-01,9876543211\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'users_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkDelete = async (e) => {
    e.preventDefault();
    setBulkDeleteLoading(true);
    try {
      setAuthHeader(accessToken);
      const res = await userApi.bulkDelete({
        classFilter: bulkClassFilter,
        securityCode: bulkSecurityCode,
      });
      toast.success(res.data.message || 'Users deleted successfully');
      setDeleteAllOpen(false);
      setBulkSecurityCode('');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to bulk delete users');
    } finally {
      setBulkDeleteLoading(false);
    }
  };


  const columns = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1.2,
      valueGetter: ({ row }) => `${row.firstName || ''} ${row.lastName || ''}`,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            {(row.firstName?.[0] || '') + (row.lastName?.[0] || '')}
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {row.firstName} {row.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              @{row.username}
            </Typography>
          </Box>
        </Box>
      ),
    },
    { field: 'email', headerName: 'Email', flex: 1.2 },
    {
      field: 'role',
      headerName: 'Role',
      flex: 0.8,
      renderCell: ({ value }) => {
        let color = 'primary';
        if (value === 'admin') color = 'error';
        if (value === 'teacher') color = 'warning';
        return <Chip label={value} color={color} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />;
      },
    },
    {
      field: 'isApproved',
      headerName: 'Status',
      flex: 0.8,
      renderCell: ({ row }) => {
        if (row.isActive === false) {
          return (
            <Chip
              label="Deactivated"
              color="error"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          );
        }
        return (
          <Chip
            label={row.isApproved ? 'Approved' : 'Pending'}
            color={row.isApproved ? 'success' : 'default'}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.6,
      sortable: false,
      renderCell: ({ row }) => (
        <Box>
          {!row.isApproved && (
            <IconButton color="success" onClick={() => triggerApprove(row)} size="small" title="Approve">
              <CheckCircle />
            </IconButton>
          )}
          <IconButton onClick={(e) => handleMenuOpen(e, row)} size="small">
            <MoreVert />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <PageHeader
          title="User Management"
          subtitle="Manage SaiBalaji College students, teachers, and admins"
        />
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<UploadFile />}
            onClick={() => setImportOpen(true)}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
          >
            Bulk CSV Import
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteForever />}
            onClick={() => setDeleteAllOpen(true)}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
          >
            Bulk Delete Students
          </Button>
        </Box>
      </Box>


      {/* Tabs */}
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
        <Tab label="All Users" sx={{ fontWeight: 600, textTransform: 'none' }} />
        <Tab label="Students" sx={{ fontWeight: 600, textTransform: 'none' }} />
        <Tab label="Teachers" sx={{ fontWeight: 600, textTransform: 'none' }} />
        <Tab label="Admins" sx={{ fontWeight: 600, textTransform: 'none' }} />
        <Tab label="Pending Approval" sx={{ fontWeight: 600, textTransform: 'none' }} />
      </Tabs>

      {/* Main Table */}
      <DataTable
        rows={users}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search by name or email..."
        searchField={['firstName', 'lastName', 'email']}
        exportFilename="college_users_export.csv"
      />

      {/* Context Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {selectedUser && !selectedUser.isApproved && (
          <MenuItem onClick={() => triggerApprove(selectedUser)}>
            Approve Account
          </MenuItem>
        )}
        {selectedUser?.role !== 'student' && (
          <MenuItem onClick={() => handleChangeRole('student')}>Change to Student</MenuItem>
        )}
        {selectedUser?.role !== 'teacher' && (
          <MenuItem onClick={() => handleChangeRole('teacher')}>Change to Teacher</MenuItem>
        )}
        {selectedUser?.role !== 'admin' && (
          <MenuItem onClick={() => handleChangeRole('admin')}>Change to Admin</MenuItem>
        )}
        <MenuItem onClick={handleOpenEditDialog}>Edit User Details</MenuItem>
        <MenuItem onClick={() => triggerDelete(selectedUser)} sx={{ color: 'error.main' }}>
          Delete User
        </MenuItem>
      </Menu>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmAction === 'approve' ? 'Approve User Account' : 'Delete User Account'}
        message={
          confirmAction === 'approve'
            ? `Are you sure you want to approve the account for ${selectedUser?.firstName} ${selectedUser?.lastName}?`
            : `Are you sure you want to delete ${selectedUser?.firstName} ${selectedUser?.lastName}? This action cannot be undone.`
        }
        confirmLabel={confirmAction === 'approve' ? 'Approve' : 'Delete'}
        confirmColor={confirmAction === 'approve' ? 'success' : 'error'}
        loading={actionLoading}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Bulk Import Dialog */}
      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Bulk User Import</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload a CSV file containing user registration details. Below is the structure required for the CSV file. You can download the template to get started.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Download />}
              onClick={downloadTemplate}
              sx={{ borderRadius: '8px', textTransform: 'none' }}
            >
              Download CSV Template
            </Button>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ borderStyle: 'dashed', borderRadius: '12px', textAlign: 'center', p: 3 }}>
                <input
                  accept=".csv"
                  style={{ display: 'none' }}
                  id="csv-file-upload"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="csv-file-upload">
                  <Button variant="contained" component="span" startIcon={<UploadFile />} sx={{ borderRadius: '8px', mb: 1.5 }}>
                    Select CSV File
                  </Button>
                </label>
                <Typography variant="body2" color="text.secondary">
                  {importFile ? `Selected: ${importFile.name}` : 'No file chosen'}
                </Typography>
              </Card>
            </Grid>
            {importError && (
              <Grid item xs={12}>
                <Alert severity="error" sx={{ borderRadius: '8px' }}>{importError}</Alert>
              </Grid>
            )}
            {importSuccess && (
              <Grid item xs={12}>
                <Alert severity="success" sx={{ borderRadius: '8px' }}>{importSuccess}</Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setImportOpen(false)} color="inherit" disabled={actionLoading}>
            Close
          </Button>
          <Button
            onClick={handleBulkImport}
            variant="contained"
            disabled={actionLoading || !importFile}
            sx={{
              borderRadius: '10px',
              px: 3,
              background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
            }}
          >
            Start Import
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Details Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Edit User Details</DialogTitle>
        <form onSubmit={handleSaveEdit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  required
                  value={editFormData.firstName}
                  onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  required
                  value={editFormData.lastName}
                  onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                />
              </Grid>

              {selectedUser?.role === 'student' && (
                <>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Roll / Reg No"
                      value={editFormData.profile?.enrollmentNo || ''}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        profile: { ...editFormData.profile, enrollmentNo: e.target.value }
                      })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel id="edit-dept-label">Stream Department</InputLabel>
                      <Select
                        labelId="edit-dept-label"
                        value={editFormData.profile?.departmentId || ''}
                        label="Stream Department"
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          profile: { ...editFormData.profile, departmentId: e.target.value }
                        })}
                      >
                        <MenuItem value=""><em>None</em></MenuItem>
                        {departments.map((dept) => (
                          <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel id="edit-stream-label">Academic Stream</InputLabel>
                      <Select
                        labelId="edit-stream-label"
                        value={editFormData.profile?.stream || ''}
                        label="Academic Stream"
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          profile: { ...editFormData.profile, stream: e.target.value }
                        })}
                      >
                        <MenuItem value=""><em>None</em></MenuItem>
                        {STREAMS.map((s) => (
                          <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel id="edit-section-label">Class Section</InputLabel>
                      <Select
                        labelId="edit-section-label"
                        value={editFormData.profile?.section || ''}
                        label="Class Section"
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          profile: { ...editFormData.profile, section: e.target.value }
                        })}
                      >
                        <MenuItem value=""><em>None</em></MenuItem>
                        <MenuItem value="A">A</MenuItem>
                        <MenuItem value="B">B</MenuItem>
                        <MenuItem value="C">C</MenuItem>
                        <MenuItem value="D">D</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Guardian Name"
                      value={editFormData.profile?.guardianName || ''}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        profile: { ...editFormData.profile, guardianName: e.target.value }
                      })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Guardian Phone"
                      value={editFormData.profile?.guardianPhone || ''}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        profile: { ...editFormData.profile, guardianPhone: e.target.value }
                      })}
                    />
                  </Grid>
                </>
              )}

              {selectedUser?.role === 'teacher' && (
                <>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Employee ID"
                      value={editFormData.profile?.employeeId || ''}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        profile: { ...editFormData.profile, employeeId: e.target.value }
                      })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel id="edit-dept-label">Stream Department</InputLabel>
                      <Select
                        labelId="edit-dept-label"
                        value={editFormData.profile?.departmentId || ''}
                        label="Stream Department"
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          profile: { ...editFormData.profile, departmentId: e.target.value }
                        })}
                      >
                        <MenuItem value=""><em>None</em></MenuItem>
                        {departments.map((dept) => (
                          <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Qualification"
                      value={editFormData.profile?.qualification || ''}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        profile: { ...editFormData.profile, qualification: e.target.value }
                      })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Specialization"
                      value={editFormData.profile?.specialization || ''}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        profile: { ...editFormData.profile, specialization: e.target.value }
                      })}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setEditOpen(false)} color="inherit" disabled={editLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={editLoading}
              sx={{
                borderRadius: '10px',
                px: 3,
                background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
              }}
            >
              Save Changes
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Bulk Delete Students Confirmation Dialog */}
      <Dialog open={deleteAllOpen} onClose={() => setDeleteAllOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleBulkDelete}>
          <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>Bulk Delete Students</DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              Purge student accounts from the system. <strong>This action cannot be undone</strong> and will clear their profiles, grades, and logs.
            </Typography>

            <FormControl fullWidth required>
              <InputLabel id="bulk-delete-class-label">Academic Class / Grade Filter</InputLabel>
              <Select
                labelId="bulk-delete-class-label"
                value={bulkClassFilter}
                label="Academic Class / Grade Filter"
                onChange={(e) => setBulkClassFilter(e.target.value)}
                sx={{ borderRadius: '10px' }}
              >
                <MenuItem value="all">All Students (11th & 12th)</MenuItem>
                <MenuItem value="11th">11th Class Students Only</MenuItem>
                <MenuItem value="12th">12th Class Students Only</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Enter Deletion Security Code"
              placeholder="e.g. SBJC-DELETE-CONFIRM-2026"
              value={bulkSecurityCode}
              onChange={(e) => setBulkSecurityCode(e.target.value)}
              required
              fullWidth
              helperText="To confirm, enter the security code: SBJC-DELETE-CONFIRM-2026"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setDeleteAllOpen(false)} color="inherit" disabled={bulkDeleteLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="error"
              disabled={bulkDeleteLoading || bulkSecurityCode !== 'SBJC-DELETE-CONFIRM-2026'}
              sx={{
                borderRadius: '10px',
                px: 3,
              }}
            >
              {bulkDeleteLoading ? <CircularProgress size={20} color="inherit" /> : 'Confirm Bulk Delete'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

