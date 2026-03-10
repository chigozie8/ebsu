import { courses, clinicalCourses, isClinicalLevel } from "../../../data/academics/learning-resources/courses";
import { useParams } from "react-router-dom";
import { CoursesCard } from "./CoursesCard";
import Footer from "../../../components/footer/Footer";
import { motion } from "framer-motion";
import { fadeInVariants1 } from "../../../animation/variants";

export default function LearningResourcesCourses() {
  const { level } = useParams();
  const isClinical = level ? isClinicalLevel(level) : false;

  // Get appropriate courses based on level type
  const getClinicalCourses = () => {
    if (level && clinicalCourses[level]) {
      return clinicalCourses[level].courseInfo;
    }
    return [];
  };

  const getPreclinicalCourses = (semester: "First" | "Second") => {
    if (level && courses[level] && courses[level][semester]) {
      return courses[level][semester].courseInfo;
    }
    return [];
  };

  const getLevelDescription = () => {
    if (!level) return "";
    const numLevel = parseInt(level);
    
    if (numLevel === 100) {
      return "Download textbooks, handouts, notes and past questions compiled just for Freshers";
    } else if (numLevel === 200) {
      return "Download resources for 200 level - Introduction to Anatomy, Physiology, and Biochemistry";
    } else if (numLevel === 300) {
      return "Download resources for 300 level - Advanced Preclinical Sciences";
    } else if (numLevel === 400) {
      return "Access resources for 400 level - Pathology, Pharmacology, Microbiology, and Laboratory Medicine";
    } else if (numLevel === 500) {
      return "Access clinical resources for 500 level - Medicine, Surgery, Paediatrics, O&G, Psychiatry, and Community Medicine";
    } else if (numLevel === 600) {
      return "Access resources for Final year - Advanced Clinical Rotations and Specialty Clerkships";
    }
    return `Download textbooks, handouts, notes and past questions compiled for ${level} level students`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="box-width2">
        <div className="page-section">
          <div className="w-full flex items-center justify-center mb-6 flex-col">
            <h5 className="text-center font-bold text-xl ss:text-xll uppercase text-gray-900">
              {level} Level Learning Resources
            </h5>
            <p className="heading-p">{getLevelDescription()}</p>
          </div>

          {isClinical ? (
            // Clinical years (400-600) - No semester division
            <>
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <span className="font-semibold">Clinical Year:</span> Courses in clinical years are organized as continuous rotations without semester divisions. 
                  Resources are grouped by specialty and clinical posting.
                </p>
              </div>
              
              <h4 className="text-base font-bold mb-4 sm:text-md">
                All Clinical Courses <div className="bar-style" />
              </h4>
              <div className="mb-16 grid items-center grid-cols-2 xss:grid-cols-3 sss:grid-cols-4 mmd:grid-cols-5 gap-4">
                {getClinicalCourses().map((info, i) => (
                  <motion.div
                    key={info.id}
                    variants={fadeInVariants1}
                    initial="initial"
                    whileInView="animate"
                    viewport={{
                      once: true,
                    }}
                    custom={i}
                  >
                    <CoursesCard {...info} />
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            // Preclinical years (100-300) - With semester division
            <>
              <h4 className="text-base font-bold mb-2 sm:text-md">
                First Semester <div className="bar-style" />
              </h4>
              <div className="mb-16 grid items-center grid-cols-2 xss:grid-cols-3 sss:grid-cols-4 mmd:grid-cols-5 gap-4">
                {getPreclinicalCourses("First").map((info, i) => (
                  <motion.div
                    key={info.id}
                    variants={fadeInVariants1}
                    initial="initial"
                    whileInView="animate"
                    viewport={{
                      once: true,
                    }}
                    custom={i}
                  >
                    <CoursesCard {...info} />
                  </motion.div>
                ))}
              </div>

              {getPreclinicalCourses("Second").length > 0 && (
                <>
                  <h4 className="text-base font-bold mb-2 sm:text-md">
                    Second Semester <div className="bar-style" />
                  </h4>
                  <div className="mb-16 grid items-center grid-cols-2 xss:grid-cols-3 sss:grid-cols-4 mmd:grid-cols-5 gap-4">
                    {getPreclinicalCourses("Second").map((info, i) => (
                      <motion.div
                        key={info.id}
                        variants={fadeInVariants1}
                        initial="initial"
                        whileInView="animate"
                        viewport={{
                          once: true,
                        }}
                        custom={i}
                      >
                        <CoursesCard {...info} />
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
