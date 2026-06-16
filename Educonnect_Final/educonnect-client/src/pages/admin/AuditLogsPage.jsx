import React, { useState, useEffect } from 'react';
import { Box, Chip, Typography, Button } from '@mui/material';
import { DeleteForever } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { auditLogApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function AuditLogsPage() {
  const { accessToken } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      setAuthHeader(accessToken);
      const res = await auditLogApi.list();
      setLogs(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteAll = async () => {
    setDeleteLoading(true);
    try {
      setAuthHeader(accessToken);
      await auditLogApi.deleteAll();
      toast.success('Successfully cleared all system audit logs!');
      setConfirmOpen(false);
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear audit logs');
    } finally {
      setDeleteLoading(false);
    }
  };


  useEffect(() => {
    if (accessToken) {
      fetchLogs();
    }
  }, [accessToken]);

  const columns = [
    {
      field: 'timestamp',
      headerName: 'Timestamp',
      flex: 1.2,
      valueGetter: ({ row }) => (row.timestamp ? new Date(row.timestamp).toLocaleString() : ''),
      renderCell: ({ row }) => (
        <Typography variant="body2" color="text.secondary">
          {row.timestamp ? new Date(row.timestamp).toLocaleString() : 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'username',
      headerName: 'User',
      flex: 1,
      renderCell: ({ row }) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {row.username || 'System / Anonymous'}
        </Typography>
      ),
    },
    {
      field: 'action',
      headerName: 'Action',
      flex: 1.5,
      renderCell: ({ value }) => (
        <Chip label={value} variant="outlined" size="small" sx={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700 }} />
      ),
    },
    { field: 'resource', headerName: 'Resource', flex: 0.8 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.8,
      renderCell: ({ value }) => {
        const isSuccess = value === 'success' || (typeof value === 'number' && value >= 200 && value < 300) || value === true || value === '200' || value === '201';
        return (
          <Chip
            label={isSuccess ? 'Success' : 'Failed'}
            color={isSuccess ? 'success' : 'error'}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        );
      },
    },
    { field: 'ip', headerName: 'IP Address', flex: 0.8 },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <PageHeader
          title="System Audit Logs"
          subtitle="Monitor all administrative and critical system actions"
        />
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteForever />}
          onClick={() => setConfirmOpen(true)}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
        >
          Clear Audit Logs
        </Button>
      </Box>

      <DataTable
        rows={logs}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search user, action, or resource..."
        searchField={['username', 'action', 'resource']}
        exportFilename="college_audit_logs.csv"
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Clear All Audit Logs"
        message="Are you sure you want to permanently delete all system audit logs? This action is irreversible."
        confirmLabel="Clear Logs"
        confirmColor="error"
        loading={deleteLoading}
        onConfirm={handleDeleteAll}
        onCancel={() => setConfirmOpen(false)}
      />
    </Box>
  );
}
