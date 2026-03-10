import { motion } from "framer-motion";
import { fadeInVariants3 } from "../../animation/variants";
import { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import Footer from "../../components/footer/Footer";

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  year: string;
  team: string[];
  status: "completed" | "ongoing" | "planned";
  link?: string;
}

// Sample projects data (can be fetched from Firebase later)
const sampleProjects: Project[] = [
  {
    id: "1",
    title: "EBSUMSA Health Outreach Program",
    description: "Annual community health screening and awareness campaign reaching over 2,000 community members with free medical consultations, health education, and medication distribution.",
    category: "Community Service",
    year: "2024",
    team: ["EBSUMSA Executives", "Class 020", "Class 021"],
    status: "completed",
  },
  {
    id: "2",
    title: "WHO Medical Students Initiative",
    description: "Collaboration with WHO on health education campaigns focusing on infectious diseases prevention, maternal health, and child immunization in rural communities.",
    category: "WHO Partnership",
    year: "2024",
    team: ["WHO Chapter EBSU", "Public Health Committee"],
    status: "ongoing",
  },
  {
    id: "3",
    title: "EBSUMSA Digital Learning Platform",
    description: "Development of this comprehensive digital platform for medical students featuring learning resources, GPA calculator, course outlines, and student management tools.",
    category: "Technology",
    year: "2023-2024",
    team: ["Tech Team", "Academic Committee"],
    status: "completed",
    link: "/",
  },
  {
    id: "4",
    title: "Blood Donation Drive",
    description: "Bi-annual blood donation drive in partnership with state blood bank, collecting over 500 units of blood to save lives in emergency situations.",
    category: "Health Initiative",
    year: "2024",
    team: ["EBSUMSA Health Committee", "All Classes"],
    status: "completed",
  },
  {
    id: "5",
    title: "Mental Health Awareness Week",
    description: "Week-long program featuring talks, workshops, and peer support sessions addressing mental health challenges among medical students and the community.",
    category: "Awareness Campaign",
    year: "2024",
    team: ["Welfare Committee", "Psychiatry Interest Group"],
    status: "completed",
  },
  {
    id: "6",
    title: "EBSUMSA Research Symposium",
    description: "Annual research symposium showcasing student research projects, providing mentorship opportunities, and fostering academic excellence in clinical research.",
    category: "Academic",
    year: "2025",
    team: ["Research Committee", "Faculty Advisors"],
    status: "planned",
  },
];

const categoryColors: Record<string, string> = {
  "Community Service": "bg-blue-100 text-blue-700",
  "WHO Partnership": "bg-purple-100 text-purple-700",
  "Technology": "bg-green-100 text-green-700",
  "Health Initiative": "bg-red-100 text-red-700",
  "Awareness Campaign": "bg-yellow-100 text-yellow-700",
  "Academic": "bg-indigo-100 text-indigo-700",
};

const statusColors: Record<string, string> = {
  completed: "bg-green-500",
  ongoing: "bg-yellow-500",
  planned: "bg-blue-500",
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>(sampleProjects);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "projects"), orderBy("year", "desc"));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const projectsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Project[];
        setProjects(projectsData);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      // Keep using sample data if fetch fails
    } finally {
      setIsLoading(false);
    }
  };

  const categories = ["all", ...new Set(projects.map((p) => p.category))];

  const filteredProjects =
    selectedCategory === "all"
      ? projects
      : projects.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="box-width">
        <div className="px-3 py-20 sm:px-10 lg:px-12 sm:py-24">
          {/* Header */}
          <motion.div
            variants={fadeInVariants3}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            custom={1}
            className="flex items-center justify-center flex-col py-9"
          >
            <h2>
              <div className="bar-style" />
              Our Projects
            </h2>
            <h3 className="text-gray-700 font-[500] text-ss ss:text-sm xlg:text-xs text-center max-w-2xl">
              Discover the impactful projects and initiatives undertaken by EBSUMSA, 
              from community health outreach to WHO partnerships and technological innovations.
            </h3>
          </motion.div>

          {/* Category Filter */}
          <motion.div
            variants={fadeInVariants3}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            custom={2}
            className="flex flex-wrap justify-center gap-2 mb-8"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-green1 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 shadow"
                }`}
              >
                {category === "all" ? "All Projects" : category}
              </button>
            ))}
          </motion.div>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-green1 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  variants={fadeInVariants3}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  custom={index + 3}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {project.imageUrl ? (
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-green1 to-green2 flex items-center justify-center">
                      <svg
                        className="w-16 h-16 text-white/50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          categoryColors[project.category] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {project.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${statusColors[project.status]}`}
                        ></span>
                        <span className="text-xs text-gray-500 capitalize">
                          {project.status}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {project.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {project.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {project.year}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {project.team.length} team(s)
                      </span>
                    </div>

                    {project.team.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 font-medium mb-1">Teams Involved:</p>
                        <div className="flex flex-wrap gap-1">
                          {project.team.slice(0, 3).map((team, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {team}
                            </span>
                          ))}
                          {project.team.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{project.team.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {project.link && (
                      <a
                        href={project.link}
                        className="mt-4 inline-flex items-center gap-1 text-green1 hover:text-green2 text-sm font-medium"
                      >
                        Learn more
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {filteredProjects.length === 0 && !isLoading && (
            <div className="text-center py-20">
              <p className="text-gray-500">No projects found in this category.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
