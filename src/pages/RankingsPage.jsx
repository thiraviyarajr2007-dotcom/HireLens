import React, { useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';

export default function RankingsPage({ candidates, onNavigate, mobileOpen, setMobileOpen, user, onSignOut }) {
  // Configurable Scoring Weight Sliders (Phase 5: instant client-side recalculation)
  const [weights, setWeights] = useState({
    skills: 45,
    experience: 30,
    impact: 15,
    education: 10
  });

  const [filterRole, setFilterRole] = useState('ALL');

  // Compute dynamic scores from stored sub-scores
  const rankedCandidates = useMemo(() => {
    const totalWeight = weights.skills + weights.experience + weights.impact + weights.education || 1;

    return candidates
      .filter(c => filterRole === 'ALL' || c.role === filterRole)
      .map(c => {
        const sSkills = c.scoringDetails?.subScores?.skills ?? c.skillsMatch ?? 70;
        const sExp = c.scoringDetails?.subScores?.experience ?? c.experienceMatch ?? 70;
        const sImpact = c.scoringDetails?.subScores?.impact ?? (c.scoringDetails?.impactMetrics?.points ? Math.min(100, c.scoringDetails.impactMetrics.points * 20) : 75);
        const sEdu = c.scoringDetails?.subScores?.education ?? c.educationMatch ?? 70;

        const dynamicScore = Math.round(
          (sSkills * weights.skills + sExp * weights.experience + sImpact * weights.impact + sEdu * weights.education) / totalWeight
        );

        return {
          ...c,
          dynamicScore,
          sSkills,
          sExp,
          sImpact,
          sEdu
        };
      })
      .sort((a, b) => b.dynamicScore - a.dynamicScore);
  }, [candidates, weights, filterRole]);

  // Export Rankings to CSV (Phase 5 / B17 fix)
  const handleExportCsv = () => {
    if (rankedCandidates.length === 0) return;

    const headers = ['Rank', 'Candidate Name', 'Fit Score', 'Applied Role', 'Skills Match', 'Experience Match', 'Impact Score', 'Education Match', 'Main Strength', 'Main Gap'];
    const rows = rankedCandidates.map((c, i) => [
      i + 1,
      `"${c.name || 'Candidate'}"`,
      `${c.dynamicScore}%`,
      `"${c.role || ''}"`,
      `${c.sSkills}%`,
      `${c.sExp}%`,
      `${c.sImpact}%`,
      `${c.sEdu}%`,
      `"${c.mainStrength || ''}"`,
      `"${c.mainGap || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HireLens_Rankings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const roles = useMemo(() => {
    const list = Array.from(new Set(candidates.map(c => c.role).filter(Boolean)));
    return ['ALL', ...list];
  }, [candidates]);

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
                Deterministic rankings based on verified evidence and configurable requirement weights.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={handleExportCsv}
                disabled={rankedCandidates.length === 0}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">download</span>
                <span>Export CSV</span>
              </button>

              <button 
                onClick={() => onNavigate('/comparison')}
                className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-all shadow flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">compare_arrows</span>
                <span>Compare Side-by-Side</span>
              </button>
            </div>
          </div>

          {/* Interactive Weight Sliders (Phase 5: Instant client re-scoring) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">tune</span>
                <h3 className="font-display font-bold text-sm text-[#0B1C30]">Real-Time Deterministic Weight Sliders</h3>
              </div>
              <span className="text-xs text-slate-400">Total weight: {weights.skills + weights.experience + weights.impact + weights.education}%</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-1">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Grounded Skills ({weights.skills}%)</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="70" 
                  value={weights.skills} 
                  onChange={(e) => setWeights(prev => ({ ...prev, skills: Number(e.target.value) }))}
                  className="w-full accent-primary h-2 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Experience Years ({weights.experience}%)</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="60" 
                  value={weights.experience} 
                  onChange={(e) => setWeights(prev => ({ ...prev, experience: Number(e.target.value) }))}
                  className="w-full accent-primary h-2 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Quantified Impact ({weights.impact}%)</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="40" 
                  value={weights.impact} 
                  onChange={(e) => setWeights(prev => ({ ...prev, impact: Number(e.target.value) }))}
                  className="w-full accent-primary h-2 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Education Credential ({weights.education}%)</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="30" 
                  value={weights.education} 
                  onChange={(e) => setWeights(prev => ({ ...prev, education: Number(e.target.value) }))}
                  className="w-full accent-primary h-2 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Rankings Table Card or Empty State */}
          {rankedCandidates.length === 0 ? (
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
                      <th className="py-4 px-6">Re-Weighted Score</th>
                      <th className="py-4 px-6">Skills / Exp / Impact</th>
                      <th className="py-4 px-6">Main Strength</th>
                      <th className="py-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {rankedCandidates.map((c, index) => {
                      const rank = index + 1;
                      const isTop = rank === 1;

                      return (
                        <tr 
                          key={c.id} 
                          className={`transition-colors group relative ${
                            isTop ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50/80'
                          }`}
                        >
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
                              {c.avatar ? (
                                <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs border border-slate-300">
                                  {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-[#0B1C30] group-hover:text-primary transition-colors">{c.name}</div>
                                <div className="text-xs text-slate-500">{c.role}</div>
                              </div>
                            </div>
                          </td>

                          {/* Fit Score */}
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                c.dynamicScore >= 85 ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                                c.dynamicScore >= 70 ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {c.dynamicScore}%
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                {c.dynamicScore >= 85 ? 'Strong Match' : c.dynamicScore >= 70 ? 'Moderate Match' : 'Partial Match'}
                              </span>
                            </div>
                          </td>

                          {/* Sub-Score Breakdown Chips */}
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                              <span className="bg-slate-100 px-2 py-0.5 rounded">S: {c.sSkills}%</span>
                              <span className="bg-slate-100 px-2 py-0.5 rounded">E: {c.sExp}%</span>
                              <span className="bg-slate-100 px-2 py-0.5 rounded">I: {c.sImpact}%</span>
                            </div>
                          </td>

                          {/* Main Strength */}
                          <td className="py-5 px-6 text-xs text-slate-600 max-w-xs truncate">
                            {c.mainStrength || 'Technical Profile Grounded'}
                          </td>

                          {/* Action Button */}
                          <td className="py-5 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => onNavigate(`/candidate/${c.id}`)}
                                className="px-3.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white font-semibold text-xs transition-all inline-flex items-center gap-1"
                              >
                                <span>Report</span>
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                              </button>
                            </div>
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
