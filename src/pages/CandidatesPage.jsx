import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';

export default function CandidatesPage({ candidates, onNavigate, mobileOpen, setMobileOpen, user, onSignOut }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');

  const roles = ['ALL', ...new Set(candidates.map(c => c.role))];

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.mainStrength.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'ALL' || c.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-body-md text-[#0B1C30]">
      <Sidebar currentRoute="/candidates" onNavigate={onNavigate} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} user={user} onSignOut={onSignOut} />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <TopHeader title="Candidates Directory" onNavigate={onNavigate} onToggleMobile={() => setMobileOpen(true)} user={user} />

        <main className="p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-display font-bold text-[#0B1C30]">Candidate Directory ({candidates.length})</h1>
              <p className="text-sm text-slate-500 mt-1">Browse, filter, and inspect evidence profiles for all evaluated applicants.</p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={() => onNavigate('/analyze')}
                className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                <span>Analyze New Candidate</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by candidate name, skill, location..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Filter Role:</span>
              <select 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary font-medium text-slate-700"
              >
                {roles.map(role => (
                  <option key={role} value={role}>{role === 'ALL' ? 'All Roles' : role}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Candidate Grid or Empty State */}
          {filteredCandidates.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-primary mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">groups</span>
              </div>
              <h3 className="font-bold text-lg text-[#0B1C30]">No candidates evaluated yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload a candidate resume to extract skills, verify facts, and build your candidate directory.
              </p>
              <div className="pt-2 flex justify-center">
                <button 
                  onClick={() => onNavigate('/analyze')}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-colors shadow"
                >
                  Analyze First Candidate
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {filteredCandidates.map((c) => (
                <div 
                  key={c.id} 
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6"
                >
                  {/* Header Info */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img 
                        src={c.avatar} 
                        alt={c.name} 
                        className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 shadow-sm"
                      />
                      <div>
                        <h3 className="font-display font-bold text-lg text-[#0B1C30] hover:text-primary transition-colors cursor-pointer" onClick={() => onNavigate(`/candidate/${c.id}`)}>
                          {c.name}
                        </h3>
                        <p className="text-xs text-slate-600 font-medium">{c.role}</p>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">location_on</span> {c.location}
                        </p>
                      </div>
                    </div>

                    {/* Fit Score Badge */}
                    <div className="flex flex-col items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        c.fitScore >= 85 ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                        c.fitScore >= 70 ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {c.fitScore}% Fit
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold mt-1 uppercase">{c.fitStatus}</span>
                    </div>
                  </div>

                  {/* Key Skills */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Verified Skills</span>
                    <div className="flex flex-wrap gap-2">
                      {(c.extractedProfile?.skills || []).map((s, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 flex items-center gap-1">
                          {s.name}
                          {s.verified && <span className="material-symbols-outlined text-green-500 text-xs">check_circle</span>}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Strength Summary */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <span className="font-bold text-slate-700 block">Main Strength:</span>
                    <p className="text-slate-600">{c.mainStrength}</p>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button 
                      onClick={() => onNavigate(`/candidate/${c.id}/evidence`)}
                      className="text-xs font-semibold text-slate-600 hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-base text-primary">plagiarism</span>
                      <span>Evidence Explorer</span>
                    </button>

                    <button 
                      onClick={() => onNavigate(`/candidate/${c.id}`)}
                      className="px-4 py-2 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-1"
                    >
                      <span>View Profile</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
