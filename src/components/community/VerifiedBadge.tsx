import React from 'react';

interface VerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showPulse?: boolean;
}

const SIZE_MAP: Record<string, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 26,
};

// Twitter's exact verified seal path (viewBox 0 0 24 24) — single line, no whitespace breaks
const SEAL_PATH = "M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816z";

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'md',
  className = '',
  showPulse = false,
}) => {
  const px = SIZE_MAP[size];
  const s = size;

  return (
    <span
      className={`inline-flex flex-shrink-0 items-center justify-center ${className} ${showPulse ? 'wa-verified-badge' : ''}`}
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
          <linearGradient id={`vbGrad-${s}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5bb8f5" />
            <stop offset="50%" stopColor="#1D9BF0" />
            <stop offset="100%" stopColor="#0a72cc" />
          </linearGradient>
          <filter id={`vbGlow-${s}`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="1" floodColor="#1D9BF0" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Twitter's official verified seal shape */}
        <path
          d={SEAL_PATH}
          fill={`url(#vbGrad-${s})`}
          filter={`url(#vbGlow-${s})`}
        />

        {/* Bold white checkmark centered in the seal */}
        <path
          d="M9.5 12.5L11.2 14.3L14.5 10"
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
