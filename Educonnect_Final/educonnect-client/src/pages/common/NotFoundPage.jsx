import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { SentimentDissatisfied } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 3 }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <Typography variant="h1" sx={{ fontWeight: 900, fontSize: '6rem', background: 'linear-gradient(135deg, #6C63FF, #3F51B5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 1 }}>
          404
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Page Not Found</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>The page you're looking for doesn't exist or has been moved.</Typography>
        <Button variant="contained" onClick={() => navigate('/dashboard')} sx={{ background: 'linear-gradient(135deg, #6C63FF, #3F51B5)', borderRadius: '12px', px: 4 }}>
          Go Home
        </Button>
      </motion.div>
    </Box>
  );
}
