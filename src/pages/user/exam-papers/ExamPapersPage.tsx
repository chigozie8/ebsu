import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Play, Plus, BookOpen, BarChart3, Zap, Clock } from 'lucide-react';
import { supabase } from '../../config/supabase';

const fadeInVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function ExamPapersPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExams: 0,
    totalAttempts: 0,
    averageScore: 0,
    currentStreak: 0,
  });

  useEffect(() => {
    fetchExams();
    fetchStats();
  }, []);

  const fetchExams = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);
    } catch (err) {
      console.error('Failed to fetch exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);

      if (data && data.length > 0) {
        const totalAttempts = data.length;
        const averageScore = data.reduce((sum, p) => sum + (p.score || 0), 0) / totalAttempts;
        
        setStats({
          totalExams: exams.length,
          totalAttempts,
          averageScore: Math.round(averageScore),
          currentStreak: 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          variants={fadeInVariants}
          initial="initial"
          animate="animate"
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Exam Papers & Quizzes</h1>
          <p className="text-gray-600">Create, practice, and master your exams with AI-powered insights</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={fadeInVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: 'Exams Created', value: stats.totalExams, icon: BookOpen, color: 'bg-blue-100 text-blue-600' },
            { label: 'Total Attempts', value: stats.totalAttempts, icon: Play, color: 'bg-emerald-100 text-emerald-600' },
            { label: 'Average Score', value: `${stats.averageScore}%`, icon: BarChart3, color: 'bg-purple-100 text-purple-600' },
            { label: 'Study Streak', value: `${stats.currentStreak} days`, icon: Zap, color: 'bg-orange-100 text-orange-600' },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ translateY: -4 }}
                className={`${stat.color} rounded-lg p-4 sm:p-5`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="w-5 h-5" />
                  <p className="text-sm font-medium opacity-80">{stat.label}</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          variants={fadeInVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
        >
          <button
            onClick={() => navigate('/u/exam-papers/upload')}
            className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105"
          >
            <Upload className="w-5 h-5" />
            Upload Exam Paper
          </button>
          <button
            onClick={() => navigate('/u/exam-papers/create')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Create Quiz
          </button>
        </motion.div>

        {/* Recent Exams Section */}
        <motion.div
          variants={fadeInVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Recent Exams</h2>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg p-4 sm:p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : exams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((exam, idx) => (
                <motion.div
                  key={exam.id}
                  whileHover={{ translateY: -4 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => navigate(`/u/exam-papers/${exam.id}/quiz`)}
                  className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 hover:border-teal-400 hover:shadow-lg transition-all cursor-pointer"
                >
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{exam.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{exam.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-full">{exam.subject}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{exam.total_questions} Q</span>
                  </div>
                  <button className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
                    <Play className="w-4 h-4" />
                    Start Quiz
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-8 sm:p-12 text-center border-2 border-dashed border-gray-300">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No exams yet</h3>
              <p className="text-gray-500 mb-6">Upload an exam paper or create a quiz to get started</p>
              <button
                onClick={() => navigate('/u/exam-papers/upload')}
                className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-6 rounded-lg inline-flex items-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Now
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
