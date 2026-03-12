import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Edit2, Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { AdminQuizBuilder } from '../../../components/quiz/AdminQuizBuilder';
import { PDFSummarizer } from '../../../components/quiz/PDFSummarizer';
import { supabase } from '../../../lib/supabase';
import { initializeQuizTables, createSampleQuiz } from '../../../lib/quiz-db';
import toast from 'react-hot-toast';

// Admin Quiz Manager Tab - Manage and create quizzes

interface Quiz {
  id: string;
  title: string;
  description: string;
  total_questions: number;
  duration_minutes: number;
  is_published: boolean;
  created_at: string;
  course_id: string;
}

export const AdminQuizManager = () => {
  const [activeTab, setActiveTab] = useState<'manage' | 'create' | 'pdf'>('manage');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      setIsInitializing(true);
      console.log('[v0] Initializing quiz database...');
      const success = await initializeQuizTables();
      if (success) {
        await fetchQuizzes();
        setDbError(null);
      } else {
        setDbError('Failed to initialize quiz database. Please try again.');
      }
    } catch (error) {
      console.error('[v0] Database initialization error:', error);
      setDbError('Unable to connect to database');
    } finally {
      setIsInitializing(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setDbError(null);
      console.log('[v0] Fetching quizzes from Supabase...');
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('[v0] Supabase error:', error.message);
        setDbError(error.message);
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          // Tables don't exist, suggest creating sample data
          setDbError('Quiz database not initialized. Creating sample data...');
          await createSampleQuiz();
          // Try fetching again
          const { data: retryData, error: retryError } = await supabase
            .from('quizzes')
            .select('*')
            .order('created_at', { ascending: false });
          if (retryError) throw retryError;
          setQuizzes(retryData || []);
        } else {
          throw error;
        }
      } else {
        console.log('[v0] Quizzes fetched:', data);
        setQuizzes(data || []);
      }
    } catch (err) {
      console.error('[v0] Failed to fetch quizzes:', err);
      setDbError('Failed to load quizzes. Please refresh the page.');
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (quiz: Quiz) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ is_published: !quiz.is_published })
        .eq('id', quiz.id);

      if (error) throw error;
      toast.success(quiz.is_published ? 'Quiz unpublished' : 'Quiz published');
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
      {/* Database Error Banner */}
      {dbError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Database Error</h3>
            <p className="text-red-800 text-sm">{dbError}</p>
            {isInitializing && (
              <p className="text-red-700 text-sm mt-1">Setting up database tables...</p>
            )}
          </div>
        </motion.div>
      )}
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
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Questions</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Duration</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredQuizzes.map((quiz) => (
                    <tr key={quiz.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">{quiz.title}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{quiz.total_questions}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{quiz.duration_minutes} mins</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          quiz.is_published
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {quiz.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => togglePublish(quiz)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title={quiz.is_published ? 'Unpublish' : 'Publish'}
                          >
                            {quiz.is_published ? (
                              <Eye className="w-4 h-4 text-green-600" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                          <button
                            onClick={() => console.log('Edit quiz:', quiz.id)}
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
              onSummaryComplete={(summary: string) => {
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
