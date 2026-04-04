import React from 'react';

interface VerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showPulse?: boolean;
}

const SIZE_MAP = {
  xs: { badge: 12, pulse: 'w-3 h-3' },
  sm: { badge: 14, pulse: 'w-3.5 h-3.5' },
  md: { badge: 18, pulse: 'w-4.5 h-4.5' },
  lg: { badge: 22, pulse: 'w-5.5 h-5.5' },
};

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'md',
  className = '',
  showPulse = false,
}) => {
  const { badge: px } = SIZE_MAP[size];

  return (
    <span
      className={`inline-flex flex-shrink-0 items-center justify-center ${className} ${
        showPulse ? 'wa-verified-badge' : ''
      }`}
      style={{ width: px, height: px }}
      title="Verified EBSU Student"
      aria-label="Verified account"
    >
      {/*
        X (Twitter) Gold Verified Badge:
        - Outer shape is a rounded star / shield (officially called a "verified" icon)
        - Gold fill with a subtle inner glow
        - White checkmark centered
      */}
      <svg
        width={px}
        height={px}
        viewBox="0 0 22 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#FFC200" />
            <stop offset="100%" stopColor="#E6A800" />
          </linearGradient>
          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#FFD700" floodOpacity="0.7" />
          </filter>
        </defs>

        {/* X-style verified star/shield path */}
        <path
          d="M11 1.5 L13.09 7.26 L19.28 7.26 L14.6 10.99 L16.69 16.75 L11 13.02 L5.31 16.75 L7.4 10.99 L2.72 7.26 L8.91 7.26 Z"
          fill="url(#goldGrad)"
          filter="url(#goldGlow)"
        />

        {/* White checkmark */}
        <path
          d="M7.5 10.8 L9.8 13.1 L14.5 8.5"
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </span>
  );
};

export default VerifiedBadge;
