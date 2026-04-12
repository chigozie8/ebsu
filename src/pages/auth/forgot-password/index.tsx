import logo from "../../../assets/logo/logo.png";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../config/firebase";
import { Link } from "react-router-dom";
import { Spinner } from "../../../components/loaders/Spinner";
import { notifyUser } from "../../../helpers/notifyUser";
import { Mail, ArrowRight, CheckCircle2, ArrowLeft, ShieldCheck } from "lucide-react";

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
      notifyUser("success", "Reset link sent! Check your inbox — also check your spam/junk folder.");
    } catch (error: any) {
      if (error.code === "auth/user-not-found" || error.code === "auth/invalid-email") {
        notifyUser("error", "No account found with that email address.");
      } else if (error.code === "auth/unauthorized-continue-uri" || error.code === "auth/invalid-continue-uri") {
        try {
          await sendPasswordResetEmail(auth, email.trim());
          setSent(true);
          notifyUser("success", "Reset link sent! Check your inbox — also check your spam/junk folder.");
        } catch (fallbackErr: any) {
          notifyUser("error", `Error: ${fallbackErr.message}`);
        }
      } else {
        notifyUser("error", `Error (${error.code}): ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel — Brand Side */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-[45%] bg-green1 flex-col items-center justify-center p-12 overflow-hidden">
        {/* Decorative rings */}
        <div className="absolute top-[-80px] left-[-80px] w-[340px] h-[340px] rounded-full border border-white/10" />
        <div className="absolute top-[-40px] left-[-40px] w-[240px] h-[240px] rounded-full border border-white/10" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full border border-white/10" />
        <div className="absolute bottom-[-60px] right-[-60px] w-[280px] h-[280px] rounded-full border border-white/10" />
        {/* Dot grid accent */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center gap-8 max-w-sm">
          <img src={logo} alt="EBSU MSA Logo" className="w-24 h-24 object-contain drop-shadow-xl" />

          <div className="space-y-3">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
              Forgot your password?
            </h1>
            <p className="text-white/75 text-base leading-relaxed">
              No worries — it happens to everyone. Enter your email and we&apos;ll send you a secure reset link in seconds.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-col gap-3 w-full mt-2">
            {[
              { icon: <ShieldCheck className="w-4 h-4" />, text: "Bank-level encryption" },
              { icon: <Mail className="w-4 h-4" />, text: "Instant email delivery" },
              { icon: <CheckCircle2 className="w-4 h-4" />, text: "Reset in under 2 minutes" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium backdrop-blur-sm">
                <span className="flex-shrink-0 text-white/80">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>

          <p className="text-white/40 text-xs mt-4">EBSU MSA Student Portal &mdash; Secure Authentication</p>
        </div>
      </div>

      {/* Right Panel — Form Side */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen px-4 pt-16 pb-10 sm:px-8 bg-white">
        {/* Mobile Logo */}
        <div className="flex lg:hidden flex-col items-center mb-8">
          <img src={logo} alt="EBSU MSA Logo" className="w-16 h-16 object-contain mb-3" />
          <span className="text-sm font-semibold text-green1 tracking-wide uppercase">EBSU MSA</span>
        </div>

        <div className="w-full max-w-[440px]">
          {/* Back link */}
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-green1 transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>

          {sent ? (
            /* ── Success State ── */
            <div className="space-y-6">
              {/* Success badge */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-green1/10 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-green1/20 flex items-center justify-center">
                      <CheckCircle2 className="w-9 h-9 text-green1" />
                    </div>
                  </div>
                  {/* Pulse ring */}
                  <span className="absolute inset-0 rounded-full border-2 border-green1/30 animate-ping" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Check your inbox</h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  We&apos;ve sent a password reset link to{" "}
                  <span className="font-bold text-green1 break-all">{email}</span>
                </p>
              </div>

              {/* Steps */}
              <div className="bg-gray-50 rounded-2xl p-5 space-y-4 border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">What to do next</p>
                {[
                  "Open the email from EBSU MSA",
                  "Click the \"Reset Password\" link",
                  "Create a strong new password",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green1 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2.5">
                <span className="text-amber-500 text-base mt-0.5">&#9888;</span>
                <p className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-semibold">Don&apos;t see it?</span> Check your spam or junk folder. The link expires in 1 hour.
                </p>
              </div>

              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="w-full py-3.5 px-4 rounded-xl bg-green1 text-white font-semibold text-sm hover:bg-[#006644] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-green1/20"
              >
                Try a different email
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* ── Form State ── */
            <div className="space-y-7">
              <div className="space-y-2">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
                  Reset your password
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Enter the email address linked to your EBSU MSA account and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email field */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-800">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green1 focus:ring-4 focus:ring-green1/10 focus:outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm bg-white"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-400">Use the email address linked to your student account</p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-3.5 px-4 rounded-xl bg-green1 text-white font-semibold text-sm hover:bg-[#006644] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-green1/20"
                >
                  {loading ? (
                    <>
                      <Spinner className="w-4 h-4 text-transparent animate-spin fill-white" />
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

              {/* Security note */}
              <div className="flex items-start gap-3 rounded-xl border border-green1/20 bg-green1/5 px-4 py-3.5">
                <ShieldCheck className="w-4 h-4 text-green1 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-green1">Secure Reset</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Reset links expire in 1 hour. Never share your reset link with anyone.
                  </p>
                </div>
              </div>

              {/* Divider + sign up */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 font-medium">or</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <p className="text-center text-sm text-gray-500">
                New student?{" "}
                <a href="/signup" className="font-semibold text-green1 hover:text-[#006644] transition-colors">
                  Create an account
                </a>
              </p>
            </div>
          )}

          {/* Footer credit */}
          <div className="mt-10 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Crafted with care by{" "}
              <span className="font-bold text-green1">Ken</span> — EBSUMSA Lead Developer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
