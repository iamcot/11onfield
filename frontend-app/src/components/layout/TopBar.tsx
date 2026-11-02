"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AvatarButton, BellButton } from "./HeaderUser";
import RightNavigator from "./RightNavigator";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import QrScanner from "@/components/qr/QrScanner";
import { useT } from "@/i18n/I18nProvider";

interface TopBarProps {
  onMenuToggle?: () => void;
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const [showRightNav, setShowRightNav] = useState(false);
  const [scanning, setScanning] = useState(false);
  const t = useT();

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

            {/* Right: QR scanner, flag, bell and avatar, chamfered like the landing header */}
            <div className="flex items-center gap-1.5">
              {/* one scanner for every QR: a shared profile opens and is followed, a check-in code checks in */}
              <button type="button" onClick={() => setScanning(true)} className="of-hicon of-cut" aria-label={t("Quét QR")}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
                  <rect x="7" y="7" width="4" height="4" /><rect x="13" y="7" width="4" height="4" /><rect x="7" y="13" width="4" height="4" />
                  <path d="M13 13h4v4h-4z" />
                </svg>
              </button>
              <LanguageSwitcher />
              <BellButton />
              <AvatarButton onClick={handleAvatarClick} expanded={showRightNav} />
            </div>
          </div>
        </div>
      </header>
      {scanning && <QrScanner onClose={() => setScanning(false)} />}
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
