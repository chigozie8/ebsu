import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { db } from "../../config/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import type { CalendarEvent } from "../../types/events";

// ── helpers ────────────────────────────────────────────────────────────────

function getNextEvent(events: CalendarEvent[]): CalendarEvent | null {
  const now = Date.now();
  const upcoming = events
    .filter((e) => {
      const ts = e.time
        ? new Date(`${e.date}T${e.time}`).getTime()
        : new Date(`${e.date}T00:00:00`).getTime();
      return ts > now;
    })
    .sort((a, b) => {
      const ta = a.time ? new Date(`${a.date}T${a.time}`).getTime() : new Date(`${a.date}T00:00:00`).getTime();
      const tb = b.time ? new Date(`${b.date}T${b.time}`).getTime() : new Date(`${b.date}T00:00:00`).getTime();
      return ta - tb;
    });
  return upcoming[0] ?? null;
}

function getTargetMs(event: CalendarEvent): number {
  return event.time
    ? new Date(`${event.date}T${event.time}`).getTime()
    : new Date(`${event.date}T00:00:00`).getTime();
}

function calcTimeLeft(targetMs: number) {
  const diff = Math.max(0, targetMs - Date.now());
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    done:    diff === 0,
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

const TYPE_GRADIENT: Record<string, string> = {
  exam:     "from-red-600 to-rose-500",
  lecture:  "from-blue-600 to-cyan-500",
  meeting:  "from-amber-500 to-yellow-400",
  social:   "from-green-600 to-emerald-500",
  deadline: "from-orange-600 to-amber-500",
};

// ── Flip digit ─────────────────────────────────────────────────────────────

const FlipDigit: React.FC<{ value: string }> = ({ value }) => {
  const prev = useRef(value);
  const changed = prev.current !== value;
  useEffect(() => { prev.current = value; });

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={value}
        initial={changed ? { y: -28, opacity: 0 } : false}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 28, opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
        className="block"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
};

// ── Digit block ────────────────────────────────────────────────────────────

const DigitBlock: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  const [d1, d2] = pad(value).split("");
  return (
    <div className="flex flex-col items-center gap-1.5 sm:gap-2">
      {/* Card */}
      <div className="flex gap-1 sm:gap-1.5">
        {[d1, d2].map((d, i) => (
          <div
            key={i}
            className="relative w-[52px] h-[68px] sm:w-[72px] sm:h-[90px] lg:w-[88px] lg:h-[108px]
                       bg-white/12 backdrop-blur-sm border border-white/20
                       rounded-xl sm:rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.25)]
                       flex items-center justify-center overflow-hidden"
          >
            {/* shine */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
            {/* mid line */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-px h-px bg-black/20 z-10" />
            <span
              className="relative z-20 text-white font-black
                         text-3xl sm:text-5xl lg:text-6xl
                         leading-none tracking-tight overflow-hidden"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              <FlipDigit value={d} />
            </span>
          </div>
        ))}
      </div>
      {/* Label */}
      <span className="text-white/70 text-[10px] sm:text-xs font-semibold uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
};

// ── Separator ──────────────────────────────────────────────────────────────

const Sep: React.FC = () => (
  <div className="flex flex-col gap-2 pb-5 sm:pb-6 self-end">
    <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
    <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────

export default function EventCountdown() {
  const navigate = useNavigate();
  const [events, setEvents]     = useState<CalendarEvent[]>([]);
  const [loading, setLoading]   = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, done: false });
  const [confetti, setConfetti] = useState(false);

  // Fetch once
  useEffect(() => {
    (async () => {
      try {
        const q    = query(collection(db, "events"), orderBy("date", "asc"));
        const snap = await getDocs(q);
        setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as CalendarEvent[]);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  const nextEvent = getNextEvent(events);

  // Countdown tick
  useEffect(() => {
    if (!nextEvent) return;
    const target = getTargetMs(nextEvent);
    const tick = () => {
      const tl = calcTimeLeft(target);
      setTimeLeft(tl);
      if (tl.done) setConfetti(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextEvent?.id]);

  const grad = nextEvent ? (TYPE_GRADIENT[nextEvent.type] ?? "from-green-600 to-emerald-500") : "from-green-700 to-emerald-600";

  // Don't render if no upcoming event and finished loading
  if (!loading && !nextEvent) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden
                  bg-gradient-to-br ${grad}
                  shadow-[0_20px_60px_rgba(0,0,0,0.2)]
                  p-5 sm:p-8 lg:p-10`}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Glow orbs */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-black/15 blur-2xl pointer-events-none" />

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        </div>
      ) : nextEvent ? (
        <div className="relative z-10 flex flex-col gap-4 sm:gap-6">
          {/* Event meta */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="inline-block bg-white/20 backdrop-blur-sm text-white/90 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/25 mb-2">
                {nextEvent.type} — upcoming
              </span>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-tight text-balance">
                {nextEvent.title}
              </h2>
              <p className="text-white/70 text-xs sm:text-sm mt-1 font-medium">
                {new Date(`${nextEvent.date}T${nextEvent.time ?? "00:00"}`).toLocaleDateString("en-NG", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })}
                {nextEvent.time ? ` at ${nextEvent.time}` : ""}
                {nextEvent.location ? ` · ${nextEvent.location}` : ""}
              </p>
            </div>
          </div>

          {/* Countdown blocks */}
          {timeLeft.done ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center justify-center py-4"
            >
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-5 text-center border border-white/30">
                <div className="text-4xl mb-2">🎉</div>
                <p className="text-white font-extrabold text-lg">Event is happening now!</p>
                <p className="text-white/70 text-sm mt-1">Go check it out</p>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-end justify-center gap-2 sm:gap-4">
              <DigitBlock value={timeLeft.days}    label="Days"    />
              <Sep />
              <DigitBlock value={timeLeft.hours}   label="Hours"   />
              <Sep />
              <DigitBlock value={timeLeft.minutes} label="Minutes" />
              <Sep />
              <DigitBlock value={timeLeft.seconds} label="Seconds" />
            </div>
          )}

          {/* CTA */}
          <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
            <button
              onClick={() => navigate("/u/events")}
              className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold
                         text-sm px-6 py-3 rounded-xl shadow-lg
                         hover:shadow-xl hover:scale-[1.03] active:scale-[0.98]
                         transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              View All Events
            </button>
            <span className="text-white/60 text-xs font-medium hidden sm:block">
              {events.filter((e) => {
                const today = new Date().toISOString().split("T")[0];
                return e.date >= today;
              }).length} upcoming event(s)
            </span>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
