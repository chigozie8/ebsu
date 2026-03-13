/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Eye, EyeOff, Trash2, Plus, Edit2, BookOpen, Clock,
  Trophy, BarChart3, ChevronDown, ChevronUp, Save, X, FileText, Sparkles,
  Users, CheckCircle, AlertCircle, RotateCcw,
} from 'lucide-react';
import { AdminQuizBuilder } from '../../../components/quiz/AdminQuizBuilder';
import { PDFSummarizer } from '../../../components/quiz/PDFSummarizer';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

interface Quiz {
  id: string;
  title: string;
  description: string;
  total_questions: number;
  duration_minutes: number;
  pass_score: number;
  is_published: boolean;
  shuffle_questions: boolean;
  created_at: string;
  course_id: string;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: string;
  explanation: string;
  order_index: number;
  answers?: QuizAnswer[];
}

interface QuizAnswer {
  id: string;
  answer_text: string;
  is_correct: boolean;
  order_index: number;
}

interface QuizAttemptStats {
  attempts: number;
  avgScore: number;
}

type AdminTab = 'manage' | 'create' | 'ai-generator';

const LETTER = ['A', 'B', 'C', 'D', 'E'];

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export const AdminQuizManager = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('manage');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Record<string, QuizQuestion[]>>({});
  const [loadingQuestions, setLoadingQuestions] = useState<string | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [attemptStats, setAttemptStats] = useState<Record<string, QuizAttemptStats>>({});
  const [overallStats, setOverallStats] = useState({ total: 0, published: 0, drafts: 0, totalAttempts: 0 });

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const list = data || [];
      setQuizzes(list);
      setOverallStats({
        total: list.length,
        published: list.filter((q: Quiz) => q.is_published).length,
        drafts: list.filter((q: Quiz) => !q.is_published).length,
        totalAttempts: 0,
      });
    } catch (err: any) {
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAttemptStats = useCallback(async (quizId: string) => {
    try {
      const { data } = await supabase
        .from('quiz_attempts')
        .select('score, percentage')
        .eq('quiz_id', quizId);
      if (data && data.length > 0) {
        const avg = Math.round(data.reduce((s: number, d: any) => s + (Number(d.percentage) || 0), 0) / data.length);
        setAttemptStats(prev => ({ ...prev, [quizId]: { attempts: data.length, avgScore: avg } }));
      } else {
        setAttemptStats(prev => ({ ...prev, [quizId]: { attempts: 0, avgScore: 0 } }));
      }
    } catch { /* silent */ }
  }, []);

  const fetchQuizQuestions = useCallback(async (quizId: string) => {
    if (quizQuestions[quizId]) return; // already loaded
    setLoadingQuestions(quizId);
    try {
      const { data: qs, error } = await supabase
        .from('quiz_questions')
        .select('id, question_text, question_type, explanation, order_index')
        .eq('quiz_id', quizId)
        .order('order_index');
      if (error) throw error;

      const questionsWithAnswers: QuizQuestion[] = [];
      for (const q of (qs || [])) {
        const { data: ans } = await supabase
          .from('quiz_answers')
          .select('id, answer_text, is_correct, order_index')
          .eq('question_id', q.id)
          .order('order_index');
        questionsWithAnswers.push({ ...q, answers: ans || [] });
      }
      setQuizQuestions(prev => ({ ...prev, [quizId]: questionsWithAnswers }));
    } catch (err: any) {
      toast.error('Failed to load questions');
    } finally {
      setLoadingQuestions(null);
    }
  }, [quizQuestions]);

  useEffect(() => { fetchQuizzes(); }, [fetchQuizzes]);

  const toggleExpand = (quizId: string) => {
    if (expandedQuizId === quizId) {
      setExpandedQuizId(null);
    } else {
      setExpandedQuizId(quizId);
      fetchQuizQuestions(quizId);
      fetchAttemptStats(quizId);
    }
  };

  const togglePublish = async (quiz: Quiz) => {
    try {
      const { error } = await supabase.from('quizzes').update({ is_published: !quiz.is_published }).eq('id', quiz.id);
      if (error) throw error;
      toast.success(quiz.is_published ? 'Quiz unpublished' : 'Quiz published — students can now see it');
      fetchQuizzes();
    } catch { toast.error('Failed to update quiz'); }
  };

  const deleteQuiz = async (quizId: string) => {
    if (!window.confirm('Delete this quiz and all its questions? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
      if (error) throw error;
      toast.success('Quiz deleted');
      fetchQuizzes();
      if (expandedQuizId === quizId) setExpandedQuizId(null);
    } catch { toast.error('Failed to delete quiz'); }
  };

  const deleteQuestion = async (questionId: string, quizId: string) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      const { error } = await supabase.from('quiz_questions').delete().eq('id', questionId);
      if (error) throw error;
      // Remove from local state
      setQuizQuestions(prev => ({
        ...prev,
        [quizId]: (prev[quizId] || []).filter(q => q.id !== questionId),
      }));
      // Update total_questions count
      const remaining = (quizQuestions[quizId] || []).length - 1;
      await supabase.from('quizzes').update({ total_questions: remaining }).eq('id', quizId);
      toast.success('Question deleted');
      fetchQuizzes();
    } catch { toast.error('Failed to delete question'); }
  };

  const saveQuizSettings = async () => {
    if (!editingQuiz) return;
    try {
      const { error } = await supabase.from('quizzes').update({
        title: editingQuiz.title,
        description: editingQuiz.description,
        duration_minutes: editingQuiz.duration_minutes,
        pass_score: editingQuiz.pass_score,
        shuffle_questions: editingQuiz.shuffle_questions,
      }).eq('id', editingQuiz.id);
      if (error) throw error;
      toast.success('Quiz settings saved');
      setEditingQuiz(null);
      fetchQuizzes();
    } catch { toast.error('Failed to save settings'); }
  };

  const filteredQuizzes = quizzes.filter(q =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Quizzes', value: overallStats.total, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Published', value: overallStats.published, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Drafts', value: overallStats.drafts, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Total Attempts', value: Object.values(attemptStats).reduce((s, v) => s + v.attempts, 0), icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {[
          { id: 'manage', icon: BookOpen, label: 'Manage Quizzes' },
          { id: 'create', icon: Plus, label: 'Create Manually' },
          { id: 'ai-generator', icon: Sparkles, label: 'AI Generator' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ---- MANAGE TAB ---- */}
        {activeTab === 'manage' && (
          <motion.div key="manage" {...fade} className="space-y-4">
            {/* Search + refresh */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search quizzes..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <button onClick={fetchQuizzes} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors" title="Refresh">
                <RotateCcw className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {loading ? (
              <div className="py-16 text-center">
                <div className="w-7 h-7 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading quizzes...</p>
              </div>
            ) : filteredQuizzes.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium text-gray-600">No quizzes found</p>
                <p className="text-xs mt-1">Create one from the tabs above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQuizzes.map(quiz => {
                  const isExpanded = expandedQuizId === quiz.id;
                  const isEditing = editingQuiz?.id === quiz.id;
                  const stats = attemptStats[quiz.id];
                  const questions = quizQuestions[quiz.id] || [];

                  return (
                    <motion.div key={quiz.id} layout className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                      {/* Quiz Header Row */}
                      <div className="flex items-center gap-3 p-4">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${quiz.is_published ? 'bg-green-500' : 'bg-amber-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{quiz.title}</p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
                            <span className="flex items-center gap-0.5"><BookOpen className="w-3 h-3" />{quiz.total_questions} Qs</span>
                            {quiz.duration_minutes > 0 && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{quiz.duration_minutes}m</span>}
                            <span className="flex items-center gap-0.5"><Trophy className="w-3 h-3" />Pass {quiz.pass_score || 60}%</span>
                            {stats && <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{stats.attempts} attempts</span>}
                            {stats && stats.attempts > 0 && <span className="flex items-center gap-0.5"><BarChart3 className="w-3 h-3" />Avg {stats.avgScore}%</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Publish toggle */}
                          <button
                            onClick={() => togglePublish(quiz)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${quiz.is_published ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                          >
                            {quiz.is_published ? <><Eye className="w-3.5 h-3.5" /> Published</> : <><EyeOff className="w-3.5 h-3.5" /> Draft</>}
                          </button>
                          {/* Edit settings */}
                          <button
                            onClick={() => setEditingQuiz(isEditing ? null : { ...quiz })}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit settings"
                          >
                            <Edit2 className="w-4 h-4 text-blue-500" />
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => deleteQuiz(quiz.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete quiz"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                          {/* Expand questions */}
                          <button
                            onClick={() => toggleExpand(quiz.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View questions"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
                          </button>
                        </div>
                      </div>

                      {/* Edit Settings Panel */}
                      <AnimatePresence>
                        {isEditing && editingQuiz && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-gray-100 bg-blue-50 overflow-hidden"
                          >
                            <div className="p-4 space-y-3">
                              <p className="text-sm font-semibold text-gray-800 mb-2">Edit Settings</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                                  <input type="text" value={editingQuiz.title} onChange={e => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                                  <input type="text" value={editingQuiz.description || ''} onChange={e => setEditingQuiz({ ...editingQuiz, description: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Duration (minutes, 0 = unlimited)</label>
                                  <input type="number" min={0} value={editingQuiz.duration_minutes} onChange={e => setEditingQuiz({ ...editingQuiz, duration_minutes: Number(e.target.value) })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Pass Score (%)</label>
                                  <input type="number" min={0} max={100} value={editingQuiz.pass_score || 60} onChange={e => setEditingQuiz({ ...editingQuiz, pass_score: Number(e.target.value) })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                                </div>
                              </div>
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" checked={editingQuiz.shuffle_questions} onChange={e => setEditingQuiz({ ...editingQuiz, shuffle_questions: e.target.checked })}
                                  className="w-4 h-4 accent-teal-600" />
                                <span className="text-sm text-gray-700">Shuffle questions for each student</span>
                              </label>
                              <div className="flex gap-2 pt-1">
                                <button onClick={saveQuizSettings} className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
                                  <Save className="w-3.5 h-3.5" /> Save
                                </button>
                                <button onClick={() => setEditingQuiz(null)} className="flex items-center gap-1.5 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
                                  <X className="w-3.5 h-3.5" /> Cancel
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Questions Expansion */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-gray-100 overflow-hidden"
                          >
                            <div className="p-4 space-y-2">
                              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                                Questions ({questions.length})
                              </p>
                              {loadingQuestions === quiz.id ? (
                                <div className="py-6 text-center">
                                  <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                </div>
                              ) : questions.length === 0 ? (
                                <div className="py-6 text-center text-gray-400 text-sm">No questions added yet</div>
                              ) : (
                                questions.map((q, idx) => (
                                  <div key={q.id} className="bg-gray-50 rounded-xl border border-gray-200 p-3">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-start gap-2 flex-1 min-w-0">
                                        <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{idx + 1}</span>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-800">{q.question_text}</p>
                                          {q.answers && q.answers.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                              {q.answers.map((a, ai) => (
                                                <p key={a.id} className={`text-xs ${a.is_correct ? 'text-green-700 font-semibold' : 'text-gray-500'}`}>
                                                  {LETTER[ai]}) {a.answer_text}{a.is_correct && ' ✓'}
                                                </p>
                                              ))}
                                            </div>
                                          )}
                                          {q.explanation && (
                                            <p className="text-xs text-blue-600 mt-1 italic">{q.explanation}</p>
                                          )}
                                        </div>
                                      </div>
                                      <button onClick={() => deleteQuestion(q.id, quiz.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ---- CREATE MANUALLY TAB ---- */}
        {activeTab === 'create' && (
          <motion.div key="create" {...fade} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Create Quiz Manually</h3>
                <p className="text-xs text-gray-500">Add your own questions one by one</p>
              </div>
            </div>
            <AdminQuizBuilder
              courseId=""
              levelId=""
              onQuizCreated={() => {
                fetchQuizzes();
                setActiveTab('manage');
                toast.success('Quiz created! Switch to Manage to publish it.');
              }}
            />
          </motion.div>
        )}

        {/* ---- AI GENERATOR TAB ---- */}
        {activeTab === 'ai-generator' && (
          <motion.div key="ai-generator" {...fade} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">AI PDF Quiz Generator</h3>
                <p className="text-xs text-gray-500">Upload a document — Puter.js AI generates questions and saves as a draft quiz</p>
              </div>
            </div>
            <PDFSummarizer
              onQuestionsReady={(qs) => {
                toast.success(`${qs.length} questions parsed. Fill in the title and save as a draft quiz below.`);
              }}
              onSummaryComplete={() => {
                // Refresh quiz list after saving
                setTimeout(fetchQuizzes, 2000);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
