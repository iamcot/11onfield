import Link from "next/link";
import Image from "next/image";
import StickyNav from "./StickyNav";

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative w-full h-[75vh] bg-cover bg-center"
      style={{ backgroundImage: "url(/images/banner-lading-page.jpg)" }}
    >
      {/* Sticky Navigation */}
      <StickyNav />

      {/* Hero Content */}
      <div className="relative h-full flex items-center justify-center px-4 pt-4 md:pt-0">
        <div className="text-center text-white max-w-4xl mx-auto w-full">
          {/* Banner Text Image */}
          <div className="mb-4 md:mb-12 w-full flex justify-center max-h-[calc(75vh-280px)] md:max-h-[calc(75vh-200px)]">
            <div className="flex flex-col items-center gap-2 md:gap-3 w-full max-w-[130px] md:max-w-[240px] mr-12 md:mr-32 h-full">
              <div className="w-full h-auto max-h-full relative" style={{ aspectRatio: '503/761' }}>
                <Image
                  src="/images/banner-text.png"
                  alt="11 ON FIELD - Chương trình tuyển chọn cầu thủ trẻ"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 768px) 130px, 240px"
                />
              </div>
              <Link href="/auth/register" className="w-[80%] md:w-full">
                <img
                  src="/images/btn-register.png"
                  alt="Đăng ký ngay"
                  className="w-full h-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Blur gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/50 to-transparent"></div>
    </section>
  );
}
