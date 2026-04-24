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
    gradient: "from-emerald-600 to-teal-500",
    accent: "#10b981",
  },
  {
    name: "Victor",
    department: "Medicine and Surgery",
    level: "400 Level",
    role: "Frontend Engineer",
    email: "oohveeyuu070@gmail.com",
    github: "https://github.com",
    image: member2,
    gradient: "from-blue-600 to-cyan-500",
    accent: "#3b82f6",
  },
  {
    name: "Geoffrey",
    department: "Medicine and Surgery",
    level: "400 Level",
    role: "Backend Engineer",
    email: "Redress6310.com@gmail.com",
    github: "https://github.com",
    image: member3,
    gradient: "from-violet-600 to-purple-500",
    accent: "#8b5cf6",
  },
];

// ─── Role icon SVGs ────────────────────────────────────────────────────────────
const RoleIcon = ({ role }: { role: string }) => {
  if (role.toLowerCase().includes("senior") || role.toLowerCase().includes("software"))
    return (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    );
  if (role.toLowerCase().includes("frontend"))
    return (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    );
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
    </svg>
  );
};

// ─── Card Component ────────────────────────────────────────────────────────────
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
      rotateY: x / 14,
      rotateX: -y / 14,
      duration: 0.4,
      ease: "power2.out",
      transformPerspective: 800,
    });
  };

  const handleMouseLeave = () => {
    gsap.to(innerRef.current, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.7,
      ease: "elastic.out(1, 0.5)",
    });
  };

  return (
    <div
      ref={cardRef}
      className="team-card"
      style={{ perspective: "800px", cursor: "default" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={innerRef}
        style={{ transformStyle: "preserve-3d", willChange: "transform" }}
        className="relative bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
      >
        {/* Top gradient banner */}
        <div className={`h-32 bg-gradient-to-br ${member.gradient} relative overflow-hidden`}>
          {/* Decorative orbs */}
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
          <div className="absolute top-3 left-4">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white/90 border border-white/20 bg-white/10 backdrop-blur-sm"
              style={{ transform: "translateZ(20px)" }}
            >
              <RoleIcon role={member.role} />
              {member.role}
            </span>
          </div>
        </div>

        {/* Avatar — floats above the gradient */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: "72px", transform: "translateX(-50%) translateZ(40px)" }}
        >
          <div
            className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg"
            style={{ boxShadow: `0 8px 32px ${member.accent}55` }}
          >
            <img
              src={member.image}
              alt={member.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Content */}
        <div className="pt-14 pb-6 px-6 text-center" style={{ transform: "translateZ(10px)" }}>
          <h3 className="text-xl font-extrabold text-gray-900">{member.name}</h3>
          <p className="text-xs font-semibold text-gray-400 mt-1">{member.department}</p>
          <span
            className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: member.accent }}
          >
            {member.level}
          </span>

          {/* Divider */}
          <div className="h-px bg-gray-100 my-5" />

          {/* Links */}
          <div className="flex items-center justify-center gap-3">
            <Link
              to={`mailto:${member.email}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-transform hover:scale-105"
              style={{ backgroundColor: member.accent }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </Link>
            <Link
              to={member.github}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gray-900 text-white transition-transform hover:scale-105"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.38 7.86 10.9.57.1.78-.25.78-.55v-1.92c-3.19.69-3.86-1.54-3.86-1.54-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.53-2.55-.29-5.23-1.27-5.23-5.67 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.9 10.9 0 012.87-.39c.97 0 1.95.13 2.87.39 2.18-1.48 3.14-1.17 3.14-1.17.63 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.41-2.69 5.38-5.25 5.66.41.36.78 1.07.78 2.15v3.19c0 .3.2.66.79.55C20.22 21.38 23.5 17.08 23.5 12 23.5 5.73 18.27.5 12 .5z" />
              </svg>
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ProjectTeam() {
  const pageRef   = useRef<HTMLDivElement>(null);
  const heroRef   = useRef<HTMLDivElement>(null);
  const titleRef  = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const gridRef   = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  // Three refs per card — outer wrapper (for ScrollTrigger), inner (for tilt)
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

      // ── Hero entrance ──────────────────────────────────────────────────────
      gsap.set([titleRef.current, subtitleRef.current], { opacity: 0, y: 60, rotateX: -30, transformPerspective: 600 });
      gsap.to(titleRef.current, {
        opacity: 1, y: 0, rotateX: 0,
        duration: 1.1, ease: "power4.out", delay: 0.2,
      });
      gsap.to(subtitleRef.current, {
        opacity: 1, y: 0, rotateX: 0,
        duration: 1, ease: "power4.out", delay: 0.45,
      });

      // ── Cards — 3D flip-in on scroll ──────────────────────────────────────
      cardRefs.forEach((ref, i) => {
        if (!ref.current) return;
        gsap.set(ref.current, {
          opacity: 0,
          y: 100,
          rotateY: i % 2 === 0 ? -45 : 45,
          rotateX: -20,
          transformPerspective: 900,
          transformOrigin: "center bottom",
        });

        ScrollTrigger.create({
          trigger: ref.current,
          start: "top 88%",
          onEnter: () => {
            gsap.to(ref.current, {
              opacity: 1, y: 0, rotateY: 0, rotateX: 0,
              duration: 1.0,
              delay: i * 0.18,
              ease: "power3.out",
            });
          },
        });

        // Continuous floating idle
        gsap.to(ref.current, {
          y: "-=10",
          duration: 2.2 + i * 0.4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: i * 0.6,
        });
      });

      // ── Particle dots animation ────────────────────────────────────────────
      if (particlesRef.current) {
        const dots = particlesRef.current.querySelectorAll(".particle");
        dots.forEach((dot, i) => {
          gsap.to(dot, {
            y: `${-20 - i * 8}px`,
            x: `${Math.sin(i) * 15}px`,
            opacity: 0,
            duration: 1.8 + i * 0.3,
            ease: "power2.out",
            repeat: -1,
            delay: i * 0.25,
            repeatDelay: 0.6,
          });
        });
      }

    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen bg-[#f8fafb]">

      {/* ── Hero Header ─────────────────────────────────────────────────────── */}
      <div
        ref={heroRef}
        className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 py-24 sm:py-32"
        style={{ perspective: "1000px" }}
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Floating orbs */}
        <div className="absolute top-8 left-12 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-6 right-16 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-violet-500/5 blur-3xl" />

        {/* Rising particles */}
        <div ref={particlesRef} className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="particle absolute w-1.5 h-1.5 rounded-full opacity-60"
              style={{
                left: `${10 + i * 12}%`,
                bottom: "10%",
                backgroundColor: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"][i],
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center px-4">
          <span className="inline-block bg-white/10 text-white/80 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6 border border-white/10">
            The Builders
          </span>
          <h2
            ref={titleRef}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white text-balance leading-tight mb-4"
            style={{ textShadow: "0 4px 32px rgba(0,0,0,0.4)" }}
          >
            Meet the Project Team
          </h2>
          <p
            ref={subtitleRef}
            className="text-gray-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed"
          >
            The creative minds and engineers who built and maintain the EBSUMSA platform.
          </p>
        </div>
      </div>

      {/* ── Cards Grid ──────────────────────────────────────────────────────── */}
      <div className="box-width">
        <div ref={gridRef} className="px-4 sm:px-10 lg:px-12 py-20">
          <div className="flex flex-wrap items-start justify-center gap-10">
            {teamMembers.map((member, i) => (
              <div key={member.name} className="w-[300px] sm:w-[320px]">
                <TeamCard
                  member={member}
                  cardRef={cardRefs[i]}
                  innerRef={innerRefs[i]}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
