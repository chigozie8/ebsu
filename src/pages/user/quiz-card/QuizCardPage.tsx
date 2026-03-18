/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavLink } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import toast from "react-hot-toast";
import { BookOpen, Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizFromDB {
  id: string;
  title: string;
  description: string;
  total_questions: number;
  duration_minutes: number;
  pass_score: number;
  is_published: boolean;
}

interface QuestionFromDB {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: string;
  explanation: string | null;
  points: number;
  order_index: number;
}

interface AnswerFromDB {
  id: string;
  question_id: string;
  answer_text: string;
  is_correct: boolean;
  order_index: number;
}

interface Option {
  label: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: Option[];
  correctAnswer: string;
  explanation: string;
}

type QuizMode = "select" | "setup" | "quiz" | "review" | "results";

// ─── Helper Utilities ─────────────────────────────────────────────────────────

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

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
  // Database state
  const [availableQuizzes, setAvailableQuizzes] = useState<QuizFromDB[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizFromDB | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Quiz config state
  const [mode, setMode] = useState<QuizMode>("select");
  const [questionCount, setQuestionCount] = useState(5);
  const [timeLimit, setTimeLimit] = useState(0);
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

  // ── Fetch available quizzes from Supabase ──
  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoadingQuizzes(true);
      try {
        const { data, error } = await supabase
          .from("quizzes")
          .select("id, title, description, total_questions, duration_minutes, pass_score, is_published")
          .eq("is_published", true)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("[v0] Error fetching quizzes:", error);
          toast.error("Failed to load quizzes");
          setAvailableQuizzes([]);
        } else {
          setAvailableQuizzes(data || []);
        }
      } catch (err) {
        console.error("[v0] Unexpected error:", err);
        setAvailableQuizzes([]);
      } finally {
        setLoadingQuizzes(false);
      }
    };

    fetchQuizzes();
  }, []);

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

  // ── Select a quiz and go to setup ──
  const handleSelectQuiz = (quiz: QuizFromDB) => {
    setSelectedQuiz(quiz);
    setQuestionCount(Math.min(quiz.total_questions, 10));
    setTimeLimit(quiz.duration_minutes || 0);
    setMode("setup");
  };

  // ── Start Quiz - fetch questions from Supabase ──
  const startQuiz = async () => {
    if (!selectedQuiz) return;

    setLoadingQuestions(true);
    try {
      // Fetch questions for this quiz
      const { data: questionsData, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("id, quiz_id, question_text, question_type, explanation, points, order_index")
        .eq("quiz_id", selectedQuiz.id)
        .order("order_index", { ascending: true });

      if (questionsError || !questionsData || questionsData.length === 0) {
        console.error("[v0] Error fetching questions:", questionsError);
        toast.error("No questions found for this quiz");
        setLoadingQuestions(false);
        return;
      }

      // Fetch answers for all questions
      const questionIds = questionsData.map((q: QuestionFromDB) => q.id);
      const { data: answersData, error: answersError } = await supabase
        .from("quiz_answers")
        .select("id, question_id, answer_text, is_correct, order_index")
        .in("question_id", questionIds)
        .order("order_index", { ascending: true });

      if (answersError) {
        console.error("[v0] Error fetching answers:", answersError);
        toast.error("Failed to load quiz answers");
        setLoadingQuestions(false);
        return;
      }

      // Map answers to questions
      const answersByQuestion: Record<string, AnswerFromDB[]> = {};
      (answersData || []).forEach((a: AnswerFromDB) => {
        if (!answersByQuestion[a.question_id]) {
          answersByQuestion[a.question_id] = [];
        }
        answersByQuestion[a.question_id].push(a);
      });

      // Convert to quiz format
      const labels = ["A", "B", "C", "D", "E", "F"];
      const formattedQuestions: QuizQuestion[] = questionsData.map((q: QuestionFromDB) => {
        const qAnswers = answersByQuestion[q.id] || [];
        const options: Option[] = qAnswers.map((a, idx) => ({
          label: labels[idx] || String(idx + 1),
          text: a.answer_text,
        }));
        const correctIdx = qAnswers.findIndex((a) => a.is_correct);
        const correctLabel = labels[correctIdx] || "A";

        return {
          id: q.id,
          question: q.question_text,
          options: shuffleOptions ? shuffle(options) : options,
          correctAnswer: shuffleOptions
            ? labels[options.findIndex((o) => o.text === qAnswers[correctIdx]?.answer_text)] || correctLabel
            : correctLabel,
          explanation: q.explanation || "No explanation provided.",
        };
      });

      // Shuffle and pick questions
      const picked = shuffle(formattedQuestions).slice(0, questionCount);

      // Re-calculate correct answers after shuffle if options were shuffled
      const prepared = picked.map((q) => {
        if (shuffleOptions) {
          const correctText = formattedQuestions.find((fq) => fq.id === q.id)?.options.find(
            (o) => o.label === formattedQuestions.find((fq2) => fq2.id === q.id)?.correctAnswer
          )?.text;
          const newCorrectIdx = q.options.findIndex((o) => o.text === correctText);
          return {
            ...q,
            correctAnswer: labels[newCorrectIdx] || "A",
          };
        }
        return q;
      });

      setQuestions(prepared);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setRevealed(false);
      setAnswers({});
      setReviewIndex(0);

      if (timeLimit > 0) {
        setTimeLeft(timeLimit * 60);
        setTimerActive(true);
      }
      setMode("quiz");
    } catch (err) {
      console.error("[v0] Error starting quiz:", err);
      toast.error("Failed to start quiz");
    } finally {
      setLoadingQuestions(false);
    }
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
      <div className="pt-[70px] xxss:pt-[80px] ss:pt-[90px] sm:pt-[105px] min-h-screen flex flex-col">
        {/* Breadcrumb / timer bar */}
        <div className="flex items-center gap-2 px-4 sm:px-8 py-3 bg-white border-b border-gray-200">
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
          <span className="font-semibold text-gray-800 text-sm">Quiz</span>
          {mode === "quiz" && timeLimit > 0 && (
            <div className="ml-auto">
              <Timer seconds={timeLeft} />
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {/* ── SELECT QUIZ SCREEN ── */}
          {mode === "select" && (
            <motion.div key="select" {...fadeSlide} className="flex-1 px-4 py-8">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Select a Quiz</h1>
                  <p className="text-sm text-gray-500 mt-1">Choose from available quizzes uploaded by your instructors.</p>
                </div>

                {loadingQuizzes ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#00875a]" />
                  </div>
                ) : availableQuizzes.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No Quizzes Available</h3>
                    <p className="text-sm text-gray-500">Check back later or contact your instructor.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableQuizzes.map((quiz) => (
                      <motion.div
                        key={quiz.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectQuiz(quiz)}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:border-[#00875a] hover:shadow-md transition-all"
                      >
                        <h3 className="font-semibold text-gray-900 mb-2">{quiz.title}</h3>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{quiz.description || "No description"}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {quiz.total_questions} questions
                          </span>
                          {quiz.duration_minutes > 0 && (
                            <span className="flex items-center gap-1">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              {quiz.duration_minutes} min
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── SETUP SCREEN ── */}
          {mode === "setup" && selectedQuiz && (
            <motion.div key="setup" {...fadeSlide} className="flex-1 flex items-start justify-center px-4 py-8">
              <div className="w-full max-w-lg">
                <button
                  onClick={() => setMode("select")}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-[#00875a] text-sm mb-4 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  Back to Quizzes
                </button>

                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">{selectedQuiz.title}</h1>
                  <p className="text-sm text-gray-500 mt-1">{selectedQuiz.description || "Configure your quiz session."}</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                  {/* Number of questions */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Questions: <span className="text-[#00875a]">{questionCount}</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={selectedQuiz.total_questions}
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="w-full accent-[#00875a]"
                    />
                    <div className="flex justify-between text-xss text-gray-400 mt-1">
                      <span>1</span>
                      <span>{Math.floor(selectedQuiz.total_questions / 2)}</span>
                      <span>{selectedQuiz.total_questions}</span>
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
                      max={60}
                      step={5}
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(Number(e.target.value))}
                      className="w-full accent-[#00875a]"
                    />
                    <div className="flex justify-between text-xss text-gray-400 mt-1">
                      <span>None</span>
                      <span>60 min</span>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-3">
                    {(
                      [
                        { label: "Shuffle answer options", val: shuffleOptions, set: setShuffleOptions },
                        { label: "Show explanations after answer", val: showExplanations, set: setShowExplanations },
                      ] as { label: string; val: boolean; set: React.Dispatch<React.SetStateAction<boolean>> }[]
                    ).map(({ label, val, set }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{label}</span>
                        <button
                          onClick={() => set((v) => !v)}
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
                    disabled={loadingQuestions}
                    className="w-full bg-[#00875a] hover:bg-[#21875a] text-white font-semibold py-3 rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loadingQuestions ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Start Quiz"
                    )}
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
                      onClick={() => setMode("select")}
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
                    {answers[reviewIndex] === questions[reviewIndex]?.correctAnswer ? (
                      <span className="ml-auto text-xss bg-green-100 text-green-700 px-2 py-1 rounded-md font-medium">Correct</span>
                    ) : answers[reviewIndex] === null || answers[reviewIndex] === undefined ? (
                      <span className="ml-auto text-xss bg-gray-100 text-gray-500 px-2 py-1 rounded-md font-medium">Skipped</span>
                    ) : (
                      <span className="ml-auto text-xss bg-red-100 text-red-600 px-2 py-1 rounded-md font-medium">Incorrect</span>
                    )}
                  </div>

                  <p className="text-sm sm:text-base font-semibold text-gray-900 leading-relaxed mb-4">
                    {questions[reviewIndex]?.question}
                  </p>

                  <div className="space-y-2.5">
                    {questions[reviewIndex]?.options.map((opt) => (
                      <div
                        key={opt.label}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium ${optionBg(
                          opt.label,
                          answers[reviewIndex] ?? null,
                          questions[reviewIndex]?.correctAnswer,
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
                    <p className="text-sm text-blue-900 leading-relaxed">{questions[reviewIndex]?.explanation}</p>
                  </div>

                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => setReviewIndex((i) => Math.max(0, i - 1))}
                      disabled={reviewIndex === 0}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setReviewIndex((i) => Math.min(questions.length - 1, i + 1))}
                      disabled={reviewIndex >= questions.length - 1}
                      className="flex-1 py-2.5 rounded-xl bg-[#00875a] hover:bg-[#21875a] text-white text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      Next
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
