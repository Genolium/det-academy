import { HeroSection } from '@/components/landing/HeroSection';
import { BentoGrid } from '@/components/landing/BentoGrid';
import { ComparisonTable } from '@/components/landing/ComparisonTable';
import { DemoWidget } from '@/components/landing/DemoWidget';
import { SparkPromo } from '@/components/landing/SparkPromo';
import { AdBanner } from '@/components/layout/AdBanner';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <BentoGrid />
      <ComparisonTable />
      <SparkPromo />
      <DemoWidget />
      <AdBanner placement="FOOTER" />
    </div>
  );
}
