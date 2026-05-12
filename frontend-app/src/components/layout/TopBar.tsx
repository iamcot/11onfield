"use client";

import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { useState } from "react";

interface TopBarProps {
  onMenuToggle?: () => void;
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const [showRightNav, setShowRightNav] = useState(false);
  const { user } = useAuth();

  const handleAvatarClick = () => {
    setShowRightNav(!showRightNav);
    if (onMenuToggle) {
      onMenuToggle();
    }
  };

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-20">
      <div className="relative bg-gradient-to-r from-orange-600 to-orange-400 h-16 pb-2">
        <div className="flex items-center justify-between h-full px-4">
          {/* Left spacer for centering */}
          <div className="w-20"></div>

          {/* Center Logo */}
          <div className="flex-1 flex justify-center">
            <Image
              src="/images/green_11onfield.png"
              alt="11of Logo"
              width={120}
              height={50}
              className="object-contain"
            />
          </div>

          {/* Right Icons Container */}
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
            {/* Bell Icon */}
            <button
              className="relative p-1 text-white hover:bg-white/20 rounded-full transition"
              aria-label="Notifications"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {/* Notification badge */}
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Avatar */}
            <button
              onClick={handleAvatarClick}
              className="relative p-0.5 hover:bg-white/20 rounded-full transition"
              aria-label="User menu"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullName || "User"}
                  className="w-8 h-8 rounded-full object-cover border-2 border-white"
                />
              ) : user?.fullName ? (
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border-2 border-white">
                  <span className="text-orange-500 font-semibold text-sm">
                    {user.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border-2 border-white">
                  <svg
                    className="w-5 h-5 text-orange-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* White overlay with rounded top corners */}
        <div className="absolute -bottom-1 left-0 right-0 h-4 bg-white rounded-t-3xl"></div>
      </div>
    </header>
  );
}
