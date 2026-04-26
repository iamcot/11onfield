"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EventIcon,
  HomeIcon,
  LogoutIcon,
  PlayerIcon,
} from "@/components/icons/nav-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface NavItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  collapsed: boolean;
  isActive: boolean;
}

function NavItem({ icon: Icon, label, href, collapsed, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 transition ${
        isActive
          ? "bg-green-100 text-green-700 font-medium"
          : "text-gray-700 hover:bg-green-50 hover:text-green-600"
      }`}
      title={collapsed ? label : undefined}
    >
      <Icon className="w-5 h-5" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

interface SidebarProps {
  onLogout?: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const { isCollapsed, setIsCollapsed } = useSidebar();
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
    <>
      <aside
        className={`${
          isCollapsed ? "w-16" : "w-64"
        } hidden md:flex bg-white shadow-lg transition-all duration-300 flex-col relative`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b px-2">
          <Image
            src={isCollapsed ? "/images/green_11.png" : "/images/green_11onfield.png"}
            alt="11of Logo"
            width={isCollapsed ? 40 : 150}
            height={isCollapsed ? 40 : 40}
            className="object-contain"
            priority
          />
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4">
          <NavItem
            icon={HomeIcon}
            label="Hồ sơ"
            href="/"
            collapsed={isCollapsed}
            isActive={pathname === "/" || pathname.startsWith("/profile")}
          />
          <NavItem
            icon={PlayerIcon}
            label="Cầu thủ"
            href="/players"
            collapsed={isCollapsed}
            isActive={pathname === "/players"}
          />
          <NavItem
            icon={EventIcon}
            label="Sự kiện"
            href="/events"
            collapsed={isCollapsed}
            isActive={pathname === "/events" || pathname.startsWith("/events/")}
          />
        </nav>
      </aside>

      {/* Collapse Button - Fixed at bottom */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`hidden md:flex fixed bottom-0 left-0 h-12 border-t bg-white items-center justify-center hover:bg-gray-50 text-gray-600 transition-all duration-300 z-10 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {isCollapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
      </button>
    </>
  );
}
