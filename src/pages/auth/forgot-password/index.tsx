import logo from "../../../assets/logo/logo.png";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../config/firebase";
import { Link } from "react-router-dom";
import { notifyUser } from "../../../helpers/notifyUser";
import { Mail, ArrowRight, CheckCircle2, ArrowLeft, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Particle dots (pure SVG, animated with CSS) ─────────────────────────────
const PARTICLES = Array.from({ length: 70 }, (_, i) => ({
  id: i,
  cx: `${((i * 31.7 + 7) % 96) + 2}%`,
  cy: `${((i * 47.3 + 11) % 92) + 4}%`,
  r: 0.28 + (i % 5) * 0.18,
  delay: `${(i * 0.41) % 5}s`,
  dur: `${3.5 + (i % 6)}s`,
}));

// ── Orbit ring config ────────────────────────────────────────────────────────
const RINGS = [
  { cx: "50%", cy: "50%", rx: "26%", ry: "8%",  dur: "9s",  delay: "0s",    color: "#00e87a", opacity: 0.28 },
  { cx: "50%", cy: "50%", rx: "20%", ry: "6%",  dur: "6s",  delay: "1s",    color: "#00ff9d", opacity: 0.22 },
  { cx: "50%", cy: "50%", rx: "34%", ry: "11%", dur: "13s", delay: "0.5s",  color: "#00c86e", opacity: 0.18 },
  { cx: "50%", cy: "50%", rx: "15%", ry: "4.5%",dur: "7s",  delay: "2s",    color: "#4fffb0", opacity: 0.20 },
  { cx: "50%", cy: "50%", rx: "42%", ry: "14%", dur: "17s", delay: "1.5s",  color: "#00d472", opacity: 0.14 },
  { cx: "50%", cy: "50%", rx: "10%", ry: "3%",  dur: "5s",  delay: "0.8s",  color: "#00ff8c", opacity: 0.25 },
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
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#001e10" />
          <stop offset="100%" stopColor="#000a05" />
        </radialGradient>
        <radialGradient id="orbGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00e87a" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#004d30" stopOpacity="0" />
        </radialGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <style>{`
          @keyframes fp-float {
            0%, 100% { transform: translateY(0);   opacity: 0; }
            20%       { opacity: 1; }
            80%       { opacity: 0.8; }
            100%      { transform: translateY(-55px); opacity: 0; }
          }
          @keyframes fp-pulse {
            0%, 100% { r: 90px;  opacity: 0.16; }
            50%       { r: 130px; opacity: 0.24; }
          }
          @keyframes fp-orbit0 { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
          @keyframes fp-orbit1 { from { transform: rotate(360deg); } to { transform: rotate(0deg);    } }
          @keyframes fp-orbit2 { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
          @keyframes fp-orbit3 { from { transform: rotate(360deg); } to { transform: rotate(0deg);    } }
          @keyframes fp-orbit4 { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
          @keyframes fp-orbit5 { from { transform: rotate(360deg); } to { transform: rotate(0deg);    } }
          @keyframes pingRing {
            0%   { transform: scale(1); opacity: 0.55; }
            100% { transform: scale(2); opacity: 0; }
          }
        `}</style>
      </defs>

      {/* Background fill */}
      <rect width="100%" height="100%" fill="url(#bgGrad)" />

      {/* Subtle grid lines */}
      {Array.from({ length: 10 }, (_, i) => (
        <line key={`v${i}`} x1={`${i * 11.1}%`} y1="0" x2={`${i * 11.1}%`} y2="100%"
          stroke="#00ff6a" strokeWidth="0.4" opacity="0.06" />
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <line key={`h${i}`} x1="0" y1={`${i * 11.1}%`} x2="100%" y2={`${i * 11.1}%`}
          stroke="#00ff6a" strokeWidth="0.4" opacity="0.06" />
      ))}

      {/* Central glowing orb */}
      <circle cx="50%" cy="50%" r="110" fill="url(#orbGrad)">
        <animate attributeName="r" values="90;130;90" dur="6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;1;0.8" dur="6s" repeatCount="indefinite" />
      </circle>
      <circle cx="50%" cy="50%" r="55" fill="rgba(0,232,122,0.14)">
        <animate attributeName="r" values="45;70;45" dur="4s" repeatCount="indefinite" />
      </circle>

      {/* Orbit rings — transform-origin set to centre via inline style on group */}
      {RINGS.map((ring, i) => (
        <g
          key={i}
          style={{
            transformOrigin: "50% 50%",
            animation: `fp-orbit${i} ${ring.dur} linear infinite ${ring.delay}`,
          }}
        >
          <ellipse
            cx={ring.cx} cy={ring.cy}
            rx={ring.rx} ry={ring.ry}
            fill="none"
            stroke={ring.color}
            strokeWidth="0.8"
            opacity={ring.opacity}
          />
          {/* travelling dot on each ring */}
          <circle r="2.2" fill={ring.color} opacity="0.9" filter="url(#glow)">
            <animateMotion dur={ring.dur} repeatCount="indefinite" begin={ring.delay}>
              <mpath xlinkHref={`#ring-path-${i}`} />
            </animateMotion>
          </circle>
          <path
            id={`ring-path-${i}`}
            d={`M 50% 50% m -${ring.rx} 0 a ${ring.rx} ${ring.ry} 0 1 1 0.001 0`}
            fill="none"
          />
        </g>
      ))}

      {/* Floating particles */}
      <g filter="url(#glow)">
        {PARTICLES.map((p) => (
          <circle
            key={p.id}
            cx={p.cx} cy={p.cy} r={p.r}
            fill="#00e87a"
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
  const [email, setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);

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
          notifyUser("success", "Reset link sent! Check your inbox and spam folder.");
        } catch (fe: unknown) {
          const f = fe as { message?: string };
          notifyUser("error", `Error: ${f.message}`);
        }
      } else {
        notifyUser("error", `Error (${err.code}): ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#000a05] flex flex-col items-center justify-center px-4 py-12 sm:px-6">

      {/* Animated SVG background */}
      <AnimatedBackground />

      {/* Vignette overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 20%, rgba(0,8,4,0.55) 65%, rgba(0,8,4,0.92) 100%)",
        }}
      />

      {/* Scan-line texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          zIndex: 1,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,120,0.12) 2px, rgba(0,255,120,0.12) 4px)",
        }}
      />

      {/* Corner ambient glows */}
      <div aria-hidden="true" className="absolute top-0 left-0 w-96 h-96 pointer-events-none"
        style={{ zIndex: 1, background: "rgba(0,135,90,0.15)", filter: "blur(130px)" }} />
      <div aria-hidden="true" className="absolute bottom-0 right-0 w-80 h-80 pointer-events-none"
        style={{ zIndex: 1, background: "rgba(0,217,126,0.1)", filter: "blur(110px)" }} />

      {/* Page content */}
      <div className="relative w-full max-w-md flex flex-col items-center" style={{ zIndex: 2 }}>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-2 mb-8"
        >
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full scale-[1.4]"
              style={{ background: "rgba(0,135,90,0.4)", filter: "blur(22px)" }}
            />
            <img
              src={logo}
              alt="EBSU MSA Logo"
              className="relative w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-2xl"
            />
          </div>
          <div className="text-center">
            <p className="text-[#00d97e] text-[10px] font-bold tracking-[0.35em] uppercase">EBSU MSA</p>
            <p className="text-white/25 text-[9px] tracking-widest uppercase mt-0.5">Student Portal</p>
          </div>
        </motion.div>

        {/* Glass card */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full rounded-3xl overflow-hidden"
          style={{
            background: "rgba(2,18,10,0.78)",
            backdropFilter: "blur(32px) saturate(180%)",
            WebkitBackdropFilter: "blur(32px) saturate(180%)",
            border: "1px solid rgba(0,215,126,0.14)",
            boxShadow: "0 0 0 1px rgba(0,215,126,0.06), 0 32px 80px rgba(0,0,0,0.7), 0 0 80px rgba(0,135,90,0.09)",
          }}
        >
          {/* Top shimmer bar */}
          <div
            className="h-[2px] w-full"
            style={{
              background: "linear-gradient(90deg, transparent, #00d97e 35%, #00ff9d 50%, #00d97e 65%, transparent)",
            }}
          />

          <div className="px-6 sm:px-8 pt-7 pb-8">

            {/* Back link */}
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-white/35 hover:text-[#00d97e] transition-colors duration-200 mb-7 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-200" />
              Back to Login
            </Link>

            <AnimatePresence mode="wait">
              {sent ? (
                /* ── Success state ── */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.45 }}
                  className="space-y-6"
                >
                  <div className="flex justify-center">
                    <div className="relative flex items-center justify-center w-20 h-20">
                      {[1, 2].map((i) => (
                        <span
                          key={i}
                          aria-hidden="true"
                          className="absolute rounded-full"
                          style={{
                            inset: `-${i * 10}px`,
                            border: "1px solid rgba(0,215,126,0.28)",
                            animation: `pingRing ${1.2 + i * 0.4}s ease-out infinite`,
                            animationDelay: `${i * 0.35}s`,
                          }}
                        />
                      ))}
                      <div
                        className="relative w-16 h-16 rounded-full flex items-center justify-center"
                        style={{
                          background: "linear-gradient(135deg, #00875a, #00d97e)",
                          boxShadow: "0 0 48px rgba(0,215,126,0.45)",
                        }}
                      >
                        <CheckCircle2 className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="text-center space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      Check your inbox!
                    </h2>
                    <p className="text-white/45 text-sm leading-relaxed">
                      Reset link sent to{" "}
                      <span className="font-semibold text-[#00d97e] break-all">{email}</span>
                    </p>
                  </div>

                  <div
                    className="rounded-2xl p-5 space-y-3"
                    style={{
                      background: "rgba(0,135,90,0.1)",
                      border: "1px solid rgba(0,215,126,0.14)",
                    }}
                  >
                    <p className="text-[10px] font-bold text-[#00d97e]/55 uppercase tracking-[0.2em]">
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
                        <p className="text-sm text-white/65 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>

                  <div
                    className="rounded-xl px-4 py-3 flex items-start gap-2.5"
                    style={{
                      background: "rgba(251,191,36,0.06)",
                      border: "1px solid rgba(251,191,36,0.16)",
                    }}
                  >
                    <span className="text-amber-400 text-sm flex-shrink-0 mt-0.5">&#9888;</span>
                    <p className="text-xs text-amber-200/65 leading-relaxed">
                      <span className="font-semibold text-amber-300">Not in inbox?</span>{" "}
                      Check your spam or junk folder. Link expires in 1 hour.
                    </p>
                  </div>

                  <button
                    onClick={() => { setSent(false); setEmail(""); }}
                    className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
                    style={{
                      background: "linear-gradient(135deg, #00875a 0%, #00d97e 100%)",
                      boxShadow: "0 8px 32px rgba(0,215,126,0.25)",
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
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-4">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          background: "rgba(0,215,126,0.11)",
                          border: "1px solid rgba(0,215,126,0.2)",
                        }}
                      >
                        <Lock className="w-4 h-4 text-[#00d97e]" />
                      </div>
                      <span className="text-[10px] font-bold text-[#00d97e] uppercase tracking-widest">
                        Secure Reset
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight tracking-tight">
                      Forgot your password?
                    </h2>
                    <p className="text-white/40 text-sm leading-relaxed">
                      Enter your registered email and we&apos;ll send a secure link straight to your inbox.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="fp-email"
                        className="block text-xs font-semibold text-white/45 uppercase tracking-wider"
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00d97e]/45 pointer-events-none" />
                        <input
                          type="email"
                          id="fp-email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          autoComplete="email"
                          className="w-full pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/20 rounded-xl outline-none transition-all duration-200"
                          style={{
                            background: "rgba(0,215,126,0.05)",
                            border: "1px solid rgba(0,215,126,0.16)",
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.border = "1px solid rgba(0,215,126,0.52)";
                            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,215,126,0.08)";
                            e.currentTarget.style.background = "rgba(0,215,126,0.08)";
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.border = "1px solid rgba(0,215,126,0.16)";
                            e.currentTarget.style.boxShadow = "none";
                            e.currentTarget.style.background = "rgba(0,215,126,0.05)";
                          }}
                        />
                      </div>
                      <p className="text-[11px] text-white/22 pl-1">
                        Use the email linked to your EBSU MSA account
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !email.trim()}
                      className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background:
                          loading || !email.trim()
                            ? "rgba(0,135,90,0.4)"
                            : "linear-gradient(135deg, #00875a 0%, #00d97e 100%)",
                        boxShadow:
                          loading || !email.trim()
                            ? "none"
                            : "0 8px 32px rgba(0,215,126,0.28)",
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
                    {["256-bit SSL", "Instant Delivery", "Secure Link"].map((label) => (
                      <span
                        key={label}
                        className="text-[10px] font-medium px-3 py-1 rounded-full"
                        style={{
                          background: "rgba(0,200,80,0.07)",
                          border: "1px solid rgba(0,200,80,0.13)",
                          color: "rgba(0,215,126,0.55)",
                        }}
                      >
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
          transition={{ delay: 0.8 }}
          className="text-center text-[10px] mt-5"
          style={{ color: "rgba(0,215,126,0.2)" }}
        >
          Crafted with passion by{" "}
          <span style={{ color: "rgba(0,215,126,0.4)" }}>Ken</span>
        </motion.p>
      </div>
    </div>
  );
}
