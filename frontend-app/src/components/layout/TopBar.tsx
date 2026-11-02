"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AvatarButton, BellButton } from "./HeaderUser";
import RightNavigator from "./RightNavigator";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

interface TopBarProps {
  onMenuToggle?: () => void;
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const [showRightNav, setShowRightNav] = useState(false);

  const handleAvatarClick = () => {
    setShowRightNav(!showRightNav);
    if (onMenuToggle) {
      onMenuToggle();
    }
  };

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-20">
        <div className="of-appbar relative h-16">
          <div className="flex items-center justify-between h-full px-4">
            {/* Left: logo */}
            <div className="flex-1 flex justify-start">
              <Link href="/">
                <Image
                  src="/images/logo-white-full.png"
                  alt="11 On Field Logo"
                  width={120}
                  height={50}
                  className="object-contain cursor-pointer"
                />
              </Link>
            </div>

            {/* Right: flag, bell and avatar, chamfered like the landing header */}
            <div className="flex items-center gap-1.5">
              <LanguageSwitcher />
              <BellButton />
              <AvatarButton onClick={handleAvatarClick} expanded={showRightNav} />
            </div>
          </div>
        </div>
      </header>
      {/* pages that don't manage their own drawer (competitions, news…) get the default one */}
      {!onMenuToggle && (
        <RightNavigator
          isOpen={showRightNav}
          onClose={() => setShowRightNav(false)}
        />
      )}
    </>
  );
}
