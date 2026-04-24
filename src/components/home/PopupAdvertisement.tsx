import { useState, useEffect } from "react";
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

export default function PopupAdvertisement() {
  const [popupAds, setPopupAds] = useState<Advertisement[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasBeenShown, setHasBeenShown] = useState(false);

  // Fetch popup ads from Firebase
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const snap = await getDocs(collection(db, "advertisements"));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Advertisement[];
        const activePopupAds = data.filter(
          (a) => a.isActive === true && ["popup", "all"].includes(a.placement)
        );
        setPopupAds(activePopupAds);
      } catch (err) {
        console.error("PopupAdvertisement fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, []);

  // Show popup after 5 seconds
  useEffect(() => {
    if (loading || popupAds.length === 0 || hasBeenShown) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
      setHasBeenShown(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [loading, popupAds.length, hasBeenShown]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleNext = () => {
    setCurrentAdIndex((prev) => (prev + 1) % popupAds.length);
  };

  const handlePrev = () => {
    setCurrentAdIndex((prev) => (prev - 1 + popupAds.length) % popupAds.length);
  };

  if (loading || popupAds.length === 0 || !isVisible) return null;

  const ad = popupAds[currentAdIndex];
  const isExternalUrl = ad.ctaUrl?.startsWith("http");

  const popupVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", damping: 25, stiffness: 300 },
    },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleClose}
          />

          {/* Popup Container */}
          <motion.div
            key="popup"
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleClose}
          >
            {/* Popup Card */}
            <motion.div
              className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
              style={{ backgroundColor: ad.bgColor, color: ad.textColor }}
              variants={popupVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 transition-colors flex items-center justify-center"
                aria-label="Close advertisement"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Content Container */}
              <div className="p-8">
                {/* Image */}
                {ad.imageUrl && (
                  <div className="mb-6 rounded-lg overflow-hidden bg-white/20 h-48 flex items-center justify-center">
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PLACEHOLDER;
                      }}
                    />
                  </div>
                )}

                {/* Title */}
                <h2 className="text-2xl font-bold mb-3 font-dmSans">{ad.title}</h2>

                {/* Description */}
                <p className="text-sm opacity-90 mb-6 leading-relaxed font-inter">
                  {ad.description}
                </p>

                {/* CTA Button */}
                {isExternalUrl ? (
                  <a
                    href={ad.ctaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg bg-white/20 hover:bg-white/30 mb-4"
                  >
                    {ad.ctaLabel}
                  </a>
                ) : (
                  <Link
                    to={ad.ctaUrl}
                    className="block text-center px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg bg-white/20 hover:bg-white/30 mb-4"
                    onClick={handleClose}
                  >
                    {ad.ctaLabel}
                  </Link>
                )}

                {/* Navigation Dots */}
                {popupAds.length > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={handlePrev}
                      className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                      aria-label="Previous ad"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>

                    <div className="flex gap-1">
                      {popupAds.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentAdIndex(idx)}
                          className={`h-2 rounded-full transition-all ${
                            idx === currentAdIndex
                              ? "bg-white w-6"
                              : "bg-white/50 w-2 hover:bg-white/75"
                          }`}
                          aria-label={`Go to ad ${idx + 1}`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={handleNext}
                      className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                      aria-label="Next ad"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
