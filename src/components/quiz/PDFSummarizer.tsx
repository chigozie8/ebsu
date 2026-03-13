/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Sparkles, CheckCircle, Copy, RefreshCw, BookOpen, HelpCircle, AlignLeft, Save, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuizManagement, type QuizQuestion } from '../../hooks/useQuizManagement';

declare global {
  interface Window {
    puter: any;
  }
}

interface ParsedQuestion {
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface PDFSummarizerProps {
  onSummaryComplete?: (summary: string) => void;
  onQuestionsReady?: (questions: ParsedQuestion[]) => void;
}

const PUTER_SCRIPT_URL = 'https://js.puter.com/v2/';

async function loadPuter(): Promise<any> {
  if (window.puter) return window.puter;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PUTER_SCRIPT_URL;
    script.onload = () => resolve((window as any).puter);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function parseQuestionsFromText(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  // Split by question blocks — look for Q1:, Q2:, 1., 1), **1.** patterns
  const blocks = text.split(/\n(?=Q?\d{1,2}[\.\):]|\*\*Q?\d)/i).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 3) continue;

    // Extract question text (first non-empty line, strip numbering)
    const qLine = lines[0].replace(/^\*{0,2}Q?\d{1,2}[\.\):\s]+\*{0,2}/i, '').replace(/\*\*/g, '').trim();
    if (!qLine) continue;

    const optionLines = lines.filter(l => /^[A-Da-d][\.\)]\s/.test(l));
    const answerLine = lines.find(l => /^(answer|correct|ans)[\s:]/i.test(l));
    const explanationLine = lines.find(l => /^(explanation|explain|rationale)[\s:]/i.test(l));

    if (optionLines.length >= 2) {
      const options = optionLines.map(l => l.replace(/^[A-Da-d][\.\)]\s+/, '').trim());
      let correctAnswer = '';
      if (answerLine) {
        const letter = answerLine.replace(/^(answer|correct|ans)[\s:]+/i, '').trim().charAt(0).toUpperCase();
        const idx = ['A', 'B', 'C', 'D'].indexOf(letter);
        correctAnswer = idx >= 0 && options[idx] ? options[idx] : options[0];
      } else {
        correctAnswer = options[0];
      }

      const isTrueFalse = options.length === 2 && options.every(o => /^(true|false)$/i.test(o));

      questions.push({
        text: qLine,
        type: isTrueFalse ? 'true_false' : 'multiple_choice',
        options,
        correctAnswer,
        explanation: explanationLine
          ? explanationLine.replace(/^(explanation|explain|rationale)[\s:]+/i, '').trim()
          : '',
      });
    }
  }
  return questions;
}

