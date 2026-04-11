import logo from "../../../assets/logo/logo.png";
import { useState, useRef, useMemo } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../config/firebase";
import { Link } from "react-router-dom";
import { notifyUser } from "../../../helpers/notifyUser";
import {
  Mail,
  ArrowRight,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

// ─── Floating Particle Cloud ─────────────────────────────────────────────────
function ParticleField() {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const count = 1600;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 22;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 22;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.rotation.y = t * 0.035;
    ref.current.rotation.x = Math.sin(t * 0.018) * 0.12;
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#00ff88"
        size={0.032}
        sizeAttenuation
        depthWrite={false}
        opacity={0.5}
      />
    </Points>
  );
}

// ─── Helix Ring ───────────────────────────────────────────────────────────────
function HelixRing({ index }: { index: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const speed = 0.28 + index * 0.07;
  const radius = 1.5 + index * 0.25;

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.rotation.x = t * speed * 0.38;
    ref.current.rotation.y = t * speed * 0.55;
    ref.current.rotation.z = t * speed * 0.18;
  });

  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, 0.016, 16, 120]} />
      <meshStandardMaterial
        color="#00d97e"
        emissive="#00875a"
        emissiveIntensity={0.65}
        metalness={0.92}
        roughness={0.08}
        transparent
        opacity={Math.max(0.12, 0.55 - index * 0.07)}
      />
    </mesh>
  );
}

// ─── Central Distorted Orb ────────────────────────────────────────────────────
function CentralOrb() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.rotation.y = t * 0.22;
    ref.current.rotation.z = t * 0.13;
  });

  return (
    <Float speed={1.8} rotationIntensity={0.35} floatIntensity={0.7}>
      <mesh ref={ref} scale={1.05}>
        <sphereGeometry args={[0.88, 64, 64]} />
        <MeshDistortMaterial
          color="#008a5e"
          emissive="#003d28"
          emissiveIntensity={0.45}
          metalness={0.95}
          roughness={0.05}
          distort={0.32}
          speed={2.2}
          transparent
          opacity={0.85}
        />
      </mesh>
    </Float>
  );
}

// ─── Floating Octahedron Node ─────────────────────────────────────────────────
function FloatingNode({
  position,
  size,
  speed,
}: {
  position: [number, number, number];
  size: number;
  speed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime() * speed;
    ref.current.rotation.x = t * 0.48;
    ref.current.rotation.y = t * 0.65;
    ref.current.position.y = position[1] + Math.sin(t * 0.55) * 0.38;
  });

  return (
    <mesh ref={ref} position={position}>
      <octahedronGeometry args={[size, 0]} />
      <meshStandardMaterial
        color="#00c97a"
        emissive="#00875a"
        emissiveIntensity={0.55}
        metalness={0.8}
        roughness={0.15}
        wireframe
      />
    </mesh>
  );
}

// ─── Full 3D Scene ────────────────────────────────────────────────────────────
const NODES: { position: [number, number, number]; size: number; speed: number }[] = [
  { position: [-4.5, 2.5, -2], size: 0.28, speed: 0.6 },
  { position: [4.2, -2.0, -1], size: 0.22, speed: 0.8 },
  { position: [-3.5, -3.0, -3], size: 0.18, speed: 1.0 },
  { position: [3.8, 3.5, -2], size: 0.25, speed: 0.7 },
  { position: [0.5, -4.5, -1], size: 0.15, speed: 1.2 },
  { position: [-5.0, 0.5, -2], size: 0.20, speed: 0.9 },
];

function Scene3D() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight position={[5, 5, 5]} color="#00ff99" intensity={2.5} />
      <pointLight position={[-5, -5, -5]} color="#0066ff" intensity={1.0} />
      <spotLight
        position={[0, 8, 2]}
        color="#00d97e"
        intensity={3.5}
        angle={0.4}
        penumbra={0.85}
      />

      <ParticleField />
      <CentralOrb />

      {[0, 1, 2, 3, 4, 5].map((i) => (
        <HelixRing key={i} index={i} />
      ))}

      {NODES.map((node, i) => (
        <FloatingNode key={i} {...node} />
      ))}
    </>
  );
}

