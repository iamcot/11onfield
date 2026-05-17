"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { notificationService, Notification } from "@/services/notification.service";
import { useAuth } from "./AuthContext";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  currentPage: number;
  fetchNotifications: () => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getNotifications(0, 10);
      setNotifications(data.content);
      setCurrentPage(0);
      setHasMore(data.totalPages > 1);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await notificationService.getUnreadCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, []);

  const connectSSE = useCallback(() => {
    // Close existing connection if any
    if (eventSourceRef.current) {
      console.log("🔌 Closing existing SSE connection");
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Clear any pending reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const token = localStorage.getItem("access_token");
    if (!token) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api";
    const url = `${API_URL}/users/me/notifications/stream?token=${encodeURIComponent(token)}`;

    console.log("📡 Connecting to SSE...");
    const es = new EventSource(url, { withCredentials: true });

    es.addEventListener("connected", () => {
      console.log("✅ SSE connected");
    });

    es.addEventListener("notification", () => {
      console.log("🔔 New notification received via SSE");
      fetchNotifications();
      fetchUnreadCount();
    });

    es.addEventListener("heartbeat", () => {
      console.log("💓 SSE heartbeat");
    });

    es.onerror = (error) => {
      console.error("❌ SSE error:", error);
      es.close();
      eventSourceRef.current = null;

      // Reconnect after 5 seconds if still authenticated
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("🔄 Reconnecting SSE...");
        connectSSE();
      }, 5000);
    };

    eventSourceRef.current = es;
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Clean up when logged out
      if (eventSourceRef.current) {
        console.log("🔌 Closing SSE (logged out)");
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      return;
    }

    fetchNotifications();
    fetchUnreadCount();
    connectSSE();

    return () => {
      console.log("🧹 Cleanup: Closing SSE connection");
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [isAuthenticated, user, fetchNotifications, fetchUnreadCount, connectSSE]);

  const loadMoreNotifications = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const data = await notificationService.getNotifications(nextPage, 10);
      setNotifications((prev) => [...prev, ...data.content]);
      setCurrentPage(nextPage);
      setHasMore(nextPage < data.totalPages - 1);
    } catch (error) {
      console.error("Failed to load more notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, currentPage]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        hasMore,
        currentPage,
        fetchNotifications,
        loadMoreNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}
