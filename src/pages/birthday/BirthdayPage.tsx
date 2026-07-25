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

    return () => {
      document.body.style.background = '';
      document.body.style.overflow = '';
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

    // Create animations
    const tl = gsap.timeline({ delay: 0.2 });

    if (rosesRef.current) {
      tl.from(rosesRef.current, {
        opacity: 0,
        scale: 0.5,
        y: 50,
        duration: 1.2,
        ease: 'back.out',
      }, 0);
    }

    if (titleRef.current) {
      tl.from(titleRef.current, {
        opacity: 0,
        y: 30,
        duration: 1,
        ease: 'power2.out',
      }, 0.3);
    }

    if (nameRef.current) {
      tl.from(nameRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 1.2,
        ease: 'elastic.out(1, 0.5)',
      }, 0.5);
    }

    if (messageCardRef.current) {
      tl.from(messageCardRef.current, {
        opacity: 0,
        y: 40,
        duration: 1,
        ease: 'power2.out',
      }, 0.7);
    }

    if (celebrationRef.current) {
      tl.from(celebrationRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: 'power2.out',
      }, 0.9);
    }

    // Continuous pulse glow on name
    if (nameRef.current) {
      gsap.to(nameRef.current, {
        textShadow: [
          '0 0 20px rgba(255, 215, 0, 0.4), 0 0 40px rgba(168, 85, 247, 0.3)',
          '0 0 40px rgba(255, 215, 0, 0.8), 0 0 80px rgba(168, 85, 247, 0.6)',
          '0 0 20px rgba(255, 215, 0, 0.4), 0 0 40px rgba(168, 85, 247, 0.3)',
        ],
        duration: 3,
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
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      {/* Animated Stars Background */}
      <div className="stars" style={{ position: 'absolute', inset: 0 }}>
        {[...Array(50)].map((_, i) => (
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
              opacity: Math.random() * 0.7 + 0.3,
              animation: `twinkle ${Math.random() * 2 + 2}s infinite`,
              animationDelay: `${Math.random() * 2}s`,
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
          gap: '30px',
          textAlign: 'center',
          zIndex: 10,
          maxWidth: '900px',
        }}
      >
        {/* Roses Image */}
        <div
          ref={rosesRef}
          style={{
            opacity: 1,
            transition: 'all 0.3s ease',
          }}
        >
          <img
            src="/birthday-roses.png"
            alt="Beautiful roses"
            style={{
              width: '280px',
              height: 'auto',
              maxWidth: '90vw',
              borderRadius: '20px',
              boxShadow: '0 0 40px rgba(219, 112, 147, 0.6), 0 0 80px rgba(219, 112, 147, 0.3)',
            }}
          />
        </div>

        {/* Happy Birthday Title */}
        <div ref={titleRef} style={{ opacity: 1 }}>
          <h1
            style={{
              fontSize: 'clamp(48px, 10vw, 80px)',
              fontWeight: '800',
              margin: '0',
              background: 'linear-gradient(135deg, #fbbf24 0%, #ec4899 50%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 15px rgba(251, 191, 36, 0.8)) drop-shadow(0 0 30px rgba(168, 85, 247, 0.6))',
              textShadow: '0 0 20px rgba(219, 112, 147, 0.8), 0 0 40px rgba(168, 85, 247, 0.6)',
              letterSpacing: '3px',
              fontFamily: "'Playfair Display', serif",
            }}
          >
            Happy Birthday
          </h1>
        </div>

        {/* President Name - Main Focus */}
        <div ref={nameRef} style={{ opacity: 1 }}>
          <h2
            style={{
              fontSize: 'clamp(36px, 8vw, 68px)',
              fontWeight: '900',
              margin: '0',
              background: 'linear-gradient(135deg, #fbbf24 0%, #ec4899 50%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 1)) drop-shadow(0 0 40px rgba(236, 72, 153, 0.8))',
              textShadow: '0 0 40px rgba(255, 215, 0, 0.8), 0 0 80px rgba(168, 85, 247, 0.6)',
              letterSpacing: '2px',
              fontFamily: "'Playfair Display', serif",
            }}
          >
            NWITE NANCY KOSARACHI
          </h2>
          <p
            style={{
              fontSize: '22px',
              fontWeight: '700',
              margin: '15px 0 0 0',
              color: '#fbbf24',
              filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 1))',
              textShadow: '0 0 20px rgba(251, 191, 36, 0.8)',
              letterSpacing: '3px',
              fontFamily: "'Montserrat', sans-serif",
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
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(219, 112, 147, 0.3)',
            borderRadius: '25px',
            padding: '40px 50px',
            boxShadow: '0 8px 32px rgba(168, 85, 247, 0.2), 0 0 60px rgba(219, 112, 147, 0.2)',
            maxWidth: '700px',
            width: '100%',
          }}
        >
          <h3
            style={{
              fontSize: '32px',
              fontWeight: '700',
              margin: '0 0 15px 0',
              color: '#ffffff',
              textShadow: '0 0 20px rgba(168, 85, 247, 0.6)',
              fontFamily: "'Playfair Display', serif",
            }}
          >
            🎉 EBSUMSA Tech Team 🎉
          </h3>
          <p
            style={{
              fontSize: '26px',
              fontWeight: '600',
              margin: '15px 0',
              color: '#ec4899',
              textShadow: '0 0 15px rgba(236, 72, 153, 0.5)',
              letterSpacing: '1px',
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            Wishes You a Happy Birthday!
          </p>
          <div
            style={{
              height: '3px',
              width: '80px',
              background: 'linear-gradient(90deg, #fbbf24 0%, #ec4899 50%, #06b6d4 100%)',
              borderRadius: '3px',
              margin: '20px auto 25px',
            }}
          />
          <p
            style={{
              fontSize: '17px',
              fontWeight: '400',
              margin: '0',
              color: '#d1d5db',
              lineHeight: '1.8',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Your exceptional vision, unwavering leadership, and commitment to excellence have been the driving force behind EBSUMSA&apos;s success. Thank you for inspiring and guiding us towards greater heights. May this special day bring you immense joy, good health, and continued success in all your endeavors.
          </p>
        </div>

        {/* Celebration Message */}
        <div ref={celebrationRef} style={{ opacity: 1 }}>
          <p
            style={{
              fontSize: '28px',
              fontWeight: '700',
              margin: '20px 0',
              background: 'linear-gradient(90deg, #fbbf24 0%, #06b6d4 50%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '2px',
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            ✨ Celebrating Excellence & Leadership ✨
          </p>
        </div>
      </div>

      {/* Floating Balloons */}
      {[...Array(6)].map((_, i) => (
        <div
          key={`balloon-${i}`}
          style={{
            position: 'fixed',
            left: `${10 + i * 15}%`,
            bottom: '-50px',
            zIndex: i % 2 === 0 ? 5 : 8,
            animation: `float-balloon ${4 + i * 0.5}s infinite ease-in-out`,
            animationDelay: `${i * 0.3}s`,
          }}
        >
          <div
            style={{
              width: '30px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: ['#FF69B4', '#FFD700', '#00CED1', '#FF6347', '#32CD32', '#9370DB'][i],
              boxShadow: `0 0 20px ${['#FF69B4', '#FFD700', '#00CED1', '#FF6347', '#32CD32', '#9370DB'][i]}`,
            }}
          />
          <div
            style={{
              width: '1px',
              height: '60px',
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
          bottom: '40px',
          display: 'flex',
          gap: '20px',
          zIndex: 10,
        }}
      >
        {['#fbbf24', '#ec4899', '#06b6d4', '#a855f7', '#f97316'].map((color, i) => (
          <div
            key={`light-${i}`}
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: color,
              boxShadow: `0 0 30px ${color}`,
              animation: `pulse-light 2s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Confetti pieces */}
      {[...Array(20)].map((_, i) => (
        <div
          key={`confetti-${i}`}
          style={{
            position: 'fixed',
            left: `${Math.random() * 100}%`,
            top: '-20px',
            width: '8px',
            height: '8px',
            backgroundColor: ['#fbbf24', '#ec4899', '#06b6d4', '#a855f7', '#f97316'][i % 5],
            borderRadius: '50%',
            animation: `fall-confetti ${3 + Math.random() * 2}s linear infinite`,
            animationDelay: `${i * 0.2}s`,
            zIndex: 1,
          }}
        />
      ))}

      {/* Animation Keyframes */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes pulse-light {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        @keyframes float-balloon {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px); opacity: 0; }
        }
        @keyframes fall-confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
