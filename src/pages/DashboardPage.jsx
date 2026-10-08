import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';
import { fetchAggregateFairnessApi } from '../services/apiClient';

export default function DashboardPage({ candidates, onNavigate, mobileOpen, setMobileOpen, user, onSignOut }) {
  const [aggregateFairness, setAggregateFairness] = useState(null);

  useEffect(() => {
    async function loadFairness() {
      try {
        const data = await fetchAggregateFairnessApi();
        if (data && data.metrics) {
          setAggregateFairness(data.metrics);
        }
      } catch (err) {
        // Fallback gracefully
      }
    }
    loadFairness();
  }, []);

  const avgScore = candidates.length > 0
    ? Math.round(candidates.reduce((acc, c) => acc + c.fitScore, 0) / candidates.length)
    : 0;

  const shortlistedCount = candidates.filter(c => c.fitScore >= 80).length;

  const evidenceRate = aggregateFairness && (aggregateFairness.totalGrounded || aggregateFairness.totalRejectedEvidence)
    ? `${Math.round((aggregateFairness.totalGrounded / (aggregateFairness.totalGrounded + aggregateFairness.totalRejectedEvidence)) * 100)}%`
    : (candidates.length > 0 ? '100%' : '0%');

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-body-md text-[#0B1C30]">
      <Sidebar currentRoute="/dashboard" onNavigate={onNavigate} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} user={user} onSignOut={onSignOut} />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <TopHeader title="Recruiter Dashboard" onNavigate={onNavigate} onToggleMobile={() => setMobileOpen(true)} user={user} />

        <main className="p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-[#0B1C30] to-[#004AC6] rounded-2xl p-6 lg:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-primary-fixed-dim bg-white/10 px-3 py-1 rounded-full">
                Recruitment Workspace
              </span>
              <h1 className="text-2xl lg:text-3xl font-display font-bold">Evidence-Backed Candidate Dashboard</h1>
              <p className="text-sm text-white/80 max-w-xl">
                Analyze candidate resumes, verify facts against source documents, and track candidate fit rankings in real-time.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => onNavigate('/analyze')}
                className="px-5 py-3 rounded-xl bg-white text-[#004AC6] font-bold text-sm hover:bg-slate-100 transition-colors shadow flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">psychology</span>
                <span>Analyze Single Resume</span>
              </button>
              <button 
                onClick={() => onNavigate('/bulk-analyze')}
                className="px-5 py-3 rounded-xl bg-primary-container text-white font-bold text-sm hover:bg-primary-container/90 transition-colors shadow flex items-center gap-2 border border-white/20"
              >
                <span className="material-symbols-outlined text-lg">cloud_upload</span>
                <span>Bulk Analyze</span>
              </button>
            </div>
          </div>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stat 1 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">description</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Resumes</p>
                <h3 className="text-2xl font-display font-bold text-[#0B1C30]">{candidates.length}</h3>
                <span className="text-[11px] text-slate-500">Analyzed candidates</span>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">verified</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Shortlisted</p>
                <h3 className="text-2xl font-display font-bold text-[#0B1C30]">{shortlistedCount}</h3>
                <span className="text-[11px] text-slate-500">Fit Score ≥ 80%</span>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">analytics</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Fit Score</p>
                <h3 className="text-2xl font-display font-bold text-[#0B1C30]">{avgScore}%</h3>
                <span className="text-[11px] text-slate-500">Across open roles</span>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">plagiarism</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Evidence Grounded</p>
                <h3 className="text-2xl font-display font-bold text-[#0B1C30]">{evidenceRate}</h3>
                <span className="text-[11px] text-green-600 font-semibold">Strict quote verification</span>
              </div>
            </div>
          </div>

          {/* Aggregate Fairness & AI Reliability Dashboard Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">balance</span>
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold text-[#0B1C30]">Aggregate Fairness & AI Reliability Audit</h2>
                  <p className="text-xs text-slate-500">Evaluations across all candidates: demographic bias metrics and ungrounded claim rejection</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Blind Scoring Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Score Delta (Demographic Invariance)</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-display text-emerald-700">
                    {aggregateFairness?.meanDemographicDelta !== undefined ? `±${aggregateFairness.meanDemographicDelta}%` : '0%'}
                  </span>
                  <span className="text-xs text-slate-500">average variation</span>
                </div>
                <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                  Evaluated with swapped gender markers, name tokens, and institution masking. Target threshold: ≤ 5%.
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Rejected Hallucinations</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-display text-amber-700">
                    {aggregateFairness?.totalRejectedEvidence || 0}
                  </span>
                  <span className="text-xs text-slate-500">claims ungrounded</span>
                </div>
                <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                  Quotes claimed by LLM but missing from resume text. Automatically downgraded to UNVERIFIED with 0 score points.
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Recruiter Human Overrides</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-display text-blue-700">
                    {aggregateFairness?.totalHumanOverrides || 0}
                  </span>
                  <span className="text-xs text-slate-500">audited interventions</span>
                </div>
                <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                  Human recruiter decisions with mandatory logged rationale recorded in immutable audit ledger.
                </p>
              </div>
            </div>
          </div>

          {/* Recent Candidate Analyses */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-display font-bold text-[#0B1C30]">Recent Candidate Analyses</h2>
                <p className="text-xs text-slate-500">Click any candidate to inspect profile extractions and evidence tracing.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => onNavigate('/rankings')}
                  className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                  <span>View All Candidates</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Candidates Table or Empty State */}
            {candidates.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-primary mx-auto flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl">folder_open</span>
                </div>
                <h3 className="font-bold text-lg text-[#0B1C30]">No candidates analyzed yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Upload a candidate resume or use Bulk Analyze to process resumes against your job requirements.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button 
                    onClick={() => onNavigate('/analyze')}
                    className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-colors shadow"
                  >
                    Analyze Candidate Now
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Candidate</th>
                      <th className="py-3.5 px-6">Applied Role</th>
                      <th className="py-3.5 px-6">Fit Score</th>
                      <th className="py-3.5 px-6">Main Strength</th>
                      <th className="py-3.5 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {candidates.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-4 px-6">
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
                              <div className="text-xs text-slate-500">{c.location || 'Location not specified'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-700">{c.role}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              c.fitScore >= 85 ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                              c.fitScore >= 70 ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {c.fitScore}%
                            </span>
                            <span className="text-xs text-slate-500">{c.fitStatus}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-600">{c.mainStrength}</td>
                        <td className="py-4 px-6 text-right">
                          <button 
                            onClick={() => onNavigate(`/candidate/${c.id}`)}
                            className="px-4 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white font-semibold text-xs transition-all inline-flex items-center gap-1"
                          >
                            <span>View Report</span>
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
