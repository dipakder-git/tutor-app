import React, { useEffect } from 'react';
import ProgressCard from '../components/ProgressCard';
import { Flame, BookOpen, AlertTriangle, ArrowRight, UserMinus, PlusCircle, CheckCircle } from 'lucide-react';

export default function Progress({
  currentUser,
  progressData,
  isLoading,
  error,
  onFetchProgress,
  onStartNewSession,
  onLogout
}) {
  useEffect(() => {
    if (currentUser?.id) {
      onFetchProgress(currentUser.id);
    }
  }, [currentUser, onFetchProgress]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAccuracy = () => {
    let totalNumerator = 0;
    let totalDenominator = 0;
    progressData.sessions.forEach(s => {
      s.quizzes.forEach(q => {
        totalNumerator += q.score_numerator;
        totalDenominator += q.score_denominator;
      });
    });
    return totalDenominator > 0 ? Math.round((totalNumerator / totalDenominator) * 100) : 0;
  };

  const accuracy = getAccuracy();

  return (
    <div className="min-h-screen gradient-bg py-10 px-4 md:px-8 relative">
      {/* Glow Blobs */}
      <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-brand-purple/5 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-brand-pink/5 rounded-full blur-3xl" />

      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight md:text-4xl">
              Progress Dashboard
            </h1>
            <p className="text-sm text-white/50 mt-1 font-medium">
              Welcome back, <span className="text-brand-purple font-semibold">{currentUser?.name}</span>! Track your learning journey.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onLogout}
              className="px-4 py-2 border border-white/10 hover:border-white/20 text-white/60 hover:text-white font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-sm transition-all duration-200 flex items-center gap-1.5"
            >
              <UserMinus className="h-4 w-4" />
              <span>Change User</span>
            </button>
            
            <button
              onClick={onStartNewSession}
              className="px-4 py-2 bg-gradient-to-tr from-brand-purple to-brand-indigo hover:from-brand-indigo hover:to-brand-purple text-white font-semibold rounded-xl shadow-md glow-purple text-sm transition-all duration-200 flex items-center gap-1.5"
            >
              <PlusCircle className="h-4 w-4" />
              <span>New Session</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-300">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <ProgressCard
            title="Study Streak"
            value={`${progressData.streak} Days`}
            subtext={progressData.streak > 0 ? "You're keeping the habit alive! 🔥" : "Start a session to kick off your streak!"}
            icon={Flame}
            colorTheme="pink"
          />
          <ProgressCard
            title="Total Sessions"
            value={progressData.sessions.length}
            subtext="Lessons completed so far 📚"
            icon={BookOpen}
            colorTheme="purple"
          />
          <ProgressCard
            title="Quiz Accuracy"
            value={`${accuracy}%`}
            subtext={progressData.sessions.some(s => s.quizzes.length > 0) ? "Based on active quiz performance" : "Take a quiz in your next session!"}
            icon={CheckCircle}
            colorTheme="teal"
          />
        </div>

        {/* Bottom Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Columns: Past Sessions (Takes up 2/3 space) */}
          <div className="lg:col-span-2 space-y-5">
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <span>Learning History</span>
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/60 font-medium">
                {progressData.sessions.length}
              </span>
            </h2>

            {isLoading ? (
              <div className="text-center py-12 glass-panel rounded-2xl border border-white/5">
                <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-white/40 text-sm">Loading session history...</p>
              </div>
            ) : progressData.sessions.length === 0 ? (
              <div className="glass-panel rounded-2xl border border-white/5 p-8 text-center space-y-4">
                <p className="text-white/40 text-sm">You haven't completed any sessions yet.</p>
                <button
                  onClick={onStartNewSession}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-purple/10 border border-brand-purple/20 hover:bg-brand-purple/20 text-brand-purple font-semibold rounded-xl text-sm transition-all duration-200"
                >
                  <span>Begin First Lesson</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {progressData.sessions.map((session) => (
                  <div 
                    key={session.id} 
                    className="glass-panel rounded-2xl border border-white/5 p-5 transition-all duration-200 hover:border-white/10"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                      <div>
                        <h3 className="text-base font-bold text-white tracking-wide">{session.subject}</h3>
                        <p className="text-xs text-white/40">{formatDate(session.started_at)}</p>
                      </div>
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/60 uppercase tracking-wide">
                        {session.level}
                      </span>
                    </div>

                    {/* Topics Covered Tag List */}
                    {session.topics && session.topics.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {session.topics.map((topic, tIdx) => (
                          <span 
                            key={tIdx} 
                            className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-brand-indigo/10 text-indigo-300 border border-brand-indigo/20"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-white/30 italic">No specific topics finalized (session active or aborted).</p>
                    )}

                    {/* Quiz scores in this session */}
                    {session.quizzes && session.quizzes.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-2">
                        {session.quizzes.map((quiz, qIdx) => {
                          const pct = Math.round((quiz.score_numerator / quiz.score_denominator) * 100);
                          const isSuccess = pct >= 70;
                          
                          return (
                            <div key={qIdx} className="flex justify-between items-center bg-black/20 rounded-lg p-2.5 border border-white/5 text-xs">
                              <span className="text-white/60 font-medium flex items-center gap-1.5">
                                <span className={`h-1.5 w-1.5 rounded-full ${isSuccess ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                Quiz Performance
                              </span>
                              <span className={`font-bold ${isSuccess ? 'text-emerald-400' : 'text-amber-400'}`}>
                                Score: {quiz.score_numerator}/{quiz.score_denominator} ({pct}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Weak Areas (Takes up 1/3 space) */}
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white tracking-wide">Areas of Growth</h2>
            
            <div className="glass-panel rounded-2xl border border-white/5 p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 mt-0.5">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Needs Attention</h3>
                  <p className="text-xs text-white/40 mt-0.5">These topics were flagged as incorrect or weak during quizzes. Prioritize reviewing them.</p>
                </div>
              </div>

              {progressData.weakAreas.length === 0 ? (
                <div className="text-center py-6 text-xs text-white/30 italic">
                  No weak areas flagged! Excellent work! 🌟
                </div>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  {progressData.weakAreas.map((area, idx) => (
                    <div 
                      key={idx} 
                      className="px-3.5 py-2.5 rounded-xl bg-amber-500/5 text-amber-300 border border-amber-500/10 text-xs font-semibold flex items-center justify-between"
                    >
                      <span>{area}</span>
                      <span className="text-[9px] bg-amber-500/10 px-2 py-0.5 rounded text-amber-400 tracking-wide uppercase">Review</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Learning Tip */}
            <div className="glass-panel rounded-2xl border border-white/5 p-6 bg-gradient-to-tr from-brand-purple/10 to-brand-pink/5 relative overflow-hidden">
              <h3 className="text-sm font-bold text-white mb-2">💡 Adaptive Study Tip</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Aegis AI adjusts to your pace. If you are struggling with a concept, ask your tutor to:
                <br /><code className="text-pink-400 font-mono inline-block my-1 bg-black/30 px-1 py-0.5 rounded text-[10px]">"Use a different analogy for this"</code> or <code className="text-pink-400 font-mono inline-block my-1 bg-black/30 px-1 py-0.5 rounded text-[10px]">"Give me a simpler example"</code>.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
