import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';

export default function PageHeader({ title, subtitle, action, actionLabel, actionIcon, actionVariant = 'contained' }) {
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
              background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
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
              background: actionVariant === 'contained' ? 'linear-gradient(135deg, #6C63FF, #3F51B5)' : undefined,
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
