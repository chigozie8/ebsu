/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useGetUserInfo } from "../../../hooks/auth/useGetUserInfo";
import { notifyUser } from "../../../helpers/notifyUser";
import { Spinner } from "../../../components/loaders/Spinner";
import { db } from "../../../config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Remita configuration - these should be set via environment variables
const REMITA_MERCHANT_ID = import.meta.env.VITE_REMITA_MERCHANT_ID || "2547916";
const REMITA_API_KEY = import.meta.env.VITE_REMITA_API_KEY || "1946";
const REMITA_SERVICE_TYPE_ID = import.meta.env.VITE_REMITA_SERVICE_TYPE_ID || "4430731";

// Helper to check if Remita SDK is loaded
const isRemitaReady = () => !!(window as any).RmPaymentEngine;

export default function SchoolFeesPage() {
  const navigate = useNavigate();
  const { studentDetails } = useGetUserInfo();
  const userID = studentDetails?.userID || "";
  const userEmail = studentDetails?.email || "";
  const userName = `${studentDetails?.firstName || ""} ${studentDetails?.lastName || ""}`.trim();
  const regNumber = studentDetails?.regNo?.toString() || "";

  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState("School Fees Payment");
  const [paying, setPaying] = useState(false);
  const [remitaReady, setRemitaReady] = useState(isRemitaReady());
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");
  const [rrr, setRrr] = useState("");

  // Poll for Remita SDK to be ready
  useEffect(() => {
    if (remitaReady) return;

    const checkRemita = setInterval(() => {
      if (isRemitaReady()) {
        setRemitaReady(true);
        clearInterval(checkRemita);
      }
    }, 200);

    const timeout = setTimeout(() => {
      if (isRemitaReady()) {
        setRemitaReady(true);
      }
    }, 500);

    return () => {
      clearInterval(checkRemita);
      clearTimeout(timeout);
    };
  }, [remitaReady]);

  const numericAmount = parseFloat(amount) || 0;

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);

  const recordPayment = async (reference: string, rrrCode: string) => {
    await addDoc(collection(db, "schoolFeePayments"), {
      userID,
      userEmail,
      userName,
      regNumber,
      amount: numericAmount,
      description,
      reference,
      rrr: rrrCode,
      paymentMethod: "remita",
      status: "success",
      createdAt: serverTimestamp(),
    });
    await addDoc(collection(db, "transactions"), {
      userID,
      userEmail,
      type: "school_fees",
      amount: numericAmount,
      description: `School Fees Payment - ${description}`,
      reference,
      rrr: rrrCode,
      status: "success",
      createdAt: serverTimestamp(),
    });
  };

  const handleRemitaPayment = () => {
    if (numericAmount < 1000) {
      notifyUser("error", "Minimum amount is 1,000 Naira.");
      return;
    }

    if (!userEmail) {
      notifyUser("error", "Please log in to continue.");
      return;
    }

    const RmPaymentEngine = (window as any).RmPaymentEngine;
    if (!RmPaymentEngine) {
      notifyUser("error", "Remita is still loading. Please wait a moment and try again.");
      setRemitaReady(false);
      return;
    }

    setPaying(true);
    const orderId = `EBSU_SF_${Date.now()}`;

    try {
      const paymentEngine = RmPaymentEngine.init({
        key: REMITA_API_KEY,
        customerId: userEmail,
        firstName: studentDetails?.firstName || "Student",
        lastName: studentDetails?.lastName || "",
        email: userEmail,
        amount: numericAmount,
        narration: description,
        transactionId: orderId,

        onSuccess: async (response: any) => {
          try {
            const transactionId = response?.transactionId || orderId;
            const rrrCode = response?.paymentReference || response?.RRR || "";
            
            await recordPayment(transactionId, rrrCode);
            setPaymentRef(transactionId);
            setRrr(rrrCode);
            setPaymentSuccess(true);
            notifyUser("success", "School fees payment successful!");
          } catch (err) {
            console.error("Error recording payment:", err);
            notifyUser("success", "Payment successful! Reference: " + (response?.transactionId || orderId));
          }
          setPaying(false);
        },

        onError: (response: any) => {
          console.error("Remita payment error:", response);
          notifyUser("error", "Payment failed. Please try again.");
          setPaying(false);
        },

        onClose: () => {
          if (!paymentSuccess) {
            notifyUser("info", "Payment window closed.");
          }
          setPaying(false);
        },
      });

      paymentEngine.showPaymentWidget();
    } catch (error) {
      console.error("Remita setup error:", error);
      notifyUser("error", "Failed to initialize payment. Please refresh and try again.");
      setPaying(false);
    }
  };

  const resetForm = () => {
    setPaymentSuccess(false);
    setPaymentRef("");
    setRrr("");
    setAmount("");
    setDescription("School Fees Payment");
  };

  const canPay = numericAmount >= 1000;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-20">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6 group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        {/* Success State */}
        <AnimatePresence mode="wait">
          {paymentSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl shadow-emerald-500/10 border border-emerald-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-center">
                <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
                <p className="text-emerald-100">Your school fees payment has been processed</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Description</span>
                    <span className="font-semibold text-gray-900">{description}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="font-bold text-emerald-600 text-lg">{fmt(numericAmount)}</span>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Transaction Reference</p>
                    <code className="text-sm font-mono text-gray-700 bg-white px-3 py-1 rounded-lg border inline-block">
                      {paymentRef}
                    </code>
                  </div>
                  {rrr && (
                    <div className="text-center pt-2 border-t">
                      <p className="text-xs text-gray-500 mb-1">RRR Number</p>
                      <code className="text-sm font-mono text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 inline-block">
                        {rrr}
                      </code>
                    </div>
                  )}
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-amber-700">
                    Please save your transaction reference and RRR number for future reference. You may need it for verification.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={resetForm}
                    className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
                  >
                    Make Another Payment
                  </button>
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="flex-1 py-3.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">School Fees Payment</h1>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Pay your school fees securely via Remita payment gateway
                </p>
              </div>

              {/* Student Info Banner */}
              <div className="bg-gradient-to-r from-emerald-700 to-teal-700 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{userName || "Student"}</p>
                    <p className="text-emerald-200 text-sm">{regNumber || userEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-emerald-200">Powered by</p>
                    <p className="text-white font-bold text-sm">REMITA</p>
                  </div>
                </div>
              </div>

              {/* Main Card */}
              <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                {/* Description Input */}
                <div className="p-6 border-b border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Payment Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., First Semester Fees 2025/2026"
                    className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  />
                </div>

                {/* Amount Input */}
                <div className="p-6 border-b border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Enter Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-lg">
                      NGN
                    </span>
                    <input
                      type="number"
                      min="1000"
                      step="100"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-16 pr-4 py-4 text-2xl font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-gray-300"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Minimum amount: 1,000 Naira</p>
                </div>

                {/* Amount Display */}
                {canPay && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Amount to Pay</span>
                      <span className="font-bold text-2xl text-emerald-600">
                        {fmt(numericAmount)}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Remita Info */}
                <div className="mx-6 my-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-700">Secure Payment via Remita</p>
                      <p className="text-xs text-blue-600 mt-1">
                        You will receive an RRR (Remita Retrieval Reference) number after successful payment. 
                        This can be used for payment verification.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pay Button */}
                <div className="p-6">
                  <button
                    onClick={handleRemitaPayment}
                    disabled={!canPay || paying || !remitaReady}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:shadow-none"
                  >
                    {paying ? (
                      <>
                        <Spinner className="w-5 h-5 text-transparent animate-spin fill-white" />
                        <span>Processing...</span>
                      </>
                    ) : !remitaReady ? (
                      <>
                        <Spinner className="w-5 h-5 text-transparent animate-spin fill-white" />
                        <span>Loading Remita...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Pay {canPay ? fmt(numericAmount) : ""} with Remita
                      </>
                    )}
                  </button>
                  <p className="text-xs text-center text-gray-400 mt-3">
                    Secured by Remita Payment Gateway
                  </p>
                </div>
              </div>

              {/* Payment Methods Info */}
              <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Accepted Payment Methods</p>
                <div className="flex flex-wrap gap-2">
                  {["Debit Card", "Bank Transfer", "USSD", "Internet Banking", "Wallet"].map((method) => (
                    <span key={method} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
