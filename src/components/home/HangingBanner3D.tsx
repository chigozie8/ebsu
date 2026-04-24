'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface BannerConfig {
  text: string;
  duration: number; // in seconds
  bgColor: string;
  textColor: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | 'bolder';
  isActive: boolean;
}

interface HangingBanner3DProps {
  config: BannerConfig;
  onComplete?: () => void;
}

export default function HangingBanner3D({ config, onComplete }: HangingBanner3DProps) {
  const bannerRef = useRef<HTMLDivElement>(null);
  const leftRopeRef = useRef<HTMLDivElement>(null);
  const rightRopeRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!config.isActive || !bannerRef.current) return;

    setIsVisible(true);

    const banner = bannerRef.current;
    const leftRope = leftRopeRef.current;
    const rightRope = rightRopeRef.current;

    // Create GSAP timeline for the banner animation
    const timeline = gsap.timeline({
      onComplete: () => {
        // Start fade out animation before completing
        gsap.to(banner, {
          opacity: 0,
          duration: 0.8,
          ease: 'power2.inOut',
          onComplete: () => {
            setIsVisible(false);
            onComplete?.();
          },
        });
      },
    });

    // Initial state: Banner and ropes start from top, hidden
    gsap.set(banner, {
      y: -200,
      opacity: 0,
      rotationX: 45,
    });

    gsap.set([leftRope, rightRope], {
      scaleY: 0,
      transformOrigin: 'top center',
    });

    // Phase 1: Ropes drop down (0.4s)
    timeline.to(
      [leftRope, rightRope],
      {
        scaleY: 1,
        duration: 0.6,
        ease: 'back.out',
      },
      0
    );

    // Phase 2: Banner drops down with 3D rotation (0.5s, overlapping with ropes)
    timeline.to(
      banner,
      {
        y: 0,
        opacity: 1,
        rotationX: 0,
        duration: 0.7,
        ease: 'back.out',
      },
      0.2
    );

    // Phase 3: Sway motion (gentle side-to-side)
    const swayDuration = config.duration - 2; // Duration minus animation overhead
    if (swayDuration > 0) {
      timeline.to(
        banner,
        {
          x: 15,
          rotationZ: 2,
          duration: 0.8,
          ease: 'sine.inOut',
          repeat: Math.floor(swayDuration / 1.6),
          yoyo: true,
        },
        1.2
      );

      // Gentle rope sway
      timeline.to(
        [leftRope, rightRope],
        {
          rotationZ: (i) => (i === 0 ? -1 : 1),
          duration: 0.8,
          ease: 'sine.inOut',
          repeat: Math.floor(swayDuration / 1.6),
          yoyo: true,
        },
        1.2
      );
    }

    return () => {
      timeline.kill();
    };
  }, [config, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] flex justify-center pointer-events-none">
      {/* Container for 3D perspective */}
      <div
        style={{
          perspective: '1000px',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          height: '300px',
        }}
      >
        {/* Left Rope */}
        <div
          ref={leftRopeRef}
          style={{
            position: 'absolute',
            left: '15%',
            top: 0,
            width: '3px',
            height: '120px',
            background: 'linear-gradient(180deg, #8B4513 0%, #A0522D 50%, #8B4513 100%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset -1px 0 2px rgba(255,255,255,0.2)',
            borderRadius: '2px',
            transformOrigin: 'top center',
            filter: 'drop-shadow(2px 2px 8px rgba(0,0,0,0.4))',
          }}
        />

        {/* Banner */}
        <div
          ref={bannerRef}
          className="pointer-events-auto"
          style={{
            position: 'absolute',
            top: '120px',
            backgroundColor: config.bgColor,
            color: config.textColor,
            padding: '24px 48px',
            borderRadius: '12px',
            fontSize: `${config.fontSize}px`,
            fontWeight: config.fontWeight,
            whiteSpace: 'nowrap',
            maxWidth: '90vw',
            textAlign: 'center',
            boxShadow: `
              0 15px 40px rgba(0, 0, 0, 0.3),
              0 0 50px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.2)
            `,
            background: `linear-gradient(135deg, ${config.bgColor} 0%, ${adjustBrightness(config.bgColor, -20)} 100%)`,
            border: `2px solid ${adjustBrightness(config.bgColor, -30)}`,
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            letterSpacing: '1px',
            transform: 'translateZ(0)',
            willChange: 'transform, opacity',
          }}
        >
          {config.text}
        </div>

        {/* Right Rope */}
        <div
          ref={rightRopeRef}
          style={{
            position: 'absolute',
            right: '15%',
            top: 0,
            width: '3px',
            height: '120px',
            background: 'linear-gradient(180deg, #8B4513 0%, #A0522D 50%, #8B4513 100%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 1px 0 2px rgba(255,255,255,0.2)',
            borderRadius: '2px',
            transformOrigin: 'top center',
            filter: 'drop-shadow(2px 2px 8px rgba(0,0,0,0.4))',
          }}
        />
      </div>
    </div>
  );
}

/**
 * Helper function to adjust color brightness
 */
function adjustBrightness(color: string, percent: number): string {
  const usePound = color[0] === '#';
  const col = usePound ? color.slice(1) : color;
  const num = parseInt(col, 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, (num >> 8) + amt) & 0x00ff);
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return (usePound ? '#' : '') + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}
