import guide from '../../data/designGuide.json';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../Button';
import { LogoLockup } from './Logo';
import { brandSections } from '../../data/brand';
import { ThemePicker } from '../layout/ThemePicker';

export function BrandNav() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex min-h-14 max-w-[1280px] flex-wrap items-center gap-3 px-4 py-2 sm:flex-nowrap sm:px-6">
        <button type="button" onClick={() => document.getElementById('component-library')?.scrollIntoView()} aria-label="HisabIQ design guide, top" className="flex items-center gap-3">
          <LogoLockup size={26} />
          <span className="hidden rounded-md bg-ink-50 px-2 py-0.5 text-[11px] font-medium text-ink-500 sm:inline">Guide v{guide.version}</span>
        </button>
        <nav className="hidden flex-1 items-center gap-1 overflow-x-auto lg:flex" aria-label="Brand guide sections">
          {brandSections.filter((section) => ['component-library', 'complete-guide', 'logo', 'color', 'type', 'primitives'].includes(section.id)).map((s) =>
          <button type="button" key={s.id} onClick={() => document.getElementById(s.id)?.scrollIntoView({ block: 'start' })} className="whitespace-nowrap rounded-md px-2.5 py-1 text-[13px] text-ink-600 hover:bg-ink-50 hover:text-ink">
              {s.label}
            </button>
          )}
        </nav>
        <div className="ml-auto"><ThemePicker /></div>
        <Button size="sm" onClick={() => navigate('/app/dashboard')}>
          Open the app <ArrowRight className="size-4" />
        </Button>
      </div>
    </header>);

}
