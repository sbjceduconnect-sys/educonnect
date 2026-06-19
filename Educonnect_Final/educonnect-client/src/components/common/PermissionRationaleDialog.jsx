/**
 * PermissionRationaleDialog.jsx
 *
 * Reusable rationale dialog shown BEFORE triggering any native Capacitor
 * permission prompt. Follows Android best practices: explain WHY the
 * permission is needed before the OS dialog appears, giving users context
 * so they are more likely to grant it.
 *
 * Used for: Camera (QR scan), Storage (file upload / PDF download),
 *           Notifications (announcement broadcasts).
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
} from '@mui/material';
import {
  CameraAlt,
  FolderOpen,
  NotificationsActive,
  Info,
  Lock,
} from '@mui/icons-material';

// ─── Permission type → display config ─────────────────────────────────────────
const CONFIG = {
  camera: {
    icon:  <CameraAlt sx={{ fontSize: 32, color: '#fff' }} />,
    color: '#6C63FF',
    title: 'Camera Access Required',
    body: [
      'EduConnect needs access to your device camera to scan QR codes for automated student attendance logging.',
      'The camera is only activated when you tap the "Scan QR Code" button and is never accessed in the background.',
    ],
    confirmLabel: 'Allow Camera',
  },
  storage: {
    icon:  <FolderOpen sx={{ fontSize: 32, color: '#fff' }} />,
    color: '#2196F3',
    title: 'File Access Required',
    body: [
      'EduConnect needs access to your device storage to:',
      '• Upload study materials and lecture files to the platform.',
      '• Save downloaded PDF progress reports and question papers to your device.',
      'Your files are only accessed when you explicitly tap Upload or Download.',
    ],
    confirmLabel: 'Allow File Access',
  },
  notifications: {
    icon:  <NotificationsActive sx={{ fontSize: 32, color: '#fff' }} />,
    color: '#FF9800',
    title: 'Enable Notifications',
    body: [
      'Allow EduConnect to send you push notifications so you never miss:',
      '• Critical announcements from teachers or administrators.',
      '• Schedule changes and upcoming exam reminders.',
      '• New grade publications and attendance alerts.',
    ],
    confirmLabel: 'Allow Notifications',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function PermissionRationaleDialog({
  open,
  permissionType,   // 'camera' | 'storage' | 'notifications'
  onConfirm,        // () => void  — user agreed, now trigger native prompt
  onDismiss,        // () => void  — user dismissed without granting
}) {
  const config = CONFIG[permissionType] || CONFIG.camera;

  return (
    <Dialog
      open={open}
      onClose={onDismiss}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden' } }}
    >
      {/* Colored header banner */}
      <Box
        sx={{
          bgcolor: config.color,
          px: 3,
          pt: 3.5,
          pb: 2.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Avatar
          sx={{
            width: 64,
            height: 64,
            bgcolor: 'rgba(255,255,255,0.2)',
            border: '2px solid rgba(255,255,255,0.5)',
          }}
        >
          {config.icon}
        </Avatar>
        <Typography
          variant="h6"
          sx={{ color: '#fff', fontWeight: 800, textAlign: 'center' }}
        >
          {config.title}
        </Typography>
      </Box>

      <DialogContent sx={{ px: 3, pt: 2.5, pb: 1 }}>
        {/* Info notice */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            bgcolor: `${config.color}12`,
            border: `1px solid ${config.color}33`,
            borderRadius: '12px',
            p: 1.5,
            mb: 2,
          }}
        >
          <Info sx={{ color: config.color, fontSize: 18, mt: 0.2, flexShrink: 0 }} />
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            EduConnect only requests this permission when you use this feature.
            It is never requested in the background.
          </Typography>
        </Box>

        {/* Rationale lines */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {config.body.map((line, i) => (
            <Typography
              key={i}
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.7 }}
            >
              {line}
            </Typography>
          ))}
        </Box>

        {/* Privacy note */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            mt: 2.5,
            alignItems: 'flex-start',
          }}
        >
          <Lock sx={{ fontSize: 15, color: 'text.disabled', mt: 0.3, flexShrink: 0 }} />
          <Typography variant="caption" color="text.disabled" sx={{ lineHeight: 1.5 }}>
            You can revoke this permission at any time in your device Settings → Apps → EduConnect.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={onDismiss}
          fullWidth
          variant="outlined"
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
        >
          Not Now
        </Button>
        <Button
          onClick={onConfirm}
          fullWidth
          variant="contained"
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 700,
            bgcolor: config.color,
            '&:hover': { bgcolor: config.color, filter: 'brightness(0.9)' },
          }}
        >
          {config.confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
