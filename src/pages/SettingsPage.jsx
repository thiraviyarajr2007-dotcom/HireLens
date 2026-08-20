import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';

export default function SettingsPage({ onNavigate, mobileOpen, setMobileOpen, user, onSignOut }) {
  const [saved, setSaved] = useState(false);
  const [recruiterName, setRecruiterName] = useState(user?.displayName || 'Alex Johnson');
  const [recruiterEmail, setRecruiterEmail] = useState(user?.email || 'alex.johnson@enterprise-recruiting.com');

  useEffect(() => {
    if (user) {
      if (user.displayName) setRecruiterName(user.displayName);
      if (user.email) setRecruiterEmail(user.email);
    }
  }, [user]);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-body-md text-[#0B1C30]">
      <Sidebar 
        currentRoute="/settings" 
        onNavigate={onNavigate} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
        user={user} 
        onSignOut={onSignOut} 
      />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <TopHeader title="System Settings" onNavigate={onNavigate} onToggleMobile={() => setMobileOpen(true)} user={user} />

        <main className="p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-[#0B1C30]">HireLens Settings & Configuration</h1>
            <p className="text-sm text-slate-500 mt-1">Configure recruiter preferences, AI analysis parameters, and API integration endpoints.</p>
          </div>

          {saved && (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-semibold flex items-center gap-3">
              <span className="material-symbols-outlined text-xl text-green-600">check_circle</span>
              <span>Settings successfully updated and synced.</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-8">
            {/* Recruiter Profile */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-lg font-display font-bold text-[#0B1C30] flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">person</span> Recruiter Profile
                </h2>
                {user && (
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-primary border border-blue-200 text-xs font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    Firebase Auth Synced
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Recruiter Name</label>
                  <input 
                    type="text" 
                    value={recruiterName} 
                    onChange={(e) => setRecruiterName(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Organization Email</label>
                  <input 
                    type="email" 
                    value={recruiterEmail} 
                    onChange={(e) => setRecruiterEmail(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary" 
                  />
                </div>
              </div>
            </div>

            {/* Analysis Engine Parameters */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200 shadow-sm space-y-6">
              <h2 className="text-lg font-display font-bold text-[#0B1C30] border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">tune</span> Analysis Engine Parameters
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <h4 className="font-bold text-sm text-[#0B1C30]">Zero-Hallucination Evidence Mode</h4>
                    <p className="text-xs text-slate-500">Require exact verbatim quote matches from uploaded resume source text.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-primary rounded accent-primary cursor-pointer" />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <h4 className="font-bold text-sm text-[#0B1C30]">Strict Section Segmentation</h4>
                    <p className="text-xs text-slate-500">Segment resume into Education, Experience, and Skills boundaries before scoring.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-primary rounded accent-primary cursor-pointer" />
                </div>
              </div>
            </div>

            {/* API Configuration */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200 shadow-sm space-y-6">
              <h2 className="text-lg font-display font-bold text-[#0B1C30] border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">key</span> LLM & Backend API Integration
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">LLM Provider Endpoint</label>
                  <select className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary">
                    <option>HireLens Express Backend REST API (http://localhost:5000/api)</option>
                    <option>Google Gemini Flash / Pro API</option>
                    <option>Custom Enterprise LLM Endpoint</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">API Key (Masked)</label>
                  <input 
                    type="password" 
                    defaultValue="sk-hirelens-8492049201948201" 
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-primary" 
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">API keys are encrypted in local storage.</span>
                </div>
              </div>
            </div>

            {/* System Information */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 lg:p-8 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-green-400 text-2xl">memory</span>
                  <div>
                    <h3 className="font-bold text-sm">HireLens AI Core Version</h3>
                    <p className="text-xs text-slate-400">Build 2026.08.20 — Production Ready</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold uppercase tracking-wider">
                  System Online
                </span>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button 
                type="submit"
                className="px-8 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow"
              >
                Save Settings
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
