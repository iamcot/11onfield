"use client";

import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function StickyNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    if (!isHomePage) {
      router.push(`/#${sectionId}`);
      setIsMobileMenuOpen(false);
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { label: "Quyền lợi", id: "why-choose" },
    { label: "Tuyển chọn", id: "selection-process" },
    { label: "Huấn luyện", id: "training-program" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white shadow-md" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <Image
                src="/images/logo-color-full.png"
                alt="11 on Field"
                width={150}
                height={50}
                className="cursor-pointer"
                priority
              />
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-base font-medium text-gray-700 hover:text-green-700 transition-colors"
              >
                {link.label}
              </button>
            ))}

            {/* Competition link */}
            <Link
              href="/competitions"
              className="text-base font-medium text-gray-700 hover:text-green-700 transition-colors"
            >
              11 Người Ra Sân 2026
            </Link>

            {isAuthenticated && user ? (
              /* Logged in - Show Profile link */
              <Link
                href={`/profile/${user.userid}`}
                className={`px-4 py-2 rounded-md text-base font-semibold transition-colors ${
                  isScrolled
                    ? "bg-green-700 text-white hover:bg-green-800"
                    : "bg-white text-green-700 hover:bg-green-50"
                }`}
              >
                Hồ sơ
              </Link>
            ) : (
              /* Not logged in - Show Login/Register */
              <>
                <Link
                  href="/auth/login"
                  className="text-base font-medium text-gray-700 hover:text-green-700 transition-colors"
                >
                  Đăng nhập
                </Link>

                <Link
                  href="/auth/register"
                  className={`px-4 py-2 rounded-md text-base font-semibold transition-colors ${
                    isScrolled
                      ? "bg-green-700 text-white hover:bg-green-800"
                      : "bg-white text-green-700 hover:bg-green-50"
                  }`}
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          {/* Contact boxes (hide on mobile) */}
          <div className="hidden lg:flex flex-col gap-2 ml-6">
            {/* Email box */}
            <a
              href="mailto:11nguoirasan@11onfield.com"
              className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-green-700/30 rounded-full hover:bg-green-50 transition-colors cursor-pointer"
            >
              <svg
                className="w-4 h-4 text-green-700"
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
              <span className="text-xs font-medium text-gray-700">
                11nguoirasan@11onfield.com
              </span>
            </a>

            {/* Phone box */}
            <a
              href="tel:+84902383511"
              className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-green-700/30 rounded-full hover:bg-green-50 transition-colors cursor-pointer"
            >
              <svg
                className="w-4 h-4 text-green-700"
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
              <span className="text-xs font-medium text-gray-700">
                090 2383 511
              </span>
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-md ${
                isScrolled ? "text-gray-700" : "text-gray-700"
              }`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                {link.label}
              </button>
            ))}

            {/* Competition link */}
            <Link
              href="/competitions"
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              11 Người Ra Sân 2026
            </Link>

            {isAuthenticated && user ? (
              /* Logged in - Show Profile link */
              <Link
                href={`/profile/${user.userid}`}
                className="block w-full text-center px-4 py-2 bg-green-700 text-white hover:bg-green-800 rounded-md"
              >
                Hồ sơ
              </Link>
            ) : (
              /* Not logged in - Show Login/Register */
              <>
                <Link
                  href="/auth/login"
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/auth/register"
                  className="block w-full text-center px-4 py-2 bg-green-700 text-white hover:bg-green-800 rounded-md"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
