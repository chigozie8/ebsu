import { useState, useEffect } from "react";
import Footer from "../../../components/footer/Footer";
import { LevelsCard } from "./LevelsCard";
import { preclinicalLevels, clinicalLevels } from "../../../data/academics/learning-resources/levels";
import { motion } from "framer-motion";
import { fadeInVariants1 } from "../../../animation/variants";
import { db, isFirebaseConfigured } from "../../../config/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { LevelCard } from "../../../models/academics/learning-resources";

interface LevelEntry extends LevelCard {
  id: string;
  order: number;
}

export default function LearningResources() {
  const [dynamicPreclinicalLevels, setDynamicPreclinicalLevels] = useState<LevelCard[]>([]);
  const [dynamicClinicalLevels, setDynamicClinicalLevels] = useState<LevelCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLevels = async () => {
      if (!isFirebaseConfigured) {
        setIsLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, "learningResourceLevels"),
          orderBy("order", "asc")
        );
        const snapshot = await getDocs(q);
        const levelsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as LevelEntry[];

        if (levelsData.length > 0) {
          const preclinical = levelsData
            .filter((l) => l.section === "preclinical")
            .map(({ level, title, desc, section }) => ({ level, title, desc, section }));
          const clinical = levelsData
            .filter((l) => l.section === "clinical")
            .map(({ level, title, desc, section }) => ({ level, title, desc, section }));

          if (preclinical.length > 0) setDynamicPreclinicalLevels(preclinical);
          if (clinical.length > 0) setDynamicClinicalLevels(clinical);
        }
      } catch (error) {
        console.error("Error fetching levels:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLevels();
  }, []);

  // Use dynamic levels if available, otherwise fallback to static
  const displayPreclinicalLevels = dynamicPreclinicalLevels.length > 0 ? dynamicPreclinicalLevels : preclinicalLevels;
  const displayClinicalLevels = dynamicClinicalLevels.length > 0 ? dynamicClinicalLevels : clinicalLevels;

  return (
    <div className="min-h-screen bg-white">
      <div className="box-width ">
        <div className="page-section">
          <div className="w-full flex items-center justify-center mb-6 flex-col">
            <h2 className=" text-center font-bold text-xl ss:text-xll uppercase text-gray-900">
              Learning Resources
            </h2>
            <p className="heading-p">
              Find textbooks, lecturers handouts, past questions, lecture notes,
              and study tips organized by level for easy access.
            </p>
          </div>

          {/* Preclinical Section */}
          <div className="mb-10">
            <div className="mb-4">
              <h3 className="text-lg ss:text-xl font-bold text-gray-800 mb-1">
                Preclinical (Year 1-3)
              </h3>
              <p className="text-sm text-gray-600">
                Basic sciences and foundational medical sciences: Anatomy, Physiology, Biochemistry
              </p>
            </div>
            <div className="grid items-center ss:grid-cols-2 md:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-full flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green2"></div>
                </div>
              ) : (
                displayPreclinicalLevels.map((info, index) => (
                  <motion.div
                    key={`preclinical-${index}`}
                    variants={fadeInVariants1}
                    initial="initial"
                    whileInView="animate"
                    viewport={{
                      once: true,
                    }}
                    custom={index}
                  >
                    <LevelsCard {...info} />
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Clinical Section */}
          <div>
            <div className="mb-4">
              <h3 className="text-lg ss:text-xl font-bold text-gray-800 mb-1">
                Clinical (Year 4-6)
              </h3>
              <p className="text-sm text-gray-600">
                Pathology, Pharmacology, and Clinical Rotations: Medicine, Surgery, Paediatrics, O&G
              </p>
            </div>
            <div className="grid items-center ss:grid-cols-2 md:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-full flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green2"></div>
                </div>
              ) : (
                displayClinicalLevels.map((info, index) => (
                  <motion.div
                    key={`clinical-${index}`}
                    variants={fadeInVariants1}
                    initial="initial"
                    whileInView="animate"
                    viewport={{
                      once: true,
                    }}
                    custom={index}
                  >
                    <LevelsCard {...info} />
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
