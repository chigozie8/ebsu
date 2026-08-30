import { Link } from "react-router-dom";
import Footer from "../../components/footer/Footer";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import chris from "../../assets/img/team/k.jpg";
import member2 from "../../assets/img/team/bbb.jpg";
import member3 from "../../assets/img/team/uuu.jpg";

gsap.registerPlugin(ScrollTrigger);

// ─── Data ─────────────────────────────────────────────────────────────────────
const teamMembers = [
  {
    name: "Ken",
    department: "Medicine and Surgery",
    level: "600 Level",
    role: "Senior Software Engineer",
    email: "kenronkwo@gmail.com",
    github: "https://github.com/kenchigozie23",
    image: chris,
    accent: "#00875a",
    accentLight: "#e6f4ef",
    gradientFrom: "#00875a",
    gradientTo: "#03ab73",
  },
  {
    name: "Victor",
    department: "Medicine and Surgery",
    level: "400 Level",
    role: "Frontend Engineer",
    email: "oohveeyuu070@gmail.com",
    github: "https://github.com",
    image: member2,
    accent: "#1d4ed8",
    accentLight: "#eff6ff",
    gradientFrom: "#1d4ed8",
    gradientTo: "#3b82f6",
  },
  {
    name: "Geoffrey",
    department: "Medicine and Surgery",
    level: "400 Level",
    role: "Backend Engineer",
    email: "Redress6310.com@gmail.com",
    github: "https://github.com",
    image: member3,
    accent: "#7c3aed",
    accentLight: "#f5f3ff",
    gradientFrom: "#7c3aed",
    gradientTo: "#a78bfa",
  },
];

// ─── Role Icon ─────────────────────────────────────────────────────────────────
const RoleIcon = ({ role }: { role: string }) => {
  if (role.toLowerCase().includes("senior") || role.toLowerCase().includes("software"))
    return (
      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    );
  if (role.toLowerCase().includes("frontend"))
    return (
      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    );
  return (
    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
    </svg>
  );
};

