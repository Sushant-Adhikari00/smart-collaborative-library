import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Send, Mic, FileText, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { useChatStore } from "../../store/chatStore";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export function DocumentDetail() {
  const { id } = useParams();
  const [inputText, setInputText] = useState("");
  const { messages, isTyping, sendMessage, clearChat } = useChatStore();
  const chatEndRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Clean up on unmount
  useEffect(() => {
    return () => clearChat();
  }, [clearChat]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText, id);
    setInputText("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
        <div className="flex items-center gap-4">
          <Link to="/documents" className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-display font-bold text-slate-900 line-clamp-1">Machine Learning Lecture 1.pdf</h1>
            <p className="text-xs text-slate-500">Uploaded 2 days ago</p>
          </div>
        </div>
      </div>

      {/* Split View */}
      <div className="flex flex-1 gap-6 overflow-hidden flex-col lg:flex-row">
        
        {/* PDF Viewer Area (Left) */}
        <div className="flex-1 flex flex-col bg-slate-200/50 rounded-2xl border border-slate-200 overflow-hidden relative">
          {/* Toolbar for PDF */}
          <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-medium text-slate-600 w-16 text-center">1 / 24</span>
              <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8"><Maximize2 className="h-4 w-4" /></Button>
          </div>
          
          {/* Mock PDF Canvas Area (to prevent download natively) */}
          <div 
            className="flex-1 overflow-auto flex items-center justify-center p-4 relative select-none"
            onContextMenu={(e) => e.preventDefault()} // Disable right click
          >
            <div className="bg-white shadow-lg w-full max-w-3xl aspect-[1/1.4] rounded flex flex-col items-center justify-center text-slate-400 p-12 text-center border border-slate-200 relative overflow-hidden pointer-events-none">
               {/* overlay to block dragging */}
               <div className="absolute inset-0 z-10"></div>
               <FileText className="h-16 w-16 mb-4 text-slate-300" />
               <p className="font-medium text-slate-600">PDF Canvas Render</p>
               <p className="text-sm">Document is rendered securely. Downloading is disabled.</p>
            </div>
          </div>
        </div>

        {/* AI Chat Area (Right) */}
        <div className="w-full lg:w-96 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm h-[500px] lg:h-auto">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Document Assistant
            </h3>
            <p className="text-xs text-slate-500 mt-1">Ask questions about this document</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center space-y-3">
                <div className="h-12 w-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-500">
                  <Send className="h-6 w-6" />
                </div>
                <p className="text-sm max-w-[200px]">Ask me anything about this document to get started.</p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary-600 text-white rounded-br-none' 
                      : 'bg-slate-100 text-slate-800 rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-100 text-slate-800 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-slate-100 bg-white">
            <form onSubmit={handleSend} className="relative flex items-center gap-2">
              <Button type="button" variant="ghost" size="icon" className="text-slate-400 hover:text-primary-600 shrink-0">
                <Mic className="h-5 w-5" />
              </Button>
              <Input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask a question..."
                className="pr-12 rounded-full bg-slate-50 border-slate-200"
              />
              <Button 
                type="submit" 
                size="icon" 
                className="absolute right-1 top-1 h-8 w-8 rounded-full bg-primary-600 hover:bg-primary-700"
                disabled={!inputText.trim()}
              >
                <Send className="h-4 w-4 text-white" />
              </Button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
