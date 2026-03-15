import Footer from "../../components/footer/Footer";
import { motion } from "framer-motion";
import { fadeInVariants3 } from "../../animation/variants";
import { useEffect, useState } from "react";
import placeholder from "../../assets/img/team/placeholder.png";
import { db } from "../../config/firebase";
import { collection, getDocs } from "firebase/firestore";

// =============================================
// TypeScript Interfaces
// =============================================
interface ExecutiveMember {
  id: string;
  name: string;
  title: string;
  image: string;
  phone?: string;
  bio?: string;
}

// =============================================
// Static defaults (shown until Firestore data loads)
// =============================================
const defaultPresident: ExecutiveMember = {
  id: "president",
  name: "Name Here",
  title: "President",
  image: placeholder,
  phone: "",
  bio: "Leading EBSUMSA with vision and dedication to advance medical student welfare and professional development.",
};

const defaultExecutives: ExecutiveMember[] = [
  { id: "exec-0",  name: "Name Here", title: "Vice President",           image: placeholder, phone: "" },
  { id: "exec-1",  name: "Name Here", title: "General Secretary",        image: placeholder, phone: "" },
  { id: "exec-2",  name: "Name Here", title: "Financial Secretary",      image: placeholder, phone: "" },
  { id: "exec-3",  name: "Name Here", title: "Treasurer",                image: placeholder, phone: "" },
  { id: "exec-4",  name: "Name Here", title: "Public Relations Officer", image: placeholder, phone: "" },
  { id: "exec-5",  name: "Name Here", title: "Director of Socials",      image: placeholder, phone: "" },
  { id: "exec-6",  name: "Name Here", title: "Director of Academics",    image: placeholder, phone: "" },
  { id: "exec-7",  name: "Name Here", title: "Director of Welfare",      image: placeholder, phone: "" },
  { id: "exec-8",  name: "Name Here", title: "Director of Sports",       image: placeholder, phone: "" },
  { id: "exec-9",  name: "Name Here", title: "Director of Health",       image: placeholder, phone: "" },
];

// =============================================
// Skeleton components
// =============================================
function PresidentSkeleton() {
  return (
    <div className="w-full max-w-md mx-auto bg-white shadow-lg rounded-2xl overflow-hidden border-2 border-gray-200 animate-pulse">
      <div className="bg-gray-200 h-14" />
      <div className="p-6 flex flex-col items-center gap-3">
        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gray-200" />
        <div className="h-5 bg-gray-200 rounded w-40" />
        <div className="h-3 bg-gray-200 rounded w-24" />
      </div>
    </div>
  );
}

function ExecutiveSkeleton() {
  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden animate-pulse">
      <div className="p-4 flex flex-col items-center gap-2">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200" />
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="h-3 bg-gray-200 rounded w-20" />
      </div>
    </div>
  );
}

// =============================================
// President Card Component
// =============================================
const PresidentCard = ({ member }: { member: ExecutiveMember }) => {
  return (
    <motion.div
      variants={fadeInVariants3}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      custom={1}
      className="w-full max-w-md mx-auto bg-white shadow-lg rounded-2xl overflow-hidden border-2 border-green2"
    >
      <div className="bg-gradient-to-r from-green2 to-green1 p-4">
        <h3 className="text-white text-center text-lg font-bold uppercase tracking-wide">
          President
        </h3>
      </div>
      <div className="p-6 flex flex-col items-center">
        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-green2 overflow-hidden mb-4 bg-gray-100">
          <img
            src={member.image}
            alt={member.name}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).src = placeholder;
            }}
            className="w-full h-full object-cover"
          />
        </div>
        <h4 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
          {member.name}
        </h4>
        {member.phone ? (
          <a
            href={`tel:${member.phone}`}
            className="text-green2 font-semibold text-sm mb-2 hover:underline"
          >
            {member.phone}
          </a>
        ) : (
          <p className="text-gray-400 text-sm mb-2 italic">Phone not set</p>
        )}
        {member.bio && (
          <p className="text-gray-600 text-sm text-center leading-relaxed">
            {member.bio}
          </p>
        )}
      </div>
    </motion.div>
  );
};

