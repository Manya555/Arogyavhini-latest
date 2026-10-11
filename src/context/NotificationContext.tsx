import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppNotification } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { soundEffects } from '../utils/sound';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number | string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number | string) => Promise<void>;
  clearAll: () => Promise<void>;
  addNotification: (notification: Partial<AppNotification> & { title: string; message: string }) => AppNotification;
  notify: (title: string, message: string, type?: string) => AppNotification;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const lastKnownIdsRef = useRef<Set<number | string>>(new Set());

  const addNotification = useCallback((input: Partial<AppNotification> & { title: string; message: string }) => {
    const newNotification: AppNotification = {
      id: input.id || Date.now(),
      user_id: input.user_id ?? user?.id ?? null,
      role: input.role ?? user?.role ?? null,
      title: input.title,
      message: input.message,
      notification_type: input.notification_type || 'SYSTEM_ALERT',
      emergency_request_id: input.emergency_request_id ?? null,
      is_read: input.is_read ?? 0,
      created_at: input.created_at || new Date().toISOString(),
    };

    setNotifications((prev) => [newNotification, ...prev]);
    if (!newNotification.is_read) {
      setUnreadCount((prev) => prev + 1);
    }
    soundEffects.playAlert();
    return newNotification;
  }, [user?.id, user?.role]);

  const notify = useCallback((title: string, message: string, type: string = 'SYSTEM_ALERT') => {
    return addNotification({
      title,
      message,
      notification_type: type,
    });
  }, [addNotification]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setNotifications([]);
      setUnreadCount(0);
      lastKnownIdsRef.current = new Set();
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    try {
      const data = await api.getNotifications({
        userId: user.id,
        role: user.role,
        limit: 50,
      });

      // Check if there are newly arrived notifications to trigger a subtle chime
      const fetched = data.notifications || [];
      const currentIds = new Set(fetched.map((n) => n.id));
      if (lastKnownIdsRef.current.size > 0) {
        const hasNew = fetched.some(
          (n) => !lastKnownIdsRef.current.has(n.id) && !n.is_read
        );
        if (hasNew) {
          soundEffects.playAlert();
        }
      }
      lastKnownIdsRef.current = currentIds;

      setNotifications(fetched);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      // Quietly ignore polling errors to prevent disruptive logs
      console.debug('Notification poll error:', err);
    }
  }, [isAuthenticated, user?.id, user?.role]);

  // Initial fetch and automatic polling interval
  useEffect(() => {
    if (isAuthenticated && user) {
      setLoading(true);
      fetchNotifications().finally(() => setLoading(false));

      // Reliable automatic polling every 4 seconds
      const interval = setInterval(() => {
        fetchNotifications();
      }, 4000);

      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      lastKnownIdsRef.current = new Set();
    }
  }, [isAuthenticated, user?.id, user?.role, fetchNotifications]);

  const markAsRead = async (id: number | string) => {
    try {
      // Optimistic local update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await api.markNotificationRead(id);
    } catch (err) {
      console.error('Failed to mark notification read:', err);
      // Refetch on error
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      // Optimistic local update
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);

      await api.markAllNotificationsRead({
        userId: user.id,
        role: user.role,
      });
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
      fetchNotifications();
    }
  };

  const deleteNotification = async (id: number | string) => {
    try {
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      await api.deleteNotification(id);
    } catch (err) {
      console.error('Failed to delete notification:', err);
      fetchNotifications();
    }
  };

  const clearAll = async () => {
    if (!user) return;
    try {
      setNotifications([]);
      setUnreadCount(0);
      await api.clearAllNotifications({
        userId: user.id,
        role: user.role,
      });
    } catch (err) {
      console.error('Failed to clear notifications:', err);
      fetchNotifications();
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        isOnline,
        setIsOnline,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        addNotification,
        notify,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
