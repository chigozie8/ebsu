import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, BookOpen, Target, Award, BarChart3, PieChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AnalyticsData {
  totalCourses: number;
  coursesCompleted: number;
  averageGrade: number;
  studyStreak: number;
  totalStudyHours: number;
  quizzesAttempted: number;
  averageQuizScore: number;
  resourcesAccessed: number;
  topCourses: { name: string; score: number; progress: number }[];
  monthlyActivity: { month: string; hours: number }[];
  performanceByCategory: { category: string; percentage: number }[];
}

const fadeInVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalCourses: 12,
    coursesCompleted: 8,
    averageGrade: 78,
    studyStreak: 24,
    totalStudyHours: 156,
    quizzesAttempted: 32,
    averageQuizScore: 82,
    resourcesAccessed: 245,
    topCourses: [
      { name: 'Human Anatomy', score: 92, progress: 95 },
      { name: 'Medical Physiology', score: 88, progress: 87 },
      { name: 'Biochemistry', score: 85, progress: 82 },
    ],
    monthlyActivity: [
      { month: 'Jan', hours: 12 },
      { month: 'Feb', hours: 18 },
      { month: 'Mar', hours: 24 },
      { month: 'Apr', hours: 20 },
      { month: 'May', hours: 28 },
      { month: 'Jun', hours: 32 },
    ],
    performanceByCategory: [
      { category: 'Anatomy', percentage: 92 },
      { category: 'Physiology', percentage: 88 },
      { category: 'Biochemistry', percentage: 85 },
      { category: 'Pathology', percentage: 79 },
      { category: 'Pharmacology', percentage: 81 },
    ],
  });

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-background to-secondary/5 pb-20"
      initial="initial"
      animate="animate"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div
        className="sticky top-0 z-40 bg-white border-b border-border"
        variants={fadeInVariants}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-6 flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Learning Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Track your academic progress and performance</p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-6">
        {/* Key Metrics Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          variants={containerVariants}
        >
          {/* Total Study Hours */}
          <motion.div
            variants={fadeInVariants}
            className="bg-white rounded-lg border border-border p-6 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Total Study Hours</p>
                <h3 className="text-3xl font-bold text-foreground">{analytics.totalStudyHours}</h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-success">+12% from last month</p>
          </motion.div>

          {/* Average Grade */}
          <motion.div
            variants={fadeInVariants}
            className="bg-white rounded-lg border border-border p-6 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Average Grade</p>
                <h3 className="text-3xl font-bold text-foreground">{analytics.averageGrade}%</h3>
              </div>
              <div className="p-2 bg-success/10 rounded-lg">
                <Award className="w-5 h-5 text-success" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </motion.div>

          {/* Study Streak */}
          <motion.div
            variants={fadeInVariants}
            className="bg-white rounded-lg border border-border p-6 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Study Streak</p>
                <h3 className="text-3xl font-bold text-foreground">{analytics.studyStreak} days</h3>
              </div>
              <div className="p-2 bg-warning/10 rounded-lg">
                <Target className="w-5 h-5 text-warning" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Keep it up!</p>
          </motion.div>

          {/* Quiz Average */}
          <motion.div
            variants={fadeInVariants}
            className="bg-white rounded-lg border border-border p-6 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Quiz Average</p>
                <h3 className="text-3xl font-bold text-foreground">{analytics.averageQuizScore}%</h3>
              </div>
              <div className="p-2 bg-info/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-info" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{analytics.quizzesAttempted} quizzes taken</p>
          </motion.div>
        </motion.div>

        {/* Course Progress & Performance */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
          variants={containerVariants}
        >
          {/* Top Courses */}
          <motion.div
            variants={fadeInVariants}
            className="bg-white rounded-lg border border-border p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Top Courses</h2>
            </div>
            <div className="space-y-4">
              {analytics.topCourses.map((course, idx) => (
                <div key={idx} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-foreground text-sm">{course.name}</h3>
                    <span className="text-sm font-bold text-primary">{course.score}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${course.progress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-primary"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{course.progress}% complete</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Performance by Category */}
          <motion.div
            variants={fadeInVariants}
            className="bg-white rounded-lg border border-border p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Performance by Category</h2>
            </div>
            <div className="space-y-4">
              {analytics.performanceByCategory.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{item.category}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-secondary rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: idx * 0.05 }}
                        className="h-full bg-primary"
                      />
                    </div>
                    <span className="text-sm font-bold text-foreground min-w-[40px]">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Monthly Activity */}
        <motion.div
          variants={fadeInVariants}
          className="bg-white rounded-lg border border-border p-6"
        >
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Monthly Study Activity
          </h2>
          <div className="flex items-end justify-between gap-2 h-48">
            {analytics.monthlyActivity.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(item.hours / 32) * 150}px` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.1 }}
                  className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-lg hover:shadow-lg transition-shadow cursor-pointer"
                  title={`${item.hours} hours`}
                />
                <span className="text-xs font-medium text-foreground">{item.month}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Statistics Overview */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
          variants={containerVariants}
        >
          <motion.div
            variants={fadeInVariants}
            className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 p-6"
          >
            <p className="text-sm text-muted-foreground mb-2">Courses in Progress</p>
            <h3 className="text-2xl font-bold text-foreground">{analytics.totalCourses - analytics.coursesCompleted}</h3>
            <p className="text-xs text-muted-foreground mt-2">{analytics.coursesCompleted} completed</p>
          </motion.div>

          <motion.div
            variants={fadeInVariants}
            className="bg-gradient-to-br from-success/10 to-success/5 rounded-lg border border-success/20 p-6"
          >
            <p className="text-sm text-muted-foreground mb-2">Resources Accessed</p>
            <h3 className="text-2xl font-bold text-foreground">{analytics.resourcesAccessed}</h3>
            <p className="text-xs text-muted-foreground mt-2">Study materials & documents</p>
          </motion.div>

          <motion.div
            variants={fadeInVariants}
            className="bg-gradient-to-br from-info/10 to-info/5 rounded-lg border border-info/20 p-6"
          >
            <p className="text-sm text-muted-foreground mb-2">Overall Performance</p>
            <h3 className="text-2xl font-bold text-foreground">
              {Math.round((analytics.averageGrade + analytics.averageQuizScore) / 2)}%
            </h3>
            <p className="text-xs text-muted-foreground mt-2">Grade + Quiz average</p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
