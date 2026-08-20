import React from 'react';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';

export default function RankingsPage({ candidates, onNavigate, mobileOpen, setMobileOpen, user, onSignOut }) {
  // Sort candidates by fitScore descending
  const sortedCandidates = [...candidates].sort((a, b) => b.fitScore - a.fitScore);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-body-md text-[#0B1C30]">
      <Sidebar currentRoute="/rankings" onNavigate={onNavigate} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} user={user} onSignOut={onSignOut} />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <TopHeader title="Candidate Rankings" onNavigate={onNavigate} onToggleMobile={() => setMobileOpen(true)} user={user} />

        <main className="p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Header & Comparison CTA */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-display font-bold text-[#0B1C30]">Candidate Rankings Leaderboard</h1>
              <p className="text-sm text-slate-500 mt-1">
                Role: <span className="font-semibold text-slate-800">Senior Software Engineer</span> • Evaluated against evidence matrix
              </p>
            </div>

            <button 
              onClick={() => onNavigate('/comparison')}
              className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-xl">compare_arrows</span>
              <span>Compare Candidates Side-by-Side</span>
            </button>
          </div>

          {/* Rankings Table Card or Empty State */}
          {sortedCandidates.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-primary mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">leaderboard</span>
              </div>
              <h3 className="font-bold text-lg text-[#0B1C30]">No candidate rankings available</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload resumes against job criteria to evaluate fit scores and generate applicant rankings.
              </p>
              <div className="pt-2 flex justify-center">
                <button 
                  onClick={() => onNavigate('/analyze')}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-colors shadow"
                >
                  Start Resume Analysis
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[850px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-4 px-6 w-16 text-center">Rank</th>
                      <th className="py-4 px-6">Candidate</th>
                      <th className="py-4 px-6">Fit Score</th>
                      <th className="py-4 px-6">Main Strength</th>
                      <th className="py-4 px-6">Main Gap / Risk</th>
                      <th className="py-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {sortedCandidates.map((c, index) => {
                      const rank = index + 1;
                      const isTop = rank === 1;

                      return (
                        <tr 
                          key={c.id} 
                          className={`transition-colors group relative ${
                            isTop ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {/* Left accent bar for #1 */}
                          {isTop && <td className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></td>}

                          {/* Rank Badge */}
                          <td className="py-5 px-6 text-center">
                            <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center mx-auto ${
                              isTop ? 'bg-primary text-white shadow' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {rank}
                            </div>
                          </td>

                          {/* Candidate Details */}
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate(`/candidate/${c.id}`)}>
                              <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                              <div>
                                <div className="font-bold text-[#0B1C30] group-hover:text-primary transition-colors">{c.name}</div>
                                <div className="text-xs text-slate-500">{c.role}</div>
                              </div>
                            </div>
                          </td>

                          {/* Fit Score Ring */}
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                  <path className="text-slate-200 stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="4" />
                                  <path 
                                    className="text-cyan-500 stroke-current" 
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                    fill="none" 
                                    strokeDasharray={`${c.fitScore}, 100`} 
                                    strokeWidth="4" 
                                    strokeLinecap="round" 
                                  />
                                </svg>
                                <span className="absolute font-display font-bold text-xs text-[#0B1C30]">{c.fitScore}</span>
                              </div>
                              <span className="text-xs font-semibold text-slate-600">{c.fitStatus}</span>
                            </div>
                          </td>

                          {/* Main Strength */}
                          <td className="py-5 px-6">
                            <span className="inline-block px-2.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 text-[11px] font-bold uppercase tracking-wider mb-1">
                              Found Evidence
                            </span>
                            <p className="text-xs text-slate-700">{c.mainStrength}</p>
                          </td>

                          {/* Main Gap */}
                          <td className="py-5 px-6">
                            <span className="inline-block px-2.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold uppercase tracking-wider mb-1">
                              Verification Gap
                            </span>
                            <p className="text-xs text-slate-700">{c.mainGap}</p>
                          </td>

                          {/* Action */}
                          <td className="py-5 px-6 text-right">
                            <button 
                              onClick={() => onNavigate(`/candidate/${c.id}`)}
                              className="px-4 py-2 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary/90 transition-colors shadow-sm inline-flex items-center gap-1"
                            >
                              <span>View Report</span>
                              <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
