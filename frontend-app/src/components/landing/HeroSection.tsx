"use client";

import Image from "next/image";
import Link from "next/link";
import StickyNav from "./StickyNav";

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative w-full h-[75vh] min-h-[350px] md:min-h-[550px] bg-cover bg-center"
      style={{ backgroundImage: "url(/images/banner-lading-page.jpg)" }}
    >
      {/* Sticky Navigation */}
      <StickyNav />

      {/* Hero Content */}
      <div className="relative h-full flex items-center justify-center px-4 pt-0 md:pt-0">
        <div className="text-center text-white max-w-4xl mx-auto w-full">
          {/* Banner Text Image */}
          <div className="w-full flex justify-center">
            <div className="flex flex-col items-center w-full max-w-[200px] md:max-w-[200px]">
              <div
                className="w-full relative"
                style={{ aspectRatio: "503/761" }}
              >
                <Image
                  src="/images/banner-text.png"
                  alt="11 ON FIELD - Chương trình tuyển chọn cầu thủ trẻ"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 768px) 200px, 200px"
                />
              </div>

              <Link href="/auth/register" className="w-full">
                <div className="relative overflow-hidden">
                  <img
                    src="/images/btn-register.png"
                    alt="Đăng ký ngay"
                    className="w-full h-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
                  />
                  {/* Shine effect */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.3) 55%, transparent 100%)',
                      animation: 'shine 3s infinite',
                      animationDelay: '1s'
                    }}
                  />
                </div>
              </Link>

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
          </div>
        </div>
      </div>

      {/* Blur gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/50 to-transparent"></div>
    </section>
  );
}
