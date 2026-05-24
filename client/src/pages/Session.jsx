import React, { useState, useEffect, useRef } from 'react';
import ChatBubble from '../components/ChatBubble';
import QuizPanel from '../components/QuizPanel';
import { Send, LogOut, CheckSquare, Sparkles } from 'lucide-react';

export default function Session({
  activeSession,
  messages,
  isLoading,
  error,
  memoryBlock,
  onSendMessage,
  onEndSession,
  onGoHome
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    onSendMessage(input.trim());
    setInput('');
  };

  const handleQuizMe = () => {
    if (isLoading) return;
    onSendMessage("I'm ready for a quiz! Please test my understanding of the current topic.");
  };

  const handleEnd = async () => {
    if (window.confirm("Are you sure you want to end this session? Your progress will be summarized and saved.")) {
      await onEndSession();
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col relative">
      {/* Dynamic Glow Blobs */}
      <div className="absolute top-10 right-10 w-[200px] h-[200px] bg-brand-purple/5 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-[200px] h-[200px] bg-brand-pink/5 rounded-full blur-3xl" />

      {/* Header */}
      <header className="glass-panel border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-indigo flex items-center justify-center text-white shadow-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-wide">
              Session: {activeSession?.subject || 'Tutor Chat'}
            </h2>
            <p className="text-[11px] text-white/50 font-semibold tracking-wider uppercase">
              Level: {activeSession?.level || 'Beginner'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleQuizMe}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-brand-purple/20 bg-brand-purple/5 hover:bg-brand-purple/15 text-xs font-bold text-purple-300 tracking-wide transition-all duration-200 disabled:opacity-50"
          >
            <CheckSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Quiz Me</span>
          </button>
          
          <button
            onClick={handleEnd}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 text-xs font-bold text-rose-400 tracking-wide transition-all duration-200 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">End Session</span>
          </button>
        </div>
      </header>

      {/* Main Chat Thread Area */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-4xl w-full mx-auto flex flex-col">
        {/* Memory alert box (shows what AI remembers) */}
        {memoryBlock && messages.length <= 2 && (
          <div className="mb-6 p-4 rounded-2xl glass-panel-light border border-white/5 text-xs text-white/40 leading-relaxed font-medium">
            <span className="text-white/60 font-semibold block mb-1">🧠 Tutor Memory Block Injected:</span>
            {memoryBlock}
          </div>
        )}

        {/* Render Conversation List */}
        <div className="flex-1">
          {messages.map((msg, index) => {
            const hasQuiz = msg.role === 'assistant' && msg.content.includes('QUIZ_RESULT:');
            
            return (
              <React.Fragment key={index}>
                <ChatBubble role={msg.role} content={msg.content} />
                {hasQuiz && <QuizPanel rawQuizResult={msg.content} />}
              </React.Fragment>
            );
          })}

          {/* AI Typing Indicator */}
          {isLoading && (
            <div className="flex w-full gap-3 my-4 justify-start items-start animate-pulse">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-slate-700">
                <Sparkles className="h-4 w-4 text-brand-purple" />
              </div>
              <div className="glass-panel rounded-2xl rounded-tl-none px-5 py-4 border border-white/5 flex gap-1.5 items-center justify-center h-[46px]">
                <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {error && (
            <div className="my-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-300 text-center">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Form at Bottom */}
      <footer className="p-4 md:p-6 border-t border-white/10 glass-panel sticky bottom-0 z-10">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3 relative">
          <input
            type="text"
            placeholder={isLoading ? "Tutor is thinking..." : "Type your answer, or ask a question..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-5 py-4 rounded-2xl bg-slate-900 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple disabled:opacity-50 transition-all duration-200 pr-14 text-sm md:text-base shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-indigo text-white hover:from-brand-indigo hover:to-brand-purple transition-all duration-200 disabled:opacity-50 disabled:from-slate-800 disabled:to-slate-800"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </footer>
    </div>
  );
}
