import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "../../config/firebase";
import { collection, getDocs } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='1.2'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpath d='M21 15l-5-5L5 21'/%3E%3C/svg%3E";

interface Advertisement {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  bgColor: string;
  textColor: string;
  isActive: boolean;
  placement: string;
  imageUrl?: string;
}

export default function HomeAdsSection() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  // Scroll-based zoom: true when section is in view
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        // Simple fetch with no compound index requirement — filter client-side
        const snap = await getDocs(collection(db, "advertisements"));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Advertisement[];
        const homeAds = data.filter(
          (a) => a.isActive === true && ["home", "both", "all"].includes(a.placement)
        );
        setAds(homeAds);
      } catch (err) {
        console.error("HomeAdsSection fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, []);

  // Reset image load state when ad changes
  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [current]);

  // IntersectionObserver for scroll-based zoom trigger
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % ads.length);
  }, [ads.length]);

  const prev = () => {
    setCurrent((c) => (c - 1 + ads.length) % ads.length);
  };

  // Auto-advance every 5s
  useEffect(() => {
    if (ads.length <= 1) return;
    timerRef.current = setInterval(next, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [ads.length, next]);

  const pause = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };
  const resume = () => {
    if (ads.length <= 1) return;
    timerRef.current = setInterval(next, 5000);
  };

  if (loading || ads.length === 0) return null;

  const ad = ads[current];
  const isExternalUrl = ad.ctaUrl?.startsWith("http");

  return (
    <section ref={sectionRef} className="w-full px-3 xsm:px-14 py-10 box-width">
      {/* Section label */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-5 rounded-full bg-[#00875a]" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Announcements
        </p>
      </div>

      {/* Carousel */}
      <div
        className="relative overflow-hidden rounded-2xl shadow-lg"
        onMouseEnter={pause}
        onMouseLeave={resume}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={ad.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="relative overflow-hidden rounded-2xl"
            style={{ backgroundColor: ad.bgColor }}
          >
            {/* Hero image — top section, full-width, image-first */}
            {ad.imageUrl && (
              <div
                className="relative w-full overflow-hidden"
                style={{ height: "clamp(180px, 40vw, 280px)" }}
              >
                {/* Shimmer skeleton */}
                {!imgLoaded && !imgError && (
                  <div className="absolute inset-0 bg-gray-200 animate-pulse">
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer 1.5s infinite linear",
                      }}
                    />
                  </div>
                )}
                {/* Image with scroll-triggered zoom */}
                <img
                  src={imgError ? PLACEHOLDER : ad.imageUrl}
                  alt={ad.title}
                  loading="lazy"
                  decoding="async"
                  onLoad={() => setImgLoaded(true)}
                  onError={() => { setImgError(true); setImgLoaded(true); }}
                  className={`w-full h-full object-cover transition-all duration-700 ease-out ${
                    imgLoaded ? "opacity-100" : "opacity-0"
                  } ${inView ? "scale-105" : "scale-100"}`}
                />
                {/* Bottom gradient for text readability */}
                <div
                  className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
                  style={{
                    background: `linear-gradient(to top, ${ad.bgColor}f5 0%, ${ad.bgColor}80 50%, transparent 100%)`,
                  }}
                />
                {/* Sponsored badge */}
                <span
                  className="absolute top-3 left-4 text-xss font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: "rgba(0,0,0,0.35)", color: "#fff" }}
                >
                  Sponsored
                </span>
              </div>
            )}

            {/* Text content */}
            <div
              className={`flex flex-col gap-3 px-6 sm:px-10 ${ad.imageUrl ? "pt-4 pb-8" : "py-8 sm:py-10"}`}
              style={{ color: ad.textColor }}
            >
              {/* Badge — only when no image */}
              {!ad.imageUrl && (
                <span
                  className="self-start text-xss font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border"
                  style={{
                    borderColor: `${ad.textColor}40`,
                    backgroundColor: `${ad.textColor}18`,
                    color: ad.textColor,
                  }}
                >
                  Notice
                </span>
              )}

              <h3 className="text-xl sm:text-2xl font-extrabold leading-tight text-balance line-clamp-2">
                {ad.title}
              </h3>
              <p
                className="text-sm leading-relaxed opacity-80 max-w-xl line-clamp-3 text-pretty"
                style={{ color: ad.textColor }}
              >
                {ad.description}
              </p>

              {ad.ctaLabel && ad.ctaUrl && (
                <div className="mt-1">
                  {isExternalUrl ? (
                    <a
                      href={ad.ctaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-100 shadow-sm"
                      style={{ backgroundColor: ad.textColor, color: ad.bgColor }}
                    >
                      {ad.ctaLabel}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>
                  ) : (
                    <Link
                      to={ad.ctaUrl}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-100 shadow-sm"
                      style={{ backgroundColor: ad.textColor, color: ad.bgColor }}
                    >
                      {ad.ctaLabel}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Decorative circles — only when no image */}
            {!ad.imageUrl && (
              <>
                <div
                  className="pointer-events-none absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10"
                  style={{ backgroundColor: ad.textColor }}
                />
                <div
                  className="pointer-events-none absolute -bottom-10 right-20 w-28 h-28 rounded-full opacity-10"
                  style={{ backgroundColor: ad.textColor }}
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Prev / Next arrows — only if >1 ad */}
        {ads.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous announcement"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/25 hover:bg-black/45 flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={next}
              aria-label="Next announcement"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/25 hover:bg-black/45 flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Dot indicators */}
      {ads.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to announcement ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 h-2 bg-[#00875a]"
                  : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
