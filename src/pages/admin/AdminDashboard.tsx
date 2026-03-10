import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInVariants5 } from "../../animation/variants";
import { BooksIcon } from "../../components/icons/dashboard/BooksIcon";
import { HiPencilAlt, HiViewList } from "react-icons/hi";

export default function AdminDashboard() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1200px] w-full mx-auto">
        <div className="pt-[80px] ss:pt-[90px] sm:pt-[105px] pb-10 px-4">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage your website content</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Course Outline Editor - Primary Action */}
            <NavLink to="/admin/course-outlines">
              <motion.div
                variants={fadeInVariants5}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                custom={1}
                className="w-full min-h-[200px] transition duration-200 ease-in-out rounded-lg p-6 hover:bg-primary/95 bg-primary flex gap-4 flex-col items-center justify-center shadow-lg"
              >
                <HiPencilAlt className="w-16 h-16 text-white" />
                <div className="text-center">
                  <p className="uppercase text-white text-lg font-bold">
                    Course Outline Editor
                  </p>
                  <p className="text-white/80 text-sm">
                    Edit course outlines directly
                  </p>
                </div>
              </motion.div>
            </NavLink>

            {/* Course Management */}
            <NavLink to="/admin/courses">
              <motion.div
                variants={fadeInVariants5}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                custom={2}
                className="w-full min-h-[200px] transition duration-200 ease-in-out rounded-lg p-6 hover:bg-green1/95 bg-green1 flex gap-4 flex-col items-center justify-center shadow-lg"
              >
                <HiViewList className="w-16 h-16 text-white" />
                <div className="text-center">
                  <p className="uppercase text-white text-lg font-bold">
                    Course Management
                  </p>
                  <p className="text-white/80 text-sm">
                    Add, edit, delete courses
                  </p>
                </div>
              </motion.div>
            </NavLink>

            {/* More admin sections can be added here */}
          </div>

          {/* Quick Stats Section */}
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <NavLink
                  to="/admin/course-outlines"
                  className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <HiPencilAlt className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Edit Outlines</p>
                    <p className="text-sm text-gray-500">Edit course content</p>
                  </div>
                </NavLink>

                <NavLink
                  to="/admin/courses"
                  className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-green1/10 flex items-center justify-center">
                    <BooksIcon className="w-5 h-5" color="#1A56DB" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Add Course</p>
                    <p className="text-sm text-gray-500">Create new course</p>
                  </div>
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