// =============================================
// Executive Card Component
// =============================================
const ExecutiveCard = ({ member, index }: { member: ExecutiveMember; index: number }) => {
  return (
    <motion.div
      variants={fadeInVariants3}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      custom={index}
      className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      <div className="p-4 flex flex-col items-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 border-gray-200 overflow-hidden mb-3 bg-gray-100">
          <img
            src={member.image}
            alt={member.name}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).src = placeholder;
            }}
            className="w-full h-full object-cover"
          />
        </div>
        <h4 className="text-sm sm:text-base font-bold text-gray-900 text-center">
          {member.name}
        </h4>
        <p className="text-green2 font-semibold text-xs sm:text-sm">{member.title}</p>
        {member.phone && (
          <a
            href={`tel:${member.phone}`}
            className="text-gray-500 text-xs mt-1 hover:text-green2 hover:underline transition-colors"
          >
            {member.phone}
          </a>
        )}
      </div>
    </motion.div>
  );
};

// =============================================
// Main Component
// =============================================
export default function EbsumsaTeam() {
  const [president, setPresident] = useState<ExecutiveMember>(defaultPresident);
  const [executives, setExecutives] = useState<ExecutiveMember[]>(defaultExecutives);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchTeam = async () => {
      try {
        const snap = await getDocs(collection(db, "teamImages"));
        const updates: Record<string, Partial<ExecutiveMember>> = {};
        snap.forEach((d) => {
          const data = d.data();
          if (data.teamType === "executive" && data.memberId) {
            updates[data.memberId] = {
              ...(data.imageUrl && { image: data.imageUrl }),
              ...(data.name && { name: data.name }),
              ...(data.role && { title: data.role }),
              ...(data.extra && { phone: data.extra }),
            };
          }
        });

        // Merge president
        const presidentPatch = updates["president"];
        if (presidentPatch) {
          setPresident((prev) => ({ ...prev, ...presidentPatch }));
        }

        // Merge executives
        setExecutives((prev) =>
          prev.map((m) => {
            const patch = updates[m.id];
            return patch ? { ...m, ...patch } : m;
          })
        );
      } catch {
        // fallback to static defaults already in state
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="box-width">
        <div className="px-3 py-20 sm:px-10 lg:px-12 sm:py-24">
          {/* Header */}
          <div className="flex items-center justify-center flex-col py-6 mb-8">
            <h2>
              <div className="bar-style" />
              EBSUMSA Executive Team
            </h2>
            <h3 className="text-gray-700 font-medium text-ss ss:text-sm xlg:text-xs text-center max-w-2xl">
              Meet the dedicated leaders of the Ebonyi State University Medical Students' Association
            </h3>
          </div>

          {/* About EBSUMSA */}
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
              About EBSUMSA
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              The Ebonyi State University Medical Students' Association (EBSUMSA) is the umbrella body for all medical students
              at EBSU College of Medicine. We are committed to fostering academic excellence, professional development,
              and the overall welfare of medical students. EBSUMSA organizes academic seminars, health outreaches,
              sports competitions, and social events to create a well-rounded medical school experience.
            </p>
          </motion.div>

          {/* President Section */}
          <div className="mb-12">
            {loading ? <PresidentSkeleton /> : <PresidentCard member={president} />}
          </div>

          {/* Other Executives */}
          <div className="mb-8">
            <h4 className="text-center text-lg font-bold text-gray-900 mb-6">
              Executive Members
            </h4>
            <div className="grid grid-cols-2 ss:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {loading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <ExecutiveSkeleton key={i} />
                  ))
                : executives.map((member, index) => (
                    <ExecutiveCard
                      key={member.id}
                      member={member}
                      index={index + 2}
                    />
                  ))}
            </div>
          </div>

          {/* Contact Section */}
          <motion.div
            variants={fadeInVariants3}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            custom={15}
            className="bg-green2 rounded-2xl p-6 text-center text-white max-w-2xl mx-auto"
          >
            <h4 className="text-lg font-bold mb-2">Get In Touch</h4>
            <p className="text-sm opacity-90 mb-4">
              Have questions or suggestions? Reach out to EBSUMSA leadership.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <a
                href="mailto:ebsumsaleadership@gmail.com"
                className="bg-white text-green2 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
              >
                ebsumsaleadership@gmail.com
              </a>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
