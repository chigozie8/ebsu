/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// Credentials will be provided by admin — leave as placeholders until updated
const UDEMY_EMAIL = "your-udemy-email@example.com";
const UDEMY_PASSWORD = "your-udemy-password";

const COURSES = [
  {
    title: "Complete Anatomy & Physiology",
    category: "Basic Sciences",
    rating: 4.8,
    students: "12,400",
    accent: "#38bdf8",
    icon: "M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5",
  },
  {
    title: "USMLE Step 1 Prep — High Yield",
    category: "Exams",
    rating: 4.9,
    students: "28,600",
    accent: "#a78bfa",
    icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z",
  },
  {
    title: "Clinical Pharmacology Made Easy",
    category: "Pharmacology",
    rating: 4.7,
    students: "9,800",
    accent: "#34d399",
    icon: "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5",
  },
  {
    title: "Medical Research & Statistics",
    category: "Research",
    rating: 4.6,
    students: "5,200",
    accent: "#fb923c",
    icon: "M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z",
  },
  {
    title: "Clinical Communication Skills",
    category: "Professional",
    rating: 4.8,
    students: "14,300",
    accent: "#f472b6",
    icon: "M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155",
  },
  {
    title: "Python for Medical Data Science",
    category: "Tech",
    rating: 4.7,
    students: "7,100",
    accent: "#60a5fa",
    icon: "M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z",
  },
];

