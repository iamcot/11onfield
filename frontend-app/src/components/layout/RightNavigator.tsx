"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEditProfile } from "@/contexts/EditProfileContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface RightNavigatorProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  scrollOnOpen?: boolean;
}

export default function RightNavigator({ isOpen, onClose, children, scrollOnOpen = false }: RightNavigatorProps) {
  const { logout, user } = useAuth();
  const { openEditProfile } = useEditProfile();
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && scrollOnOpen && contentRef.current) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [isOpen, scrollOnOpen]);

  const handleSignOut = () => {
    logout();
    router.push("/auth/login");
    onClose();
  };

  const handleEditProfile = () => {
    openEditProfile();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Right Drawer */}
      <div
        className={`md:hidden fixed top-0 right-0 bottom-0 w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close button inside the drawer */}
        <button
          onClick={onClose}
          className="absolute right-2 top-2 bg-white text-gray-600 hover:text-gray-800 rounded-full p-2 shadow-md border border-gray-200 transition z-10"
          aria-label="Close menu"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div ref={contentRef}>
          {children ? (
            children
          ) : (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-300 p-4">

                {/* User Info */}
                <div className="mt-4 flex items-center gap-3">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName || "User"}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white"
                    />
                  ) : user?.fullName ? (
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border-2 border-white">
                      <span className="text-orange-500 font-bold text-lg">
                        {user.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                      <svg
                        className="w-7 h-7 text-orange-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}
                  <div className="text-white">
                    <p className="font-semibold">{user?.fullName || "Guest"}</p>
                    <p className="text-sm text-white/80">{user?.email || ""}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <nav className="p-4 space-y-2">
                {user && (
                  <button
                    onClick={handleEditProfile}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition"
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span className="font-medium">Sửa thông tin</span>
                  </button>
                )}

                {user ? (
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
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
                    <span className="font-medium">Đăng xuất</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      router.push("/auth/login");
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-green-600 hover:bg-green-50 rounded-lg transition"
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
                    <span className="font-medium">Đăng nhập</span>
                  </button>
                )}
              </nav>
            </>
          )}
        </div>
      </div>
    </>
  );
}
