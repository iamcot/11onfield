"use client";

import { TicketIcon, CompetitionIcon, EventIcon, HomeIcon, QuizIcon } from "@/components/icons/nav-icons";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { navSection } from "@/lib/nav";
import { useCompetitionNav } from "@/hooks/useQuizNav";
import { usePathname, useSearchParams } from "next/navigation";
import { useT } from "@/i18n/I18nProvider";

interface MobileNavProps {
  backgroundImage?: string;
}

export default function MobileNav({ backgroundImage }: MobileNavProps) {
  const pathname = usePathname();
  const search = useSearchParams();
  const section = navSection(pathname, search.get("tab"));
  const { user } = useAuth();
  const { newsHref, quizHref } = useCompetitionNav();
  const t = useT();

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
          <span className="text-[11px] mt-1 px-1.5 py-0.5 bg-black/30 rounded backdrop-blur-sm whitespace-nowrap">Hồ sơ</span>
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
          <span className="text-[11px] mt-1 px-1.5 py-0.5 bg-black/30 rounded backdrop-blur-sm whitespace-nowrap">Tin tức</span>
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
          <span className="text-[11px] mt-1 px-1.5 py-0.5 bg-black/30 rounded backdrop-blur-sm whitespace-nowrap">Chương trình</span>
        </Link>

        <Link
          href="/events"
          className={`flex flex-col items-center justify-center flex-1 transition ${
            section === "events"
              ? "text-white font-semibold"
              : "text-white/80 hover:text-white"
          }`}
        >
          <TicketIcon className="w-6 h-6 drop-shadow-md" />
          <span className="text-[11px] mt-1 px-1.5 py-0.5 bg-black/30 rounded backdrop-blur-sm whitespace-nowrap">{t("Sự kiện")}</span>
        </Link>

        {/* the QR scanner moved to the top bar; this slot is the quiz practice when it is open */}
        {quizHref && (
          <Link
            href={quizHref}
            className={`flex flex-col items-center justify-center flex-1 transition ${
              section === "quiz"
                ? "text-white font-semibold"
                : "text-white/80 hover:text-white"
            }`}
          >
            <QuizIcon className="w-6 h-6 drop-shadow-md" />
            <span className="text-[11px] mt-1 px-1.5 py-0.5 bg-black/30 rounded backdrop-blur-sm whitespace-nowrap">{t("Luyện tập")}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
