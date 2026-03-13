import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, ArrowLeft, FileText, Brain, Zap, Download, Loader } from 'lucide-react';
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

const tabVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3 }
};

export default function StudyAIPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [studyMaterial, setStudyMaterial] = useState<StudyMaterial | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'keyPoints' | 'mcqs' | 'shortAnswer' | 'essay'>('summary');
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});

  // Load Puter.js script on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).puter) {
      const script = document.createElement('script');
      script.src = 'https://js.puter.com/v2/';
      script.async = true;
      document.head.appendChild(script);
      console.log("[v0] Puter.js script loaded");
    }
  }, []);

  // Set up PDF.js worker
  useEffect(() => {
    // Worker setup removed - using backend API instead
  }, []);

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

  // Extract PDF text using backend API
  const extractPDFText = async (file: File): Promise<string> => {
    try {
      console.log("[v0] Sending PDF to backend for text extraction");
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to extract PDF');
      }

      const data = await response.json();
      console.log("[v0] Extracted text length:", data.text.length);
      return data.text;
    } catch (error) {
      console.error("[v0] PDF extraction error:", error);
      throw new Error('Failed to extract PDF text');
    }
  };

  const handleAnalyzeDocument = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file first');
      return;
    }

    setIsLoading(true);
    try {
      console.log("[v0] Starting analysis with Puter.js ChatGPT");
      
      // Extract PDF text
      const pdfText = await extractPDFText(selectedFile);
      
      if (!pdfText || pdfText.trim().length === 0) {
        throw new Error('No text found in PDF');
      }

      // Call Puter.js ChatGPT directly from frontend
      const puter = (window as any).puter;
      if (!puter) {
        throw new Error('Puter.js not loaded. Please refresh the page.');
      }

      const analysisPrompt = `Analyze this medical document and provide study materials as JSON.

Document: ${selectedFile.name}
Content: ${pdfText.substring(0, 8000)}

Return ONLY valid JSON (no markdown, no code blocks, just plain JSON):
{
  "summary": "comprehensive summary 200+ words",
  "keyPoints": ["point1", "point2", "point3", "point4", "point5"],
  "mcqs": [
    {"question": "Q1?", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "why"},
    {"question": "Q2?", "options": ["A", "B", "C", "D"], "correctAnswer": "B", "explanation": "why"}
  ],
  "shortAnswerQuestions": ["Q1", "Q2", "Q3"],
  "essayQuestions": ["Essay Q1", "Essay Q2"]
}`;

      console.log("[v0] Calling Puter.js ChatGPT");
      const response = await puter.ai.chat(analysisPrompt, { model: 'gpt-5-nano' });
      console.log("[v0] Received response:", response.substring(0, 100));

      // Parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("[v0] No JSON found in response:", response);
        throw new Error('Invalid response format');
      }

      const studyData: StudyMaterial = JSON.parse(jsonMatch[0]);
      console.log("[v0] Analysis complete");
      
      setStudyMaterial(studyData);
      toast.success('Document analyzed with ChatGPT via Puter.js!');
    } catch (error) {
      console.error("[v0] Analysis error:", error);
      toast.error(`Failed to analyze: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadStudyGuide = () => {
    if (!studyMaterial) return;

    const content = `
STUDY GUIDE - ${selectedFile?.name || 'Study Material'}

SUMMARY
${studyMaterial.summary}

KEY POINTS
${studyMaterial.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

MULTIPLE CHOICE QUESTIONS
${studyMaterial.mcqs.map((mcq, i) => `
${i + 1}. ${mcq.question}
${mcq.options.map((opt, j) => `   ${String.fromCharCode(65 + j)}. ${opt}`).join('\n')}
Correct Answer: ${mcq.correctAnswer}
Explanation: ${mcq.explanation}
`).join('\n')}

SHORT ANSWER QUESTIONS
${studyMaterial.shortAnswerQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

ESSAY QUESTIONS
${studyMaterial.essayQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `study-guide-${Date.now()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Study guide downloaded!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green1/5 via-green2/5 to-green5/5 pb-6 sm:pb-8 lg:pb-10">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur shadow-sm border-b border-green1/20">
        <div className="w-full max-w-6xl mx-auto px-3 xxss:px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 sm:w-6 h-5 sm:h-6 text-gray-700" />
            </button>
            <div className="bg-gradient-to-br from-green1 to-green5 rounded-lg p-2 sm:p-2.5">
              <Brain className="w-5 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">Study AI Assistant</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Upload documents and generate personalized study materials</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-6xl mx-auto px-3 xxss:px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {!studyMaterial ? (
          <motion.div
            variants={fadeInVariants}
            initial="initial"
            animate="animate"
            className="space-y-6"
          >
            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-md border border-green1/20 p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Upload className="w-6 h-6 text-green1" />
                Upload Document
              </h2>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-green1/40 rounded-lg p-8 sm:p-12 text-center cursor-pointer hover:border-green1 hover:bg-green1/5 transition-all"
              >
                <FileText className="w-12 h-12 text-green1 mx-auto mb-4" />
                <p className="text-gray-700 font-semibold mb-2">Drop your PDF here or click to browse</p>
                <p className="text-sm text-gray-500">Supported format: PDF files only</p>
                {selectedFile && (
                  <p className="text-sm text-green1 font-medium mt-4">✓ {selectedFile.name} selected</p>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                onClick={handleAnalyzeDocument}
                disabled={!selectedFile || isLoading}
                className="w-full mt-6 bg-gradient-to-r from-green1 to-green5 hover:from-green3 hover:to-green4 disabled:from-gray-300 disabled:to-gray-400 text-white py-3 sm:py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Analyzing Document...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Analyze Document
                  </>
                )}
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <motion.div
                variants={fadeInVariants}
                className="bg-white rounded-lg p-4 sm:p-6 border border-green1/20 shadow-sm"
              >
                <div className="bg-green1/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-green1" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Summaries</h3>
                <p className="text-sm text-gray-600">AI-generated comprehensive summaries of your documents</p>
              </motion.div>

              <motion.div
                variants={fadeInVariants}
                className="bg-white rounded-lg p-4 sm:p-6 border border-green5/20 shadow-sm"
              >
                <div className="bg-green5/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-green5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Key Points</h3>
                <p className="text-sm text-gray-600">Extract and organize the most important concepts</p>
              </motion.div>

              <motion.div
                variants={fadeInVariants}
                className="bg-white rounded-lg p-4 sm:p-6 border border-green3/20 shadow-sm"
              >
                <div className="bg-green3/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-green3" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Practice Questions</h3>
                <p className="text-sm text-gray-600">MCQs, short answer, and essay questions for practice</p>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            variants={fadeInVariants}
            initial="initial"
            animate="animate"
            className="space-y-6"
          >
            {/* Download Button */}
            <div className="flex justify-between items-center bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-green1/20">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{selectedFile?.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Analysis complete</p>
              </div>
              <button
                onClick={downloadStudyGuide}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green1 to-green5 hover:from-green3 hover:to-green4 text-white rounded-lg font-medium transition-all text-sm"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download Guide</span>
                <span className="sm:hidden">Download</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-md border border-green1/20 overflow-hidden">
              <div className="flex flex-wrap border-b border-green1/20 overflow-x-auto">
                {['summary', 'keyPoints', 'mcqs', 'shortAnswer', 'essay'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab as any);
                      setUserAnswers({});
                    }}
                    className={`px-3 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
                      activeTab === tab
                        ? 'text-green1 border-b-2 border-green1 bg-green1/5'
                        : 'text-gray-600 hover:text-green1'
                    }`}
                  >
                    {tab === 'summary' && 'Summary'}
                    {tab === 'keyPoints' && 'Key Points'}
                    {tab === 'mcqs' && 'MCQs'}
                    {tab === 'shortAnswer' && 'Short Answer'}
                    {tab === 'essay' && 'Essays'}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-4 sm:p-6">
                {activeTab === 'summary' && (
                  <motion.div variants={tabVariants} initial="initial" animate="animate" className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{studyMaterial.summary}</p>
                  </motion.div>
                )}

                {activeTab === 'keyPoints' && (
                  <motion.div variants={tabVariants} initial="initial" animate="animate">
                    <ul className="space-y-3">
                      {studyMaterial.keyPoints.map((point, idx) => (
                        <li key={idx} className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-green1 to-green5 text-white flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-gray-700 pt-0.5">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {activeTab === 'mcqs' && (
                  <motion.div variants={tabVariants} initial="initial" animate="animate" className="space-y-6">
                    {studyMaterial.mcqs.map((mcq, idx) => (
                      <div key={idx} className="border border-green1/20 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <p className="font-semibold text-gray-900 mb-4">{idx + 1}. {mcq.question}</p>
                        <div className="space-y-2 mb-4">
                          {mcq.options.map((option, optIdx) => (
                            <label key={optIdx} className="flex items-center gap-3 p-2 rounded hover:bg-green1/5 cursor-pointer">
                              <input
                                type="radio"
                                name={`mcq-${idx}`}
                                value={option}
                                checked={userAnswers[idx] === option}
                                onChange={(e) => setUserAnswers({ ...userAnswers, [idx]: e.target.value })}
                                className="w-4 h-4 text-green1"
                              />
                              <span className="text-gray-700">{String.fromCharCode(65 + optIdx)}. {option}</span>
                            </label>
                          ))}
                        </div>
                        {userAnswers[idx] && (
                          <div className={`p-3 rounded-lg text-sm ${userAnswers[idx] === mcq.correctAnswer ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {userAnswers[idx] === mcq.correctAnswer ? '✓ Correct!' : '✗ Incorrect'} - {mcq.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'shortAnswer' && (
                  <motion.div variants={tabVariants} initial="initial" animate="animate" className="space-y-6">
                    {studyMaterial.shortAnswerQuestions.map((question, idx) => (
                      <div key={idx} className="border border-green1/20 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <p className="font-semibold text-gray-900 mb-3">{idx + 1}. {question}</p>
                        <textarea
                          placeholder="Type your answer here..."
                          value={userAnswers[idx] || ''}
                          onChange={(e) => setUserAnswers({ ...userAnswers, [idx]: e.target.value })}
                          className="w-full p-3 border border-green1/30 rounded-lg focus:ring-2 focus:ring-green1 focus:border-transparent resize-none"
                          rows={4}
                        />
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'essay' && (
                  <motion.div variants={tabVariants} initial="initial" animate="animate" className="space-y-6">
                    {studyMaterial.essayQuestions.map((question, idx) => (
                      <div key={idx} className="border border-green1/20 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <p className="font-semibold text-gray-900 mb-3">{idx + 1}. {question}</p>
                        <textarea
                          placeholder="Write your essay here..."
                          value={userAnswers[idx] || ''}
                          onChange={(e) => setUserAnswers({ ...userAnswers, [idx]: e.target.value })}
                          className="w-full p-3 border border-green1/30 rounded-lg focus:ring-2 focus:ring-green1 focus:border-transparent resize-none"
                          rows={6}
                        />
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                setStudyMaterial(null);
                setSelectedFile(null);
                setActiveTab('summary');
                setUserAnswers({});
              }}
              className="w-full py-3 border-2 border-green1 text-green1 font-semibold rounded-lg hover:bg-green1/5 transition-all"
            >
              Upload Another Document
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
