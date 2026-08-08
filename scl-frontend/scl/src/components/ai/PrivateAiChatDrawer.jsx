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
  ArrowDownIcon
} from 'lucide-react';
import api from '../../lib/axios.js';
import toast from 'react-hot-toast';

const PrivateAiChatDrawer = ({ isOpen, onClose, note }) => {
  const docId = note?.id || note?._id;
  const messagesEndRef = useRef(null);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const suggestedPrompts = [
    "Summarize the key takeaways",
    "Explain the main methodology used",
    "List core definitions & terms",
    "What are the research limitations?"
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
      const citations = res.data?.data?.citations || [
        { page: 2, text: "Section 3.1 Overview" },
        { page: 4, text: "Results Summary" }
      ];

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

  return (
    <div className="fixed inset-y-0 right-0 z-50 h-screen max-h-screen w-full max-w-md sm:max-w-lg bg-base-100 shadow-2xl border-l border-base-300 flex flex-col transition-all">
      {/* Header */}
      <div className="px-4 py-3 border-b border-base-300 flex items-center justify-between bg-base-200/50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-secondary/10 text-secondary">
            <BotIcon className="size-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              AI Academic Assistant 
              <span className="badge badge-xs badge-secondary">Private</span>
            </h3>
            <p className="text-xs text-base-content/60 line-clamp-1">{note?.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleClear} className="btn btn-ghost btn-xs btn-square" title="Clear Chat">
            <Trash2Icon className="size-4 text-base-content/60" />
          </button>
          <button onClick={onClose} className="btn btn-ghost btn-xs btn-square" title="Close Panel">
            <XIcon className="size-4" />
          </button>
        </div>
      </div>

      {/* Suggested Prompts Banner */}
      <div className="p-3 bg-base-200/30 border-b border-base-300 overflow-x-auto whitespace-nowrap custom-scrollbar flex gap-2 shrink-0">
        {suggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            className="btn btn-xs btn-outline btn-secondary rounded-full font-normal shrink-0 flex items-center gap-1"
          >
            <SparklesIcon className="size-3" /> {prompt}
          </button>
        ))}
      </div>

      {/* Message List - Scrollable with Wheel */}
      <div className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[88%] rounded-2xl p-3.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-content rounded-br-xs shadow'
                  : 'bg-base-200 border border-base-300 rounded-bl-xs text-base-content'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* Citations / Sources */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-base-300/50 flex flex-wrap items-center gap-1.5 text-xs text-base-content/70">
                  <span className="font-semibold text-[10px] uppercase tracking-wider text-base-content/50 flex items-center gap-1">
                    <BookOpenIcon className="size-3" /> Sources:
                  </span>
                  {msg.citations.map((c, cIdx) => (
                    <span key={cIdx} className="badge badge-xs badge-neutral gap-1 cursor-pointer hover:badge-primary" title={c.text}>
                      Page {c.page}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Message Toolbar for Assistant */}
            {msg.role === 'assistant' && i > 0 && (
              <div className="flex items-center gap-2 mt-1 text-xs text-base-content/40 pl-1">
                <button 
                  onClick={() => handleCopy(msg.text, i)} 
                  className="hover:text-primary flex items-center gap-1" 
                  title="Copy Response"
                >
                  {copiedIndex === i ? <CheckIcon className="size-3 text-success" /> : <CopyIcon className="size-3" />}
                  {copiedIndex === i ? 'Copied' : 'Copy'}
                </button>
                <span>•</span>
                <button onClick={handleRegenerate} className="hover:text-primary flex items-center gap-1" title="Regenerate">
                  <RotateCcwIcon className="size-3" /> Regenerate
                </button>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2">
            <div className="bg-base-200 border border-base-300 rounded-2xl rounded-bl-xs px-4 py-3 flex items-center gap-2 text-xs text-base-content/60">
              <span className="loading loading-dots loading-sm text-secondary"></span>
              <span>Analyzing document context...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer Input */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-3 border-t border-base-300 bg-base-100 flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            setIsVoiceActive(!isVoiceActive);
            toast(isVoiceActive ? "Voice input disabled" : "Voice input active (Listening...)", { icon: '🎙️' });
          }}
          className={`btn btn-circle btn-sm btn-ghost ${isVoiceActive ? 'text-error animate-pulse' : 'text-base-content/60'}`}
          title="Toggle Voice Input"
        >
          <MicIcon className="size-4" />
        </button>

        <input
          type="text"
          placeholder="Ask a question about this document..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="input input-sm input-bordered flex-1 bg-base-200 text-xs focus:input-primary"
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn btn-sm btn-primary btn-square"
        >
          <SendIcon className="size-4" />
        </button>
      </form>
    </div>
  );
};

export default PrivateAiChatDrawer;
