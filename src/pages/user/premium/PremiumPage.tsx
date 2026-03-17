/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useGetUserInfo } from "../../../hooks/auth/useGetUserInfo";
import { useWallet } from "../../../hooks/wallet/useWallet";
import { db } from "../../../config/firebase";
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { notifyUser } from "../../../helpers/notifyUser";
import { Spinner } from "../../../components/loaders/Spinner";

const PREMIUM_PRICE = 100; // ₦100
const PAYSTACK_KEY =
  import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ||
  "pk_live_77ab98bc87c205ec76cb2f7d534cff02df034c8e";

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "AI Note Taker",
    desc: "Auto-generate structured notes from lectures, PDFs, and study sessions using AI.",
    color: "from-cyan-500/20 to-blue-500/10",
    border: "border-cyan-500/30",
    iconColor: "text-cyan-400",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "AI Summarizer",
    desc: "Condense lengthy textbooks, journals, and lecture notes into digestible summaries instantly.",
    color: "from-violet-500/20 to-purple-500/10",
    border: "border-violet-500/30",
    iconColor: "text-violet-400",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: "Academic Mentorship",
    desc: "Get paired with senior students and medical professionals for personalized academic guidance.",
    color: "from-green-500/20 to-emerald-500/10",
    border: "border-green-500/30",
    iconColor: "text-green-400",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: "Skills Acquisition",
    desc: "Access curated skill programmes — communication, leadership, clinical procedures, and more.",
    color: "from-orange-500/20 to-amber-500/10",
    border: "border-orange-500/30",
    iconColor: "text-orange-400",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    title: "Tech Skills Acquisition",
    desc: "Learn in-demand tech skills: web development, data science, AI/ML, and digital health tools.",
    color: "from-blue-500/20 to-indigo-500/10",
    border: "border-blue-500/30",
    iconColor: "text-blue-400",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: "Udemy Courses Access",
    desc: "Get discounted or free access to curated Udemy courses in medicine, science, and technology.",
    color: "from-rose-500/20 to-pink-500/10",
    border: "border-rose-500/30",
    iconColor: "text-rose-400",
  },
];

