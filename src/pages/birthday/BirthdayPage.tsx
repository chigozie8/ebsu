import { useEffect, useRef } from "react";
import gsap from "gsap";
import "./BirthdayPage.css";

export default function BirthdayPage() {
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const messageRef = useRef(null);
  const nameRef = useRef(null);
  const confettiRefs = useRef<(HTMLDivElement | null)[]>([]);
  const balloonRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rosesRef = useRef(null);

  useEffect(() => {
    // Set body background
    document.body.style.background = "linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";
    
    return () => {
      document.body.style.background = "";
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    // Ensure container is visible first
    if (containerRef.current) {
      gsap.set(containerRef.current, { opacity: 1 });
    }

    const tl = gsap.timeline();

    // Roses entrance animation
    tl.from(
      rosesRef.current,
      {
        opacity: 0,
        scale: 0.8,
        duration: 1.5,
        ease: "back.out",
      },
      0.3
    );

    // Title animation with glow effect
    tl.from(
      titleRef.current,
      {
        opacity: 0,
        y: 50,
        duration: 1,
        ease: "power2.out",
      },
      0.5
    );

    // Name animation
    tl.from(
      nameRef.current,
      {
        opacity: 0,
        scale: 0.5,
        y: 30,
        duration: 1,
        ease: "elastic.out(1, 0.5)",
      },
      0.8
    );

    // Message animation
    tl.from(
      messageRef.current,
      {
        opacity: 0,
        y: 20,
        duration: 1,
        ease: "power2.out",
      },
      1
    );

    // Confetti animations
    confettiRefs.current.forEach((confetti, index) => {
      if (confetti) {
        tl.to(
          confetti,
          {
            opacity: [0, 1, 0],
            y: gsap.utils.random(-300, -500),
            x: gsap.utils.random(-150, 150),
            rotation: gsap.utils.random(0, 360),
            duration: gsap.utils.random(2.5, 3.5),
            ease: "power1.in",
          },
          1.2 + index * 0.1
        );
      }
    });

    // Balloon animations
    balloonRefs.current.forEach((balloon, index) => {
      if (balloon) {
        tl.to(
          balloon,
          {
            opacity: [0, 1],
            y: gsap.utils.random(-400, -600),
            x: gsap.utils.random(-200, 200),
            duration: gsap.utils.random(4, 6),
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          },
          1.2 + index * 0.15
        );
      }
    });

    // Pulse effect on main message
    gsap.to(nameRef.current, {
      textShadow: [
        "0 0 10px rgba(255, 215, 0, 0.5)",
        "0 0 30px rgba(255, 215, 0, 0.8)",
        "0 0 10px rgba(255, 215, 0, 0.5)",
      ],
      duration: 2,
      repeat: -1,
      ease: "sine.inOut",
    });
  }, []);

  // Generate confetti pieces
  const confettiPieces = Array.from({ length: 50 }, (_, i) => i);

  // Generate balloons
  const balloons = Array.from({ length: 8 }, (_, i) => i);

  return (
    <div
      ref={containerRef}
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated stars */}
        <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-white rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-32 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse delay-700"></div>
      </div>

      {/* Confetti pieces */}
      <div className="absolute inset-0 pointer-events-none">
        {confettiPieces.map((i) => (
          <div
            key={`confetti-${i}`}
            ref={(el) => {
              if (el) confettiRefs.current[i] = el;
            }}
            className="confetti-piece absolute w-2 h-2 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: "10%",
              backgroundColor: [
                "#FFD700",
                "#FF69B4",
                "#00CED1",
                "#FF6347",
                "#32CD32",
                "#FF1493",
              ][i % 6],
            }}
          ></div>
        ))}
      </div>

      {/* Balloons */}
      <div className="absolute inset-0 pointer-events-none">
        {balloons.map((i) => (
          <div
            key={`balloon-${i}`}
            ref={(el) => {
              if (el) balloonRefs.current[i] = el;
            }}
            className="absolute"
            style={{
              left: `${(i % 2 === 0 ? 20 : 80) + (i % 4) * 10}%`,
              top: "100%",
              opacity: 0,
            }}
          >
            <div
              className="w-8 h-10 rounded-full"
              style={{
                backgroundColor: [
                  "#FF69B4",
                  "#FFD700",
                  "#00CED1",
                  "#FF6347",
                  "#32CD32",
                  "#9370DB",
                  "#FF1493",
                  "#00FF7F",
                ][i],
              }}
            ></div>
            <div className="w-0.5 h-16 bg-white" style={{ margin: "0 auto" }}></div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-4">
        {/* Decorative roses image */}
        <div
          ref={rosesRef}
          className="mb-8 flex justify-center opacity-0"
        >
          <img
            src="/birthday-roses.png"
            alt="Beautiful roses"
            className="w-full max-w-sm h-auto rounded-2xl shadow-2xl"
            style={{
              boxShadow:
                "0 0 40px rgba(255, 215, 0, 0.4), 0 0 80px rgba(255, 105, 180, 0.3)",
            }}
          />
        </div>

        {/* Title */}
        <h1
          ref={titleRef}
          className="text-5xl md:text-7xl font-bold mb-6 opacity-0"
          style={{
            background:
              "linear-gradient(135deg, #FFD700 0%, #FF69B4 50%, #00CED1 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "2px",
          }}
        >
          🎉 Happy Birthday! 🎉
        </h1>

        {/* President name */}
        <h2
          ref={nameRef}
          className="text-4xl md:text-6xl font-black mb-6 opacity-0"
          style={{
            color: "#FFD700",
            textShadow: "0 0 30px rgba(255, 215, 0, 0.5)",
            letterSpacing: "1px",
          }}
        >
          NWITE NANCY KOSARACHI
        </h2>

        {/* Main message */}
        <div
          ref={messageRef}
          className="opacity-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 md:p-12 max-w-2xl mx-auto shadow-2xl"
        >
          <p className="text-2xl md:text-3xl font-bold text-white mb-4">
            EBSUMSA Tech Team
          </p>
          <p className="text-xl md:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 font-semibold mb-6">
            Wishes You a Happy Birthday!
          </p>
          <div className="h-1 w-24 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full mx-auto mb-6"></div>
          <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
            Your vision, leadership, and dedication to EBSUMSA have been truly
            inspiring. May this special day bring you joy, success, and all the
            happiness you deserve.
          </p>
        </div>

        {/* Decorative bottom elements */}
        <div className="mt-12 flex justify-center gap-6">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse delay-200"></div>
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-300"></div>
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse delay-400"></div>
        </div>
      </div>

      {/* Bottom decorative text */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-sm md:text-base text-gray-400 font-semibold">
          Celebrating Excellence & Leadership
        </p>
      </div>
    </div>
  );
}
