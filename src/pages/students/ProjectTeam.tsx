import Lottie from "lottie-react";
import work from "../../json/animation/work.json";
import link from "../../json/animation/link.json";
import git from "../../json/animation/git.json";
import mail from "../../json/animation/mail.json";
import dev from "../../json/animation/dev.json";

import chris from "../../assets/img/team/k.jpg";
import member2 from "../../assets/img/team/bbb.jpg";
import member3 from "../../assets/img/team/uuu.jpg";
//import member4 from "../../assets/img/team/img4.jpg";

import { Link } from "react-router-dom";
//import futo from "../../assets/img/gallery/ai.jpg";
import Footer from "../../components/footer/Footer";

import { motion } from "framer-motion";
import { fadeInVariants3 } from "../../animation/variants";
import { useEffect } from "react";

// =============================================
// TypeScript Interfaces
// =============================================
interface TeamMember {
  name: string;
  department: string;
  level: string;
  role: string;
  email: string;
  portfolio: string;
  github: string;
  linkedin: string;
  image: string; // imported image paths resolve to string in Vite/React
}

interface TeamCardProps {
  member: TeamMember;
  index: number;
}

// =============================================
// Team Data
// =============================================
const teamMembers: TeamMember[] = [
  {
    name: "Ken",
    department: "Medicine and Surgery",
    level: "600 Level",
    role: "Software Engineer",
    email: "kenronkwo@gmail.com",
    portfolio: "https://codeblockportfolio.vercel.app",
    github: "https://github.com/kenchigozie23",
    linkedin: "https://linkedin.com/in/kenneth-okoronkwo",
    image: chris,
  },
  {
    name: "Blu",
    department: "Medicine and Surgery",
    level: "400 Level",
    role: "Frontend Engineer",
    email: "ada.okonkwo@example.com",
    portfolio: "https://vercel.app",
    github: "https://github.com",
    linkedin: "https://linkedin.com",
    image: member2,
  },
  {
    name: "Red",
    department: "Medicine and Surgery",
    level: "400 Level",
    role: "UI designer",
    email: "Redress6310.com@gmail.com",
    portfolio: "https://vercel.app",
    github: "https://github.com",
    linkedin: "https://linkedin.com",
    image: member3,
  },
  
];

