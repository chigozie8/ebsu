/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { motion } from "framer-motion";
import { fadeInVariants5 } from "../../animation/variants";
import placeholder from "../../assets/images/placeholder.jpg";
import { GeneralNavbar } from "../../components/navbar/GeneralNavbar";
import Footer from "../../components/footer/Footer";

export interface AlumniMember {
  id: string;
  fullName: string;
  role: string;
  yearServed: string; // e.g. "2023/2024"
  imageUrl?: string;
  bio?: string;
  createdAt?: any;
}

export default function AlumniPage() {
  const [alumni, setAlumni] = useState<AlumniMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");

  useEffect(() => {
    window.scrollTo(0, 0);
    getDocs(query(collection(db, "alumni"), orderBy("yearServed", "desc")))
      .then((snap) => {
        setAlumni(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as AlumniMember))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const years = ["all", ...Array.from(new Set(alumni.map((a) => a.yearServed))).sort((a, b) => b.localeCompare(a))];

  const filtered = alumni.filter((a) => {
    const matchSearch =
      a.fullName.toLowerCase().includes(search.toLowerCase()) ||
      a.role.toLowerCase().includes(search.toLowerCase());
    const matchYear = selectedYear === "all" || a.yearServed === selectedYear;
    return matchSearch && matchYear;
  });

  // Group by year
  const grouped: Record<string, AlumniMember[]> = {};
  filtered.forEach((a) => {
    if (!grouped[a.yearServed]) grouped[a.yearServed] = [];
    grouped[a.yearServed].push(a);
  });
  const sortedYears = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-white">
      <GeneralNavbar />

      {/* Hero */}
      <section className="pt-[80px] ss:pt-[90px] sm:pt-[105px] bg-green2">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 text-center">
          <motion.p
            variants={fadeInVariants5}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            custom={1}
            className="text-white/80 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3"
          >
            EBSUMSA
          </motion.p>
          <motion.h1
            variants={fadeInVariants5}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            custom={2}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 text-balance"
          >
            Alumni Hall of Service
          </motion.h1>
          <motion.p
            variants={fadeInVariants5}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            custom={3}
            className="text-white/75 text-sm sm:text-base max-w-xl mx-auto"
          >
            Honouring past EBSUMSA executives who dedicated their time and
            leadership to advance the medical student community at EBSU.
          </motion.p>
        </div>

        {/* Wave divider */}
        <svg
          className="w-full block"
          viewBox="0 0 1440 48"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M0,48 C360,0 1080,0 1440,48 L1440,48 L0,48 Z"
            fill="#ffffff"
          />
        </svg>
      </section>

      {/* Filters */}
      <section className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green2/30 focus:border-green2 transition-colors"
        />
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green2/30 focus:border-green2 transition-colors bg-white"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y === "all" ? "All Years" : `${y} Administration`}
            </option>
          ))}
        </select>
      </section>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded-2xl bg-gray-100 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-3/4 mx-auto mb-2" />
                <div className="h-2 bg-gray-100 rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : alumni.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No alumni added yet</h3>
            <p className="text-sm text-gray-400">Alumni will appear here once added by the admin.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-sm">No alumni match your search.</p>
          </div>
        ) : (
          sortedYears.map((year) => (
            <div key={year} className="mb-12">
              {/* Year header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="px-4 py-1.5 bg-green2 text-white text-xs font-bold rounded-full tracking-wide">
                  {year} Administration
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {grouped[year].map((member, i) => (
                  <motion.div
                    key={member.id}
                    variants={fadeInVariants5}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                    custom={i + 1}
                    className="flex flex-col items-center text-center group"
                  >
                    <div className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-gray-100 group-hover:border-green2 transition-colors duration-300 mb-3 shadow-sm">
                      <img
                        src={member.imageUrl || placeholder}
                        alt={member.fullName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = placeholder;
                        }}
                      />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug text-balance">
                      {member.fullName}
                    </h3>
                    <p className="text-xss sm:text-xs text-green2 font-semibold mt-0.5">
                      {member.role}
                    </p>
                    {member.bio && (
                      <p className="text-xss text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                        {member.bio}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      <Footer />
    </div>
  );
}
