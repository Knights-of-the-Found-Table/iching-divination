/**
 * Landing 首页
 *
 * 组合三个区域构成完整的首屏体验：
 * Hero -> FeatureCards -> CTA
 */

import HeroSection from "@/components/landing/HeroSectionAlt";
import FeatureCards from "@/components/landing/FeatureCards";
import CTASection from "@/components/landing/CTASection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeatureCards />
      <CTASection />
    </>
  );
}
