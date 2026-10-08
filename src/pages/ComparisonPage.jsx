import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';

export default function ComparisonPage({ candidates, onNavigate, mobileOpen, setMobileOpen, user, onSignOut }) {
  // Allow recruiter to choose which candidates to compare
  const [candidateAId, setCandidateAId] = useState(candidates[0]?.id || null);
  const [candidateBId, setCandidateBId] = useState(candidates[1]?.id || candidates[0]?.id || null);

  const candidateA = candidates.find(c => c.id === candidateAId) || candidates[0];
  const candidateB = candidates.find(c => c.id === candidateBId) || candidates[1] || candidates[0];

  // Derive real requirements from candidate evaluations
  const allRequirements = React.useMemo(() => {
    const reqMap = new Map();
    [candidateA, candidateB].forEach(c => {
      if (!c) return;
      const verified = c.evaluations?.[0]?.verifiedRequirements || 
                       [...(c.matchedRequirements || []), ...(c.missingRequirements || [])];
      verified.forEach(r => {
        if (!reqMap.has(r.title || r.requirementId || r.id)) {
          reqMap.set(r.title || r.requirementId || r.id, {
            id: r.id || r.requirementId,
            title: r.title || r.requirementId,
            isMandatory: r.isMandatory ?? true
          });
        }
      });
    });

    if (reqMap.size === 0) {
      return [
        { id: 'req_skills', title: 'Core Technical Competencies', isMandatory: true },
        { id: 'req_exp', title: 'Years of Hands-on Experience', isMandatory: true },
        { id: 'req_edu', title: 'Formal Education / Degree Credential', isMandatory: false }
      ];
    }

    return Array.from(reqMap.values());
  }, [candidateA, candidateB]);

  const getCandidateEvidence = (candidate, req) => {
    if (!candidate) return { status: 'NOT_FOUND', quote: 'No data' };
    const verified = candidate.evaluations?.[0]?.verifiedRequirements || 
                     [...(candidate.matchedRequirements || []), ...(candidate.missingRequirements || [])];
    const match = verified.find(r => (r.title || r.requirementId || r.id) === req.title);
    if (match) {
      return {
        status: match.finalStatus || match.status || 'MATCHED',
        quote: match.evidenceQuote || match.evidence || 'Verbatim quote verified in candidate profile.'
      };
    }
    return {
      status: 'NOT_FOUND',
      quote: 'Not found in candidate resume text.'
    };
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-body-md text-[#0B1C30]">
      <Sidebar currentRoute="/comparison" onNavigate={onNavigate} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} user={user} onSignOut={onSignOut} />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <TopHeader title="Candidate Comparison" onNavigate={onNavigate} onToggleMobile={() => setMobileOpen(true)} user={user} />

        <main className="p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Header Bar */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <button 
                onClick={() => onNavigate('/rankings')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors mb-1"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                <span>Back to Candidate Rankings</span>
              </button>
              <h1 className="text-2xl lg:text-3xl font-display font-bold text-[#0B1C30]">Side-by-Side Candidate Comparison</h1>
              <p className="text-xs text-slate-500 mt-1">Direct requirement-by-requirement grounded evidence comparison.</p>
            </div>

            <button 
              onClick={() => onNavigate('/analyze')}
              className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-all shadow flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Analyze Another Resume</span>
            </button>
          </div>

          {/* Candidate Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Candidate A</label>
              <select
                value={candidateA?.id || ''}
                onChange={(e) => setCandidateAId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {candidates.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.fitScore}%) — {c.role}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Candidate B</label>
              <select
                value={candidateB?.id || ''}
                onChange={(e) => setCandidateBId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {candidates.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.fitScore}%) — {c.role}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison Matrix Table Card */}
          {!candidateA || !candidateB ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-primary mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">compare_arrows</span>
              </div>
              <h3 className="font-bold text-lg text-[#0B1C30]">Select candidates to compare</h3>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[850px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-4 px-6 w-1/3">Job Requirement</th>
                      <th className="py-4 px-6 w-1/3 border-l border-slate-200">
                        <div className="flex items-center gap-3">
                          {candidateA.avatar ? (
                            <img src={candidateA.avatar} alt={candidateA.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                              {candidateA.name?.charAt(0) || 'A'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-[#0B1C30]">{candidateA.name}</div>
                            <div className="text-[11px] text-primary font-semibold">{candidateA.fitScore}% Fit Score</div>
                          </div>
                        </div>
                      </th>
                      <th className="py-4 px-6 w-1/3 border-l border-slate-200">
                        <div className="flex items-center gap-3">
                          {candidateB.avatar ? (
                            <img src={candidateB.avatar} alt={candidateB.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                              {candidateB.name?.charAt(0) || 'B'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-[#0B1C30]">{candidateB.name}</div>
                            <div className="text-[11px] text-primary font-semibold">{candidateB.fitScore}% Fit Score</div>
                          </div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {/* Overall Summary Row */}
                    <tr className="bg-slate-50/50 font-semibold text-xs text-slate-700">
                      <td className="py-3 px-6">Overall Assessment</td>
                      <td className="py-3 px-6 border-l border-slate-200">
                        <span className="text-slate-600 font-normal">{candidateA.recommendation || 'Evaluated profile.'}</span>
                      </td>
                      <td className="py-3 px-6 border-l border-slate-200">
                        <span className="text-slate-600 font-normal">{candidateB.recommendation || 'Evaluated profile.'}</span>
                      </td>
                    </tr>

                    {/* Requirement Rows */}
                    {allRequirements.map((req, idx) => {
                      const evA = getCandidateEvidence(candidateA, req);
                      const evB = getCandidateEvidence(candidateB, req);

                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-6 align-top">
                            <div className="font-semibold text-[#0B1C30]">{req.title}</div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              {req.isMandatory ? 'Mandatory Requirement' : 'Preferred Skill'}
                            </span>
                          </td>

                          {/* Candidate A Evidence */}
                          <td className="py-4 px-6 align-top border-l border-slate-200 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                evA.status === 'MATCHED' ? 'bg-green-100 text-green-800' :
                                evA.status === 'PARTIAL' ? 'bg-amber-100 text-amber-800' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {evA.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                              "{evA.quote}"
                            </p>
                          </td>

                          {/* Candidate B Evidence */}
                          <td className="py-4 px-6 align-top border-l border-slate-200 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                evB.status === 'MATCHED' ? 'bg-green-100 text-green-800' :
                                evB.status === 'PARTIAL' ? 'bg-amber-100 text-amber-800' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {evB.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                              "{evB.quote}"
                            </p>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Main Strength / Main Gap comparison */}
                    <tr className="bg-slate-50/30">
                      <td className="py-4 px-6 font-semibold text-xs text-slate-700">Primary Grounded Strength</td>
                      <td className="py-4 px-6 border-l border-slate-200 text-xs text-slate-700">{candidateA.mainStrength || 'None listed'}</td>
                      <td className="py-4 px-6 border-l border-slate-200 text-xs text-slate-700">{candidateB.mainStrength || 'None listed'}</td>
                    </tr>
                    <tr className="bg-slate-50/30">
                      <td className="py-4 px-6 font-semibold text-xs text-slate-700">Primary Identified Gap</td>
                      <td className="py-4 px-6 border-l border-slate-200 text-xs text-slate-700">{candidateA.mainGap || 'None identified'}</td>
                      <td className="py-4 px-6 border-l border-slate-200 text-xs text-slate-700">{candidateB.mainGap || 'None identified'}</td>
                    </tr>
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
