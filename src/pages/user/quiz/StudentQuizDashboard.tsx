import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, BookOpen, BarChart3, Clock, Trophy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface Quiz {
  id: string;
  title: string;
  description: string;
  level: number;
  category: string;
  questionCount: number;
  duration?: number;
}

interface AttemptStats {
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
}

export const StudentQuizDashboard = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'Preclinical' | 'Clinical' | null>(null);
  const [stats, setStats] = useState<AttemptStats>({ totalAttempts: 0, averageScore: 0, bestScore: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchQuizzes();
    fetchStats();
  }, [selectedLevel, selectedCategory]);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      let query = supabase.from('quizzes').select('*').eq('published', true);

      if (selectedLevel) {
        query = query.eq('level_id', selectedLevel);
      }
      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setQuizzes(data || []);
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_attempts')
        .select('score')
        .eq('user_id', user.id);

      if (data && data.length > 0) {
        const scores = data.map((d: any) => d.score || 0);
        const totalAttempts = data.length;
        const averageScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / totalAttempts);
        const bestScore = Math.max(...scores);

        setStats({ totalAttempts, averageScore, bestScore });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fadeInVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  };

  const preclinicalLevels = [1, 2, 3];
  const clinicalLevels = [4, 5, 6];

  const filteredQuizzes = quizzes.filter((q) =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          variants={fadeInVariants}
          initial="initial"
          animate="animate"
          custom={0}
          className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Attempts</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalAttempts}</p>
            </div>
            <Trophy className="w-8 h-8 text-amber-500" />
          </div>
        </motion.div>

        <motion.div
          variants={fadeInVariants}
          initial="initial"
          animate="animate"
          custom={1}
          className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-800">{stats.averageScore}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-teal-500" />
          </div>
        </motion.div>

        <motion.div
          variants={fadeInVariants}
          initial="initial"
          animate="animate"
          custom={2}
          className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Best Score</p>
              <p className="text-2xl font-bold text-gray-800">{stats.bestScore}%</p>
            </div>
            <Trophy className="w-8 h-8 text-emerald-500" />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        variants={fadeInVariants}
        initial="initial"
        animate="animate"
        className="bg-white rounded-lg p-4 border border-gray-200 space-y-4"
      >
        <input
          type="text"
          placeholder="Search quizzes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Preclinical Levels */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Preclinical (Levels 1-3)</h3>
            <div className="flex gap-2">
              {preclinicalLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    setSelectedLevel(selectedLevel === level ? null : level);
                    setSelectedCategory('Preclinical');
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedLevel === level
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Level {level}
                </button>
              ))}
            </div>
          </div>

          {/* Clinical Levels */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Clinical (Levels 4-6)</h3>
            <div className="flex gap-2">
              {clinicalLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    setSelectedLevel(selectedLevel === level ? null : level);
                    setSelectedCategory('Clinical');
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedLevel === level
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Level {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quizzes Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading quizzes...</p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No quizzes available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.map((quiz, idx) => (
            <motion.div
              key={quiz.id}
              variants={fadeInVariants}
              initial="initial"
              animate="animate"
              custom={idx}
              className="bg-white rounded-lg p-4 border border-gray-200 hover:border-teal-300 hover:shadow-lg transition-all"
            >
              <h3 className="font-semibold text-gray-800 mb-2">{quiz.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{quiz.description}</p>

              <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {quiz.questionCount} Questions
                </div>
                {quiz.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {quiz.duration} min
                  </div>
                )}
              </div>

              <button className="w-full px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors flex items-center justify-center gap-2">
                <Play className="w-4 h-4" />
                Start Quiz
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
