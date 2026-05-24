import React from 'react';

export default function ProgressCard({ title, value, subtext, icon: Icon, colorTheme }) {
  // Select color styles
  let themeClass = 'from-brand-purple/20 to-brand-indigo/20 border-brand-purple/25 text-brand-purple';
  if (colorTheme === 'pink') {
    themeClass = 'from-brand-pink/20 to-purple-500/20 border-brand-pink/25 text-brand-pink';
  } else if (colorTheme === 'teal') {
    themeClass = 'from-brand-teal/20 to-emerald-500/20 border-brand-teal/25 text-brand-teal';
  }

  return (
    <div className="glass-panel glass-card-hover rounded-2xl p-6 border border-white/5 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
      {/* Decorative accent blob */}
      <div className={`absolute -right-6 -bottom-6 w-20 h-20 bg-gradient-to-tr ${themeClass.split(' ')[0]} ${themeClass.split(' ')[1]} rounded-full blur-xl opacity-60`} />

      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-white/50 tracking-wide uppercase">{title}</p>
          <h3 className="text-3xl font-extrabold text-white mt-2 tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-white/5 border border-white/10 ${themeClass.split(' ')[3]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-4 text-xs text-white/40 font-medium">
        {subtext}
      </div>
    </div>
  );
}