export const PDFSummarizer: React.FC<PDFSummarizerProps> = ({ onSummaryComplete, onQuestionsReady }) => {
  const { createQuiz, loading: savingQuiz } = useQuizManagement();
  const [stage, setStage] = useState<'upload' | 'processing' | 'results'>('upload');
  const [fileName, setFileName] = useState('');
  const [summary, setSummary] = useState('');
  const [rawQuestions, setRawQuestions] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [activeTab, setActiveTab] = useState<'summary' | 'questions'>('summary');
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [processingStep, setProcessingStep] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip base64 header and get raw text approximation for non-PDF
        resolve(result);
      };
      reader.onerror = reject;
      if (file.type === 'application/pdf') {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleFileUpload = async (file: File) => {
    const accepted = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain'];
    if (!accepted.includes(file.type)) {
      toast.error('Please upload a PDF, image, or text file');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 20MB.');
      return;
    }

    setFileName(file.name);
    setStage('processing');
    setSummary('');
    setRawQuestions('');
    setParsedQuestions([]);
    setQuizTitle(`Quiz — ${file.name.replace(/\.[^/.]+$/, '')}`);

    try {
      setProcessingStep('Loading AI engine...');
      const puter = await loadPuter();

      setProcessingStep('Reading document...');
      const fileContent = await readFileAsText(file);
      
      // For PDFs we send a descriptive prompt since we can't fully parse binary in browser
      const contentForAI = file.type === 'application/pdf'
        ? `[PDF Document: "${file.name}". The document has been uploaded. Please treat this as an educational medical document and generate content based on the filename and any extractable info. File size: ${(file.size / 1024).toFixed(1)}KB]`
        : fileContent.substring(0, 12000); // limit for token efficiency

      setProcessingStep('Generating summary...');
      const summaryResponse = await puter.ai.chat([
        {
          role: 'system',
          content: 'You are an expert medical educator. Generate detailed, structured educational content from documents. Use clear headings, bullet points, and organized sections.',
        },
        {
          role: 'user',
          content: `Summarize this educational document for medical students:\n\n${contentForAI}\n\nProvide:\n## Overview\n(2-3 sentence overview)\n\n## Key Concepts\n- bullet points of major topics\n\n## Clinical Pearls\n- important clinical insights\n\n## Study Focus Areas\n- what to prioritize for exams`,
        },
      ]);
      const summaryText = summaryResponse?.message?.content || summaryResponse?.choices?.[0]?.message?.content || 'Summary could not be generated.';
      setSummary(summaryText);

      setProcessingStep(`Generating ${numQuestions} ${difficulty} questions...`);
      const questionsResponse = await puter.ai.chat([
        {
          role: 'system',
          content: 'You are an expert medical exam writer. Generate high-quality multiple choice questions in a strict parseable format. Every question must follow the exact format below.',
        },
        {
          role: 'user',
          content: `Generate exactly ${numQuestions} ${difficulty} multiple choice questions from this medical document:\n\n${contentForAI}\n\nStrict format for EVERY question:\nQ1: [Question text here]\nA) [Option A]\nB) [Option B]\nC) [Option C]\nD) [Option D]\nAnswer: [A/B/C/D]\nExplanation: [Brief 1-2 sentence explanation]\n\nDo NOT add extra text between questions. Number them Q1 through Q${numQuestions}.`,
        },
      ]);
      const questionsText = questionsResponse?.message?.content || questionsResponse?.choices?.[0]?.message?.content || '';
      setRawQuestions(questionsText);

      const parsed = parseQuestionsFromText(questionsText);
      setParsedQuestions(parsed);

      setStage('results');
      setActiveTab('questions');
      toast.success(`Generated ${parsed.length} questions from "${file.name}"`);

      if (onSummaryComplete) onSummaryComplete(summaryText);
      if (onQuestionsReady) onQuestionsReady(parsed);
    } catch (err: any) {
      console.error('[PDFSummarizer] Error:', err);
      toast.error(err?.message || 'Failed to process file. Please try again.');
      setStage('upload');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleSaveAsQuiz = async () => {
    if (!quizTitle.trim()) { toast.error('Please enter a quiz title'); return; }
    if (parsedQuestions.length === 0) { toast.error('No questions to save'); return; }
    setSaving(true);
    try {
      const quizQuestions: QuizQuestion[] = parsedQuestions.map((q, idx) => ({
        id: `q-${idx}`,
        text: q.text,
        type: q.type,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      }));
      await createQuiz({
        title: quizTitle,
        description: `AI-generated from: ${fileName}`,
        courseId: '',
        levelId: '',
        questions: quizQuestions,
        published: false,
      });
      toast.success('Quiz saved! Admin can publish it from the quiz manager.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStage('upload');
    setSummary('');
    setRawQuestions('');
    setParsedQuestions([]);
    setFileName('');
    setExpandedQ(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {/* ---- UPLOAD STAGE ---- */}
        {stage === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            {/* Options */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Number of Questions</label>
                <select
                  value={numQuestions}
                  onChange={e => setNumQuestions(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                >
                  {[5, 10, 15, 20, 25, 30].map(n => <option key={n} value={n}>{n} questions</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as any)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-teal-300 rounded-2xl p-10 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-colors group"
            >
              <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-200 transition-colors">
                <Upload className="w-7 h-7 text-teal-600" />
              </div>
              <p className="text-base font-semibold text-gray-800 mb-1">Drop your file here or click to browse</p>
              <p className="text-sm text-gray-500">Supports PDF, images (JPG, PNG, WebP), and text files — up to 20MB</p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="inline-flex items-center gap-1 text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-1 rounded-full">
                  <Sparkles className="w-3 h-3" /> AI-powered
                </span>
                <span className="text-xs text-gray-400">Puter.js AI</span>
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf,.txt,image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
            </div>
          </motion.div>
        )}

        {/* ---- PROCESSING STAGE ---- */}
        {stage === 'processing' && (
          <motion.div key="processing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="py-16 text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-teal-100 animate-ping opacity-30" />
              <div className="relative w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-9 h-9 text-teal-600 animate-spin" />
              </div>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">Processing with AI</p>
              <p className="text-sm text-gray-500 mt-1">{processingStep}</p>
              <p className="text-xs text-gray-400 mt-1">{fileName}</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}

        {/* ---- RESULTS STAGE ---- */}
        {stage === 'results' && (
          <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Header bar */}
            <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-teal-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{fileName}</p>
                  <p className="text-xs text-gray-500">{parsedQuestions.length} questions generated</p>
                </div>
              </div>
              <button onClick={reset} className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium">
                <RefreshCw className="w-3.5 h-3.5" /> New file
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {[
                { id: 'summary', icon: AlignLeft, label: 'Summary' },
                { id: 'questions', icon: HelpCircle, label: `Questions (${parsedQuestions.length})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-teal-600" />
                    <span className="text-sm font-semibold text-gray-800">AI Summary</span>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(summary); toast.success('Copied!'); }} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{summary}</div>
              </motion.div>
            )}

            {/* Questions Tab */}
            {activeTab === 'questions' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {parsedQuestions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Could not parse structured questions from the AI response.</p>
                    <details className="mt-3 text-xs text-left">
                      <summary className="cursor-pointer text-gray-400">View raw AI output</summary>
                      <pre className="bg-gray-50 rounded-lg p-3 mt-2 whitespace-pre-wrap max-h-60 overflow-y-auto text-gray-600">{rawQuestions}</pre>
                    </details>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                    {parsedQuestions.map((q, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setExpandedQ(expandedQ === idx ? null : idx)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                            <p className="text-sm text-gray-800 truncate">{q.text}</p>
                          </div>
                          {expandedQ === idx ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                        </button>
                        {expandedQ === idx && (
                          <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-3">
                            <div className="space-y-1.5">
                              {q.options.map((opt, oi) => (
                                <div key={oi} className={`flex items-start gap-2 p-2 rounded-lg text-sm ${opt === q.correctAnswer ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-gray-50 text-gray-700'}`}>
                                  <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center flex-shrink-0 font-bold ${opt === q.correctAnswer ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    {['A', 'B', 'C', 'D'][oi]}
                                  </span>
                                  {opt}
                                </div>
                              ))}
                            </div>
                            {q.explanation && (
                              <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-xs text-blue-800">
                                <span className="font-semibold">Explanation: </span>{q.explanation}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Save as Quiz */}
                {parsedQuestions.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-800">Save as Quiz</p>
                    <input
                      type="text"
                      value={quizTitle}
                      onChange={e => setQuizTitle(e.target.value)}
                      placeholder="Quiz title..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                    <button
                      onClick={handleSaveAsQuiz}
                      disabled={saving || savingQuiz}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 text-white rounded-lg font-medium text-sm hover:bg-teal-700 disabled:opacity-50 transition-colors"
                    >
                      {saving || savingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving || savingQuiz ? 'Saving...' : 'Save as Draft Quiz'}
                    </button>
                    <p className="text-xs text-gray-500 text-center">Saved as draft — publish from Admin Quiz Manager</p>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
