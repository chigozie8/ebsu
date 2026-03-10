import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInVariants5 } from "../../animation/variants";
import { BooksIcon } from "../../components/icons/dashboard/BooksIcon";

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
            <NavLink to="/admin/courses">
              <motion.div
                variants={fadeInVariants5}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                custom={1}
                className="w-full min-h-[200px] transition duration-200 ease-in-out rounded-lg p-6 hover:bg-green1/90 bg-green1/80 flex gap-4 flex-col items-center justify-center shadow-lg"
              >
                <BooksIcon className="w-16 h-16" color="#fff" />
                <div className="text-center">
                  <p className="uppercase text-white text-lg font-bold">
                    Course Outlines
                  </p>
                  <p className="text-white/80 text-sm">
                    Manage courses, levels, and details
                  </p>
                </div>
              </motion.div>
            </NavLink>

            {/* Add more admin sections as needed */}
          </div>
        </div>
      </div>
    </div>
  );
}
