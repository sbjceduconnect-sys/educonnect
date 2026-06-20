import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { Capacitor } from '@capacitor/core';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const SIDEBAR_WIDTH = 280;
const SIDEBAR_COLLAPSED = 72;

export default function DashboardLayout() {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggle = () => setSidebarOpen(!sidebarOpen);
  const handleMobileClose = () => setMobileOpen(false);

  const isDashboard = location.pathname === '/dashboard';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        open={sidebarOpen}
        onToggle={handleToggle}
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: { md: 0 },
          width: { md: `calc(100% - ${sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED}px)` },
          maxWidth: '100vw',
          overflowX: 'hidden',
          transition: 'all 0.3s ease',
          minHeight: '100vh',
          bgcolor: 'background.default',
          position: 'relative',
        }}
      >
        {isDashboard && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '240px',
              bgcolor: '#1B3F6B',
              zIndex: 0,
              overflow: 'hidden',
            }}
          >
            {/* Subtle, oversized, soft circular shape bleeding off right edge */}
            <Box
              sx={{
                position: 'absolute',
                top: '-60px',
                right: '-60px',
                width: '240px',
                height: '240px',
                borderRadius: '50%',
                bgcolor: 'rgba(10, 20, 40, 0.45)', // Slightly muted dark tone
                filter: 'blur(30px)',
              }}
            />
          </Box>
        )}
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          sidebarOpen={sidebarOpen}
        />
        <Box sx={{ mt: Capacitor.isNativePlatform() ? 'calc(64px + env(safe-area-inset-top))' : '64px', p: { xs: 2, sm: 3 }, width: '100%', overflowX: 'hidden', position: 'relative', zIndex: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
