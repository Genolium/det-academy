import { HeroSection } from '@/components/landing/HeroSection';
import { BentoGrid } from '@/components/landing/BentoGrid';
import { ComparisonTable } from '@/components/landing/ComparisonTable';
import { DemoWidget } from '@/components/landing/DemoWidget';
import { SparkPromo } from '@/components/landing/SparkPromo';
import { AdBanner } from '@/components/layout/AdBanner';

// Advertising and partner promotions are paused for now. Set
// NEXT_PUBLIC_ADS_ENABLED=true to bring the banner and the SPARK promo back.
const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <BentoGrid />
      <ComparisonTable />
      <DemoWidget />
      {ADS_ENABLED && <AdBanner placement="FOOTER" />}
      {ADS_ENABLED && <SparkPromo />}
    </div>
  );
}
