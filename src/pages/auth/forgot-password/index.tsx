import logo from "../../../assets/logo/logo.png";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../config/firebase";
import { Link } from "react-router-dom";
import { notifyUser } from "../../../helpers/notifyUser";
import { Mail, ArrowRight, CheckCircle2, ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Deterministic particle data ───────────────────────────────────────────────
const PARTICLES = Array.from({ length: 55 }, (_, i) => ({
  id: i,
  cx: `${((i * 31.7 + 7) % 93) + 3.5}%`,
  cy: `${((i * 47.3 + 11) % 88) + 6}%`,
  r: 1.5 + (i % 5) * 1.1,
  delay: `${(i * 0.41) % 5}s`,
  dur: `${4 + (i % 6)}s`,
  opacity: 0.06 + (i % 4) * 0.04,
}));

// ── Orbit ring config ─────────────────────────────────────────────────────────
const RINGS = [
  { rx: "28%", ry: "9%",  dur: "10s", delay: "0s",   color: "#00875a", strokeOpacity: 0.10 },
  { rx: "20%", ry: "6%",  dur: "7s",  delay: "1s",   color: "#00b86e", strokeOpacity: 0.08 },
  { rx: "36%", ry: "12%", dur: "14s", delay: "0.5s", color: "#00a360", strokeOpacity: 0.07 },
  { rx: "15%", ry: "5%",  dur: "6s",  delay: "2s",   color: "#00875a", strokeOpacity: 0.09 },
  { rx: "44%", ry: "15%", dur: "18s", delay: "1.5s", color: "#00d97e", strokeOpacity: 0.05 },
];

function AnimatedBackground() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      style={{ zIndex: 0 }}
    >
      <defs>
        <radialGradient id="orbGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00875a" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#00875a" stopOpacity="0" />
        </radialGradient>
        <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <style>{`
          @keyframes fp-float {
            0%,100% { transform: translateY(0);   opacity: 0; }
            20%      { opacity: 1; }
            80%      { opacity: 0.7; }
            100%     { transform: translateY(-40px); opacity: 0; }
          }
          @keyframes fp-orbitCW  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
          @keyframes fp-orbitCCW { from { transform: rotate(360deg); } to { transform: rotate(0deg);    } }
          @keyframes fp-pulse {
            0%,100% { opacity: 0.6; }
            50%     { opacity: 1; }
          }
          @keyframes pingRing {
            0%   { transform: scale(1); opacity: 0.5; }
            100% { transform: scale(2.2); opacity: 0; }
          }
        `}</style>
      </defs>

      {/* White fill */}
      <rect width="100%" height="100%" fill="#ffffff" />

      {/* Soft dot grid */}
      {Array.from({ length: 22 }, (_, col) =>
        Array.from({ length: 16 }, (_, row) => (
          <circle
            key={`dot-${col}-${row}`}
            cx={`${(col / 21) * 100}%`}
            cy={`${(row / 15) * 100}%`}
            r="1"
            fill="#00875a"
            opacity="0.07"
          />
        ))
      )}

      {/* Central orb glow */}
      <circle cx="50%" cy="50%" r="160" fill="url(#orbGrad)">
        <animate attributeName="r" values="140;190;140" dur="7s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;1;0.7" dur="7s" repeatCount="indefinite" />
      </circle>

      {/* Orbit rings */}
      {RINGS.map((ring, i) => (
        <g
          key={i}
          style={{
            transformOrigin: "50% 50%",
            animation: `${i % 2 === 0 ? "fp-orbitCW" : "fp-orbitCCW"} ${ring.dur} linear infinite ${ring.delay}`,
          }}
        >
          <ellipse
            cx="50%" cy="50%"
            rx={ring.rx} ry={ring.ry}
            fill="none"
            stroke={ring.color}
            strokeWidth="1"
            opacity={ring.strokeOpacity}
          />
        </g>
      ))}

      {/* Floating particles */}
      <g filter="url(#softGlow)">
        {PARTICLES.map((p) => (
          <circle
            key={p.id}
            cx={p.cx}
            cy={p.cy}
            r={p.r}
            fill="#00875a"
            opacity={p.opacity}
            style={{
              animation: `fp-float ${p.dur} ease-in-out infinite ${p.delay}`,
            }}
          />
        ))}
      </g>
    </svg>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim(), {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });
      setSent(true);
      notifyUser("success", "Reset link sent! Check your inbox and spam folder.");
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-email") {
        notifyUser("error", "No account found with that email address.");
      } else if (
        err.code === "auth/unauthorized-continue-uri" ||
        err.code === "auth/invalid-continue-uri"
      ) {
        try {
          await sendPasswordResetEmail(auth, email.trim());
          setSent(true);
          notifyUser("success", "Reset link sent! Check your inbox.");
        } catch (fe: unknown) {
          const f = fe as { message?: string };
          notifyUser("error", `Error: ${f.message}`);
        }
      } else {
        notifyUser("error", `Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white flex flex-col items-center justify-center px-4 py-16 sm:px-6">

      {/* Animated SVG background */}
      <AnimatedBackground />

      {/* Very light green tint overlay — left side only on desktop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background:
            "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(0,135,90,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Corner accent blobs */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-80 h-80 pointer-events-none rounded-full"
        style={{ zIndex: 1, background: "rgba(0,135,90,0.06)", filter: "blur(100px)", transform: "translate(30%,-30%)" }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 w-72 h-72 pointer-events-none rounded-full"
        style={{ zIndex: 1, background: "rgba(0,185,110,0.07)", filter: "blur(90px)", transform: "translate(-30%,30%)" }}
      />

      {/* Page content */}
      <div className="relative w-full max-w-[420px] flex flex-col items-center" style={{ zIndex: 2 }}>

        {/* Logo + Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-3 mb-8"
        >
          <div className="relative flex items-center justify-center w-20 h-20">
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full"
              style={{ background: "rgba(0,135,90,0.12)", filter: "blur(16px)", transform: "scale(1.3)" }}
            />
            <div
              className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: "white",
                boxShadow: "0 4px 24px rgba(0,135,90,0.14), 0 0 0 1.5px rgba(0,135,90,0.1)",
              }}
            >
              <img
                src={logo}
                alt="EBSU MSA Logo"
                className="w-14 h-14 object-contain"
              />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[13px] font-bold tracking-[0.25em] uppercase" style={{ color: "#00875a" }}>
              EBSU MSA
            </p>
            <p className="text-gray-400 text-[11px] tracking-wider uppercase mt-0.5">
              Student Portal
            </p>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full rounded-3xl overflow-hidden"
          style={{
            background: "white",
            boxShadow:
              "0 0 0 1.5px rgba(0,135,90,0.1), 0 8px 40px rgba(0,135,90,0.08), 0 32px 80px rgba(0,0,0,0.06)",
          }}
        >
          {/* Green top bar */}
          <div
            className="h-1.5 w-full"
            style={{
              background: "linear-gradient(90deg, #00875a 0%, #00d97e 50%, #00875a 100%)",
            }}
          />

          <div className="px-7 sm:px-8 pt-7 pb-8">

            {/* Back link */}
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-[#00875a] transition-colors duration-200 mb-7 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-200" />
              Back to Login
            </Link>

            <AnimatePresence mode="wait">
              {sent ? (
                /* ── Success state ── */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div className="flex justify-center">
                    <div className="relative flex items-center justify-center w-24 h-24">
                      {[1, 2].map((i) => (
                        <span
                          key={i}
                          aria-hidden="true"
                          className="absolute rounded-full"
                          style={{
                            inset: `-${i * 10}px`,
                            border: "1.5px solid rgba(0,135,90,0.22)",
                            animation: `pingRing ${1.3 + i * 0.45}s ease-out infinite`,
                            animationDelay: `${i * 0.4}s`,
                          }}
                        />
                      ))}
                      <div
                        className="relative w-18 h-18 w-[72px] h-[72px] rounded-2xl flex items-center justify-center"
                        style={{
                          background: "linear-gradient(135deg, #00875a 0%, #00d97e 100%)",
                          boxShadow: "0 12px 40px rgba(0,135,90,0.35)",
                        }}
                      >
                        <CheckCircle2 className="w-9 h-9 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="text-center space-y-2 pt-2">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                      Check your inbox!
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      We sent a reset link to{" "}
                      <span className="font-semibold break-all" style={{ color: "#00875a" }}>
                        {email}
                      </span>
                    </p>
                  </div>

                  <div
                    className="rounded-2xl p-5 space-y-3"
                    style={{
                      background: "rgba(0,135,90,0.04)",
                      border: "1px solid rgba(0,135,90,0.12)",
                    }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(0,135,90,0.55)" }}>
                      Next steps
                    </p>
                    {[
                      "Open the email from EBSU MSA",
                      'Click the "Reset Password" link',
                      "Create a strong new password",
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span
                          className="flex-shrink-0 w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center text-white mt-0.5"
                          style={{ background: "linear-gradient(135deg, #00875a, #00d97e)" }}
                        >
                          {i + 1}
                        </span>
                        <p className="text-sm text-gray-600 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>

                  <div
                    className="rounded-xl px-4 py-3 flex items-start gap-2.5"
                    style={{
                      background: "rgba(251,191,36,0.06)",
                      border: "1px solid rgba(251,191,36,0.2)",
                    }}
                  >
                    <span className="text-amber-500 text-sm flex-shrink-0 mt-0.5">&#9888;</span>
                    <p className="text-xs text-amber-700/80 leading-relaxed">
                      <span className="font-semibold text-amber-600">Not in inbox?</span>{" "}
                      Check your spam or junk folder. Link expires in 1 hour.
                    </p>
                  </div>

                  <button
                    onClick={() => { setSent(false); setEmail(""); }}
                    className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] hover:opacity-90"
                    style={{
                      background: "linear-gradient(135deg, #00875a 0%, #00d97e 100%)",
                      boxShadow: "0 8px 28px rgba(0,135,90,0.28)",
                    }}
                  >
                    Try a different email
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              ) : (
                /* ── Form state ── */
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 14 }}
                  transition={{ duration: 0.38 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-4">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          background: "rgba(0,135,90,0.09)",
                          border: "1px solid rgba(0,135,90,0.15)",
                        }}
                      >
                        <Lock className="w-4 h-4" style={{ color: "#00875a" }} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#00875a" }}>
                        Secure Reset
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-[1.65rem] font-bold text-gray-900 leading-tight tracking-tight">
                      Forgot your password?
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Enter your registered email and we&apos;ll send a secure reset link straight to your inbox.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="fp-email"
                        className="block text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                          style={{ color: "rgba(0,135,90,0.5)" }}
                        />
                        <input
                          type="email"
                          id="fp-email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          autoComplete="email"
                          className="w-full pl-11 pr-4 py-3.5 text-sm text-gray-800 placeholder-gray-300 rounded-xl outline-none transition-all duration-200"
                          style={{
                            background: "#f8fdfb",
                            border: "1.5px solid #e0f0ea",
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.border = "1.5px solid rgba(0,135,90,0.5)";
                            e.currentTarget.style.boxShadow = "0 0 0 3.5px rgba(0,135,90,0.08)";
                            e.currentTarget.style.background = "#f0faf5";
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.border = "1.5px solid #e0f0ea";
                            e.currentTarget.style.boxShadow = "none";
                            e.currentTarget.style.background = "#f8fdfb";
                          }}
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 pl-1">
                        Use the email linked to your EBSU MSA account
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !email.trim()}
                      className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background:
                          loading || !email.trim()
                            ? "rgba(0,135,90,0.4)"
                            : "linear-gradient(135deg, #00875a 0%, #00d97e 100%)",
                        boxShadow:
                          loading || !email.trim()
                            ? "none"
                            : "0 8px 28px rgba(0,135,90,0.28)",
                      }}
                    >
                      {loading ? (
                        <>
                          <svg
                            aria-hidden="true"
                            className="w-4 h-4 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12" cy="12" r="10"
                              stroke="currentColor" strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                          </svg>
                          Sending Reset Link...
                        </>
                      ) : (
                        <>
                          Send Reset Link
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Trust badges */}
                  <div className="flex flex-wrap justify-center gap-2 pt-1">
                    {[
                      { label: "256-bit SSL", icon: <ShieldCheck className="w-3 h-3" /> },
                      { label: "Instant Delivery", icon: <Mail className="w-3 h-3" /> },
                      { label: "Secure Link", icon: <Lock className="w-3 h-3" /> },
                    ].map(({ label, icon }) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1.5 text-[10px] font-medium px-3 py-1.5 rounded-full"
                        style={{
                          background: "rgba(0,135,90,0.06)",
                          border: "1px solid rgba(0,135,90,0.12)",
                          color: "rgba(0,135,90,0.7)",
                        }}
                      >
                        {icon}
                        {label}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Credit */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center text-[10px] text-gray-400 mt-6"
        >
          Crafted with passion by{" "}
          <span className="font-semibold" style={{ color: "#00875a" }}>Ken</span>
        </motion.p>
      </div>
    </div>
  );
}
