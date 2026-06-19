import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer, Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography,
  IconButton, Divider, Collapse, Avatar, Tooltip, useMediaQuery, useTheme,
} from '@mui/material';
import {
  Dashboard, People, School, MenuBook, Assessment, EventNote, CalendarMonth,
  Announcement, LibraryBooks, Feedback, Schedule, SmartToy, Settings, ExpandLess,
  ExpandMore, ChevronLeft, ChevronRight, GradeRounded, FactCheck, Description,
  QrCode2, AdminPanelSettings, HistoryEdu,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Capacitor } from '@capacitor/core';

const SIDEBAR_WIDTH = 280;
const SIDEBAR_COLLAPSED = 72;

const getMenuItems = (role) => {
  const common = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Announcements', icon: <Announcement />, path: '/announcements' },
    { text: 'Calendar', icon: <CalendarMonth />, path: '/calendar' },
  ];

  const studentItems = [
    { text: 'My Courses', icon: <School />, path: '/courses' },
    { text: 'Materials', icon: <MenuBook />, path: '/materials' },
    { text: 'Question Papers', icon: <Description />, path: '/question-papers' },
    { text: 'My Attendance', icon: <FactCheck />, path: '/attendance' },
    { text: 'Exams', icon: <GradeRounded />, path: '/exams' },
    { text: 'My Results', icon: <Assessment />, path: '/results' },
    { text: 'Timetable', icon: <EventNote />, path: '/timetable' },
    { text: 'Library', icon: <LibraryBooks />, path: '/library' },
    { text: 'Office Hours', icon: <Schedule />, path: '/office-hours' },
    { text: 'Feedback', icon: <Feedback />, path: '/feedback' },
  ];

  const teacherItems = [
    { text: 'My Courses', icon: <School />, path: '/courses' },
    { text: 'Subjects', icon: <MenuBook />, path: '/subjects' },
    { text: 'Materials', icon: <MenuBook />, path: '/materials' },
    { text: 'Question Papers', icon: <Description />, path: '/question-papers' },
    { text: 'Attendance', icon: <QrCode2 />, path: '/attendance' },
    { text: 'Exams', icon: <GradeRounded />, path: '/exams' },
    { text: 'Results', icon: <Assessment />, path: '/results' },
    { text: 'Lesson Plans', icon: <HistoryEdu />, path: '/lesson-plans' },
    { text: 'Office Hours', icon: <Schedule />, path: '/office-hours' },
    { text: 'AI Summary', icon: <SmartToy />, path: '/ai-summary' },
    { text: 'Timetable', icon: <EventNote />, path: '/timetable' },
  ];

  const adminItems = [
    { text: 'Users', icon: <People />, path: '/users' },
    { text: 'Departments', icon: <AdminPanelSettings />, path: '/departments' },
    { text: 'Courses', icon: <School />, path: '/courses' },
    { text: 'Subjects', icon: <MenuBook />, path: '/subjects' },
    { text: 'Exams', icon: <GradeRounded />, path: '/exams' },
    { text: 'Results', icon: <Assessment />, path: '/results' },
    { text: 'Timetable', icon: <EventNote />, path: '/timetable' },
    { text: 'Library', icon: <LibraryBooks />, path: '/library' },
    { text: 'Attendance Reports', icon: <FactCheck />, path: '/attendance' },
    { text: 'Feedback', icon: <Feedback />, path: '/feedback' },
    { text: 'Audit Logs', icon: <Settings />, path: '/audit-logs' },
  ];

  if (role === 'student') return [...common, ...studentItems];
  if (role === 'teacher') return [...common, ...teacherItems];
  if (role === 'admin') return [...common, ...adminItems];
  return common;
};

export default function Sidebar({ open, onToggle, mobileOpen, onMobileClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const menuItems = getMenuItems(user?.role);

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)'
          : 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFF 100%)',
        borderRight: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 2, pt: (isMobile && Capacitor.isNativePlatform()) ? 'calc(16px + env(safe-area-inset-top))' : 2, display: 'flex', alignItems: 'center', justifyContent: open ? 'space-between' : 'center', minHeight: 64 }}>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40, height: 40, borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(108, 99, 255, 0.3)',
                }}
              >
                <Typography sx={{ fontSize: '1.3rem' }}>🎓</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2, background: 'linear-gradient(135deg, #6C63FF, #3F51B5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  EduConnect
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  SaiBalaji Jr. College
                </Typography>
              </Box>
            </Box>
          </motion.div>
        )}
        {!isMobile && (
          <IconButton onClick={onToggle} size="small" sx={{ bgcolor: 'action.hover', borderRadius: '8px' }}>
            {open ? <ChevronLeft fontSize="small" /> : <ChevronRight fontSize="small" />}
          </IconButton>
        )}
      </Box>

      <Divider sx={{ mx: 2 }} />

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1, px: 1 }}>
        <List disablePadding>
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Tooltip key={item.text} title={!open ? item.text : ''} placement="right" arrow>
                <ListItem disablePadding sx={{ mb: 0.3 }}>
                  <ListItemButton
                    onClick={() => {
                      if (isMobile) {
                        onMobileClose();
                        setTimeout(() => {
                          navigate(item.path);
                        }, 150);
                      } else {
                        navigate(item.path);
                      }
                    }}
                    sx={{
                      borderRadius: '10px',
                      minHeight: 44,
                      justifyContent: open ? 'initial' : 'center',
                      px: 1.5,
                      bgcolor: isActive ? 'rgba(108, 99, 255, 0.12)' : 'transparent',
                      color: isActive ? 'secondary.main' : 'text.secondary',
                      '&:hover': {
                        bgcolor: isActive ? 'rgba(108, 99, 255, 0.16)' : 'action.hover',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0, mr: open ? 1.5 : 'auto',
                        color: isActive ? 'secondary.main' : 'text.secondary',
                        justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {open && (
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: '0.85rem',
                          fontWeight: isActive ? 600 : 400,
                        }}
                      />
                    )}
                    {isActive && (
                      <Box
                        sx={{
                          width: 4, height: 24, borderRadius: 2,
                          background: 'linear-gradient(180deg, #6C63FF, #3F51B5)',
                          position: 'absolute', right: 0,
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              </Tooltip>
            );
          })}
        </List>
      </Box>

      {/* User section */}
      {open && user && (
        <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Box
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
              borderRadius: '12px', bgcolor: 'action.hover',
              cursor: 'pointer', transition: 'all 0.2s ease',
              '&:hover': { bgcolor: 'action.selected' },
            }}
            onClick={() => navigate('/profile')}
          >
            <Avatar
              sx={{
                width: 36, height: 36, fontSize: '0.85rem',
                background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
              }}
            >
              {(user.firstName?.[0] || '') + (user.lastName?.[0] || '')}
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }} noWrap>
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                {user.role}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        transitionDuration={Capacitor.isNativePlatform() ? 0 : undefined}
        sx={{ '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box' } }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED,
        flexShrink: 0,
        transition: 'width 0.3s ease',
        '& .MuiDrawer-paper': {
          width: open ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED,
          boxSizing: 'border-box',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
