import { useState, useCallback, useEffect } from "react";
import Lottie from "lottie-react";
import gallery from "../../json/animation/gallery.json";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInVariants3 } from "../../animation/variants";
import { IoClose, IoChevronBack, IoChevronForward, IoGrid, IoImages } from "react-icons/io5";

// Dynamically import all images from the gallery folder
// This allows unlimited images - just add new images to the folder!
const imageModules = import.meta.glob("../../assets/img/gallery/*.{jpg,jpeg,png,webp,gif}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

// Filter out unsupported formats and create image array
const allImages = Object.entries(imageModules)
  .filter(([path]) => {
    // Skip .heif files as they're not widely supported in browsers
    const ext = path.split(".").pop()?.toLowerCase();
    return ext !== "heif";
  })
  .map(([path, src]) => {
    // Extract filename without extension for alt text
    const filename = path.split("/").pop()?.split(".")[0] || "Campus View";
    // Convert filename to readable alt text (e.g., "front-gate" -> "Front Gate")
    const alt = filename
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace(/IMG.*WA/i, "Campus")
      .replace(/\d+/g, "")
      .trim() || "Campus View";
    return { src: src as string, alt };
  });

const PREVIEW_COUNT = 8; // Number of images to show on home page

const fadeInVariants1 = {
  initial: {
    opacity: 0,
    y: 100,
  },
  animate: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.05 * index,
      duration: 0.4,
    },
  }),
};

const modalVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const imageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const gridItemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (index: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: Math.min(index * 0.02, 0.5), // Cap delay to prevent long waits
      duration: 0.3,
    },
  }),
};

