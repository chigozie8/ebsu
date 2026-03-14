import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInVariants5 } from "../../../animation/variants";

const PAYMENT_DETAILS = {
  accountNumber: "8022854664",
  bankName: "Palmpay",
  accountName: "Eze Happiness Ajah",
  amount: "2,000",
  description: "EBSUMSA ID Card Registration Fee",
};

export default function IDCardPayment() {
  const navigate = useNavigate();
  const [payerName, setPayerName] = useState("");

  const handleConfirm = () => {
    if (!payerName.trim()) return;
    navigate("/u/id-card", { state: { paymentVerified: true, payerName } });
  };

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value).catch(() => {});
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-[80px] ss:pt-[90px] sm:pt-[105px] pb-10">
      <div className="max-w-xl mx-auto px-4">
        <motion.div
          variants={fadeInVariants5}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          custom={1}
        >
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#fcd34d]/30 mb-4">
              <svg
                className="w-7 h-7 text-[#b45309]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 text-balance">
              ID Card Registration Payment
            </h1>
            <p className="text-sm text-gray-500 mt-1 text-pretty">
              Make a bank transfer using the details below to proceed with your
              ID card registration.
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#b45309] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                1
              </div>
              <span className="text-sm font-medium text-gray-700">Make Payment</span>
            </div>
            <div className="flex-1 h-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full border-2 border-gray-300 text-gray-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                2
              </div>
              <span className="text-sm text-gray-400">Submit Registration</span>
            </div>
          </div>

          {/* Payment Details Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
            {/* Amount banner */}
            <div className="bg-[#b45309] px-6 py-4 text-white">
              <p className="text-xs font-medium uppercase tracking-wider opacity-80 mb-1">
                Amount to Pay
              </p>
              <p className="text-3xl font-bold">
                &#8358;{PAYMENT_DETAILS.amount}
              </p>
              <p className="text-xs opacity-75 mt-1">{PAYMENT_DETAILS.description}</p>
            </div>

            {/* Bank details */}
            <div className="divide-y divide-gray-100">
              <DetailRow
                label="Bank Name"
                value={PAYMENT_DETAILS.bankName}
                onCopy={() => handleCopy(PAYMENT_DETAILS.bankName)}
              />
              <DetailRow
                label="Account Number"
                value={PAYMENT_DETAILS.accountNumber}
                onCopy={() => handleCopy(PAYMENT_DETAILS.accountNumber)}
                highlight
              />
              <DetailRow
                label="Account Name"
                value={PAYMENT_DETAILS.accountName}
                onCopy={() => handleCopy(PAYMENT_DETAILS.accountName)}
              />
              <DetailRow
                label="Transfer Description"
                value={PAYMENT_DETAILS.description}
                onCopy={() => handleCopy(PAYMENT_DETAILS.description)}
              />
            </div>
          </div>

          {/* Notice */}
          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <svg
              className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-xs text-amber-700 leading-relaxed">
              After making the transfer, enter the name used for the transfer
              below. You will be asked to upload your payment receipt on the
              next page as proof of payment.
            </p>
          </div>

          {/* Contact info */}
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-green-800">Need help with payment?</p>
              <p className="text-xs text-green-700 mt-0.5">
                  Contact the ID card officer:{" "}
                <a
                  href="tel:07025336321"
                  className="font-bold underline underline-offset-2"
                >
                  07025336321
                </a>
              </p>
            </div>
          </div>

          {/* Payer name input */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Name Used for Transfer{" "}
              <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Enter the account name or sender name used when making the
              bank transfer.
            </p>
            <input
              type="text"
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b45309]/30 focus:border-[#b45309] outline-none text-sm transition-colors"
            />
          </div>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={!payerName.trim()}
            className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Click Here If Payment Transfer Was Successful
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">
            You will be redirected to complete your ID card registration.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  onCopy,
  highlight,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  highlight?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex items-center justify-between px-6 py-4 ${highlight ? "bg-amber-50/50" : ""}`}>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p
          className={`text-sm font-semibold ${highlight ? "text-[#b45309] text-base tracking-widest" : "text-gray-900"}`}
        >
          {value}
        </p>
      </div>
      <button
        onClick={handleClick}
        className="ml-4 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
      >
        {copied ? (
          <>
            <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-600">Copied</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy
          </>
        )}
      </button>
    </div>
  );
}
