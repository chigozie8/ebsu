import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, BarChart3 } from 'lucide-react';
import { AdminQuizBuilder } from '../../../components/quiz/AdminQuizBuilder';
import { PDFSummarizer } from '../../../components/quiz/PDFSummarizer';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

interface Quiz {
  id: string;
  title: string;
  description: string;
  level: number;
  category: 'preclinical' | 'clinical';
  question_count: number;
  duration: number;
  published: boolean;
  created_at: string;
}

export const AdminQuizManager = () => {
  const [activeTab, setActiveTab] = useState<'manage' | 'create' | 'pdf'>('manage');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (quiz: Quiz) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ published: !quiz.published })
        .eq('id', quiz.id);

      if (error) throw error;
      toast.success(quiz.published ? 'Quiz unpublished' : 'Quiz published');
      fetchQuizzes();
    } catch (err) {
      console.error('Failed to toggle publish:', err);
      toast.error('Failed to update quiz');
    }
  };

  const deleteQuiz = async (quizId: string) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) throw error;
      toast.success('Quiz deleted');
      fetchQuizzes();
    } catch (err) {
      console.error('Failed to delete quiz:', err);
      toast.error('Failed to delete quiz');
    }
  };

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('manage')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'manage'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Manage Quizzes
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'create'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Create Quiz
        </button>
        <button
          onClick={() => setActiveTab('pdf')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'pdf'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          PDF to Questions
        </button>
      </div>

      {/* Manage Quizzes Tab */}
      {activeTab === 'manage' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Quizzes Table */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600">No quizzes found. Create one to get started!</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Level</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Questions</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredQuizzes.map((quiz) => (
                    <tr key={quiz.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">{quiz.title}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">Level {quiz.level}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          quiz.category === 'preclinical'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {quiz.category}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">{quiz.question_count}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          quiz.published
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {quiz.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => togglePublish(quiz)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title={quiz.published ? 'Unpublish' : 'Publish'}
                          >
                            {quiz.published ? (
                              <Eye className="w-4 h-4 text-green-600" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingQuiz(quiz)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => deleteQuiz(quiz.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* Create Quiz Tab */}
      {activeTab === 'create' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Quiz</h3>
            <AdminQuizBuilder courseId="" levelId="" />
          </div>
        </motion.div>
      )}

      {/* PDF to Questions Tab */}
      {activeTab === 'pdf' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Questions from PDF</h3>
            <PDFSummarizer
              onSummaryComplete={(summary: string, questions: any[]) => {
                console.log('[v0] Summary generated:', summary);
                toast.success('PDF processed! You can now create a quiz with these questions.');
              }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};
      if (error) throw error;
      setLevels(data || []);
    } catch (err) {
      console.error('Failed to fetch levels:', err);
    }
  };

  const handleAddCourse = async () => {
    if (!newCourseName || !newCourseCode) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert([{ name: newCourseName, code: newCourseCode, description: '' }])
        .select();

      if (error) throw error;
      setCourses([...courses, data[0]]);
      setNewCourseName('');
      setNewCourseCode('');
      setShowNewCourseForm(false);
      toast.success('Course created successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const fadeInVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  };

  const preclinicalLevels = levels.filter((l) => l.category === 'Preclinical').sort((a, b) => a.level - b.level);
  const clinicalLevels = levels.filter((l) => l.category === 'Clinical').sort((a, b) => a.level - b.level);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {['quizzes', 'courses', 'pdf'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab === 'quizzes' && 'Quiz Builder'}
            {tab === 'courses' && 'Manage Courses'}
            {tab === 'pdf' && 'PDF Summarizer'}
          </button>
        ))}
      </div>

      {/* Quiz Builder Tab */}
      {activeTab === 'quizzes' && (
        <motion.div variants={fadeInVariants} initial="initial" animate="animate" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Course Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- Select a course --</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name} ({course.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Level Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Level</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- Select a level --</option>
                <optgroup label="Preclinical">
                  {preclinicalLevels.map((level) => (
                    <option key={level.id} value={level.id}>
                      Level {level.level} - Preclinical
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Clinical">
                  {clinicalLevels.map((level) => (
                    <option key={level.id} value={level.id}>
                      Level {level.level} - Clinical
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {selectedCourse && selectedLevel && (
            <AdminQuizBuilder courseId={selectedCourse} levelId={selectedLevel} />
          )}
        </motion.div>
      )}

      {/* Manage Courses Tab */}
      {activeTab === 'courses' && (
        <motion.div variants={fadeInVariants} initial="initial" animate="animate" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button
              onClick={() => setShowNewCourseForm(!showNewCourseForm)}
              className="ml-4 flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Course
            </button>
          </div>

          {showNewCourseForm && (
            <motion.div
              variants={fadeInVariants}
              initial="initial"
              animate="animate"
              className="bg-white rounded-lg p-4 border border-gray-200 space-y-3"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., Anatomy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                <input
                  type="text"
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., ANAT101"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddCourse}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Course'}
                </button>
                <button
                  onClick={() => setShowNewCourseForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses
              .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((course) => (
                <motion.div
                  key={course.id}
                  variants={fadeInVariants}
                  initial="initial"
                  animate="animate"
                  className="bg-white rounded-lg p-4 border border-gray-200 hover:border-teal-300 transition-colors"
                >
                  <h4 className="font-semibold text-gray-800">{course.name}</h4>
                  <p className="text-sm text-gray-500">{course.code}</p>
                </motion.div>
              ))}
          </div>
        </motion.div>
      )}

      {/* PDF Summarizer Tab */}
      {activeTab === 'pdf' && (
        <motion.div variants={fadeInVariants} initial="initial" animate="animate">
          <PDFSummarizer
            onSummaryComplete={(summary: string, questions: any[]) => {
              console.log('Summary:', summary);
              console.log('Questions:', questions);
              toast.success('Summary generated! You can now use these questions in your quiz.');
            }}
          />
        </motion.div>
      )}
    </div>
  );
};
