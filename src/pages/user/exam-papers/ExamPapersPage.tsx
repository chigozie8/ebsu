import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, ArrowLeft, MessageCircle, Lightbulb, BookOpen, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const fadeInVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function StudyAIPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your Study AI Assistant. I\'m here to help you learn medical concepts, explain complex topics, provide study tips, and answer your questions. What would you like to study today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const suggestedTopics = [
    { icon: BookOpen, title: 'Anatomy Basics', color: 'from-blue-500 to-blue-600' },
    { icon: Lightbulb, title: 'Physiology', color: 'from-yellow-500 to-yellow-600' },
    { icon: Zap, title: 'Clinical Skills', color: 'from-green-500 to-green-600' },
    { icon: MessageCircle, title: 'Ask a Question', color: 'from-purple-500 to-purple-600' }
  ];

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Simulate AI response delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you asked about: "${inputValue}". As a medical study assistant, I can help explain medical concepts, provide summaries, create study guides, and help you prepare for exams. This is a demo version. In a full implementation, this would connect to an AI API for comprehensive medical education support.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedTopic = (topic: string) => {
    setSelectedTopic(topic);
    setInputValue(`Teach me about ${topic}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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
              <MessageCircle className="w-5 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">Study AI Assistant</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Learn medical concepts with AI-powered guidance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="w-full max-w-[1720px] mx-auto px-3 xxss:px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col h-[600px] sm:h-[700px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.length === 0 && !selectedTopic ? (
              <motion.div
                variants={fadeInVariants}
                initial="initial"
                animate="animate"
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full p-4 mb-4">
                  <MessageCircle className="w-8 sm:w-10 h-8 sm:h-10 text-indigo-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Welcome to Study AI</h2>
                <p className="text-gray-600 text-sm sm:text-base max-w-xs">Choose a topic or ask any medical question. I'm here to help you learn!</p>
              </motion.div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    variants={fadeInVariants}
                    initial="initial"
                    animate="animate"
                    custom={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs sm:max-w-md lg:max-w-lg px-4 py-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-900 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm sm:text-base leading-relaxed">{message.content}</p>
                      <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-indigo-200' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-3 rounded-lg rounded-bl-none">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Topics */}
          {messages.length === 1 && !selectedTopic && (
            <div className="border-t border-gray-200 p-4 sm:p-6">
              <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-3">Suggested Topics:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {suggestedTopics.map((topic, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedTopic(topic.title)}
                    className={`bg-gradient-to-br ${topic.color} text-white p-3 sm:p-4 rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm font-semibold flex flex-col items-center gap-2`}
                  >
                    <topic.icon className="w-4 sm:w-5 h-4 sm:h-5" />
                    {topic.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
            <div className="flex gap-2 sm:gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything about medicine and surgery..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 text-sm sm:text-base"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white p-2 sm:p-3 rounded-lg transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Press Enter to send or click the send button</p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 sm:mt-8">
          <motion.div
            variants={fadeInVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Comprehensive Learning</h3>
            </div>
            <p className="text-sm text-gray-600">Get detailed explanations on medical concepts, anatomy, physiology, and clinical applications.</p>
          </motion.div>

          <motion.div
            variants={fadeInVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            custom={1}
            className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-gray-900">Study Tips</h3>
            </div>
            <p className="text-sm text-gray-600">Receive personalized study strategies and exam preparation guidance tailored to your needs.</p>
          </motion.div>

          <motion.div
            variants={fadeInVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            custom={2}
            className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Quick Answers</h3>
            </div>
            <p className="text-sm text-gray-600">Get instant responses to your medical questions anytime, anywhere in the learning platform.</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
