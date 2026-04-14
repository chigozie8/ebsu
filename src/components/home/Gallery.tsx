import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  IoClose,
  IoChevronBack,
  IoChevronForward,
  IoGrid,
  IoImages,
  IoPlay,
  IoVideocam,
  IoCamera,
  IoArrowForward,
  IoExpand,
} from "react-icons/io5";
import { useCloudinaryGallery, type GalleryItem } from "../../hooks/useCloudinaryGallery";
export type { GalleryItem } from "../../hooks/useCloudinaryGallery";

// ---------- animation variants ----------
const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.07 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerCard = {
  initial: { opacity: 0, scale: 0.93, y: 20 },
  animate: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: 0.06 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const modalVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const imageVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 260 : -260, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit: (direction: number) => ({ x: direction < 0 ? 260 : -260, opacity: 0, transition: { duration: 0.25 } }),
};

const gridItemVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: Math.min(i * 0.025, 0.5), duration: 0.35, ease: "easeOut" },
  }),
};

const PREVIEW_COUNT = 7;

// ---------- MediaCard ----------
function MediaCard({
  item,
  onClick,
  eager = false,
  showOverlay = true,
}: {
  item: GalleryItem;
  onClick: () => void;
  eager?: boolean;
  showOverlay?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (item.type === "video") {
    return (
      <div className="relative w-full h-full cursor-pointer group" onClick={onClick}>
        {!loaded && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-2xl" />
        )}
        <video
          src={item.url}
          muted
          playsInline
          preload="metadata"
          onLoadedData={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover rounded-2xl transition-all duration-500 ${loaded ? "opacity-100" : "opacity-0"} group-hover:scale-105`}
        />
        {showOverlay && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-2xl" />
        )}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 rounded-full p-3 shadow-lg shadow-black/10 group-hover:scale-110 transition-transform duration-300">
            <IoPlay className="text-green1 text-lg ml-0.5" />
          </div>
        </div>
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-2xl">
            <IoVideocam className="text-gray-400 text-2xl" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full cursor-pointer group" onClick={onClick}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-2xl" />
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-2xl">
          <IoImages className="text-gray-400 text-2xl" />
        </div>
      ) : (
        <>
          <img
            src={item.url}
            alt={item.caption || "Gallery image"}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className={`w-full h-full object-cover rounded-2xl transition-all duration-500 ${loaded ? "opacity-100" : "opacity-0"} group-hover:scale-105`}
          />
          {showOverlay && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all duration-300 rounded-2xl" />
          )}
          {showOverlay && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white/90 rounded-full p-1.5 shadow-md">
                <IoExpand className="text-gray-700 text-sm" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------- LightboxMedia ----------
function LightboxMedia({ item, direction }: { item: GalleryItem; direction: number }) {
  const [loaded, setLoaded] = useState(false);

  // Reset loaded state when item changes
  useEffect(() => { setLoaded(false); }, [item.id]);

  if (item.type === "video") {
    return (
      <motion.video
        key={item.id}
        src={item.url}
        variants={imageVariants}
        custom={direction}
        initial="enter"
        animate="center"
        exit="exit"
        controls
        autoPlay
        className="max-w-full w-full max-h-[calc(100dvh-160px)] object-contain rounded-xl shadow-2xl"
      />
    );
  }

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Spinner shown until image is loaded */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}
      <motion.img
        key={item.id}
        src={item.url}
        alt={item.caption || "Gallery image"}
        variants={imageVariants}
        custom={direction}
        initial="enter"
        animate="center"
        exit="exit"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`max-w-full w-auto max-h-[calc(100dvh-160px)] object-contain rounded-xl shadow-2xl transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

// ---------- Empty State ----------
function EmptyGallery() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-green1/10 border border-green1/20 flex items-center justify-center">
        <IoCamera className="text-3xl text-green1" />
      </div>
      <div>
        <p className="text-gray-600 font-medium text-sm">No gallery images yet</p>
        <p className="text-gray-400 text-xs mt-1">Check back soon for campus photos and videos.</p>
      </div>
    </div>
  );
}

// ---------- Loading Skeleton ----------
function GallerySkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 auto-rows-[120px] sm:auto-rows-[150px]">
      <div className="col-span-2 row-span-2 rounded-2xl bg-gray-100 animate-pulse" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}

// ---------- Stats Pill ----------
function StatPill({ count, label }: { count: number; label: string }) {
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 shadow-sm rounded-full px-4 py-2">
      <span className="text-green1 font-bold text-base leading-none">{count}</span>
      <span className="text-gray-500 text-xs font-medium">{label}</span>
    </div>
  );
}

