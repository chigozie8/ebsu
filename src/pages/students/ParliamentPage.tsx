import Footer from "../../components/footer/Footer";
import { motion } from "framer-motion";
import { fadeInVariants3 } from "../../animation/variants";
import { useEffect, useState } from "react";
import placeholder from "../../assets/img/team/placeholder.png";
import { supabase } from "../../config/supabase";
import { IoCall, IoMail } from "react-icons/io5";

interface ParliamentMember {
  id: string;
  name: string;
  role: string;
  image: string;
  extra?: string; // phone
}

const defaultSpeaker: ParliamentMember = {
  id: "parliament-speaker",
  name: "Name Here",
  role: "Speaker of Parliament",
  image: placeholder,
  extra: "",
};

const defaultDeputySpeaker: ParliamentMember = {
  id: "parliament-deputy-speaker",
  name: "Name Here",
  role: "Deputy Speaker",
  image: placeholder,
  extra: "",
};

const defaultMembers: ParliamentMember[] = [
  { id: "parliament-0",  name: "Name Here", role: "Majority Leader",          image: placeholder, extra: "" },
  { id: "parliament-1",  name: "Name Here", role: "Minority Leader",          image: placeholder, extra: "" },
  { id: "parliament-2",  name: "Name Here", role: "Majority Whip",            image: placeholder, extra: "" },
  { id: "parliament-3",  name: "Name Here", role: "Minority Whip",            image: placeholder, extra: "" },
  { id: "parliament-4",  name: "Name Here", role: "Clerk of Parliament",      image: placeholder, extra: "" },
  { id: "parliament-5",  name: "Name Here", role: "Member of Parliament",     image: placeholder, extra: "" },
  { id: "parliament-6",  name: "Name Here", role: "Member of Parliament",     image: placeholder, extra: "" },
  { id: "parliament-7",  name: "Name Here", role: "Member of Parliament",     image: placeholder, extra: "" },
  { id: "parliament-8",  name: "Name Here", role: "Member of Parliament",     image: placeholder, extra: "" },
  { id: "parliament-9",  name: "Name Here", role: "Member of Parliament",     image: placeholder, extra: "" },
];

// ─── Speaker Card ─────────────────────────────────────────────────────────────
const SpeakerCard = ({ member }: { member: ParliamentMember }) => (
  <motion.div
    variants={fadeInVariants3}
    initial="initial"
    whileInView="animate"
    viewport={{ once: true }}
    custom={1}
    className="relative w-full max-w-lg mx-auto overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100"
  >
    <div className="h-2 bg-green2 w-full" />
    <div className="flex flex-col sm:flex-row items-center gap-6 p-8">
      <div className="relative flex-shrink-0">
        <div className="w-36 h-36 rounded-2xl overflow-hidden ring-4 ring-green2/20 shadow-lg">
          <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
        </div>
        <span className="absolute -bottom-2 -right-2 bg-green2 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-md uppercase tracking-wide">
          Speaker
        </span>
      </div>
      <div className="flex-1 text-center sm:text-left">
        <p className="text-xs font-bold text-green2 uppercase tracking-widest mb-1">Speaker of Parliament</p>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-balance leading-tight">
          {member.name}
        </h3>
        {member.extra && (
          <a
            href={`tel:${member.extra}`}
            className="mt-4 inline-flex items-center gap-2 bg-green2/10 text-green2 hover:bg-green2 hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
          >
            <IoCall className="text-base" />
            {member.extra}
          </a>
        )}
      </div>
    </div>
  </motion.div>
);

