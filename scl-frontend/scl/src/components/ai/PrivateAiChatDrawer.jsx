import { useState, useEffect, useRef } from 'react';
import { 
  BotIcon, 
  XIcon, 
  SendIcon, 
  SparklesIcon, 
  CopyIcon, 
  RotateCcwIcon, 
  Trash2Icon, 
  MicIcon, 
  BookOpenIcon,
  CheckIcon,
  MinusIcon,
  Maximize2Icon,
  Minimize2Icon,
  ArrowDownIcon
} from 'lucide-react';
import api from '../../lib/axios.js';
import toast from 'react-hot-toast';

const PrivateAiChatDrawer = ({ isOpen, onClose, note }) => {
  const docId = note?.id || note?._id;
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello! I am your AI Study Assistant grounded in "${note?.title || 'this document'}". Ask me anything or click a suggested prompt below!`,
      citations: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTall, setIsTall] = useState(false); // Facebook-style extra long height toggle
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  useEffect(() => {
    if (!isMinimized) {
      scrollToBottom();
    }
  }, [messages, loading, isMinimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 100);
  };

  const suggestedPrompts = [
    "Summarize key takeaways",
    "Explain main concepts",
    "List core definitions",
    "Key methodology"
  ];

  if (!isOpen) return null;

  const handleSendMessage = async (queryText) => {
    const question = (queryText || input).trim();
    if (!question) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        question,
        documentId: docId
      });

      const answer = res.data?.data?.answer || res.data?.answer || "I could not generate an answer based on this document.";
      const citations = res.data?.data?.citations || [];

      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: answer, citations }
      ]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      const errMsg = error.response?.data?.message || "AI Assistant service error. Please ensure the AI backend is active.";
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: `⚠️ ${errMsg}`, citations: [] }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRegenerate = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.text);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        text: `Conversation cleared. Ask a new question about "${note?.title || 'this document'}".`,
        citations: []
      }
    ]);
  };

  // Minimized Facebook Chat Dock Bar
  if (isMinimized) {
    return (
      <div className="fixed bottom-0 right-4 sm:right-8 z-50 animate-bounce-short">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-primary text-primary-content font-semibold px-4 py-2.5 rounded-t-xl shadow-2xl flex items-center gap-2.5 border-t border-x border-primary-content/20 hover:brightness-110 transition-all cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <BotIcon className="size-5" />
            <span className="absolute -top-1 -right-1 size-2.5 bg-success rounded-full ring-2 ring-primary"></span>
          </div>
          <span className="text-xs font-bold truncate max-w-[180px]">
            AI Chat: {note?.title || 'Study Assistant'}
          </span>
          <span className="badge badge-xs badge-ghost text-[10px] font-mono">Expand</span>
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`fixed bottom-0 right-3 sm:right-6 z-50 w-[92vw] sm:w-[380px] md:w-[420px] bg-base-100 shadow-2xl border-t border-x border-base-300 rounded-t-2xl flex flex-col transition-all duration-300 ${
        isTall ? 'h-[780px] max-h-[92vh]' : 'h-[600px] max-h-[84vh]'
      }`}
    >
      {/* Facebook-style Header Bar */}
      <div className="px-4 py-2.5 border-b border-base-300 flex items-center justify-between bg-base-200/80 rounded-t-2xl shrink-0 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative p-1.5 rounded-lg bg-secondary/15 text-secondary shrink-0">
            <BotIcon className="size-4" />
            <span className="absolute -top-0.5 -right-0.5 size-2 bg-success rounded-full ring-2 ring-base-200"></span>
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs flex items-center gap-1.5 leading-tight truncate">
              <span className="truncate">{note?.title || 'AI Assistant'}</span>
              <span className="badge badge-xs badge-secondary text-[9px] shrink-0">AI</span>
            </h3>
            <p className="text-[10px] text-base-content/60 truncate">Connected to document</p>
          </div>
        </div>

        {/* Action Controls: Minimize, Maximize/Tall, Clear, Close */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button 
            onClick={handleClear} 
            className="btn btn-ghost btn-xs btn-square hover:bg-base-300" 
            title="Clear Chat"
          >
            <Trash2Icon className="size-3.5 text-base-content/60" />
          </button>
          
          <button 
            onClick={() => setIsTall(!isTall)} 
            className="btn btn-ghost btn-xs btn-square hover:bg-base-300" 
            title={isTall ? "Standard Height" : "Make Taller (Long Window)"}
          >
            {isTall ? <Minimize2Icon className="size-3.5 text-base-content/60" /> : <Maximize2Icon className="size-3.5 text-base-content/60" />}
          </button>

          <button 
            onClick={() => setIsMinimized(true)} 
            className="btn btn-ghost btn-xs btn-square hover:bg-base-300" 
            title="Minimize to Dock"
          >
            <MinusIcon className="size-3.5 text-base-content/60" />
          </button>

          <button 
            onClick={onClose} 
            className="btn btn-ghost btn-xs btn-square hover:bg-error/20 hover:text-error" 
            title="Close Window"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Suggested Quick Prompts Bar */}
      <div className="px-3 py-1.5 bg-base-200/40 border-b border-base-300/60 overflow-x-auto whitespace-nowrap custom-scrollbar flex gap-1.5 shrink-0">
        {suggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            className="btn btn-[11px] h-6 min-h-6 px-2.5 btn-outline btn-secondary rounded-full font-normal shrink-0 flex items-center gap-1 hover:scale-105 transition-transform"
          >
            <SparklesIcon className="size-2.5" /> {prompt}
          </button>
        ))}
      </div>

      {/* Message History - Smooth Wheel Scrollable Container */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar p-3.5 space-y-3.5 relative"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-content rounded-br-xs shadow-sm font-medium'
                  : 'bg-base-200 border border-base-300 rounded-bl-xs text-base-content'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* Document Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 pt-1.5 border-t border-base-300/50 flex flex-wrap items-center gap-1 text-[10px] text-base-content/70">
                  <span className="font-semibold text-[9px] uppercase tracking-wider text-base-content/50 flex items-center gap-1">
                    <BookOpenIcon className="size-2.5" /> Sources:
                  </span>
                  {msg.citations.map((c, cIdx) => (
                    <span key={cIdx} className="badge badge-xs badge-neutral gap-0.5 cursor-pointer hover:badge-primary text-[9px]" title={c.text}>
                      Page {c.page}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Assistant Action Bar */}
            {msg.role === 'assistant' && i > 0 && (
              <div className="flex items-center gap-2 mt-1 text-[10px] text-base-content/40 pl-1">
                <button 
                  onClick={() => handleCopy(msg.text, i)} 
                  className="hover:text-primary flex items-center gap-0.5" 
                  title="Copy Response"
                >
                  {copiedIndex === i ? <CheckIcon className="size-2.5 text-success" /> : <CopyIcon className="size-2.5" />}
                  {copiedIndex === i ? 'Copied' : 'Copy'}
                </button>
                <span>•</span>
                <button onClick={handleRegenerate} className="hover:text-primary flex items-center gap-0.5" title="Regenerate">
                  <RotateCcwIcon className="size-2.5" /> Regenerate
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-start gap-2">
            <div className="bg-base-200 border border-base-300 rounded-2xl rounded-bl-xs px-3.5 py-2.5 flex items-center gap-2 text-xs text-base-content/60">
              <span className="loading loading-dots loading-xs text-secondary"></span>
              <span className="text-[11px]">Thinking & searching note context...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />

        {/* Scroll To Bottom Button */}
        {showScrollBottom && (
          <button
            onClick={scrollToBottom}
            className="sticky bottom-2 left-1/2 -translate-x-1/2 btn btn-circle btn-xs btn-primary shadow-lg flex items-center justify-center transition-all animate-bounce"
            title="Scroll to latest"
          >
            <ArrowDownIcon className="size-3" />
          </button>
        )}
      </div>

      {/* Facebook-style Input Footer */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
        className="p-2.5 border-t border-base-300 bg-base-100 rounded-b-2xl flex items-center gap-1.5 shrink-0"
      >
        <button
          type="button"
          onClick={() => {
            setIsVoiceActive(!isVoiceActive);
            toast(isVoiceActive ? "Voice input disabled" : "Listening for voice input...", { icon: '🎙️' });
          }}
          className={`btn btn-circle btn-xs btn-ghost ${isVoiceActive ? 'text-error animate-pulse' : 'text-base-content/60'}`}
          title="Voice Dictation"
        >
          <MicIcon className="size-3.5" />
        </button>

        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="input input-xs input-bordered flex-1 bg-base-200 text-xs focus:input-primary rounded-full px-3 h-8"
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn btn-xs btn-primary btn-circle shrink-0 h-8 w-8 min-h-8 min-w-8"
        >
          <SendIcon className="size-3.5" />
        </button>
      </form>
    </div>
  );
};

export default PrivateAiChatDrawer;
