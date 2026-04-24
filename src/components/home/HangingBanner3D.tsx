import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface BannerConfig {
  text: string;
  duration: number;
  bg_color: string;
  text_color: string;
  font_size: number;
  font_weight: 'normal' | 'bold' | 'bolder';
  is_active: boolean;
}

interface HangingBanner3DProps {
  config: BannerConfig;
  onComplete?: () => void;
}

// Cycling Christmas bulb colors
const BULB_COLORS = [
  '#ff1a1a', '#00dd44', '#ffd700', '#2255ff',
  '#ff6600', '#ff1a1a', '#00dd44', '#ffd700',
  '#2255ff', '#ff6600', '#cc00bb', '#ff1a1a',
  '#00dd44', '#ffd700', '#2255ff', '#ff6600',
  '#ff1a1a', '#00dd44', '#ffd700', '#2255ff',
  '#ff6600', '#cc00bb', '#ff1a1a', '#00dd44',
];

function adjustBrightness(color: string, percent: number): string {
  const usePound = color[0] === '#';
  const col = usePound ? color.slice(1) : color;
  const num = parseInt(col, 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0xff) + amt));
  return (usePound ? '#' : '') + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

export default function HangingBanner3D({ config, onComplete }: HangingBanner3DProps) {
  const bannerRef = useRef<HTMLDivElement>(null);
  const leftRopeRef = useRef<HTMLDivElement>(null);
  const rightRopeRef = useRef<HTMLDivElement>(null);
  const lightsWrapRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [bulbCount, setBulbCount] = useState(22);

  useEffect(() => {
    const update = () => setBulbCount(Math.max(10, Math.floor(window.innerWidth / 52)));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!config.is_active || !bannerRef.current) return;

    setIsVisible(true);

    const banner = bannerRef.current;
    const leftRope = leftRopeRef.current;
    const rightRope = rightRopeRef.current;
    const lightsWrap = lightsWrapRef.current;

    // Set initial states
    gsap.set([leftRope, rightRope], { scaleY: 0, transformOrigin: 'top center' });
    gsap.set(banner, { y: -320, opacity: 0, rotationX: 35 });
    gsap.set(lightsWrap, { opacity: 0 });

    const swayLoops = Math.max(1, Math.floor((config.duration - 2.5) / 1.8));

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to([banner, lightsWrap, leftRope, rightRope], {
          opacity: 0,
          duration: 0.7,
          ease: 'power2.inOut',
          onComplete: () => {
            setIsVisible(false);
            onComplete?.();
          },
        });
      },
    });

    // Phase 1: Lights illuminate (0 → 0.4s)
    tl.to(lightsWrap, { opacity: 1, duration: 0.4, ease: 'power1.out' }, 0);

    // Phase 2: Ropes drop (0.3 → 0.8s)
    tl.to([leftRope, rightRope], { scaleY: 1, duration: 0.5, ease: 'back.out(1.2)' }, 0.3);

    // Phase 3: Banner drops in with 3D flip (0.55 → 1.2s)
    tl.to(banner, { y: 0, opacity: 1, rotationX: 0, duration: 0.65, ease: 'back.out(1.5)' }, 0.55);

    // Phase 4: Gentle sway
    tl.to(banner, {
      x: 14,
      rotationZ: 1.8,
      duration: 0.9,
      ease: 'sine.inOut',
      repeat: swayLoops,
      yoyo: true,
    }, 1.3);
    tl.to([leftRope, rightRope], {
      rotationZ: (i: number) => (i === 0 ? -1.2 : 1.2),
      duration: 0.9,
      ease: 'sine.inOut',
      repeat: swayLoops,
      yoyo: true,
    }, 1.3);

    return () => { tl.kill(); };
  }, [config, onComplete]);

  if (!isVisible) return null;

  return (
    <>
      {/* Inline keyframes for bulb twinkling */}
      <style>{`
        @keyframes xmas-twinkle-a {
          0%, 100% { opacity: 1; filter: brightness(1) drop-shadow(0 0 4px currentColor); }
          45% { opacity: 0.45; filter: brightness(0.55); }
        }
        @keyframes xmas-twinkle-b {
          0%, 100% { opacity: 0.55; filter: brightness(0.6); }
          55% { opacity: 1; filter: brightness(1.25) drop-shadow(0 0 6px currentColor); }
        }
        @keyframes xmas-twinkle-c {
          0%, 100% { opacity: 0.85; }
          30% { opacity: 1; filter: brightness(1.3); }
          70% { opacity: 0.35; filter: brightness(0.45); }
        }
      `}</style>

      <div
        className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
        style={{ height: '280px' }}
      >
        {/* ── Christmas Lights Row ── */}
        <div ref={lightsWrapRef} style={{ position: 'relative', width: '100%', height: '40px' }}>
          {/* Main wire */}
          <div
            style={{
              position: 'absolute',
              top: '1px',
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #2a2a2a 0%, #555 30%, #3a3a3a 60%, #222 100%)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.6)',
              zIndex: 1,
            }}
          />

          {/* Bulbs */}
          {Array.from({ length: bulbCount }).map((_, i) => {
            const color = BULB_COLORS[i % BULB_COLORS.length];
            const leftPct = ((i + 0.5) / bulbCount) * 100;
            const animVariant = i % 3;
            const animName =
              animVariant === 0
                ? 'xmas-twinkle-a'
                : animVariant === 1
                ? 'xmas-twinkle-b'
                : 'xmas-twinkle-c';
            const duration = 1.1 + (i % 5) * 0.28;
            const delay = (i * 0.11) % 1.8;

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${leftPct}%`,
                  top: '3px',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 2,
                }}
              >
                {/* Short wire drop from main wire */}
                <div
                  style={{
                    width: '1.5px',
                    height: '7px',
                    background: '#444',
                    flexShrink: 0,
                  }}
                />
                {/* Bulb cap (metal base) */}
                <div
                  style={{
                    width: '7px',
                    height: '4px',
                    background: 'linear-gradient(180deg, #aaa 0%, #777 100%)',
                    borderRadius: '2px 2px 0 0',
                    flexShrink: 0,
                  }}
                />
                {/* Bulb body */}
                <div
                  style={{
                    width: '11px',
                    height: '15px',
                    backgroundColor: color,
                    borderRadius: '50% 50% 55% 55% / 35% 35% 65% 65%',
                    boxShadow: `0 0 5px 2px ${color}cc, 0 0 10px 3px ${color}66`,
                    animation: `${animName} ${duration}s ${delay}s infinite ease-in-out`,
                    flexShrink: 0,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* ── Ropes + Banner ── */}
        <div
          style={{
            position: 'absolute',
            top: '38px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            perspective: '1200px',
          }}
        >
          {/* Left rope */}
          <div
            ref={leftRopeRef}
            style={{
              position: 'absolute',
              left: '18%',
              top: 0,
              width: '3px',
              height: '115px',
              background:
                'repeating-linear-gradient(180deg, #6b3a1f 0px, #a0652a 6px, #6b3a1f 12px)',
              borderRadius: '2px',
              transformOrigin: 'top center',
              boxShadow: 'inset -1px 0 2px rgba(255,255,255,0.12), 2px 2px 6px rgba(0,0,0,0.45)',
            }}
          />

          {/* Banner */}
          <div
            ref={bannerRef}
            className="pointer-events-auto"
            style={{
              position: 'absolute',
              top: '115px',
              backgroundColor: config.bg_color,
              color: config.text_color,
              padding: '18px 40px',
              borderRadius: '10px',
              fontSize: `${config.font_size}px`,
              fontWeight: config.font_weight,
              whiteSpace: 'nowrap',
              maxWidth: '86vw',
              textAlign: 'center',
              background: `linear-gradient(145deg, ${config.bg_color} 0%, ${adjustBrightness(config.bg_color, -16)} 100%)`,
              border: `2px solid ${adjustBrightness(config.bg_color, -32)}`,
              boxShadow: `0 14px 38px rgba(0,0,0,0.32), 0 4px 12px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.22)`,
              textShadow: '0 1px 3px rgba(0,0,0,0.22)',
              letterSpacing: '0.5px',
              willChange: 'transform, opacity',
            }}
          >
            {config.text}
          </div>

          {/* Right rope */}
          <div
            ref={rightRopeRef}
            style={{
              position: 'absolute',
              right: '18%',
              top: 0,
              width: '3px',
              height: '115px',
              background:
                'repeating-linear-gradient(180deg, #6b3a1f 0px, #a0652a 6px, #6b3a1f 12px)',
              borderRadius: '2px',
              transformOrigin: 'top center',
              boxShadow: 'inset 1px 0 2px rgba(255,255,255,0.12), -2px 2px 6px rgba(0,0,0,0.45)',
            }}
          />
        </div>
      </div>
    </>
  );
}
