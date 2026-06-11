"use client";

import { CompetitionIcon, EventIcon, HomeIcon } from "@/components/icons/nav-icons";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";
import { useAuth } from "@/contexts/AuthContext";
import { useEditProfile } from "@/contexts/EditProfileContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { competitionService } from "@/services/competition.service";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NotificationDropdown from "./NotificationDropdown";

export default function TopUserCard() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { openEditProfile } = useEditProfile();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newsHref, setNewsHref] = useState("/competitions");

  useEffect(() => {
    competitionService.getCurrentCompetition().then((c) => {
      if (c) setNewsHref(`/competitions/${c.id}/news`);
    });
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const handleEditProfile = () => {
    setShowUserMenu(false);
    openEditProfile();
  };

  const handleChangePassword = () => {
    setShowUserMenu(false);
    setShowChangePasswordModal(true);
  };

  // Navigation items
  const navItems = [
    {
      icon: HomeIcon,
      label: "Hồ sơ",
      href: user?.userid ? `/profile/${user.userid}` : "/",
      isActive: pathname === "/" || pathname.startsWith("/profile"),
    },
    {
      icon: CompetitionIcon,
      label: "Chương trình",
      href: "/competitions",
      isActive: pathname.startsWith("/competitions") && !pathname.includes("/news"),
    },
    {
      icon: EventIcon,
      label: "Tin tức",
      href: newsHref,
      isActive: pathname.includes("/news"),
    },
  ];

  return (
    <div className="hidden md:block fixed top-0 left-0 right-0 z-50 shadow-sm bg-white">

      <div className="relative flex items-center justify-between px-6 h-16">
        {/* Left: Logo and Navigation */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo-color-full.png"
              alt="11of Logo"
              width={120}
              height={32}
              className="object-contain cursor-pointer"
              priority
            />
          </Link>

          {/* Navigation Items */}
          <nav className="flex h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 relative transition ${
                    item.isActive
                      ? "text-green-800 font-semibold"
                      : "text-gray-800 hover:text-green-700"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {/* Active indicator — trapezoid bottom */}
                  {item.isActive && (
                    <div
                      className="absolute bottom-0 left-0 right-0"
                      style={{
                        height: "5px",
                        background: "#1a5c2a",
                        clipPath: "polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)",
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Notifications and User */}
        <div className="flex items-center gap-4">
          {/* Bell Icon */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-full transition"
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
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <NotificationDropdown onClose={() => setShowNotifications(false)} />
            )}
          </div>

          {/* User Avatar with dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-3 py-2 transition"
              aria-label="User menu"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullName || "User"}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                />
              ) : user?.fullName ? (
                <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center border-2 border-gray-200">
                  <span className="text-white font-semibold text-sm">
                    {user.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-200">
                  <svg
                    className="w-6 h-6 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}

              {/* User name and chevron */}
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">
                  {user?.fullName || "User"}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-[100]"
                  onClick={() => setShowUserMenu(false)}
                ></div>

                {/* Menu */}
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[110]">
                  {/* User Info Section */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.fullName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {user?.email || user?.phone}
                    </p>
                  </div>

                  {/* Menu Items */}
                  {user && (
                    <>
                      <button
                        onClick={handleEditProfile}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        <span>Sửa thông tin</span>
                      </button>

                      <button
                        onClick={handleChangePassword}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        <span>Đổi mật khẩu</span>
                      </button>

                      <div className="border-t border-gray-200 my-1"></div>
                    </>
                  )}

                  {user ? (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
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
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>Đăng xuất</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push("/auth/login");
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 flex items-center gap-3"
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
                          d="M11 16l-4-4m0 0l4-4m0 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>Đăng nhập</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </div>
  );
}
