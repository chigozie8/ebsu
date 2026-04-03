/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { db } from "../../config/firebase";
import { collection, getDocs } from "firebase/firestore";
import type { Advertisement } from "../../pages/admin/tabs/AdminAdsManager";

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='1.5'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpath d='M21 15l-5-5L5 21'/%3E%3C/svg%3E";

interface AdvertisementBannerProps {
  className?: string;
}

const DISMISS_KEY = "ebsumsa_dismissed_ads";

function getDismissed(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(DISMISS_KEY) || "[]");
  } catch {
    return [];
  }
}

function setDismissed(ids: string[]) {
  try {
    sessionStorage.setItem(DISMISS_KEY, JSON.stringify(ids));
  } catch {
    // noop
  }
}

export default function AdvertisementBanner({ className = "" }: AdvertisementBannerProps) {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissedState] = useState<string[]>(getDismissed);
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        // Simple collection fetch — no compound index needed, filter client-side
        const snapshot = await getDocs(collection(db, "advertisements"));
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Advertisement[];
        const filtered = data.filter(
          (a) =>
            a.isActive === true &&
            ["dashboard", "both", "all"].includes(a.placement) &&
            !getDismissed().includes(a.id)
        );
        setAds(filtered);
        if (filtered.length > 0) setVisible(true);
      } catch (err) {
        console.error("AdvertisementBanner fetch error:", err);
      }
    };
    fetchAds();
  }, []);

  // Auto-rotate every 6 seconds if multiple ads
  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      goToNext();
    }, 6000);
    return () => clearInterval(interval);
  }, [ads.length, currentIndex]);

  const goToNext = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
      setImgLoaded(false);
      setImgError(false);
      setAnimating(false);
    }, 300);
  }, [ads.length, animating]);

  const goToPrev = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
      setImgLoaded(false);
      setImgError(false);
      setAnimating(false);
    }, 300);
  }, [ads.length, animating]);

  const handleDismiss = (id: string) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    setDismissedState(updated);
    const remaining = ads.filter((a) => !updated.includes(a.id));
    if (remaining.length === 0) {
      setVisible(false);
      setAds([]);
    } else {
      setAds(remaining);
      setCurrentIndex((prev) => Math.min(prev, remaining.length - 1));
    }
  };

  if (!visible || ads.length === 0) return null;

  const ad = ads[currentIndex];

  return (
    <div
      className={`w-full rounded-2xl overflow-hidden shadow-md border border-black/10 group transition-transform duration-300 hover:scale-[1.012] ${className}`}
      style={{ backgroundColor: ad.bgColor, color: ad.textColor }}
    >
      <div
        className={`transition-opacity duration-300 ${animating ? "opacity-0" : "opacity-100"}`}
      >
        {/* Hero image — only shown when ad has an image */}
        {ad.imageUrl && (
          <div className="relative w-full overflow-hidden" style={{ height: "180px" }}>
            {/* Shimmer skeleton while loading */}
            {!imgLoaded && !imgError && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse">
                <div className="absolute inset-0"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s infinite",
                  }}
                />
              </div>
            )}
            {/* Actual image with zoom on hover */}
            <img
              src={imgError ? PLACEHOLDER : ad.imageUrl}
              alt={ad.title}
              loading="lazy"
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              onError={() => { setImgError(true); setImgLoaded(true); }}
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                imgLoaded ? "opacity-100" : "opacity-0"
              }`}
              style={{ transitionProperty: "transform, opacity" }}
            />
            {/* Gradient overlay for text readability */}
            <div
              className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
              style={{
                background: `linear-gradient(to top, ${ad.bgColor}f0, transparent)`,
              }}
            />
            {/* Sponsored label */}
            <span
              className="absolute top-2.5 left-3 text-xss font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(0,0,0,0.35)", color: "#fff" }}
            >
              Sponsored
            </span>
            {/* Dismiss button on image */}
            <button
              onClick={() => handleDismiss(ad.id)}
              aria-label="Dismiss advertisement"
              className="absolute top-2 right-2.5 w-6 h-6 rounded-full flex items-center justify-center transition-opacity hover:opacity-80 active:scale-95"
              style={{ backgroundColor: "rgba(0,0,0,0.35)", color: "#fff" }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        <div className={`flex items-start gap-3 px-4 ${ad.imageUrl ? "pt-3 pb-4" : "pt-4 pb-4"}`}>
          {/* Text content */}
          <div className="flex-1 min-w-0">
            {!ad.imageUrl && (
              <p
                className="text-xss font-bold uppercase tracking-wider opacity-60 mb-0.5"
                style={{ color: ad.textColor }}
              >
                Sponsored
              </p>
            )}
            <p className="font-bold text-sm sm:text-base leading-tight text-balance line-clamp-2">
              {ad.title}
            </p>
            <p className="text-xs sm:text-sm opacity-80 mt-1 line-clamp-2 text-pretty leading-relaxed">
              {ad.description}
            </p>
            {ad.ctaLabel && ad.ctaUrl && (
              <a
                href={ad.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95"
                style={{ backgroundColor: ad.textColor, color: ad.bgColor }}
              >
                {ad.ctaLabel}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            )}
          </div>

          {/* Right controls — only shown when no image (image has dismiss overlay) */}
          {!ad.imageUrl && (
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <button
                onClick={() => handleDismiss(ad.id)}
                aria-label="Dismiss advertisement"
                className="w-6 h-6 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                style={{ backgroundColor: "rgba(255,255,255,0.2)", color: ad.textColor }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          {/* Prev/Next nav if multiple */}
          {ads.length > 1 && (
            <div className="flex items-center gap-1 flex-shrink-0 self-center">
              <button
                onClick={goToPrev}
                aria-label="Previous ad"
                className="w-6 h-6 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                style={{ backgroundColor: "rgba(255,255,255,0.2)", color: ad.textColor }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                onClick={goToNext}
                aria-label="Next ad"
                className="w-6 h-6 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                style={{ backgroundColor: "rgba(255,255,255,0.2)", color: ad.textColor }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Dot indicators */}
        {ads.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pb-3">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to ad ${i + 1}`}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === currentIndex ? "20px" : "6px",
                  height: "6px",
                  backgroundColor: ad.textColor,
                  opacity: i === currentIndex ? 0.9 : 0.35,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
