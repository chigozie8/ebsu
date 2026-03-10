/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useFetchCourseOutlines } from "../../../hooks/useFetchCourseOutlines";
import { OutlineIcon } from "../../../components/icons/dashboard/Outline";
import { motion } from "framer-motion";
import { fadeInVariants1 } from "../../../animation/variants";
import { Spinner } from "flowbite-react";

export default function CourseInfo() {
  const { id } = useParams<string>();
  
  const {
    courseDetail,
    courseDetailLoading,
    courseDetailError,
    fetchCourseDetail,
  } = useFetchCourseOutlines();

  useEffect(() => {
    if (id) {
      fetchCourseDetail(id);
    }
  }, [id]);

  if (courseDetailLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (courseDetailError) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <p className="text-red-500">Failed to load course details. Please try again.</p>
      </div>
    );
  }

  if (!courseDetail) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Course not found.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-[950px] px-3 pt-20 pb-8 xsm:px-10 xsm:pt-24 xsm:pb-10">
          <motion.div
            variants={fadeInVariants1}
            initial="initial"
            whileInView="animate"
            viewport={{
              once: true,
            }}
            className="bg-white shadow-4 px-3 pt-10 pb-8 xsm:px-10 rounded-lg"
          >
            <div className="flex-center gap-0 ss:gap-3 flex-wrap">
              <div className="flex-center">
                <OutlineIcon className="w-6 sm:w-8 fill-green1" />
                <h3 className="text-base xss:text-lg sm:text-xl font-semibold text-center">
                  {courseDetail.courseTitle}
                </h3>
              </div>
              <h3 className="text-xs xss:text-md sm:text-xl font-semibold">
                ({courseDetail.courseCode})
              </h3>
            </div>
            <div className="flex-center gap-3 font-[400] text-sm sm:text-md mb-1 sm:mb-2">
              <p>
                Credit Unit - {courseDetail.creditUnit}{" "}
                {Number(courseDetail.creditUnit) > 1 ? "Units" : "Unit"}
              </p>
              {courseDetail.creditUnits && (
                <span>{courseDetail.creditUnits}</span>
              )}
            </div>
            <h4 className="text-center font-semibold text-xs xss:text-base sm:text-lg">
              COURSE OUTLINE
            </h4>
            {courseDetail.preRequisite && (
              <>
                <h4 className="text-xs sm:text-base font-semibold">
                  Pre-requisite: <div className="bar-style2" />
                </h4>
                <p className="mb-1 sm:mb-3 text-ss sm:text-sm text-gray-700 font-medium">
                  {courseDetail.preRequisite}
                </p>
              </>
            )}
            {courseDetail.info?.map(({ heading, content }, index) => (
              <div key={index} className="py-2 mb-2 border-b border-gray-200">
                {heading && heading === "General" ? (
                  <div className="text-xs sm:text-base font-semibold">
                    {heading}
                    <div className="bar-style2 mb-2 font-normal" />
                  </div>
                ) : (
                  <div className="text-xs sm:text-base font-semibold">
                    {heading}
                  </div>
                )}
                <div className="text-ss sm:text-xs font-medium text-gray-600">
                  {content}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
