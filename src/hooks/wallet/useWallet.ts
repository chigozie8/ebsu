/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../config/firebase";

export interface WalletTransaction {
  id: string;
  type: "fund" | "payment" | "transfer_in" | "transfer_out" | "withdrawal_request";
  amount: number;
  description: string;
  reference?: string;
  status: "success" | "pending" | "failed";
  createdAt: any;
  recipientEmail?: string;
  senderEmail?: string;
}

export interface Wallet {
  userID: string;
  balance: number;
  createdAt: any;
  updatedAt: any;
}

export const useWallet = (userID: string | undefined, userEmail: string | undefined) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Real-time wallet listener — creates wallet doc if it doesn't exist
  useEffect(() => {
    if (!userID) {
      setLoadingWallet(false);
      return;
    }
    const walletRef = doc(db, "wallets", userID);
    const unsubscribe = onSnapshot(walletRef, async (snap) => {
      if (snap.exists()) {
        setWallet(snap.data() as Wallet);
      } else {
        // Auto-create wallet on first visit
        const newWallet: Wallet = {
          userID,
          balance: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(walletRef, newWallet);
      }
      setLoadingWallet(false);
    });
    return () => unsubscribe();
  }, [userID]);

  // Real-time transactions listener
  useEffect(() => {
    if (!userID) return;
    setLoadingTransactions(true);
    // Query without orderBy to avoid needing a composite index; sort client-side
    const q = query(
      collection(db, "transactions"),
      where("userID", "==", userID)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const txns: WalletTransaction[] = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<WalletTransaction, "id">) }))
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return bTime - aTime;
        });
      setTransactions(txns);
      setLoadingTransactions(false);
    }, (err) => {
      console.error("[useWallet] transactions snapshot error:", err);
      setLoadingTransactions(false);
    });
    return () => unsubscribe();
  }, [userID]);

  // Keep fetchTransactions as a manual refresh no-op (transactions update in real-time)
  const fetchTransactions = async () => {
    // no-op — data is live via onSnapshot
  };

  // Credit wallet after successful Paystack payment
  const fundWallet = async (amount: number, reference: string) => {
    if (!userID || !userEmail) throw new Error("Not authenticated");
    const walletRef = doc(db, "wallets", userID);
    const walletSnap = await getDoc(walletRef);
    const currentBalance = walletSnap.exists() ? walletSnap.data().balance : 0;
    await updateDoc(walletRef, {
      balance: currentBalance + amount,
      updatedAt: serverTimestamp(),
    });
    await addDoc(collection(db, "transactions"), {
      userID,
      userEmail,
      type: "fund",
      amount,
      description: `Wallet funded via Paystack`,
      reference,
      status: "success",
      createdAt: serverTimestamp(),
    });
  };

  // Pay for something using wallet balance
  const payWithWallet = async (amount: number, description: string) => {
    if (!userID || !userEmail) throw new Error("Not authenticated");
    const walletRef = doc(db, "wallets", userID);
    const walletSnap = await getDoc(walletRef);
    if (!walletSnap.exists()) throw new Error("Wallet not found");
    const currentBalance = walletSnap.data().balance;
    if (currentBalance < amount) throw new Error("Insufficient wallet balance");
    await updateDoc(walletRef, {
      balance: currentBalance - amount,
      updatedAt: serverTimestamp(),
    });
    await addDoc(collection(db, "transactions"), {
      userID,
      userEmail,
      type: "payment",
      amount,
      description,
      status: "success",
      createdAt: serverTimestamp(),
    });
  };

  // Transfer to another user by email
  const transferToUser = async (recipientEmail: string, amount: number) => {
    if (!userID || !userEmail) throw new Error("Not authenticated");
    if (recipientEmail.toLowerCase() === userEmail.toLowerCase())
      throw new Error("You cannot transfer to yourself");

    // Find recipient's wallet by email from userInfo collection
    const userInfoQ = query(
      collection(db, "userInfo"),
      where("email", "==", recipientEmail)
    );
    const userInfoSnap = await getDocs(userInfoQ);
    if (userInfoSnap.empty) throw new Error("No EBSUMSA user found with that email");

    const recipientUserID = userInfoSnap.docs[0].data().userID;
    const senderWalletRef = doc(db, "wallets", userID);
    const recipientWalletRef = doc(db, "wallets", recipientUserID);

    const senderSnap = await getDoc(senderWalletRef);
    if (!senderSnap.exists() || senderSnap.data().balance < amount)
      throw new Error("Insufficient wallet balance");

    const recipientSnap = await getDoc(recipientWalletRef);
    const recipientBalance = recipientSnap.exists() ? recipientSnap.data().balance : 0;

    // Debit sender
    await updateDoc(senderWalletRef, {
      balance: senderSnap.data().balance - amount,
      updatedAt: serverTimestamp(),
    });
    // Credit recipient (create wallet if needed)
    if (recipientSnap.exists()) {
      await updateDoc(recipientWalletRef, {
        balance: recipientBalance + amount,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(recipientWalletRef, {
        userID: recipientUserID,
        balance: amount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // Log transactions for both parties
    await addDoc(collection(db, "transactions"), {
      userID,
      userEmail,
      type: "transfer_out",
      amount,
      description: `Transfer to ${recipientEmail}`,
      recipientEmail,
      status: "success",
      createdAt: serverTimestamp(),
    });
    await addDoc(collection(db, "transactions"), {
      userID: recipientUserID,
      userEmail: recipientEmail,
      type: "transfer_in",
      amount,
      description: `Transfer received from ${userEmail}`,
      senderEmail: userEmail,
      status: "success",
      createdAt: serverTimestamp(),
    });
  };

  // Submit a withdrawal request (admin approves manually)
  const requestWithdrawal = async (amount: number, bankName: string, accountNumber: string, accountName: string) => {
    if (!userID || !userEmail) throw new Error("Not authenticated");
    const walletRef = doc(db, "wallets", userID);
    const walletSnap = await getDoc(walletRef);
    if (!walletSnap.exists() || walletSnap.data().balance < amount)
      throw new Error("Insufficient wallet balance");

    // Deduct immediately and hold pending
    await updateDoc(walletRef, {
      balance: walletSnap.data().balance - amount,
      updatedAt: serverTimestamp(),
    });

    // Create withdrawal request
    await addDoc(collection(db, "withdrawalRequests"), {
      userID,
      userEmail,
      amount,
      bankName,
      accountNumber,
      accountName,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    // Log transaction
    await addDoc(collection(db, "transactions"), {
      userID,
      userEmail,
      type: "withdrawal_request",
      amount,
      description: `Withdrawal request to ${bankName} - ${accountNumber}`,
      status: "pending",
      createdAt: serverTimestamp(),
    });
  };

  return {
    wallet,
    loadingWallet,
    transactions,
    loadingTransactions,
    fetchTransactions,
    fundWallet,
    payWithWallet,
    transferToUser,
    requestWithdrawal,
  };
};
