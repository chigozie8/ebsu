import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../config/firebase";
import { doc, updateDoc, increment, collection, getDocs } from "firebase/firestore";
import type { Advertisement } from "../../pages/admin/tabs/AdminAdsManager";

interface SponsoredAdCardProps {
  /** Pass a specific ad, or leave undefined to auto-fetch a random active community ad */
  ad?: Advertisement;
  placement?: "community" | "feed" | "chat";
  className?: string;
}

/** Fetches all active ads suitable for community/feed placement */
async function fetchCommunityAds(): Promise<Advertisement[]> {
  const snap = await getDocs(collection(db, "advertisements"));
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Advertisement[];
  const now = new Date();
  return all.filter((a) => {
    if (!a.isActive) return false;
    if (!["community", "all", "both"].includes(a.placement)) return false;
    // Respect expiry if present
    if ((a as any).expiryDate) {
      const expiry = new Date((a as any).expiryDate);
      if (expiry < now) return false;
    }
    return true;
  });
}

/** Track impression or click on a Firestore ad document */
async function trackAdEvent(adId: string, event: "impressions" | "clicks") {
  try {
    await updateDoc(doc(db, "advertisements", adId), {
      [event]: increment(1),
    });
  } catch {
    // non-critical — silently fail
  }
}

/** Pick a weighted random ad by priority (higher = more likely) */
function pickAd(ads: Advertisement[]): Advertisement | null {
  if (ads.length === 0) return null;
  const totalWeight = ads.reduce((sum, a) => sum + (((a as any).priority as number) || 1), 0);
  let rand = Math.random() * totalWeight;
  for (const ad of ads) {
    rand -= ((a as any).priority as number) || 1;
    if (rand <= 0) return ad;
  }
  return ads[ads.length - 1];
}

export default function SponsoredAdCard({ ad: adProp, placement = "feed", className = "" }: SponsoredAdCardProps) {
  const [ad, setAd] = useState<Advertisement | null>(adProp ?? null);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (adProp) { setAd(adProp); return; }
    fetchCommunityAds().then((ads) => {
      const picked = pickAd(ads);
      setAd(picked);
    }).catch(() => {});
  }, [adProp]);

  // Track impression once ad is visible
  useEffect(() => {
    if (ad && !trackedRef.current) {
      trackedRef.current = true;
      trackAdEvent(ad.id, "impressions");
    }
  }, [ad]);

  const handleClick = () => {
    if (!ad) return;
    trackAdEvent(ad.id, "clicks");
    if (ad.ctaUrl) {
      if (ad.ctaUrl.startsWith("http")) {
        window.open(ad.ctaUrl, "_blank", "noopener noreferrer");
      }
    } else {
      setExpanded(true);
    }
  };

  if (!ad || dismissed) return null;

  const isExternalLink = ad.ctaUrl?.startsWith("http");
  const hasImage = !!ad.imageUrl && !imageError;

  return (
    <>
      <AnimatePresence>
        {!dismissed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`mx-3 my-2 rounded-2xl overflow-hidden shadow-sm border border-black/[0.06] ${className}`}
            style={{ backgroundColor: ad.bgColor }}
          >
            {/* Sponsored label row */}
            <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                  style={{
                    color: ad.textColor,
                    borderColor: `${ad.textColor}30`,
                    backgroundColor: `${ad.textColor}15`,
                  }}
                >
                  Sponsored
                </span>
              </div>
              <button
                onClick={() => setDismissed(true)}
                aria-label="Dismiss ad"
                className="w-5 h-5 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                style={{ backgroundColor: `${ad.textColor}20`, color: ad.textColor }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Main card body */}
            <div className="flex items-start gap-3 px-3 pb-3">
              {/* Product image */}
              {hasImage && (
                <div className="flex-shrink-0">
                  <img
                    src={ad.imageUrl}
                    alt={ad.title}
                    onError={() => setImageError(true)}
                    className="w-16 h-16 rounded-xl object-cover border"
                    style={{ borderColor: `${ad.textColor}20` }}
                  />
                </div>
              )}

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className="font-bold text-[14px] leading-snug text-balance"
                  style={{ color: ad.textColor }}
                >
                  {ad.title}
                </p>
                <p
                  className="text-[12px] leading-relaxed mt-0.5 line-clamp-2 opacity-80"
                  style={{ color: ad.textColor }}
                >
                  {ad.description}
                </p>

                {ad.ctaLabel && (
                  <button
                    onClick={handleClick}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-bold transition-all duration-150 hover:opacity-90 active:scale-95"
                    style={{ backgroundColor: ad.textColor, color: ad.bgColor }}
                  >
                    {ad.ctaLabel}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded product detail modal */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header bar */}
              <div
                className="relative h-48 flex items-end p-4"
                style={{ backgroundColor: ad.bgColor }}
              >
                {hasImage && (
                  <img
                    src={ad.imageUrl}
                    alt={ad.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                  />
                )}
                <div className="relative z-10 flex items-end gap-3">
                  {hasImage && (
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-white/30 shadow-lg"
                    />
                  )}
                  <div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${ad.textColor}25`, color: ad.textColor }}
                    >
                      Sponsored
                    </span>
                    <p className="text-white font-extrabold text-xl mt-1 leading-tight text-balance">
                      {ad.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setExpanded(false)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center backdrop-blur-sm"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                <p className="text-gray-600 text-sm leading-relaxed">{ad.description}</p>

                {ad.ctaLabel && ad.ctaUrl && (
                  <a
                    href={ad.ctaUrl}
                    target={isExternalLink ? "_blank" : undefined}
                    rel={isExternalLink ? "noopener noreferrer" : undefined}
                    onClick={() => trackAdEvent(ad.id, "clicks")}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                    style={{ backgroundColor: "#25D366", color: "#fff" }}
                  >
                    {ad.ctaLabel}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
