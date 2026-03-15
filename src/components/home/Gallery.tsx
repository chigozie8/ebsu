import { useState, useCallback, useEffect, useRef } from "react";
import Lottie from "lottie-react";
import gallery from "../../json/animation/gallery.json";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInVariants3 } from "../../animation/variants";
import {
  IoClose,
  IoChevronBack,
  IoChevronForward,
  IoGrid,
  IoImages,
  IoPlay,
  IoVideocam,
} from "react-icons/io5";

// Lazy glob — modules are NOT bundled eagerly; each file is only fetched when called
const imageModules = import.meta.glob(
  "../../assets/img/gallery/*.{jpg,jpeg,png,webp,gif}",
  { eager: false, import: "default" }
) as Record<string, () => Promise<string>>;

const videoModules = import.meta.glob(
  "../../assets/img/gallery/*.{mp4,webm,mov,avi,mkv}",
  { eager: false, import: "default" }
) as Record<string, () => Promise<string>>;

interface MediaItem {
  src: string;
  alt: string;
  type: "image" | "video";
}

function buildLabel(path: string, fallback: string) {
  return (
    path
      .split("/")
      .pop()
      ?.split(".")[0]
      ?.replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace(/IMG.*WA/i, "Campus")
      .replace(/\d+/g, "")
      .trim() || fallback
  );
}

// Build a stable list of items with their loader functions (no URLs loaded yet)
interface LazyMediaItem {
  load: () => Promise<string>;
  alt: string;
  type: "image" | "video";
}

const lazyImageItems: LazyMediaItem[] = Object.entries(imageModules).map(
  ([path, loader]) => ({
    load: loader,
    alt: buildLabel(path, "Campus View"),
    type: "image" as const,
  })
);

const lazyVideoItems: LazyMediaItem[] = Object.entries(videoModules).map(
  ([path, loader]) => ({
    load: loader,
    alt: buildLabel(path, "Campus Video"),
    type: "video" as const,
  })
);

const allLazyMedia: LazyMediaItem[] = [...lazyVideoItems, ...lazyImageItems];

const PREVIEW_COUNT = 8;

// ---------- animation variants ----------
const fadeInVariants1 = {
  initial: { opacity: 0, y: 100 },
  animate: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 * index, duration: 0.4 },
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

// ---------- LazyImage ----------
// Resolves the module URL on first render, then shows the image lazily
function LazyImage({
  item,
  onClick,
  className = "",
  eager = false,
}: {
  item: LazyMediaItem;
  onClick?: () => void;
  className?: string;
  eager?: boolean;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    item.load().then((url) => {
      if (mountedRef.current) setSrc(url as string);
    });
    return () => { mountedRef.current = false; };
  }, [item]);

  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <IoImages className="text-gray-400 text-2xl" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {(!isLoaded || !src) && (
        <div className={`absolute inset-0 bg-gray-200 animate-pulse rounded-lg`} />
      )}
      {src && (
        <img
          src={src}
          alt={item.alt}
          onClick={onClick}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`${className} ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
        />
      )}
    </div>
  );
}

// ---------- LazyVideoThumbnail ----------
// Only loads video metadata once the src has been resolved
function LazyVideoThumbnail({
  item,
  onClick,
  className = "",
}: {
  item: LazyMediaItem;
  onClick?: () => void;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    item.load().then((url) => {
      if (mountedRef.current) setSrc(url as string);
    });
    return () => { mountedRef.current = false; };
  }, [item]);

  if (hasError) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        onClick={onClick}
      >
        <IoVideocam className="text-gray-400 text-2xl" />
      </div>
    );
  }

  return (
    <div className="relative cursor-pointer w-full h-full" onClick={onClick}>
      {(!isLoaded || !src) && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
      )}
      {src && (
        <video
          src={src}
          muted
          playsInline
          preload="none"
          onLoadedData={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`${className} ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
        />
      )}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-black/50 rounded-full p-3 backdrop-blur-sm">
          <IoPlay className="text-white text-xl ml-0.5" />
        </div>
      </div>
    </div>
  );
}

// ---------- ResolvedMedia ----------
// Used in the lightbox — resolves src on demand and caches in a map
const srcCache = new Map<number, string>();

function ResolvedMedia({
  index,
  direction,
}: {
  index: number;
  direction: number;
}) {
  const item = allLazyMedia[index];
  const [src, setSrc] = useState<string | null>(srcCache.get(index) ?? null);

  useEffect(() => {
    if (srcCache.has(index)) {
      setSrc(srcCache.get(index)!);
      return;
    }
    item.load().then((url) => {
      srcCache.set(index, url as string);
      setSrc(url as string);
    });
  }, [index, item]);

  if (!src) {
    return (
      <div className="flex items-center justify-center w-full h-[calc(100vh-180px)]">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
      </div>
    );
  }

  return item.type === "video" ? (
    <motion.video
      key={index}
      src={src}
      variants={imageVariants}
      custom={direction}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3 }}
      controls
      autoPlay
      className="max-w-full max-h-[calc(100vh-160px)] sm:max-h-[calc(100vh-180px)] object-contain rounded-lg shadow-2xl"
    />
  ) : (
    <motion.img
      key={index}
      src={src}
      alt={item.alt}
      variants={imageVariants}
      custom={direction}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3 }}
      decoding="async"
      className="max-w-full max-h-[calc(100vh-160px)] sm:max-h-[calc(100vh-180px)] object-contain rounded-lg shadow-2xl"
    />
  );
}

