import React from 'react';
import { Award, AlertTriangle, RefreshCw } from 'lucide-react';

export default function QuizPanel({ rawQuizResult }) {
  if (!rawQuizResult) return null;

  // Extract JSON string from QUIZ_RESULT: {...}
  const match = rawQuizResult.match(/QUIZ_RESULT:\s*(\{.*?\})/s);
  if (!match) return null;

  let scoreStr = '0/0';
  let weakAreas = [];

  try {
    const resultObj = JSON.parse(match[1]);
    scoreStr = resultObj.score || '0/0';
    weakAreas = resultObj.weak_areas || [];
  } catch (err) {
    console.error('QuizPanel error parsing JSON:', err);
    return null;
  }

  const [correct, total] = scoreStr.split('/').map(Number);
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Curate color schemes based on performance
  let colorClass = 'from-emerald-500 to-teal-500 text-emerald-400';
  let ratingText = 'Excellent job! You have mastered this!';
  if (percentage < 50) {
    colorClass = 'from-rose-500 to-orange-500 text-rose-400';
    ratingText = 'Keep studying, mistakes are steps to learning.';
  } else if (percentage < 85) {
    colorClass = 'from-amber-500 to-orange-500 text-amber-400';
    ratingText = 'Good effort! Let\'s review the weak spots.';
  }

  return (
    <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden my-6 p-6 animate-fade-in relative">
      {/* Glow highlight */}
      <div className="absolute -top-16 -left-16 w-32 h-32 bg-brand-purple/20 rounded-full blur-2xl" />
      <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-brand-pink/20 rounded-full blur-2xl" />

      <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Side: Score & Trophy */}
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]} text-white shadow-lg`}>
            <Award className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">Quiz Completed!</h3>
            <p className="text-xs text-white/50">{ratingText}</p>
          </div>
        </div>

        {/* Middle Side: Score Number */}
        <div className="flex items-center gap-2">
          <div className="text-center">
            <span className="text-4xl font-extrabold text-white tracking-tight">{correct}</span>
            <span className="text-xl text-white/40 font-semibold"> / {total}</span>
            <p className="text-[10px] text-white/40 tracking-wider uppercase mt-1">Total Score</p>
          </div>
          <div className="h-10 w-px bg-white/10 mx-4 hidden md:block" />
          <div className="text-center hidden md:block">
            <span className={`text-2xl font-bold ${colorClass.split(' ')[2]}`}>{percentage}%</span>
            <p className="text-[10px] text-white/40 tracking-wider uppercase mt-1">Accuracy</p>
          </div>
        </div>
      </div>

      {/* Weak Areas Section */}
      {weakAreas.length > 0 && (
        <div className="mt-6 pt-5 border-t border-white/5">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-400 mb-3">
            <AlertTriangle className="h-4 w-4" />
            <span>Topics flagged for review:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {weakAreas.map((area, idx) => (
              <span 
                key={idx} 
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
