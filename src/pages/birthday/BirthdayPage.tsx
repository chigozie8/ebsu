import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './BirthdayPage.css';

export default function BirthdayPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rosesRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const messageCardRef = useRef<HTMLDivElement>(null);
  const celebrationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.background = 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.background = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    // Ensure all elements are visible
    const elements = [rosesRef, titleRef, nameRef, messageCardRef, celebrationRef];
    elements.forEach((ref) => {
      if (ref.current) {
        gsap.set(ref.current, { opacity: 1 });
      }
    });

    // Create animations with shorter duration for better performance
    const tl = gsap.timeline({ delay: 0.1 });

    if (rosesRef.current) {
      tl.from(rosesRef.current, {
        opacity: 0,
        scale: 0.5,
        y: 30,
        duration: 0.8,
        ease: 'back.out',
      }, 0);
    }

    if (titleRef.current) {
      tl.from(titleRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power2.out',
      }, 0.2);
    }

    if (nameRef.current) {
      tl.from(nameRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.8,
        ease: 'elastic.out(1, 0.5)',
      }, 0.3);
    }

    if (messageCardRef.current) {
      tl.from(messageCardRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.7,
        ease: 'power2.out',
      }, 0.5);
    }

    if (celebrationRef.current) {
      tl.from(celebrationRef.current, {
        opacity: 0,
        y: 15,
        duration: 0.6,
        ease: 'power2.out',
      }, 0.7);
    }

    // Pulse glow on name - optimized
    if (nameRef.current) {
      gsap.to(nameRef.current, {
        textShadow: [
          '0 0 15px rgba(255, 215, 0, 0.3), 0 0 30px rgba(168, 85, 247, 0.2)',
          '0 0 30px rgba(255, 215, 0, 0.6), 0 0 60px rgba(168, 85, 247, 0.4)',
          '0 0 15px rgba(255, 215, 0, 0.3), 0 0 30px rgba(168, 85, 247, 0.2)',
        ],
        duration: 2.5,
        repeat: -1,
        ease: 'sine.inOut',
      });
    }
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999,
        overflow: 'auto',
        overscrollBehavior: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 'max(20px, env(safe-area-inset-top))',
        paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        paddingLeft: 'max(16px, env(safe-area-inset-left))',
        paddingRight: 'max(16px, env(safe-area-inset-right))',
        boxSizing: 'border-box',
      }}
    >
      {/* Animated Stars Background - REDUCED for performance */}
      <div className="stars" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '2px',
              height: '2px',
              backgroundColor: 'white',
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.6 + 0.4,
              animation: `twinkle ${2 + Math.random() * 1.5}s infinite`,
              animationDelay: `${Math.random() * 1}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(16px, 4vw, 28px)',
          textAlign: 'center',
          zIndex: 10,
          maxWidth: '100%',
          width: '100%',
          padding: '0 clamp(12px, 3vw, 20px)',
          boxSizing: 'border-box',
        }}
      >
        {/* Roses Image */}
        <div
          ref={rosesRef}
          style={{
            opacity: 1,
            transition: 'all 0.3s ease',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <img
            src="/birthday-roses.png"
            alt="Beautiful roses"
            style={{
              width: 'clamp(180px, 60vw, 280px)',
              height: 'auto',
              borderRadius: '16px',
              boxShadow: '0 0 30px rgba(219, 112, 147, 0.5), 0 0 60px rgba(219, 112, 147, 0.2)',
            }}
            loading="lazy"
          />
        </div>

        {/* Happy Birthday Title */}
        <div ref={titleRef} style={{ opacity: 1, width: '100%' }}>
          <h1
            style={{
              fontSize: 'clamp(36px, 9vw, 72px)',
              fontWeight: '800',
              margin: '0',
              background: 'linear-gradient(135deg, #fbbf24 0%, #ec4899 50%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 15px rgba(219, 112, 147, 0.6)',
              letterSpacing: 'clamp(1px, 0.5vw, 3px)',
              fontFamily: "'Playfair Display', serif",
              wordBreak: 'break-word',
            }}
          >
            Happy Birthday
          </h1>
        </div>

        {/* President Name - Main Focus */}
        <div ref={nameRef} style={{ opacity: 1, width: '100%' }}>
          <h2
            style={{
              fontSize: 'clamp(28px, 7vw, 56px)',
              fontWeight: '900',
              margin: '0',
              background: 'linear-gradient(135deg, #fbbf24 0%, #ec4899 50%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 20px rgba(255, 215, 0, 0.6)',
              letterSpacing: 'clamp(0.5px, 0.3vw, 2px)',
              fontFamily: "'Playfair Display', serif",
              wordBreak: 'break-word',
              lineHeight: '1.2',
            }}
          >
            NWITE NANCY KOSARACHI
          </h2>
          <p
            style={{
              fontSize: 'clamp(14px, 4vw, 20px)',
              fontWeight: '700',
              margin: 'clamp(8px, 2vw, 12px) 0 0 0',
              color: '#fbbf24',
              textShadow: '0 0 12px rgba(251, 191, 36, 0.6)',
              letterSpacing: 'clamp(1px, 0.2vw, 2px)',
              fontFamily: "'Montserrat', sans-serif",
              wordBreak: 'break-word',
            }}
          >
            PRESIDENT OF EBSUMSA
          </p>
        </div>

        {/* Message Card */}
        <div
          ref={messageCardRef}
          style={{
            opacity: 1,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(219, 112, 147, 0.25)',
            borderRadius: 'clamp(16px, 4vw, 24px)',
            padding: 'clamp(20px, 5vw, 40px)',
            boxShadow: '0 4px 16px rgba(168, 85, 247, 0.1), 0 0 40px rgba(219, 112, 147, 0.1)',
            maxWidth: '100%',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <h3
            style={{
              fontSize: 'clamp(18px, 5vw, 28px)',
              fontWeight: '700',
              margin: '0 0 clamp(10px, 2vw, 15px) 0',
              color: '#ffffff',
              textShadow: '0 0 15px rgba(168, 85, 247, 0.4)',
              fontFamily: "'Playfair Display', serif",
              wordBreak: 'break-word',
            }}
          >
            🎉 EBSUMSA Tech Team 🎉
          </h3>
          <p
            style={{
              fontSize: 'clamp(16px, 4.5vw, 22px)',
              fontWeight: '600',
              margin: 'clamp(10px, 2vw, 15px) 0',
              color: '#ec4899',
              textShadow: '0 0 10px rgba(236, 72, 153, 0.4)',
              letterSpacing: '0.5px',
              fontFamily: "'Montserrat', sans-serif",
              wordBreak: 'break-word',
            }}
          >
            Wishes You a Happy Birthday!
          </p>
          <div
            style={{
              height: '2px',
              width: '60px',
              background: 'linear-gradient(90deg, #fbbf24 0%, #ec4899 50%, #06b6d4 100%)',
              borderRadius: '2px',
              margin: 'clamp(15px, 3vw, 20px) auto',
            }}
          />
          <p
            style={{
              fontSize: 'clamp(13px, 3.5vw, 16px)',
              fontWeight: '400',
              margin: '0',
              color: '#d1d5db',
              lineHeight: '1.6',
              fontFamily: "'Inter', sans-serif",
              wordBreak: 'break-word',
            }}
          >
            Your exceptional vision, unwavering leadership, and commitment to excellence have been the driving force behind EBSUMSA&apos;s success. Thank you for inspiring and guiding us towards greater heights. May this special day bring you immense joy, good health, and continued success in all your endeavors.
          </p>
        </div>

        {/* Celebration Message */}
        <div ref={celebrationRef} style={{ opacity: 1, width: '100%' }}>
          <p
            style={{
              fontSize: 'clamp(18px, 5vw, 26px)',
              fontWeight: '700',
              margin: 'clamp(16px, 3vw, 24px) 0',
              background: 'linear-gradient(90deg, #fbbf24 0%, #06b6d4 50%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '0.5px',
              fontFamily: "'Montserrat', sans-serif",
              wordBreak: 'break-word',
            }}
          >
            ✨ Celebrating Excellence & Leadership ✨
          </p>
        </div>
      </div>

      {/* Floating Balloons - REDUCED for performance */}
      {[...Array(3)].map((_, i) => (
        <div
          key={`balloon-${i}`}
          style={{
            position: 'fixed',
            left: `${15 + i * 35}%`,
            bottom: '-50px',
            zIndex: i % 2 === 0 ? 5 : 8,
            animation: `float-balloon ${5 + i * 0.5}s infinite ease-in-out`,
            animationDelay: `${i * 0.4}s`,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: 'clamp(20px, 4vw, 28px)',
              height: 'clamp(28px, 5vw, 40px)',
              borderRadius: '50%',
              backgroundColor: ['#FF69B4', '#FFD700', '#00CED1'][i],
              boxShadow: `0 0 15px ${['#FF69B4', '#FFD700', '#00CED1'][i]}`,
            }}
          />
          <div
            style={{
              width: '1px',
              height: 'clamp(40px, 8vw, 60px)',
              backgroundColor: '#ffffff',
              margin: '0 auto',
            }}
          />
        </div>
      ))}

      {/* Pulsing Lights at Bottom */}
      <div
        style={{
          position: 'fixed',
          bottom: 'max(20px, env(safe-area-inset-bottom))',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 'clamp(12px, 2vw, 16px)',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        {['#fbbf24', '#ec4899', '#06b6d4'].map((color, i) => (
          <div
            key={`light-${i}`}
            style={{
              width: 'clamp(12px, 2vw, 16px)',
              height: 'clamp(12px, 2vw, 16px)',
              borderRadius: '50%',
              backgroundColor: color,
              boxShadow: `0 0 20px ${color}`,
              animation: `pulse-light 2s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Confetti pieces - REDUCED for performance */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`confetti-${i}`}
          style={{
            position: 'fixed',
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20}px`,
            width: '6px',
            height: '6px',
            backgroundColor: ['#fbbf24', '#ec4899', '#06b6d4'][i % 3],
            borderRadius: '50%',
            animation: `fall-confetti ${2.5 + Math.random() * 1.5}s linear infinite`,
            animationDelay: `${i * 0.3}s`,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Animation Keyframes */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes pulse-light {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.15); }
        }
        @keyframes float-balloon {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-110vh) translateX(0); opacity: 0; }
        }
        @keyframes fall-confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        
        /* Smooth scrolling on mobile */
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        /* Prevent double-tap zoom issues */
        input, button, select, textarea {
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}
