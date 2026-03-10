import Footer from "../../../components/footer/Footer";
import { LevelsCard } from "./LevelsCard";
import { preclinicalLevels, clinicalLevels } from "../../../data/academics/learning-resources/levels";
import { motion } from "framer-motion";
import { fadeInVariants1 } from "../../../animation/variants";

export default function LearningResources() {
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
              {preclinicalLevels.map((info, index) => (
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
              ))}
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
              {clinicalLevels.map((info, index) => (
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
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
