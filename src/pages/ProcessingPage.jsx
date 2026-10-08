import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { subscribeToRunEvents } from '../services/apiClient';

const REAL_PIPELINE_STAGES = [
  { key: 'RESOLVING_JOB', label: '1. Resolving Job Requirements & Competency Weights' },
  { key: 'EXTRACTING_FIELDS', label: '2. Parsing Structured Candidate Facts & Skills' },
  { key: 'DETECTING_INJECTION', label: '3. Auditing Adversarial Directives & Prompt Injections' },
  { key: 'REDACTING_PII', label: '4. Applying Blind Demographic & Name Redaction' },
  { key: 'MATCHING_REQUIREMENTS', label: '5. LLM Grounded Requirement & Quote Extraction' },
  { key: 'GROUNDING_EVIDENCE', label: '6. Strict Verbatim Offset Verification & Anti-Hallucination' },
  { key: 'CALCULATING_SCORE', label: '7. Deterministic Mathematical Scoring Formula' },
  { key: 'AUDIT_LOGGING', label: '8. Committing Immutable AI Divergence Audit Record' }
];

export default function ProcessingPage({ 
  pendingAnalysis, 
  onCompleteAnalysis, 
  onNavigate, 
  mobileOpen, 
  setMobileOpen,
  analysisError,
  onClearError,
  user,
  onSignOut
}) {
  const [completedStages, setCompletedStages] = useState(new Set());
  const [currentStageKey, setCurrentStageKey] = useState('RESOLVING_JOB');
  const [stageMetadata, setStageMetadata] = useState({});

  useEffect(() => {
    if (!pendingAnalysis) return;

    // Trigger analysis immediately on mount
    onCompleteAnalysis();

    if (!pendingAnalysis.runId) return;

    // Subscribe to real Server-Sent Events from backend (B16 fix)
    const unsubscribe = subscribeToRunEvents(pendingAnalysis.runId, {
      onInit: (data) => {
        if (data.stages && data.stages.length > 0) {
          const finished = new Set(data.stages.map(s => s.stage));
          setCompletedStages(finished);
        }
      },
      onStage: (entry) => {
        setCompletedStages(prev => new Set([...prev, entry.stage]));
        setCurrentStageKey(entry.stage);
        if (entry.meta) {
          setStageMetadata(prev => ({ ...prev, [entry.stage]: entry.meta }));
        }
      },
      onComplete: (data) => {
        const allKeys = new Set(REAL_PIPELINE_STAGES.map(s => s.key));
        setCompletedStages(allKeys);
      },
      onError: (err) => {
        // SSE closed or completed
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [pendingAnalysis?.runId]);

  const progressPercent = Math.min(
    100,
    Math.round((completedStages.size / REAL_PIPELINE_STAGES.length) * 100)
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-body-md text-[#0B1C30]">
      <Sidebar currentRoute="/analyze" onNavigate={onNavigate} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} user={user} onSignOut={onSignOut} />

      <main className="flex-1 md:ml-[280px] p-6 lg:p-12 min-h-screen flex flex-col justify-center items-center relative overflow-hidden">
        {/* Background Decorative Rings */}
        <div className="absolute inset-0 opacity-10 pointer-events-none flex justify-center items-center">
          <div className="w-[600px] h-[600px] rounded-full border border-primary border-dashed animate-spin"></div>
        </div>

        {/* Processing Container Card */}
        <div className="relative z-10 w-full max-w-xl bg-white rounded-2xl border border-slate-200 p-8 lg:p-10 shadow-xl space-y-8">
          {analysisError ? (
            /* Error State with Real Failure Details */
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-600 border border-red-200">
                <span className="material-symbols-outlined text-3xl">error</span>
              </div>

              <div className="space-y-2">
                <h2 className="font-display text-2xl font-bold text-red-600">Analysis Failed</h2>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  {analysisError}
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-500 font-mono break-all space-y-1">
                <div>File: {pendingAnalysis?.file?.name || pendingAnalysis?.files?.[0]?.name || "Unknown"}</div>
                {pendingAnalysis?.runId && <div>Run ID: {pendingAnalysis.runId}</div>}
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    if (onClearError) onClearError();
                    onNavigate('/analyze');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-all"
                >
                  Return to Upload
                </button>
                <button
                  onClick={() => {
                    if (onClearError) onClearError();
                    setCompletedStages(new Set());
                    onCompleteAnalysis();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-blue-600 text-white text-sm font-semibold transition-all shadow-md"
                >
                  Retry Analysis
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Icon & Title Header */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-primary relative">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping"></div>
                  <span className="material-symbols-outlined text-3xl">psychology</span>
                </div>

                <h2 className="font-display text-2xl font-bold text-[#0B1C30]">
                  {pendingAnalysis?.mode === 'bulk' ? 'Bulk Analysis in Progress...' : 'Executing Real Evaluation Pipeline...'}
                </h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Processing <span className="font-semibold text-slate-800">{pendingAnalysis?.file?.name || (pendingAnalysis?.files?.length ? `${pendingAnalysis.files.length} resumes` : "Candidate Resume")}</span> through real-time factual grounding and audit stages.
                </p>
              </div>

              {/* Real Pipeline Stages List (B16 fix: Real SSE Stage Events) */}
              <div className="space-y-2.5">
                {REAL_PIPELINE_STAGES.map((step, idx) => {
                  const isDone = completedStages.has(step.key);
                  const isActive = !isDone && (currentStageKey === step.key || completedStages.size === idx);

                  return (
                    <div 
                      key={step.key}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        isDone ? 'bg-green-50/50 border-green-200' :
                        isActive ? 'bg-blue-50 border-blue-200 shadow-sm' :
                        'bg-slate-50/40 border-slate-100 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isDone ? (
                          <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-sm font-bold">check</span>
                          </div>
                        ) : isActive ? (
                          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0"></div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-slate-300 shrink-0"></div>
                        )}

                        <span className={`text-xs ${
                          isDone ? 'text-slate-700 font-medium' :
                          isActive ? 'text-primary font-bold' :
                          'text-slate-400'
                        }`}>
                          {step.label}
                        </span>
                      </div>

                      {isDone && (
                        <span className="text-[10px] uppercase font-bold text-green-700 tracking-wider bg-green-100/60 px-2 py-0.5 rounded">
                          Verified
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Pipeline Execution Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
