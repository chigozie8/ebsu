import { useState, useEffect } from "react";
import Footer from "../../../components/footer/Footer";
import { LevelsCard } from "./LevelsCard";
import { motion } from "framer-motion";
import { fadeInVariants1 } from "../../../animation/variants";
import { db, isFirebaseConfigured } from "../../../config/firebase";
import { collection, getDocs } from "firebase/firestore";
import { LevelCard } from "../../../models/academics/learning-resources";

interface AdminMaterial {
  id: string;
  level: string;
  courseCode: string;
  courseTitle?: string;
}

export default function LearningResources() {
  const [preclinicalLevels, setPreclinicalLevels] = useState<LevelCard[]>([]);
  const [clinicalLevels, setClinicalLevels] = useState<LevelCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLevelsFromMaterials = async () => {
      if (!isFirebaseConfigured) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch all learning materials and extract unique levels
        const snapshot = await getDocs(collection(db, "learningMaterials"));
        const materials = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as AdminMaterial[];

        // Extract unique levels from materials
        const uniqueLevels = new Set(materials.map(m => m.level));
        
        // Define level metadata
        const levelMetadata: Record<string, { title: string; desc: string; section: "preclinical" | "clinical" }> = {
          "100": { title: "100 Level (Year 1)", desc: "Basic sciences foundation: Physics, Chemistry, Biology, Mathematics", section: "preclinical" },
          "200": { title: "200 Level (Year 2)", desc: "Anatomy, Physiology, and Biochemistry - Introduction to the human body", section: "preclinical" },
          "300": { title: "300 Level (Year 3)", desc: "Advanced Anatomy, Physiology, and Biochemistry", section: "preclinical" },
          "400": { title: "400 Level (Year 4)", desc: "Pathology, Pharmacology, Microbiology - Disease mechanisms", section: "clinical" },
          "500": { title: "500 Level (Year 5)", desc: "Clinical rotations: Medicine, Surgery, Paediatrics, O&G", section: "clinical" },
          "600": { title: "600 Level (Year 6)", desc: "Final clinical rotations and MBBS examination preparation", section: "clinical" },
        };

        const preclinical: LevelCard[] = [];
        const clinical: LevelCard[] = [];

        // Create level cards only for levels that have materials
        Array.from(uniqueLevels).sort().forEach(level => {
          const meta = levelMetadata[level];
          if (meta) {
            const card: LevelCard = {
              level,
              title: meta.title,
              desc: meta.desc,
              section: meta.section,
            };
            if (meta.section === "preclinical") {
              preclinical.push(card);
            } else {
              clinical.push(card);
            }
          }
        });

        setPreclinicalLevels(preclinical);
        setClinicalLevels(clinical);
      } catch (error) {
        console.error("Error fetching levels:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLevelsFromMaterials();
  }, []);

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
              ) : preclinicalLevels.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <p>No preclinical resources available yet.</p>
                  <p className="text-sm mt-2">Check back later or contact admin.</p>
                </div>
              ) : (
                preclinicalLevels.map((info, index) => (
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
              ) : clinicalLevels.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <p>No clinical resources available yet.</p>
                  <p className="text-sm mt-2">Check back later or contact admin.</p>
                </div>
              ) : (
                clinicalLevels.map((info, index) => (
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
