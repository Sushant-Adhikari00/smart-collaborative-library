import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  ChevronRightIcon,
  ChevronLeftIcon,
  ArrowDownIcon,
  GripVerticalIcon,
  RefreshCwIcon,
  Maximize2Icon,
  Minimize2Icon,
  PaletteIcon,
  SunIcon,
  MoonIcon
} from 'lucide-react';
import api from '../../lib/axios.js';
import toast from 'react-hot-toast';

const PrivateAiChatDrawer = ({ isOpen, onClose, note }) => {
  const docId = note?.id || note?._id;
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  
  // Messages & Input State
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Dynamic Theme State
  const [chatTheme, setChatTheme] = useState(() => {
    return localStorage.getItem('ai_chat_theme') || 'auto';
  });
  const [showThemePicker, setShowThemePicker] = useState(false);

  // Dynamic Sidebar Width State (in pixels)
  const [sidebarWidth, setSidebarWidth] = useState(440);
  const [isWide, setIsWide] = useState(false);
  const isResizingRef = useRef(false);
  const dragStartRef = useRef({ startX: 0, initialW: 440 });

  // Web Speech Recognition setup
  const recognitionRef = useRef(null);

  const themeOptions = [
    { id: 'auto', label: 'Sync Site Theme' },
    { id: 'retro', label: 'Retro Warm' },
    { id: 'cyberpunk', label: 'Cyberpunk Neon' },
    { id: 'synthwave', label: 'Synthwave' },
    { id: 'dark', label: 'Classic Dark' },
    { id: 'light', label: 'Classic Light' },
    { id: 'dracula', label: 'Dracula Gothic' },
    { id: 'emerald', label: 'Academic Emerald' },
    { id: 'cupcake', label: 'Soft Cupcake' },
    { id: 'dim', label: 'Dim Charcoal' },
    { id: 'nord', label: 'Nordic Slate' },
    { id: 'sunset', label: 'Sunset Amber' }
  ];

  useEffect(() => {
    if (!isCollapsed) {
      scrollToBottom();
    }
  }, [messages, loading, isCollapsed]);

  useEffect(() => {
    // Initialize Web Speech API if supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsVoiceActive(false);
        toast.success("Voice transcribed!");
      };

      recognition.onerror = () => {
        setIsVoiceActive(false);
        toast.error("Voice input failed or timed out.");
      };

      recognition.onend = () => {
        setIsVoiceActive(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleThemeChange = (newTheme) => {
    setChatTheme(newTheme);
    localStorage.setItem('ai_chat_theme', newTheme);
    setShowThemePicker(false);
    toast.success(`AI Chat theme set to ${newTheme.toUpperCase()}`);
  };

  // Determine active dynamic theme
  const activeTheme = chatTheme === 'auto' ? (localStorage.getItem('theme') || 'retro') : chatTheme;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 100);
  };

  // Dynamic Prompts based on Document Title
  const suggestedPrompts = [
    `Summarize "${note?.title?.slice(0, 18) || 'document'}"`,
    "Explain key methodology",
    "List core definitions",
    "Key takeaways & conclusions"
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

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error("Voice dictation is not supported in this browser.");
      return;
    }
    if (isVoiceActive) {
      recognitionRef.current.stop();
      setIsVoiceActive(false);
    } else {
      setIsVoiceActive(true);
      recognitionRef.current.start();
      toast("Listening...", { icon: '🎙️' });
    }
  };

  // --- Dynamic Left Edge Drag-to-Resize Sidebar Width ---
  const handleResizeStart = (e) => {
    e.preventDefault();
    isResizingRef.current = true;
    dragStartRef.current = {
      startX: e.clientX,
      initialW: sidebarWidth
    };

    const handleMouseMove = (moveEvent) => {
      if (!isResizingRef.current) return;
      const deltaX = dragStartRef.current.startX - moveEvent.clientX;
      const newW = Math.min(Math.max(dragStartRef.current.initialW + deltaX, 320), Math.min(750, window.innerWidth - 60));
      setSidebarWidth(newW);
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const resetWidth = () => {
    setSidebarWidth(440);
    setIsWide(false);
    toast.success("Sidebar width reset!");
  };

  const toggleWideMode = () => {
    if (isWide) {
      setSidebarWidth(440);
      setIsWide(false);
    } else {
      setSidebarWidth(620);
      setIsWide(true);
    }
  };

  // Render via React Portal directly into document.body with dynamic data-theme
  const content = (
    <div className="font-sans" data-theme={activeTheme}>
      {/* Collapsed Ribbon Button fixed to right edge of screen */}
      {isCollapsed ? (
        <div className="fixed top-1/2 -translate-y-1/2 right-0 z-[99999] animate-bounce-short">
          <button
            onClick={() => setIsCollapsed(false)}
            className="bg-primary text-primary-content font-bold py-4 px-2.5 rounded-l-2xl shadow-2xl flex flex-col items-center gap-2 border-l border-y border-primary-content/20 hover:pr-4 transition-all cursor-pointer"
            title="Expand AI Assistant Panel"
          >
            <BotIcon className="size-5" />
            <span className="text-[11px] uppercase tracking-wider font-extrabold [writing-mode:vertical-lr] rotate-180">
              AI Study Assistant
            </span>
            <ChevronLeftIcon className="size-4" />
          </button>
        </div>
      ) : (
        /* Full Screen-Fixed Right Side Panel with Dynamic Theme */
        <div 
          className="fixed top-0 bottom-0 right-0 h-screen max-h-screen z-[99999] bg-base-100 text-base-content shadow-2xl border-l border-base-300 flex flex-col transition-all duration-75"
          style={{ width: `${sidebarWidth}px`, maxWidth: '94vw' }}
        >
          {/* Dynamic Drag Handle on Left Edge */}
          <div
            onMouseDown={handleResizeStart}
            onDoubleClick={resetWidth}
            className="absolute -left-1.5 inset-y-0 w-3 cursor-ew-resize z-50 hover:bg-primary/40 group flex items-center justify-center transition-all"
            title="Drag left edge to dynamically change panel width • Double-click to reset"
          >
            <GripVerticalIcon className="size-3.5 text-base-content/40 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Header Bar */}
          <div className="px-4 py-3 border-b border-base-300 flex items-center justify-between bg-base-200/90 shrink-0 select-none relative">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative p-1.5 rounded-lg bg-secondary/15 text-secondary shrink-0">
                <BotIcon className="size-5" />
                <span className="absolute -top-0.5 -right-0.5 size-2 bg-success rounded-full ring-2 ring-base-200"></span>
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs flex items-center gap-1.5 leading-tight truncate">
                  <span className="truncate">{note?.title || 'AI Assistant'}</span>
                  <span className="badge badge-xs badge-secondary text-[9px] capitalize shrink-0">{activeTheme}</span>
                </h3>
                <p className="text-[10px] text-base-content/60 truncate">Dynamic Theme & Side Panel</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-0.5 shrink-0">
              {/* Dynamic Theme Picker Button */}
              <div className="relative">
                <button
                  onClick={() => setShowThemePicker(!showThemePicker)}
                  className="btn btn-ghost btn-xs btn-square hover:bg-base-300 text-secondary"
                  title="Change AI Chat Theme"
                >
                  <PaletteIcon className="size-4" />
                </button>

                {/* Theme Selector Dropdown */}
                {showThemePicker && (
                  <div className="absolute right-0 top-8 z-50 w-48 bg-base-100 border border-base-300 rounded-xl shadow-2xl p-1.5 space-y-1 text-xs">
                    <div className="px-2 py-1 font-bold text-[11px] text-base-content/50 uppercase tracking-wider border-b border-base-200">
                      Select Theme
                    </div>
                    <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5">
                      {themeOptions.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleThemeChange(t.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                            chatTheme === t.id ? 'bg-primary text-primary-content font-bold' : 'hover:bg-base-200'
                          }`}
                        >
                          <span>{t.label}</span>
                          {chatTheme === t.id && <CheckIcon className="size-3" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={resetWidth} 
                className="btn btn-ghost btn-xs btn-square hover:bg-base-300" 
                title="Reset Sidebar Width"
              >
                <RefreshCwIcon className="size-3.5 text-base-content/60" />
              </button>

              <button 
                onClick={toggleWideMode} 
                className="btn btn-ghost btn-xs btn-square hover:bg-base-300" 
                title={isWide ? "Standard Width" : "Widen Panel"}
              >
                {isWide ? <Minimize2Icon className="size-3.5 text-base-content/60" /> : <Maximize2Icon className="size-3.5 text-base-content/60" />}
              </button>

              <button 
                onClick={handleClear} 
                className="btn btn-ghost btn-xs btn-square hover:bg-base-300" 
                title="Clear Chat History"
              >
                <Trash2Icon className="size-3.5 text-base-content/60" />
              </button>

              <button 
                onClick={() => setIsCollapsed(true)} 
                className="btn btn-ghost btn-xs btn-square hover:bg-base-300" 
                title="Collapse Panel"
              >
                <ChevronRightIcon className="size-4 text-base-content/60" />
              </button>

              <button 
                onClick={onClose} 
                className="btn btn-ghost btn-xs btn-square hover:bg-error/20 hover:text-error" 
                title="Close Side Panel"
              >
                <XIcon className="size-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompt Pills */}
          <div className="px-3.5 py-2 bg-base-200/40 border-b border-base-300/60 overflow-x-auto whitespace-nowrap custom-scrollbar flex gap-1.5 shrink-0">
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
                className="btn btn-xs btn-outline btn-secondary rounded-full font-normal shrink-0 flex items-center gap-1 hover:scale-105 transition-transform"
              >
                <SparklesIcon className="size-3" /> {prompt}
              </button>
            ))}
          </div>

          {/* Scrollable Message Body */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar p-4 space-y-4 relative"
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-content rounded-br-xs shadow-sm font-medium'
                      : 'bg-base-200 border border-base-300 rounded-bl-xs text-base-content'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Document Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-base-300/50 flex flex-wrap items-center gap-1 text-[10px] text-base-content/70">
                      <span className="font-semibold text-[9px] uppercase tracking-wider text-base-content/50 flex items-center gap-1">
                        <BookOpenIcon className="size-3" /> Sources:
                      </span>
                      {msg.citations.map((c, cIdx) => (
                        <span key={cIdx} className="badge badge-xs badge-neutral gap-0.5 cursor-pointer hover:badge-primary text-[9px]" title={c.text}>
                          Page {c.page}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assistant Toolbar */}
                {msg.role === 'assistant' && i > 0 && (
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-base-content/40 pl-1">
                    <button 
                      onClick={() => handleCopy(msg.text, i)} 
                      className="hover:text-primary flex items-center gap-0.5" 
                      title="Copy Response"
                    >
                      {copiedIndex === i ? <CheckIcon className="size-3 text-success" /> : <CopyIcon className="size-3" />}
                      {copiedIndex === i ? 'Copied' : 'Copy'}
                    </button>
                    <span>•</span>
                    <button onClick={handleRegenerate} className="hover:text-primary flex items-center gap-0.5" title="Regenerate">
                      <RotateCcwIcon className="size-3" /> Regenerate
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Thinking Indicator */}
            {loading && (
              <div className="flex items-start gap-2">
                <div className="bg-base-200 border border-base-300 rounded-2xl rounded-bl-xs px-4 py-3 flex items-center gap-2 text-xs text-base-content/60">
                  <span className="loading loading-dots loading-sm text-secondary"></span>
                  <span className="text-[11px]">Thinking & searching document context...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />

            {/* Scroll-To-Bottom Floating Button */}
            {showScrollBottom && (
              <button
                onClick={scrollToBottom}
                className="sticky bottom-2 left-1/2 -translate-x-1/2 btn btn-circle btn-sm btn-primary shadow-lg flex items-center justify-center transition-all animate-bounce z-30"
                title="Scroll to latest message"
              >
                <ArrowDownIcon className="size-4" />
              </button>
            )}
          </div>

          {/* Footer Input Bar */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
            className="p-3 border-t border-base-300 bg-base-100 flex items-center gap-2 shrink-0"
          >
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`btn btn-circle btn-sm btn-ghost ${isVoiceActive ? 'text-error animate-pulse bg-error/10' : 'text-base-content/60'}`}
              title={isVoiceActive ? "Listening... (Click to stop)" : "Voice Dictation"}
            >
              <MicIcon className="size-4" />
            </button>

            <input
              type="text"
              placeholder={isVoiceActive ? "Listening..." : "Ask a question about this document..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="input input-sm input-bordered flex-1 bg-base-200 text-xs focus:input-primary rounded-full px-4"
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn btn-sm btn-primary btn-circle shrink-0"
            >
              <SendIcon className="size-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
};

export default PrivateAiChatDrawer;