// Image component with loading state
function GalleryImage({
  src,
  alt,
  onClick,
  className = "",
  loading = "lazy",
}: {
  src: string;
  alt: string;
  onClick?: () => void;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <IoImages className="text-gray-400 text-2xl" />
      </div>
    );
  }

  return (
    <div className="relative">
      {!isLoaded && (
        <div className={`absolute inset-0 bg-gray-200 animate-pulse rounded-lg ${className}`} />
      )}
      <img
        src={src}
        alt={alt}
        onClick={onClick}
        loading={loading}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`${className} ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
      />
    </div>
  );
}

export default function Gallery() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [viewMode, setViewMode] = useState<"lightbox" | "grid">("grid");
  const [visibleCount, setVisibleCount] = useState(20); // For infinite scroll in modal

  const previewImages = allImages.slice(0, PREVIEW_COUNT);
  const remainingCount = allImages.length - PREVIEW_COUNT;

  // Load more images when scrolling in grid view
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 200;
    if (bottom && visibleCount < allImages.length) {
      setVisibleCount((prev) => Math.min(prev + 20, allImages.length));
    }
  }, [visibleCount]);

  const openModal = (index: number, mode: "lightbox" | "grid" = "grid") => {
    setSelectedImageIndex(index);
    setViewMode(mode);
    setIsModalOpen(true);
    setVisibleCount(20); // Reset visible count
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setVisibleCount(20);
    document.body.style.overflow = "unset";
  };

  const navigateImage = useCallback(
    (newDirection: number) => {
      setDirection(newDirection);
      setSelectedImageIndex((prev) => {
        const newIndex = prev + newDirection;
        if (newIndex < 0) return allImages.length - 1;
        if (newIndex >= allImages.length) return 0;
        return newIndex;
      });
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isModalOpen) return;
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") navigateImage(-1);
      if (e.key === "ArrowRight") navigateImage(1);
    },
    [isModalOpen, navigateImage]
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
                  {previewImages.map((image, index) => (
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
                      <GalleryImage
                        src={image.src}
                        alt={image.alt}
                        onClick={() => openModal(index, "lightbox")}
                        loading="eager"
                        className="w-full h-full object-cover cursor-pointer rounded-xl"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 rounded-xl cursor-pointer" onClick={() => openModal(index, "lightbox")} />
                    </motion.div>
                  ))}
                </div>

                {/* View All Button */}
                {allImages.length > PREVIEW_COUNT && (
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
                      {/* Background hover effect */}
                      <span className="absolute inset-0 bg-gradient-to-r from-green1 to-green2 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      
                      {/* Button content */}
                      <span className="relative flex items-center gap-3">
                        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-green1 group-hover:bg-white/20 transition-colors duration-300">
                          <IoImages className="text-xl text-white group-hover:text-white" />
                        </span>
                        <span className="flex flex-col items-start">
                          <span className="text-sm font-semibold text-gray-900 group-hover:text-white transition-colors duration-300">
                            View All Photos
                          </span>
                          <span className="text-xs text-gray-500 group-hover:text-white/80 transition-colors duration-300">
                            {allImages.length} images in gallery
                          </span>
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
                  Gallery ({allImages.length} photos)
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
              /* Grid View with Infinite Scroll */
              <div className="flex-1 overflow-y-auto p-4" onScroll={handleScroll}>
                <div className="max-w-7xl mx-auto">
                  {/* Image count indicator */}
                  <div className="text-white/60 text-sm mb-4 text-center">
                    Showing {Math.min(visibleCount, allImages.length)} of {allImages.length} photos
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {allImages.slice(0, visibleCount).map((image, index) => (
                      <motion.div
                        key={index}
                        variants={gridItemVariants}
                        initial="hidden"
                        animate="visible"
                        custom={index % 20} // Reset delay for each batch
                        className="relative group aspect-square overflow-hidden rounded-lg"
                      >
                        <GalleryImage
                          src={image.src}
                          alt={image.alt}
                          onClick={() => {
                            setSelectedImageIndex(index);
                            setViewMode("lightbox");
                          }}
                          className="w-full h-full object-cover cursor-pointer"
                        />
                        <div 
                          className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 cursor-pointer flex items-center justify-center"
                          onClick={() => {
                            setSelectedImageIndex(index);
                            setViewMode("lightbox");
                          }}
                        >
                          <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                            View
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {/* Load more indicator */}
                  {visibleCount < allImages.length && (
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
                {/* Navigation Buttons */}
                <button
                  onClick={() => navigateImage(-1)}
                  className="absolute left-2 sm:left-4 z-10 p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white backdrop-blur-sm"
                  aria-label="Previous image"
                >
                  <IoChevronBack className="text-xl sm:text-2xl" />
                </button>

                <button
                  onClick={() => navigateImage(1)}
                  className="absolute right-2 sm:right-4 z-10 p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white backdrop-blur-sm"
                  aria-label="Next image"
                >
                  <IoChevronForward className="text-xl sm:text-2xl" />
                </button>

                {/* Image */}
                <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-hidden">
                  <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.img
                      key={selectedImageIndex}
                      src={allImages[selectedImageIndex]?.src}
                      alt={allImages[selectedImageIndex]?.alt || "Gallery image"}
                      variants={imageVariants}
                      custom={direction}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.3 }}
                      className="max-w-full max-h-[calc(100vh-160px)] sm:max-h-[calc(100vh-180px)] object-contain rounded-lg shadow-2xl"
                    />
                  </AnimatePresence>
                </div>

                {/* Image Info & Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                  <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium">
                    {selectedImageIndex + 1} / {allImages.length}
                  </div>
                  <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-white/80 text-xs max-w-[200px] truncate">
                    {allImages[selectedImageIndex]?.alt}
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

                {/* Thumbnail strip for quick navigation */}
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 hidden md:flex gap-1 bg-black/40 backdrop-blur-sm p-2 rounded-xl max-w-[90vw] overflow-x-auto">
                  {allImages.slice(Math.max(0, selectedImageIndex - 4), Math.min(allImages.length, selectedImageIndex + 5)).map((image, i) => {
                    const actualIndex = Math.max(0, selectedImageIndex - 4) + i;
                    return (
                      <button
                        key={actualIndex}
                        onClick={() => {
                          setDirection(actualIndex > selectedImageIndex ? 1 : -1);
                          setSelectedImageIndex(actualIndex);
                        }}
                        className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden transition-all ${
                          actualIndex === selectedImageIndex
                            ? "ring-2 ring-white scale-110"
                            : "opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={image.src}
                          alt={image.alt}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
