/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fadeInVariants3, fadeInVariants5 } from "../../../animation/variants";
import Footer from "../../../components/footer/Footer";
import { ExternalLinkIcon } from "../../../components/icons/general/ExternalLinkIcon";
import { GithubIcon } from "../../../components/icons/general/GithubIcon";

// Project interface
interface Project {
  id: number;
  title: string;
  description: string;
  image: string;
  tags: string[];
  liveUrl?: string;
  githubUrl?: string;
  featured?: boolean;
}

// Sample projects data - Replace with your actual projects
const projectsData: Project[] = [
  {
    id: 1,
    title: "EBSU Medical Portal",
    description: "A comprehensive student portal for EBSU Medical students featuring GPA calculator, course outlines, learning resources, and student ID card registration system.",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=60",
    tags: ["React", "TypeScript", "Firebase", "Tailwind CSS"],
    liveUrl: "https://ebsu-portal.vercel.app",
    githubUrl: "https://github.com/chigozie8/ebsu",
    featured: true,
  },
  {
    id: 2,
    title: "AI Health Assistant",
    description: "An intelligent chatbot that provides medical information and health tips using advanced AI technology.",
    image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&auto=format&fit=crop&q=60",
    tags: ["Next.js", "OpenAI", "Vercel AI SDK", "Supabase"],
    liveUrl: "#",
    githubUrl: "#",
    featured: true,
  },
  {
    id: 3,
    title: "Medical Records System",
    description: "A secure electronic medical records system for healthcare providers to manage patient data efficiently.",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=60",
    tags: ["React", "Node.js", "PostgreSQL", "Docker"],
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    id: 4,
    title: "Telemedicine Platform",
    description: "A video consultation platform connecting patients with healthcare professionals remotely.",
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=60",
    tags: ["React", "WebRTC", "Socket.io", "MongoDB"],
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    id: 5,
    title: "Pharmacy Inventory System",
    description: "An inventory management system for pharmacies to track medications, expiry dates, and stock levels.",
    image: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800&auto=format&fit=crop&q=60",
    tags: ["Vue.js", "Express", "MySQL", "Chart.js"],
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    id: 6,
    title: "Health Fitness Tracker",
    description: "A mobile-first fitness tracking application with workout plans, nutrition logging, and progress analytics.",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=60",
    tags: ["React Native", "Firebase", "Redux", "D3.js"],
    liveUrl: "#",
    githubUrl: "#",
  },
];

// Project Card Component
const ProjectCard = ({ project, index }: { project: Project; index: number }) => (
  <motion.div
    variants={fadeInVariants3}
    initial="initial"
    whileInView="animate"
    viewport={{ once: true }}
    custom={index}
    className={`group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 ${
      project.featured ? "md:col-span-2 lg:col-span-1" : ""
    }`}
  >
    <div className="relative h-48 sm:h-56 overflow-hidden">
      <img
        src={project.image}
        alt={project.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      {project.featured && (
        <div className="absolute top-3 left-3 bg-green1 text-white text-xss ss:text-xs font-semibold px-3 py-1 rounded-full">
          Featured
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-4 left-4 right-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {project.liveUrl && project.liveUrl !== "#" && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-white text-gray-900 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors"
          >
            <ExternalLinkIcon className="w-3.5 h-3.5" />
            Live Demo
          </a>
        )}
        {project.githubUrl && project.githubUrl !== "#" && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            Code
          </a>
        )}
      </div>
    </div>
    <div className="p-4 sm:p-5">
      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 group-hover:text-green1 transition-colors">
        {project.title}
      </h3>
      <p className="text-gray-600 text-xs sm:text-sm mb-4 line-clamp-2">
        {project.description}
      </p>
      <div className="flex flex-wrap gap-2">
        {project.tags.map((tag, tagIndex) => (
          <span
            key={tagIndex}
            className="bg-gray-100 text-gray-700 text-xss ss:text-xs px-2.5 py-1 rounded-full font-medium"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  </motion.div>
);

// Filter tabs
const filterTabs = ["All", "Featured", "Web Apps", "Mobile", "Backend"];

export default function ProjectsPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projectsData);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (activeFilter === "All") {
      setFilteredProjects(projectsData);
    } else if (activeFilter === "Featured") {
      setFilteredProjects(projectsData.filter((p) => p.featured));
    } else {
      // Filter by tag
      setFilteredProjects(
        projectsData.filter((p) =>
          p.tags.some((tag) =>
            tag.toLowerCase().includes(activeFilter.toLowerCase())
          )
        )
      );
    }
  }, [activeFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="box-width">
        <div className="px-3 py-20 sm:px-10 lg:px-12 sm:py-24">
          {/* Header Section */}
          <motion.div
            variants={fadeInVariants5}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            custom={1}
            className="text-center mb-10 sm:mb-14"
          >
            <div className="flex items-center justify-center flex-col">
              <h2>
                <div className="bar-style" />
                My Projects
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-ss ss:text-sm md:text-base mt-2">
                A showcase of my work, side projects, and contributions. Each project represents
                a unique challenge and learning experience.
              </p>
            </div>
          </motion.div>

          {/* Filter Tabs */}
          <motion.div
            variants={fadeInVariants5}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            custom={2}
            className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-10"
          >
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                  activeFilter === tab
                    ? "bg-green1 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-100 shadow-sm"
                }`}
              >
                {tab}
              </button>
            ))}
          </motion.div>

          {/* Projects Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredProjects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index * 2} />
            ))}
          </div>

          {/* Empty State */}
          {filteredProjects.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-sm sm:text-base">
                No projects found for this filter.
              </p>
            </div>
          )}

          {/* Call to Action */}
          <motion.div
            variants={fadeInVariants5}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            custom={10}
            className="mt-12 sm:mt-16 text-center"
          >
            <div className="bg-gradient-to-r from-green1 to-green2 rounded-2xl p-6 sm:p-10 text-white">
              <h3 className="text-xl sm:text-2xl font-bold mb-3">
                Interested in working together?
              </h3>
              <p className="text-white/90 text-sm sm:text-base mb-5 max-w-lg mx-auto">
                I'm always open to discussing new projects, creative ideas, or opportunities to be part of your vision.
              </p>
              <a
                href="mailto:kenronkwo@gmail.com"
                className="inline-flex items-center gap-2 bg-white text-green1 px-6 py-3 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Get in Touch
                <ExternalLinkIcon className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
