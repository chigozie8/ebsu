'use client';

import { useEffect, useState } from 'react';
import { useBannerSettings } from '../../hooks/useBannerSettings';
import HangingBanner3D from './HangingBanner3D';

export default function HangingBannerContainer() {
  const { banner, loading } = useBannerSettings();
  const [displayBanner, setDisplayBanner] = useState(false);

  useEffect(() => {
    if (!banner.isActive || loading) return;

    // Delay showing banner by 100ms to ensure component is mounted
    const timer = setTimeout(() => {
      setDisplayBanner(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [banner.isActive, loading]);

  if (!displayBanner || !banner.isActive) {
    return null;
  }

  return (
    <HangingBanner3D
      config={banner}
      onComplete={() => {
        setDisplayBanner(false);
      }}
    />
  );
}
