import HeroSection from '@/components/landing/HeroSection';
import RecruitmentInfoSection from '@/components/landing/RecruitmentInfoSection';
import WhyChooseSection from '@/components/landing/WhyChooseSection';
import SelectionProcessSection from '@/components/landing/SelectionProcessSection';
import TrainingProgramSection from '@/components/landing/TrainingProgramSection';
import CTABanner from '@/components/landing/CTABanner';
import LandingFooter from '@/components/landing/LandingFooter';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-roboto-condensed)]">
      <HeroSection />
      <RecruitmentInfoSection />
      <WhyChooseSection />
      <SelectionProcessSection />
      <TrainingProgramSection />
      <CTABanner />
      <LandingFooter />
    </div>
  );
}
