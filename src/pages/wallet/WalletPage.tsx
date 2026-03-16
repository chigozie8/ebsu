/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useGetUserInfo } from "../../hooks/auth/useGetUserInfo";
import {
  getOrCreateWallet,
  getTransactions,
  getBankAccounts,
  fundWallet,
  deductWallet,
  creditWallet,
  saveBankAccount,
  deleteBankAccount,
  formatNaira,
  generateRef,
  NIGERIAN_BANKS,
  type Wallet,
  type WalletTransaction,
  type BankAccount,
} from "../../services/walletService";
import {
  initializeMonnifyPayment,
  type MonnifyResponse,
} from "../../services/monnifyService";
import { supabase } from "../../config/supabase";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function txIcon(type: WalletTransaction["type"]) {
  const map: Record<WalletTransaction["type"], { icon: string; bg: string; color: string }> = {
    fund:          { icon: "M12 4v16m8-8H4",                                                    bg: "bg-green-100",  color: "text-green-600"  },
    payment:       { icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z", bg: "bg-blue-100",   color: "text-blue-600"   },
    transfer_in:   { icon: "M19 14l-7 7m0 0l-7-7m7 7V3",                                        bg: "bg-teal-100",   color: "text-teal-600"   },
    transfer_out:  { icon: "M5 10l7-7m0 0l7 7m-7-7v18",                                         bg: "bg-orange-100", color: "text-orange-600" },
    withdrawal:    { icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z", bg: "bg-red-100",    color: "text-red-600"    },
  };
  return map[type];
}

function txLabel(type: WalletTransaction["type"]): string {
  return ({
    fund: "Wallet Funding",
    payment: "Payment",
    transfer_in: "Transfer Received",
    transfer_out: "Transfer Sent",
    withdrawal: "Withdrawal",
  } as Record<WalletTransaction["type"], string>)[type];
}

function isCredit(type: WalletTransaction["type"]): boolean {
  return type === "fund" || type === "transfer_in";
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{title}</h3>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Fund Modal ───────────────────────────────────────────────────────────────

function FundModal({ wallet, onSuccess, onClose: _onClose }: { wallet: Wallet; onSuccess: () => void; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const QUICK = [500, 1000, 2000, 5000, 10000];

  const handlePay = async () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num < 100) { setError("Minimum funding amount is ₦100"); return; }
    setError("");
    setLoading(true);
    const ref = generateRef("FUND");
    try {
      await initializeMonnifyPayment({
        amount: num,
        reference: ref,
        customerFullName: wallet.full_name,
        customerEmail: wallet.email,
        paymentDescription: "EBSUMSA Wallet Funding",
        onComplete: async (res: MonnifyResponse) => {
          if (res.paymentStatus === "PAID" || res.responseCode === "00") {
            await fundWallet(wallet, num, res.transactionReference || ref, "Wallet Funding via Monnify");
            onSuccess();
          } else {
            setError("Payment was not completed. Please try again.");
          }
          setLoading(false);
        },
        onClose: () => setLoading(false),
      });
    } catch (e: any) {
      setError(e?.message || "Payment failed. Ensure your Monnify keys are configured.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Choose an amount or enter a custom value to fund your wallet using Monnify (card, bank transfer, USSD).</p>
      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button key={q} onClick={() => setAmount(String(q))}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${amount === String(q) ? "border-green1 bg-green1/10 text-green1" : "border-gray-100 bg-gray-50 text-gray-600 hover:border-green1/30"}`}>
            {formatNaira(q)}
          </button>
        ))}
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">₦</span>
        <input
          type="number" min="100" value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green1/30 focus:border-green1"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button onClick={handlePay} disabled={loading}
        className="w-full bg-green1 hover:bg-green2 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
        {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</> : "Fund Wallet with Monnify"}
      </button>
      <p className="text-xss text-center text-gray-400">Secured by Monnify. Supports cards, bank transfer & USSD.</p>
    </div>
  );
}

// ─── Transfer Modal ───────────────────────────────────────────────────────────

function TransferModal({ wallet, onSuccess, onClose: _onClose }: { wallet: Wallet; onSuccess: () => void; onClose: () => void }) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{ id: string; full_name: string } | null>(null);
  const [lookingUp, setLookingUp] = useState(false);

  const lookupRecipient = async () => {
    if (!recipientEmail.trim()) return;
    setLookingUp(true);
    setPreview(null);
    setError("");
    const { data } = await supabase.from("wallets").select("id, full_name").eq("email", recipientEmail.trim().toLowerCase()).single();
    if (!data) {
      setError("No wallet found for that email address.");
    } else if (data.id === wallet.id) {
      setError("You cannot transfer to yourself.");
    } else {
      setPreview(data);
    }
    setLookingUp(false);
  };

  const handleTransfer = async () => {
    const num = parseFloat(amount);
    if (!preview) { setError("Please look up a recipient first."); return; }
    if (isNaN(num) || num < 10) { setError("Minimum transfer is ₦10"); return; }
    if (num > wallet.balance) { setError("Insufficient wallet balance."); return; }
    setLoading(true);
    setError("");
    const ref = generateRef("TRF");
    try {
      await deductWallet(wallet, num, "transfer_out", `Transfer to ${preview.full_name}`, ref, { recipient_email: recipientEmail });
      const { data: recipientWallet } = await supabase.from("wallets").select("*").eq("id", preview.id).single();
      if (recipientWallet) {
        await creditWallet(recipientWallet, num, `Transfer from ${wallet.full_name}`, ref);
      }
      onSuccess();
    } catch (e: any) {
      setError(e?.message || "Transfer failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Transfer funds to another EBSUMSA wallet holder by their email address.</p>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Recipient Email</label>
        <div className="flex gap-2">
          <input value={recipientEmail} onChange={(e) => { setRecipientEmail(e.target.value); setPreview(null); }}
            onKeyDown={(e) => e.key === "Enter" && lookupRecipient()}
            placeholder="student@example.com" type="email"
            className="flex-1 p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green1/30 focus:border-green1" />
          <button onClick={lookupRecipient} disabled={lookingUp}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors">
            {lookingUp ? "..." : "Lookup"}
          </button>
        </div>
      </div>
      {preview && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-green1 flex items-center justify-center text-white text-xs font-bold">{preview.full_name[0]}</div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{preview.full_name}</p>
            <p className="text-xss text-green-600">Wallet found</p>
          </div>
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Amount (₦)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">₦</span>
          <input type="number" min="10" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
            className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green1/30 focus:border-green1" />
        </div>
        <p className="text-xss text-gray-400 mt-1">Available: {formatNaira(wallet.balance)}</p>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description (optional)</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. For food"
          className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green1/30 focus:border-green1" />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button onClick={handleTransfer} disabled={loading || !preview}
        className="w-full bg-green1 hover:bg-green2 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
        {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</> : "Send Transfer"}
      </button>
    </div>
  );
}

// ─── Withdraw Modal ───────────────────────────────────────────────────────────

function WithdrawModal({ wallet, bankAccounts, onSuccess, onRefreshBanks }: { wallet: Wallet; bankAccounts: BankAccount[]; onSuccess: () => void; onRefreshBanks: () => void }) {
  const [tab, setTab] = useState<"withdraw" | "add_bank">("withdraw");
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newBank, setNewBank] = useState({ bank_name: "", bank_code: "", account_number: "", account_name: "" });
  const [addingBank, setAddingBank] = useState(false);

  const handleWithdraw = async () => {
    const num = parseFloat(amount);
    if (!selectedBank) { setError("Please select a bank account."); return; }
    if (isNaN(num) || num < 100) { setError("Minimum withdrawal is ₦100."); return; }
    if (num > wallet.balance) { setError("Insufficient wallet balance."); return; }
    setLoading(true);
    setError("");
    const acct = bankAccounts.find((b) => b.id === selectedBank)!;
    const ref = generateRef("WDR");
    try {
      await deductWallet(wallet, num, "withdrawal",
        `Withdrawal to ${acct.bank_name} — ${acct.account_number}`, ref,
        { bank_name: acct.bank_name, account_number: acct.account_number, account_name: acct.account_name });
      onSuccess();
    } catch (e: any) {
      setError(e?.message || "Withdrawal failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBank = async () => {
    if (!newBank.bank_name || !newBank.account_number || !newBank.account_name) {
      setError("Please fill all bank account fields.");
      return;
    }
    setAddingBank(true);
    setError("");
    try {
      await saveBankAccount(wallet.user_id, {
        bank_name: newBank.bank_name,
        bank_code: newBank.bank_code,
        account_number: newBank.account_number,
        account_name: newBank.account_name,
        is_default: bankAccounts.length === 0,
      });
      setNewBank({ bank_name: "", bank_code: "", account_number: "", account_name: "" });
      onRefreshBanks();
      setTab("withdraw");
    } catch (e: any) {
      setError(e?.message || "Failed to save bank account.");
    } finally {
      setAddingBank(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        {(["withdraw", "add_bank"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setError(""); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tab === t ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>
            {t === "withdraw" ? "Withdraw" : "Add Bank Account"}
          </button>
        ))}
      </div>

      {tab === "withdraw" ? (
        <>
          {bankAccounts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-3">No bank accounts saved. Add one first.</p>
              <button onClick={() => setTab("add_bank")} className="text-sm text-green1 font-semibold">Add Bank Account</button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Select Account</label>
                <div className="space-y-2">
                  {bankAccounts.map((acct) => (
                    <label key={acct.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedBank === acct.id ? "border-green1 bg-green1/5" : "border-gray-100 hover:border-gray-200"}`}>
                      <input type="radio" name="bank" value={acct.id} checked={selectedBank === acct.id}
                        onChange={() => setSelectedBank(acct.id)} className="sr-only" />
                      <div className="w-8 h-8 rounded-full bg-green1/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-green1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{acct.account_name}</p>
                        <p className="text-xss text-gray-500">{acct.bank_name} — {acct.account_number}</p>
                      </div>
                      <button onClick={async (e) => { e.preventDefault(); await deleteBankAccount(acct.id); onRefreshBanks(); }}
                        className="ml-auto text-red-400 hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Amount (₦)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">₦</span>
                  <input type="number" min="100" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green1/30 focus:border-green1" />
                </div>
                <p className="text-xss text-gray-400 mt-1">Available: {formatNaira(wallet.balance)}</p>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button onClick={handleWithdraw} disabled={loading}
                className="w-full bg-green1 hover:bg-green2 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</> : "Withdraw Funds"}
              </button>
              <p className="text-xss text-gray-400 text-center">Withdrawals are processed within 1-3 business days.</p>
            </>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Bank</label>
            <select value={newBank.bank_code}
              onChange={(e) => {
                const bank = NIGERIAN_BANKS.find((b: { name: string; code: string }) => b.code === e.target.value);
                setNewBank((p) => ({ ...p, bank_code: e.target.value, bank_name: bank?.name ?? "" }));
              }}
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green1/30 focus:border-green1 bg-white">
              <option value="">Select a bank</option>
              {NIGERIAN_BANKS.map((b: { name: string; code: string }) => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Account Number</label>
            <input value={newBank.account_number} onChange={(e) => setNewBank((p) => ({ ...p, account_number: e.target.value }))}
              placeholder="0123456789" maxLength={10}
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green1/30 focus:border-green1" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Account Name</label>
            <input value={newBank.account_name} onChange={(e) => setNewBank((p) => ({ ...p, account_name: e.target.value }))}
              placeholder="As shown on your bank account"
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green1/30 focus:border-green1" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button onClick={handleAddBank} disabled={addingBank}
            className="w-full bg-green1 hover:bg-green2 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
            {addingBank ? "Saving..." : "Save Bank Account"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "overview" | "transactions" | "transfer" | "withdraw";

export default function WalletPage() {
  const { user, studentDetails, loading: authLoading } = useGetUserInfo();
  const navigate = useNavigate();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [walletLoading, setWalletLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [balanceVisible, setBalanceVisible] = useState(true);

  const [fundOpen, setFundOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fullName = studentDetails ? `${studentDetails.firstName} ${studentDetails.lastName}`.trim() : (user?.displayName ?? "");
  const email = studentDetails?.email ?? user?.email ?? "";

  const loadWallet = useCallback(async () => {
    if (!user?.uid || !email) return;
    setWalletLoading(true);
    try {
      const w = await getOrCreateWallet(user.uid, fullName || "EBSUMSA Student", email);
      setWallet(w);
      const [txs, banks] = await Promise.all([
        getTransactions(user.uid),
        getBankAccounts(user.uid),
      ]);
      setTransactions(txs);
      setBankAccounts(banks);
    } finally {
      setWalletLoading(false);
    }
  }, [user?.uid, email, fullName]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user?.uid && email) loadWallet();
  }, [user?.uid, email]);

  const refreshBanks = async () => {
    if (!user?.uid) return;
    const banks = await getBankAccounts(user.uid);
    setBankAccounts(banks);
  };

  const handleSuccess = (msg: string) => {
    setFundOpen(false);
    setTransferOpen(false);
    setWithdrawOpen(false);
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
    loadWallet();
  };

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "overview",     label: "Overview",      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "transactions", label: "Transactions",  icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { id: "transfer",     label: "Transfer",      icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" },
    { id: "withdraw",     label: "Withdraw",      icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
  ];

  if (authLoading || walletLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-green1 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading your wallet...</p>
        </div>
      </div>
    );
  }

  if (!wallet) return null;

  const totalIn  = transactions.filter((t) => isCredit(t.type)).reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter((t) => !isCredit(t.type)).reduce((s, t) => s + t.amount, 0);
  const recentTxs = transactions.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green1 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-lg flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="fixed top-0 inset-x-0 z-30 bg-white border-b border-gray-100 h-14 flex items-center px-4 sm:px-8 gap-3">
        <NavLink to="/dashboard" className="flex items-center gap-1.5 text-gray-500 hover:text-green1 text-sm transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Dashboard
        </NavLink>
        <span className="text-gray-300">/</span>
        <span className="font-bold text-gray-800 text-sm">My Wallet</span>
      </div>

      <div className="pt-14 max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Balance card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-green3 rounded-2xl p-6 text-white">
          <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/5 rounded-full" />
          <div className="absolute -bottom-10 -left-6 w-40 h-40 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs font-semibold text-green-200 uppercase tracking-widest mb-1">EBSUMSA Wallet</p>
                <p className="font-bold text-white">{wallet.full_name}</p>
                <p className="text-green-200 text-xs">{wallet.email}</p>
              </div>
              <button onClick={() => setBalanceVisible((v) => !v)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d={balanceVisible ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                </svg>
              </button>
            </div>
            <div className="mb-6">
              <p className="text-xs text-green-200 mb-1">Available Balance</p>
              <p className="text-4xl font-extrabold tracking-tight">
                {balanceVisible ? formatNaira(wallet.balance) : "₦ ••••••"}
              </p>
            </div>
            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Fund", icon: "M12 4v16m8-8H4", action: () => setFundOpen(true) },
                { label: "Transfer", icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4", action: () => setTransferOpen(true) },
                { label: "Withdraw", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z", action: () => setWithdrawOpen(true) },
              ].map((btn) => (
                <button key={btn.label} onClick={btn.action}
                  className="flex flex-col items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-xl py-3 transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={btn.icon} />
                  </svg>
                  <span className="text-xs font-semibold text-white">{btn.label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-xss font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Funded</p>
            <p className="text-lg font-bold text-green1">{formatNaira(totalIn)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-xss font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Spent</p>
            <p className="text-lg font-bold text-gray-900">{formatNaira(totalOut)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold whitespace-nowrap transition-colors flex-1 justify-center ${activeTab === tab.id ? "text-green1 border-b-2 border-green1 -mb-px" : "text-gray-500 hover:text-gray-700"}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="p-5">

              {/* Overview tab */}
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { label: "Fund Wallet",  desc: "Add money via Monnify", color: "bg-green1/10 text-green1",  action: () => setFundOpen(true) },
                        { label: "Transfer",     desc: "Send to another wallet",color: "bg-blue-50 text-blue-600",  action: () => setTransferOpen(true) },
                        { label: "Withdraw",     desc: "Send to your bank",     color: "bg-orange-50 text-orange-600", action: () => setWithdrawOpen(true) },
                      ].map((a) => (
                        <button key={a.label} onClick={a.action}
                          className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-green1/30 hover:bg-gray-50 transition-all text-left">
                          <div className={`w-8 h-8 rounded-lg ${a.color.split(" ")[0]} flex items-center justify-center flex-shrink-0`}>
                            <svg className={`w-4 h-4 ${a.color.split(" ")[1]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{a.label}</p>
                            <p className="text-xss text-gray-400 mt-0.5">{a.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {recentTxs.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Transactions</p>
                        <button onClick={() => setActiveTab("transactions")} className="text-xs text-green1 font-semibold">View All</button>
                      </div>
                      <div className="space-y-2">
                        {recentTxs.map((tx) => {
                          const meta = txIcon(tx.type);
                          return (
                            <div key={tx.id} className="flex items-center gap-3 py-2">
                              <div className={`w-9 h-9 rounded-full ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                                <svg className={`w-4 h-4 ${meta.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={meta.icon} />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{tx.description}</p>
                                <p className="text-xss text-gray-400">{formatDate(tx.created_at)}</p>
                              </div>
                              <p className={`text-sm font-bold flex-shrink-0 ${isCredit(tx.type) ? "text-green1" : "text-gray-900"}`}>
                                {isCredit(tx.type) ? "+" : "-"}{formatNaira(tx.amount)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {transactions.length === 0 && (
                    <div className="text-center py-10">
                      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-700">Your wallet is ready</p>
                      <p className="text-xss text-gray-400 mt-1">Fund your wallet to get started</p>
                      <button onClick={() => setFundOpen(true)} className="mt-4 px-5 py-2.5 bg-green1 hover:bg-green2 text-white rounded-xl text-sm font-semibold transition-colors">
                        Fund Now
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Transactions tab */}
              {activeTab === "transactions" && (
                <div>
                  {transactions.length === 0 ? (
                    <div className="text-center py-10 text-sm text-gray-500">No transactions yet.</div>
                  ) : (
                    <div className="space-y-1">
                      {transactions.map((tx) => {
                        const meta = txIcon(tx.type);
                        return (
                          <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                            <div className={`w-10 h-10 rounded-full ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                              <svg className={`w-4 h-4 ${meta.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={meta.icon} />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900 truncate">{tx.description}</p>
                                <span className={`text-xss px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${tx.status === "success" ? "bg-green-100 text-green-700" : tx.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                                  {tx.status}
                                </span>
                              </div>
                              <p className="text-xss text-gray-400">{txLabel(tx.type)} • {formatDate(tx.created_at)}</p>
                              {tx.reference && <p className="text-xss text-gray-300 font-mono truncate">{tx.reference}</p>}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={`text-sm font-bold ${isCredit(tx.type) ? "text-green1" : "text-gray-900"}`}>
                                {isCredit(tx.type) ? "+" : "-"}{formatNaira(tx.amount)}
                              </p>
                              <p className="text-xss text-gray-400">{formatNaira(tx.balance_after)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Transfer tab */}
              {activeTab === "transfer" && (
                <TransferModal wallet={wallet} onSuccess={() => handleSuccess("Transfer sent successfully!")} onClose={() => {}} />
              )}

              {/* Withdraw tab */}
              {activeTab === "withdraw" && (
                <WithdrawModal wallet={wallet} bankAccounts={bankAccounts} onSuccess={() => handleSuccess("Withdrawal request submitted!")} onRefreshBanks={refreshBanks} />
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pay with wallet CTA */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Pay with Wallet</p>
            <p className="text-xss text-gray-400 mt-0.5">Use your balance to pay for dues, events & more</p>
          </div>
          <NavLink to="/payment" className="px-4 py-2 bg-green1 hover:bg-green2 text-white rounded-xl text-xs font-semibold transition-colors">
            Go to Payments
          </NavLink>
        </div>

      </div>

      {/* Modals */}
      <Modal open={fundOpen} onClose={() => setFundOpen(false)} title="Fund Your Wallet">
        <FundModal wallet={wallet} onSuccess={() => handleSuccess("Wallet funded successfully!")} onClose={() => setFundOpen(false)} />
      </Modal>
      <Modal open={transferOpen} onClose={() => setTransferOpen(false)} title="Transfer Funds">
        <TransferModal wallet={wallet} onSuccess={() => handleSuccess("Transfer sent successfully!")} onClose={() => setTransferOpen(false)} />
      </Modal>
      <Modal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="Withdraw Funds">
        <WithdrawModal wallet={wallet} bankAccounts={bankAccounts} onSuccess={() => handleSuccess("Withdrawal request submitted!")} onRefreshBanks={refreshBanks} />
      </Modal>
    </div>
  );
}
