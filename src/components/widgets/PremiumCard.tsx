/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInVariants5 } from "../../animation/variants";
import { db } from "../../config/firebase";
import { doc, onSnapshot } from "firebase/firestore";

interface PremiumCardProps {
  userID: string;
  userEmail: string;
}

export default function PremiumCard({ userID, userEmail }: PremiumCardProps) {
  const navigate = useNavigate();
  const [isPremium, setIsPremium] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // Check if user already has premium
  useEffect(() => {
    if (!userID) return;
    const unsub = onSnapshot(doc(db, "premiumUsers", userID), (snap) => {
      setIsPremium(snap.exists() && snap.data()?.active === true);
    });
    return () => unsub();
  }, [userID]);

  // Animated flowing lines on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    const lines: {
      x: number; y: number; vx: number; vy: number;
      len: number; opacity: number; hue: number;
    }[] = Array.from({ length: 8 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      len: 60 + Math.random() * 80,
      opacity: 0.4 + Math.random() * 0.5,
      hue: 40 + Math.random() * 20, // gold range
    }));

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      t += 0.012;

      lines.forEach((line, i) => {
        line.x += line.vx + Math.sin(t + i) * 0.4;
        line.y += line.vy + Math.cos(t + i * 0.7) * 0.4;

        // Bounce off edges
        if (line.x < 0 || line.x > width) line.vx *= -1;
        if (line.y < 0 || line.y > height) line.vy *= -1;

        const tailX = line.x - Math.cos(t + i) * line.len;
        const tailY = line.y - Math.sin(t + i) * line.len;

        const grad = ctx.createLinearGradient(tailX, tailY, line.x, line.y);
        grad.addColorStop(0, `hsla(${line.hue}, 90%, 60%, 0)`);
        grad.addColorStop(0.5, `hsla(${line.hue}, 90%, 70%, ${line.opacity})`);
        grad.addColorStop(1, `hsla(${line.hue}, 90%, 50%, 0)`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(line.x, line.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5 + Math.sin(t * 2 + i) * 0.5;
        ctx.lineCap = "round";
        ctx.stroke();
      });

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <motion.div
      variants={fadeInVariants5}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      custom={16}
      onClick={() => navigate("/u/premium")}
      className="relative overflow-hidden rounded-lg cursor-pointer h-[140px] xxss:h-[160px] sss:h-[195px]"
      style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
    >
      {/* Animated canvas lines */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Gold shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-amber-500/10 pointer-events-none" />

      {/* Border glow */}
      <div className="absolute inset-0 rounded-lg border border-yellow-500/40 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center gap-2 p-2 xxss:p-3">
        {/* Crown icon */}
        <div className="relative">
          <div className="absolute inset-0 blur-md bg-yellow-400/40 rounded-full" />
          <svg
            className="relative w-[28px] h-[28px] xxss:w-[36px] xxss:h-[36px] sm:w-[52px] sm:h-[52px]"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M2 17l2-9 4.5 4L12 4l3.5 8L20 8l2 9H2z"
              fill="url(#goldGrad)"
              stroke="#f59e0b"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="goldGrad" x1="2" y1="4" x2="22" y2="17" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <p className="text-yellow-300 text-sss xxss:text-xss sm:text-xs font-bold uppercase tracking-wider text-center leading-tight">
          Premium Package
        </p>

        {isPremium ? (
          <span className="text-xss bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 px-2 py-0.5 rounded-full font-semibold">
            Active
          </span>
        ) : (
          <span className="text-xss bg-white/10 text-white/70 border border-white/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Coming Soon
          </span>
        )}
      </div>
    </motion.div>
  );
}
