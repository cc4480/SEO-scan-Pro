import { useId } from 'react';

// The SeoScan logo mark: a glass shield with a green S, drawn to match the official artwork
// (public/logo.jpg) in the colours it uses. It is vector so it stays sharp from 16px to a hero.
export function BrandMark({ size = 36, className = '' }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 72"
      role="img"
      aria-label="SeoScan"
      className={`shrink-0 drop-shadow-[0_0_10px_rgba(56,189,248,0.45)] ${className}`}
    >
      <defs>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e0f7ff" />
          <stop offset="0.5" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#16335a" />
          <stop offset="1" stopColor="#061427" />
        </linearGradient>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9be37a" />
          <stop offset="1" stopColor="#3d9a46" />
        </linearGradient>
      </defs>
      <path d="M32 3 6 12v22c0 17 11 28 26 35 15-7 26-18 26-35V12z" fill={`url(#${id}-glass)`} stroke={`url(#${id}-rim)`} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M32 8 11 15v19c0 13.5 8.5 23 21 29.5C44.500 57 53 47.500 53 34V15z" fill="none" stroke="#7dd3fc" strokeOpacity="0.35" strokeWidth="1" />
      <text x="32" y="46" textAnchor="middle" fontFamily="ui-sans-serif, system-ui, 'Segoe UI', Arial, sans-serif" fontWeight="800" fontSize="38" fill={`url(#${id}-s)`}>S</text>
    </svg>
  );
}

export function BrandWordmark({ className = '' }: { className?: string }) {
  return <span className={`font-extrabold tracking-tight text-white ${className}`}>Seo<span className="text-brand-400">Scan</span></span>;
}
