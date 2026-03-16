import { useEffect, useState } from "react";
import { fadeInVariants3 } from "../../animation/variants";
import Footer from "../../components/footer/Footer";
import { classReps as staticClassReps } from "../../data/students/classReps";
import { motion } from "framer-motion";
import { GraduateCapIcon } from "../../components/icons/general/GraduateCapIcon";
import { RegisterIcon } from "../../components/icons/general/RegisterIcon";
import { ProfileIcon } from "../../components/icons/general/ProfileIcon";
import { supabase } from "../../config/supabase";
import placeholderImg from "../../assets/img/team/placeholder.png";

interface ClassRepDisplay {
  img: string;
  name: string;
  regNo: string | number;
  title: string;
  work?: string;
}

export default function ClassReps() {
  const [reps, setReps] = useState<ClassRepDisplay[]>(
    staticClassReps.map((r) => ({ ...r, regNo: r.regNo }))
  );

  useEffect(() => {
    window.scroll(0, 0);
    // Load overrides from Supabase team_images (classRep type)
    supabase
      .from("team_images")
      .select("member_id, image_url, name, role, extra")
      .eq("team_type", "classRep")
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) return;
        const overrides: Record<string, { image_url?: string; name?: string; role?: string; extra?: string }> = {};
        data.forEach((row) => {
          overrides[row.member_id] = row;
        });
        setReps((prev) =>
          prev.map((rep, idx) => {
            const patch = overrides[`classrep-${idx}`];
            if (!patch) return rep;
            return {
              img: patch.image_url || rep.img,
              name: patch.name || rep.name,
              regNo: patch.extra || rep.regNo,
              title: patch.role || rep.title,
              work: rep.work,
            };
          })
        );
      });
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
            {reps.map(({ img, name, regNo, title }, i) => (
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
                  src={img}
                  alt={name}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = placeholderImg; }}
                  className="w-full h-2/3 object-cover"
                />
                <div className="h-1/3 p-3 flex flex-col justify-between">
                  <p className="font-bold text-sm md:text-xs uppercase flex gap-1.5 items-center text-gray-900">
                    <ProfileIcon className="w-6 h-6" /> {name}
                  </p>
                  <p className="font-semibold text-ss flex gap-1.5 items-center text-gray-900">
                    <RegisterIcon className="w-6 h-6 fill-green1" /> {regNo}
                  </p>
                  <p className="font-semibold text-ss uppercase flex gap-1.5 items-center text-gray-900">
                    <GraduateCapIcon className="w-6 h-6 fill-green1" /> {title}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
