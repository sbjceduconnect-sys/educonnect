import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export default function PageHeader({ title, subtitle, action, actionLabel, actionIcon, actionVariant = 'contained' }) {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              background: isDashboard 
                ? 'none' 
                : 'linear-gradient(135deg, #1B3F6B, #F07830)',
              color: isDashboard ? '#FFFFFF' : undefined,
              WebkitBackgroundClip: isDashboard ? 'none' : 'text',
              WebkitTextFillColor: isDashboard ? '#FFFFFF' : 'transparent',
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography 
              variant="body2" 
              sx={{ 
                mt: 0.5, 
                color: isDashboard ? 'rgba(255, 255, 255, 0.8)' : 'text.secondary' 
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && (
          <Button
            variant={actionVariant}
            color="secondary"
            startIcon={actionIcon}
            onClick={action}
            sx={{
              background: actionVariant === 'contained' 
                ? (isDashboard 
                    ? 'linear-gradient(135deg, #F07830, #D25C18)' 
                    : 'linear-gradient(135deg, #1B3F6B, #143052)') 
                : undefined,
              px: 3,
            }}
          >
            {actionLabel}
          </Button>
        )}
      </Box>
    </motion.div>
  );
}
