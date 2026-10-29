
export type LogoTone = 'color' | 'inverse' | 'mono-ink' | 'mono-white' | 'teal';

type ToneColors = {tile: string;glyph: string;rule: string;dot: string;};

const tones: Record<LogoTone, ToneColors> = {
  color: { tile: '#0B1A2C', glyph: '#FFFFFF', rule: '#FFFFFF', dot: '#3DD6B5' },
  inverse: { tile: '#FFFFFF', glyph: '#0B1A2C', rule: '#0B1A2C', dot: '#0D7C74' },
  'mono-ink': { tile: '#0B1A2C', glyph: '#FFFFFF', rule: '#FFFFFF', dot: '#FFFFFF' },
  'mono-white': { tile: '#FFFFFF', glyph: '#0B1A2C', rule: '#0B1A2C', dot: '#0B1A2C' },
  teal: { tile: '#0D7C74', glyph: '#FFFFFF', rule: '#FFFFFF', dot: '#FFFFFF' }
};

type LogoMarkProps = {
  size?: number;
  tone?: LogoTone;
  className?: string;
  title?: string;
};

/**
 * The HisabIQ mark: an "H" whose right stem is an "i" (intelligence),
 * with the accountant's double rule (crossbar + thin total line) as its bridge.
 */
export function LogoMark({ size = 32, tone = 'color', className, title = 'HisabIQ' }: LogoMarkProps) {
  const c = tones[tone];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      role="img"
      aria-label={title}>
      
      <rect width="40" height="40" rx="10" fill={c.tile} />
      {/* Left stem */}
      <rect x="10.5" y="9.5" width="4.5" height="21" rx="1.4" fill={c.glyph} />
      {/* Right stem — the "i" */}
      <rect x="25" y="17" width="4.5" height="13.5" rx="1.4" fill={c.glyph} />
      {/* Crossbar */}
      <rect x="10.5" y="18.4" width="19" height="3.6" rx="1" fill={c.glyph} />
      {/* Ledger total rule */}
      <rect x="15" y="25" width="10" height="1.6" rx="0.8" fill={c.rule} opacity="0.55" />
      {/* Intelligence signal — the dot of the i */}
      <circle cx="27.25" cy="11.6" r="2.6" fill={c.dot} />
    </svg>);

}

type WordmarkProps = {
  size?: number;
  tone?: 'color' | 'inverse' | 'mono-ink' | 'mono-white';
  bangla?: boolean;
  className?: string;
};

export function Wordmark({ size = 24, tone = 'color', bangla = false, className }: WordmarkProps) {
  const base =
  tone === 'inverse' || tone === 'mono-white' ? '#FFFFFF' : tone === 'color' ? 'var(--foreground)' : '#0B1A2C';
  const iq =
  tone === 'color' ? 'var(--primary)' : tone === 'inverse' ? '#3DD6B5' : base;
  return (
    <span
      className={className}
      style={{
        fontSize: size,
        lineHeight: 1,
        letterSpacing: '-0.035em',
        fontWeight: 650,
        color: base,
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'baseline'
      }}>
      
      {bangla ?
      <span className="font-bn" style={{ fontWeight: 600, letterSpacing: 0 }}>
          হিসাব
        </span> :

      <span style={{ fontFamily: 'Geist' }}>Hisab</span>
      }
      <span style={{ color: iq, fontWeight: 700, fontFamily: 'Geist', letterSpacing: '-0.02em' }}>IQ</span>
    </span>);

}

type LockupProps = {
  size?: number;
  tone?: 'color' | 'inverse' | 'mono-ink' | 'mono-white';
  bangla?: boolean;
  className?: string;
};

/** Horizontal lockup: mark + wordmark. `size` is the mark height. */
export function LogoLockup({ size = 32, tone = 'color', bangla = false, className }: LockupProps) {
  const markTone: LogoTone =
  tone === 'inverse' ? 'inverse' : tone === 'mono-ink' ? 'mono-ink' : tone === 'mono-white' ? 'mono-white' : 'color';
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.32 }}>
      <LogoMark size={size} tone={markTone} />
      <Wordmark size={size * 0.72} tone={tone} bangla={bangla} />
    </span>);

}
