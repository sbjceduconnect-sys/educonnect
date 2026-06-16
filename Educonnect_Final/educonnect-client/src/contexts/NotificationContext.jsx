import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { announcementApi, courseApi } from '../api';
import { setAuthHeader } from '../api/axiosInstance';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, isAuthenticated, accessToken } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Helper to fetch and filter announcements
  const fetchAndFilterNotifications = useCallback(async () => {
    if (!isAuthenticated || !user || !accessToken) return;

    try {
      setAuthHeader(accessToken);

      // 1. Fetch user's courses for course-scope filtering
      let enrolledCourseIds = [];
      try {
        const params = {};
        if (user.role === 'student') params.studentId = user.id;
        if (user.role === 'teacher') params.teacherId = user.id;
        const coursesRes = await courseApi.list(params);
        enrolledCourseIds = (coursesRes.data.data || []).map(c => c.id);
      } catch (err) {
        console.error("Failed to fetch user courses for notification filtering", err);
      }

      // 2. Fetch all announcements
      const annRes = await announcementApi.list();
      const rawAnnouncements = annRes.data.data || [];

      // 3. Filter announcements by audience scope
      const filtered = rawAnnouncements.filter(ann => {
        if (user.role === 'admin') return true;
        if (ann.scope === 'system') return true;
        if (ann.scope === 'department') {
          const userDeptId = user.department || user.profile?.departmentId;
          return Number(ann.targetDepartmentId) === Number(userDeptId);
        }
        if (ann.scope === 'course') {
          return enrolledCourseIds.includes(Number(ann.targetCourseId));
        }
        return false;
      });

      // 4. Format into notification objects
      const formatted = filtered.map(ann => ({
        id: ann.id,
        type: 'ANNOUNCEMENT',
        title: 'New Announcement',
        message: ann.title,
        timestamp: ann.createdAt || new Date().toISOString(),
        ...ann,
      }));

      // Sort by timestamp descending
      formatted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Calculate unread count
      const storageKey = `educonnect_notif_last_read_${user.id}`;
      const storedLastRead = localStorage.getItem(storageKey);

      if (storedLastRead) {
        const lastReadDate = new Date(storedLastRead);
        const unread = formatted.filter(notif => new Date(notif.timestamp) > lastReadDate).length;
        setUnreadCount(unread);
      } else {
        // First time initialization: mark all existing as read
        const newestTimestamp = formatted[0]?.timestamp || new Date().toISOString();
        localStorage.setItem(storageKey, newestTimestamp);
        setUnreadCount(0);
      }

      setNotifications(formatted.slice(0, 50));
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [isAuthenticated, user, accessToken]);

  // Initial fetch and poll setup
  useEffect(() => {
    if (!isAuthenticated || !user || !accessToken) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Initial load
    fetchAndFilterNotifications();

    // Set up polling every 10 seconds
    const interval = setInterval(() => {
      fetchAndFilterNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user, accessToken, fetchAndFilterNotifications]);

  const markAllRead = useCallback(() => {
    if (!user) return;
    const newestTimestamp = notifications[0]?.timestamp || new Date().toISOString();
    const storageKey = `educonnect_notif_last_read_${user.id}`;
    localStorage.setItem(storageKey, newestTimestamp);
    setUnreadCount(0);
  }, [user, notifications]);

  const clearNotifications = useCallback(() => {
    if (!user) return;
    setNotifications([]);
    setUnreadCount(0);
    const storageKey = `educonnect_notif_last_read_${user.id}`;
    localStorage.setItem(storageKey, new Date().toISOString());
  }, [user]);

  const value = useMemo(() => ({
    socket: null, // Socket placeholder to prevent destructuring issues elsewhere
    notifications,
    unreadCount,
    markAllRead,
    clearNotifications,
  }), [notifications, unreadCount, markAllRead, clearNotifications]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}

export default NotificationContext;
