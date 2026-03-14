import { useEffect, useState } from "react";
import { fadeInVariants3 } from "../../animation/variants";
import Footer from "../../components/footer/Footer";
import { classReps } from "../../data/students/classReps";
import { motion } from "framer-motion";
import { GraduateCapIcon } from "../../components/icons/general/GraduateCapIcon";
import { RegisterIcon } from "../../components/icons/general/RegisterIcon";
import { ProfileIcon } from "../../components/icons/general/ProfileIcon";
import { db } from "../../config/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function ClassReps() {
  type RepOverride = { image?: string; name?: string; role?: string; extra?: string };
  const [overrides, setOverrides] = useState<Record<string, RepOverride>>({});

  useEffect(() => {
    window.scroll(0, 0);
    getDocs(collection(db, 'teamImages')).then((snap) => {
      const map: Record<string, RepOverride> = {};
      snap.forEach((d) => {
        const data = d.data();
        if (data.teamType === 'classRep' && data.memberId) {
          map[data.memberId] = {
            ...(data.imageUrl && { image: data.imageUrl }),
            ...(data.name    && { name:  data.name }),
            ...(data.role    && { role:  data.role }),
            ...(data.extra   && { extra: data.extra }),
          };
        }
      });
      setOverrides(map);
    }).catch(() => { /* fall back to static data */ });
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
          <div className="grid sss:grid-cols-2 lg:grid-cols-3 gap-5 xl:gap-8 ">
            {classReps.map(({ img, name, regNo, title }, i) => {
              const id = `classrep-${i}`;
              const ov = overrides[id] || {};
              const resolvedImg   = ov.image || img;
              const resolvedName  = ov.name  || name;
              const resolvedTitle = ov.role  || title;
              return (
              <motion.div
                variants={fadeInVariants3}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                custom={i}
                key={i}
                className="w-full h-[400px] sss:h-[420px] shadow-4 transition-shadow duration-200 ease-in-out rounded-lg overflow-hidden bg-white"
              >
                <img
                  src={resolvedImg}
                  alt={resolvedName}
                  className="w-full h-2/3 object-cover"
                />
                <div className="h-1/3 p-3 flex flex-col justify-between">
                  <p className="font-bold text-sm md:text-xs uppercase flex gap-1.5 items-center text-gray-900">
                    <ProfileIcon className="w-6 h-6" /> {resolvedName}
                  </p>
                  <p className="font-semibold text-ss flex gap-1.5 items-center text-gray-900">
                    <RegisterIcon className="w-6 h-6 fill-green1" /> {regNo}
                  </p>
                  <p className="font-semibold text-ss uppercase flex gap-1.5 items-center text-gray-900">
                    <GraduateCapIcon className="w-6 h-6 fill-green1" /> {resolvedTitle}
                  </p>

                </div>
              </motion.div>
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