// ---------- Lightbox View (with swipe support) ----------
function LightboxView({
  items,
  selectedIndex,
  direction,
  navigateMedia,
}: {
  items: GalleryItem[];
  selectedIndex: number;
  direction: number;
  navigateMedia: (dir: number) => void;
}) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only trigger if horizontal swipe is dominant and long enough
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      navigateMedia(dx < 0 ? 1 : -1);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div
      className="flex-1 flex flex-col relative select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Media — fills all available space */}
      <div className="flex-1 flex items-center justify-center w-full py-4 px-4 sm:px-6 min-h-0">
        <AnimatePresence mode="wait" custom={direction}>
          <LightboxMedia
            key={items[selectedIndex]?.id}
            item={items[selectedIndex]}
            direction={direction}
          />
        </AnimatePresence>
      </div>

      {/* Caption */}
      {items[selectedIndex]?.caption && (
        <p className="px-4 pb-10 text-white/60 text-xs sm:text-sm text-center max-w-lg mx-auto leading-relaxed">
          {items[selectedIndex].caption}
        </p>
      )}

      {/* Prev / Next buttons — vertically centered on the media area, outside the image */}
      {items.length > 1 && (
        <>
          <button
            onClick={() => navigateMedia(-1)}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 p-2.5 sm:p-3.5 rounded-full bg-black/40 hover:bg-black/60 active:bg-black/70 text-white transition-all duration-200 backdrop-blur-sm shadow-lg border border-white/10 touch-manipulation"
            aria-label="Previous"
          >
            <IoChevronBack className="text-lg sm:text-2xl" />
          </button>
          <button
            onClick={() => navigateMedia(1)}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 p-2.5 sm:p-3.5 rounded-full bg-black/40 hover:bg-black/60 active:bg-black/70 text-white transition-all duration-200 backdrop-blur-sm shadow-lg border border-white/10 touch-manipulation"
            aria-label="Next"
          >
            <IoChevronForward className="text-lg sm:text-2xl" />
          </button>
        </>
      )}
    </div>
  );
}

