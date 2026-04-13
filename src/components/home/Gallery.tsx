import { useState, useCallback, useEffect, useRef } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import galleryAnim from "../../json/animation/gallery.json";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  IoClose,
  IoChevronBack,
  IoChevronForward,
  IoGrid,
  IoImages,
  IoPlay,
  IoVideocam,
  IoCamera,
} from "react-icons/io5";
import { useCloudinaryGallery, type GalleryItem } from "../../hooks/useCloudinaryGallery";
export type { GalleryItem } from "../../hooks/useCloudinaryGallery";

// ---------- animation variants ----------
const cardVariants = {
  initial: { opacity: 0, y: 40, scale: 0.96 },
  animate: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: 0.06 * index, duration: 0.45, ease: "easeOut" },
  }),
};

const headingVariants = {
  initial: { opacity: 0, x: 40 },
  animate: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.15 * index, duration: 0.5, ease: "easeOut" },
  }),
};

const modalVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const imageVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
};

const gridItemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (index: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: Math.min(index * 0.02, 0.5), duration: 0.3 },
  }),
};

// Bento layout: first item is large (2 cols, 2 rows), rest are small squares
const PREVIEW_COUNT = 7;

// ---------- MediaCard ----------
function MediaCard({
  item,
  onClick,
  eager = false,
}: {
  item: GalleryItem;
  onClick: () => void;
  eager?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (item.type === "video") {
    return (
      <div className="relative w-full h-full cursor-pointer" onClick={onClick}>
        {!loaded && (
          <div className="absolute inset-0 bg-green3/40 animate-pulse rounded-2xl" />
        )}
        <video
          src={item.url}
          muted
          playsInline
          preload="metadata"
          onLoadedData={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover rounded-2xl transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-green1/80 rounded-full p-3 backdrop-blur-sm shadow-lg shadow-green1/30">
            <IoPlay className="text-white text-xl ml-0.5" />
          </div>
        </div>
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-green3/40 rounded-2xl">
            <IoVideocam className="text-green5/60 text-2xl" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full cursor-pointer" onClick={onClick}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-green3/40 animate-pulse rounded-2xl" />
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-green3/40 rounded-2xl">
          <IoImages className="text-green5/60 text-2xl" />
        </div>
      ) : (
        <img
          src={item.url}
          alt={item.caption || "Gallery image"}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover rounded-2xl transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}

// ---------- LightboxMedia ----------
function LightboxMedia({ item, direction }: { item: GalleryItem; direction: number }) {
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
        transition={{ duration: 0.3 }}
        controls
        autoPlay
        className="max-w-full max-h-[calc(100vh-160px)] sm:max-h-[calc(100vh-180px)] object-contain rounded-xl shadow-2xl"
      />
    );
  }
  return (
    <motion.img
      key={item.id}
      src={item.url}
      alt={item.caption || "Gallery image"}
      variants={imageVariants}
      custom={direction}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3 }}
      decoding="async"
      className="max-w-full max-h-[calc(100vh-160px)] sm:max-h-[calc(100vh-180px)] object-contain rounded-xl shadow-2xl"
    />
  );
}

// ---------- Empty State ----------
function EmptyGallery() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="w-16 h-16 rounded-full bg-green1/20 border border-green1/30 flex items-center justify-center">
        <IoCamera className="text-3xl text-green5" />
      </div>
      <div>
        <p className="text-white/70 font-medium text-sm">No gallery images yet</p>
        <p className="text-white/40 text-xs mt-1">Check back soon for campus photos and videos.</p>
      </div>
    </div>
  );
}

// ---------- Loading Skeleton ----------
function GallerySkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2.5 auto-rows-[120px] sm:auto-rows-[140px]">
      <div className="col-span-2 row-span-2 rounded-2xl bg-green3/50 animate-pulse" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-green3/50 animate-pulse" />
      ))}
    </div>
  );
}

