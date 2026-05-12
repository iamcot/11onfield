"use client";

import { EventIcon, HomeIcon, PlayerIcon } from "@/components/icons/nav-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileNavProps {
  backgroundImage?: string;
}

export default function MobileNav({ backgroundImage }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 shadow-lg z-40 overflow-hidden">
      {/* Background with gradient connector at top */}
      <div className="absolute inset-0">
        {/* Top gradient connector (light green to green) */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-green-100 to-green-500"></div>

        {/* Main background */}
        {backgroundImage ? (
          <div
            className="absolute inset-0 bg-cover bg-bottom"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          >
            {/* Primary color overlay for theme consistency */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/70 via-green-800/70 to-green-950/70"></div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-green-800 to-green-950"></div>
        )}
      </div>

      {/* Navigation items */}
      <div className="relative flex justify-around items-center h-16 pt-3">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center flex-1 transition ${
            pathname === "/" || pathname.startsWith("/profile")
              ? "text-white font-semibold"
              : "text-white/80 hover:text-white"
          }`}
        >
          <HomeIcon className="w-6 h-6 drop-shadow-md" />
          <span className="text-xs mt-1 px-2 py-0.5 bg-black/30 rounded backdrop-blur-sm">Hồ sơ</span>
        </Link>

        <Link
          href="/players"
          className={`flex flex-col items-center justify-center flex-1 transition ${
            pathname === "/players"
              ? "text-white font-semibold"
              : "text-white/80 hover:text-white"
          }`}
        >
          <PlayerIcon className="w-6 h-6 drop-shadow-md" />
          <span className="text-xs mt-1 px-2 py-0.5 bg-black/30 rounded backdrop-blur-sm">Cầu thủ</span>
        </Link>

        <Link
          href="/events"
          className={`flex flex-col items-center justify-center flex-1 transition ${
            pathname === "/events" || pathname.startsWith("/events/")
              ? "text-white font-semibold"
              : "text-white/80 hover:text-white"
          }`}
        >
          <EventIcon className="w-6 h-6 drop-shadow-md" />
          <span className="text-xs mt-1 px-2 py-0.5 bg-black/30 rounded backdrop-blur-sm">Sự kiện</span>
        </Link>
      </div>
    </nav>
  );
}
