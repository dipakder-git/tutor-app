import React, { useState } from 'react';
import { Terminal, Binary, BookOpen, Compass, Award, HelpCircle } from 'lucide-react';

const subjects = [
  { id: 'Python', name: 'Python', icon: Terminal, color: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5' },
  { id: 'Mathematics', name: 'Mathematics', icon: Binary, color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5' },
  { id: 'History', name: 'History', icon: BookOpen, color: 'text-amber-400 border-amber-500/20 bg-amber-500/5' },
  { id: 'English', name: 'English', icon: Award, color: 'text-pink-400 border-pink-500/20 bg-pink-500/5' },
  { id: 'Science', name: 'Science', icon: Compass, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
  { id: 'Custom', name: 'Custom Subject', icon: HelpCircle, color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5' }
];

export default function SubjectPicker({ selectedSubject, onChange }) {
  const [customSubject, setCustomSubject] = useState('');
  const [activeTab, setActiveTab] = useState('');

  const handleSelect = (subjectId) => {
    setActiveTab(subjectId);
    if (subjectId === 'Custom') {
      onChange(customSubject);
    } else {
      onChange(subjectId);
    }
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    setCustomSubject(val);
    if (activeTab === 'Custom') {
      onChange(val);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-white/75 mb-2 tracking-wide">
        Select a Subject
      </label>

      {/* Grid of Subject Choices */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {subjects.map((sub) => {
          const Icon = sub.icon;
          const isSelected = activeTab === sub.id;

          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => handleSelect(sub.id)}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between h-[100px] transition-all duration-300 ${
                isSelected
                  ? 'border-brand-purple bg-brand-purple/10 shadow-md shadow-brand-purple/10 scale-[1.02]'
                  : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10'
              }`}
            >
              <div className={`p-1.5 rounded-lg border w-fit ${sub.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={`text-sm font-semibold tracking-wide ${isSelected ? 'text-white' : 'text-white/70'}`}>
                {sub.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Input Field (Shows when Custom is selected) */}
      {activeTab === 'Custom' && (
        <div className="mt-3 animate-fade-in">
          <input
            type="text"
            placeholder="Type your custom subject (e.g. Chemistry, Spanish, Data Structures)..."
            value={customSubject}
            onChange={handleCustomChange}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-purple transition-all duration-200"
          />
        </div>
      )}
    </div>
  );
}