export default function UdemyPage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState<"email" | "password" | null>(null);

  const copy = (type: "email" | "password") => {
    const text = type === "email" ? UDEMY_EMAIL : UDEMY_PASSWORD;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const openUdemy = () => {
    window.open("https://www.udemy.com/join/login-popup/", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen pb-20 pt-20" style={{ background: "linear-gradient(135deg, #0d0d14 0%, #12101e 50%, #0a1218 100%)" }}>
      <div className="max-w-2xl mx-auto px-4">

        {/* Back */}
        <button
          onClick={() => navigate("/u/premium/dashboard")}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(244,114,182,0.12)", border: "1px solid rgba(244,114,182,0.3)" }}>
              <svg className="w-6 h-6" fill="none" stroke="#f472b6" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Udemy Course Access</h1>
              <p className="text-xs text-gray-400 mt-0.5">Premium members get shared access to handpicked courses</p>
            </div>
          </div>

          {/* Telegram Alternative Channel */}
          <div className="rounded-2xl p-5 mb-6" style={{ background: "linear-gradient(135deg, rgba(0,136,204,0.1), rgba(24,143,211,0.08))", border: "1px solid rgba(0,136,204,0.25)" }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0,136,204,0.2)", border: "1px solid rgba(0,136,204,0.4)" }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{ color: "#0088cc" }}>
                  <path d="M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295-.237 0-.385-.045-.585-.156l.355-5.083.005-.047c1.664-1.482 5.206-4.693 5.206-4.693.196-.18.461-.09.456.244-.003.141-.14 1.405-1.13 7.065-.057.324-.171.487-.352.487-.14 0-.358-.08-.563-.155l-7.044-2.236c-.52-.165-.52-.385.04-.585l.27-.106c.252-.105 5.052-1.936 5.052-1.936.23-.09.455-.009.612.164l3.956 3.809c.231.22.22.385.04.618z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white mb-0.5">Free Courses on Telegram</h3>
                <p className="text-xs text-blue-200 mb-3 leading-relaxed">
                  Join our Telegram community for constantly updated free Udemy courses, exclusive study materials, and medical education resources shared daily by the EBSUMSA community.
                </p>
                <a
                  href="https://t.me/Udemy_Free_Courses4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #0088cc, #188fd3)", color: "#fff", boxShadow: "0 4px 15px rgba(0,136,204,0.3)" }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295-.237 0-.385-.045-.585-.156l.355-5.083.005-.047c1.664-1.482 5.206-4.693 5.206-4.693.196-.18.461-.09.456.244-.003.141-.14 1.405-1.13 7.065-.057.324-.171.487-.352.487-.14 0-.358-.08-.563-.155l-7.044-2.236c-.52-.165-.52-.385.04-.585l.27-.106c.252-.105 5.052-1.936 5.052-1.936.23-.09.455-.009.612.164l3.956 3.809c.231.22.22.385.04.618z"/>
                  </svg>
                  Join Telegram Channel
                </a>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)" }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)" }}>
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0zM8 9a1 1 0 100-2 1 1 0 000 2zm5 0a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-emerald-300 mb-2">Access Your Learning Resources</h3>
                <ul className="text-xs text-gray-300 space-y-1.5 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span><strong>Udemy Shared Account:</strong> Login with shared credentials above to access premium courses including anatomy, pharmacology, USMLE prep, and more.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span><strong>Telegram Channel:</strong> Get daily updates on newly free Udemy courses and exclusive study materials curated for EBSU medical students.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span><strong>Pro Tip:</strong> When you find a free course on Telegram, enroll immediately as free coupons expire quickly. Save your certificates to your profile.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span><strong>Study Groups:</strong> Discuss courses and study together with fellow EBSUMSA members in the community section.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Credentials card */}
          <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(244,114,182,0.06)", border: "1px solid rgba(244,114,182,0.2)" }}>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <h2 className="text-sm font-bold text-pink-300">Shared Login Credentials</h2>
            </div>

            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Use these credentials to log in to Udemy. Please do not change the password or account settings to keep access available for all premium members.
            </p>

            {/* Email */}
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div>
                  <p className="text-xss text-gray-500 mb-0.5 font-medium uppercase tracking-wider">Email</p>
                  <p className="text-sm text-white font-mono">{UDEMY_EMAIL}</p>
                </div>
                <button
                  onClick={() => copy("email")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
                  style={{ background: copied === "email" ? "rgba(52,211,153,0.2)" : "rgba(244,114,182,0.15)", color: copied === "email" ? "#34d399" : "#f472b6", border: `1px solid ${copied === "email" ? "rgba(52,211,153,0.3)" : "rgba(244,114,182,0.3)"}` }}
                >
                  {copied === "email" ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* Password */}
              <div className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div>
                  <p className="text-xss text-gray-500 mb-0.5 font-medium uppercase tracking-wider">Password</p>
                  <p className="text-sm text-white font-mono">{"•".repeat(UDEMY_PASSWORD.length)}</p>
                </div>
                <button
                  onClick={() => copy("password")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
                  style={{ background: copied === "password" ? "rgba(52,211,153,0.2)" : "rgba(244,114,182,0.15)", color: copied === "password" ? "#34d399" : "#f472b6", border: `1px solid ${copied === "password" ? "rgba(52,211,153,0.3)" : "rgba(244,114,182,0.3)"}` }}
                >
                  {copied === "password" ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Open Udemy CTA */}
            <button
              onClick={openUdemy}
              className="w-full mt-4 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #a435f0, #7c3aed)", color: "#fff", boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open Udemy Login Page
            </button>
          </div>

          {/* Notice */}
          <div className="rounded-xl px-4 py-3 mb-8 flex items-start gap-2.5"
            style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }}>
            <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-amber-300 text-xs leading-relaxed">
              <span className="font-bold">Important:</span> Do not change the Udemy account password, purchase courses, or modify account settings. This account is shared across all premium members.
            </p>
          </div>

          {/* Recommended courses */}
          <h2 className="text-base font-bold text-white mb-4">Recommended Courses for MBBS Students</h2>
          <div className="space-y-3">
            {COURSES.map((c, i) => (
              <motion.div key={c.title}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.35 }}
                className="flex items-center gap-4 rounded-xl p-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${c.accent}18`, border: `1px solid ${c.accent}30` }}>
                  <svg className="w-4.5 h-4.5" fill="none" stroke={c.accent} viewBox="0 0 24 24" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={c.icon} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xss px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${c.accent}18`, color: c.accent }}>
                      {c.category}
                    </span>
                    <span className="text-xss text-gray-500">⭐ {c.rating} · {c.students} students</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
