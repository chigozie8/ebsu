import { supabase } from "../config/supabase";

export interface Wallet {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  type: "fund" | "payment" | "transfer_in" | "transfer_out" | "withdrawal";
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  reference: string | null;
  status: "success" | "pending" | "failed";
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface BankAccount {
  id: string;
  user_id: string;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  is_default: boolean;
  created_at: string;
}

// ── Wallet CRUD ───────────────────────────────────────────────────────────────

export async function getOrCreateWallet(
  userId: string,
  fullName: string,
  email: string
): Promise<Wallet> {
  const { data: existing } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (existing) return existing as Wallet;

  const { data: created, error } = await supabase
    .from("wallets")
    .insert({ user_id: userId, full_name: fullName, email })
    .select("*")
    .single();

  if (error) throw error;
  return created as Wallet;
}

export async function getWallet(userId: string): Promise<Wallet | null> {
  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) return null;
  return data as Wallet;
}

// ── Transactions ──────────────────────────────────────────────────────────────

export async function getTransactions(
  userId: string,
  limit = 50
): Promise<WalletTransaction[]> {
  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as WalletTransaction[];
}

// ── Fund wallet (called after Monnify confirms payment) ───────────────────────

export async function fundWallet(
  wallet: Wallet,
  amount: number,
  reference: string,
  description = "Wallet Funding"
): Promise<void> {
  const newBalance = wallet.balance + amount;

  const { error: txErr } = await supabase.from("wallet_transactions").insert({
    wallet_id: wallet.id,
    user_id: wallet.user_id,
    type: "fund",
    amount,
    balance_before: wallet.balance,
    balance_after: newBalance,
    description,
    reference,
    status: "success",
  });
  if (txErr) throw txErr;

  const { error: walletErr } = await supabase
    .from("wallets")
    .update({ balance: newBalance })
    .eq("id", wallet.id);
  if (walletErr) throw walletErr;
}

// ── Deduct wallet (payment/transfer out/withdrawal) ───────────────────────────

export async function deductWallet(
  wallet: Wallet,
  amount: number,
  type: "payment" | "transfer_out" | "withdrawal",
  description: string,
  reference?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (wallet.balance < amount) throw new Error("Insufficient wallet balance");
  const newBalance = wallet.balance - amount;

  const { error: txErr } = await supabase.from("wallet_transactions").insert({
    wallet_id: wallet.id,
    user_id: wallet.user_id,
    type,
    amount,
    balance_before: wallet.balance,
    balance_after: newBalance,
    description,
    reference: reference ?? null,
    status: "success",
    metadata: metadata ?? {},
  });
  if (txErr) throw txErr;

  const { error: walletErr } = await supabase
    .from("wallets")
    .update({ balance: newBalance })
    .eq("id", wallet.id);
  if (walletErr) throw walletErr;
}

// ── Credit wallet (transfer in) ───────────────────────────────────────────────

export async function creditWallet(
  recipientWallet: Wallet,
  amount: number,
  description: string,
  reference?: string
): Promise<void> {
  const newBalance = recipientWallet.balance + amount;

  const { error: txErr } = await supabase.from("wallet_transactions").insert({
    wallet_id: recipientWallet.id,
    user_id: recipientWallet.user_id,
    type: "transfer_in",
    amount,
    balance_before: recipientWallet.balance,
    balance_after: newBalance,
    description,
    reference: reference ?? null,
    status: "success",
  });
  if (txErr) throw txErr;

  const { error: walletErr } = await supabase
    .from("wallets")
    .update({ balance: newBalance })
    .eq("id", recipientWallet.id);
  if (walletErr) throw walletErr;
}

// ── Bank accounts ─────────────────────────────────────────────────────────────

export async function getBankAccounts(userId: string): Promise<BankAccount[]> {
  const { data, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false });
  if (error) return [];
  return (data ?? []) as BankAccount[];
}

export async function saveBankAccount(
  userId: string,
  account: Omit<BankAccount, "id" | "user_id" | "created_at">
): Promise<BankAccount> {
  const { data, error } = await supabase
    .from("bank_accounts")
    .insert({ ...account, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data as BankAccount;
}

export async function deleteBankAccount(id: string): Promise<void> {
  const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
  if (error) throw error;
}

// ── Nigerian banks list ───────────────────────────────────────────────────────

export const NIGERIAN_BANKS: { name: string; code: string }[] = [
  { name: "Access Bank", code: "044" },
  { name: "Citibank Nigeria", code: "023" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank (FCMB)", code: "214" },
  { name: "Globus Bank", code: "103" },
  { name: "Guaranty Trust Bank (GTBank)", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Jaiz Bank", code: "301" },
  { name: "Keystone Bank", code: "082" },
  { name: "Moniepoint Microfinance Bank", code: "50515" },
  { name: "Opay", code: "100004" },
  { name: "Palmpay", code: "999991" },
  { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Standard Chartered Bank", code: "068" },
  { name: "Sterling Bank", code: "232" },
  { name: "SunTrust Bank", code: "100" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "United Bank for Africa (UBA)", code: "033" },
  { name: "Unity Bank", code: "215" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
];

// ── Format currency ───────────────────────────────────────────────────────────

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ── Generate unique reference ─────────────────────────────────────────────────

export function generateRef(prefix = "EBSU"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