// ─── Inline SVG Spinner ───────────────────────────────────────────────────────
function SpinnerIcon() {
  return (
    <svg
      aria-hidden="true"
      className="w-4 h-4 animate-spin text-transparent fill-white"
      viewBox="0 0 100 101"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 50.5908 9.08144 50.5908Z"
        fill="currentColor"
      />
      <path
        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
        fill="currentFill"
      />
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/invalid-email"
      ) {
        notifyUser("error", "No account found with that email address.");
      } else if (
        err.code === "auth/unauthorized-continue-uri" ||
        err.code === "auth/invalid-continue-uri"
      ) {
        try {
          await sendPasswordResetEmail(auth, email.trim());
          setSent(true);
          notifyUser("success", "Reset link sent! Check your inbox and spam folder.");
        } catch (fallbackErr: unknown) {
          const fe = fallbackErr as { message?: string };
          notifyUser("error", `Error: ${fe.message}`);
        }
      } else {
        notifyUser("error", `Error (${err.code}): ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#020d07]">

      {/* Full-screen 3D Canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 60 }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 1.5]}
        >
          <Scene3D />
        </Canvas>
      </div>

      {/* Radial vignette */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 15%, rgba(2,13,7,0.5) 65%, rgba(2,13,7,0.93) 100%)",
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,215,126,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,215,126,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Corner glows */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full pointer-events-none z-[1]"
        style={{ background: "rgba(0,135,90,0.18)", filter: "blur(120px)" }} />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none z-[1]"
        style={{ background: "rgba(0,217,126,0.12)", filter: "blur(100px)" }} />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:px-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full scale-125"
              style={{ background: "rgba(0,135,90,0.38)", filter: "blur(20px)" }}
            />
            <img
              src={logo}
              alt="EBSU MSA Logo"
              className="relative w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-2xl"
            />
          </div>
          <div className="text-center">
            <p className="text-[#00d97e] text-xs font-bold tracking-[0.3em] uppercase">
              EBSU MSA
            </p>
            <p className="text-white/30 text-[10px] tracking-widest uppercase mt-0.5">
              Student Portal
            </p>
          </div>
        </div>

        {/* Glass Card */}
        <div
          className="w-full max-w-md"
          style={{
            background: "rgba(4, 22, 12, 0.75)",
            backdropFilter: "blur(36px) saturate(180%)",
            WebkitBackdropFilter: "blur(36px) saturate(180%)",
            border: "1px solid rgba(0,215,126,0.16)",
            borderRadius: "24px",
            boxShadow:
              "0 0 0 1px rgba(0,215,126,0.07), 0 32px 64px rgba(0,0,0,0.65), 0 0 80px rgba(0,135,90,0.1)",
          }}
        >
          {/* Top accent bar */}
          <div
            className="h-[2px] w-full rounded-t-[24px]"
            style={{
              background:
                "linear-gradient(90deg, transparent, #00d97e 40%, #00875a 60%, transparent)",
            }}
          />

          <div className="px-6 sm:px-8 pt-7 pb-8">

            {/* Back link */}
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/40 hover:text-[#00d97e] transition-colors duration-200 mb-7 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-200" />
              Back to Login
            </Link>

            {sent ? (
              /* Success State */
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="relative flex items-center justify-center w-20 h-20">
                    <span
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{ background: "rgba(0,215,126,0.15)", animationDuration: "1.5s" }}
                    />
                    <span
                      className="absolute inset-2 rounded-full animate-ping"
                      style={{
                        background: "rgba(0,215,126,0.1)",
                        animationDuration: "2s",
                        animationDelay: "0.3s",
                      }}
                    />
                    <div
                      className="relative w-16 h-16 rounded-full flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, #00875a, #00d97e)",
                        boxShadow: "0 0 40px rgba(0,215,126,0.5)",
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
                  <p className="text-white/50 text-sm leading-relaxed">
                    Reset link sent to{" "}
                    <span className="font-semibold text-[#00d97e] break-all">{email}</span>
                  </p>
                </div>

                <div
                  className="rounded-2xl p-5 space-y-4"
                  style={{
                    background: "rgba(0,135,90,0.12)",
                    border: "1px solid rgba(0,215,126,0.15)",
                  }}
                >
                  <p className="text-[10px] font-bold text-[#00d97e]/60 uppercase tracking-[0.2em]">
                    What to do next
                  </p>
                  {[
                    "Open the email from EBSU MSA",
                    'Click the "Reset Password" link',
                    "Create a strong new password",
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center mt-0.5 text-white"
                        style={{ background: "linear-gradient(135deg, #00875a, #00d97e)" }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-sm text-white/70 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>

                <div
                  className="rounded-xl px-4 py-3 flex items-start gap-2.5"
                  style={{
                    background: "rgba(251,191,36,0.07)",
                    border: "1px solid rgba(251,191,36,0.18)",
                  }}
                >
                  <span className="text-amber-400 text-sm mt-0.5 flex-shrink-0">&#9888;</span>
                  <p className="text-xs text-amber-200/70 leading-relaxed">
                    <span className="font-semibold text-amber-300">Don&apos;t see it?</span>{" "}
                    Check your spam or junk folder. Link expires in 1 hour.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                  className="w-full py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #00875a, #00d97e)",
                    boxShadow: "0 8px 32px rgba(0,215,126,0.28)",
                  }}
                >
                  Try a different email
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Form State */
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        background: "rgba(0,215,126,0.13)",
                        border: "1px solid rgba(0,215,126,0.22)",
                      }}
                    >
                      <Lock className="w-4 h-4 text-[#00d97e]" />
                    </div>
                    <span className="text-xs font-semibold text-[#00d97e] uppercase tracking-widest">
                      Secure Reset
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight tracking-tight">
                    Forgot your password?
                  </h2>
                  <p className="text-white/45 text-sm leading-relaxed">
                    No worries. Enter your email and we&apos;ll send a secure reset link straight to your inbox.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold text-white/50 uppercase tracking-wider"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00d97e]/50 pointer-events-none" />
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/20 rounded-xl outline-none transition-all duration-200"
                        style={{
                          background: "rgba(0,215,126,0.06)",
                          border: "1px solid rgba(0,215,126,0.18)",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.border = "1px solid rgba(0,215,126,0.55)";
                          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,215,126,0.09)";
                          e.currentTarget.style.background = "rgba(0,215,126,0.09)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.border = "1px solid rgba(0,215,126,0.18)";
                          e.currentTarget.style.boxShadow = "none";
                          e.currentTarget.style.background = "rgba(0,215,126,0.06)";
                        }}
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                      />
                    </div>
                    <p className="text-[11px] text-white/25 pl-1">
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
                          ? "rgba(0,135,90,0.45)"
                          : "linear-gradient(135deg, #00875a 0%, #00d97e 100%)",
                      boxShadow:
                        loading || !email.trim()
                          ? "none"
                          : "0 8px 32px rgba(0,215,126,0.32), 0 2px 8px rgba(0,0,0,0.4)",
                    }}
                  >
                    {loading ? (
                      <>
                        <SpinnerIcon />
                        Sending reset link...
                      </>
                    ) : (
                      <>
                        Send Reset Link
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div
                  className="flex items-start gap-3 rounded-xl px-4 py-3.5"
                  style={{
                    background: "rgba(0,135,90,0.09)",
                    border: "1px solid rgba(0,215,126,0.13)",
                  }}
                >
                  <ShieldCheck className="w-4 h-4 text-[#00d97e] flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#00d97e]">End-to-end encrypted</p>
                    <p className="text-xs text-white/35 leading-relaxed">
                      Reset links expire in 1 hour. Never share your link with anyone.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <span className="text-[11px] text-white/22 font-medium">or</span>
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                </div>

                <p className="text-center text-sm text-white/32">
                  New student?{" "}
                  <a
                    href="/signup"
                    className="font-semibold text-[#00d97e] hover:text-white transition-colors duration-200"
                  >
                    Create an account
                  </a>
                </p>
              </div>
            )}

            {/* Footer credit */}
            <div
              className="mt-8 pt-5 text-center"
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
            >
              <p className="text-[11px] text-white/20">
                Crafted with passion by{" "}
                <span className="font-bold" style={{ color: "#00d97e" }}>
                  Ken
                </span>{" "}
                &mdash; EBSUMSA Lead Developer
              </p>
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="mt-6 text-[11px] text-white/15 text-center tracking-widest uppercase">
          EBSU MSA &mdash; Secure Student Portal &mdash; 2025
        </p>
      </div>
    </div>
  );
}
