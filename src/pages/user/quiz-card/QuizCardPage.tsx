/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavLink } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Option {
  label: string; // "A" | "B" | "C" | "D"
  text: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: Option[];
  correctAnswer: string; // label e.g. "B"
  explanation: string;
  subject: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

type QuizMode = "setup" | "quiz" | "review" | "results";

// ─── Sample Medical Questions Bank ───────────────────────────────────────────

const QUESTION_BANK: QuizQuestion[] = [
  {
    id: 1,
    question: "Which of the following is the primary site of erythropoietin production in adults?",
    options: [
      { label: "A", text: "Liver" },
      { label: "B", text: "Spleen" },
      { label: "C", text: "Kidney (peritubular cells)" },
      { label: "D", text: "Bone marrow" },
    ],
    correctAnswer: "C",
    explanation: "In adults, erythropoietin (EPO) is primarily produced by peritubular fibroblast-like cells in the renal cortex in response to hypoxia. The liver is the primary source in fetal life.",
    subject: "Physiology",
    difficulty: "Medium",
  },
  {
    id: 2,
    question: "The blood-brain barrier is formed primarily by tight junctions between which cells?",
    options: [
      { label: "A", text: "Astrocytes" },
      { label: "B", text: "Brain capillary endothelial cells" },
      { label: "C", text: "Pericytes" },
      { label: "D", text: "Microglia" },
    ],
    correctAnswer: "B",
    explanation: "The blood-brain barrier is primarily formed by tight junctions (zona occludens) between brain capillary endothelial cells. Astrocytes and pericytes support and regulate the BBB but do not form the actual barrier.",
    subject: "Anatomy",
    difficulty: "Medium",
  },
  {
    id: 3,
    question: "Which enzyme is deficient in Phenylketonuria (PKU)?",
    options: [
      { label: "A", text: "Tyrosinase" },
      { label: "B", text: "Homogentisate oxidase" },
      { label: "C", text: "Phenylalanine hydroxylase" },
      { label: "D", text: "Fumarylacetoacetate hydrolase" },
    ],
    correctAnswer: "C",
    explanation: "PKU is caused by deficiency of phenylalanine hydroxylase (PAH), which converts phenylalanine to tyrosine. The accumulation of phenylalanine leads to intellectual disability if untreated.",
    subject: "Biochemistry",
    difficulty: "Easy",
  },
  {
    id: 4,
    question: "A patient presents with a deep laceration on the medial aspect of the elbow. Which structure is most at risk?",
    options: [
      { label: "A", text: "Radial nerve" },
      { label: "B", text: "Ulnar nerve" },
      { label: "C", text: "Median nerve" },
      { label: "D", text: "Musculocutaneous nerve" },
    ],
    correctAnswer: "B",
    explanation: "The ulnar nerve passes behind the medial epicondyle of the humerus through the cubital tunnel, making it highly vulnerable to injury from lacerations on the medial aspect of the elbow.",
    subject: "Anatomy",
    difficulty: "Easy",
  },
  {
    id: 5,
    question: "Which phase of the cardiac cycle has the longest duration under normal resting conditions?",
    options: [
      { label: "A", text: "Isovolumetric contraction" },
      { label: "B", text: "Ventricular ejection" },
      { label: "C", text: "Diastole (ventricular relaxation & filling)" },
      { label: "D", text: "Isovolumetric relaxation" },
    ],
    correctAnswer: "C",
    explanation: "At rest (HR ~75 bpm), the cardiac cycle lasts ~0.8 s. Diastole occupies ~0.5 s (~63%) while systole occupies ~0.3 s. Diastole is the longest phase and is the first to shorten during tachycardia.",
    subject: "Physiology",
    difficulty: "Medium",
  },
  {
    id: 6,
    question: "Warfarin inhibits which of the following?",
    options: [
      { label: "A", text: "Thrombin directly" },
      { label: "B", text: "Vitamin K epoxide reductase" },
      { label: "C", text: "Factor Xa directly" },
      { label: "D", text: "Platelet aggregation via COX-1" },
    ],
    correctAnswer: "B",
    explanation: "Warfarin inhibits Vitamin K epoxide reductase (VKORC1), preventing the recycling of Vitamin K. This leads to functional deficiency of Vitamin K-dependent clotting factors (II, VII, IX, X) and anticoagulants (Protein C, S).",
    subject: "Pharmacology",
    difficulty: "Hard",
  },
  {
    id: 7,
    question: "The Cori cycle involves transfer of which substrate from muscle to liver?",
    options: [
      { label: "A", text: "Glucose" },
      { label: "B", text: "Pyruvate" },
      { label: "C", text: "Lactate" },
      { label: "D", text: "Alanine" },
    ],
    correctAnswer: "C",
    explanation: "In the Cori cycle, lactate produced by anaerobic glycolysis in muscle is transported to the liver where it is converted back to glucose via gluconeogenesis. The glucose is then recycled back to muscle.",
    subject: "Biochemistry",
    difficulty: "Medium",
  },
  {
    id: 8,
    question: "Which cranial nerve carries parasympathetic fibers to the parotid gland?",
    options: [
      { label: "A", text: "CN VII (Facial nerve)" },
      { label: "B", text: "CN IX (Glossopharyngeal nerve)" },
      { label: "C", text: "CN X (Vagus nerve)" },
      { label: "D", text: "CN V3 (Mandibular division of trigeminal)" },
    ],
    correctAnswer: "B",
    explanation: "The glossopharyngeal nerve (CN IX) carries preganglionic parasympathetic fibers that synapse in the otic ganglion. Postganglionic fibers then travel via the auriculotemporal nerve (CN V3) to innervate the parotid gland.",
    subject: "Anatomy",
    difficulty: "Hard",
  },
  {
    id: 9,
    question: "Which of the following is a classic finding in nephrotic syndrome but NOT nephritic syndrome?",
    options: [
      { label: "A", text: "Haematuria" },
      { label: "B", text: "Hypertension" },
      { label: "C", text: "Massive proteinuria (>3.5 g/day)" },
      { label: "D", text: "Oliguria" },
    ],
    correctAnswer: "C",
    explanation: "Massive proteinuria (>3.5 g/day) is the hallmark of nephrotic syndrome causing hypoalbuminaemia, oedema, and hyperlipidaemia. Haematuria, hypertension, and oliguria are more characteristic of nephritic syndrome.",
    subject: "Pathology",
    difficulty: "Medium",
  },
  {
    id: 10,
    question: "The sinoatrial (SA) node is predominantly supplied by which artery?",
    options: [
      { label: "A", text: "Left anterior descending (LAD)" },
      { label: "B", text: "Left circumflex artery" },
      { label: "C", text: "Right coronary artery (RCA)" },
      { label: "D", text: "Posterior descending artery" },
    ],
    correctAnswer: "C",
    explanation: "The SA node is supplied by the SA nodal artery, which arises from the right coronary artery (RCA) in about 60% of people and from the left circumflex artery in about 40%. RCA occlusion can cause sinus bradycardia.",
    subject: "Anatomy",
    difficulty: "Hard",
  },
];

const SUBJECTS = ["All", "Anatomy", "Physiology", "Biochemistry", "Pharmacology", "Pathology"];
const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];

