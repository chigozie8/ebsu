import Footer from "../../components/footer/Footer";
import { motion } from "framer-motion";
import { fadeInVariants3 } from "../../animation/variants";
import { useEffect, useState } from "react";

// =============================================
// TypeScript Interfaces
// =============================================
interface Project {
  id: string;
  title: string;
  description: string;
  category: "voluntary" | "who" | "personal" | "research" | "community";
  date: string;
  collaborators?: string[];
  image?: string;
  link?: string;
  tags: string[];
  featured?: boolean;
}

interface ProjectCardProps {
  project: Project;
  index: number;
}

// =============================================
// Sample Projects Data (will be replaced with Supabase data)
// =============================================
const sampleProjects: Project[] = [
  {
    id: "1",
    title: "Community Health Outreach - Abakaliki",
    description:
      "Organized a free medical screening and health education program for residents of Abakaliki community. Over 500 people were screened for hypertension, diabetes, and malaria. Health education on disease prevention was provided.",
    category: "community",
    date: "February 2026",
    collaborators: ["EBSUMSA", "WHO Nigeria", "Ebonyi State Ministry of Health"],
    tags: ["Health Outreach", "Community Health", "Screening"],
    featured: true,
  },
  {
    id: "2",
    title: "WHO World Health Day Campaign",
    description:
      "Participated in the World Health Organization's World Health Day campaign focusing on universal health coverage. Organized awareness walks, seminars, and social media campaigns to educate the public on the importance of accessible healthcare.",
    category: "who",
    date: "April 2025",
    collaborators: ["WHO", "EBSUMSA", "Nigerian Medical Association"],
    tags: ["WHO", "Awareness Campaign", "UHC"],
    featured: true,
  },
  {
    id: "3",
    title: "Medical Students Website Development",
    description:
      "Developed and deployed a comprehensive website for EBSU medical students featuring learning resources, GPA calculator, course outlines, and student information management system. Built with React, TypeScript, and Supabase.",
    category: "personal",
    date: "January 2026",
    collaborators: ["Project Development Team"],
    tags: ["Web Development", "React", "Student Resources"],
    link: "https://ebsu-medicine.vercel.app",
    featured: true,
  },
  {
    id: "4",
    title: "Blood Donation Drive",
    description:
      "Organized a voluntary blood donation drive in collaboration with the National Blood Transfusion Service. Over 100 units of blood were collected to support the FETHA blood bank.",
    category: "voluntary",
    date: "December 2025",
    collaborators: ["NBTS", "FETHA", "Red Cross"],
    tags: ["Blood Donation", "Voluntary Service", "Healthcare"],
  },
  {
    id: "5",
    title: "Research on Malaria Prevalence in Rural Ebonyi",
    description:
      "Conducted epidemiological research on malaria prevalence among children under 5 in rural communities of Ebonyi State. Findings were presented at the annual medical students' research symposium.",
    category: "research",
    date: "November 2025",
    collaborators: ["Department of Community Medicine", "EBSU Research Unit"],
    tags: ["Research", "Malaria", "Epidemiology"],
  },
  {
    id: "6",
    title: "Mental Health Awareness Week",
    description:
      "Led a week-long campaign to raise awareness about mental health among students. Activities included seminars, counseling sessions, and social media campaigns to destigmatize mental health issues.",
    category: "voluntary",
    date: "October 2025",
    collaborators: ["Student Counseling Unit", "Psychology Department"],
    tags: ["Mental Health", "Awareness", "Student Welfare"],
  },
  {
    id: "7",
    title: "WHO Immunization Week Participation",
    description:
      "Volunteered in the WHO African Immunization Week program, helping to administer vaccines and educate parents on the importance of childhood immunization in underserved communities.",
    category: "who",
    date: "April 2025",
    collaborators: ["WHO", "UNICEF", "Primary Healthcare Centers"],
    tags: ["WHO", "Immunization", "Child Health"],
  },
  {
    id: "8",
    title: "First Aid Training Program",
    description:
      "Organized first aid training sessions for non-medical students and staff. Over 200 participants learned basic life support, wound management, and emergency response skills.",
    category: "voluntary",
    date: "September 2025",
    collaborators: ["Nigerian Red Cross", "EBSU Health Services"],
    tags: ["First Aid", "Training", "Emergency Response"],
  },
];

// Category colors and labels
const categoryConfig = {
  voluntary: { label: "Voluntary", color: "bg-blue-100 text-blue-800" },
  who: { label: "WHO Project", color: "bg-green-100 text-green-800" },
  personal: { label: "Personal", color: "bg-purple-100 text-purple-800" },
  research: { label: "Research", color: "bg-orange-100 text-orange-800" },
  community: { label: "Community", color: "bg-teal-100 text-teal-800" },
};

