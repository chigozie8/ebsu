/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useFetchCourseOutlines, ICourseDetail, ICourse } from "../../../../../hooks/useFetchCourseOutlines";
import { OutlineIcon } from "../../../../../components/icons/dashboard/Outline";
import reading from "../../../../../assets/svg/illustrations/reading.svg";
import { Spinner } from "flowbite-react";

export default function CourseOutlines() {
  const [semester, setSemester] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [selectedCourseCode, setSelectedCourseCode] = useState<string | null>(null);

  const {
    courses,
    coursesLoading,
    coursesError,
    fetchCoursesByLevel,
    courseDetail,
    courseDetailLoading,
    fetchCourseDetail,
  } = useFetchCourseOutlines();

  // Fetch courses when level changes
  useEffect(() => {
    if (level) {
      fetchCoursesByLevel(level);
    }
  }, [level]);

  // Fetch course detail when course is selected
  useEffect(() => {
    if (selectedCourseCode) {
      fetchCourseDetail(selectedCourseCode);
    }
  }, [selectedCourseCode]);

  // Filter courses by semester
  const filteredCourses = courses?.filter(
    (course) => course.semester === semester
  ) || [];

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="box-width">
        <div className="px-3 ss:px-8 sm:px-14 sm:py-24 pt-20">
          <div className="w-full flex items-center justify-center mb-6 flex-col">
            <div className="mb-4">
              <h1 className="text-md sm:text-xll md:text-2xl font-semibold uppercase text-gray-900 text-center">
                Course outlines
              </h1>
              <p className="section-p text-center">
                Select your level, semester and course code
              </p>
            </div>
            <div className="flex gap-1 ss:gap-5 mb-4">
              <div>
                <select
                  onChange={(e) => {
                    setLevel(e.target.value);
                    setSelectedCourseCode(null);
                  }}
                  id="level_select"
                  className="bg-white cursor-pointer border-none shadow text-gray-900 text-xss xss:text-ss ss:text-sm font-medium rounded-lg border border-transparent focus:ring-green1 focus:border-gray-500 block w-full p-1.5 sm:p-2"
                >
                  <option selected disabled>
                    Select Level
                  </option>
                  <option value="100">100L</option>
                  <option value="200">200L</option>
                  <option value="300">300L</option>
                  <option value="400">400L</option>
                  <option value="500">500L</option>
                </select>
              </div>
              <div>
                <select
                  onChange={(e) => {
                    setSemester(e.target.value);
                    setSelectedCourseCode(null);
                  }}
                  id="semester_select"
                  className="bg-white cursor-pointer border-none shadow text-gray-900 text-xss xss:text-ss ss:text-sm font-medium rounded-lg border border-transparent focus:ring-green1 focus:border-gray-500 block w-full p-1.5 sm:p-2"
                >
                  <option selected disabled>
                    Select Semester
                  </option>
                  <option value="First">First Semester</option>
                  <option value="Second">Second Semester</option>
                </select>
              </div>
              <div>
                <select
                  id="course_select"
                  onChange={(e) => setSelectedCourseCode(e.target.value)}
                  className="bg-white cursor-pointer border-none shadow text-gray-900 text-xss xss:text-ss ss:text-sm font-medium rounded-lg border border-transparent focus:ring-green1 focus:border-gray-500 block w-full p-1.5 sm:p-2"
                >
                  <option selected disabled>
                    Select Course
                  </option>
                  {coursesLoading ? (
                    <option disabled>Loading...</option>
                  ) : coursesError ? (
                    <option disabled>Error loading courses</option>
                  ) : (
                    filteredCourses.map((course: ICourse) => (
                      <option key={course.id} value={course.courseCode}>
                        {course.courseCode}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {courseDetailLoading && selectedCourseCode ? (
              <div className="flex items-center justify-center py-10">
                <Spinner size="lg" />
              </div>
            ) : courseDetail ? (
              <div className="course-info rounded-lg bg-white shadow p-3 sm:p-6 max-w-2xl relative">
                <div className="relative">
                  <OutlineIcon className="fill-green1 w-4 h-4 xss:w-6 xss:h-6 absolute top-0 right-0" />
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 text-xs sm:text-base md:text-md">
                      {courseDetail.courseTitle}
                    </h4>
                    <p className="text-gray-800 font-medium text-sm sm:text-xs md:text-xs">
                      Course Code:{" "}
                      <span className="font-semibold">
                        {courseDetail.courseCode}
                      </span>
                    </p>
                    <p className="text-gray-800 font-medium text-sm sm:text-xs md:text-xs">
                      Credit Unit:{" "}
                      <span className="font-semibold">
                        {courseDetail.creditUnit}
                      </span>
                    </p>
                    {courseDetail.preRequisite && (
                      <p className="text-gray-800 font-medium text-sm sm:text-xs md:text-xs">
                        Pre-requisite:{" "}
                        <span className="font-semibold">
                          {courseDetail.preRequisite}
                        </span>
                      </p>
                    )}
                  </div>

                  {courseDetail.info?.map(({ heading, content }, index) => (
                    <div className="mb-4" key={index}>
                      <p className="font-semibold text-gray-800 text-sm sm:text-xs md:text-xs">
                        {heading}
                      </p>
                      <p className="text-gray-700 font-medium text-ss md:text-sm">
                        {content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full mt-10 flex items-center justify-center flex-col gap-3">
                <img
                  src={reading}
                  alt={"Choose a level, semester and course code"}
                  className="w-[70%] xss:w-[200px] sm:w-[230px]"
                />
                <p className="text-sm ss:text-xs text-gray-700 font-medium text-center">
                  Select a level, semester and course respectively.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
