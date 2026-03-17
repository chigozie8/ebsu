/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useGetUserInfo } from "../../../hooks/auth/useGetUserInfo";
import { notifyUser } from "../../../helpers/notifyUser";

const ID_CARD_FEE = 2000;
const PAYSTACK_KEY =
  import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ||
  "pk_live_77ab98bc87c205ec76cb2f7d534cff02df034c8e";

const BENEFITS = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
      </svg>
    ),
    title: "Official EBSUMSA ID",
    desc: "Certified student identification card",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Campus Access",
    desc: "Access EBSUMSA events and facilities",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    title: "Member Recognition",
    desc: "Officially recognised EBSUMSA member",
  },
];

export default function IDCardPayment() {
  const navigate = useNavigate();
  const { studentDetails } = useGetUserInfo();
  const userEmail = studentDetails?.email || "";
  const userName = `${studentDetails?.firstName || ""} ${studentDetails?.lastName || ""}`.trim();
  const [paying, setPaying] = useState(false);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(n);

  const handlePaystack = () => {
    if (!userEmail) {
      notifyUser("error", "Please log in to proceed with payment.");
      return;
    }
    if (!(window as any).PaystackPop) {
      notifyUser("error", "Paystack is not loaded. Please refresh and try again.");
      return;
    }
    setPaying(true);
    const ref = `ebsu_idcard_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    (window as any).PaystackPop.setup({
      key: PAYSTACK_KEY,
      email: userEmail,
      amount: ID_CARD_FEE * 100,
      ref,
      currency: "NGN",
      metadata: {
        custom_fields: [
          { display_name: "Name", variable_name: "name", value: userName },
          { display_name: "Purpose", variable_name: "purpose", value: "EBSUMSA ID Card Registration" },
        ],
      },
      callback: (response: any) => {
        setPaying(false);
        const reference = response?.reference || ref;
        notifyUser("success", "Payment successful! Proceeding to registration...");
        setTimeout(() => {
          navigate("/u/id-card", {
            state: {
              paymentVerified: true,
              payerName: userName,
              paystackReference: reference,
              amountPaid: ID_CARD_FEE,
            },
          });
        }, 800);
      },
      onClose: () => {
        setPaying(false);
      },
    }).openIframe();
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] pt-[80px] ss:pt-[90px] sm:pt-[105px] pb-16">
      <div className="max-w-lg mx-auto px-4">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#00875a] text-white flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0">1</div>
            <span className="text-sm font-bold text-gray-900">Payment</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 rounded-full mx-1" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 bg-white text-gray-400 flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
            <span className="text-sm text-gray-400">Registration</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
        >
          {/* Green header */}
          <div className="relative bg-[#00875a] px-7 py-8 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -bottom-14 -left-10 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />

            <div className="relative flex items-center gap-5 mb-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
                </svg>
              </div>
              <div>
                <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-0.5">One-time fee</p>
                <p className="text-white text-4xl font-black leading-none tracking-tight">{fmt(ID_CARD_FEE)}</p>
              </div>
            </div>
            <h1 className="text-white text-lg font-bold relative mb-1">EBSUMSA Student ID Card</h1>
            <p className="text-white/60 text-sm relative text-pretty leading-relaxed">
              Secure your official EBSUMSA ID card with a one-time Paystack payment.
            </p>
          </div>

          {/* Benefits */}
          <div className="px-7 py-5 border-b border-gray-100">
            <p className="text-xss font-semibold text-gray-400 uppercase tracking-widest mb-4">What you get</p>
            <div className="space-y-3.5">
              {BENEFITS.map((b) => (
                <div key={b.title} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00875a]/8 flex items-center justify-center flex-shrink-0 text-[#00875a]">
                    {b.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{b.title}</p>
                    <p className="text-xs text-gray-400">{b.desc}</p>
                  </div>
                  <svg className="w-4 h-4 text-[#00875a] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ))}
            </div>
          </div>

          {/* Paying as */}
          {userEmail && (
            <div className="px-7 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#00875a]/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[#00875a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xss text-gray-400 font-medium">Paying as</p>
                <p className="text-xs font-semibold text-gray-800 truncate">{userEmail}</p>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="px-7 py-7">
            <button
              onClick={handlePaystack}
              disabled={paying || !userEmail}
              className="w-full bg-[#00875a] hover:bg-[#006e49] active:scale-[0.98] disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 text-sm shadow-sm hover:shadow-md"
            >
              {paying ? (
                <>
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Opening Paystack...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.693 0H3.307C1.481 0 0 1.481 0 3.307v17.386C0 22.519 1.481 24 3.307 24h17.386C22.519 24 24 22.519 24 20.693V3.307C24 1.481 22.519 0 20.693 0zm-1.76 9.358h-2.595c-.828 0-1.5.672-1.5 1.5v3.784c0 .828.672 1.5 1.5 1.5h2.596v2.117h-2.596c-1.993 0-3.617-1.624-3.617-3.617V10.858c0-1.993 1.624-3.617 3.617-3.617h2.596v2.117zm-8.618 0H7.721c-.828 0-1.5.672-1.5 1.5v3.784c0 .828.672 1.5 1.5 1.5h2.595v2.117H7.721c-1.993 0-3.617-1.624-3.617-3.617V10.858c0-1.993 1.624-3.617 3.617-3.617h2.595v2.117z" />
                  </svg>
                  Pay {fmt(ID_CARD_FEE)} with Paystack
                </>
              )}
            </button>

            {!userEmail && (
              <p className="text-center text-xs text-red-500 mt-3">Please log in to proceed.</p>
            )}

            <div className="flex items-center justify-center gap-1.5 mt-4">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-xs text-gray-400">Secured by Paystack — 256-bit SSL</p>
            </div>
          </div>
        </motion.div>

        {/* Help */}
        <div className="mt-4 flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-[#00875a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700">Need help?</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Contact the ID card officer:{" "}
              <a href="tel:07025336321" className="font-bold text-[#00875a] hover:underline underline-offset-2">
                07025336321
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
