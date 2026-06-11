import HeroSection from '@/components/landing/HeroSection';
import RecruitmentInfoSection from '@/components/landing/RecruitmentInfoSection';
import WhyChooseSection from '@/components/landing/WhyChooseSection';
import SelectionProcessSection from '@/components/landing/SelectionProcessSection';
import TrainingProgramSection from '@/components/landing/TrainingProgramSection';
import FAQSection from '@/components/landing/FAQSection';
import CTABanner from '@/components/landing/CTABanner';
import LandingFooter from '@/components/landing/LandingFooter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trang chủ',
  description: 'Nền tảng kết nối cầu thủ bóng đá từ đường phố đến sân cỏ. Khám phá tài năng, tham gia tuyển chọn, xây dựng sự nghiệp bóng đá chuyên nghiệp.',
  keywords: ['bóng đá', 'tuyển thủ', 'cầu thủ bóng đá', 'đào tạo bóng đá', 'tìm kiếm cầu thủ', 'tuyển sinh bóng đá'],
  openGraph: {
    title: 'Trang chủ - 11 người ra sân - Từ đường phố đến sân cỏ',
    description: 'Nền tảng kết nối cầu thủ bóng đá từ đường phố đến sân cỏ. Khám phá tài năng, tham gia tuyển chọn, xây dựng sự nghiệp bóng đá chuyên nghiệp.',
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-be-vietnam-pro)]">
      <HeroSection />
      <RecruitmentInfoSection />
      <WhyChooseSection />
      <SelectionProcessSection />
      <TrainingProgramSection />
      <FAQSection />
      <CTABanner />
      <LandingFooter />
    </div>
  );
}
