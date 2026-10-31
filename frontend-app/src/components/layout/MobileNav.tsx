"use client";

import { CompetitionIcon, EventIcon, HomeIcon } from "@/components/icons/nav-icons";
import { useAuth } from "@/contexts/AuthContext";
import { competitionService } from "@/services/competition.service";
import Link from "next/link";
import { navSection, newsHrefOf } from "@/lib/nav";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import QrScanner from "@/components/qr/QrScanner";
import { useT } from "@/i18n/I18nProvider";

interface MobileNavProps {
  backgroundImage?: string;
}

export default function MobileNav({ backgroundImage }: MobileNavProps) {
  const pathname = usePathname();
  const search = useSearchParams();
  const section = navSection(pathname, search.get("tab"));
  const { user } = useAuth();
  const [newsHref, setNewsHref] = useState("/competitions");
  const [scanning, setScanning] = useState(false);
  const t = useT();

  useEffect(() => {
    competitionService.getCurrentCompetition().then((c) => {
      if (c) setNewsHref(newsHrefOf(c.id));
    });
  }, []);

  return (
    <nav className="of-appnav md:hidden fixed bottom-0 left-0 right-0 shadow-lg z-40 overflow-hidden">
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
            section === "profile"
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
            section === "competitions"
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
            section === "news"
              ? "text-white font-semibold"
              : "text-white/80 hover:text-white"
          }`}
        >
          <EventIcon className="w-6 h-6 drop-shadow-md" />
          <span className="text-xs mt-1 px-2 py-0.5 bg-black/30 rounded backdrop-blur-sm">Tin tức</span>
        </Link>

        {/* one scanner for every QR: a shared profile opens and is followed, a check-in code checks in */}
        <button
          type="button"
          onClick={() => setScanning(true)}
          className="flex flex-col items-center justify-center flex-1 transition text-white/80 hover:text-white"
        >
          <svg className="w-6 h-6 drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
            <rect x="7" y="7" width="4" height="4" /><rect x="13" y="7" width="4" height="4" /><rect x="7" y="13" width="4" height="4" />
            <path d="M13 13h4v4h-4z" />
          </svg>
          <span className="text-xs mt-1 px-2 py-0.5 bg-black/30 rounded backdrop-blur-sm">{t("Quét QR")}</span>
        </button>
      </div>
      {scanning && <QrScanner onClose={() => setScanning(false)} />}
    </nav>
  );
}
