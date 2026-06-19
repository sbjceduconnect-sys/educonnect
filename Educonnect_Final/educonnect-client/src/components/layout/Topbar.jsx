import React, { useState } from 'react';
import {
  AppBar, Toolbar, Box, IconButton, Typography, Avatar, Badge, Menu, MenuItem,
  ListItemIcon, ListItemText, Divider, Tooltip, InputBase, Paper, useTheme,
  Dialog, DialogContent, List, ListItemButton, CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon, Search, Notifications, DarkMode, LightMode, Settings,
  Logout, Person, MarkEmailRead, School, MenuBook, Announcement,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeMode } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { getGreeting, formatDateTime, getAvatarUrl } from '../../utils/helpers';
import { setAuthHeader } from '../../api/axiosInstance';
import { courseApi, announcementApi, materialApi } from '../../api';

export default function Topbar({ onMenuClick, sidebarOpen }) {
  const { user, accessToken, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const theme = useTheme();

  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotif, setAnchorElNotif] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState({ courses: [], announcements: [], materials: [] });

  const triggerSearch = async (query) => {
    if (!query || query.trim() === '') {
      setSearchResults({ courses: [], announcements: [], materials: [] });
      return;
    }
    setSearchLoading(true);
    try {
      setAuthHeader(accessToken);
      const params = {};
      if (user?.role === 'student') params.studentId = user.id;
      if (user?.role === 'teacher') params.teacherId = user.id;

      const [courseRes, announcementRes, materialRes] = await Promise.all([
        courseApi.list(params).catch(() => ({ data: { data: [] } })),
        announcementApi.list().catch(() => ({ data: { data: [] } })),
        materialApi.list().catch(() => ({ data: { data: [] } })),
      ]);

      const q = query.toLowerCase();
      const filteredCourses = (courseRes.data.data || []).filter(
        c => c.title?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q)
      );
      const filteredAnnouncements = (announcementRes.data.data || []).filter(
        a => a.title?.toLowerCase().includes(q) || a.body?.toLowerCase().includes(q)
      );
      const filteredMaterials = (materialRes.data.data || []).filter(
        m => m.title?.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q)
      );

      setSearchResults({
        courses: filteredCourses,
        announcements: filteredAnnouncements,
        materials: filteredMaterials,
      });
    } catch (err) {
      console.error("Global search error:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchClick = () => {
    setSearchOpen(true);
    triggerSearch(searchQuery);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      setSearchOpen(true);
      triggerSearch(searchQuery);
    }
  };

  const handleLogout = async () => {
    setAnchorElUser(null);
    await logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        ml: { md: sidebarOpen ? '280px' : '72px' },
        width: { md: `calc(100% - ${sidebarOpen ? 280 : 72}px)` },
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(20px)',
        background: theme.palette.mode === 'dark'
          ? 'rgba(26, 26, 46, 0.85)'
          : 'rgba(255, 255, 255, 0.85)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: 'text.primary',
        pt: Capacitor.isNativePlatform() ? 'env(safe-area-inset-top)' : 0,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1, sm: 2 } }}>
        {/* Left side */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={onMenuClick}
            sx={{ display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              {getGreeting()}, <span style={{ background: 'linear-gradient(135deg, #6C63FF, #3F51B5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.firstName || 'User'}</span> 👋
            </Typography>
          </Box>
        </Box>

        {/* Search */}
        <Paper
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            width: 320,
            px: 2,
            py: 0.5,
            borderRadius: '12px',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            boxShadow: 'none',
            border: `1px solid ${theme.palette.divider}`,
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'text.secondary',
            },
            '&:focus-within': {
              border: `1px solid ${theme.palette.secondary.main}`,
              boxShadow: '0 0 0 3px rgba(108, 99, 255, 0.1)',
            },
          }}
          onClick={() => {
            setSearchOpen(true);
            triggerSearch(searchQuery);
          }}
        >
          <Search sx={{ color: 'text.secondary', mr: 1 }} fontSize="small" />
          <InputBase
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            sx={{ flex: 1, fontSize: '0.875rem', cursor: 'pointer' }}
          />
        </Paper>

        {/* Right side */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton onClick={toggleTheme} sx={{ borderRadius: '10px' }}>
              {mode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton onClick={(e) => setAnchorElNotif(e.currentTarget)} sx={{ borderRadius: '10px' }}>
              <Badge badgeContent={unreadCount} color="error" max={9}>
                <Notifications fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User avatar */}
          <Tooltip title="Account">
            <IconButton onClick={(e) => setAnchorElUser(e.currentTarget)} sx={{ ml: 0.5 }}>
              <Avatar
                src={getAvatarUrl(user?.avatar)}
                sx={{
                  width: 35, height: 35, fontSize: '0.8rem', fontWeight: 700,
                  background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
                  cursor: 'pointer',
                }}
              >
                {(user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* Notification Menu */}
      <Menu
        anchorEl={anchorElNotif}
        open={Boolean(anchorElNotif)}
        onClose={() => setAnchorElNotif(null)}
        PaperProps={{
          sx: { width: 360, maxHeight: 400, borderRadius: '12px', mt: 1 },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Notifications</Typography>
          {unreadCount > 0 && (
            <IconButton size="small" onClick={() => { markAllRead(); }} title="Mark all read">
              <MarkEmailRead fontSize="small" />
            </IconButton>
          )}
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">No notifications yet</Typography>
          </Box>
        ) : (
          notifications.slice(0, 10).map((notif, i) => (
            <MenuItem key={i} sx={{ py: 1.5, whiteSpace: 'normal' }} onClick={() => setAnchorElNotif(null)}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{notif.title}</Typography>
                <Typography variant="caption" color="text.secondary">{notif.message}</Typography>
                <Typography variant="caption" display="block" color="text.disabled" sx={{ mt: 0.5 }}>
                  {formatDateTime(notif.timestamp)}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>

      {/* User Menu */}
      <Menu
        anchorEl={anchorElUser}
        open={Boolean(anchorElUser)}
        onClose={() => setAnchorElUser(null)}
        PaperProps={{ sx: { width: 220, borderRadius: '12px', mt: 1 } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{user?.firstName} {user?.lastName}</Typography>
          <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => { setAnchorElUser(null); navigate('/profile'); }}>
          <ListItemIcon><Person fontSize="small" /></ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setAnchorElUser(null); navigate('/settings'); }}>
          <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon><Logout fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>

      {/* Global Search Dialog */}
      <Dialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        maxWidth="sm"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: '20px',
            background: theme.palette.mode === 'dark' ? 'rgba(26, 26, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.divider}`,
            minHeight: '200px',
          }
        }}
      >
        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Search color="action" />
          <InputBase
            placeholder="Search courses, announcements, materials..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              triggerSearch(e.target.value);
            }}
            fullWidth
            autoFocus
            sx={{ fontSize: '1rem', fontWeight: 500 }}
          />
        </Box>
        <DialogContent sx={{ p: 0, maxHeight: 400 }}>
          {searchLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress size={30} />
            </Box>
          ) : (
            <Box sx={{ py: 1.5 }}>
              {searchResults.courses.length === 0 &&
               searchResults.announcements.length === 0 &&
               searchResults.materials.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary" variant="body2">
                    {searchQuery ? 'No results found matching your query.' : 'Type something to search across EduConnect.'}
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {/* Courses Section */}
                  {searchResults.courses.length > 0 && (
                    <>
                      <Box sx={{ px: 2.5, py: 1, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'secondary.main', textTransform: 'uppercase', tracking: 1.5 }}>
                          Courses & Classes
                        </Typography>
                      </Box>
                      {searchResults.courses.map((course) => (
                        <ListItemButton
                          key={course.id}
                          onClick={() => {
                            setSearchOpen(false);
                            navigate('/courses');
                          }}
                          sx={{ px: 3, py: 1.5 }}
                        >
                          <ListItemIcon><School color="primary" /></ListItemIcon>
                          <ListItemText
                            primary={course.title}
                            secondary={`Code: ${course.courseCode || course.course_code || 'N/A'} | Academic Year: ${course.academicYear || 'N/A'}`}
                            primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }}
                            secondaryTypographyProps={{ fontSize: '0.75rem' }}
                          />
                        </ListItemButton>
                      ))}
                    </>
                  )}

                  {/* Announcements Section */}
                  {searchResults.announcements.length > 0 && (
                    <>
                      <Box sx={{ px: 2.5, py: 1, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', mt: 1.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'secondary.main', textTransform: 'uppercase', tracking: 1.5 }}>
                          Announcements
                        </Typography>
                      </Box>
                      {searchResults.announcements.map((ann) => (
                        <ListItemButton
                          key={ann.id}
                          onClick={() => {
                            setSearchOpen(false);
                            navigate('/announcements');
                          }}
                          sx={{ px: 3, py: 1.5 }}
                        >
                          <ListItemIcon><Announcement color="warning" /></ListItemIcon>
                          <ListItemText
                            primary={ann.title}
                            secondary={ann.content ? (ann.content.substring(0, 80) + '...') : ''}
                            primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }}
                            secondaryTypographyProps={{ fontSize: '0.75rem' }}
                          />
                        </ListItemButton>
                      ))}
                    </>
                  )}

                  {/* Materials Section */}
                  {searchResults.materials.length > 0 && (
                    <>
                      <Box sx={{ px: 2.5, py: 1, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', mt: 1.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'secondary.main', textTransform: 'uppercase', tracking: 1.5 }}>
                          Study Materials
                        </Typography>
                      </Box>
                      {searchResults.materials.map((mat) => (
                        <ListItemButton
                          key={mat.id}
                          onClick={() => {
                            setSearchOpen(false);
                            navigate(mat.type === 'question_paper' ? '/question-papers' : '/materials');
                          }}
                          sx={{ px: 3, py: 1.5 }}
                        >
                          <ListItemIcon><MenuBook color="success" /></ListItemIcon>
                          <ListItemText
                            primary={mat.title}
                            secondary={mat.description}
                            primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }}
                            secondaryTypographyProps={{ fontSize: '0.75rem' }}
                          />
                        </ListItemButton>
                      ))}
                    </>
                  )}
                </List>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </AppBar>
  );
}
