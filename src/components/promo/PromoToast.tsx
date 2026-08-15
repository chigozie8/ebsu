import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose, IoSparkles } from "react-icons/io5";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../../config/firebase";
import type { Advertisement } from "../../pages/admin/tabs/AdminAdsManager";

const DELAY_MS = 6000;
const AUTO_DISMISS_MS = 12000;
const SESSION_KEY_PREFIX = "ebsu_promo_dismissed_";

export default function PromoToast() {
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    let cancelled = false;

    const loadAd = async () => {
      try {
        // Fetch active ads targeting the home page
        const q = query(
          collection(db, "advertisements"),
          where("isActive", "==", true)
        );
        const snap = await getDocs(q);
        const all = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Advertisement))
          .filter((a) =>
            a.placement === "home" ||
            a.placement === "both" ||
            a.placement === "all"
          );

        if (cancelled || all.length === 0) return;

        // Pick first ad that hasn't been dismissed this session
        const undismissed = all.find(
          (a) => !sessionStorage.getItem(`${SESSION_KEY_PREFIX}${a.id}`)
        );
        if (!undismissed) return;

        setAd(undismissed);

        // Show after delay
        const timer = setTimeout(() => {
          if (!cancelled) setVisible(true);
        }, DELAY_MS);

        return () => clearTimeout(timer);
      } catch {
        // Silently fail — promo toast is non-critical
      }
    };

    loadAd();
    return () => { cancelled = true; };
  }, []);

  const dismiss = () => {
    setVisible(false);
    if (ad) sessionStorage.setItem(`${SESSION_KEY_PREFIX}${ad.id}`, "true");
  };

  const handleCTA = () => {
    if (ad?.ctaUrl) {
      window.open(ad.ctaUrl, "_blank", "noopener,noreferrer");
    }
    dismiss();
  };

  // Determine accent color — prefer bgColor from ad, fall back to WhatsApp green
  const accent = ad?.bgColor || "#25D366";
  const textCol = ad?.textColor || "#ffffff";

  return (
    <AnimatePresence>
      {visible && ad && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100vw-2rem)] max-w-sm"
          role="dialog"
          aria-label="Promotional message"
        >
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

            {/* Top accent shimmer bar */}
            <div className="h-1 w-full relative overflow-hidden" style={{ backgroundColor: accent }}>
              <motion.div
                className="absolute inset-y-0 w-1/2 bg-white/40"
                animate={{ x: ["-100%", "250%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
              />
            </div>

            <div className="px-4 pt-4 pb-4">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">

                  {/* Icon — ad image or colored badge */}
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-md overflow-hidden"
                    style={{
                      backgroundColor: accent,
                      boxShadow: `0 4px 14px ${accent}40`,
                    }}
                  >
                    {ad.imageUrl ? (
                      <img
                        src={ad.imageUrl}
                        alt={ad.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <IoSparkles className="text-lg" style={{ color: textCol }} />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: accent }}
                      >
                        {ad.placement === "home" || ad.placement === "both" || ad.placement === "all"
                          ? "Featured"
                          : "Ad"}
                      </span>
                      <span
                        className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: `${accent}18`, color: accent }}
                      >
                        <IoSparkles className="text-[8px]" />
                        New
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 leading-tight font-dmSans">
                      {ad.title}
                    </h3>
                  </div>
                </div>

                {/* Dismiss */}
                <button
                  onClick={dismiss}
                  className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors touch-manipulation"
                  aria-label="Dismiss"
                >
                  <IoClose className="text-gray-500 text-sm" />
                </button>
              </div>

              {/* Body */}
              <p className="text-xs text-gray-500 leading-relaxed font-inter mb-4">
                {ad.description}
              </p>

              {/* CTA */}
              {ad.ctaLabel && ad.ctaUrl && (
                <button
                  onClick={handleCTA}
                  className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-xl transition-colors touch-manipulation shadow-md"
                  style={{
                    backgroundColor: accent,
                    color: textCol,
                    boxShadow: `0 4px 14px ${accent}35`,
                  }}
                >
                  {ad.ctaLabel}
                </button>
              )}
            </div>

            {/* Auto-dismiss progress bar */}
            <motion.div
              className="absolute bottom-0 left-0 h-[3px]"
              style={{ backgroundColor: `${accent}50` }}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: AUTO_DISMISS_MS / 1000, ease: "linear" }}
              onAnimationComplete={dismiss}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