// ─── Member Card ──────────────────────────────────────────────────────────────
const MemberCard = ({ member, index }: { member: ParliamentMember; index: number }) => (
  <motion.div
    variants={fadeInVariants3}
    initial="initial"
    whileInView="animate"
    viewport={{ once: true }}
    custom={index}
    className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
  >
    <div className="relative h-44 bg-gray-100 overflow-hidden">
      <img
        src={member.image}
        alt={member.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      <div className="absolute bottom-3 left-3 right-3">
        <span className="inline-block bg-green2 text-white text-xs font-bold px-2.5 py-1 rounded-lg leading-tight">
          {member.role}
        </span>
      </div>
    </div>
    <div className="p-4">
      <h4 className="font-bold text-gray-900 text-sm leading-snug">{member.name}</h4>
      {member.extra ? (
        <a
          href={`tel:${member.extra}`}
          className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-green2 transition-colors"
        >
          <IoCall className="text-xs flex-shrink-0" />
          {member.extra}
        </a>
      ) : (
        <p className="mt-1.5 text-xs text-gray-300 italic">Phone not set</p>
      )}
    </div>
  </motion.div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ParliamentPage() {
  const [speaker, setSpeaker] = useState<ParliamentMember>(defaultSpeaker);
  const [deputySpeaker, setDeputySpeaker] = useState<ParliamentMember>(defaultDeputySpeaker);
  const [members, setMembers] = useState<ParliamentMember[]>(defaultMembers);

  useEffect(() => {
    window.scrollTo(0, 0);

    supabase
      .from("team_images")
      .select("member_id, image_url, name, role, extra")
      .eq("team_type", "parliament")
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) return;

        const map: Record<string, { image_url?: string; name?: string; role?: string; extra?: string }> = {};
        data.forEach((row) => { map[row.member_id] = row; });

        const speakerRow = map["parliament-speaker"];
        if (speakerRow) {
          setSpeaker((prev) => ({
            ...prev,
            name:  speakerRow.name      || prev.name,
            role:  speakerRow.role      || prev.role,
            image: speakerRow.image_url || prev.image,
            extra: speakerRow.extra     || prev.extra,
          }));
        }

        const deputyRow = map["parliament-deputy-speaker"];
        if (deputyRow) {
          setDeputySpeaker((prev) => ({
            ...prev,
            name:  deputyRow.name      || prev.name,
            role:  deputyRow.role      || prev.role,
            image: deputyRow.image_url || prev.image,
            extra: deputyRow.extra     || prev.extra,
          }));
        }

        // Check for any extra members stored beyond the defaults
        const extraMemberKeys = Object.keys(map).filter(
          (k) => k !== "parliament-speaker" && k !== "parliament-deputy-speaker" && !k.startsWith("parliament-") === false
        );

        setMembers((prev) => {
          const merged = prev.map((m) => {
            const patch = map[m.id];
            if (!patch) return m;
            return {
              ...m,
              name:  patch.name      || m.name,
              role:  patch.role      || m.role,
              image: patch.image_url || m.image,
              extra: patch.extra     ?? m.extra,
            };
          });

          // Add any extra members the admin added that aren't in defaults
          const defaultIds = new Set(prev.map((m) => m.id));
          const addedIds = new Set(["parliament-speaker", "parliament-deputy-speaker"]);
          const extras: ParliamentMember[] = [];
          Object.entries(map).forEach(([memberId, row]) => {
            if (!defaultIds.has(memberId) && !addedIds.has(memberId)) {
              extras.push({
                id: memberId,
                name:  row.name      || "Name Here",
                role:  row.role      || "Member of Parliament",
                image: row.image_url || placeholder,
                extra: row.extra     || "",
              });
            }
          });

          return [...merged, ...extras];
        });
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="box-width">
          <div className="px-4 sm:px-10 lg:px-12 py-16 sm:py-20 text-center">
            <motion.div
              variants={fadeInVariants3}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              custom={0}
            >
              <span className="inline-block bg-green2/10 text-green2 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
                EBSUMSA Parliament
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 text-balance leading-tight mb-4">
                Parliament
              </h2>
              <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                The EBSUMSA Parliament is the legislative arm of the association — responsible for making and reviewing rules, representing students, and holding the executive accountable.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="box-width">
        <div className="px-4 sm:px-10 lg:px-12 py-12 sm:py-16 space-y-16">

          {/* Speaker Spotlight */}
          <section>
            <div className="text-center mb-8">
              <h3 className="text-xl font-extrabold text-gray-900 flex items-center justify-center gap-3">
                <span className="h-px flex-1 max-w-[80px] bg-gray-200" />
                Office of the Speaker
                <span className="h-px flex-1 max-w-[80px] bg-gray-200" />
              </h3>
            </div>
            <div className="flex flex-col lg:flex-row gap-6 max-w-3xl mx-auto">
              <div className="flex-1">
                <SpeakerCard member={speaker} />
              </div>
              <div className="flex-1">
                <motion.div
                  variants={fadeInVariants3}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  custom={2}
                  className="relative w-full overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 h-full"
                >
                  <div className="h-2 bg-green2/40 w-full" />
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-8">
                    <div className="relative flex-shrink-0">
                      <div className="w-28 h-28 rounded-2xl overflow-hidden ring-4 ring-green2/10 shadow-lg">
                        <img src={deputySpeaker.image} alt={deputySpeaker.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="absolute -bottom-2 -right-2 bg-green2/70 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-md uppercase tracking-wide">
                        Deputy
                      </span>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-xs font-bold text-green2/70 uppercase tracking-widest mb-1">Deputy Speaker</p>
                      <h3 className="text-xl font-extrabold text-gray-900 text-balance leading-tight">
                        {deputySpeaker.name}
                      </h3>
                      {deputySpeaker.extra && (
                        <a
                          href={`tel:${deputySpeaker.extra}`}
                          className="mt-3 inline-flex items-center gap-2 bg-green2/10 text-green2 hover:bg-green2 hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                        >
                          <IoCall className="text-base" />
                          {deputySpeaker.extra}
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Parliament Members Grid */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Members of Parliament</h3>
                <p className="text-xs text-gray-400 mt-1">{members.length} members</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {members.map((member, index) => (
                <MemberCard key={member.id} member={member} index={index + 2} />
              ))}
            </div>
          </section>

          {/* About + Contact */}
          <section className="grid sm:grid-cols-2 gap-6">
            <motion.div
              variants={fadeInVariants3}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              custom={2}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-8 bg-green2 rounded-full" />
                <h4 className="text-base font-extrabold text-gray-900">About the Parliament</h4>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                The EBSUMSA Parliament serves as the legislative body of the association. It is responsible for debating and passing motions, reviewing executive decisions, and ensuring that the voice of every medical student is heard and represented in association governance.
              </p>
            </motion.div>

            <motion.div
              variants={fadeInVariants3}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              custom={3}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-8 bg-green2 rounded-full" />
                  <h4 className="text-base font-extrabold text-gray-900">Get In Touch</h4>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed mb-5">
                  Have a motion, petition, or query for the parliament? Reach out directly.
                </p>
              </div>
              <a
                href="mailto:ebsumsa102@gmail.com"
                className="inline-flex items-center gap-2 bg-green2/10 hover:bg-green2 text-green2 hover:text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 w-fit"
              >
                <IoMail className="text-base" />
                ebsumsa102@gmail.com
              </a>
            </motion.div>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  );
}
