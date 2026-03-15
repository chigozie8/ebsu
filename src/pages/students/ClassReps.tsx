import { useEffect, useState } from "react";
import { fadeInVariants3 } from "../../animation/variants";
import Footer from "../../components/footer/Footer";
import { classReps as staticClassReps } from "../../data/students/classReps";
import { motion } from "framer-motion";
import { GraduateCapIcon } from "../../components/icons/general/GraduateCapIcon";
import { RegisterIcon } from "../../components/icons/general/RegisterIcon";
import { ProfileIcon } from "../../components/icons/general/ProfileIcon";
import { db } from "../../config/firebase";
import { collection, getDocs } from "firebase/firestore";

// Build static defaults keyed by memberId so Firestore overrides merge cleanly
const defaultClassReps = staticClassReps.map((rep, idx) => ({
  id: `classrep-${idx}`,
  img: rep.img,
  name: rep.name,
  regNo: String(rep.regNo),
  title: rep.title,
  extra: rep.work,
}));

interface ClassRep {
  id: string;
  img: string;
  name: string;
  regNo: string;
  title: string;
  extra: string;
}

function ClassRepCardSkeleton() {
  return (
    <div className="w-full h-[400px] sss:h-[420px] rounded-lg overflow-hidden bg-white shadow-4 animate-pulse">
      <div className="w-full h-2/3 bg-gray-200" />
      <div className="h-1/3 p-3 flex flex-col justify-between">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );
}

function ClassRepCard({ rep, index }: { rep: ClassRep; index: number }) {
  return (
    <motion.div
      variants={fadeInVariants3}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      custom={index}
      className="w-full h-[400px] sss:h-[420px] shadow-4 transition-shadow duration-200 ease-in-out rounded-lg overflow-hidden bg-white"
    >
      <div className="relative w-full h-2/3 bg-gray-100">
        <img
          src={rep.img}
          alt={rep.name}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/img/class-reps/CR_100(2).jpg";
          }}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="h-1/3 p-3 flex flex-col justify-between">
        <p className="font-bold text-sm md:text-xs uppercase flex gap-1.5 items-center text-gray-900">
          <ProfileIcon className="w-6 h-6" /> {rep.name}
        </p>
        <p className="font-semibold text-ss flex gap-1.5 items-center text-gray-900">
          <RegisterIcon className="w-6 h-6 fill-green1" /> {rep.regNo}
        </p>
        <p className="font-semibold text-ss uppercase flex gap-1.5 items-center text-gray-900">
          <GraduateCapIcon className="w-6 h-6 fill-green1" /> {rep.title}
        </p>
      </div>
    </motion.div>
  );
}

export default function ClassReps() {
  const [reps, setReps] = useState<ClassRep[]>(defaultClassReps);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scroll(0, 0);

    const fetchReps = async () => {
      try {
        const snap = await getDocs(collection(db, "teamImages"));
        const updates: Record<string, Partial<ClassRep>> = {};
        snap.forEach((d) => {
          const data = d.data();
          if (data.teamType === "classRep" && data.memberId) {
            updates[data.memberId] = {
              ...(data.imageUrl && { img: data.imageUrl }),
              ...(data.name && { name: data.name }),
              ...(data.role && { title: data.role }),
              ...(data.extra && { extra: data.extra }),
            };
          }
        });

        setReps((prev) =>
          prev.map((rep) => {
            const patch = updates[rep.id];
            return patch ? { ...rep, ...patch } : rep;
          })
        );
      } catch {
        // fallback to static data already set in state
      } finally {
        setLoading(false);
      }
    };

    fetchReps();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="box-width">
        <div className="px-3 py-20 sm:px-10 xl:px-20 sm:py-24">
          <div className="flex items-center justify-center flex-col mb-4">
            <h2>
              <div className="bar-style" />
              Class Representatives
            </h2>
            <h3 className="text-gray-700 font-[500] text-ss ss:text-sm xlg:text-xs capitalize">
              Our esteemed student representatives across all levels
            </h3>
          </div>
          <div className="grid sss:grid-cols-2 lg:grid-cols-3 gap-5 xl:gap-8">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <ClassRepCardSkeleton key={i} />
                ))
              : reps.map((rep, i) => (
                  <ClassRepCard key={rep.id} rep={rep} index={i} />
                ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
