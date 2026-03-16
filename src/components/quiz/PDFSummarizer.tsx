import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Loader, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { summarizePDFContent, generateExamQuestionsFromPDF } from '../../actions/summarize-pdf';
import { parsePptx } from '../../lib/parsePptx';

interface PDFSummarizerProps {
  onSummaryComplete?: (summary: string) => void;
}

const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

export const PDFSummarizer: React.FC<PDFSummarizerProps> = ({ onSummaryComplete }) => {
  const [loading, setLoading]                   = useState(false);
  const [fileName, setFileName]                 = useState<string | null>(null);
  const [fileIcon, setFileIcon]                 = useState<'pdf' | 'pptx' | 'image'>('pdf');
  const [summary, setSummary]                   = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<string | null>(null);
  const [activeTab, setActiveTab]               = useState<'summary' | 'questions'>('summary');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isPptx  = file.type === PPTX_MIME || file.name.toLowerCase().endsWith('.pptx');
    const isImage = file.type.startsWith('image/');
    const isPdf   = file.type === 'application/pdf';

    if (!isPptx && !isImage && !isPdf) {
      toast.error('Please upload a PDF, PowerPoint (.pptx), or image file (JPG, PNG, WebP)');
      return;
    }

    setLoading(true);
    setFileName(file.name);
    setFileIcon(isPptx ? 'pptx' : isImage ? 'image' : 'pdf');
    setSummary(null);
    setGeneratedQuestions(null);

    try {
      let fileContent = '';

      if (isPptx) {
        // Parse slide text from PPTX using JSZip
        const buffer = await file.arrayBuffer();
        fileContent  = await parsePptx(buffer);
      } else {
        // Read as DataURL (PDF text extraction or image base64)
        fileContent = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload  = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });

        if (isImage) {
          fileContent = `[Image file: ${file.name}\nBase64 data: ${fileContent.substring(0, 200)}...\nPlease analyze and summarize the educational content visible in this image.]`;
        }
      }

      if (!fileContent || fileContent.trim().length < 10) {
        toast.error('File appears to be empty or unreadable. Please try another file.');
        setLoading(false);
        return;
      }

      const [summaryResult, questionsResult] = await Promise.all([
        summarizePDFContent(fileContent, file.name),
        generateExamQuestionsFromPDF(fileContent, file.name, 'Medical Education'),
      ]);

      setSummary(summaryResult);
      setGeneratedQuestions(questionsResult);
      toast.success('Document analysed successfully!');
      onSummaryComplete?.(summaryResult);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(`Failed to process file: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setSummary(null);
    setGeneratedQuestions(null);
    setFileName(null);
    setActiveTab('summary');
  };

  const fadeInVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <motion.div variants={fadeInVariants} initial="initial" animate="animate" className="space-y-4">

      {/* ── Upload Panel ─────────────────────────────────────────────────── */}
      {!summary && (
        <motion.div className="bg-white rounded-xl p-6 border-2 border-dashed border-teal-300 shadow-sm">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-teal-50 rounded-xl">
              <FileText className="w-8 h-8 text-teal-600" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">AI Document Summariser</h3>
              <p className="text-sm text-gray-500 mb-1">
                Upload a document to generate AI summaries and exam questions.
              </p>
              {/* Supported format chips */}
              <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                {[
                  { label: 'PDF',        color: 'bg-red-50 text-red-600 border-red-200' },
                  { label: 'PowerPoint', color: 'bg-orange-50 text-orange-600 border-orange-200' },
                  { label: 'JPG / PNG',  color: 'bg-blue-50 text-blue-600 border-blue-200' },
                ].map(({ label, color }) => (
                  <span key={label} className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${color}`}>
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <label className="w-full cursor-pointer">
              <input
                type="file"
                accept=".pdf,.pptx,image/*"
                onChange={handleFileUpload}
                disabled={loading}
                className="hidden"
              />
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors"
              >
                {loading ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Analysing…</>
                ) : (
                  <><Upload className="w-4 h-4" /> {fileName ? `Change File (${fileName})` : 'Upload File'}</>
                )}
              </motion.div>
            </label>

            <p className="text-xs text-gray-400 text-center">
              PDF · PowerPoint (.pptx) · Images (JPG, PNG, WebP) · Powered by AI
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Results Panel ────────────────────────────────────────────────── */}
      {(summary || generatedQuestions) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-md space-y-4"
        >
          {/* Header row */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              {fileIcon === 'pptx' ? (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-600 border border-orange-200">PPTX</span>
              ) : (
                <FileText className="w-5 h-5 text-teal-600" />
              )}
              <span className="font-semibold text-gray-800 text-sm truncate max-w-[200px]">{fileName}</span>
            </div>
            <button onClick={resetState} className="p-1 hover:bg-gray-100 rounded transition-colors" title="Upload new file">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            {(['summary', 'questions'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-teal-600 border-b-2 border-teal-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'summary' ? 'Summary' : 'Exam Questions'}
              </button>
            ))}
          </div>

          {/* Content */}
          <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={`p-4 rounded-lg whitespace-pre-wrap text-sm leading-relaxed ${activeTab === 'summary' ? 'bg-teal-50' : 'bg-blue-50'}`}>
              {activeTab === 'summary' ? summary : generatedQuestions}
            </div>
          </motion.div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText((activeTab === 'summary' ? summary : generatedQuestions) ?? '');
                toast.success('Copied to clipboard!');
              }}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-lg transition-colors"
            >
              Copy
            </button>
            <button
              onClick={resetState}
              className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Upload Another
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
