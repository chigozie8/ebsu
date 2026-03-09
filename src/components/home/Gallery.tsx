import { useState, useCallback, useEffect } from "react";
import img1 from "../../assets/img/gallery/l.jpg";
import img2 from "../../assets/img/gallery/oo.jpeg";
import img3 from "../../assets/img/gallery/IMG-20260206-WA0049.jpg";
import img4 from "../../assets/img/gallery/a.jpg";
import img5 from "../../assets/img/gallery/j.jpg";
import img6 from "../../assets/img/gallery/k.jpg";
import img7 from "../../assets/img/gallery/b.jpg";
import img8 from "../../assets/img/gallery/ee.jpg";
import img9 from "../../assets/img/gallery/dd.jpg";
import img10 from "../../assets/img/gallery/cc.jpg";
import img11 from "../../assets/img/gallery/bb.jpg";
import img12 from "../../assets/img/gallery/aa.jpg";
import img13 from "../../assets/img/gallery/c.jpg";
import img14 from "../../assets/img/gallery/g.jpg";
import img15 from "../../assets/img/gallery/h.jpg";
import img16 from "../../assets/img/gallery/i.jpg";
import img17 from "../../assets/img/gallery/front-gate.jpeg";
import img18 from "../../assets/img/gallery/front-gate2.jpg";
import img19 from "../../assets/img/gallery/senate-building.webp";
import img20 from "../../assets/img/gallery/senate.jpg";
import img21 from "../../assets/img/gallery/senate2.jpg";
import img22 from "../../assets/img/gallery/statue.jpg";
import img23 from "../../assets/img/gallery/ict-building.jpg";
import img24 from "../../assets/img/gallery/lecture-hall.jpg";
import img25 from "../../assets/img/gallery/office.jpg";
import img26 from "../../assets/img/gallery/workshop.jpg";
import img27 from "../../assets/img/gallery/aerial-view.jpeg";
import img28 from "../../assets/img/gallery/building1.jpg";
import img29 from "../../assets/img/gallery/ebsu.jpeg";
import img30 from "../../assets/img/gallery/seet.jpeg";
import img31 from "../../assets/img/gallery/fetha.jpg";
import img32 from "../../assets/img/gallery/HEALTH1.jpg";
import img33 from "../../assets/img/gallery/ai.jpg";
import Lottie from "lottie-react";
import gallery from "../../json/animation/gallery.json";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInVariants3 } from "../../animation/variants";
import { IoClose, IoChevronBack, IoChevronForward, IoGrid } from "react-icons/io5";

// All gallery images - add as many as you want here
const allImages = [
  { src: img1, alt: "Campus View 1" },
  { src: img2, alt: "Campus View 2" },
  { src: img3, alt: "Campus View 3" },
  { src: img4, alt: "Campus View 4" },
  { src: img5, alt: "Campus View 5" },
  { src: img6, alt: "Campus View 6" },
  { src: img7, alt: "Campus View 7" },
  { src: img8, alt: "Campus View 8" },
  { src: img9, alt: "Campus View 9" },
  { src: img10, alt: "Campus View 10" },
  { src: img11, alt: "Campus View 11" },
  { src: img12, alt: "Campus View 12" },
  { src: img13, alt: "Campus View 13" },
  { src: img14, alt: "Campus View 14" },
  { src: img15, alt: "Campus View 15" },
  { src: img16, alt: "Campus View 16" },
  { src: img17, alt: "Front Gate" },
  { src: img18, alt: "Front Gate 2" },
  { src: img19, alt: "Senate Building" },
  { src: img20, alt: "Senate" },
  { src: img21, alt: "Senate 2" },
  { src: img22, alt: "Statue" },
  { src: img23, alt: "ICT Building" },
  { src: img24, alt: "Lecture Hall" },
  { src: img25, alt: "Office" },
  { src: img26, alt: "Workshop" },
  { src: img27, alt: "Aerial View" },
  { src: img28, alt: "Building" },
  { src: img29, alt: "EBSU" },
  { src: img30, alt: "SEET" },
  { src: img31, alt: "FETHA" },
  { src: img32, alt: "Health" },
  { src: img33, alt: "AI" },
];

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
      delay: index * 0.03,
      duration: 0.3,
    },
  }),
};

export default function Gallery() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [viewMode, setViewMode] = useState<"lightbox" | "grid">("grid");

  const previewImages = allImages.slice(0, PREVIEW_COUNT);
  const remainingCount = allImages.length - PREVIEW_COUNT;

  const openModal = (index: number, mode: "lightbox" | "grid" = "grid") => {
    setSelectedImageIndex(index);
    setViewMode(mode);
    setIsModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsModalOpen(false);
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
                <div className="columns-1 gap-2 xxss:columns-2 sm:gap-4 md:columns-3 lg:columns-4 [&>img:not(:first-child)]:mt-4 sm:[&>img:not(:first-child)]:mt-8">
                  {previewImages.map((image, index) => (
                    <motion.img
                      key={index}
                      variants={fadeInVariants1}
                      initial="initial"
                      whileInView="animate"
                      viewport={{ once: true }}
                      custom={index + 1}
                      className="rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity min-h-[90px]"
                      src={image.src}
                      alt={image.alt}
                      onClick={() => openModal(index, "lightbox")}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    />
                  ))}
                </div>

                {/* View All Button */}
                {remainingCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 flex justify-center"
                  >
                    <button
                      onClick={() => openModal(0, "grid")}
                      className="group flex items-center gap-2 px-6 py-3 bg-green1 text-white rounded-full font-medium text-sm hover:bg-green5 transition-all shadow-lg hover:shadow-xl"
                    >
                      <IoGrid className="text-lg" />
                      View All Photos
                      <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                        {allImages.length}
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
              /* Grid View */
              <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-7xl mx-auto">
                  <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3">
                    {allImages.map((image, index) => (
                      <motion.div
                        key={index}
                        variants={gridItemVariants}
                        initial="hidden"
                        animate="visible"
                        custom={index}
                        className="mb-3 break-inside-avoid"
                      >
                        <motion.img
                          src={image.src}
                          alt={image.alt}
                          className="w-full rounded-lg cursor-pointer"
                          onClick={() => {
                            setSelectedImageIndex(index);
                            setViewMode("lightbox");
                          }}
                          whileHover={{ scale: 1.03, opacity: 0.9 }}
                          whileTap={{ scale: 0.98 }}
                          loading="lazy"
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Lightbox View */
              <div className="flex-1 flex items-center justify-center relative">
                {/* Navigation Buttons */}
                <button
                  onClick={() => navigateImage(-1)}
                  className="absolute left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                  aria-label="Previous image"
                >
                  <IoChevronBack className="text-2xl" />
                </button>

                <button
                  onClick={() => navigateImage(1)}
                  className="absolute right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                  aria-label="Next image"
                >
                  <IoChevronForward className="text-2xl" />
                </button>

                {/* Image */}
                <div className="w-full h-full flex items-center justify-center p-4 overflow-hidden">
                  <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.img
                      key={selectedImageIndex}
                      src={allImages[selectedImageIndex].src}
                      alt={allImages[selectedImageIndex].alt}
                      variants={imageVariants}
                      custom={direction}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.3 }}
                      className="max-w-full max-h-[calc(100vh-180px)] object-contain rounded-lg"
                    />
                  </AnimatePresence>
                </div>

                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white text-sm">
                  {selectedImageIndex + 1} / {allImages.length}
                </div>

                {/* Back to Grid Button */}
                <button
                  onClick={() => setViewMode("grid")}
                  className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm transition-colors"
                >
                  <IoGrid />
                  View All
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
