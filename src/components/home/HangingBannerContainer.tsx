import { useEffect, useState } from 'react';
import { useBannerSettings } from '../../hooks/useBannerSettings';
import HangingBanner3D from './HangingBanner3D';

export default function HangingBannerContainer() {
  const { banner, loading } = useBannerSettings();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (loading || !banner.is_active) return;
    // Small delay to ensure the DOM is fully painted before kicking off GSAP
    const t = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(t);
  }, [banner.is_active, loading, banner.id]);

  if (!show) return null;

  return (
    <HangingBanner3D
      config={banner}
      onComplete={() => setShow(false)}
    />
  );
}
