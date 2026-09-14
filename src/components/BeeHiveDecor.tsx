import clsx from 'clsx'

interface BeeHiveDecorProps {
  className?: string
  variant?: 'honeycomb' | 'bee' | 'combined'
}

export default function BeeHiveDecor({ className, variant = 'honeycomb' }: BeeHiveDecorProps) {
  return (
    <svg
      viewBox="0 0 280 300"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      className={clsx('opacity-[0.22] pointer-events-none select-none', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="honeyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#D97706" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#B45309" stopOpacity="0.7" />
        </linearGradient>
        <pattern id="hive-pattern" width="56" height="100" patternUnits="userSpaceOnUse">
          <path d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M28 32 L56 48 L56 80 L28 96 L0 80 L0 48 Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </pattern>
      </defs>
      {variant === 'honeycomb' && (
        <rect width="100%" height="100%" fill="url(#hive-pattern)" />
      )}

      {variant === 'bee' && (
        <g opacity="0.55" transform="translate(40, 50)">
          <defs>
            <linearGradient id="beeBodyGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <radialGradient id="wingGrad2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#FDE68A" stopOpacity="0.15" />
            </radialGradient>
          </defs>
          <ellipse cx="100" cy="100" rx="32" ry="24" fill="url(#beeBodyGrad2)" opacity="0.85" />
          <rect x="75" y="82" width="9" height="36" rx="2.5" fill="#1C1917" opacity="0.75" />
          <rect x="88" y="82" width="9" height="36" rx="2.5" fill="#1C1917" opacity="0.75" />
          <rect x="101" y="82" width="9" height="36" rx="2.5" fill="#1C1917" opacity="0.75" />
          <rect x="114" y="82" width="9" height="36" rx="2.5" fill="#1C1917" opacity="0.75" />
          <ellipse cx="142" cy="100" rx="15" ry="13" fill="#1C1917" opacity="0.7" />
          <circle cx="138" cy="96" r="2.8" fill="#FEF3C7" />
          <circle cx="137.6" cy="96.4" r="1.4" fill="#1C1917" />
          <circle cx="146" cy="96" r="2.5" fill="#FEF3C7" />
          <circle cx="145.6" cy="96.4" r="1.2" fill="#1C1917" />
          <path d="M148 92 Q154 87 158 89" stroke="#1C1917" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d="M151 91 Q158 86 161.5 88" stroke="#1C1917" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d="M72 92 Q56 78 48 66 Q68 60 88 78" fill="url(#wingGrad2)" stroke="#B45309" strokeWidth="0.6" opacity="0.9" />
          <path d="M77 110 Q60 135 56 146 Q78 143 92 123" fill="url(#wingGrad2)" stroke="#B45309" strokeWidth="0.6" opacity="0.9" />
        </g>
      )}

      {variant === 'combined' && (
        <>
          <g stroke="url(#honeyGradient)" strokeWidth="0.9" strokeLinejoin="round" fill="none" opacity="0.9" transform="translate(40, 50)">
            <polygon points="25,25 42,35 42,55 25,65 8,55 8,35" />
            <polygon points="175,25 192,35 192,55 175,65 158,55 158,35" />
            <polygon points="25,135 42,145 42,165 25,175 8,165 8,145" />
            <polygon points="175,135 192,145 192,165 175,175 158,165 158,145" />
          </g>
          <g opacity="0.55" transform="translate(40, 50)">
            <defs>
              <linearGradient id="beeBodyGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <radialGradient id="wingGrad3" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#FDE68A" stopOpacity="0.15" />
              </radialGradient>
            </defs>
            <ellipse cx="96" cy="100" rx="25" ry="19" fill="url(#beeBodyGrad3)" opacity="0.85" />
            <rect x="76" y="86" width="7" height="28" rx="2" fill="#1C1917" opacity="0.7" />
            <rect x="86" y="86" width="7" height="28" rx="2" fill="#1C1917" opacity="0.7" />
            <rect x="96" y="86" width="7" height="28" rx="2" fill="#1C1917" opacity="0.7" />
            <rect x="106" y="86" width="7" height="28" rx="2" fill="#1C1917" opacity="0.7" />
            <ellipse cx="128" cy="100" rx="12" ry="10.5" fill="#1C1917" opacity="0.65" />
            <circle cx="125" cy="97" r="2.3" fill="#FEF3C7" />
            <circle cx="124.7" cy="97.3" r="1.15" fill="#1C1917" />
            <circle cx="131.2" cy="97" r="2.1" fill="#FEF3C7" />
            <circle cx="130.9" cy="97.3" r="1" fill="#1C1917" />
            <path d="M71 93 Q58 82 52 72 Q69 67 84 81" fill="url(#wingGrad3)" stroke="#B45309" strokeWidth="0.5" opacity="0.9" />
            <path d="M75 108 Q60 128 57 138 Q75 135 87 119" fill="url(#wingGrad3)" stroke="#B45309" strokeWidth="0.5" opacity="0.9" />
          </g>
        </>
      )}
    </svg>
  )
}
