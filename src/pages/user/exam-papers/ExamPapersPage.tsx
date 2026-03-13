import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Target, Award, Calendar, Clock, BookOpen } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

interface PerformanceMetrics {
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  weakestTopic: string;
  strongestTopic: string;
  timeSpentHours: number;
}

interface CoursePerformance {
  courseId: string;
  courseName: string;
  attempts: number;
  averageScore: number;
  trend: 'up' | 'down' | 'stable';
}

interface WeeklyProgress {
  week: string;
  attempts: number;
  averageScore: number;
}

const fadeInVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalAttempts: 0,
    averageScore: 0,
    bestScore: 0,
    weakestTopic: 'N/A',
    strongestTopic: 'N/A',
    timeSpentHours: 0,
  });
  const [coursePerformance, setCoursePerformance] = useState<CoursePerformance[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to view analytics');
        return;
      }

      // Fetch quiz attempts
      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id);

      if (attemptsError) {
        console.error('[v0] Error fetching attempts:', attemptsError);
        throw attemptsError;
      }

      if (!attempts || attempts.length === 0) {
        setMetrics({
          totalAttempts: 0,
          averageScore: 0,
          bestScore: 0,
          weakestTopic: 'No data yet',
          strongestTopic: 'No data yet',
          timeSpentHours: 0,
        });
        return;
      }

      // Calculate performance metrics
      const percentages = attempts.map(a => a.percentage || 0);
      const totalTime = attempts.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0);

      const metrics: PerformanceMetrics = {
        totalAttempts: attempts.length,
        averageScore: Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length),
        bestScore: Math.max(...percentages),
        weakestTopic: 'Mathematics', // Placeholder - would need topic data
        strongestTopic: 'Biology', // Placeholder - would need topic data
        timeSpentHours: Math.round(totalTime / 3600),
      };

      setMetrics(metrics);

      // Generate mock course performance data
      const courses: CoursePerformance[] = [
        {
          courseId: '1',
          courseName: 'Anatomy',
          attempts: 12,
          averageScore: 78,
          trend: 'up',
        },
        {
          courseId: '2',
          courseName: 'Physiology',
          attempts: 8,
          averageScore: 82,
          trend: 'up',
        },
        {
          courseId: '3',
          courseName: 'Biochemistry',
          attempts: 5,
          averageScore: 71,
          trend: 'down',
        },
        {
          courseId: '4',
          courseName: 'Pharmacology',
          attempts: 10,
          averageScore: 75,
          trend: 'stable',
        },
      ];
      setCoursePerformance(courses);

      // Generate mock weekly progress
      const weeks: WeeklyProgress[] = [
        { week: 'Mon', attempts: 3, averageScore: 75 },
        { week: 'Tue', attempts: 2, averageScore: 78 },
        { week: 'Wed', attempts: 4, averageScore: 81 },
        { week: 'Thu', attempts: 2, averageScore: 76 },
        { week: 'Fri', attempts: 5, averageScore: 79 },
        { week: 'Sat', attempts: 1, averageScore: 72 },
        { week: 'Sun', attempts: 2, averageScore: 80 },
      ];
      setWeeklyProgress(weeks);
    } catch (error) {
      console.error('[v0] Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={fadeInVariants}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Learning Analytics</h1>
          <p className="text-gray-600">Track your progress and identify areas for improvement</p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 mb-6">
          {(['week', 'month', 'all'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedPeriod === period
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Attempts */}
          <motion.div
            variants={fadeInVariants}
            className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Total Attempts</h3>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{metrics.totalAttempts}</p>
            <p className="text-xs text-gray-500 mt-2">Quiz attempts completed</p>
          </motion.div>

          {/* Average Score */}
          <motion.div
            variants={fadeInVariants}
            className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Average Score</h3>
              <div className="p-3 bg-teal-100 rounded-lg">
                <Target className="w-5 h-5 text-teal-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{metrics.averageScore}%</p>
            <p className="text-xs text-gray-500 mt-2">Across all attempts</p>
          </motion.div>

          {/* Best Score */}
          <motion.div
            variants={fadeInVariants}
            className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Best Score</h3>
              <div className="p-3 bg-green-100 rounded-lg">
                <Award className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{metrics.bestScore}%</p>
            <p className="text-xs text-gray-500 mt-2">Personal best</p>
          </motion.div>

          {/* Time Spent */}
          <motion.div
            variants={fadeInVariants}
            className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Time Spent</h3>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{metrics.timeSpentHours}h</p>
            <p className="text-xs text-gray-500 mt-2">Total study time</p>
          </motion.div>
        </div>

        {/* Course Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            variants={fadeInVariants}
            className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              Course Performance
            </h2>
            <div className="space-y-4">
              {coursePerformance.map((course) => (
                <div key={course.courseId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{course.courseName}</h3>
                    <p className="text-sm text-gray-500">{course.attempts} attempts</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-teal-600 h-2 rounded-full"
                        style={{ width: `${course.averageScore}%` }}
                      />
                    </div>
                    <span className="font-bold text-gray-900 min-w-12">{course.averageScore}%</span>
                    {course.trend === 'up' && <TrendingUp className="w-5 h-5 text-green-600" />}
                    {course.trend === 'down' && <TrendingUp className="w-5 h-5 text-red-600 rotate-180" />}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Insights */}
          <motion.div
            variants={fadeInVariants}
            className="bg-white rounded-lg p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-6">Insights</h2>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-semibold text-green-900 mb-1">Strongest Area</p>
                <p className="text-lg font-bold text-green-700">{metrics.strongestTopic}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm font-semibold text-orange-900 mb-1">Needs Improvement</p>
                <p className="text-lg font-bold text-orange-700">{metrics.weakestTopic}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-1">Recommendation</p>
                <p className="text-sm text-blue-700">Focus on weak topics with 2-3 quick quizzes daily</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Weekly Activity */}
        <motion.div
          variants={fadeInVariants}
          className="bg-white rounded-lg p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            Weekly Activity
          </h2>
          <div className="flex items-end justify-around gap-2 h-48">
            {weeklyProgress.map((day) => (
              <div key={day.week} className="flex flex-col items-center gap-2 flex-1">
                <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.averageScore / 100) * 100}%` }}
                    transition={{ duration: 0.8 }}
                    className="w-full bg-gradient-to-t from-teal-600 to-teal-400 rounded-lg"
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-gray-900">{day.week}</p>
                  <p className="text-xs text-gray-500">{day.attempts} Q</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
