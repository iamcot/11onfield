"use client";

import { EventIcon, HomeIcon, LogoutIcon, PlayerIcon } from "@/components/icons/nav-icons";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface MobileNavProps {
  onLogout?: () => void;
}

export default function MobileNav({ onLogout }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();

  const handleAuthAction = () => {
    if (isAuthenticated) {
      // Logout
      if (onLogout) {
        onLogout();
      } else {
        logout();
        router.push("/auth/login");
      }
    } else {
      // Login
      router.push("/auth/login");
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
      <div className="flex justify-around items-center h-16">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center flex-1 transition ${
            pathname === "/" || pathname.startsWith("/profile")
              ? "text-green-600 font-medium"
              : "text-gray-600 hover:text-green-600"
          }`}
        >
          <HomeIcon className="w-6 h-6" />
          <span className="text-xs mt-1">Hồ sơ</span>
        </Link>

        <Link
          href="/players"
          className={`flex flex-col items-center justify-center flex-1 transition ${
            pathname === "/players"
              ? "text-green-600 font-medium"
              : "text-gray-600 hover:text-green-600"
          }`}
        >
          <PlayerIcon className="w-6 h-6" />
          <span className="text-xs mt-1">Cầu thủ</span>
        </Link>

        <Link
          href="/events"
          className={`flex flex-col items-center justify-center flex-1 transition ${
            pathname === "/events" || pathname.startsWith("/events/")
              ? "text-green-600 font-medium"
              : "text-gray-600 hover:text-green-600"
          }`}
        >
          <EventIcon className="w-6 h-6" />
          <span className="text-xs mt-1">Sự kiện</span>
        </Link>

        <button
          onClick={handleAuthAction}
          className={`flex flex-col items-center justify-center flex-1 ${
            isAuthenticated
              ? "text-red-600 hover:text-red-700"
              : "text-green-600 hover:text-green-700"
          }`}
        >
          <LogoutIcon className="w-6 h-6" />
          <span className="text-xs mt-1">{isAuthenticated ? "Đăng xuất" : "Đăng nhập"}</span>
        </button>
      </div>
    </nav>
  );
}
