"use client";

import { CompetitionIcon, EventIcon, HomeIcon } from "@/components/icons/nav-icons";
import { useAuth } from "@/contexts/AuthContext";
import { competitionService } from "@/services/competition.service";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface MobileNavProps {
  backgroundImage?: string;
}

export default function MobileNav({ backgroundImage }: MobileNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [newsHref, setNewsHref] = useState("/competitions");

  useEffect(() => {
    competitionService.getCurrentCompetition().then((c) => {
      if (c) setNewsHref(`/competitions/${c.id}/news`);
    });
  }, []);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 shadow-lg z-40 overflow-hidden">
      {/* Background with connector at top */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-3 bg-green-700"></div>
        {backgroundImage ? (
          <div
            className="absolute inset-0 bg-cover bg-bottom"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          >
            <div className="absolute inset-0 bg-green-800/70"></div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-green-800"></div>
        )}
      </div>

      {/* Navigation items */}
      <div className="relative flex justify-around items-center h-16 pt-3">
        <Link
          href={user?.userid ? `/profile/${user.userid}` : "/"}
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
          href="/competitions"
          className={`flex flex-col items-center justify-center flex-1 transition ${
            pathname.startsWith("/competitions")
              ? "text-white font-semibold"
              : "text-white/80 hover:text-white"
          }`}
        >
          <CompetitionIcon className="w-6 h-6 drop-shadow-md" />
          <span className="text-xs mt-1 px-2 py-0.5 bg-black/30 rounded backdrop-blur-sm">Chương trình</span>
        </Link>

        <Link
          href={newsHref}
          className={`flex flex-col items-center justify-center flex-1 transition ${
            pathname.includes("/news")
              ? "text-white font-semibold"
              : "text-white/80 hover:text-white"
          }`}
        >
          <EventIcon className="w-6 h-6 drop-shadow-md" />
          <span className="text-xs mt-1 px-2 py-0.5 bg-black/30 rounded backdrop-blur-sm">Tin tức</span>
        </Link>
      </div>
    </nav>
  );
}
