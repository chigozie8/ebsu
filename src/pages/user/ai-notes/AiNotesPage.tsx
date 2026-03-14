/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavLink } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

type OutputMode =
  | "summary"
  | "flashcards"
  | "mcq"
  | "theory"
  | "keypoints"
  | "mnemonics"
  | "timeline"
  | "glossary";

interface Flashcard {
  term: string;
  definition: string;
}

interface MCQItem {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface TheoryItem {
  question: string;
  answer: string;
}

interface KeyPoint {
  point: string;
  detail: string;
}

type OutputResult =
  | { mode: "summary"; content: string }
  | { mode: "flashcards"; items: Flashcard[] }
  | { mode: "mcq"; items: MCQItem[] }
  | { mode: "theory"; items: TheoryItem[] }
  | { mode: "keypoints"; items: KeyPoint[] }
  | { mode: "mnemonics"; content: string }
  | { mode: "timeline"; content: string }
  | { mode: "glossary"; content: string };

// ─── Mode Config ──────────────────────────────────────────────────────────────

const OUTPUT_MODES: {
  id: OutputMode;
  label: string;
  icon: string;
  description: string;
  color: string;
  textColor: string;
}[] = [
  { id: "summary", label: "Summary", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", description: "Concise summary of the entire document", color: "bg-[#bef264]/80 hover:bg-[#bef264]", textColor: "text-[#3a5c00]" },
  { id: "flashcards", label: "Flashcards", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", description: "Term-definition cards for quick revision", color: "bg-[#93c5fd]/80 hover:bg-[#93c5fd]", textColor: "text-[#1d4ed8]" },
  { id: "mcq", label: "MCQ Exam", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", description: "Multiple-choice questions with answers", color: "bg-[#fde68a]/80 hover:bg-[#fde68a]", textColor: "text-[#b45309]" },
  { id: "theory", label: "Theory Qs", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z", description: "Long-form theory questions & model answers", color: "bg-[#c4b5fd]/80 hover:bg-[#c4b5fd]", textColor: "text-[#6d28d9]" },
  { id: "keypoints", label: "Key Points", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z", description: "Bullet-point key facts and concepts", color: "bg-[#6ee7b7]/80 hover:bg-[#6ee7b7]", textColor: "text-[#047857]" },
  { id: "mnemonics", label: "Mnemonics", icon: "M13 10V3L4 14h7v7l9-11h-7z", description: "Memory aids and acronyms", color: "bg-[#fca5a5]/80 hover:bg-[#fca5a5]", textColor: "text-[#b91c1c]" },
  { id: "timeline", label: "Timeline", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", description: "Chronological order of events/concepts", color: "bg-[#a5f3fc]/80 hover:bg-[#a5f3fc]", textColor: "text-[#0e7490]" },
  { id: "glossary", label: "Glossary", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", description: "Medical terms and their definitions", color: "bg-[#c7d2fe]/80 hover:bg-[#c7d2fe]", textColor: "text-[#4338ca]" },
];

// ─── Prompt builders ──────────────────────────────────────────────────────────

const buildPrompt = (mode: OutputMode, text: string): string => {
  const base = `You are an expert medical education assistant. Based on the following medical document text, `;
  switch (mode) {
    case "summary":
      return `${base}write a clear, structured summary in 3-5 paragraphs covering all major concepts, clinical relevance, and key takeaways. Use headings where helpful.\n\nDOCUMENT:\n${text}`;
    case "flashcards":
      return `${base}generate exactly 10 flashcards. Return ONLY valid JSON array like this format:
[{"term":"...","definition":"..."}]
No extra text, no markdown code blocks.\n\nDOCUMENT:\n${text}`;
    case "mcq":
      return `${base}generate 8 multiple-choice questions. Return ONLY valid JSON array:
[{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"..."}]
No extra text, no markdown code blocks.\n\nDOCUMENT:\n${text}`;
    case "theory":
      return `${base}generate 6 theory exam questions with model answers. Return ONLY valid JSON array:
[{"question":"...","answer":"..."}]
No extra text, no markdown code blocks.\n\nDOCUMENT:\n${text}`;
    case "keypoints":
      return `${base}extract the 10 most important key points. Return ONLY valid JSON array:
[{"point":"...","detail":"..."}]
No extra text, no markdown code blocks.\n\nDOCUMENT:\n${text}`;
    case "mnemonics":
      return `${base}create memorable mnemonics, acronyms, and memory aids for the key concepts. Format as a clear, readable list with explanations.\n\nDOCUMENT:\n${text}`;
    case "timeline":
      return `${base}organize the key events, processes, or concepts in chronological or logical sequential order. Present as a clear numbered timeline.\n\nDOCUMENT:\n${text}`;
    case "glossary":
      return `${base}create a comprehensive glossary of all medical terms, abbreviations, and specialized vocabulary. Format as a numbered list: Term: Definition.\n\nDOCUMENT:\n${text}`;
  }
};

// ─── Parse AI JSON responses safely ──────────────────────────────────────────

function parseJSON<T>(raw: string): T | null {
  try {
    // strip potential markdown code fences
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FlashcardViewer({ items }: { items: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Card {index + 1} of {items.length}</span>
        <div className="flex gap-2">
          <button onClick={() => { setIndex((i) => Math.max(0, i - 1)); setFlipped(false); }} disabled={index === 0} className="px-3 py-1 rounded-lg border border-gray-200 text-xs font-medium disabled:opacity-40 hover:bg-gray-50">Prev</button>
          <button onClick={() => { setIndex((i) => Math.min(items.length - 1, i + 1)); setFlipped(false); }} disabled={index === items.length - 1} className="px-3 py-1 rounded-lg border border-gray-200 text-xs font-medium disabled:opacity-40 hover:bg-gray-50">Next</button>
        </div>
      </div>
      <div className="relative h-48 cursor-pointer" onClick={() => setFlipped((f) => !f)} style={{ perspective: "1000px" }}>
        <motion.div
          className="w-full h-full relative"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front */}
          <div className="absolute inset-0 bg-[#00875a] rounded-2xl flex flex-col items-center justify-center p-6 text-center backface-hidden" style={{ backfaceVisibility: "hidden" }}>
            <p className="text-xss text-green-200 uppercase tracking-widest mb-3 font-medium">Term</p>
            <p className="text-white font-semibold text-base leading-snug">{items[index].term}</p>
            <p className="text-green-200 text-xss mt-4">Tap to reveal definition</p>
          </div>
          {/* Back */}
          <div className="absolute inset-0 bg-white border-2 border-[#00875a] rounded-2xl flex flex-col items-center justify-center p-6 text-center" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <p className="text-xss text-[#00875a] uppercase tracking-widest mb-3 font-medium">Definition</p>
            <p className="text-gray-800 text-sm leading-relaxed">{items[index].definition}</p>
          </div>
        </motion.div>
      </div>
      {/* All cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
        {items.map((card, i) => (
          <div key={i} onClick={() => { setIndex(i); setFlipped(false); }} className={`cursor-pointer p-3 rounded-xl border transition-all ${i === index ? "border-[#00875a] bg-[#f0fdf4]" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}>
            <p className="text-xs font-semibold text-gray-800 truncate">{card.term}</p>
            <p className="text-xss text-gray-500 truncate mt-0.5">{card.definition}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MCQViewer({ items }: { items: MCQItem[] }) {
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const score = items.filter((item, i) => selected[i] === item.answer[0]).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
        <span className="text-sm text-gray-600">Score</span>
        <span className="font-bold text-[#00875a]">{score} / {items.length}</span>
      </div>
      {items.map((item, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-900 mb-3">{i + 1}. {item.question}</p>
          <div className="space-y-2">
            {item.options.map((opt) => {
              const optLabel = opt.charAt(0);
              const isCorrect = optLabel === item.answer[0];
              const isSelected = selected[i] === optLabel;
              const isRevealed = revealed[i];
              let bg = "bg-white border-gray-200 text-gray-700 hover:border-gray-300";
              if (isRevealed) {
                if (isCorrect) bg = "bg-green-50 border-green-400 text-green-800";
                else if (isSelected && !isCorrect) bg = "bg-red-50 border-red-400 text-red-700";
              } else if (isSelected) {
                bg = "bg-[#00875a] border-[#00875a] text-white";
              }
              return (
                <button
                  key={opt}
                  onClick={() => { if (!isRevealed) setSelected((s) => ({ ...s, [i]: optLabel })); }}
                  disabled={isRevealed}
                  className={`w-full text-left text-xs px-3 py-2.5 rounded-lg border transition-all ${bg}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          <div className="flex justify-end mt-3">
            {!revealed[i] ? (
              <button
                onClick={() => setRevealed((r) => ({ ...r, [i]: true }))}
                disabled={!selected[i]}
                className="text-xs px-3 py-1.5 bg-[#00875a] text-white rounded-lg disabled:opacity-40 hover:bg-[#21875a] transition-colors"
              >
                Check
              </button>
            ) : (
              <div className="text-xss text-blue-700 bg-blue-50 rounded-lg px-3 py-2 text-left w-full">
                <span className="font-semibold">Explanation: </span>{item.explanation}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function TheoryViewer({ items }: { items: TheoryItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-gray-50 transition-colors"
          >
            <p className="text-sm font-semibold text-gray-900 pr-4">{i + 1}. {item.question}</p>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-5 h-5 flex-shrink-0 text-gray-400 transition-transform ${open === i ? "rotate-180" : ""}`}>
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <AnimatePresence>
            {open === i && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                <div className="p-4 bg-blue-50 border-t border-blue-100">
                  <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Model Answer</p>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{item.answer}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function KeyPointsViewer({ items }: { items: KeyPoint[] }) {
  return (
    <div className="space-y-3">
      {items.map((kp, i) => (
        <div key={i} className="flex gap-3 bg-white border border-gray-100 rounded-xl p-4">
          <div className="w-7 h-7 flex-shrink-0 rounded-full bg-[#00875a] flex items-center justify-center">
            <span className="text-white text-xss font-bold">{i + 1}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{kp.point}</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{kp.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TextViewer({ content }: { content: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{content}</p>
    </div>
  );
}

// ─── Copy to clipboard helper ─────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#00875a] transition-colors">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        {copied ? <path d="M20 6L9 17l-5-5" /> : <><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></>}
      </svg>
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ─── Main Page ───────�����────────────────────────────────────────────────────────

export default function AiNotesPage() {
  const [rawText, setRawText] = useState("");
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [activeMode, setActiveMode] = useState<OutputMode>("summary");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<Partial<Record<OutputMode, OutputResult>>>({});
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── PDF text extraction using pdf.js CDN + FileReader for .txt ──
  const extractTextFromPDF = useCallback(async (file: File) => {
    setIsExtracting(true);
    setError(null);
    setRawText("");
    setResults({});
    setPdfName(file.name);

    try {
      if (file.name.endsWith(".txt") || file.type === "text/plain") {
        // Plain text: just read directly
        const text = await file.text();
        setRawText(text.slice(0, 12000));
        setIsExtracting(false);
        return;
      }

      // PDF: use pdf.js loaded from CDN via script tag
      const arrayBuffer = await file.arrayBuffer();

      // Dynamically load pdfjs if not already loaded
      if (!(window as any).pdfjsLib) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load pdf.js"));
          document.head.appendChild(script);
        });
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }

      const pdfjs = (window as any).pdfjsLib;
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      let allText = "";
      const maxPages = Math.min(pdf.numPages, 30); // limit to first 30 pages
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        allText += pageText + "\n";
      }

      const trimmed = allText.trim();
      if (!trimmed || trimmed.length < 30) {
        setError(
          "Could not extract readable text from this PDF. It may be a scanned image. Please paste your notes manually in the text box below."
        );
      } else {
        setRawText(trimmed.slice(0, 12000));
      }
    } catch (e: any) {
      setError(
        "Failed to read the file. If this is a scanned PDF, please paste your notes manually in the text box below."
      );
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === "application/pdf" || file.name.endsWith(".txt") || file.name.endsWith(".pdf")) {
      extractTextFromPDF(file);
    } else {
      setError("Please upload a PDF or TXT file.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) extractTextFromPDF(file);
  };

  // ── Wait for puter.js to be ready ──
  const waitForPuter = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).puter?.ai) { resolve((window as any).puter); return; }
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if ((window as any).puter?.ai) {
          clearInterval(interval);
          resolve((window as any).puter);
        } else if (attempts > 40) {
          clearInterval(interval);
          reject(new Error("Puter.js failed to load. Please refresh the page and try again."));
        }
      }, 250);
    });
  };

  // ── Generate output for selected mode ──
  const generate = async (mode: OutputMode) => {
    if (!rawText.trim()) { setError("Please upload a document or paste your notes first."); return; }
    setActiveMode(mode);
    setIsGenerating(true);
    setError(null);

    try {
      const puter = await waitForPuter();
      const prompt = buildPrompt(mode, rawText.slice(0, 6000));
      // puter.ai.chat(messages, testMode, options) — pass false for testMode
      const response = await puter.ai.chat(prompt, false, { model: "gpt-4o" });
      let content = typeof response === "string" ? response
        : response?.message?.content
        ?? response?.toString()
        ?? "";

      let result: OutputResult;
      if (mode === "flashcards") {
        const parsed = parseJSON<Flashcard[]>(content);
        result = { mode, items: parsed || [{ term: "Parse error", definition: content }] };
      } else if (mode === "mcq") {
        const parsed = parseJSON<MCQItem[]>(content);
        result = { mode, items: parsed || [] };
      } else if (mode === "theory") {
        const parsed = parseJSON<TheoryItem[]>(content);
        result = { mode, items: parsed || [] };
      } else if (mode === "keypoints") {
        const parsed = parseJSON<KeyPoint[]>(content);
        result = { mode, items: parsed || [] };
      } else {
        result = { mode, content } as OutputResult;
      }

      setResults((prev) => ({ ...prev, [mode]: result }));
    } catch (e: any) {
      setError(e?.message || "AI generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const currentResult = results[activeMode];
  const hasText = rawText.trim().length > 0;

  const renderResult = (res: OutputResult) => {
    switch (res.mode) {
      case "flashcards": return <FlashcardViewer items={res.items} />;
      case "mcq": return <MCQViewer items={res.items} />;
      case "theory": return <TheoryViewer items={res.items} />;
      case "keypoints": return <KeyPointsViewer items={res.items} />;
      default: return <TextViewer content={(res as any).content} />;
    }
  };

  const fadeIn = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Topbar */}
      <div className="fixed top-0 inset-x-0 z-30 bg-white border-b border-gray-200 h-14 flex items-center px-4 sm:px-8 gap-3">
        <NavLink to="/dashboard" className="flex items-center gap-1.5 text-gray-500 hover:text-[#00875a] text-sm transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Dashboard
        </NavLink>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-gray-800 text-sm">AI Notes</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-[#00875a]">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Powered by Puter.js AI
          </span>
        </div>
      </div>

      <div className="pt-14 max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* ── LEFT PANEL: Upload + text ── */}
          <div className="lg:col-span-2 space-y-4">
            <motion.div {...fadeIn}>
              <h1 className="text-xl font-bold text-gray-900">AI Note Summarizer</h1>
              <p className="text-sm text-gray-500 mt-1">Upload your PDF notes or paste text, then choose a study mode.</p>
            </motion.div>

            {/* Upload zone */}
            <motion.div {...fadeIn}>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  isDragging ? "border-[#00875a] bg-[#f0fdf4]" : "border-gray-200 bg-white hover:border-[#00875a] hover:bg-[#f0fdf4]"
                }`}
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.txt" className="hidden" onChange={handleFileChange} />
                {isExtracting ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="w-8 h-8 border-3 border-[#00875a] border-t-transparent rounded-full animate-spin" style={{ borderWidth: "3px" }} />
                    <p className="text-sm text-gray-600">Extracting text from PDF...</p>
                  </div>
                ) : pdfName ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#00875a" strokeWidth="2" className="w-5 h-5">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate max-w-full">{pdfName}</p>
                    <p className="text-xss text-gray-400">{rawText.length.toLocaleString()} characters extracted</p>
                    <button onClick={(e) => { e.stopPropagation(); setPdfName(null); setRawText(""); setResults({}); }} className="text-xss text-red-400 hover:text-red-600 mt-1">Remove</button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" className="w-6 h-6">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="12" x2="12" y2="18" />
                        <line x1="9" y1="15" x2="15" y2="15" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Drop your PDF or TXT file here</p>
                      <p className="text-xss text-gray-400 mt-1">or click to browse</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Manual text input */}
            <motion.div {...fadeIn}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Or paste your notes
              </label>
              <textarea
                rows={8}
                value={rawText}
                onChange={(e) => { setRawText(e.target.value); if (pdfName) setPdfName(null); }}
                placeholder="Paste lecture notes, textbook content, or any medical text here..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#00875a]/30 focus:border-[#00875a] transition-colors placeholder-gray-400"
              />
              <div className="flex items-center justify-between mt-1">
                {rawText.length > 0 && (
                  <span className="text-xss text-[#00875a] font-medium">
                    Ready — {rawText.length.toLocaleString()} characters extracted
                  </span>
                )}
                <span className="text-xss text-gray-400 ml-auto">{rawText.length.toLocaleString()} / 12,000 chars</span>
              </div>
            </motion.div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">{error}</div>
            )}
          </div>

          {/* ── RIGHT PANEL: Mode selector + Output ── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Mode cards grid */}
            <motion.div {...fadeIn}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Choose a Study Mode</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {OUTPUT_MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => generate(m.id)}
                    disabled={!hasText || isGenerating}
                    className={`relative group flex flex-col items-center gap-2 p-3 rounded-2xl text-center transition-all border-2 ${
                      activeMode === m.id && results[m.id]
                        ? `${m.color.replace("hover:", "")} border-current`
                        : `${m.color} border-transparent`
                    } ${!hasText || isGenerating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {isGenerating && activeMode === m.id ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${m.textColor}`}>
                        <path d={m.icon} />
                      </svg>
                    )}
                    <span className={`text-xss font-semibold leading-tight ${m.textColor}`}>{m.label}</span>
                    {results[m.id] && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00875a] rounded-full" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xss text-gray-400 mt-2">{Object.keys(results).length} / {OUTPUT_MODES.length} modes generated</p>
            </motion.div>

            {/* Output area */}
            <AnimatePresence mode="wait">
              {currentResult ? (
                <motion.div
                  key={activeMode}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">
                        {OUTPUT_MODES.find((m) => m.id === activeMode)?.label}
                      </span>
                      {pdfName && <span className="text-xss text-gray-400 truncate max-w-[120px]">from {pdfName}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <CopyButton text={
                        "content" in currentResult
                          ? (currentResult as any).content
                          : JSON.stringify((currentResult as any).items, null, 2)
                      } />
                      <button
                        onClick={() => generate(activeMode)}
                        className="text-xs text-gray-400 hover:text-[#00875a] flex items-center gap-1 transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Regenerate
                      </button>
                    </div>
                  </div>
                  <div className="p-5 max-h-[600px] overflow-y-auto">
                    {renderResult(currentResult)}
                  </div>
                </motion.div>
              ) : !isGenerating ? (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" className="w-7 h-7">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    {hasText ? "Select a study mode above to generate content" : "Upload a document or paste your notes to get started"}
                  </p>
                  <p className="text-xss text-gray-400 mt-1">AI-powered by Puter.js — no API key required</p>
                </motion.div>
              ) : (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-2xl border border-gray-100 p-10 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-10 h-10 border-[3px] border-[#00875a] border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-sm font-medium text-gray-700">Generating {OUTPUT_MODES.find((m) => m.id === activeMode)?.label}...</p>
                  <p className="text-xss text-gray-400 mt-1">This usually takes 5-15 seconds</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
