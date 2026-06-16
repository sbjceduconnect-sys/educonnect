import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Construction } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHeader from '../../components/common/PageHeader';

export default function ComingSoonPage({ title = 'Coming Soon', subtitle = 'This feature is under development' }) {
  const navigate = useNavigate();

  return (
    <Box>
      <PageHeader title={title} subtitle={subtitle} />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 10,
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: '24px',
              background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.1), rgba(63, 81, 181, 0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <Construction sx={{ fontSize: 48, color: '#6C63FF' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400 }}>
            {subtitle}. We're building something amazing for you!
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/dashboard')}
            sx={{
              background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
              borderRadius: '12px',
              px: 4,
              py: 1.2,
            }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </motion.div>
    </Box>
  );
}