export default function PremiumPage() {
  const { studentDetails } = useGetUserInfo();
  const userID = studentDetails?.userID || "";
  const userEmail = studentDetails?.email || "";
  const userName = `${studentDetails?.firstName || ""} ${studentDetails?.lastName || ""}`.trim();

  const { balance, payWithWallet } = useWallet(userID, userEmail);

  const [isPremium, setIsPremium] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "wallet">("paystack");
  const [paying, setPaying] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!userID) return;
    const unsub = onSnapshot(doc(db, "premiumUsers", userID), (snap) => {
      setIsPremium(snap.exists() && snap.data()?.active === true);
      setCheckingStatus(false);
    });
    return () => unsub();
  }, [userID]);

  const grantPremium = async (reference: string) => {
    if (!userID) return;
    await setDoc(doc(db, "premiumUsers", userID), {
      userID,
      email: userEmail,
      name: userName,
      active: true,
      paidAt: serverTimestamp(),
      reference,
      amount: PREMIUM_PRICE,
    });
    // Log transaction
    await addDoc(collection(db, "transactions"), {
      userID,
      type: "payment",
      amount: PREMIUM_PRICE,
      description: "EBSUMSA Premium Package Unlock",
      reference,
      status: "success",
      createdAt: serverTimestamp(),
    });
    notifyUser("success", "Premium unlocked! Welcome to EBSUMSA Premium.");
  };

  const handlePaystack = () => {
    if (!(window as any).PaystackPop) {
      notifyUser("error", "Paystack is not loaded. Please refresh and try again.");
      return;
    }
    const handler = (window as any).PaystackPop.setup({
      key: PAYSTACK_KEY,
      email: userEmail,
      amount: PREMIUM_PRICE * 100, // kobo
      ref: `ebsu_premium_${Date.now()}`,
      metadata: { custom_fields: [{ display_name: "Name", variable_name: "name", value: userName }] },
      callback: async (response: any) => {
        setPaying(true);
        try {
          await grantPremium(response?.reference || `ref_${Date.now()}`);
        } finally {
          setPaying(false);
        }
      },
      onClose: () => {},
    });
    handler.openIframe();
  };

  const handleWalletPay = async () => {
    if (balance < PREMIUM_PRICE) {
      notifyUser("error", `Insufficient balance. You need ₦${PREMIUM_PRICE} in your wallet.`);
      return;
    }
    setPaying(true);
    try {
      const ref = `ebsu_premium_wallet_${Date.now()}`;
      await payWithWallet(PREMIUM_PRICE, "EBSUMSA Premium Package Unlock", ref);
      await grantPremium(ref);
    } catch {
      notifyUser("error", "Payment failed. Please try again.");
    } finally {
      setPaying(false);
      setShowConfirm(false);
    }
  };

  const formatNaira = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(n);

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d1117" }}>
        <Spinner className="w-8 h-8 text-yellow-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16" style={{ background: "linear-gradient(160deg, #0d1117 0%, #0f1b2d 50%, #0d1117 100%)" }}>
      <div className="max-w-3xl mx-auto px-4">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center pt-8 pb-10"
        >
          {/* Crown */}
          <div className="relative inline-flex items-center justify-center w-20 h-20 mb-5">
            <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-xl" />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400/20 to-amber-600/20 border border-yellow-500/40 flex items-center justify-center">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                <path d="M2 17l2-9 4.5 4L12 4l3.5 8L20 8l2 9H2z" fill="url(#crownGold)" stroke="#f59e0b" strokeWidth="1.2" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="crownGold" x1="2" y1="4" x2="22" y2="17" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 text-balance">
            EBSUMSA{" "}
            <span className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Premium
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto text-balance leading-relaxed">
            Unlock an elevated academic experience with exclusive tools, mentorship, and resources designed for EBSU medical students.
          </p>

          {/* Price badge */}
          <div className="inline-flex items-baseline gap-1 mt-5 bg-white/5 border border-yellow-500/30 rounded-2xl px-5 py-2.5">
            <span className="text-3xl font-bold text-white">₦{PREMIUM_PRICE}</span>
            <span className="text-gray-400 text-sm">one-time</span>
          </div>
        </motion.div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8"
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className={`relative rounded-2xl p-4 border bg-gradient-to-br ${f.color} ${f.border} overflow-hidden`}
            >
              {/* Subtle locked overlay */}
              {!isPremium && (
                <div className="absolute top-3 right-3">
                  <svg className="w-3.5 h-3.5 text-white/30" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <div className={`mb-2.5 ${f.iconColor}`}>{f.icon}</div>
              <h3 className="text-white font-bold text-sm mb-1">{f.title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Payment / Unlocked section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl border border-yellow-500/20 bg-white/5 p-6 mb-8"
        >
          {isPremium ? (
            /* Already premium */
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-yellow-400/20 border border-yellow-500/40 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg mb-1">You are a Premium Member</h3>
              <p className="text-gray-400 text-sm">All premium features are unlocked and available to you. Enjoy your access.</p>
            </div>
          ) : (
            <>
              <h3 className="text-white font-bold text-base mb-1">Unlock Premium</h3>
              <p className="text-gray-400 text-xs mb-5">Choose how you would like to pay the one-time fee of <span className="text-yellow-400 font-semibold">₦{PREMIUM_PRICE}</span>.</p>

              {/* Payment method toggle */}
              <div className="flex gap-2 mb-5">
                {(["paystack", "wallet"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      paymentMethod === m
                        ? "bg-yellow-500/20 border-yellow-500/60 text-yellow-300"
                        : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                    }`}
                  >
                    {m === "paystack" ? "Pay with Paystack" : `Wallet (${formatNaira(balance)})`}
                  </button>
                ))}
              </div>

              {paymentMethod === "wallet" && balance < PREMIUM_PRICE && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2.5 mb-4">
                  <p className="text-rose-400 text-xs font-medium">Insufficient wallet balance. Please fund your wallet or pay via Paystack.</p>
                </div>
              )}

              <button
                onClick={() => {
                  if (paymentMethod === "paystack") handlePaystack();
                  else setShowConfirm(true);
                }}
                disabled={paying || (paymentMethod === "wallet" && balance < PREMIUM_PRICE)}
                className="w-full py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#1a1a1a" }}
              >
                {paying ? (
                  <Spinner className="w-5 h-5 text-amber-900" />
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 016 0v2h2V7a5 5 0 00-5-5z" />
                    </svg>
                    Unlock Premium — ₦{PREMIUM_PRICE}
                  </>
                )}
              </button>
            </>
          )}
        </motion.div>
      </div>

      {/* Wallet payment confirm modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl p-6 border border-yellow-500/20"
              style={{ background: "#0f1b2d" }}
            >
              <h3 className="text-white font-bold text-base mb-2">Confirm Wallet Payment</h3>
              <p className="text-gray-400 text-sm mb-1">
                <span className="text-yellow-400 font-semibold">₦{PREMIUM_PRICE}</span> will be deducted from your wallet balance.
              </p>
              <p className="text-gray-500 text-xs mb-5">Current balance: {formatNaira(balance)}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 border border-white/10 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWalletPay}
                  disabled={paying}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#1a1a1a" }}
                >
                  {paying ? <Spinner className="w-4 h-4" /> : "Confirm Payment"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