// ─── Helper Utilities ─────────────────────────────────────────────────────────

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const difficultyColor = (d: string) => {
  if (d === "Easy") return "bg-green-100 text-green-700";
  if (d === "Medium") return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
};

const optionBg = (
  label: string,
  selected: string | null,
  correct: string,
  revealed: boolean
) => {
  if (!revealed) {
    return selected === label
      ? "bg-[#00875a] text-white border-[#00875a]"
      : "bg-white text-gray-800 border-gray-200 hover:border-[#00875a] hover:bg-[#f0fdf4]";
  }
  if (label === correct) return "bg-green-500 text-white border-green-500";
  if (label === selected && label !== correct) return "bg-red-400 text-white border-red-400";
  return "bg-white text-gray-400 border-gray-100";
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <motion.div
        className="bg-[#00875a] h-2 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </div>
  );
}

function Timer({
  seconds,
  warningThreshold = 30,
}: {
  seconds: number;
  warningThreshold?: number;
}) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isWarning = seconds <= warningThreshold;
  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-semibold text-sm transition-colors ${
        isWarning ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-700"
      }`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuizCardPage() {
  const [mode, setMode] = useState<QuizMode>("setup");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [questionCount, setQuestionCount] = useState(5);
  const [timeLimit, setTimeLimit] = useState(0); // 0 = no limit
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [showExplanations, setShowExplanations] = useState(true);

  // Quiz runtime state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string | null>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);

  // ── Timer countdown ──
  const endQuiz = useCallback(() => {
    setTimerActive(false);
    setMode("results");
  }, []);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          endQuiz();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, endQuiz, timeLeft]);

  // ── Start Quiz ──
  const startQuiz = () => {
    let pool = QUESTION_BANK;
    if (selectedSubject !== "All") pool = pool.filter((q) => q.subject === selectedSubject);
    if (selectedDifficulty !== "All") pool = pool.filter((q) => q.difficulty === selectedDifficulty);

    const picked = shuffle(pool).slice(0, questionCount);
    const prepared = picked.map((q) => ({
      ...q,
      options: shuffleOptions ? shuffle(q.options) : q.options,
    }));

    setQuestions(prepared);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setRevealed(false);
    setAnswers({});
    if (timeLimit > 0) {
      setTimeLeft(timeLimit * 60);
      setTimerActive(true);
    }
    setMode("quiz");
  };

  // ── Answer selection ──
  const handleSelect = (label: string) => {
    if (revealed) return;
    setSelectedAnswer(label);
    if (!showExplanations) {
      setAnswers((prev) => ({ ...prev, [currentIndex]: label }));
    }
  };

  const handleReveal = () => {
    if (!selectedAnswer) return;
    setRevealed(true);
    setAnswers((prev) => ({ ...prev, [currentIndex]: selectedAnswer }));
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setTimerActive(false);
      setMode("results");
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setRevealed(false);
    }
  };

  const handleSkip = () => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: null }));
    handleNext();
  };

  // ── Results calc ──
  const score = questions.filter((q, i) => answers[i] === q.correctAnswer).length;
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const gradeColor = percentage >= 70 ? "text-green-600" : percentage >= 50 ? "text-yellow-600" : "text-red-500";
  const gradeLabel = percentage >= 70 ? "Excellent" : percentage >= 50 ? "Fair" : "Needs Work";

  const fadeSlide = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
    transition: { duration: 0.28 },
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Top nav bar */}
      <div className="fixed top-0 inset-x-0 z-30 bg-white border-b border-gray-200 h-14 flex items-center px-4 sm:px-8 gap-3">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-1.5 text-gray-500 hover:text-[#00875a] text-sm transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Dashboard
        </NavLink>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-gray-800 text-sm">Quiz Card</span>
        {mode === "quiz" && timeLimit > 0 && (
          <div className="ml-auto">
            <Timer seconds={timeLeft} />
          </div>
        )}
      </div>

      <div className="pt-14 min-h-screen flex flex-col">
        <AnimatePresence mode="wait">

          {/* ── SETUP SCREEN ── */}
          {mode === "setup" && (
            <motion.div key="setup" {...fadeSlide} className="flex-1 flex items-start justify-center px-4 py-8">
              <div className="w-full max-w-lg">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Quiz Card</h1>
                  <p className="text-sm text-gray-500 mt-1">Configure your quiz session and test your medical knowledge.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Subject</label>
                    <div className="flex flex-wrap gap-2">
                      {SUBJECTS.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSubject(s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            selectedSubject === s
                              ? "bg-[#00875a] text-white border-[#00875a]"
                              : "bg-white text-gray-600 border-gray-200 hover:border-[#00875a]"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Difficulty</label>
                    <div className="flex gap-2">
                      {DIFFICULTIES.map((d) => (
                        <button
                          key={d}
                          onClick={() => setSelectedDifficulty(d)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            selectedDifficulty === d
                              ? "bg-[#00875a] text-white border-[#00875a]"
                              : "bg-white text-gray-600 border-gray-200 hover:border-[#00875a]"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Number of questions */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Questions: <span className="text-[#00875a]">{questionCount}</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="w-full accent-[#00875a]"
                    />
                    <div className="flex justify-between text-xss text-gray-400 mt-1">
                      <span>1</span><span>10</span>
                    </div>
                  </div>

                  {/* Time limit */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Time Limit: <span className="text-[#00875a]">{timeLimit === 0 ? "No limit" : `${timeLimit} min`}</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={30}
                      step={5}
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(Number(e.target.value))}
                      className="w-full accent-[#00875a]"
                    />
                    <div className="flex justify-between text-xss text-gray-400 mt-1">
                      <span>None</span><span>30 min</span>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-3">
                    {[
                      { label: "Shuffle answer options", val: shuffleOptions, set: setShuffleOptions },
                      { label: "Show explanations after answer", val: showExplanations, set: setShowExplanations },
                    ].map(({ label, val, set }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{label}</span>
                        <button
                          onClick={() => set((v: boolean) => !v)}
                          className={`w-11 h-6 rounded-full transition-colors relative ${val ? "bg-[#00875a]" : "bg-gray-200"}`}
                        >
                          <span
                            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${val ? "translate-x-5" : "translate-x-0"}`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={startQuiz}
                    className="w-full bg-[#00875a] hover:bg-[#21875a] text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                  >
                    Start Quiz
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── QUIZ SCREEN ── */}
          {mode === "quiz" && questions.length > 0 && (
            <motion.div key={`quiz-${currentIndex}`} {...fadeSlide} className="flex-1 flex items-start justify-center px-4 py-6">
              <div className="w-full max-w-xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500 font-medium">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xss px-2 py-1 rounded-md font-medium ${difficultyColor(questions[currentIndex].difficulty)}`}>
                      {questions[currentIndex].difficulty}
                    </span>
                    <span className="text-xss bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-medium">
                      {questions[currentIndex].subject}
                    </span>
                  </div>
                </div>

                <ProgressBar current={currentIndex} total={questions.length} />

                {/* Question card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 mt-4">
                  <p className="text-sm sm:text-base font-semibold text-gray-900 leading-relaxed mb-5">
                    {questions[currentIndex].question}
                  </p>

                  {/* Options */}
                  <div className="space-y-2.5">
                    {questions[currentIndex].options.map((opt) => (
                      <motion.button
                        key={opt.label}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelect(opt.label)}
                        disabled={revealed}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${optionBg(
                          opt.label,
                          selectedAnswer,
                          questions[currentIndex].correctAnswer,
                          revealed
                        )}`}
                      >
                        <span className="w-7 h-7 flex-shrink-0 rounded-full border-2 border-current flex items-center justify-center text-xss font-bold">
                          {opt.label}
                        </span>
                        <span className="leading-snug">{opt.text}</span>
                        {revealed && opt.label === questions[currentIndex].correctAnswer && (
                          <svg className="ml-auto w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                        {revealed && opt.label === selectedAnswer && opt.label !== questions[currentIndex].correctAnswer && (
                          <svg className="ml-auto w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        )}
                      </motion.button>
                    ))}
                  </div>

                  {/* Explanation */}
                  <AnimatePresence>
                    {revealed && showExplanations && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
                          <p className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">Explanation</p>
                          <p className="text-sm text-blue-900 leading-relaxed">{questions[currentIndex].explanation}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action buttons */}
                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={handleSkip}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Skip
                    </button>
                    {!revealed ? (
                      <button
                        onClick={handleReveal}
                        disabled={!selectedAnswer}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                          selectedAnswer
                            ? "bg-[#00875a] hover:bg-[#21875a] text-white"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {showExplanations ? "Check Answer" : "Submit"}
                      </button>
                    ) : (
                      <button
                        onClick={handleNext}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#00875a] hover:bg-[#21875a] text-white transition-colors"
                      >
                        {currentIndex + 1 >= questions.length ? "See Results" : "Next Question"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── RESULTS SCREEN ── */}
          {mode === "results" && (
            <motion.div key="results" {...fadeSlide} className="flex-1 flex items-start justify-center px-4 py-6">
              <div className="w-full max-w-xl">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 text-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                    <span className={`text-3xl font-bold ${gradeColor}`}>{percentage}%</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{gradeLabel}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    You answered {score} out of {questions.length} questions correctly.
                  </p>
                  <div className="mt-4">
                    <ProgressBar current={score} total={questions.length} />
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 mt-6">
                    {[
                      { label: "Correct", val: score, color: "text-green-600" },
                      { label: "Wrong", val: questions.filter((q, i) => answers[i] !== null && answers[i] !== q.correctAnswer).length, color: "text-red-500" },
                      { label: "Skipped", val: questions.filter((_, i) => answers[i] === null || answers[i] === undefined).length, color: "text-gray-500" },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="bg-gray-50 rounded-xl py-3">
                        <p className={`text-xl font-bold ${color}`}>{val}</p>
                        <p className="text-xss text-gray-500">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setMode("review")}
                      className="flex-1 py-2.5 rounded-xl border border-[#00875a] text-[#00875a] text-sm font-semibold hover:bg-[#f0fdf4] transition-colors"
                    >
                      Review Answers
                    </button>
                    <button
                      onClick={() => setMode("setup")}
                      className="flex-1 py-2.5 rounded-xl bg-[#00875a] hover:bg-[#21875a] text-white text-sm font-semibold transition-colors"
                    >
                      New Quiz
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── REVIEW SCREEN ── */}
          {mode === "review" && (
            <motion.div key={`review-${reviewIndex}`} {...fadeSlide} className="flex-1 flex items-start justify-center px-4 py-6">
              <div className="w-full max-w-xl">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setMode("results")}
                    className="text-sm text-gray-500 hover:text-[#00875a] flex items-center gap-1 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    Results
                  </button>
                  <span className="text-xs text-gray-500">
                    {reviewIndex + 1} / {questions.length}
                  </span>
                </div>
                <ProgressBar current={reviewIndex + 1} total={questions.length} />

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xss px-2 py-1 rounded-md font-medium ${difficultyColor(questions[reviewIndex].difficulty)}`}>
                      {questions[reviewIndex].difficulty}
                    </span>
                    <span className="text-xss bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{questions[reviewIndex].subject}</span>
                    {answers[reviewIndex] === questions[reviewIndex].correctAnswer ? (
                      <span className="ml-auto text-xss bg-green-100 text-green-700 px-2 py-1 rounded-md font-medium">Correct</span>
                    ) : answers[reviewIndex] === null || answers[reviewIndex] === undefined ? (
                      <span className="ml-auto text-xss bg-gray-100 text-gray-500 px-2 py-1 rounded-md font-medium">Skipped</span>
                    ) : (
                      <span className="ml-auto text-xss bg-red-100 text-red-600 px-2 py-1 rounded-md font-medium">Incorrect</span>
                    )}
                  </div>

                  <p className="text-sm sm:text-base font-semibold text-gray-900 leading-relaxed mb-4">
                    {questions[reviewIndex].question}
                  </p>

                  <div className="space-y-2.5">
                    {questions[reviewIndex].options.map((opt) => (
                      <div
                        key={opt.label}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium ${optionBg(
                          opt.label,
                          answers[reviewIndex] ?? null,
                          questions[reviewIndex].correctAnswer,
                          true
                        )}`}
                      >
                        <span className="w-7 h-7 flex-shrink-0 rounded-full border-2 border-current flex items-center justify-center text-xss font-bold">
                          {opt.label}
                        </span>
                        <span>{opt.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">Explanation</p>
                    <p className="text-sm text-blue-900 leading-relaxed">{questions[reviewIndex].explanation}</p>
                  </div>

                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => setReviewIndex((i) => Math.max(0, i - 1))}
                      disabled={reviewIndex === 0}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => {
                        if (reviewIndex + 1 >= questions.length) setMode("results");
                        else setReviewIndex((i) => i + 1);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-[#00875a] hover:bg-[#21875a] text-white text-sm font-semibold transition-colors"
                    >
                      {reviewIndex + 1 >= questions.length ? "Back to Results" : "Next"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
