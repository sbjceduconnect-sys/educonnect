import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';

export default function ConfirmDialog({
  open,
  title = 'Confirm Action',
  message = 'Are you sure you want to perform this action?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'primary',
  onConfirm,
  onCancel,
  loading = false,
}) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      PaperProps={{
        sx: {
          borderRadius: '16px',
          p: 1.5,
          maxWidth: 440,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem' }}>{title}</DialogTitle>
      <DialogContent sx={{ py: 1 }}>
        <DialogContentText sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={onCancel}
          disabled={loading}
          sx={{ borderRadius: '10px', px: 2.5 }}
        >
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          color={confirmColor}
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{
            borderRadius: '10px',
            px: 2.5,
            background: confirmColor === 'primary' ? 'linear-gradient(135deg, #6C63FF, #3F51B5)' : undefined,
            '&:hover': {
              background: confirmColor === 'primary' ? 'linear-gradient(135deg, #574feb, #303f9f)' : undefined,
            },
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