// =============================================
// TeamCard Component (Typed)
// =============================================
const TeamCard = ({ member, index }: TeamCardProps) => (
  <motion.div
    variants={fadeInVariants3}
    initial="initial"
    whileInView="animate"
    viewport={{ once: true }}
    custom={index}
    className="w-[400px] sss:w-[450px] mt-6 bg-white shadow-4 rounded-lg text-gray-900"
  >
  

    <div className="mx-auto w-28 h-28 sm:w-36 sm:h-36 md:w-36 md:h-36 relative -mt-12 sm:-mt-16 border-4 border-white rounded-full overflow-hidden">
      <img
        className="object-cover object-center w-full bg-gray-100"
        src={member.image}
        alt={member.name}
      />
    </div>

    <div className="text-center mt-2 rounded-lg px-4">
      <motion.h4
        variants={fadeInVariants3}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        custom={2}
        className="font-bold text-md ss:text-xl sm:text-2xl"
      >
        {member.name}
      </motion.h4>

      <motion.p
        variants={fadeInVariants3}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        custom={4}
        className="text-black text-ss sm:text-sm font-semibold"
      >
        {member.department}
      </motion.p>

      <motion.p
        variants={fadeInVariants3}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        custom={5}
        className="text-black text-ss sm:text-sm font-semibold mb-4"
      >
        {member.level}
      </motion.p>

      <motion.p
        variants={fadeInVariants3}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        custom={6}
        className="font-semibold text-ss ss:text-sm sm:text-xs mb-2"
      >
        <Lottie
          animationData={dev}
          loop={false}
          className="w-[17px] ss:w-[20px] -mb-1 inline-block"
        />{" "}
        {member.role}
      </motion.p>
const TeamCard = ({ member, index }: TeamCardProps) => (
  <motion.div
    variants={fadeInVariants3}
    initial="initial"
    whileInView="animate"
    viewport={{ once: true }}
    custom={index}
    className="w-[400px] sss:w-[450px] mt-6 bg-white shadow-4 rounded-lg text-gray-900 overflow-hidden"
  >
    {/* Profile picture - already centered */}
    <div className="mx-auto w-28 h-28 sm:w-36 sm:h-36 md:w-36 md:h-36 relative -mt-12 sm:-mt-16 border-4 border-white rounded-full overflow-hidden">
      <img
        className="object-cover object-center w-full h-full bg-gray-100"
        src={member.image}
        alt={member.name}
      />
    </div>

    {/* Main content - improved centering */}
    <div className="text-center pt-4 pb-10 px-5 sm:px-8 md:px-10">
      <motion.h4
        variants={fadeInVariants3}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        custom={2}
        className="font-bold text-lg ss:text-xl sm:text-2xl mb-1"
      >
        {member.name}
      </motion.h4>

      <motion.p
        variants={fadeInVariants3}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        custom={4}
        className="text-gray-700 text-sm sm:text-base font-medium"
      >
        {member.department}
      </motion.p>

      <motion.p
        variants={fadeInVariants3}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        custom={5}
        className="text-gray-600 text-sm sm:text-base font-medium mb-4"
      >
        {member.level}
      </motion.p>

      <motion.p
        variants={fadeInVariants3}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        custom={6}
        className="font-semibold text-sm sm:text-base mb-6 flex items-center justify-center gap-1.5"
      >
        <Lottie
          animationData={dev}
          loop={false}
          className="w-5 sm:w-6 -mb-0.5"
        />
        {member.role}
      </motion.p>

      {/* Social links - centered with flex */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8">
        <Link to={`mailto:${member.email}`}>
          <motion.div
            variants={fadeInVariants3}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            custom={8}
            className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
          >
            <Lottie loop={false} animationData={mail} className="w-5 sm:w-6" />
            <span className="font-medium text-sm sm:text-base">Email</span>
          </motion.div>
        </Link>

        <Link to={member.portfolio}>
          <motion.div
            variants={fadeInVariants3}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            custom={9}
            className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
          >
            <Lottie loop={false} animationData={link} className="w-5 sm:w-6" />
            <span className="font-medium text-sm sm:text-base">Portfolio</span>
          </motion.div>
        </Link>

        <Link to={member.github}>
          <motion.div
            variants={fadeInVariants3}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            custom={10}
            className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
          >
            <Lottie loop={false} animationData={git} className="w-5 sm:w-6" />
            <span className="font-medium text-sm sm:text-base">GitHub</span>
          </motion.div>
        </Link>

        <Link to={member.linkedin}>
          <motion.div
            variants={fadeInVariants3}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            custom={11}
            className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
          >
            <Lottie loop={false} animationData={work} className="w-5 sm:w-6" />
            <span className="font-medium text-sm sm:text-base">LinkedIn</span>
          </motion.div>
        </Link>
      </div>
    </div>
  </motion.div>
);
// =============================================
// Main Component (Typed)
// =============================================
export default function ProjectTeam() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="box-width">
        <div className="px-3 py-20 sm:px-10 lg:px-12 sm:py-24">
          <div className="flex items-center justify-center flex-col">
            <h2>
              <div className="bar-style" />
              Meet the Team
            </h2>
            <h3 className="text-gray-700 font-[500] text-ss ss:text-sm xlg:text-xs">
              The Creative Minds Behind This Project
            </h3>
          </div>

          <div className="w-full flex items-center justify-center flex-wrap gap-6">
            {teamMembers.map((member, index) => (
              <TeamCard key={member.name} member={member} index={index} />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
