import React from 'react';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';

export default function CandidateAnalysisPage({ candidate, onNavigate, mobileOpen, setMobileOpen }) {
  if (!candidate) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex font-body-md text-[#0B1C30]">
        <Sidebar currentRoute="/rankings" onNavigate={onNavigate} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <div className="flex-1 md:ml-[280px] p-8 text-center">
          <p className="text-slate-500">Candidate not found.</p>
          <button onClick={() => onNavigate('/dashboard')} className="mt-4 text-primary font-bold">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-body-md text-[#0B1C30]">
      <Sidebar currentRoute="/rankings" onNavigate={onNavigate} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <TopHeader title="Candidate Analysis" onNavigate={onNavigate} onToggleMobile={() => setMobileOpen(true)} />

        <main className="p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <button 
              onClick={() => onNavigate('/rankings')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span>Back to Candidate Rankings</span>
            </button>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => onNavigate(`/candidate/${candidate.id}/evidence`)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base text-primary">plagiarism</span>
                <span>Open Evidence Explorer</span>
              </button>

              <button 
                onClick={() => onNavigate('/comparison')}
                className="px-4 py-2 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">compare_arrows</span>
                <span>Compare Candidate</span>
              </button>
            </div>
          </div>

          {/* Candidate Global Info Banner */}
          <div className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <img 
                  src={candidate.avatar} 
                  alt={candidate.name} 
                  className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-xs">check</span>
                </div>
              </div>

              <div>
                <h1 className="font-display text-2xl lg:text-3xl font-bold text-[#0B1C30]">{candidate.name}</h1>
                <p className="text-sm text-slate-600 flex items-center gap-2 mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base text-slate-400">work</span> {candidate.role}
                  </span>
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base text-slate-400">location_on</span> {candidate.location}
                  </span>
                </p>
              </div>
            </div>

            {/* Fit Score Ring & System Recommendation */}
            <div className="flex items-center gap-6 lg:border-l border-slate-200 lg:pl-8 w-full lg:w-auto justify-between lg:justify-start">
              <div className="flex flex-col items-center">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle className="text-slate-100 stroke-current" cx="50" cy="50" r="40" strokeWidth="8" fill="transparent" />
                    <circle 
                      className="text-cyan-500 stroke-current" 
                      cx="50" cy="50" r="40" strokeWidth="8" fill="transparent" 
                      strokeDasharray="251.2" 
                      strokeDashoffset={251.2 * (1 - candidate.fitScore / 100)} 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <span className="absolute font-display font-bold text-xl text-[#0B1C30]">{candidate.fitScore}%</span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-1">FIT SCORE</span>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 max-w-xs">
                <div className="flex items-center gap-1.5 text-primary font-bold text-xs mb-1">
                  <span className="material-symbols-outlined text-base">auto_awesome</span>
                  <span>System Recommendation</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{candidate.recommendation}</p>
              </div>
            </div>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Contact & Profile Extractions */}
            <div className="space-y-6 lg:col-span-1">
              {/* Contact Info Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="material-symbols-outlined text-base">contact_page</span> Contact Details
                </h3>

                <div className="space-y-3 text-sm text-slate-700">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-400 text-lg">mail</span>
                    <span>{candidate.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-400 text-lg">phone</span>
                    <span>{candidate.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-blue-600 text-lg">link</span>
                    <span className="text-blue-600 font-medium">{candidate.linkedin}</span>
                  </div>
                </div>
              </div>

              {/* Extracted Profile Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="material-symbols-outlined text-base">document_scanner</span> Extracted Profile Fields
                </h3>

                {/* Education */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Education</span>
                    <span className="badge-found">FOUND</span>
                  </div>
                  <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                    {candidate.extractedProfile.education}
                  </p>
                </div>

                {/* Experience */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Latest Role</span>
                    <span className="badge-found">FOUND</span>
                  </div>
                  <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                    {candidate.extractedProfile.latestExperience}
                  </p>
                </div>

                {/* Verified Skills */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">Verified Skills</span>
                  <div className="flex flex-wrap gap-2">
                    {candidate.extractedProfile.skills.map((s, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                        {s.name}
                        {s.verified && <span className="material-symbols-outlined text-green-500 text-xs">check_circle</span>}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Source Documents (Neutral List) */}
                {candidate.documents && candidate.documents.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">folder_open</span> Source Documents ({candidate.documents.length})
                    </span>
                    <div className="space-y-1.5">
                      {candidate.documents.map((doc, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                          <span className="font-medium text-slate-700 truncate">{doc.name}</span>
                          <span className="text-[10px] text-slate-400">{doc.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Deep Job Fit Analysis */}
            <div className="space-y-6 lg:col-span-2">
              {/* Job Fit Analysis Card */}
              <div className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">analytics</span> Job Description Match Breakdown
                  </h3>
                </div>

                {/* Progress Bars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <div className="flex justify-between items-end text-xs mb-1.5">
                      <span className="font-semibold text-slate-600 uppercase">Skills Match</span>
                      <span className="font-bold text-[#0B1C30]">{candidate.skillsMatch}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${candidate.skillsMatch}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-end text-xs mb-1.5">
                      <span className="font-semibold text-slate-600 uppercase">Experience</span>
                      <span className="font-bold text-[#0B1C30]">{candidate.experienceMatch}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${candidate.experienceMatch}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-end text-xs mb-1.5">
                      <span className="font-semibold text-slate-600 uppercase">Education</span>
                      <span className="font-bold text-[#0B1C30]">{candidate.educationMatch}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${candidate.educationMatch}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Requirement Tracing Section */}
                <div className="bg-slate-50/70 rounded-xl border border-slate-200 p-6 space-y-4">
                  <h4 className="font-bold text-sm text-slate-800">Requirement Tracing & Verifications</h4>

                  <div className="space-y-4">
                    {/* Matched Requirements */}
                    {candidate.matchedRequirements.map((req) => (
                      <div key={req.id} className="flex items-start gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                        <span className="material-symbols-outlined text-green-500 text-xl mt-0.5">check_circle</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-sm text-[#0B1C30]">{req.title}</p>
                            <span className="badge-found">MATCHED</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{req.explanation}</p>
                          <button 
                            onClick={() => onNavigate(`/candidate/${candidate.id}/evidence?field=${req.fieldId}`)}
                            className="mt-2 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <span>View Evidence Source</span>
                            <span className="material-symbols-outlined text-xs">open_in_new</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Missing / Unverified Requirements */}
                    {candidate.missingRequirements.map((m) => (
                      <div key={m.id} className="flex items-start gap-3 bg-red-50/40 p-4 rounded-xl border border-red-100">
                        <span className="material-symbols-outlined text-amber-500 text-xl mt-0.5">warning</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-sm text-[#0B1C30]">{m.title}</p>
                            <span className={m.status === 'NOT_FOUND' ? 'badge-not-found' : 'badge-ambiguous'}>
                              {m.status === 'NOT_FOUND' ? 'NOT FOUND' : 'AMBIGUOUS'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{m.explanation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evidence Verification Action Card */}
                <div className="bg-blue-50/60 p-5 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">plagiarism</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#0B1C30]">Interactive Evidence Explorer</h4>
                      <p className="text-xs text-slate-600">Inspect original resume source lines and AI extraction confidence scores.</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => onNavigate(`/candidate/${candidate.id}/evidence`)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-colors shadow flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <span>View Evidence Explorer</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