// ---------- Main Gallery ----------
export default function Gallery() {
  const { items, loading } = useCloudinaryGallery();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [viewMode, setViewMode] = useState<"lightbox" | "grid">("grid");
  const [visibleCount, setVisibleCount] = useState(20);

  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const lottieContainerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(lottieContainerRef, { once: true, margin: "0px 0px -100px 0px" });

  useEffect(() => {
    if (isInView && lottieRef.current) {
      lottieRef.current.play();
    }
  }, [isInView]);

  const previewItems = items.slice(0, PREVIEW_COUNT);
  const imageCount = items.filter((i) => i.type === "image").length;
  const videoCount = items.filter((i) => i.type === "video").length;

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      const nearBottom =
        target.scrollHeight - target.scrollTop <= target.clientHeight + 200;
      if (nearBottom && visibleCount < items.length) {
        setVisibleCount((prev) => Math.min(prev + 20, items.length));
      }
    },
    [visibleCount, items.length]
  );

  const openModal = (index: number, mode: "lightbox" | "grid" = "grid") => {
    setSelectedIndex(index);
    setViewMode(mode);
    setIsModalOpen(true);
    setVisibleCount(20);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setVisibleCount(20);
    document.body.style.overflow = "unset";
  };

  const navigateMedia = useCallback((newDirection: number) => {
    setDirection(newDirection);
    setSelectedIndex((prev) => {
      const next = prev + newDirection;
      if (next < 0) return items.length - 1;
      if (next >= items.length) return 0;
      return next;
    });
  }, [items.length]);

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
      {/* ===== Section wrapper — dark green background ===== */}
      <section className="w-full bg-green3 overflow-hidden">
        {/* subtle top border accent */}
        <div className="h-[3px] w-full bg-green1" />

        <div className="box-width">
          <div className="section">
            <div className="flex flex-col-reverse md:flex-row gap-10 lg:gap-16 items-center">

              {/* ===== LEFT: Bento grid ===== */}
              <div className="w-full md:basis-[55%]">
                {loading ? (
                  <GallerySkeleton />
                ) : items.length === 0 ? (
                  <EmptyGallery />
                ) : (
                  <div className="flex flex-col gap-4">
                    {/* Bento grid */}
                    <div className="grid grid-cols-3 gap-2.5 auto-rows-[120px] sm:auto-rows-[150px] lg:auto-rows-[140px]">
                      {/* Hero cell — spans 2 cols × 2 rows */}
                      {previewItems[0] && (
                        <motion.div
                          variants={cardVariants}
                          initial="initial"
                          whileInView="animate"
                          viewport={{ once: true }}
                          custom={0}
                          className="col-span-2 row-span-2 relative group overflow-hidden rounded-2xl ring-2 ring-green1/20 shadow-xl shadow-green3"
                          whileHover={{ scale: 1.015 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <MediaCard
                            item={previewItems[0]}
                            onClick={() => openModal(0, "lightbox")}
                            eager
                          />
                          {/* hover overlay with subtle green tint */}
                          <div
                            className="absolute inset-0 bg-green1/0 group-hover:bg-green1/10 transition-colors duration-300 rounded-2xl cursor-pointer"
                            onClick={() => openModal(0, "lightbox")}
                          />
                          {/* caption badge */}
                          {previewItems[0].caption && (
                            <div className="absolute bottom-3 left-3 right-3 bg-green3/80 backdrop-blur-sm rounded-xl px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <p className="text-white text-xs truncate">{previewItems[0].caption}</p>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* Smaller cells */}
                      {previewItems.slice(1).map((item, idx) => (
                        <motion.div
                          key={item.id}
                          variants={cardVariants}
                          initial="initial"
                          whileInView="animate"
                          viewport={{ once: true }}
                          custom={idx + 1}
                          className="relative group overflow-hidden rounded-2xl ring-1 ring-green1/10 shadow-md"
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                        >
                          <MediaCard
                            item={item}
                            onClick={() => openModal(idx + 1, "lightbox")}
                            eager={idx < 2}
                          />
                          <div
                            className="absolute inset-0 bg-green1/0 group-hover:bg-green1/15 transition-colors duration-300 rounded-2xl cursor-pointer"
                            onClick={() => openModal(idx + 1, "lightbox")}
                          />
                        </motion.div>
                      ))}
                    </div>

                    {/* View All button */}
                    {items.length > PREVIEW_COUNT && (
                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                        className="flex justify-center pt-2"
                      >
                        <button
                          onClick={() => openModal(0, "grid")}
                          className="group relative overflow-hidden flex items-center gap-3 bg-green1 hover:bg-green5 text-white font-semibold text-sm px-7 py-3.5 rounded-full shadow-lg shadow-green1/30 hover:shadow-green5/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green5 focus:ring-offset-2 focus:ring-offset-green3"
                        >
                          <IoImages className="text-lg" />
                          <span>View all {items.length} photos</span>
                          <IoChevronForward className="text-base opacity-70 group-hover:translate-x-1 transition-transform duration-200" />
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {/* ===== RIGHT: Heading + Lottie ===== */}
              <div className="w-full md:basis-[45%] flex flex-col">
                {/* tag */}
                <motion.div
                  variants={headingVariants}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  custom={0}
                  className="flex items-center gap-2 mb-4"
                >
                  <span className="inline-flex items-center gap-1.5 bg-green1/20 border border-green1/30 text-green5 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                    <IoCamera className="text-sm" />
                    Our Gallery
                  </span>
                </motion.div>

                {/* heading */}
                <motion.h2
                  variants={headingVariants}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  custom={1}
                  className="text-white text-balance"
                >
                  <div className="bar-style" />
                  Gallery
                </motion.h2>

                {/* sub-heading */}
                <motion.p
                  variants={headingVariants}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  custom={2}
                  className="text-white/60 text-sm leading-relaxed mt-2 max-w-sm"
                >
                  Capturing every moment — campus life, events, achievements, and the vibrant community that makes EBSU MSA special.
                </motion.p>

                {/* stats row */}
                {!loading && items.length > 0 && (
                  <motion.div
                    variants={headingVariants}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                    custom={3}
                    className="flex gap-4 mt-5"
                  >
                    {imageCount > 0 && (
                      <div className="flex flex-col items-center justify-center bg-green1/15 border border-green1/25 rounded-xl px-5 py-3 min-w-[80px]">
                        <span className="text-green5 font-bold text-xl leading-none">{imageCount}</span>
                        <span className="text-white/50 text-xs mt-1">Photos</span>
                      </div>
                    )}
                    {videoCount > 0 && (
                      <div className="flex flex-col items-center justify-center bg-green1/15 border border-green1/25 rounded-xl px-5 py-3 min-w-[80px]">
                        <span className="text-green5 font-bold text-xl leading-none">{videoCount}</span>
                        <span className="text-white/50 text-xs mt-1">Videos</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Lottie animation */}
                <div ref={lottieContainerRef} className="mt-4 md:mt-2">
                  <Lottie
                    lottieRef={lottieRef}
                    animationData={galleryAnim}
                    loop={false}
                    autoplay={false}
                    className="w-[75%] md:w-[85%] opacity-90"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* subtle bottom border accent */}
        <div className="h-[3px] w-full bg-green1/40" />
      </section>

      {/* ===== Full-screen modal (unchanged functionality) ===== */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex flex-col"
            style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(18px)" }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-4">
                <h3 className="text-green5 font-semibold text-sm">
                  Gallery ({imageCount} photo{imageCount !== 1 ? "s" : ""}
                  {videoCount > 0 ? `, ${videoCount} video${videoCount !== 1 ? "s" : ""}` : ""})
                </h3>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "grid"
                      ? "bg-green1/30 text-green5"
                      : "text-white/50 hover:text-white hover:bg-white/10"
                  }`}
                  aria-label="Grid view"
                >
                  <IoGrid className="text-xl" />
                </button>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
                aria-label="Close gallery"
              >
                <IoClose className="text-2xl" />
              </button>
            </div>

            {/* Modal Content */}
            {viewMode === "grid" ? (
              <div className="flex-1 overflow-y-auto p-4" onScroll={handleScroll}>
                <div className="max-w-7xl mx-auto">
                  <p className="text-white/40 text-xs mb-4 text-center">
                    Showing {Math.min(visibleCount, items.length)} of {items.length} items
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {items.slice(0, visibleCount).map((item, index) => (
                      <motion.div
                        key={item.id}
                        variants={gridItemVariants}
                        initial="hidden"
                        animate="visible"
                        custom={index % 20}
                        className="relative group aspect-square overflow-hidden rounded-xl ring-1 ring-white/10"
                      >
                        <MediaCard
                          item={item}
                          onClick={() => {
                            setSelectedIndex(index);
                            setDirection(0);
                            setViewMode("lightbox");
                          }}
                        />
                      </motion.div>
                    ))}
                  </div>
                  {visibleCount < items.length && (
                    <p className="text-white/30 text-xs text-center mt-6">
                      Scroll down to load more...
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Lightbox */
              <div className="flex-1 flex flex-col items-center justify-center relative px-4 py-6">
                <AnimatePresence mode="wait" custom={direction}>
                  <LightboxMedia
                    key={items[selectedIndex]?.id}
                    item={items[selectedIndex]}
                    direction={direction}
                  />
                </AnimatePresence>

                {items.length > 1 && (
                  <>
                    <button
                      onClick={() => navigateMedia(-1)}
                      className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-green1/50 hover:bg-green1/80 text-white transition-all backdrop-blur-sm shadow-lg"
                      aria-label="Previous"
                    >
                      <IoChevronBack className="text-xl sm:text-2xl" />
                    </button>
                    <button
                      onClick={() => navigateMedia(1)}
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-green1/50 hover:bg-green1/80 text-white transition-all backdrop-blur-sm shadow-lg"
                      aria-label="Next"
                    >
                      <IoChevronForward className="text-xl sm:text-2xl" />
                    </button>
                  </>
                )}

                {items[selectedIndex]?.caption && (
                  <p className="mt-4 text-white/60 text-sm text-center max-w-lg">
                    {items[selectedIndex].caption}
                  </p>
                )}

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-green3/70 backdrop-blur-sm rounded-full px-4 py-1.5 text-white/60 text-xs border border-green1/20">
                  {selectedIndex + 1} / {items.length}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
