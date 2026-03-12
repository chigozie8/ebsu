import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import { AdminQuizBuilder } from '../../../components/quiz/AdminQuizBuilder';
import { PDFSummarizer } from '../../../components/quiz/PDFSummarizer';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

interface Course {
  id: string;
  name: string;
  code: string;
}

interface QuizLevel {
  id: string;
  level: number;
  category: string;
}

export const AdminQuizManager = () => {
  const [activeTab, setActiveTab] = useState<'courses' | 'quizzes' | 'pdf'>('quizzes');
  const [courses, setCourses] = useState<Course[]>([]);
  const [levels, setLevels] = useState<QuizLevel[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewCourseForm, setShowNewCourseForm] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchLevels();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase.from('courses').select('*');
      if (error) throw error;
      setCourses(data || []);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  const fetchLevels = async () => {
    try {
      const { data, error } = await supabase.from('levels').select('*');
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

export { AdminQuizManager };
