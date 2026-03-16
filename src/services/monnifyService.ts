/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * useMonnify — loads the Monnify payment SDK from CDN and exposes a
 * `initializePayment` function that opens the Monnify checkout modal.
 *
 * Env vars required:
 *   VITE_MONNIFY_API_KEY        — your Monnify API key
 *   VITE_MONNIFY_CONTRACT_CODE  — your Monnify contract code
 */

const MONNIFY_SDK_URL = "https://sdk.monnify.com/plugin/monnify.js";

export interface MonnifyPaymentOptions {
  amount: number;
  currency?: string;
  reference: string;
  customerFullName: string;
  customerEmail: string;
  customerMobileNumber?: string;
  paymentDescription: string;
  onComplete: (response: MonnifyResponse) => void;
  onClose: () => void;
}

export interface MonnifyResponse {
  status: string;
  redirectUrl: string;
  paymentReference: string;
  transactionReference: string;
  amount: number;
  paidOn: string;
  paymentStatus: string;
  responseCode: string;
  responseMessage: string;
}

function loadSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).MonnifySDK) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${MONNIFY_SDK_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Monnify SDK"))
      );
      return;
    }
    const script = document.createElement("script");
    script.src = MONNIFY_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Monnify SDK"));
    document.head.appendChild(script);
  });
}

export async function initializeMonnifyPayment(
  options: MonnifyPaymentOptions
): Promise<void> {
  await loadSDK();

  const apiKey = import.meta.env.VITE_MONNIFY_API_KEY;
  const contractCode = import.meta.env.VITE_MONNIFY_CONTRACT_CODE;

  if (!apiKey || !contractCode) {
    throw new Error(
      "Monnify API key or contract code is not configured. Please add VITE_MONNIFY_API_KEY and VITE_MONNIFY_CONTRACT_CODE to your environment variables."
    );
  }

  const MonnifySDK = (window as any).MonnifySDK;

  MonnifySDK.initialize({
    amount: options.amount,
    currency: options.currency ?? "NGN",
    reference: options.reference,
    customerFullName: options.customerFullName,
    customerEmail: options.customerEmail,
    customerMobileNumber: options.customerMobileNumber ?? "",
    apiKey,
    contractCode,
    paymentDescription: options.paymentDescription,
    isTestMode: import.meta.env.DEV,
    onComplete: options.onComplete,
    onClose: options.onClose,
  });
}
