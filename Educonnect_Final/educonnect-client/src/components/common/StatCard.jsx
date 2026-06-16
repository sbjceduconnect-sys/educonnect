import React from 'react';
import { Card, CardContent, Box, Typography, Avatar, useTheme } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';
import { motion } from 'framer-motion';

const colorMap = {
  blue: { bg: 'rgba(33, 150, 243, 0.1)', color: '#2196F3', dark: 'rgba(33, 150, 243, 0.15)' },
  green: { bg: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', dark: 'rgba(76, 175, 80, 0.15)' },
  orange: { bg: 'rgba(255, 152, 0, 0.1)', color: '#FF9800', dark: 'rgba(255, 152, 0, 0.15)' },
  purple: { bg: 'rgba(108, 99, 255, 0.1)', color: '#6C63FF', dark: 'rgba(108, 99, 255, 0.15)' },
  red: { bg: 'rgba(244, 67, 54, 0.1)', color: '#F44336', dark: 'rgba(244, 67, 54, 0.15)' },
  teal: { bg: 'rgba(0, 150, 136, 0.1)', color: '#009688', dark: 'rgba(0, 150, 136, 0.15)' },
};

export default function StatCard({ title, value, subtitle, icon, color = 'blue', trend, trendValue, delay = 0 }) {
  const theme = useTheme();
  const colorConfig = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
    >
      <Card
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '16px',
          border: `1px solid ${theme.palette.divider}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            background: `linear-gradient(180deg, ${colorConfig.color}, transparent)`,
          },
        }}
      >
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5, fontSize: '0.8rem' }}>
                {title}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2, color: colorConfig.color }}>
                {value}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {subtitle}
                </Typography>
              )}
              {trend && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                  {trend === 'up' && <TrendingUp sx={{ fontSize: 16, color: '#4CAF50' }} />}
                  {trend === 'down' && <TrendingDown sx={{ fontSize: 16, color: '#F44336' }} />}
                  {trend === 'flat' && <TrendingFlat sx={{ fontSize: 16, color: '#FF9800' }} />}
                  <Typography variant="caption" sx={{ color: trend === 'up' ? '#4CAF50' : trend === 'down' ? '#F44336' : '#FF9800', fontWeight: 600 }}>
                    {trendValue}
                  </Typography>
                </Box>
              )}
            </Box>
            <Avatar
              sx={{
                width: 48, height: 48,
                bgcolor: theme.palette.mode === 'dark' ? colorConfig.dark : colorConfig.bg,
                color: colorConfig.color,
                borderRadius: '14px',
              }}
            >
              {icon}
            </Avatar>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}
