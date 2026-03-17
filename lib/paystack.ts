/**
 * Paystack configuration
 *
 * NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY  — safe to use client-side (prefixed with NEXT_PUBLIC_)
 * PAYSTACK_SECRET_KEY              — server-side only, never expose to the browser
 */

export const PAYSTACK_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string;

/**
 * Use this only inside API routes / Server Actions.
 * It will be undefined on the client.
 */
export const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY as string;

/**
 * Helper to build the Authorization header for Paystack REST calls.
 * Call this only from server-side code (API routes / Server Actions).
 */
export function paystackAuthHeader() {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not set.");
  }
  return { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` };
}
