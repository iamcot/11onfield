"use client";

import Image from "next/image";
import { ChevronRightIcon } from "../icons/nav-icons";

export default function LandingFooter() {
  const policyLinks = [
    { label: "Điều khoản tham gia", href: "/terms" },
    { label: "Chính sách bảo mật thông tin", href: "/privacy" },
    { label: "Chính sách sử dụng hình ảnh/video", href: "/media-policy" },
    { label: "Liên hệ BTC", href: "mailto:11nguoirasan@11onfield.com" },
  ];

  return (
    <footer className="w-full bg-green-700 md:bg-green-900 pt-12 pb-2 relative overflow-hidden">
      {/* Background image with repeat - desktop only */}
      <div
        className="hidden md:block absolute inset-0 bg-repeat"
        style={{ backgroundImage: "url(/images/background-footer.png)" }}
      ></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-6">
          {/* Column 1: Logo */}
          <div className="flex flex-col items-center md:items-start relative md:pr-8">
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
          <div className="relative md:px-3">
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
          <div className="relative md:px-3">
            <h4
              className="font-bold text-base mb-4 uppercase"
              style={{ color: "rgb(207, 159, 61)" }}
            >
              Thông tin liên hệ
            </h4>
            <div className="space-y-3">
              {/* Organization */}
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <a
                  href="https://www.binhanmedia.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-sm hover:text-white transition-colors"
                >Đơn vị tổ chức</a>
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
                <span className="text-sm">Tuyển trạch trên toàn quốc</span>
              </div>
            </div>
          </div>

          {/* Column 5: Ball image - hidden on mobile */}
          <div className="hidden md:flex items-center justify-end">
            <img
              src="/images/traibanh.png"
              alt="Football"
              className="w-full max-w-none h-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pb-2 border-t border-green-800 text-center text-green-100 text-sm">
          © 2026 11 on Field. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
