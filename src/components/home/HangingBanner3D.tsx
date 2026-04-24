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

// Jewel-toned orb palette — deep, saturated, premium
const ORB_COLORS = [
  '#ff3d6e', '#7c3aed', '#f59e0b', '#10b981',
  '#3b82f6', '#ec4899', '#06b6d4', '#f97316',
  '#8b5cf6', '#ff3d6e', '#10b981', '#f59e0b',
  '#3b82f6', '#7c3aed', '#ec4899', '#06b6d4',
  '#f97316', '#8b5cf6', '#ff3d6e', '#10b981',
  '#f59e0b', '#3b82f6', '#7c3aed', '#ec4899',
  '#06b6d4', '#f97316', '#8b5cf6', '#ff3d6e',
];

export default function HangingBanner3D({ config, onComplete }: HangingBanner3DProps) {
  const wrapperRef    = useRef<HTMLDivElement>(null);
  const backdropRef   = useRef<HTMLDivElement>(null);
  const bannerRef     = useRef<HTMLDivElement>(null);
  const leftRopeRef   = useRef<HTMLDivElement>(null);
  const rightRopeRef  = useRef<HTMLDivElement>(null);
  const orbitBarRef   = useRef<HTMLDivElement>(null);
  const [orbCount, setOrbCount] = useState(26);
  const [gone, setGone]         = useState(false);

  // Keep orb count responsive
  useEffect(() => {
    const update = () => setOrbCount(Math.max(12, Math.floor(window.innerWidth / 48)));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!config.is_active) return;

    const raf = requestAnimationFrame(() => {
      const wrapper   = wrapperRef.current;
      const backdrop  = backdropRef.current;
      const banner    = bannerRef.current;
      const leftRope  = leftRopeRef.current;
      const rightRope = rightRopeRef.current;
      const orbitBar  = orbitBarRef.current;

      if (!wrapper || !backdrop || !banner || !leftRope || !rightRope || !orbitBar) return;

      const holdDuration = Math.max(2, config.duration - 3.2);
      const swayCount    = Math.max(1, Math.floor(holdDuration / 1.6));

      // Initial hidden state
      gsap.set(wrapper,   { autoAlpha: 1 });
      gsap.set(backdrop,  { autoAlpha: 0 });
      gsap.set(orbitBar,  { autoAlpha: 0, y: -12 });
      gsap.set([leftRope, rightRope], { scaleY: 0, transformOrigin: 'top center' });
      gsap.set(banner,    { y: -340, autoAlpha: 0, rotationX: 50, scale: 0.85 });

      const tl = gsap.timeline();

      // --- ENTER ---
      // 1. Backdrop sweeps in
      tl.to(backdrop, { autoAlpha: 0.72, duration: 0.5, ease: 'power2.out' }, 0);

      // 2. Orb bar descends and lights up
      tl.to(orbitBar, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'back.out(1.6)' }, 0.1);

      // 3. Ropes unfurl
      tl.to([leftRope, rightRope], {
        scaleY: 1, duration: 0.6, ease: 'back.out(1.4)', stagger: 0.08,
      }, 0.45);

      // 4. Banner snaps down with 3-D flip
      tl.to(banner, {
        y: 0, autoAlpha: 1, rotationX: 0, scale: 1,
        duration: 0.7, ease: 'back.out(1.6)',
      }, 0.75);

      // 5. Gentle sway while holding
      tl.to(banner, {
        x: 16, rotationZ: 1.6,
        duration: 1.6, ease: 'sine.inOut',
        repeat: swayCount, yoyo: true,
      }, 1.6);
      tl.to([leftRope, rightRope], {
        rotationZ: (i: number) => (i === 0 ? -1.4 : 1.4),
        duration: 1.6, ease: 'sine.inOut',
        repeat: swayCount, yoyo: true,
      }, 1.6);

      // --- EXIT — everything shoots back UP ---
      const exitStart = `>+0.1`;   // immediately after sway finishes

      // Banner rockets up with a slight overshoot scale
      tl.to(banner, {
        y: -360, autoAlpha: 0, rotationX: -45, scale: 0.8,
        duration: 0.55, ease: 'back.in(1.8)',
      }, exitStart);

      // Ropes retract
      tl.to([leftRope, rightRope], {
        scaleY: 0, duration: 0.45, ease: 'power3.in',
      }, exitStart);

      // Orb bar whips up
      tl.to(orbitBar, {
        autoAlpha: 0, y: -18, duration: 0.4, ease: 'power2.in',
      }, `${exitStart}+=0.08`);

      // Backdrop fades last
      tl.to(backdrop, {
        autoAlpha: 0, duration: 0.35, ease: 'power1.in',
        onComplete: () => {
          setGone(true);
          onComplete?.();
        },
      }, `${exitStart}+=0.2`);
    });

    return () => cancelAnimationFrame(raf);
  }, [config, onComplete]);

  if (gone) return null;

  const bgDark    = adjustBrightness(config.bg_color, -22);
  const bgLighter = adjustBrightness(config.bg_color, 18);

  return (
    <>
      <style>{`
        @keyframes orb-pulse-a {
          0%, 100% { opacity: 1;    transform: scale(1);    filter: brightness(1.1) blur(0px); }
          50%       { opacity: 0.45; transform: scale(0.78); filter: brightness(0.5) blur(1px); }
        }
        @keyframes orb-pulse-b {
          0%, 100% { opacity: 0.5;  transform: scale(0.8);  filter: brightness(0.55); }
          55%       { opacity: 1;    transform: scale(1.08); filter: brightness(1.3)  blur(0px); }
        }
        @keyframes orb-pulse-c {
          0%,  100% { opacity: 0.85; transform: scale(0.92); }
          30%        { opacity: 1;    transform: scale(1.05); filter: brightness(1.25); }
          70%        { opacity: 0.3;  transform: scale(0.72); filter: brightness(0.4); }
        }
        @keyframes orb-corona {
          0%, 100% { box-shadow: 0 0 0px 0px currentColor; }
          50%       { box-shadow: 0 0 18px 8px currentColor; }
        }
        @keyframes wire-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>

      {/* Root wrapper — invisible until GSAP triggers */}
      <div
        ref={wrapperRef}
        className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
        style={{ height: '300px', visibility: 'hidden' }}
      >
        {/* Backdrop — subtle gradient wash behind everything */}
        <div
          ref={backdropRef}
          style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(180deg, ${bgDark}e8 0%, ${bgDark}40 55%, transparent 100%)`,
            backdropFilter: 'blur(2px)',
          }}
        />

        {/* ── Orb Lighting Bar ── */}
        <div
          ref={orbitBarRef}
          style={{ position: 'relative', width: '100%', height: '52px', zIndex: 2 }}
        >
          {/* Shimmering wire */}
          <div style={{
            position: 'absolute', top: '10px', left: 0, right: 0, height: '3px',
            background: `linear-gradient(90deg, #1a1a1a 0%, #666 40%, ${config.bg_color}cc 50%, #666 60%, #1a1a1a 100%)`,
            backgroundSize: '200% 100%',
            animation: 'wire-shimmer 3s linear infinite',
            boxShadow: `0 0 8px 2px ${config.bg_color}66, 0 2px 6px rgba(0,0,0,0.5)`,
            borderRadius: '2px',
          }} />

          {/* Glowing orbs */}
          {Array.from({ length: orbCount }).map((_, i) => {
            const color   = ORB_COLORS[i % ORB_COLORS.length];
            const leftPct = ((i + 0.5) / orbCount) * 100;
            const variant = i % 3;
            const pulse   = variant === 0 ? 'orb-pulse-a' : variant === 1 ? 'orb-pulse-b' : 'orb-pulse-c';
            const dur     = 1.0 + (i % 7) * 0.22;
            const del     = (i * 0.13) % 2.1;
            const size    = 14 + (i % 3) * 2; // vary size: 14/16/18px

            return (
              <div key={i} style={{
                position: 'absolute',
                left: `${leftPct}%`,
                top: '12px',
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 3,
              }}>
                {/* Stem */}
                <div style={{
                  width: '2px', height: '8px',
                  background: 'linear-gradient(180deg, #555 0%, #888 100%)',
                  flexShrink: 0,
                }} />
                {/* Cap */}
                <div style={{
                  width: `${size - 2}px`, height: '5px',
                  background: 'linear-gradient(180deg, #bbb 0%, #777 100%)',
                  borderRadius: '3px 3px 0 0',
                  flexShrink: 0,
                }} />
                {/* Orb body */}
                <div style={{
                  width: `${size}px`,
                  height: `${size * 1.35}px`,
                  backgroundColor: color,
                  borderRadius: '50% 50% 58% 58% / 38% 38% 62% 62%',
                  boxShadow: `
                    0 0 6px 3px ${color}bb,
                    0 0 14px 5px ${color}66,
                    inset 0 2px 4px rgba(255,255,255,0.3),
                    inset 0 -2px 4px rgba(0,0,0,0.2)
                  `,
                  animation: `${pulse} ${dur}s ${del}s infinite ease-in-out, orb-corona ${dur * 1.4}s ${del}s infinite ease-in-out`,
                  color,
                  flexShrink: 0,
                }} />
              </div>
            );
          })}
        </div>

        {/* ── Ropes + Banner ── */}
        <div style={{
          position: 'absolute', top: '52px', left: 0, right: 0,
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          perspective: '1400px',
        }}>
          {/* Left rope */}
          <div ref={leftRopeRef} style={{
            position: 'absolute', left: '14%', top: 0,
            width: '4px', height: '120px',
            background: 'repeating-linear-gradient(180deg,#4b2d0f 0px,#8a5022 5px,#4b2d0f 10px)',
            borderRadius: '3px',
            boxShadow: 'inset -1px 0 2px rgba(255,255,255,0.15), 3px 3px 8px rgba(0,0,0,0.5)',
            transformOrigin: 'top center',
          }} />

          {/* Banner panel */}
          <div
            ref={bannerRef}
            className="pointer-events-auto"
            style={{
              position: 'absolute',
              top: '120px',
              maxWidth: '88vw',
              width: 'max-content',
              color: config.text_color,
              padding: '16px 36px',
              borderRadius: '14px',
              fontSize: `clamp(14px, ${config.font_size}px, 5vw)`,
              fontWeight: config.font_weight,
              // Text wrapping — no overflow
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              textAlign: 'center',
              lineHeight: 1.4,
              // Premium layered background
              background: `linear-gradient(150deg, ${bgLighter} 0%, ${config.bg_color} 45%, ${bgDark} 100%)`,
              border: `1.5px solid ${adjustBrightness(config.bg_color, 30)}55`,
              boxShadow: `
                0 20px 48px rgba(0,0,0,0.38),
                0 6px 16px rgba(0,0,0,0.22),
                0 0 0 1px ${config.bg_color}55,
                0 0 40px 4px ${config.bg_color}44,
                inset 0 1px 0 rgba(255,255,255,0.28),
                inset 0 -1px 0 rgba(0,0,0,0.18)
              `,
              textShadow: `0 1px 4px rgba(0,0,0,0.28), 0 0 20px ${config.bg_color}88`,
              backdropFilter: 'blur(8px)',
              willChange: 'transform, opacity',
            }}
          >
            {config.text}
          </div>

          {/* Right rope */}
          <div ref={rightRopeRef} style={{
            position: 'absolute', right: '14%', top: 0,
            width: '4px', height: '120px',
            background: 'repeating-linear-gradient(180deg,#4b2d0f 0px,#8a5022 5px,#4b2d0f 10px)',
            borderRadius: '3px',
            boxShadow: 'inset 1px 0 2px rgba(255,255,255,0.15), -3px 3px 8px rgba(0,0,0,0.5)',
            transformOrigin: 'top center',
          }} />
        </div>
      </div>
    </>
  );
}
