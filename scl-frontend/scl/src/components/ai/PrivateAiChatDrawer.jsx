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
  MinusIcon,
  Maximize2Icon,
  Minimize2Icon,
  ArrowDownIcon,
  GripHorizontalIcon,
  MaximizeIcon,
  RefreshCwIcon
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
  const [isMinimized, setIsMinimized] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Dynamic Window Sizing & Position State
  const [dimensions, setDimensions] = useState({ width: 420, height: 640 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 }); // Offset from bottom right
  const isResizingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, initialW: 0, initialH: 0, posX: 0, posY: 0 });

  // Web Speech Recognition setup
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!isMinimized) {
      scrollToBottom();
    }
  }, [messages, loading, isMinimized]);

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
    `Summarize "${note?.title?.slice(0, 20) || 'document'}"`,
    "Explain key methodology",
    "List core definitions & terms",
    "What are main limitations?"
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

  // --- Dynamic Drag-to-Resize Logic ---
  const handleResizeStart = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialW: dimensions.width,
      initialH: dimensions.height
    };

    const handleMouseMove = (moveEvent) => {
      if (!isResizingRef.current) return;
      const deltaX = dragStartRef.current.startX - moveEvent.clientX; // Left drag increases width
      const deltaY = dragStartRef.current.startY - moveEvent.clientY; // Top drag increases height

      setDimensions({
        width: Math.min(Math.max(dragStartRef.current.initialW + deltaX, 320), 800),
        height: Math.min(Math.max(dragStartRef.current.initialH + deltaY, 350), window.innerHeight - 40)
      });
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // --- Dynamic Drag-to-Move Header Logic ---
  const handleHeaderDragStart = (e) => {
    if (e.target.closest('button')) return; // Ignore buttons
    isDraggingRef.current = true;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y
    };

    const handleMouseMove = (moveEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = moveEvent.clientX - dragStartRef.current.startX;
      const deltaY = moveEvent.clientY - dragStartRef.current.startY;

      setPosition({
        x: dragStartRef.current.posX + deltaX,
        y: dragStartRef.current.posY + deltaY
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const resetPositionAndSize = () => {
    setPosition({ x: 0, y: 0 });
    setDimensions({ width: 420, height: 640 });
    setIsMaximized(false);
    toast.success("Chat position and size reset!");
  };

  // Render directly to document.body via React Portal
  const content = (
    <div className="font-sans">
      {/* Minimized Bottom Facebook Chat Dock */}
      {isMinimized ? (
        <div 
          className="fixed bottom-0 right-4 sm:right-8 z-[99999] animate-bounce-short"
          style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        >
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
      ) : (
        /* Full Dynamic Resizable & Draggable Chat Window */
        <div 
          className={`fixed bottom-0 right-3 sm:right-6 z-[99999] bg-base-100 shadow-2xl border-t border-x border-base-300 rounded-t-2xl flex flex-col transition-all duration-75 ${
            isMaximized ? 'w-[96vw] h-[94vh] bottom-2 right-2 rounded-2xl' : ''
          }`}
          style={
            !isMaximized 
              ? { 
                  width: `${dimensions.width}px`, 
                  height: `${dimensions.height}px`,
                  maxWidth: '96vw',
                  maxHeight: '94vh',
                  transform: `translate(${position.x}px, ${position.y}px)` 
                } 
              : {}
          }
        >
          {/* Dynamic Top-Left Corner Resize Handle */}
          {!isMaximized && (
            <div
              onMouseDown={(e) => handleResizeStart(e, 'corner')}
              className="absolute -top-2 -left-2 size-5 cursor-nwse-resize z-50 flex items-center justify-center text-primary/60 hover:text-primary hover:scale-125 transition-all"
              title="Drag corner to dynamically resize width & height"
            >
              <GripHorizontalIcon className="size-4 -rotate-45" />
            </div>
          )}

          {/* Dynamic Top Edge Height Resize Handle */}
          {!isMaximized && (
            <div
              onMouseDown={(e) => handleResizeStart(e, 'top')}
              className="absolute -top-1.5 inset-x-0 h-3 cursor-ns-resize z-40 hover:bg-primary/20 transition-all rounded-t-2xl"
              title="Drag top edge to dynamically change height"
            />
          )}

          {/* Dynamic Left Edge Width Resize Handle */}
          {!isMaximized && (
            <div
              onMouseDown={(e) => handleResizeStart(e, 'left')}
              className="absolute -left-1.5 inset-y-0 w-3 cursor-ew-resize z-40 hover:bg-primary/20 transition-all rounded-l-2xl"
              title="Drag left edge to dynamically change width"
            />
          )}

          {/* Draggable Facebook-style Header Bar */}
          <div 
            onMouseDown={handleHeaderDragStart}
            onDoubleClick={resetPositionAndSize}
            className="px-4 py-2.5 border-b border-base-300 flex items-center justify-between bg-base-200/90 rounded-t-2xl shrink-0 select-none cursor-move hover:bg-base-200"
            title="Drag header to move floating window • Double-click to reset"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative p-1.5 rounded-lg bg-secondary/15 text-secondary shrink-0">
                <BotIcon className="size-4" />
                <span className="absolute -top-0.5 -right-0.5 size-2 bg-success rounded-full ring-2 ring-base-200"></span>
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs flex items-center gap-1.5 leading-tight truncate">
                  <span className="truncate">{note?.title || 'AI Assistant'}</span>
                  <span className="badge badge-xs badge-secondary text-[9px] shrink-0">Dynamic</span>
                </h3>
                <p className="text-[10px] text-base-content/60 truncate">Draggable & Resizable Dock</p>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button 
                onClick={resetPositionAndSize} 
                className="btn btn-ghost btn-xs btn-square hover:bg-base-300" 
                title="Reset Size & Position"
              >
                <RefreshCwIcon className="size-3 text-base-content/60" />
              </button>

              <button 
                onClick={handleClear} 
                className="btn btn-ghost btn-xs btn-square hover:bg-base-300" 
                title="Clear Chat History"
              >
                <Trash2Icon className="size-3.5 text-base-content/60" />
              </button>

              <button 
                onClick={() => setIsMaximized(!isMaximized)} 
                className="btn btn-ghost btn-xs btn-square hover:bg-base-300" 
                title={isMaximized ? "Restore Size" : "Maximize Fullscreen"}
              >
                {isMaximized ? <Minimize2Icon className="size-3.5 text-base-content/60" /> : <MaximizeIcon className="size-3.5 text-base-content/60" />}
              </button>

              <button 
                onClick={() => setIsMinimized(true)} 
                className="btn btn-ghost btn-xs btn-square hover:bg-base-300" 
                title="Minimize to Screen Dock"
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

          {/* Dynamic Quick Prompt Pills Bar */}
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

          {/* Scrollable Message History Area */}
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

                  {/* Dynamic Document Citations */}
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

                {/* Assistant Message Actions */}
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

            {/* Dynamic Thinking State */}
            {loading && (
              <div className="flex items-start gap-2">
                <div className="bg-base-200 border border-base-300 rounded-2xl rounded-bl-xs px-3.5 py-2.5 flex items-center gap-2 text-xs text-base-content/60">
                  <span className="loading loading-dots loading-xs text-secondary"></span>
                  <span className="text-[11px]">Thinking & searching document context...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />

            {/* Dynamic Scroll-To-Bottom Floating Button */}
            {showScrollBottom && (
              <button
                onClick={scrollToBottom}
                className="sticky bottom-2 left-1/2 -translate-x-1/2 btn btn-circle btn-xs btn-primary shadow-lg flex items-center justify-center transition-all animate-bounce z-30"
                title="Scroll to latest message"
              >
                <ArrowDownIcon className="size-3" />
              </button>
            )}
          </div>

          {/* Facebook-style Input Footer with Dynamic Dictation */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
            className="p-2.5 border-t border-base-300 bg-base-100 rounded-b-2xl flex items-center gap-1.5 shrink-0"
          >
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`btn btn-circle btn-xs btn-ghost ${isVoiceActive ? 'text-error animate-pulse bg-error/10' : 'text-base-content/60'}`}
              title={isVoiceActive ? "Listening... (Click to stop)" : "Voice Dictation"}
            >
              <MicIcon className="size-3.5" />
            </button>

            <input
              type="text"
              placeholder={isVoiceActive ? "Listening to your voice..." : "Type a message..."}
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
      )}
    </div>
  );

  return createPortal(content, document.body);
};

export default PrivateAiChatDrawer;
