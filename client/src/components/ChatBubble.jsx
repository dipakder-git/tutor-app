import React from 'react';
import { User, Sparkles } from 'lucide-react';

/**
 * Custom light markdown parser that converts standard markdown to React elements.
 * Supports bold (**), inline code (`), multi-line code blocks (```), bullet points (-), and line breaks.
 */
function renderMarkdown(text) {
  if (!text) return null;

  // Split by code blocks
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    // Check if this part is a code block
    if (part.startsWith('```') && part.endsWith('```')) {
      const match = part.match(/```(\w*)\n([\s\S]*?)```/);
      const language = match ? match[1] : '';
      const codeContent = match ? match[2] : part.slice(3, -3);

      return (
        <div key={index} className="my-3 overflow-hidden rounded-lg border border-white/10">
          {language && (
            <div className="bg-black/50 px-4 py-1.5 text-xs font-medium text-white/50 border-b border-white/5 flex justify-between items-center">
              <span>{language.toUpperCase()}</span>
              <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">CODE</span>
            </div>
          )}
          <pre className="bg-black/40 p-4 overflow-x-auto text-sm text-cyan-300 font-mono leading-relaxed">
            <code>{codeContent.trim()}</code>
          </pre>
        </div>
      );
    }

    // Process inline markdown (bold, inline code, links, bullet lists, newlines)
    const lines = part.split('\n');
    return (
      <div key={index} className="space-y-2">
        {lines.map((line, lineIdx) => {
          let cleanLine = line.trim();

          // Handle bullet lists
          if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
            return (
              <ul key={lineIdx} className="list-disc pl-5 my-1 text-white/90">
                <li>{parseInlineElements(cleanLine.substring(2))}</li>
              </ul>
            );
          }

          // Handle numbered lists
          const numMatch = cleanLine.match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            return (
              <ol key={lineIdx} className="list-decimal pl-5 my-1 text-white/90" start={parseInt(numMatch[1], 10)}>
                <li>{parseInlineElements(numMatch[2])}</li>
              </ol>
            );
          }

          // Empty line
          if (cleanLine === '') {
            return <div key={lineIdx} className="h-2" />;
          }

          // Normal paragraph line
          return <p key={lineIdx} className="leading-relaxed text-white/90">{parseInlineElements(line)}</p>;
        })}
      </div>
    );
  });
}

/**
 * Parses bold tags (**) and inline code (`) into JSX elements
 */
function parseInlineElements(str) {
  // Regex to split by bold ** and inline code `
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const parts = str.split(regex);

  if (parts.length === 1) return str;

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={idx} className="bg-white/10 px-1.5 py-0.5 rounded text-pink-400 font-mono text-sm">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export default function ChatBubble({ role, content }) {
  const isUser = role === 'user';

  // 1. Remove the raw QUIZ_RESULT block from display
  const cleanContent = content.replace(/QUIZ_RESULT:\s*\{[\s\S]*?\}/gs, '').trim();

  // If there's nothing left (e.g. it was just the quiz result tag), don't render bubble
  if (!cleanContent) return null;

  return (
    <div className={`flex w-full gap-3 my-4 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Tutor Icon (Left side) */}
      {!isUser && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-brand-purple to-brand-pink shadow-md glow-purple">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-5 py-3.5 shadow-lg ${
          isUser
            ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white rounded-tr-none border border-white/10'
            : 'glass-panel text-gray-100 rounded-tl-none border-l-2 border-l-brand-purple'
        }`}
      >
        {/* Header Indicator */}
        <div className="mb-1 flex items-center justify-between text-[11px] font-semibold tracking-wider text-white/40 uppercase">
          <span>{isUser ? 'You' : 'AI Tutor'}</span>
        </div>

        {/* Content */}
        <div className="prose-chat text-sm md:text-[15px]">
          {renderMarkdown(cleanContent)}
        </div>
      </div>

      {/* User Icon (Right side) */}
      {isUser && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-slate-700 shadow-md">
          <User className="h-5 w-5 text-indigo-400" />
        </div>
      )}
    </div>
  );
}
