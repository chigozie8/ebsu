import { useState } from "react";
import { motion } from "framer-motion";
import { fadeInVariants5 } from "../../animation/variants";

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  type: "exam" | "lecture" | "meeting" | "social" | "deadline";
}

const EVENT_COLORS: Record<CalendarEvent["type"], { bg: string; text: string; dot: string }> = {
  exam:     { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500"    },
  lecture:  { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500"   },
  meeting:  { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-500"  },
  social:   { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500"  },
  deadline: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
};

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Static upcoming EBSUMSA events — replace with Firestore fetch when ready
const EVENTS: CalendarEvent[] = [
  {
    id: "1",
    title: "Anatomy Practical Exam",
    date: getDateString(0, 5),
    time: "9:00 AM",
    type: "exam",
  },
  {
    id: "2",
    title: "EBSUMSA General Meeting",
    date: getDateString(0, 8),
    time: "2:00 PM",
    type: "meeting",
  },
  {
    id: "3",
    title: "Physiology Lecture",
    date: getDateString(0, 3),
    time: "8:00 AM",
    type: "lecture",
  },
  {
    id: "4",
    title: "Course Registration Deadline",
    date: getDateString(0, 12),
    time: "5:00 PM",
    type: "deadline",
  },
  {
    id: "5",
    title: "Cultural Day Celebration",
    date: getDateString(0, 15),
    time: "10:00 AM",
    type: "social",
  },
  {
    id: "6",
    title: "Biochemistry Exam",
    date: getDateString(0, 20),
    time: "10:00 AM",
    type: "exam",
  },
];

// Helper: returns a date string N months from now + D days offset
function getDateString(monthOffset: number, dayOffset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthOffset);
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().split("T")[0];
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function EventsWidget({ customIndex = 7 }: { customIndex?: number }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().split("T")[0]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  // Map event dates for quick lookup
  const eventDateMap = new Set(EVENTS.map((e) => e.date));

  // Events on the selected date
  const selectedEvents = EVENTS.filter((e) => e.date === selectedDate);

  // Upcoming events from today (sorted)
  const upcomingEvents = EVENTS
    .filter((e) => e.date >= today.toISOString().split("T")[0])
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const formatDisplayDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return `${MONTHS[m - 1]} ${d}, ${y}`;
  };

  const getDaysUntil = (dateStr: string) => {
    const then = new Date(dateStr);
    const now = new Date(today.toISOString().split("T")[0]);
    const diff = Math.ceil((then.getTime() - now.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    return `In ${diff} days`;
  };

  return (
    <motion.div
      variants={fadeInVariants5}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      custom={customIndex}
      className="shadow rounded-2xl w-full overflow-hidden bg-white"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-3 xxss:px-4 py-3 xxss:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 xxss:w-5 xxss:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-white font-bold text-xs xxss:text-sm">Events & Calendar</span>
          </div>
          {upcomingEvents.length > 0 && (
            <span className="bg-white/20 text-white text-xss xxss:text-xs px-2 py-0.5 rounded-full font-medium">
              {upcomingEvents.length} upcoming
            </span>
          )}
        </div>
      </div>

      {/* Calendar */}
      <div className="px-2.5 xxss:px-3 pt-3 xxss:pt-4 pb-2">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-2 xxss:mb-3">
          <button
            onClick={prevMonth}
            className="w-6 h-6 xxss:w-7 xxss:h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xs xxss:text-sm font-semibold text-gray-800">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            className="w-6 h-6 xxss:w-7 xxss:h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Next month"
          >
            <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xss xxss:text-sss font-semibold text-gray-400 py-0.5">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = toKey(viewYear, viewMonth, day);
            const isToday =
              day === today.getDate() &&
              viewMonth === today.getMonth() &&
              viewYear === today.getFullYear();
            const isSelected = key === selectedDate;
            const hasEvent = eventDateMap.has(key);

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(key)}
                className={`relative flex flex-col items-center justify-center aspect-square rounded-full text-xss xxss:text-sss font-medium transition-colors mx-px my-px
                  ${isSelected ? "bg-green-600 text-white" : isToday ? "bg-green-100 text-green-700 font-bold" : "hover:bg-gray-100 text-gray-700"}
                `}
              >
                {day}
                {hasEvent && (
                  <span
                    className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-green-500"}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-gray-100" />

      {/* Selected date events */}
      <div className="px-2.5 xxss:px-3 py-2 xxss:py-3">
        <p className="text-xss xxss:text-xs font-semibold text-gray-500 mb-1.5 xxss:mb-2 uppercase tracking-wide">
          {selectedDate === today.toISOString().split("T")[0] ? "Today" : formatDisplayDate(selectedDate)}
        </p>

        {selectedEvents.length > 0 ? (
          <div className="space-y-1.5">
            {selectedEvents.map((event) => {
              const color = EVENT_COLORS[event.type];
              return (
                <div key={event.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${color.bg}`}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xss xxss:text-xs font-semibold truncate ${color.text}`}>{event.title}</p>
                    {event.time && (
                      <p className="text-sss xxss:text-xss text-gray-500">{event.time}</p>
                    )}
                  </div>
                  <span className={`text-xss xxss:text-xs font-medium capitalize flex-shrink-0 ${color.text}`}>
                    {event.type}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xss xxss:text-xs text-gray-400 text-center py-2">No events on this day</p>
        )}
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-gray-100" />

      {/* Upcoming events */}
      <div className="px-2.5 xxss:px-3 py-2 xxss:py-3">
        <p className="text-xss xxss:text-xs font-semibold text-gray-500 mb-1.5 xxss:mb-2 uppercase tracking-wide">
          Upcoming
        </p>
        {upcomingEvents.length > 0 ? (
          <div className="space-y-1.5">
            {upcomingEvents.map((event) => {
              const color = EVENT_COLORS[event.type];
              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedDate(event.date)}
                  className="w-full flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors text-left"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xss xxss:text-xs font-semibold text-gray-800 truncate">{event.title}</p>
                    <p className="text-sss xxss:text-xss text-gray-400">{event.time}</p>
                  </div>
                  <span className={`text-sss xxss:text-xss font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${color.bg} ${color.text}`}>
                    {getDaysUntil(event.date)}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xss xxss:text-xs text-gray-400 text-center py-2">No upcoming events</p>
        )}
      </div>
    </motion.div>
  );
}
