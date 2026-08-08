import { useState } from 'react';
import { BotIcon, SendIcon, SparklesIcon, BookOpenIcon, UsersIcon, CopyIcon, CheckIcon } from 'lucide-react';
import api from '../../lib/axios.js';
import toast from 'react-hot-toast';

const SharedAiTab = ({ documentId, title }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const followUpSuggestions = [
    "Explain Vector Clocks in detail",
    "How does Fault Tolerance compare to Paxos?",
    "Summarize page 14 formulas"
  ];

  const handleAskSharedAi = async (questionText) => {
    const question = (questionText || input).trim();
    if (!question) return;

    setInput('');
    setLoading(true);

    try {
      // Use the workspace endpoint — it queries the main document
      // AND all collaborator-uploaded shared resources in one call
      const res = await api.post('/ai/chat/workspace', {
        question,
        documentId
      });

      const answer = res.data?.data?.answer || res.data?.answer || "AI response generated for group.";
      const citations = res.data?.data?.citations || [];

      const newMsg = {
        id: Date.now(),
        askedBy: 'You',
        question,
        answer,
        citations,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, newMsg]);
    } catch (err) {
      console.error("Shared AI error:", err);
      toast.error(err.response?.data?.message || "Failed to query Shared AI Assistant");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-base-100 p-4 space-y-4 overflow-y-auto custom-scrollbar scroll-smooth">
      {/* Header Banner */}
      <div className="bg-secondary/10 border border-secondary/20 p-3 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BotIcon className="size-5 text-secondary" />
          <div>
            <h4 className="font-bold text-xs flex items-center gap-1.5">
              Shared AI Study Assistant 
              <span className="badge badge-xs badge-secondary">Group Visible</span>
            </h4>
            <p className="text-[11px] text-base-content/60">
              Questions and AI answers are synchronized for all collaboration members.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-secondary font-medium">
          <UsersIcon className="size-3.5" /> Shared Mode
        </div>
      </div>

      {/* Suggested Follow-ups */}
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 scrollbar-none">
        <span className="text-[11px] text-base-content/50 shrink-0 font-medium">Suggested:</span>
        {followUpSuggestions.map((sug, i) => (
          <button
            key={i}
            onClick={() => handleAskSharedAi(sug)}
            disabled={loading}
            className="btn btn-xs btn-outline btn-secondary rounded-full font-normal shrink-0 gap-1"
          >
            <SparklesIcon className="size-3" /> {sug}
          </button>
        ))}
      </div>

      {/* Synchronized Q&A List */}
      <div className="space-y-4 flex-1">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div className="p-4 rounded-2xl bg-secondary/10 text-secondary">
              <BotIcon className="size-8" />
            </div>
            <div>
              <p className="font-semibold text-sm text-base-content">No questions yet</p>
              <p className="text-xs text-base-content/50 mt-1 max-w-xs">
                Ask a question below — the AI will search the main document
                and all files shared by collaborators.
              </p>
            </div>
          </div>
        )}
        {messages.map((item) => (
          <div key={item.id} className="bg-base-200/50 rounded-xl p-4 border border-base-300 space-y-3">
            {/* Question Header */}
            <div className="flex items-center justify-between border-b border-base-300/60 pb-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-primary">{item.askedBy}</span>
                <span className="text-base-content/50">asked:</span>
                <span className="font-medium text-base-content">{item.question}</span>
              </div>
              <span className="text-[10px] text-base-content/40">{item.timestamp}</span>
            </div>

            {/* Answer Content */}
            <div className="text-xs text-base-content/90 leading-relaxed bg-base-100 p-3 rounded-lg border border-base-300">
              <p className="whitespace-pre-wrap">{item.answer}</p>

              {/* Citations */}
              {item.citations && item.citations.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-base-300 flex items-center gap-2 text-[11px] text-base-content/60">
                  <BookOpenIcon className="size-3 text-secondary" />
                  <span className="font-medium">Sources:</span>
                  {item.citations.map((c, idx) => (
                    <span key={idx} className="badge badge-xs badge-neutral">Page {c.page}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Action controls */}
            <div className="flex justify-end text-[11px] text-base-content/50">
              <button 
                onClick={() => handleCopy(item.answer, item.id)} 
                className="hover:text-primary flex items-center gap-1"
              >
                {copiedId === item.id ? <CheckIcon className="size-3 text-success" /> : <CopyIcon className="size-3" />}
                {copiedId === item.id ? 'Copied' : 'Copy Answer'}
              </button>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center justify-center p-6 text-xs text-base-content/60 gap-2">
            <span className="loading loading-spinner loading-sm text-secondary"></span>
            <span>Querying grounded knowledge base for group...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form onSubmit={(e) => { e.preventDefault(); handleAskSharedAi(); }} className="p-2 border-t border-base-300 flex gap-2">
        <input
          type="text"
          placeholder="Ask a question for the group to view..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="input input-sm input-bordered flex-1 bg-base-100 text-xs focus:input-secondary"
        />
        <button type="submit" disabled={loading || !input.trim()} className="btn btn-sm btn-secondary gap-1">
          <SendIcon className="size-4" /> Ask Shared AI
        </button>
      </form>
    </div>
  );
};

export default SharedAiTab;
