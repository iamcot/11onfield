"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronRightIcon } from "../icons/nav-icons";
import { competitionService } from "@/services/competition.service";

export default function LandingFooter() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [newsHref, setNewsHref] = useState<string>("#");

  useEffect(() => {
    competitionService.getCurrentCompetition().then((competition) => {
      if (competition?.id) {
        setNewsHref(`/competitions/${competition.id}/news`);
      }
    });
  }, []);

  const policyLinks = [
    { label: "Điều khoản tham gia", href: "/terms" },
    { label: "Chính sách bảo mật thông tin", href: "/privacy" },
    { label: "Chính sách sử dụng hình ảnh/video", href: "/media-policy" },
    { label: "Tin tức", href: newsHref },
  ];

  return (
    <footer className="w-full bg-green-700 md:bg-green-900 pt-12 pb-2 relative overflow-hidden">
      {/* Background image with repeat - desktop only */}
      <div
        className="hidden md:block absolute inset-0 bg-repeat"
        style={{ backgroundImage: "url(/images/background-footer.png)" }}
      ></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
          {/* Column 1: Logo */}
          <div className="flex flex-col items-center md:items-start relative md:pr-6">
            <Image
              src="/images/footer-logo.png"
              alt="11 on Field"
              width={320}
              height={100}
              className="mb-4 w-36 md:w-52"
            />
            {/* Gold divider line on desktop */}
            <div
              className="hidden md:block absolute right-0 top-8 bottom-8"
              style={{ width: "0.5px", backgroundColor: "rgb(207, 159, 61)" }}
            ></div>
          </div>

          {/* Column 3: Policy Links */}
          <div className="relative md:px-6">
            <h4
              className="font-bold text-base mb-4 uppercase"
              style={{ color: "rgb(207, 159, 61)" }}
            >
              Chính sách
            </h4>
            <ul className="space-y-2">
              {policyLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-green-100 hover:text-white flex items-center gap-2 transition-colors text-sm"
                  >
                    <span style={{ color: "rgb(207, 159, 61)" }}>
                      <ChevronRightIcon className="w-3 h-3" />
                    </span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            {/* Gold divider line on desktop */}
            <div
              className="hidden md:block absolute right-0 top-8 bottom-8"
              style={{ width: "0.5px", backgroundColor: "rgb(207, 159, 61)" }}
            ></div>
          </div>

          {/* Column 4: Contact Info */}
          <div className="relative md:px-6">
            <h4
              className="font-bold text-base mb-4 uppercase"
              style={{ color: "rgb(207, 159, 61)" }}
            >
              Thông tin liên hệ
            </h4>
            <div className="space-y-3">
              {/* Organization */}
              <div className="flex items-start gap-2 text-green-100">
                <svg
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  style={{ color: "rgb(207, 159, 61)" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <div className="text-sm leading-snug">
                  <p className="font-semibold">Công ty CP ĐT&amp;GD anyLEARN</p>
                  <p className="text-green-200 text-xs">MST: 0316363793</p>
                </div>
              </div>

              {/* Đơn vị bản quyền */}
              <div className="flex items-center gap-2 text-green-100">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: "rgb(207, 159, 61)" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <a
                  href="http://anylearn.vn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:text-white transition-colors"
                >Đơn vị bản quyền</a>
              </div>

              {/* Đơn vị sản xuất */}
              <div className="flex items-center gap-2 text-green-100">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: "rgb(207, 159, 61)" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                <a
                  href="https://www.binhanmedia.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:text-white transition-colors"
                >Đơn vị sản xuất</a>
              </div>

              {/* Email */}
              <a
                href="mailto:11nguoirasan@11onfield.com"
                className="flex items-center gap-2 text-green-100 hover:text-white transition-colors cursor-pointer"
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: "rgb(207, 159, 61)" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm">11nguoirasan@11onfield.com</span>
              </a>

              {/* Phone */}
              <a
                href="tel:+84902383511"
                className="flex items-center gap-2 text-green-100 hover:text-white transition-colors cursor-pointer"
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: "rgb(207, 159, 61)" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span className="text-sm">090 2383 511</span>
              </a>

              {/* Location */}
              <div className="flex items-center gap-2 text-green-100">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: "rgb(207, 159, 61)" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <a href="/competitions" className="text-sm hover:text-white transition-colors">Tuyển trạch trên toàn quốc</a>
              </div>

              {/* Social icons */}
              <div className="flex items-center gap-3 pt-1">
                {/* YouTube */}
                <a
                  href="http://www.youtube.com/@11onfield.fs2s"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-red-600 transition-colors"
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                {/* Facebook */}
                <a
                  href="https://www.facebook.com/profile.php?id=61589283795263"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-blue-600 transition-colors"
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                {/* TikTok */}
                <a
                  href="https://www.tiktok.com/@11onfield.fs2s"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-black transition-colors"
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
                  </svg>
                </a>
                {/* Instagram */}
                <a
                  href="#"
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-gradient-to-br hover:from-purple-600 hover:via-pink-500 hover:to-orange-400 transition-colors"
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                  </svg>
                </a>
                {/* Threads */}
                <a
                  href="#"
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-black transition-colors"
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.813-2.045 1.61-1.568 1.949-3.48 1.949-4.86 0-.168-.004-.33-.01-.488-.817 1.108-1.98 1.727-3.439 1.844-1.064.087-2.116-.124-2.965-.596-1.016-.567-1.697-1.474-1.912-2.552-.19-.963-.082-1.94.308-2.741.47-.963 1.276-1.661 2.306-1.98 1.17-.363 2.47-.25 3.674.32.305.143.589.312.85.504.047-.43.064-.877.05-1.337-.044-1.426-.637-2.534-1.713-3.21-1.115-.7-2.66-.938-4.48-.688l-.287-2.019c2.304-.328 4.373-.02 5.975.994 1.668 1.047 2.633 2.704 2.694 4.66.021.683-.004 1.372-.073 2.04.282.475.485.99.594 1.532.127.632.127 1.298 0 1.984-.254 1.37-1.012 2.575-2.13 3.396C18.008 22.96 15.4 24 12.186 24zm.439-9.443c.863-.072 1.516-.51 1.94-1.302.264-.49.37-1.054.305-1.58-.064-.508-.268-.936-.593-1.234-.408-.369-.972-.527-1.576-.476-.605.053-1.12.302-1.452.7-.293.352-.432.808-.392 1.29.04.482.248.908.586 1.196.406.347.947.487 1.489.487.056 0 .113-.002.17-.006l.523-.075z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Column 5: CTA / Ball */}
          <div className="hidden md:flex items-center justify-center">
            {isHome ? (
              <Image
                src="/images/traibanh.png"
                alt="Quả bóng"
                width={320}
                height={320}
                className="w-64 h-64 object-contain"
              />
            ) : (
              <div className="relative flex flex-col items-center justify-center w-full gap-2">
                <a href="/auth/register" className="block w-full max-w-[200px]">
                  <div className="relative overflow-hidden">
                    <img
                      src="/images/btn-register.png"
                      alt="Đăng ký ngay"
                      className="w-full h-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
                    />
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.3) 55%, transparent 100%)",
                        animation: "shine 3s infinite",
                        animationDelay: "1s",
                      }}
                    />
                  </div>
                </a>
                <Image
                  src="/images/traibanh.png"
                  alt=""
                  width={200}
                  height={200}
                  className="w-40 h-40 object-contain opacity-80"
                />
              </div>
            )}
          </div>

          <style jsx>{`
            @keyframes shine {
              0% {
                transform: translateX(-100%) skewX(-15deg);
              }
              100% {
                transform: translateX(200%) skewX(-15deg);
              }
            }
          `}</style>
        </div>

        {/* Copyright */}
        <div className="mt-8 pb-2 border-t border-green-800 text-center text-green-100 text-sm">
          © 2026 11 on Field. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
