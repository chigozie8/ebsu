import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, BookOpen, Clock } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';
import { PDFSummarizer } from '../../../components/quiz/PDFSummarizer';

interface Quiz {
  id: string;
  title: string;
  description: string;
  course_id: string;
  level: number;
  category: 'preclinical' | 'clinical';
  question_count: number;
  duration: number;
  published: boolean;
  created_at: string;
}

interface AttemptStats {
  total_attempts: number;
  best_score: number;
  average_score: number;
}

const fadeInVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function ExamPapersPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'preclinical' | 'clinical' | null>(null);
  const [loading, setLoading] = useState(true);
  const [attemptStats, setAttemptStats] = useState<Record<string, AttemptStats>>({});
  const [showPDFSummarizer, setShowPDFSummarizer] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);

      // Fetch attempt stats for each quiz
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        fetchAttemptStats(user.id, data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch quizzes:', err);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttemptStats = async (userId: string, quizList: Quiz[]) => {
    try {
      const stats: Record<string, AttemptStats> = {};
      
      for (const quiz of quizList) {
        const { data } = await supabase
          .from('quiz_attempts')
          .select('score')
          .eq('user_id', userId)
          .eq('quiz_id', quiz.id);

        if (data && data.length > 0) {
          const scores = data.map(d => d.score);
          stats[quiz.id] = {
            total_attempts: data.length,
            best_score: Math.max(...scores),
            average_score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          };
        }
      }
      
      setAttemptStats(stats);
    } catch (err) {
      console.error('Failed to fetch attempt stats:', err);
    }
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === null || quiz.level === selectedLevel;
    const matchesCategory = selectedCategory === null || quiz.category === selectedCategory;
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const preclinicalLevels = [1, 2, 3];
  const clinicalLevels = [4, 5, 6];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Exam Practice</h1>
          <p className="text-gray-600">Browse and attempt quizzes across all levels</p>
        </div>

        {/* PDF Summarizer Toggle */}
        <motion.button
          variants={fadeInVariants}
          initial="initial"
          animate="animate"
          onClick={() => setShowPDFSummarizer(!showPDFSummarizer)}
          className="mb-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          <FileText className="inline mr-2 w-5 h-5" />
          {showPDFSummarizer ? 'Hide' : 'Show'} PDF Summarizer
        </motion.button>

        {/* PDF Summarizer Section */}
        {showPDFSummarizer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8 p-6 bg-white rounded-lg shadow-md border border-blue-200"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">AI PDF Exam Summarizer</h2>
            <PDFSummarizer
              onSummaryComplete={(summary: string) => {
                console.log('[v0] Summary generated:', summary);
                toast.success('PDF summary generated! You can download it or use the questions for practice.');
              }}
            />
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          variants={fadeInVariants}
          initial="initial"
          animate="animate"
          className="mb-8 bg-white rounded-lg shadow-md p-6"
        >
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Category</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  selectedCategory === null
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedCategory('preclinical')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  selectedCategory === 'preclinical'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Preclinical
              </button>
              <button
                onClick={() => setSelectedCategory('clinical')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  selectedCategory === 'clinical'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Clinical
              </button>
            </div>
          </div>

          {/* Level Filter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Level</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedLevel(null)}
                className={`px-3 py-2 rounded-lg font-medium text-xs transition-all ${
                  selectedLevel === null
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Levels
              </button>
              {preclinicalLevels.map(level => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-3 py-2 rounded-lg font-medium text-xs transition-all ${
                    selectedLevel === level
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Level {level}
                </button>
              ))}
              {clinicalLevels.map(level => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-3 py-2 rounded-lg font-medium text-xs transition-all ${
                    selectedLevel === level
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Level {level}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quiz Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">Loading quizzes...</p>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <motion.div
            variants={fadeInVariants}
            initial="initial"
            animate="animate"
            className="text-center py-12 bg-white rounded-lg"
          >
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No quizzes found</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz, index) => {
              const stats = attemptStats[quiz.id];
              return (
                <motion.div
                  key={quiz.id}
                  variants={fadeInVariants}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
                >
                  {/* Category Badge */}
                  <div className="mb-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      quiz.category === 'preclinical'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {quiz.category === 'preclinical' ? 'Preclinical' : 'Clinical'} - Level {quiz.level}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{quiz.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{quiz.description}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <BookOpen className="w-4 h-4" />
                      <span>{quiz.question_count} Questions</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{quiz.duration} mins</span>
                    </div>
                  </div>

                  {/* Attempt Stats */}
                  {stats && (
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm bg-gray-50 rounded-lg p-3">
                      <div>
                        <p className="text-gray-600">Best Score</p>
                        <p className="font-bold text-blue-600">{stats.best_score}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Attempts</p>
                        <p className="font-bold text-gray-900">{stats.total_attempts}</p>
                      </div>
                    </div>
                  )}

                  {/* Start Button */}
                  <button className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors">
                    Start Quiz
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
