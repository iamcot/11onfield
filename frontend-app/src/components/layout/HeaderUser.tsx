"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";
import { useT } from "@/i18n/I18nProvider";
import NotificationDropdown from "./NotificationDropdown";

/*
 * The signed-in end of every header: bell and avatar as chamfered squares, the same frame and
 * height as the flag button and the header's other buttons (.of-hbtn / .of-hicon in home.css).
 * Popups are wrapped in `.of-app .of-modal` so they get the dark app skin on the landing pages too.
 */

function AvatarFace({ size }: { size: "sm" | "md" }) {
  const { user } = useAuth();
  const cls = `of-havatar of-havatar--${size}`;
  if (user?.avatar) return <img src={user.avatar} alt="" className={cls} />;
  return (
    <span className={cls} aria-hidden="true">
      {user?.fullName ? (
        user.fullName.charAt(0).toUpperCase()
      ) : (
        <svg width="60%" height="60%" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      )}
    </span>
  );
}

export function BellButton() {
  const t = useT();
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  // below lg the dropdown anchors to the header itself, so its 320px panel stays on screen
  return (
    <div className="flex lg:relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="of-hicon of-cut"
        aria-label={t("Thông báo")}
        aria-expanded={open}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && <span className="of-hbadge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>
      {open && (
        <div className="of-app of-modal">
          <NotificationDropdown onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

/** Mobile: the avatar alone, opening the page's drawer or menu. */
export function AvatarButton({ onClick, expanded }: { onClick: () => void; expanded?: boolean }) {
  const t = useT();
  return (
    <button type="button" onClick={onClick} className="of-hicon of-hicon--avatar of-cut" aria-label={t("Menu người dùng")} aria-expanded={expanded}>
      <AvatarFace size="md" />
    </button>
  );
}

/** Desktop: avatar, name and a dropdown with the profile and account actions. */
export function UserMenu() {
  const t = useT();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  const item = "of-hmenu-item";
  return (
    <div className="relative flex">
      <button type="button" onClick={() => setOpen((v) => !v)} className="of-huser of-cut" aria-label={t("Menu người dùng")} aria-expanded={open}>
        <AvatarFace size="sm" />
        <span className="of-huser-name hidden xl:block">{user?.fullName || t("Tài khoản")}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
          <div className="of-hmenu of-cut absolute" role="menu">
            <div className="of-hmenu-head">
              <p className="truncate font-semibold text-white">{user?.fullName}</p>
              <p className="truncate text-xs text-[color:var(--mute,#c4d0c8)]">{user?.email || user?.phone}</p>
            </div>
            {user?.userid && (
              <Link href={`/profile/${user.userid}`} className={item} role="menuitem" onClick={() => setOpen(false)}>
                {t("Hồ sơ của tôi")}
              </Link>
            )}
            <button type="button" className={item} role="menuitem" onClick={() => { setOpen(false); setPwOpen(true); }}>
              {t("Đổi mật khẩu")}
            </button>
            <button
              type="button"
              className={`${item} of-hmenu-item--danger`}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                logout();
                router.push("/auth/login");
              }}
            >
              {t("Đăng xuất")}
            </button>
          </div>
        </>
      )}
      <ChangePasswordModal isOpen={pwOpen} onClose={() => setPwOpen(false)} />
    </div>
  );
}
