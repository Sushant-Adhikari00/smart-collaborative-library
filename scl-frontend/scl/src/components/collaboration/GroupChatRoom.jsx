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
    <div className="flex flex-col h-[650px] bg-base-100 border border-base-300 rounded-2xl shadow-2xl overflow-hidden text-base-content">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-base-300 bg-base-200/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-primary-content font-bold shadow-lg">
            {groupName ? groupName.charAt(0).toUpperCase() : 'G'}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-base-content tracking-wide">{groupName} Chat</h3>
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-success animate-pulse' : 'bg-error'}`} />
              <span className="text-base-content/60">{connected ? 'Live STOMP Connected' : 'Connecting...'}</span>
            </div>
          </div>
        </div>

        {/* Quick AI Trigger Chip */}
        <button
          onClick={() => handleAiPromptClick('Summarize key topics for this study group')}
          className="btn btn-xs btn-outline btn-secondary rounded-full flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask @AI</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-base-content/60 gap-2">
            <span className="loading loading-spinner loading-md text-primary" />
            <span>Loading chat messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-base-content/50 p-6 space-y-3">
            <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center text-base-content/70">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <p className="font-medium text-base-content/85">No messages in this chat room yet</p>
            <p className="text-xs max-w-sm">Type a message below or use <code className="text-secondary font-bold">@AI &lt;question&gt;</code> to ask the AI assistant directly inside the room!</p>
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
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-primary-content text-xs font-bold shrink-0 shadow-md ${
                    isAi
                      ? 'bg-gradient-to-tr from-secondary to-primary border border-secondary/40'
                      : 'bg-base-300 text-base-content'
                  }`}
                >
                  {isAi ? <Sparkles className="w-4 h-4 text-secondary-content" /> : senderName.charAt(0).toUpperCase()}
                </div>

                <div className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-base-content/80">{senderName}</span>
                    {isAi && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary/15 text-secondary font-mono border border-secondary/30">
                        AI BOT
                      </span>
                    )}
                    <span className="text-[10px] text-base-content/40">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-md ${
                      isAi
                        ? 'bg-secondary/10 border border-secondary/20 text-base-content rounded-tl-none'
                        : 'bg-primary text-primary-content rounded-tr-none'
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
      <div className="px-6 py-2 bg-base-200/50 border-t border-base-300 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
        <span className="text-base-content/50 shrink-0 font-medium">Quick Prompts:</span>
        <button
          onClick={() => handleAiPromptClick('Explain Normalization in DBMS')}
          className="btn btn-xs btn-outline btn-neutral rounded-lg shrink-0 font-normal"
        >
          @AI Normalization
        </button>
        <button
          onClick={() => handleAiPromptClick('Give me key formulas for this topic')}
          className="btn btn-xs btn-outline btn-neutral rounded-lg shrink-0 font-normal"
        >
          @AI Key Formulas
        </button>
        <button
          onClick={() => handleAiPromptClick('Generate 3 practice questions')}
          className="btn btn-xs btn-outline btn-neutral rounded-lg shrink-0 font-normal"
        >
          @AI Quiz Questions
        </button>
      </div>

      {/* Message Input Bar */}
      <form onSubmit={handleSend} className="p-4 bg-base-200/60 border-t border-base-300 flex items-center gap-3">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message or @AI question..."
          className="flex-1 input input-bordered bg-base-100 text-sm focus:input-primary"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="btn btn-primary btn-square"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
