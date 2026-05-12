import Link from "next/link";
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
      <div className="relative h-full flex items-center justify-center px-4">
        <div className="text-center text-white max-w-4xl mx-auto w-full">
          {/* Banner Text Image */}
          <div className="mb-8 md:mb-12 w-full flex justify-center">
            <div className="flex flex-col items-center gap-4 w-full max-w-[240px] mr-12 md:mr-32">
              <img
                src="/images/banner-text.png"
                alt="11 ON FIELD - Chương trình tuyển chọn cầu thủ trẻ"
                className="w-full h-auto object-contain"
              />
              <Link href="/auth/register">
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