// ─── Team Card ─────────────────────────────────────────────────────────────────
const TeamCard = ({
  member,
  cardRef,
  innerRef,
}: {
  member: typeof teamMembers[0];
  cardRef: React.RefObject<HTMLDivElement>;
  innerRef: React.RefObject<HTMLDivElement>;
}) => {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(innerRef.current, {
      rotateY: x / 16,
      rotateX: -y / 16,
      duration: 0.35,
      ease: "power2.out",
      transformPerspective: 900,
    });
  };

  const handleMouseLeave = () => {
    gsap.to(innerRef.current, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.8,
      ease: "elastic.out(1, 0.45)",
    });
  };

  return (
    <div
      ref={cardRef}
      style={{ perspective: "900px" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={innerRef}
        style={{ transformStyle: "preserve-3d", willChange: "transform" }}
        className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-lg"
      >
        {/* Gradient banner */}
        <div
          className="h-28 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${member.gradientFrom}, ${member.gradientTo})` }}
        >
          {/* Decorative shapes */}
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/10" />
          <div className="absolute bottom-3 right-4 w-10 h-10 rounded-full bg-white/5" />

          {/* Role badge */}
          <div className="absolute top-3 left-3 right-3">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white/90 font-semibold border border-white/25 bg-black/20 backdrop-blur-sm"
              style={{ fontSize: "0.6rem", maxWidth: "100%" }}
            >
              <RoleIcon role={member.role} />
              <span className="truncate">{member.role}</span>
            </span>
          </div>
        </div>

        {/* Avatar — overlaps banner */}
        <div className="flex justify-center" style={{ marginTop: "-32px" }}>
          <div
            className="w-16 h-16 ss:w-20 ss:h-20 rounded-xl overflow-hidden border-4 border-white"
            style={{
              boxShadow: `0 6px 24px ${member.accent}50`,
              transform: "translateZ(30px)",
            }}
          >
            <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Body */}
        <div className="px-4 ss:px-6 pb-5 pt-3 text-center">
          <h3
            className="font-extrabold text-gray-900 leading-tight"
            style={{ fontSize: "1.1rem" }}
          >
            {member.name}
          </h3>
          <p className="text-gray-400 font-medium mt-0.5" style={{ fontSize: "0.7rem" }}>
            {member.department}
          </p>
          <span
            className="inline-block mt-2 px-3 py-0.5 rounded-full font-bold text-white"
            style={{ backgroundColor: member.accent, fontSize: "0.65rem" }}
          >
            {member.level}
          </span>

          {/* Divider */}
          <div className="h-px my-4" style={{ backgroundColor: member.accentLight }} />

          {/* CTA buttons */}
          <div className="flex items-center justify-center gap-2">
            <a
              href={`mailto:${member.email}`}
              className="flex items-center gap-1.5 px-3 ss:px-4 py-2 rounded-xl font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: member.accent, fontSize: "0.65rem" }}
            >
              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </a>
            <a
              href={member.github}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 ss:px-4 py-2 rounded-xl font-bold bg-gray-900 text-white transition-all hover:opacity-90 active:scale-95"
              style={{ fontSize: "0.65rem" }}
            >
              <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.38 7.86 10.9.57.1.78-.25.78-.55v-1.92c-3.19.69-3.86-1.54-3.86-1.54-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.53-2.55-.29-5.23-1.27-5.23-5.67 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.9 10.9 0 012.87-.39c.97 0 1.95.13 2.87.39 2.18-1.48 3.14-1.17 3.14-1.17.63 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.41-2.69 5.38-5.25 5.66.41.36.78 1.07.78 2.15v3.19c0 .3.2.66.79.55C20.22 21.38 23.5 17.08 23.5 12 23.5 5.73 18.27.5 12 .5z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ProjectTeam() {
  const pageRef     = useRef<HTMLDivElement>(null);
  const titleRef    = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const badgeRef    = useRef<HTMLSpanElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  const card0Ref  = useRef<HTMLDivElement>(null);
  const inner0Ref = useRef<HTMLDivElement>(null);
  const card1Ref  = useRef<HTMLDivElement>(null);
  const inner1Ref = useRef<HTMLDivElement>(null);
  const card2Ref  = useRef<HTMLDivElement>(null);
  const inner2Ref = useRef<HTMLDivElement>(null);
  const cardRefs  = [card0Ref, card1Ref, card2Ref];
  const innerRefs = [inner0Ref, inner1Ref, inner2Ref];

  useEffect(() => {
    window.scrollTo(0, 0);
    const ctx = gsap.context(() => {

      // Hero entrance
      gsap.set([badgeRef.current, titleRef.current, subtitleRef.current], {
        opacity: 0, y: 48, rotateX: -25, transformPerspective: 700,
      });
      gsap.to(badgeRef.current,    { opacity: 1, y: 0, rotateX: 0, duration: 0.9, ease: "power3.out", delay: 0.1 });
      gsap.to(titleRef.current,    { opacity: 1, y: 0, rotateX: 0, duration: 1.0, ease: "power4.out", delay: 0.28 });
      gsap.to(subtitleRef.current, { opacity: 1, y: 0, rotateX: 0, duration: 0.9, ease: "power3.out", delay: 0.44 });

      // Cards 3D scroll entrance + idle float
      cardRefs.forEach((ref, i) => {
        if (!ref.current) return;
        gsap.set(ref.current, {
          opacity: 0, y: 80,
          rotateY: i % 2 === 0 ? -40 : 40,
          rotateX: -15,
          transformPerspective: 900,
        });
        ScrollTrigger.create({
          trigger: ref.current,
          start: "top 90%",
          onEnter: () => {
            gsap.to(ref.current, {
              opacity: 1, y: 0, rotateY: 0, rotateX: 0,
              duration: 0.95,
              delay: i * 0.15,
              ease: "power3.out",
            });
          },
        });
        // Idle float
        gsap.to(ref.current, {
          y: "-=8", duration: 2.4 + i * 0.3,
          ease: "sine.inOut", repeat: -1, yoyo: true, delay: i * 0.5,
        });
      });

      // Particles
      if (particlesRef.current) {
        particlesRef.current.querySelectorAll<HTMLElement>(".particle").forEach((dot, i) => {
          gsap.fromTo(dot,
            { y: 0, opacity: 0.7 },
            { y: -(30 + i * 12), opacity: 0, duration: 2 + i * 0.25, ease: "power1.out", repeat: -1, delay: i * 0.3, repeatDelay: 0.8 }
          );
        });
      }

    }, pageRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen" style={{ backgroundColor: "#f8fafb" }}>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden py-16 ss:py-20 sm:py-28"
        style={{
          background: "linear-gradient(135deg, #0a1628 0%, #0d2240 50%, #0f2d1a 100%)",
          perspective: "1000px",
        }}
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />

        {/* Ambient glows — brand colours only */}
        <div className="absolute top-0 left-0 w-72 h-72 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #00875a, transparent 70%)", transform: "translate(-30%, -30%)" }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #03ab73, transparent 70%)", transform: "translate(30%, 30%)" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #1d4ed8, transparent 70%)", transform: "translate(-50%, -50%)" }} />

        {/* Rising particles */}
        <div ref={particlesRef} className="absolute inset-0 pointer-events-none overflow-hidden">
          {["#00875a","#03ab73","#1d4ed8","#7c3aed","#f59e0b","#10b981","#3b82f6","#8b5cf6"].map((color, i) => (
            <div
              key={i}
              className="particle absolute w-1.5 h-1.5 rounded-full"
              style={{ left: `${8 + i * 12}%`, bottom: "8%", backgroundColor: color }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center px-4">
          <span
            ref={badgeRef}
            className="inline-block px-4 py-1.5 rounded-full text-white/70 font-bold uppercase tracking-widest border border-white/10 mb-5"
            style={{ fontSize: "0.6rem", backgroundColor: "rgba(255,255,255,0.06)" }}
          >
            The Builders
          </span>
          <h2
            ref={titleRef}
            className="font-extrabold text-white text-balance leading-tight mb-4 px-2"
            style={{
              fontSize: "clamp(1.7rem, 6vw, 3.5rem)",
              textShadow: "0 4px 32px rgba(0,0,0,0.5)",
            }}
          >
            Meet the Project Team
          </h2>
          <p
            ref={subtitleRef}
            className="text-gray-400 max-w-md mx-auto leading-relaxed px-4"
            style={{ fontSize: "clamp(0.8rem, 3vw, 1rem)" }}
          >
            The creative minds and engineers who built and maintain the EBSUMSA platform.
          </p>
        </div>
      </div>

      {/* ── Cards ───────────────────────────────────────────────────────────── */}
      <div className="px-4 ss:px-6 sm:px-10 py-14 sm:py-20 max-w-5xl mx-auto">
        {/* Mobile: single column | sm: 2 col | md: 3 col */}
        <div className="grid grid-cols-1 ss:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {teamMembers.map((member, i) => (
            <TeamCard
              key={member.name}
              member={member}
              cardRef={cardRefs[i]}
              innerRef={innerRefs[i]}
            />
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
