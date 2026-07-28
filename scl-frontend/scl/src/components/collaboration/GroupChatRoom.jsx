import React, { useState, useRef, useEffect } from 'react';
import { useGroupChat } from '../../hooks/useGroupChat';
import { Send, Bot, User, Sparkles, CheckCircle2, Clock } from 'lucide-react';

export default function GroupChatRoom({ roomId, groupName }) {
  const { messages, loading, connected, sendMessage } = useGroupChat(roomId);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleAiPromptClick = (promptText) => {
    setInputText(`@AI ${promptText}`);
  };

  return (
    <div className="flex flex-col h-[650px] bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
            {groupName ? groupName.charAt(0).toUpperCase() : 'G'}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white tracking-wide">{groupName} Chat</h3>
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-slate-400">{connected ? 'Live STOMP Connected' : 'Connecting...'}</span>
            </div>
          </div>
        </div>

        {/* Quick AI Trigger Chip */}
        <button
          onClick={() => handleAiPromptClick('Summarize key topics for this study group')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 text-purple-300 hover:from-purple-500/30 hover:to-indigo-500/30 transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Ask @AI</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400 gap-2">
            <span className="loading loading-spinner loading-md text-indigo-400" />
            <span>Loading chat messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-6 space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400">
              <Bot className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="font-medium text-slate-300">No messages in this chat room yet</p>
            <p className="text-xs max-w-sm">Type a message below or use <code className="text-purple-400 font-bold">@AI &lt;question&gt;</code> to ask the AI assistant directly inside the room!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isAi = msg.sender?.email === 'ai.bot@scl.edu' || msg.sender?.fullName === 'AI Assistant';
            const senderName = msg.sender?.fullName || 'User';

            return (
              <div
                key={msg.id || idx}
                className={`flex gap-3 max-w-[85%] ${isAi ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md ${
                    isAi
                      ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 border border-purple-400/40'
                      : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {isAi ? <Sparkles className="w-4 h-4 text-purple-200" /> : senderName.charAt(0).toUpperCase()}
                </div>

                <div className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-300">{senderName}</span>
                    {isAi && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                        AI BOT
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-md ${
                      isAi
                        ? 'bg-purple-950/40 border border-purple-500/30 text-purple-100 rounded-tl-none'
                        : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-tr-none'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      <div className="px-6 py-2 bg-slate-950/40 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-slate-500 shrink-0 font-medium">Quick Prompts:</span>
        <button
          onClick={() => handleAiPromptClick('Explain Normalization in DBMS')}
          className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 shrink-0 transition"
        >
          @AI Normalization
        </button>
        <button
          onClick={() => handleAiPromptClick('Give me key formulas for this topic')}
          className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 shrink-0 transition"
        >
          @AI Key Formulas
        </button>
        <button
          onClick={() => handleAiPromptClick('Generate 3 practice questions')}
          className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 shrink-0 transition"
        >
          @AI Quiz Questions
        </button>
      </div>

      {/* Message Input Bar */}
      <form onSubmit={handleSend} className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center gap-3">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message or @AI question..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-lg transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
