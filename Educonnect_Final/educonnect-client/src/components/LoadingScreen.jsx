import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { motion } from 'framer-motion';

export default function LoadingScreen({ message = 'Loading...' }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #0F0F23 0%, #1A1A2E 50%, #16213E 100%)'
            : 'linear-gradient(135deg, #F5F7FA 0%, #E8EDF5 50%, #DCE4F0 100%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
          <CircularProgress
            size={64}
            thickness={3}
            sx={{
              color: 'secondary.main',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              🎓
            </Typography>
          </Box>
        </Box>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, background: 'linear-gradient(135deg, #6C63FF, #3F51B5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          EduConnect
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, textAlign: 'center' }}>
          {message}
        </Typography>
      </motion.div>
    </Box>
  );
}