// =============================================
// Project Card Component
// =============================================
const ProjectCard = ({ project, index }: ProjectCardProps) => (
  <motion.div
    variants={fadeInVariants3}
    initial="initial"
    whileInView="animate"
    viewport={{ once: true }}
    custom={index}
    className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 ${
      project.featured ? "border-l-4 border-green2" : ""
    }`}
  >
    <div className="p-5">
      <div className="flex items-start justify-between mb-3">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            categoryConfig[project.category].color
          }`}
        >
          {categoryConfig[project.category].label}
        </span>
        {project.featured && (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            Featured
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
        {project.title}
      </h3>

      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{project.description}</p>

      <div className="flex flex-wrap gap-1 mb-4">
        {project.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500">{project.date}</span>
        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green2 hover:text-green1 text-sm font-medium flex items-center gap-1"
          >
            View Project
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}
      </div>

      {project.collaborators && project.collaborators.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            <span className="font-medium">Collaborators:</span>{" "}
            {project.collaborators.slice(0, 2).join(", ")}
            {project.collaborators.length > 2 &&
              ` +${project.collaborators.length - 2} more`}
          </p>
        </div>
      )}
    </div>
  </motion.div>
);

// =============================================
// Stats Component
// =============================================
const StatsSection = () => {
  const stats = [
    { label: "Projects Completed", value: "25+" },
    { label: "Lives Impacted", value: "5,000+" },
    { label: "WHO Collaborations", value: "8" },
    { label: "Team Members", value: "50+" },
  ];

  return (
    <motion.div
      variants={fadeInVariants3}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      custom={1}
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
    >
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-xl p-4 text-center shadow-md">
          <p className="text-2xl sm:text-3xl font-bold text-green2">{stat.value}</p>
          <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
        </div>
      ))}
    </motion.div>
  );
};

// =============================================
// Main Component
// =============================================
export default function ProjectsShowcase() {
  const [filter, setFilter] = useState<string>("all");
  const [projects] = useState<Project[]>(sampleProjects);

  const filteredProjects =
    filter === "all"
      ? projects
      : projects.filter((p) => p.category === filter);

  const featuredProjects = projects.filter((p) => p.featured);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="box-width">
        <div className="px-3 py-20 sm:px-10 lg:px-12 sm:py-24">
          {/* Header */}
          <div className="flex items-center justify-center flex-col py-6 mb-8">
            <h2>
              <div className="bar-style" />
              Projects Showcase
            </h2>
            <h3 className="text-gray-700 font-medium text-ss ss:text-sm xlg:text-xs text-center max-w-2xl">
              Discover our voluntary work, WHO collaborations, research initiatives, and community projects
            </h3>
          </div>

          {/* Stats */}
          <StatsSection />

          {/* About Section */}
          <motion.div
            variants={fadeInVariants3}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            custom={0}
            className="bg-white rounded-2xl shadow-md p-6 mb-12 max-w-3xl mx-auto"
          >
            <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-8 h-1 bg-green2 rounded-full"></span>
              Our Impact
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              At EBSUMSA, we believe in giving back to our community through various initiatives. 
              From WHO-sponsored health programs to voluntary medical outreaches, our students actively 
              participate in projects that make a real difference. This page showcases our collective 
              efforts and achievements in health promotion, research, and community service.
            </p>
          </motion.div>

          {/* Featured Projects */}
          {featuredProjects.length > 0 && (
            <div className="mb-12">
              <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-yellow-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Featured Projects
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProjects.map((project, index) => (
                  <ProjectCard key={project.id} project={project} index={index} />
                ))}
              </div>
            </div>
          )}

          {/* Filter Section */}
          <div className="mb-8">
            <h4 className="text-xl font-bold text-gray-900 mb-4">All Projects</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === "all"
                    ? "bg-green2 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                All
              </button>
              {Object.entries(categoryConfig).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === key
                      ? "bg-green2 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {value.label}
                </button>
              ))}
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredProjects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index + 5} />
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No projects found in this category.</p>
            </div>
          )}

          {/* Call to Action */}
          <motion.div
            variants={fadeInVariants3}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            custom={20}
            className="bg-green2 rounded-2xl p-6 text-center text-white max-w-2xl mx-auto"
          >
            <h4 className="text-lg font-bold mb-2">Want to Contribute?</h4>
            <p className="text-sm opacity-90 mb-4">
              Have a project idea or want to share your work? Contact us to have your project featured!
            </p>
            <a
              href="mailto:projects@ebsumsa.com"
              className="inline-block bg-white text-green2 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
            >
              Submit Your Project
            </a>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
