import guide from '../data/designGuide.json';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../components/Button';
import { BrandNav } from '../components/brand/BrandNav';
import { BrandHero } from '../components/brand/BrandHero';
import { LogoSection } from '../components/brand/LogoSection';
import { ColorSection } from '../components/brand/ColorSection';
import { TypographySection } from '../components/brand/TypographySection';
import { PrimitivesSection } from '../components/brand/PrimitivesSection';
import { VoiceSection } from '../components/brand/VoiceSection';
import { ApplicationsSection } from '../components/brand/ApplicationsSection';
import { LogoLockup } from '../components/brand/Logo';
import { CompleteDesignGuide } from '../components/brand/CompleteDesignGuide';
import { DesignGuideExamples } from '../components/brand/DesignGuideExamples';
import { VisualComponentLibrary } from '../components/brand/VisualComponentLibrary';

export function BrandGuide() {
  const navigate = useNavigate();
  return (
    <div className="hisabiq-app min-h-screen w-full bg-background" style={{ fontFeatureSettings: 'normal', fontVariantNumeric: 'normal' }}>
      <BrandNav />
      <main>
        <VisualComponentLibrary />
        <CompleteDesignGuide />
        <DesignGuideExamples />
        <div className="theme-light bg-background">
        <BrandHero />
        <LogoSection />
        <ColorSection />
        <TypographySection />
        <PrimitivesSection />
        <VoiceSection />
        <ApplicationsSection />
        </div>

        <section className="mx-auto max-w-[1280px] px-6 pb-20">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-inverse p-10 md:flex-row md:items-center">
            <div>
              <p className="text-2xl font-semibold tracking-tight text-white">See the brand at work</p>
              <p className="mt-1 text-[#B7C2CF]">
                Dashboard, POS, products, parties, purchases and reports — one coherent HisabIQ.
              </p>
            </div>
            <Button size="lg" className="bg-card text-ink hover:bg-ink-50" onClick={() => navigate('/app/dashboard')}>
              Open the app <ArrowRight className="size-4" />
            </Button>
          </div>
        </section>
      </main>
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-ink-500">
          <LogoLockup size={22} />
          <span className="font-bn">সহজ হিসাব, স্মার্ট ব্যবসা · Simple accounts. Smarter business.</span>
          <span>Design guide v{guide.version} · October 2026</span>
        </div>
      </footer>
    </div>);

}