// ---------- Animated Gallery SVG Icon ----------
function AnimatedGalleryIcon() {
  return (
    <motion.div
      className="relative w-7 h-7 flex items-center justify-center"
      whileHover="hover"
      animate="rest"
    >
      {/* Pulsing background ring — animates continuously on hover */}
      <motion.span
        className="absolute inset-0 rounded-lg bg-green1/25"
        variants={{
          rest: { scale: 1, opacity: 0.5 },
          hover: {
            scale: [1, 1.4, 1],
            opacity: [0.5, 0, 0.5],
            transition: { duration: 1, repeat: Infinity, ease: "easeOut" },
          },
        }}
      />

      {/* SVG drawn with motion.path so pathLength animations work */}
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="relative z-10"
        aria-hidden="true"
      >
        {/* Frame */}
        <motion.path
          d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Z"
          stroke="#00875a"
          strokeWidth="1.6"
          variants={{
            rest: { pathLength: 1, opacity: 1 },
            hover: {
              pathLength: [1, 0.4, 1],
              opacity: [1, 0.6, 1],
              transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
            },
          }}
        />
        {/* Mountain landscape */}
        <motion.path
          d="M3 16 7.5 11l4 3.5 4-5L21 16"
          stroke="#00875a"
          strokeWidth="1.6"
          fill="none"
          variants={{
            rest: { pathLength: 1, opacity: 1 },
            hover: {
              pathLength: [0, 1],
              opacity: [0.4, 1],
              transition: { duration: 0.9, repeat: Infinity, ease: "easeInOut", delay: 0.15 },
            },
          }}
        />
        {/* Sun dot */}
        <motion.circle
          cx="8.5"
          cy="8.5"
          r="1.5"
          fill="#00875a"
          stroke="none"
          variants={{
            rest: { scale: 1, opacity: 1 },
            hover: {
              scale: [1, 1.8, 1],
              opacity: [1, 0.3, 1],
              transition: { duration: 0.9, repeat: Infinity, ease: "easeInOut", delay: 0.1 },
            },
          }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
      </svg>
    </motion.div>
  );
}

type FilterTab = "all" | "image" | "video";

// ---------- Main Gallery ----------
export default function Gallery() {
  const { items, loading } = useCloudinaryGallery();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [viewMode, setViewMode] = useState<"lightbox" | "grid">("grid");
  const [visibleCount, setVisibleCount] = useState(20);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  // Snapshot of items used inside the lightbox so filter changes go to grid first
  const [lightboxItems, setLightboxItems] = useState<GalleryItem[]>([]);

  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "0px 0px -80px 0px" });

  const previewItems = items.slice(0, PREVIEW_COUNT);
  const imageCount = items.filter((i) => i.type === "image").length;
  const videoCount = items.filter((i) => i.type === "video").length;

  const filteredItems =
    activeFilter === "all"
      ? items
      : items.filter((i) => i.type === activeFilter);

  const handleFilterChange = (tab: FilterTab) => {
    setActiveFilter(tab);
    setVisibleCount(20);
    // always switch to grid when changing filter so results are visible
    setViewMode("grid");
  };

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      const nearBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 200;
      if (nearBottom && visibleCount < filteredItems.length) {
        setVisibleCount((prev) => Math.min(prev + 20, filteredItems.length));
      }
    },
    [visibleCount, filteredItems.length]
  );

  const openModal = (index: number, mode: "lightbox" | "grid" = "grid", sourceItems?: GalleryItem[]) => {
    setSelectedIndex(index);
    setViewMode(mode);
    setIsModalOpen(true);
    setVisibleCount(20);
    setActiveFilter("all");
    // Snapshot the items the lightbox should navigate within
    setLightboxItems(sourceItems ?? items);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setVisibleCount(20);
    document.body.style.overflow = "unset";
  };

  const navigateMedia = useCallback(
    (newDirection: number) => {
      setDirection(newDirection);
      setSelectedIndex((prev) => {
        const next = prev + newDirection;
        if (next < 0) return lightboxItems.length - 1;
        if (next >= lightboxItems.length) return 0;
        return next;
      });
    },
    [lightboxItems.length]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isModalOpen) return;
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") navigateMedia(-1);
      if (e.key === "ArrowRight") navigateMedia(1);
    },
    [isModalOpen, navigateMedia]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* ===== Section wrapper — clean white background ===== */}
      <section ref={sectionRef} className="w-full bg-white overflow-hidden">

        {/* Top divider */}
        <div className="h-px w-full bg-gray-100" />

        <div className="box-width">
          <div className="section">

            {/* ===== Section header ===== */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
              <div>
                {/* Tag */}
                <motion.div
                  variants={fadeUp}
                  initial="initial"
                  animate={isInView ? "animate" : "initial"}
                  custom={0}
                  className="flex items-center gap-2 mb-3"
                >
                  <span className="inline-flex items-center gap-2 bg-green1/10 text-green1 text-xs font-semibold pl-1 pr-3 py-1 rounded-full uppercase tracking-wider border border-green1/20">
                    <AnimatedGalleryIcon />
                    Our Gallery
                  </span>
                </motion.div>

                {/* Heading */}
                <motion.div
                  variants={fadeUp}
                  initial="initial"
                  animate={isInView ? "animate" : "initial"}
                  custom={1}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <div className="bar-style" />
                  </div>
                  <h2 className="text-gray-900 text-balance">
                    Campus Life in{" "}
                    <span className="text-green1">Pictures</span>
                  </h2>
                </motion.div>

                {/* Sub-heading */}
                <motion.p
                  variants={fadeUp}
                  initial="initial"
                  animate={isInView ? "animate" : "initial"}
                  custom={2}
                  className="text-gray-500 text-sm leading-relaxed mt-2 max-w-md"
                >
                  Capturing every moment — campus life, events, achievements, and the vibrant community that makes EBSU MSA special.
                </motion.p>
              </div>

              {/* Right side: stats + CTA */}
              <motion.div
                variants={fadeUp}
                initial="initial"
                animate={isInView ? "animate" : "initial"}
                custom={3}
                className="flex items-center gap-3 flex-wrap"
              >
                {!loading && imageCount > 0 && <StatPill count={imageCount} label="Photos" />}
                {!loading && videoCount > 0 && <StatPill count={videoCount} label="Videos" />}
                {!loading && items.length > PREVIEW_COUNT && (
                  <button
                    onClick={() => openModal(0, "grid")}
                    className="group flex items-center gap-2 bg-green1 hover:bg-green-700 text-white font-semibold text-sm px-5 py-2.5 rounded-full shadow-md shadow-green1/20 hover:shadow-green1/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green1 focus:ring-offset-2"
                    aria-label="View all photos"
                  >
                    <span>View all</span>
                    <IoArrowForward className="text-sm group-hover:translate-x-0.5 transition-transform duration-200" />
                  </button>
                )}
              </motion.div>
            </div>

            {/* ===== Bento Grid ===== */}
            {loading ? (
              <GallerySkeleton />
            ) : items.length === 0 ? (
              <EmptyGallery />
            ) : (
              <motion.div
                variants={fadeUp}
                initial="initial"
                animate={isInView ? "animate" : "initial"}
                custom={4}
                className="grid grid-cols-3 sm:grid-cols-4 gap-3 auto-rows-[130px] sm:auto-rows-[160px] lg:auto-rows-[180px]"
              >
                {/* Hero cell: col-span-2, row-span-2 */}
                {previewItems[0] && (
                  <motion.div
                    variants={staggerCard}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                    custom={0}
                    className="col-span-2 row-span-2 relative overflow-hidden rounded-2xl shadow-md shadow-black/8 ring-1 ring-black/5"
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.25 }}
                  >
                    <MediaCard item={previewItems[0]} onClick={() => openModal(0, "lightbox")} eager />
                    {previewItems[0].caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent rounded-b-2xl px-4 py-3 opacity-0 group-hover:opacity-100 pointer-events-none">
                        <p className="text-white text-xs truncate">{previewItems[0].caption}</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Cells 1–4: standard squares */}
                {previewItems.slice(1, 5).map((item, idx) => (
                  <motion.div
                    key={item.id}
                    variants={staggerCard}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                    custom={idx + 1}
                    className="relative overflow-hidden rounded-2xl shadow-sm shadow-black/6 ring-1 ring-black/5"
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.25 }}
                  >
                    <MediaCard item={item} onClick={() => openModal(idx + 1, "lightbox")} eager={idx < 2} />
                  </motion.div>
                ))}

                {/* Cells 5–6: wide strip (2 cols each on small, 1 on large) */}
                {previewItems.slice(5, 7).map((item, idx) => (
                  <motion.div
                    key={item.id}
                    variants={staggerCard}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                    custom={idx + 5}
                    className="col-span-1 sm:col-span-2 relative overflow-hidden rounded-2xl shadow-sm shadow-black/6 ring-1 ring-black/5"
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.25 }}
                  >
                    <MediaCard item={item} onClick={() => openModal(idx + 5, "lightbox")} />
                  </motion.div>
                ))}

                {/* "More" overlay tile if there are extra items */}
                {items.length > PREVIEW_COUNT && (
                  <motion.div
                    variants={staggerCard}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                    custom={7}
                    className="col-span-full sm:col-span-1 relative overflow-hidden rounded-2xl cursor-pointer ring-1 ring-black/5 bg-gray-50"
                    onClick={() => openModal(0, "grid")}
                    whileHover={{ y: -2, scale: 1.01 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* Background image faded */}
                    {previewItems[6] && (
                      <img
                        src={previewItems[6]?.url || previewItems[0].url}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-30"
                        loading="lazy"
                        decoding="async"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative z-10 flex flex-col items-center justify-center h-full gap-1.5 px-3">
                      <div className="w-10 h-10 rounded-full bg-green1/10 border-2 border-green1/30 flex items-center justify-center">
                        <IoImages className="text-green1 text-lg" />
                      </div>
                      <span className="text-green1 font-bold text-sm text-center leading-tight">
                        +{items.length - PREVIEW_COUNT} more
                      </span>
                      <span className="text-gray-500 text-xs text-center">View all</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

          </div>
        </div>

        {/* Bottom divider */}
        <div className="h-px w-full bg-gray-100" />
      </section>

      {/* ===== Full-screen modal ===== */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex flex-col"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)" }}
          >
            {/* Modal Header */}
            <div className="flex flex-col border-b border-white/10">
              {/* Top bar: back (lightbox only) + title + close */}
              <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  {viewMode === "lightbox" ? (
                    <button
                      onClick={() => setViewMode("grid")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-medium transition-colors"
                      aria-label="Back to grid"
                    >
                      <IoGrid className="text-sm" />
                      <span>Grid</span>
                    </button>
                  ) : (
                    <span className="text-white font-semibold text-sm">Gallery</span>
                  )}
                </div>
                {/* Counter in header when in lightbox */}
                {viewMode === "lightbox" && (
                  <span className="text-white/40 text-xs">
                    {selectedIndex + 1} / {lightboxItems.length}
                  </span>
                )}
                <button
                  onClick={closeModal}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors text-white touch-manipulation"
                  aria-label="Close gallery"
                >
                  <IoClose className="text-xl" />
                </button>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1.5 px-5 pb-3">
                {(
                  [
                    { key: "all" as FilterTab, label: "All", count: items.length },
                    { key: "image" as FilterTab, label: "Photos", count: imageCount, icon: <IoCamera className="text-sm" /> },
                    { key: "video" as FilterTab, label: "Videos", count: videoCount, icon: <IoVideocam className="text-sm" /> },
                  ] as { key: FilterTab; label: string; count: number; icon?: React.ReactNode }[]
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleFilterChange(tab.key)}
                    disabled={tab.count === 0}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${
                      activeFilter === tab.key
                        ? "bg-green1 text-white shadow-md shadow-green1/30"
                        : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                    }`}
                    aria-pressed={activeFilter === tab.key}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    <span
                      className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                        activeFilter === tab.key
                          ? "bg-white/20 text-white"
                          : "bg-white/10 text-white/50"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Content */}
            {viewMode === "grid" ? (
              <div className="flex-1 overflow-y-auto p-5" onScroll={handleScroll}>
                <div className="max-w-7xl mx-auto">
                  {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                        {activeFilter === "video" ? (
                          <IoVideocam className="text-2xl text-white/40" />
                        ) : (
                          <IoCamera className="text-2xl text-white/40" />
                        )}
                      </div>
                      <p className="text-white/40 text-sm">
                        No {activeFilter === "video" ? "videos" : "photos"} yet
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-white/30 text-xs mb-5 text-center">
                        Showing {Math.min(visibleCount, filteredItems.length)} of {filteredItems.length}{" "}
                        {activeFilter === "all" ? "items" : activeFilter === "video" ? "videos" : "photos"}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {filteredItems.slice(0, visibleCount).map((item, index) => {
                          const openLightbox = () => {
                            setLightboxItems(filteredItems);
                            setSelectedIndex(index);
                            setDirection(0);
                            setViewMode("lightbox");
                          };
                          return (
                            <motion.div
                              key={item.id}
                              variants={gridItemVariants}
                              initial="hidden"
                              animate="visible"
                              custom={index % 20}
                              className="relative group aspect-square overflow-hidden rounded-xl ring-1 ring-white/10 cursor-pointer"
                              onClick={openLightbox}
                            >
                              <MediaCard
                                item={item}
                                onClick={openLightbox}
                                showOverlay
                              />
                            </motion.div>
                          );
                        })}
                      </div>
                      {visibleCount < filteredItems.length && (
                        <p className="text-white/30 text-xs text-center mt-6">Scroll down to load more...</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* Lightbox */
              <LightboxView
                items={lightboxItems}
                selectedIndex={selectedIndex}
                direction={direction}
                navigateMedia={navigateMedia}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
