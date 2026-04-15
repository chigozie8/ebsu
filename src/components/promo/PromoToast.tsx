import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose, IoSparkles } from "react-icons/io5";

const WHATSAPP_LINK = "https://wa.me/message/your-link-here"; // Replace with your actual WhatsApp link
const STORAGE_KEY = "ebsu_promo_dismissed";
const DELAY_MS = 6000;

export default function PromoToast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if user already dismissed this session
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, "true");
  };

  const handleCTA = () => {
    window.open(WHATSAPP_LINK, "_blank", "noopener,noreferrer");
    dismiss();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100vw-2rem)] max-w-sm"
          role="dialog"
          aria-label="Promotional offer"
        >
          {/* Card */}
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

            {/* Top accent bar with animated shimmer */}
            <div className="h-1 w-full bg-[#25D366] relative overflow-hidden">
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
                  {/* WhatsApp-style icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center shadow-md shadow-[#25D366]/30">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="white" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.12 1.526 5.853L.057 23.5l5.784-1.517A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.806 9.806 0 01-4.99-1.366l-.358-.213-3.714.974.992-3.618-.234-.372A9.797 9.797 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                    </svg>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-[#25D366] uppercase tracking-widest font-dmSans">
                        New Launch
                      </span>
                      <span className="inline-flex items-center gap-0.5 bg-[#25D366]/10 text-[#25D366] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        <IoSparkles className="text-[9px]" />
                        AI
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 leading-tight font-dmSans">
                      WapiCommerce
                    </h3>
                  </div>
                </div>

                {/* Dismiss button */}
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
                Sell smarter on WhatsApp. Our AI-powered commerce platform lets you{" "}
                <span className="text-gray-700 font-medium">take orders, manage products & close sales</span>
                {" "}— all inside WhatsApp, automatically.
              </p>

              {/* CTA row */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCTA}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] active:bg-[#18a852] text-white text-xs font-semibold py-2.5 rounded-xl transition-colors touch-manipulation shadow-md shadow-[#25D366]/25"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="white" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.12 1.526 5.853L.057 23.5l5.784-1.517A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.806 9.806 0 01-4.99-1.366l-.358-.213-3.714.974.992-3.618-.234-.372A9.797 9.797 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                  </svg>
                  Chat with us on WhatsApp
                </button>
              </div>

              {/* Trust line */}
              <p className="text-[10px] text-gray-400 text-center mt-2 font-inter">
                Powered by AI &middot; Built for African businesses
              </p>
            </div>

            {/* Progress bar — counts down the display duration */}
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 bg-[#25D366]/30"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 12, ease: "linear" }}
              onAnimationComplete={dismiss}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
