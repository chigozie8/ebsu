import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, ArrowLeft, BookOpen, FileText, Brain, Zap, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface StudyMaterial {
  summary: string;
  keyPoints: string[];
  mcqs: MCQ[];
  shortAnswerQuestions: string[];
  essayQuestions: string[];
}

interface MCQ {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const fadeInVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function StudyAIPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [studyMaterial, setStudyMaterial] = useState<StudyMaterial | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'keyPoints' | 'mcqs' | 'shortAnswer' | 'essay'>('summary');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
        toast.success('PDF selected successfully');
      } else {
        toast.error('Please select a PDF file');
      }
    }
  };

  const handleAnalyzeDocument = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file first');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate document analysis
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock study material generation based on the document
      const mockMaterial: StudyMaterial = {
        summary: `This document provides a comprehensive overview of ${selectedFile.name}. The content covers essential concepts and principles that are fundamental to understanding the subject matter. Key theories, methodologies, and practical applications are discussed in detail to provide students with a thorough grasp of the material.`,
        keyPoints: [
          'Core concepts and foundational principles are essential for mastery',
          'Integration of theoretical knowledge with practical applications',
          'Understanding of key terminology and medical classifications',
          'Recognition of important patterns and relationships',
          'Application of principles to clinical scenarios',
          'Critical thinking in medical decision-making',
          'Evidence-based approaches to treatment and diagnosis',
          'Recognition of exceptions and special cases'
        ],
        mcqs: [
          {
            question: 'Which of the following best describes the primary concept discussed in this document?',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 'Option A',
            explanation: 'This is the most accurate definition based on the document content.'
          },
          {
            question: 'According to the document, what is the significance of the key principle?',
            options: ['To improve efficiency', 'To ensure accuracy', 'To reduce costs', 'To enhance quality'],
            correctAnswer: 'To ensure accuracy',
            explanation: 'The document emphasizes accuracy as a critical aspect of this principle.'
          },
          {
            question: 'Which application is most relevant to clinical practice?',
            options: ['Application 1', 'Application 2', 'Application 3', 'Application 4'],
            correctAnswer: 'Application 2',
            explanation: 'Application 2 demonstrates the most direct clinical relevance.'
          }
        ],
        shortAnswerQuestions: [
          'Explain the main concept and its importance in medical practice.',
          'Describe how the principles discussed can be applied in a clinical setting.',
          'What are the key distinctions between the different approaches mentioned?',
          'How does this concept relate to other areas of medical knowledge?',
          'What are the potential complications or considerations to keep in mind?'
        ],
        essayQuestions: [
          'Critically analyze the theoretical framework presented in the document and discuss its implications for clinical practice.',
          'Compare and contrast the different approaches discussed. Which is most effective and why?',
          'Discuss how the concepts in this document have evolved over time and predict future developments in the field.'
        ]
      };

      setStudyMaterial(mockMaterial);
      setActiveTab('summary');
      toast.success('Document analyzed successfully!');
    } catch (error) {
      toast.error('Failed to analyze document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadStudyGuide = () => {
    if (!studyMaterial) return;
    
    const content = `
STUDY GUIDE - Generated by Study AI

SUMMARY
${studyMaterial.summary}

KEY POINTS
${studyMaterial.keyPoints.map((point, idx) => `${idx + 1}. ${point}`).join('\n')}

MULTIPLE CHOICE QUESTIONS
${studyMaterial.mcqs.map((mcq, idx) => `
Q${idx + 1}: ${mcq.question}
A) ${mcq.options[0]}
B) ${mcq.options[1]}
C) ${mcq.options[2]}
D) ${mcq.options[3]}
Correct Answer: ${mcq.correctAnswer}
Explanation: ${mcq.explanation}
`).join('\n')}

SHORT ANSWER QUESTIONS
${studyMaterial.shortAnswerQuestions.map((q, idx) => `${idx + 1}. ${q}`).join('\n')}

ESSAY QUESTIONS
${studyMaterial.essayQuestions.map((q, idx) => `${idx + 1}. ${q}`).join('\n')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study-guide.txt';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Study guide downloaded!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur shadow-sm border-b border-gray-200">
        <div className="w-full max-w-[1720px] mx-auto px-3 xxss:px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 sm:w-6 h-5 sm:h-6 text-gray-700" />
            </button>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg p-2 sm:p-2.5">
              <Brain className="w-5 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">Study AI Assistant</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Upload documents and generate study materials</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1720px] mx-auto px-3 xxss:px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {!studyMaterial ? (
          // Upload Section
          <motion.div
            variants={fadeInVariants}
            initial="initial"
            animate="animate"
            className="bg-white rounded-2xl shadow-lg p-6 sm:p-10 border-2 border-dashed border-indigo-300"
          >
            <div className="flex flex-col items-center justify-center text-center">
              <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full p-6 mb-4">
                <Upload className="w-12 h-12 text-indigo-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Upload Your Document</h2>
              <p className="text-gray-600 text-sm sm:text-base max-w-md mb-6">
                Upload a PDF document and our AI will analyze it to generate summaries, key points, and exam-style questions.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold mb-4 transition-colors"
              >
                Choose PDF File
              </button>

              {selectedFile && (
                <div className="mt-4 text-left w-full">
                  <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-3 mb-4">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-gray-600">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>

                  <button
                    onClick={handleAnalyzeDocument}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Analyzing Document...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Generate Study Materials
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-200">
              <div className="text-center">
                <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 mb-1">Summaries</h3>
                <p className="text-sm text-gray-600">Concise overviews of key content</p>
              </div>
              <div className="text-center">
                <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 mb-1">Exam Questions</h3>
                <p className="text-sm text-gray-600">MCQs and essay questions</p>
              </div>
              <div className="text-center">
                <FileText className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 mb-1">Study Guides</h3>
                <p className="text-sm text-gray-600">Downloadable learning materials</p>
              </div>
            </div>
          </motion.div>
        ) : (
          // Study Material Display
          <div className="space-y-6">
            {/* Header with Download */}
            <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Study Materials Generated</h2>
                <p className="text-sm text-gray-600">From: {selectedFile?.name}</p>
              </div>
              <button
                onClick={downloadStudyGuide}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                <Download className="w-5 h-5" />
                Download Guide
              </button>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="flex flex-wrap border-b border-gray-200">
                {[
                  { id: 'summary', label: 'Summary', icon: BookOpen },
                  { id: 'keyPoints', label: 'Key Points', icon: Zap },
                  { id: 'mcqs', label: 'MCQs', icon: Brain },
                  { id: 'shortAnswer', label: 'Short Answer', icon: FileText },
                  { id: 'essay', label: 'Essay', icon: Brain }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 px-4 py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                      activeTab === tab.id
                        ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-6 sm:p-8">
                {/* Summary */}
                {activeTab === 'summary' && (
                  <motion.div variants={fadeInVariants} initial="initial" animate="animate">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Document Summary</h3>
                    <p className="text-gray-700 leading-relaxed">{studyMaterial.summary}</p>
                  </motion.div>
                )}

                {/* Key Points */}
                {activeTab === 'keyPoints' && (
                  <motion.div variants={fadeInVariants} initial="initial" animate="animate">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Key Points</h3>
                    <ul className="space-y-3">
                      {studyMaterial.keyPoints.map((point, idx) => (
                        <li key={idx} className="flex gap-3">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                            {idx + 1}
                          </div>
                          <p className="text-gray-700 pt-0.5">{point}</p>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* MCQs */}
                {activeTab === 'mcqs' && (
                  <motion.div variants={fadeInVariants} initial="initial" animate="animate">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Multiple Choice Questions</h3>
                    <div className="space-y-6">
                      {studyMaterial.mcqs.map((mcq, idx) => (
                        <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                          <p className="font-semibold text-gray-900 mb-3">Q{idx + 1}: {mcq.question}</p>
                          <div className="space-y-2 mb-3">
                            {mcq.options.map((option, optIdx) => (
                              <label key={optIdx} className="flex items-center gap-3 cursor-pointer">
                                <input type="radio" name={`mcq-${idx}`} className="w-4 h-4 text-indigo-600" />
                                <span className="text-gray-700">{String.fromCharCode(65 + optIdx)}) {option}</span>
                              </label>
                            ))}
                          </div>
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                            <p className="text-sm font-semibold text-green-900">Correct Answer: {mcq.correctAnswer}</p>
                            <p className="text-sm text-green-800 mt-1">{mcq.explanation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Short Answer */}
                {activeTab === 'shortAnswer' && (
                  <motion.div variants={fadeInVariants} initial="initial" animate="animate">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Short Answer Questions</h3>
                    <div className="space-y-4">
                      {studyMaterial.shortAnswerQuestions.map((question, idx) => (
                        <div key={idx} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="font-semibold text-gray-900">Q{idx + 1}: {question}</p>
                          <textarea
                            placeholder="Write your answer here..."
                            className="w-full mt-3 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            rows={3}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Essay */}
                {activeTab === 'essay' && (
                  <motion.div variants={fadeInVariants} initial="initial" animate="animate">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Essay Questions</h3>
                    <div className="space-y-4">
                      {studyMaterial.essayQuestions.map((question, idx) => (
                        <div key={idx} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <p className="font-semibold text-gray-900">Q{idx + 1}: {question}</p>
                          <textarea
                            placeholder="Write your essay answer here..."
                            className="w-full mt-3 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            rows={4}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Upload New Button */}
            <button
              onClick={() => {
                setStudyMaterial(null);
                setSelectedFile(null);
                setActiveTab('summary');
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 rounded-lg font-semibold transition-colors"
            >
              Upload Another Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
