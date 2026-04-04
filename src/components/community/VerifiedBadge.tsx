import React from 'react';

interface VerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showPulse?: boolean;
}

const SIZE_MAP = {
  xs: 13,
  sm: 16,
  md: 20,
  lg: 26,
};

// Unique IDs per size to avoid SVG filter/gradient conflicts when multiple badges render on screen
const ID_SUFFIX: Record<string, string> = {
  xs: 'xs',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
};

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'md',
  className = '',
  showPulse = false,
}) => {
  const px = SIZE_MAP[size];
  const s = ID_SUFFIX[size];

  /*
   * Twitter blue verified badge — exact reproduction:
   *   • Shape: Twitter's official 20-point rounded-star seal (M20.396 11c-.018-.646...)
   *     drawn on a 24×24 viewBox
   *   • Fill: vivid blue gradient top-left → bottom-right (#1D9BF0 → #0D6EFD)
   *   • Glow: subtle blue drop-shadow to make it pop on any background
   *   • Checkmark: thick white rounded stroke, same proportions as Twitter's icon
   */
  return (
    <span
      className={`inline-flex flex-shrink-0 items-center justify-center ${className} ${
        showPulse ? 'wa-verified-badge' : ''
      }`}
      style={{ width: px, height: px }}
      title="Verified EBSU Student"
      aria-label="Verified account"
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Rich blue gradient — top-left light to bottom-right deep */}
          <linearGradient id={`blueGrad-${s}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#41b3f5" />
            <stop offset="45%"  stopColor="#1D9BF0" />
            <stop offset="100%" stopColor="#0a6fc2" />
          </linearGradient>

          {/* Soft blue glow — makes the badge feel premium */}
          <filter id={`blueGlow-${s}`} x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feFlood floodColor="#1D9BF0" floodOpacity="0.55" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/*
          Twitter's exact verified seal shape — 20-point rounded star
          Path sourced from Twitter's SVG icon (viewBox 0 0 24 24)
        */}
        <path
          d="M22.25 12c0-.99-.38-1.92-1.07-2.63l.01-.02
             c.27-.29.44-.67.44-1.1 0-.9-.73-1.62-1.62-1.62-.18 0-.36.03-.52.08
             C18.93 5.45 17.6 4.5 16.06 4.5c-.28 0-.55.04-.8.1
             C14.6 3.62 13.37 3 12 3s-2.6.62-3.26 1.6c-.25-.06-.52-.1-.8-.1
             -1.54 0-2.87.95-3.43 2.21-.16-.05-.34-.08-.52-.08
             C3.1 6.63 2.37 7.36 2.37 8.25c0 .43.17.81.44 1.1l.01.02
             C2.13 10.08 1.75 11.01 1.75 12s.38 1.92 1.07 2.63l-.01.02
             c-.27.29-.44.67-.44 1.1 0 .9.73 1.62 1.62 1.62.18 0 .36-.03.52-.08
             C5.07 18.55 6.4 19.5 7.94 19.5c.28 0 .55-.04.8-.1
             C9.4 20.38 10.63 21 12 21s2.6-.62 3.26-1.6c.25.06.52.1.8.1
             1.54 0 2.87-.95 3.43-2.21.16.05.34.08.52.08
             .9 0 1.62-.73 1.62-1.62 0-.43-.17-.81-.44-1.1l-.01-.02
             c.69-.71 1.07-1.64 1.07-2.63Z"
          fill={`url(#blueGrad-${s})`}
          filter={`url(#blueGlow-${s})`}
        />

        {/* Bold white checkmark — same weight & curve as Twitter's */}
        <path
          d="M9 12.75 L10.813 14.563 L15 9.75"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </span>
  );
};

export default VerifiedBadge;
