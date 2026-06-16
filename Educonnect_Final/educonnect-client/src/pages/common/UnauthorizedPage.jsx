import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Lock } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 3 }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ width: 80, height: 80, borderRadius: '20px', background: 'rgba(244, 67, 54, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
          <Lock sx={{ fontSize: 40, color: '#F44336' }} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Access Denied</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>You don't have permission to access this page.</Typography>
        <Button variant="contained" onClick={() => navigate('/dashboard')} sx={{ background: 'linear-gradient(135deg, #6C63FF, #3F51B5)', borderRadius: '12px', px: 4 }}>
          Go to Dashboard
        </Button>
      </motion.div>
    </Box>
  );
}
