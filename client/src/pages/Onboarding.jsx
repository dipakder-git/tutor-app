import React, { useState } from 'react';
import SubjectPicker from '../components/SubjectPicker';
import { Sparkles, BrainCircuit, GraduationCap } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export default function Onboarding({ onSessionStarted, onNavigateToProgress, currentUser, setCurrentUser }) {
  const [name, setName] = useState(currentUser ? currentUser.name : '');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!subject || !subject.trim()) {
      setError('Please select or type a subject');
      return;
    }

    setLoading(true);

    try {
      // 1. Register or fetch user
      const userRes = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!userRes.ok) {
        throw new Error('Failed to register user');
      }

      const userData = await userRes.json();
      setCurrentUser(userData);

      // Save user to localStorage
      localStorage.setItem('active_tutor_user', JSON.stringify(userData));

      // 2. Start session
      await onSessionStarted(userData.id, subject, level);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to start learning session. Make sure server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col justify-center items-center px-4 py-12 relative">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-brand-purple/10 rounded-full blur-3xl animate-blob" />
      <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-brand-pink/10 rounded-full blur-3xl animate-blob" />

      {/* Main Glass Panel */}
      <div className="w-full max-w-xl glass-panel rounded-3xl border border-white/10 p-8 md:p-10 relative overflow-hidden animate-fade-in">
        {/* Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-purple to-transparent" />

        {/* Title / Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-pink text-white shadow-lg glow-purple mb-4">
            <BrainCircuit className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Aegis AI Tutor
          </h1>
          <p className="text-sm text-white/50 mt-2 font-medium">
            Your personalized, adaptive learning journey starts here.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-white/75 mb-2 tracking-wide">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              placeholder="What should the tutor call you?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={currentUser !== null}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-purple transition-all duration-200"
            />
          </div>

          {/* Subject Picker Component */}
          <SubjectPicker selectedSubject={subject} onChange={setSubject} />

          {/* Level Picker */}
          <div>
            <label className="block text-sm font-semibold text-white/75 mb-2 tracking-wide">
              Your Current Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`py-3 rounded-xl text-sm font-semibold tracking-wide border transition-all duration-200 ${
                    level === lvl
                      ? 'border-brand-purple bg-brand-purple/15 text-white'
                      : 'border-white/5 bg-white/5 text-white/50 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-gradient-to-r from-brand-purple to-brand-indigo hover:from-brand-indigo hover:to-brand-purple text-white font-bold tracking-wide rounded-xl shadow-lg glow-purple transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Initializing Tutor...' : 'Start Learning'}
            </button>

            {currentUser && (
              <button
                type="button"
                onClick={() => onNavigateToProgress(currentUser.id)}
                className="py-4 px-6 border border-white/10 hover:border-white/20 text-white/70 hover:text-white font-semibold rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <GraduationCap className="h-5 w-5" />
                <span>View Progress</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
