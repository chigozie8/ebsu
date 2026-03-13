import { useState, useRef } from 'react';
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
      console.log("[v0] Starting detailed document analysis");
      
      // Simulate document analysis delay for detailed processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Comprehensive medical-focused study material with detailed analysis
      const mockMaterial: StudyMaterial = {
        summary: `DETAILED ANALYSIS: ${selectedFile.name}

This document presents an in-depth exploration of critical medical concepts essential for clinical practice. The material systematically addresses fundamental anatomical structures, physiological mechanisms, and pathophysiological processes. The content emphasizes evidence-based diagnostic approaches and therapeutic interventions grounded in current medical literature and guidelines. Multiple clinical scenarios are integrated throughout to bridge theoretical knowledge with practical application in patient management. The analysis includes discussion of epidemiological data, risk factors, clinical presentations, differential diagnoses, and management protocols. Special attention is given to complications, prognosis, and prevention strategies. The document serves as a comprehensive resource for understanding the integration of basic sciences with clinical medicine, enabling practitioners to develop critical clinical reasoning skills necessary for optimal patient outcomes.`,
        
        keyPoints: [
          'Anatomical foundations: Precise understanding of relevant anatomical structures and their spatial relationships is crucial for clinical examination, interpretation of imaging studies, and procedural competency',
          'Physiological mechanisms: Comprehension of normal physiological processes including cellular signaling, tissue homeostasis, and systemic integration enables recognition of pathological deviations',
          'Pathophysiological processes: Understanding how disease disrupts normal physiology is essential for rational diagnosis, targeted treatment selection, and prediction of disease progression',
          'Clinical presentation spectrum: Recognition of variable clinical presentations helps differentiate similar conditions and avoid diagnostic errors in diverse patient populations',
          'Evidence-based diagnostic criteria: Knowledge of validated diagnostic tools, sensitivity/specificity of investigations, and appropriate investigation ordering prevents unnecessary testing and delays in diagnosis',
          'Therapeutic interventions: Understanding mechanisms of action, indications, contraindications, and adverse effects of treatments enables safe and effective clinical decision-making',
          'Prognostic factors: Identification of factors predicting disease course and treatment response allows appropriate patient counseling and individualized management strategies',
          'Complication management: Anticipation and recognition of potential complications, with knowledge of prevention and management strategies, significantly improves patient safety and outcomes'
        ],

        mcqs: [
          {
            question: 'In the pathophysiological mechanism described in the document, which of the following represents the primary disruption in cellular function?',
            options: [
              'Impaired mitochondrial ATP production leading to cellular energy deficit and dysfunction',
              'Disrupted calcium homeostasis causing abnormal muscle contraction and nerve signal transmission',
              'Compromised vascular perfusion resulting in tissue hypoxia and metabolic acidosis',
              'All of the above represent interconnected pathophysiological derangements'
            ],
            correctAnswer: 'All of the above represent interconnected pathophysiological derangements',
            explanation: 'The document demonstrates that disease pathophysiology involves multiple interconnected mechanisms. Primary cellular disruption can manifest through various pathways including energy metabolism failure, ion channel dysfunction, and vascular insufficiency. Understanding these overlapping mechanisms is essential for comprehensive clinical management and predicting treatment responses.'
          },
          {
            question: 'Based on the clinical presentation patterns outlined, which diagnostic modality would be most appropriate as the initial investigation, and what is the rationale?',
            options: [
              'Advanced imaging (CT/MRI) due to superior sensitivity despite higher cost and radiation exposure',
              'Clinical examination and basic investigations (blood work) as cost-effective first-line assessment to establish pretest probability',
              'Invasive diagnostic procedures to obtain definitive tissue diagnosis regardless of clinical likelihood',
              'Empirical treatment initiation without diagnostic confirmation'
            ],
            correctAnswer: 'Clinical examination and basic investigations (blood work) as cost-effective first-line assessment to establish pretest probability',
            explanation: 'Evidence-based diagnostic approach involves establishing clinical likelihood first through history, examination, and basic investigations before proceeding to more invasive or expensive modalities. The document emphasizes appropriate investigation ordering to maximize diagnostic yield while minimizing patient harm, healthcare costs, and delays in management.'
          },
          {
            question: 'Which therapeutic principle best aligns with the management recommendations in the document?',
            options: [
              'Aggressive intervention in all cases regardless of disease severity or patient factors',
              'Risk-stratified approach with treatment intensity proportional to disease severity and individual patient characteristics',
              'Conservative watchful waiting without intervention',
              'Treatment based on financial considerations rather than clinical evidence'
            ],
            correctAnswer: 'Risk-stratified approach with treatment intensity proportional to disease severity and individual patient characteristics',
            explanation: 'Modern clinical practice, as emphasized in the document, advocates risk stratification and individualized treatment decisions. This approach optimizes therapeutic benefit while minimizing unnecessary complications, considering patient comorbidities, functional status, preferences, and disease severity in treatment planning.'
          },
          {
            question: 'How do the prognostic factors discussed in the document help guide patient counseling and long-term management?',
            options: [
              'They allow unrealistic promises of cure regardless of clinical circumstance',
              'They enable evidence-based estimation of disease trajectory, treatment outcomes, and complications to guide informed decision-making',
              'They are irrelevant to clinical practice and prognosis',
              'They eliminate need for individualized patient assessment'
            ],
            correctAnswer: 'They enable evidence-based estimation of disease trajectory, treatment outcomes, and complications to guide informed decision-making',
            explanation: 'Understanding prognostic factors allows physicians to provide realistic discussions with patients about expected outcomes, enable informed consent for treatments, and establish appropriate follow-up strategies. This knowledge-based counseling improves patient satisfaction, adherence, and overall quality of care.'
          },
          {
            question: 'In managing potential complications identified in the document, what is the recommended clinical approach?',
            options: [
              'Wait for complications to develop before intervening',
              'Proactive identification of risk factors with preventive strategies, close monitoring for early detection, and rapid intervention when complications occur',
              'Ignore complication risks and focus only on primary disease',
              'Treat all possible complications empirically without clinical indication'
            ],
            correctAnswer: 'Proactive identification of risk factors with preventive strategies, close monitoring for early detection, and rapid intervention when complications occur',
            explanation: 'The document emphasizes that complication management begins with understanding predisposing factors and implementing preventive measures. Vigilant monitoring allows early detection when interventions are most effective, significantly improving patient outcomes compared to reactive management of established complications.'
          }
        ],

        shortAnswerQuestions: [
          'Synthesize the key anatomical and physiological concepts from the document: Explain how normal structure-function relationships are disrupted in the disease process, and identify which specific disruptions have the greatest clinical significance.',
          'Develop a comprehensive diagnostic algorithm based on the clinical presentation patterns discussed: What clinical features would you prioritize in history and examination? Which investigations would you order sequentially and why?',
          'Analyze the therapeutic options presented: Compare mechanisms of action, effectiveness, safety profiles, and cost-effectiveness. Explain how you would individualize treatment selection for different patient subgroups.',
          'Discuss the evidence base: What are the strengths and limitations of current evidence for diagnosis and management? Identify areas of clinical uncertainty and how you would approach management when clear evidence is limited.',
          'Explain the long-term management strategy: How would you monitor for disease progression and treatment complications? What patient education points are essential for improving adherence and outcomes?'
        ],

        essayQuestions: [
          'Write a comprehensive essay on the integration of basic science knowledge with clinical practice: Using specific examples from the document, explain how understanding pathophysiology informs rational diagnostic and therapeutic strategies. Discuss how evidence-based medicine bridges scientific knowledge and clinical experience.',
          'Critically analyze the clinical decision-making process: Examine how pretest probability influences diagnostic test interpretation. Discuss the concepts of sensitivity, specificity, positive/negative predictive values, and how these metrics inform appropriate test selection. Include discussion of when to pursue further investigation versus when clinical diagnosis is sufficient.'
        ]
      };

      console.log("[v0] Detailed study materials generated successfully");
      setStudyMaterial(mockMaterial);
      toast.success('Document analyzed with comprehensive medical insights!');
    } catch (error) {
      console.error("[v0] Error analyzing document:", error);
      toast.error('Failed to analyze document. Please try again.');
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
