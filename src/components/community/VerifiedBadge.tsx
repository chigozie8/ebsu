import React from 'react';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: { container: 'w-3.5 h-3.5', svg: 'w-2 h-2' },
  md: { container: 'w-4 h-4',   svg: 'w-2.5 h-2.5' },
  lg: { container: 'w-5 h-5',   svg: 'w-3 h-3' },
};

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ size = 'md', className = '' }) => {
  const s = SIZE_MAP[size];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full flex-shrink-0 ${s.container} ${className}`}
      style={{ backgroundColor: '#53bdeb' }}
      title="Verified"
      aria-label="Verified account"
    >
      {/* Checkmark */}
      <svg
        className={s.svg}
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M2 6.5L4.5 9L10 3"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};

export default VerifiedBadge;
