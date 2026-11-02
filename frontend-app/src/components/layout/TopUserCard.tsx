"use client";

import { TicketIcon, CompetitionIcon, EventIcon, HomeIcon } from "@/components/icons/nav-icons";
import { useAuth } from "@/contexts/AuthContext";
import { competitionService } from "@/services/competition.service";
import Image from "next/image";
import Link from "next/link";
import { navSection, newsHrefOf } from "@/lib/nav";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BellButton, UserMenu } from "./HeaderUser";
import { useT } from "@/i18n/I18nProvider";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

export default function TopUserCard() {
  const t = useT();
  const { user } = useAuth();
  const pathname = usePathname();
  const search = useSearchParams();
  const section = navSection(pathname, search.get("tab"));
  const [newsHref, setNewsHref] = useState("/competitions");

  useEffect(() => {
    competitionService.getCurrentCompetition().then((c) => {
      if (c) setNewsHref(newsHrefOf(c.id));
    });
  }, []);

  // Navigation items
  const navItems = [
    {
      icon: HomeIcon,
      label: t("Hồ sơ"),
      href: user?.userid ? `/profile/${user.userid}` : "/",
      isActive: section === "profile",
    },
    {
      icon: CompetitionIcon,
      label: t("Chương trình"),
      href: "/competitions",
      isActive: section === "competitions",
    },
    {
      icon: EventIcon,
      label: t("Tin tức"),
      href: newsHref,
      isActive: section === "news",
    },
    {
      icon: TicketIcon,
      label: t("Sự kiện"),
      href: "/events",
      isActive: section === "events",
    },
  ];

  return (
    <div className="of-appbar hidden md:block fixed top-0 left-0 right-0 z-50">

      <div className="relative flex items-center justify-between px-6 h-16">
        {/* Left: Logo and Navigation */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo-white-full.png"
              alt="11 On Field Logo"
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
                  key={item.label}
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

        {/* Right: language, notifications and user, all chamfered like the landing header */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              <LanguageSwitcher />
              <BellButton />
              <UserMenu />
            </>
          ) : (
            <>
              <Link href="/auth/login" className="of-hbtn of-cut">
                {t("Đăng nhập")}
              </Link>
              <Link href="/auth/register" className="of-btn of-btn--hdr">
                {t("Đăng ký")}
              </Link>
              <LanguageSwitcher />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
