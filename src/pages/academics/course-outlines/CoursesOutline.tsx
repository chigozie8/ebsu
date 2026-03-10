import { useEffect } from "react";
import { useCourseOutlineContext } from "../../../context/CourseOutline";
import { useFetchCourseOutlines, ICourse } from "../../../hooks/useFetchCourseOutlines";
import { CourseOutlineCard } from "./CoursesOutlineCard";
import { useParams } from "react-router-dom";
import Footer from "../../../components/footer/Footer";
import { motion } from "framer-motion";
import { fadeInVariants1 } from "../../../animation/variants";
import { Spinner } from "flowbite-react";

export default function CoursesOutline() {
  const { level } = useParams();
  const { semester, setSemester } = useCourseOutlineContext();
  
  const {
    courses,
    coursesLoading,
    coursesError,
    fetchCoursesByLevel,
  } = useFetchCourseOutlines();

  useEffect(() => {
    if (level) {
      fetchCoursesByLevel(level);
    }
  }, [level]);

  // Filter courses by semester
  const filteredCourses = courses?.filter(
    (course) => course.semester === semester
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="box-width">
        <div className="course-outline-section">
          <div className="w-full flex items-center justify-center mb-6 flex-col">
            <h2 className="text-center font-bold text-xl ss:text-xll uppercase text-gray-900">
              Courses Offered for {level} Level
            </h2>
            <p className="heading-p">
              The details for{" "}
              <span className="text-green1 font-semibold">
                {semester === "First" ? "Harmattan" : "Rain"}
              </span>{" "}
              Semester courses are as follows
            </p>
            <div className="flex items-center justify-center my-2 gap-1">
              <button
                onClick={() => setSemester("First")}
                className={`p-2 text-ss sm:text-xs rounded-md ${semester === "First" ? "bg-green1 text-white" : "bg-gray-100"} font-semibold transition duration-100`}
              >
                1st Semester
              </button>
              <button
                onClick={() => setSemester("Second")}
                className={`p-2 text-ss sm:text-xs rounded-md ${semester === "Second" ? "bg-green1 text-white" : "bg-gray-100"} font-semibold transition duration-100`}
              >
                2nd Semester
              </button>
            </div>
          </div>

          {coursesLoading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size="xl" />
            </div>
          ) : coursesError ? (
            <div className="text-center py-10">
              <p className="text-red-500">Failed to load courses. Please try again.</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No courses found for this level and semester.</p>
            </div>
          ) : (
            <div className="grid items-center ss:px-8 sm:px-0 sm:grid-cols-2 mmd:grid-cols-3 gap-6 max-w-[1100px] mx-auto">
              {filteredCourses.map((course: ICourse, index: number) => (
                <motion.div
                  key={course.id}
                  variants={fadeInVariants1}
                  initial="initial"
                  whileInView="animate"
                  viewport={{
                    once: true,
                  }}
                  custom={index}
                >
                  <CourseOutlineCard
                    courseCode={course.courseCode}
                    courseTitle={course.courseTitle}
                    creditUnit={course.creditUnit}
                    id={course.courseCode}
                    option={course.option}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
