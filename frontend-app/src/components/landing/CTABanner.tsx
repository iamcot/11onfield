"use client";

import Link from "next/link";

export default function CTABanner() {
  return (
    <div className="w-full bg-green-700">
      {/* Container with aspect ratio 1080:229 (approximately 4.72:1) */}
      <div className="relative w-full" style={{ paddingBottom: '21.2%' }}>
        {/* Background image - cta.png */}
        <img
          src="/images/cta.png"
          alt="CTA Background"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />

        {/* Center image - cta-image.png */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/images/cta-image.png"
            alt="CTA Banner"
            className="max-h-[60%] w-auto object-contain mr-12 md:mr-16"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        {/* Right button - btn-register.png */}
        <div className="absolute right-4 md:right-8 lg:right-12 top-1/2 -translate-y-1/2">
          <Link href="/auth/register">
            <div className="relative overflow-hidden">
              <img
                src="/images/btn-register.png"
                alt="Đăng ký ngay"
                className="h-8 md:h-16 lg:h-20 w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              {/* Shine effect */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.3) 55%, transparent 100%)',
                  animation: 'ctaShine 3s infinite',
                  animationDelay: '1.5s'
                }}
              />
            </div>
          </Link>
        </div>

        <style jsx>{`
          @keyframes ctaShine {
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
  );
}
