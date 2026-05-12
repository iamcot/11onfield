"use client";

interface SidebarProps {
  onLogout?: () => void;
}

export default function Sidebar({}: SidebarProps) {
  return (
    <>
      {/* Sidebar is now hidden on desktop, only show on mobile via MobileNav */}
      <aside className="hidden">
        {/* Sidebar content hidden */}
      </aside>
    </>
  );
}

