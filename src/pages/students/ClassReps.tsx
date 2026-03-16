import { useEffect, useState } from "react";
import { fadeInVariants3 } from "../../animation/variants";
import Footer from "../../components/footer/Footer";
import { classReps as staticClassReps } from "../../data/students/classReps";
import { motion } from "framer-motion";
import { supabase } from "../../config/supabase";

interface ClassRepDisplay {
  img: string;
  name: string;
  regNo: string | number;
  title: string;
  work?: string;
}

// Year-level colour palette
const levelColors: Record<string, { badge: string; bar: string; glow: string }> = {
  "100": { badge: "bg-sky-100 text-sky-700 border-sky-200",     bar: "from-sky-400 to-blue-500",      glow: "hover:shadow-sky-100" },
  "200": { badge: "bg-violet-100 text-violet-700 border-violet-200", bar: "from-violet-400 to-purple-500", glow: "hover:shadow-violet-100" },
  "300": { badge: "bg-amber-100 text-amber-700 border-amber-200",  bar: "from-amber-400 to-orange-500",  glow: "hover:shadow-amber-100" },
  "400": { badge: "bg-rose-100 text-rose-700 border-rose-200",    bar: "from-rose-400 to-pink-500",     glow: "hover:shadow-rose-100" },
  "500": { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", bar: "from-emerald-400 to-teal-500", glow: "hover:shadow-emerald-100" },
};
const getLevelKey = (title: string) => title.trim().replace(/\s.*/, "");
const getColors = (title: string) => levelColors[getLevelKey(title)] ?? levelColors["100"];

export default function ClassReps() {
  const [reps, setReps] = useState<ClassRepDisplay[]>(
    staticClassReps.map((r) => ({ ...r, regNo: r.regNo }))
  );

  useEffect(() => {
    window.scroll(0, 0);
    supabase
      .from("team_images")
      .select("member_id, image_url, name, role, extra")
      .eq("team_type", "classRep")
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) return;
        const overrides: Record<string, { image_url?: string; name?: string; role?: string; extra?: string }> = {};
        data.forEach((row) => { overrides[row.member_id] = row; });
        setReps((prev) =>
          prev.map((rep, idx) => {
            const patch = overrides[`classrep-${idx}`];
            if (!patch) return rep;
            return {
              img:   patch.image_url || rep.img,
              name:  patch.name      || rep.name,
              regNo: patch.extra     || rep.regNo,
              title: patch.role      || rep.title,
              work:  rep.work,
            };
          })
        );
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green1 via-green2 to-emerald-700 py-20 sm:py-28">
        {/* Decorative blobs */}
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/5 pointer-events-none" />

        <div className="relative text-center px-4 max-w-2xl mx-auto">
          <motion.span
            variants={fadeInVariants3}
            initial="initial"
            animate="animate"
            custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 text-white text-xs font-bold rounded-full uppercase tracking-widest mb-5 border border-white/20"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Student Leadership
          </motion.span>

          <motion.h1
            variants={fadeInVariants3}
            initial="initial"
            animate="animate"
            custom={1}
            className="text-3xl sm:text-5xl font-extrabold text-white text-balance leading-tight mb-4"
          >
            Course Representatives
          </motion.h1>

          <motion.p
            variants={fadeInVariants3}
            initial="initial"
            animate="animate"
            custom={2}
            className="text-white/80 text-sm sm:text-base leading-relaxed"
          >
            Meet the dedicated students who bridge the gap between classmates
            and faculty — championing academic excellence across every level.
          </motion.p>

          {/* Year level chips */}
          <motion.div
            variants={fadeInVariants3}
            initial="initial"
            animate="animate"
            custom={3}
            className="flex flex-wrap items-center justify-center gap-2 mt-6"
          >
            {["100 Level", "200 Level", "300 Level", "400 Level", "500 Level"].map((lvl) => {
              const key = lvl.replace(" Level", "");
              const c = levelColors[key];
              return (
                <span
                  key={lvl}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/25"
                >
                  {lvl}
                </span>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* ── Cards Grid ──────────────────────────────────────────────────── */}
      <div className="box-width px-4 sm:px-10 xl:px-20 py-16">
        <div className="grid sss:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
          {reps.map(({ img, name, regNo, title, work }, i) => {
            const colors = getColors(title);
            return (
              <motion.div
                variants={fadeInVariants3}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                custom={i}
                key={i}
                className={`group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl ${colors.glow} transition-all duration-300 hover:-translate-y-1`}
              >
                {/* Gradient top bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${colors.bar}`} />

                {/* Photo */}
                <div className="relative overflow-hidden h-64 sm:h-72">
                  <img
                    src={img}
                    alt={name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Level badge overlay */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colors.badge} backdrop-blur-sm bg-white/80`}>
                      {title.split(" ").slice(0, 2).join(" ")}
                    </span>
                  </div>
                  {/* Gradient fade at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/90 to-transparent" />
                </div>

                {/* Info */}
                <div className="px-5 pb-5 pt-3 space-y-2.5">
                  {/* Name */}
                  <h3 className="font-extrabold text-gray-900 text-sm sm:text-base leading-snug line-clamp-2">
                    {name}
                  </h3>

                  {/* Reg Number */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 bg-gradient-to-br ${colors.bar}`} />
                    <span className="font-mono font-semibold text-gray-600">{regNo}</span>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-100" />

                  {/* Role + Work */}
                  <div className="flex items-start justify-between gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colors.badge}`}>
                      {title}
                    </span>
                    {work && (
                      <span className="text-xs text-gray-400 text-right leading-tight max-w-[120px] line-clamp-2">
                        {work}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
}
