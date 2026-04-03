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

  // Extract price from description if present (e.g., "$199" or "N5,000")
  const priceMatch = ad.description.match(/(\$[\d,]+|₦[\d,]+|N[\d,]+|NGN[\d,]+)/i);
  const price = priceMatch ? priceMatch[0] : null;
  const descriptionWithoutPrice = price 
    ? ad.description.replace(price, '').replace(/only\s*/i, '').trim() 
    : ad.description;

  return (
    <div
      className={`w-full rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-white group ${className}`}
    >
      <div
        className={`transition-opacity duration-300 ${animating ? "opacity-0" : "opacity-100"}`}
      >
        {/* Green header with Sponsored label */}
        <div 
          className="flex items-center justify-between px-4 py-2.5"
          style={{ backgroundColor: ad.bgColor || "#00875a" }}
        >
          <div className="flex items-center gap-2">
            {/* Checkmark icon */}
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span className="text-white font-semibold text-sm">Sponsored</span>
          </div>
          {/* Dismiss button */}
          <button
            onClick={() => handleDismiss(ad.id)}
            aria-label="Dismiss advertisement"
            className="w-6 h-6 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Product image */}
        {ad.imageUrl && (
          <div className="relative w-full overflow-hidden bg-gray-100" style={{ height: "220px" }}>
            {/* Shimmer skeleton while loading */}
            {!imgLoaded && !imgError && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse">
                <div className="absolute inset-0"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s infinite",
                  }}
                />
              </div>
            )}
            {/* Actual image with subtle zoom on hover */}
            <img
              src={imgError ? PLACEHOLDER : ad.imageUrl}
              alt={ad.title}
              loading="lazy"
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              onError={() => { setImgError(true); setImgLoaded(true); }}
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${
                imgLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
        )}

        {/* Content area - white background */}
        <div className="px-4 pt-4 pb-5 bg-white">
          {/* Title */}
          <h3 className="font-bold text-lg text-gray-900 leading-snug line-clamp-2">
            {ad.title}
          </h3>
          
          {/* Description */}
          <p className="text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed">
            {descriptionWithoutPrice}
          </p>

          {/* Price if extracted */}
          {price && (
            <p className="mt-2 text-base font-medium text-gray-800">
              Only <span style={{ color: ad.bgColor || "#00875a" }} className="font-bold">{price}</span>
            </p>
          )}

          {/* CTA Button - full width */}
          {ad.ctaLabel && ad.ctaUrl && (
            <a
              href={ad.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: ad.bgColor || "#00875a" }}
            >
              {ad.ctaLabel}
            </a>
          )}
        </div>

        {/* Dot indicators for multiple ads */}
        {ads.length > 1 && (
          <div className="flex items-center justify-center gap-2 pb-4 bg-white">
            <button
              onClick={goToPrev}
              aria-label="Previous ad"
              className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to ad ${i + 1}`}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === currentIndex ? "18px" : "8px",
                  height: "8px",
                  backgroundColor: i === currentIndex ? (ad.bgColor || "#00875a") : "#d1d5db",
                }}
              />
            ))}
            <button
              onClick={goToNext}
              aria-label="Next ad"
              className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
