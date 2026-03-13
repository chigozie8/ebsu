/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, BookOpen, BarChart3, Clock, Trophy, Search, Sparkles, FileText, ChevronRight, RotateCcw, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { QuizPlayer } from '../../../components/quiz/QuizPlayer';
import { PDFSummarizer } from '../../../components/quiz/PDFSummarizer';
import toast from 'react-hot-toast';

interface Quiz {
  id: string;
  title: string;
  description: string;
  total_questions: number;
  duration_minutes: number;
  is_published: boolean;
  pass_score: number;
  course_id?: string;
  created_at: string;
}

interface QuizQuestion {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface AttemptStats {
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
}

type View = 'dashboard' | 'playing' | 'results' | 'ai-generator';

const LETTER = ['A', 'B', 'C', 'D', 'E'];

const StudentQuizDashboard = () => {
  const [view, setView] = useState<View>('dashboard');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [stats, setStats] = useState<AttemptStats>({ totalAttempts: 0, averageScore: 0, bestScore: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [lastScore, setLastScore] = useState(0);

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title, description, total_questions, duration_minutes, is_published, pass_score, created_at, course_id')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (err: any) {
      toast.error('Failed to load quizzes');
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('quiz_attempts')
        .select('score, percentage')
        .eq('user_id', user.id);
      if (data && data.length > 0) {
        const scores = data.map((d: any) => Number(d.percentage) || 0);
        setStats({
          totalAttempts: data.length,
          averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
          bestScore: Math.max(...scores),
        });
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchQuizzes();
    fetchStats();
  }, [fetchQuizzes, fetchStats]);

  const startQuiz = async (quiz: Quiz) => {
    setLoadingQuiz(true);
    try {
      // Fetch questions with answers
      const { data: questionsData, error: qErr } = await supabase
        .from('quiz_questions')
        .select('id, question_text, question_type, explanation, order_index')
        .eq('quiz_id', quiz.id)
        .order('order_index');
      if (qErr) throw qErr;

      const questions: QuizQuestion[] = [];
      for (const q of (questionsData || [])) {
        const { data: answersData } = await supabase
          .from('quiz_answers')
          .select('answer_text, is_correct, order_index')
          .eq('question_id', q.id)
          .order('order_index');

        const options = (answersData || []).map((a: any) => a.answer_text);
        const correct = (answersData || []).find((a: any) => a.is_correct);
        questions.push({
          id: q.id,
          text: q.question_text,
          type: q.question_type || 'multiple_choice',
          options,
          correctAnswer: correct?.answer_text || options[0] || '',
          explanation: q.explanation || '',
        });
      }

      if (questions.length === 0) {
        toast.error('This quiz has no questions yet.');
        return;
      }

      setActiveQuiz(quiz);
      setActiveQuestions(questions);
      setView('playing');
    } catch (err: any) {
      toast.error('Failed to load quiz questions');
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleQuizComplete = (score: number) => {
    setLastScore(score);
    setView('results');
    fetchStats(); // refresh stats after completion
  };

  const filteredQuizzes = quizzes.filter(q =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fade = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -14 },
  };

  // ---- PLAYING VIEW ----
  if (view === 'playing' && activeQuiz && activeQuestions.length > 0) {
    return (
      <motion.div {...fade} className="space-y-4">
        <button onClick={() => setView('dashboard')} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to quizzes
        </button>
        <QuizPlayer
          quizId={activeQuiz.id}
          quizTitle={activeQuiz.title}
          questions={activeQuestions}
          duration={activeQuiz.duration_minutes}
          onComplete={handleQuizComplete}
        />
      </motion.div>
    );
  }

  // ---- RESULTS VIEW ----
  if (view === 'results' && activeQuiz) {
    const passed = lastScore >= (activeQuiz.pass_score || 60);
    return (
      <motion.div {...fade} className="max-w-lg mx-auto space-y-6 py-6">
        <div className={`rounded-2xl p-8 text-center space-y-4 ${passed ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
            {passed
              ? <CheckCircle className="w-10 h-10 text-green-600" />
              : <XCircle className="w-10 h-10 text-red-600" />
            }
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{lastScore}%</p>
            <p className={`text-sm font-semibold mt-1 ${passed ? 'text-green-700' : 'text-red-700'}`}>
              {passed ? 'Passed!' : 'Not passed'}
            </p>
          </div>
          <p className="text-sm text-gray-600">
            {passed
              ? 'Well done! You have passed this quiz.'
              : `Pass mark is ${activeQuiz.pass_score || 60}%. Review the material and try again.`}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Total Questions', value: activeQuestions.length, color: 'text-gray-800' },
            { label: 'Correct', value: Math.round((lastScore / 100) * activeQuestions.length), color: 'text-green-600' },
            { label: 'Incorrect', value: activeQuestions.length - Math.round((lastScore / 100) * activeQuestions.length), color: 'text-red-600' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-3">
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => startQuiz(activeQuiz)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Retry Quiz
          </button>
          <button
            onClick={() => { setView('dashboard'); setActiveQuiz(null); }}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            <BookOpen className="w-4 h-4" /> All Quizzes
          </button>
        </div>
      </motion.div>
    );
  }

  // ---- AI GENERATOR VIEW ----
  if (view === 'ai-generator') {
    return (
      <motion.div {...fade} className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('dashboard')} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">AI PDF Quiz Generator</h2>
              <p className="text-xs text-gray-500">Upload any document — AI generates questions instantly</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <PDFSummarizer />
        </div>
      </motion.div>
    );
  }

  // ---- DASHBOARD VIEW ----
  return (
    <motion.div key="dashboard" {...fade} className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Attempts', value: stats.totalAttempts, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Average Score', value: `${stats.averageScore}%`, icon: BarChart3, color: 'text-teal-500', bg: 'bg-teal-50' },
          { label: 'Best Score', value: `${stats.bestScore}%`, icon: Trophy, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Generator Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onClick={() => setView('ai-generator')}
        className="cursor-pointer bg-gradient-to-r from-teal-600 to-teal-500 rounded-2xl p-5 text-white flex items-center justify-between hover:from-teal-700 hover:to-teal-600 transition-colors shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold">AI PDF Quiz Generator</p>
            <p className="text-sm text-teal-100">Upload lecture notes or a textbook — AI builds your quiz</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-white/20 rounded-lg px-3 py-1.5 text-sm font-medium">
          Try it <ChevronRight className="w-4 h-4" />
        </div>
      </motion.div>

      {/* Search & quizzes */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search quizzes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
          />
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading quizzes...</p>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium text-gray-600">No published quizzes yet</p>
            <p className="text-xs mt-1">Use the AI Generator above to create one, or ask your admin</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredQuizzes.map((quiz, idx) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-teal-200 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center group-hover:bg-teal-200 transition-colors flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-teal-600" />
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">Published</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1.5 text-balance leading-snug">{quiz.title}</h3>
                  {quiz.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{quiz.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{quiz.total_questions} Qs</span>
                    {quiz.duration_minutes > 0 && (
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{quiz.duration_minutes} min</span>
                    )}
                    <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5" />Pass: {quiz.pass_score || 60}%</span>
                  </div>
                  <button
                    onClick={() => startQuiz(quiz)}
                    disabled={loadingQuiz}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 text-white rounded-xl font-medium text-sm hover:bg-teal-700 disabled:opacity-60 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    {loadingQuiz ? 'Loading...' : 'Start Quiz'}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StudentQuizDashboard;
