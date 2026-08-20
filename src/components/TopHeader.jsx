import React from 'react';

export default function TopHeader({ title, onNavigate, onToggleMobile, user }) {
  const defaultAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80";
  const userAvatar = user?.photoURL || defaultAvatar;
  const userName = user?.displayName || user?.email || "Recruiter Profile";

  return (
    <header className="sticky top-0 z-40 bg-[#F8FAFC]/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleMobile} 
          className="md:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100"
          aria-label="Toggle Navigation"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
        <h2 className="font-display text-2xl font-bold text-[#0B1C30]">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input 
            type="text" 
            placeholder="Search candidates, skills..." 
            className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary w-48 lg:w-64 transition-all"
          />
        </div>

        {/* Action icons */}
        <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors relative">
          <span className="material-symbols-outlined text-xl">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
        </button>

        <button 
          onClick={() => onNavigate('/settings')}
          className="hidden md:inline-flex text-xs font-semibold text-slate-600 hover:text-primary transition-colors px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white"
        >
          Settings
        </button>

        {/* Profile Avatar & Tooltip */}
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => onNavigate('/settings')}
          title={`Signed in as ${userName}`}
        >
          <img 
            src={userAvatar} 
            alt={userName} 
            className="w-9 h-9 rounded-full object-cover border-2 border-primary/30 group-hover:border-primary shadow-sm transition-all"
          />
          {user && (
            <span className="hidden lg:block text-xs font-bold text-[#0B1C30] max-w-[120px] truncate">
              {userName}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
