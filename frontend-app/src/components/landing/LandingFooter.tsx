"use client";

import Image from "next/image";
import { ChevronRightIcon } from "../icons/nav-icons";

export default function LandingFooter() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const quickLinks = [
    { label: "Trang chủ", id: "home" },
    { label: "Về chúng tôi", id: "why-choose" },
    { label: "Quy trình tuyển chọn", id: "selection-process" },
    { label: "Chương trình", id: "training-program" },
    { label: "Đăng ký", href: "/auth/register" },
  ];

  return (
    <footer className="w-full bg-green-700 md:bg-green-900 pt-12 relative overflow-hidden">
      {/* Background image with repeat - desktop only */}
      <div
        className="hidden md:block absolute inset-0 bg-repeat"
        style={{ backgroundImage: "url(/images/background-footer.png)" }}
      ></div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1.3fr_1.3fr_1.1fr] gap-8">
          {/* Column 1: Logo - hidden on mobile */}
          <div className="hidden md:flex flex-col items-center md:items-start relative md:pr-16">
            <Image
              src="/images/footer-logo.png"
              alt="11 on Field"
              width={380}
              height={118}
              className="mb-4"
            />
            {/* Gold divider line on desktop */}
            <div
              className="hidden md:block absolute right-0 top-8 bottom-8"
              style={{ width: "0.5px", backgroundColor: "rgb(207, 159, 61)" }}
            ></div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="relative md:px-4">
            <h4
              className="font-bold text-lg mb-4 uppercase"
              style={{ color: "rgb(207, 159, 61)" }}
            >
              Liên kết nhanh
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  {link.href ? (
                    <a
                      href={link.href}
                      className="text-green-100 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <span style={{ color: "rgb(207, 159, 61)" }}>
                        <ChevronRightIcon className="w-4 h-4" />
                      </span>
                      {link.label}
                    </a>
                  ) : (
                    <button
                      onClick={() => scrollToSection(link.id!)}
                      className="text-green-100 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <span style={{ color: "rgb(207, 159, 61)" }}>
                        <ChevronRightIcon className="w-4 h-4" />
                      </span>
                      {link.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {/* Gold divider line on desktop */}
            <div
              className="hidden md:block absolute right-0 top-8 bottom-8"
              style={{ width: "0.5px", backgroundColor: "rgb(207, 159, 61)" }}
            ></div>
          </div>

          {/* Column 3: Contact Info */}
          <div className="relative md:px-4">
            <h4
              className="font-bold text-lg mb-4 uppercase"
              style={{ color: "rgb(207, 159, 61)" }}
            >
              Thông tin liên hệ
            </h4>
            <div className="space-y-3">
              {/* Email */}
              <div className="flex items-center gap-3 text-green-100">
                <svg
                  className="w-5 h-5 flex-shrink-0"
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
                <span>11nguoirasan@gmail.com</span>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-3 text-green-100">
                <svg
                  className="w-5 h-5 flex-shrink-0"
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
                <span>0902 383 511</span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-3 text-green-100">
                <svg
                  className="w-5 h-5 flex-shrink-0"
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
                <span>Tuyển sinh trên toàn quốc</span>
              </div>
            </div>
          </div>

          {/* Column 4: Ball image - hidden on mobile */}
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
        <div className="mt-8 p-8 border-t border-green-800 text-center text-green-100 text-sm">
          © 2026 11 on Field. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
