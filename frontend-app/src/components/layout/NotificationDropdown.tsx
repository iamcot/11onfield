"use client";

import { useNotifications } from "@/contexts/NotificationContext";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface NotificationDropdownProps {
  onClose: () => void;
}

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, markAsRead, markAllAsRead, hasMore, isLoading, loadMoreNotifications } = useNotifications();

  const handleNotificationClick = async (id: number, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(id);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Dropdown */}
      <div className="absolute top-full right-2 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 max-h-[500px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">Thông báo</h3>
          {notifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Đánh dấu đã đọc
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Không có thông báo nào</p>
            </div>
          ) : (
            <>
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id, notification.isRead)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                      !notification.isRead ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="p-3 border-t text-center">
                  <button
                    onClick={loadMoreNotifications}
                    disabled={isLoading}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Đang tải..." : "Xem thêm"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && !hasMore && (
          <div className="p-3 border-t text-center">
            <button
              onClick={onClose}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </>
  );
}
