import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';

export default function EvidenceExplorerPage({ candidate, onNavigate, initialFieldId, mobileOpen, setMobileOpen }) {
  if (!candidate) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex font-body-md text-[#0B1C30]">
        <Sidebar currentRoute="/rankings" onNavigate={onNavigate} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <div className="flex-1 md:ml-[280px] p-8 text-center">
          <p className="text-slate-500">Candidate evidence not found.</p>
          <button onClick={() => onNavigate('/dashboard')} className="mt-4 text-primary font-bold">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const evidenceKeys = Object.keys(candidate.evidenceFields || {});
  const [selectedFieldKey, setSelectedFieldKey] = useState(initialFieldId && candidate.evidenceFields[initialFieldId] ? initialFieldId : (evidenceKeys[0] || 'SKILLS-LIST'));

  const currentEvidence = candidate.evidenceFields?.[selectedFieldKey] || {
    fieldId: selectedFieldKey,
    category: "Skills",
    status: "FOUND",
    extractedValue: "React, Node.js, TypeScript, Python",
    sourceSection: "Technical Skills",
    evidenceText: "Proficient in React, Node.js, TypeScript, and Python for scalable web applications.",
    confidence: 98,
    reasoningLog: [
      { type: "info", title: "Semantic Match Detected", detail: "Located keywords strongly correlated with job criteria." },
      { type: "success", title: "High Confidence Verification", detail: "Contextual grammar confirms active usage." }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-body-md text-[#0B1C30]">
      <Sidebar currentRoute="/rankings" onNavigate={onNavigate} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 md:ml-[280px] flex flex-col h-screen overflow-hidden">
        <TopHeader title="Evidence Explorer" onNavigate={onNavigate} onToggleMobile={() => setMobileOpen(true)} />

        {/* Action Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate(`/candidate/${candidate.id}`)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              title="Back to Candidate Analysis"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <div>
              <h2 className="font-display font-bold text-lg text-[#0B1C30]">Evidence Explorer</h2>
              <p className="text-xs text-slate-500">Candidate: <span className="font-semibold text-slate-800">{candidate.name}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">verified</span> Analysis Verified
            </span>

            <button 
              onClick={() => onNavigate(`/candidate/${candidate.id}`)}
              className="px-4 py-1.5 rounded-lg bg-primary text-white font-semibold text-xs hover:bg-primary/90 transition-colors shadow-sm"
            >
              Back to Candidate Profile
            </button>
          </div>
        </div>

        {/* Split View Container */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-6 gap-6">
          {/* Left Side: Document Preview with Evidence Highlighting */}
          <div className="w-full lg:w-1/2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">description</span> Original Source Document
              </span>
              <div className="flex items-center gap-1 text-slate-400">
                <button className="p-1 hover:text-slate-700"><span className="material-symbols-outlined text-sm">zoom_in</span></button>
                <button className="p-1 hover:text-slate-700"><span className="material-symbols-outlined text-sm">zoom_out</span></button>
              </div>
            </div>

            {/* Document Content View */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 font-mono text-xs leading-relaxed text-slate-800">
              <div className="max-w-2xl mx-auto bg-white p-8 border border-slate-200 shadow-md space-y-6 rounded-lg font-sans">
                <div className="border-b border-slate-200 pb-4">
                  <h1 className="text-2xl font-bold text-[#0B1C30]">{candidate.name}</h1>
                  <p className="text-xs text-slate-500 mt-1">{candidate.role} | {candidate.location} | {candidate.email}</p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Professional Summary</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Experienced software engineer with strong technical background in full-stack architecture, clean coding practices, and evidence-driven development.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Technical Skills</h3>
                  <div className="p-3 bg-cyan-50 border-2 border-cyan-400 rounded-lg relative">
                    <span className="absolute -top-3 left-3 bg-cyan-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                      Highlighted Evidence Match
                    </span>
                    <p className="text-xs font-medium text-slate-800 leading-relaxed">
                      {currentEvidence.evidenceText}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Work Experience & Projects</h3>
                  <div className="text-xs text-slate-700 space-y-1">
                    <p className="font-bold text-[#0B1C30]">{candidate.extractedProfile?.latestExperience}</p>
                    <p className="text-slate-600">
                      Demonstrated leadership in technical initiatives, database optimization, and API service delivery.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Education</h3>
                  <p className="text-xs text-slate-700">{candidate.extractedProfile?.education}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Evidence Details Panel */}
          <div className="w-full lg:w-1/2 flex flex-col gap-6 overflow-y-auto">
            {/* Field Selector Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-2">Extracted Fields:</span>
              {evidenceKeys.map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedFieldKey(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                    selectedFieldKey === key
                      ? 'bg-primary text-white shadow'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Main Evidence Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              {/* Card Header */}
              <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    FIELD ID: {currentEvidence.fieldId}
                  </span>
                  <h3 className="text-xl font-display font-bold text-[#0B1C30] flex items-center gap-3">
                    <span>{currentEvidence.category}</span>
                    <span className="badge-found">FOUND</span>
                  </h3>
                </div>

                {/* Confidence Score Ring */}
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-slate-200 stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3.5" />
                    <path className="text-cyan-500 stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray={`${currentEvidence.confidence}, 100`} strokeWidth="3.5" strokeLinecap="round" />
                  </svg>
                  <span className="absolute font-display font-bold text-xs text-[#0B1C30]">{currentEvidence.confidence}%</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-6">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Extracted Value</span>
                  <div className="flex flex-wrap gap-2">
                    {currentEvidence.extractedValue.split(',').map((val, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-lg bg-blue-50 text-primary border border-blue-200 text-xs font-semibold">
                        {val.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-slate-100"></div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Source Evidence Context</span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">
                      Section: {currentEvidence.sourceSection}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative border-l-4 border-l-cyan-500">
                    <p className="text-xs text-slate-800 leading-relaxed italic">
                      "{currentEvidence.evidenceText}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                <button className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-white transition-colors">
                  Override Extraction
                </button>
                <button className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shadow">
                  Accept Verification
                </button>
              </div>
            </div>

            {/* AI Reasoning Log Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="material-symbols-outlined text-base">memory</span> AI Reasoning Log & Confidence Trace
              </h4>

              <div className="space-y-3">
                {(currentEvidence.reasoningLog || []).map((log, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${log.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`} />
                    <div>
                      <p className="font-bold text-[#0B1C30]">{log.title}</p>
                      <p className="text-slate-500 mt-0.5">{log.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