// ---------- ThumbnailStrip ----------
function ThumbnailStrip({
  selectedMediaIndex,
  onSelect,
}: {
  selectedMediaIndex: number;
  onSelect: (index: number) => void;
}) {
  const start = Math.max(0, selectedMediaIndex - 4);
  const end = Math.min(allLazyMedia.length, selectedMediaIndex + 5);
  const slice = allLazyMedia.slice(start, end);

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 hidden md:flex gap-1 bg-black/40 backdrop-blur-sm p-2 rounded-xl max-w-[90vw] overflow-x-auto">
      {slice.map((item, i) => {
        const actualIndex = start + i;
        return (
          <ThumbnailButton
            key={actualIndex}
            item={item}
            actualIndex={actualIndex}
            isActive={actualIndex === selectedMediaIndex}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
}

function ThumbnailButton({
  item,
  actualIndex,
  isActive,
  onSelect,
}: {
  item: LazyMediaItem;
  actualIndex: number;
  isActive: boolean;
  onSelect: (index: number) => void;
}) {
  const [src, setSrc] = useState<string | null>(srcCache.get(actualIndex) ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!srcCache.has(actualIndex)) {
      item.load().then((url) => {
        if (mountedRef.current) {
          srcCache.set(actualIndex, url as string);
          setSrc(url as string);
        }
      });
    }
    return () => { mountedRef.current = false; };
  }, [actualIndex, item]);

  return (
    <button
      onClick={() => onSelect(actualIndex)}
      className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden transition-all relative bg-gray-700 ${
        isActive ? "ring-2 ring-white scale-110" : "opacity-60 hover:opacity-100"
      }`}
    >
      {src ? (
        item.type === "video" ? (
          <>
            <video
              src={src}
              muted
              playsInline
              preload="none"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <IoPlay className="text-white text-xs" />
            </div>
          </>
        ) : (
          <img
            src={src}
            alt={item.alt}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        )
      ) : (
        <div className="w-full h-full animate-pulse bg-gray-600" />
      )}
    </button>
  );
}

// ---------- Main Gallery ----------
export default function Gallery() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [viewMode, setViewMode] = useState<"lightbox" | "grid">("grid");
  const [visibleCount, setVisibleCount] = useState(20);

  const previewMedia = allLazyMedia.slice(0, PREVIEW_COUNT);
  const imageCount = lazyImageItems.length;
  const videoCount = lazyVideoItems.length;

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      const bottom =
        target.scrollHeight - target.scrollTop <= target.clientHeight + 200;
      if (bottom && visibleCount < allLazyMedia.length) {
        setVisibleCount((prev) => Math.min(prev + 20, allLazyMedia.length));
      }
    },
    [visibleCount]
  );

  const openModal = (index: number, mode: "lightbox" | "grid" = "grid") => {
    setSelectedMediaIndex(index);
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
    setSelectedMediaIndex((prev) => {
      const newIndex = prev + newDirection;
      if (newIndex < 0) return allLazyMedia.length - 1;
      if (newIndex >= allLazyMedia.length) return 0;
      return newIndex;
    });
  }, []);

  const handleThumbnailSelect = useCallback(
    (index: number) => {
      setDirection(index > selectedMediaIndex ? 1 : -1);
      setSelectedMediaIndex(index);
    },
    [selectedMediaIndex]
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
      <div className="box-width">
        <div className="section">
          <div className="flex justify-between items-center flex-col-reverse md:flex-row gap-6">
            <div className="basis-1/2">
              <div className="p-0 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {previewMedia.map((item, index) => (
                    <motion.div
                      key={index}
                      variants={fadeInVariants1}
                      initial="initial"
                      whileInView="animate"
                      viewport={{ once: true }}
                      custom={index + 1}
                      className="relative group overflow-hidden rounded-xl aspect-square"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {item.type === "video" ? (
                        <LazyVideoThumbnail
                          item={item}
                          onClick={() => openModal(index, "lightbox")}
                          className="w-full h-full object-cover cursor-pointer rounded-xl"
                        />
                      ) : (
                        <LazyImage
                          item={item}
                          onClick={() => openModal(index, "lightbox")}
                          eager={index < 4}
                          className="w-full h-full object-cover cursor-pointer rounded-xl"
                        />
                      )}
                      <div
                        className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 rounded-xl cursor-pointer"
                        onClick={() => openModal(index, "lightbox")}
                      />
                    </motion.div>
                  ))}
                </div>

                {allLazyMedia.length > PREVIEW_COUNT && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="mt-8 flex justify-center"
                  >
                    <button
                      onClick={() => openModal(0, "grid")}
                      className="group relative overflow-hidden bg-white border-2 border-green1 rounded-xl px-6 py-3.5 transition-all duration-300 hover:shadow-lg hover:shadow-green1/20 hover:border-green2"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-green1 to-green2 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      <span className="relative flex items-center gap-3">
                        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-green1 group-hover:bg-white/20 transition-colors duration-300">
                          <IoImages className="text-xl text-white group-hover:text-white" />
                        </span>
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-white transition-colors duration-300">
                          View All Media
                        </span>
                        <span className="flex items-center justify-center ml-2 w-8 h-8 rounded-full bg-green1/10 group-hover:bg-white/20 transition-colors duration-300">
                          <IoChevronForward className="text-green1 group-hover:text-white transition-colors duration-300" />
                        </span>
                      </span>
                    </button>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="basis-1/2">
              <motion.h2
                variants={fadeInVariants3}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                custom={1}
              >
                <div className="bar-style" />
                Gallery
              </motion.h2>
              <motion.h3
                variants={fadeInVariants3}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                custom={2}
                className="text-gray-700 font-[500] text-ss ss:text-sm xlg:text-xs"
              >
                Explore the view
              </motion.h3>
              <Lottie animationData={gallery} className="md:w-[80%] w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Gallery Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] bg-black/95 flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-4">
                <h3 className="text-white font-medium">
                  Gallery ({imageCount} photos
                  {videoCount > 0 ? `, ${videoCount} videos` : ""})
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === "grid"
                        ? "bg-white/20 text-white"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                    aria-label="Grid view"
                  >
                    <IoGrid className="text-xl" />
                  </button>
                </div>
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
                  <div className="text-white/60 text-sm mb-4 text-center">
                    Showing {Math.min(visibleCount, allLazyMedia.length)} of{" "}
                    {allLazyMedia.length} items ({imageCount} photos
                    {videoCount > 0 ? `, ${videoCount} videos` : ""})
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {allLazyMedia.slice(0, visibleCount).map((item, index) => (
                      <motion.div
                        key={index}
                        variants={gridItemVariants}
                        initial="hidden"
                        animate="visible"
                        custom={index % 20}
                        className="relative group aspect-square overflow-hidden rounded-lg"
                      >
                        {item.type === "video" ? (
                          <LazyVideoThumbnail
                            item={item}
                            onClick={() => {
                              setSelectedMediaIndex(index);
                              setViewMode("lightbox");
                            }}
                            className="w-full h-full object-cover cursor-pointer"
                          />
                        ) : (
                          <>
                            <LazyImage
                              item={item}
                              onClick={() => {
                                setSelectedMediaIndex(index);
                                setViewMode("lightbox");
                              }}
                              className="w-full h-full object-cover cursor-pointer"
                            />
                            <div
                              className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 cursor-pointer flex items-center justify-center"
                              onClick={() => {
                                setSelectedMediaIndex(index);
                                setViewMode("lightbox");
                              }}
                            >
                              <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                                View
                              </span>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </div>
                  {visibleCount < allLazyMedia.length && (
                    <div className="text-center py-6">
                      <div className="inline-flex items-center gap-2 text-white/60 text-sm">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
                        Scroll for more...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Lightbox View */
              <div className="flex-1 flex items-center justify-center relative">
                <button
                  onClick={() => navigateMedia(-1)}
                  className="absolute left-2 sm:left-4 z-10 p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white backdrop-blur-sm"
                  aria-label="Previous media"
                >
                  <IoChevronBack className="text-xl sm:text-2xl" />
                </button>

                <button
                  onClick={() => navigateMedia(1)}
                  className="absolute right-2 sm:right-4 z-10 p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white backdrop-blur-sm"
                  aria-label="Next media"
                >
                  <IoChevronForward className="text-xl sm:text-2xl" />
                </button>

                <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-hidden">
                  <AnimatePresence initial={false} custom={direction} mode="wait">
                    <ResolvedMedia
                      key={selectedMediaIndex}
                      index={selectedMediaIndex}
                      direction={direction}
                    />
                  </AnimatePresence>
                </div>

                {/* Media Info & Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                  <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium flex items-center gap-2">
                    {allLazyMedia[selectedMediaIndex]?.type === "video" && (
                      <IoVideocam className="text-sm" />
                    )}
                    {selectedMediaIndex + 1} / {allLazyMedia.length}
                  </div>
                  <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-white/80 text-xs max-w-[200px] truncate">
                    {allLazyMedia[selectedMediaIndex]?.alt}
                  </div>
                </div>

                {/* Back to Grid Button */}
                <button
                  onClick={() => setViewMode("grid")}
                  className="absolute top-4 left-4 flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-xs sm:text-sm transition-colors backdrop-blur-sm"
                >
                  <IoGrid />
                  <span className="hidden sm:inline">View All</span>
                </button>

                {/* Thumbnail strip */}
                <ThumbnailStrip
                  selectedMediaIndex={selectedMediaIndex}
                  onSelect={handleThumbnailSelect}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
