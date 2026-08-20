import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';

export default function ProcessingPage({ pendingAnalysis, onCompleteAnalysis, onNavigate, mobileOpen, setMobileOpen }) {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { id: 1, label: "Resume uploaded" },
    { id: 2, label: "Extracting text" },
    { id: 3, label: "Detecting resume sections" },
    { id: 4, label: "Extracting candidate fields" },
    { id: 5, label: "Verifying evidence" },
    { id: 6, label: "Comparing with job description" },
    { id: 7, label: "Generating fit report" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setTimeout(() => {
            onCompleteAnalysis();
          }, 400);
          return prev;
        }
      });
    }, 450);

    return () => clearInterval(timer);
  }, []);

  const progressPercent = Math.round((currentStep / steps.length) * 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-body-md text-[#0B1C30]">
      <Sidebar currentRoute="/analyze" onNavigate={onNavigate} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <main className="flex-1 md:ml-[280px] p-6 lg:p-12 min-h-screen flex flex-col justify-center items-center relative overflow-hidden">
        {/* Background Decorative Rings */}
        <div className="absolute inset-0 opacity-10 pointer-events-none flex justify-center items-center">
          <div className="w-[600px] h-[600px] rounded-full border border-primary border-dashed animate-spin"></div>
        </div>

        {/* Processing Container Card */}
        <div className="relative z-10 w-full max-w-xl bg-white rounded-2xl border border-slate-200 p-8 lg:p-10 shadow-xl space-y-8">
          {/* Icon & Title Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-primary relative">
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping"></div>
              <span className="material-symbols-outlined text-3xl">psychology</span>
            </div>

            <h2 className="font-display text-2xl font-bold text-[#0B1C30]">Analyzing Candidate...</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Extracting and verifying evidence from <span className="font-semibold text-slate-800">{pendingAnalysis?.file?.name || "Uploaded Resume"}</span> against the intelligence matrix.
            </p>
          </div>

          {/* Pipeline Steps List */}
          <div className="space-y-2.5">
            {steps.map((step) => {
              const isCompleted = step.id < currentStep;
              const isActive = step.id === currentStep;

              return (
                <div 
                  key={step.id}
                  className={`flex items-center gap-3.5 p-3.5 rounded-xl border transition-all ${
                    isCompleted ? 'bg-green-50/50 border-green-200' :
                    isActive ? 'bg-blue-50 border-blue-200 shadow-sm' :
                    'bg-slate-50/50 border-slate-100 opacity-60'
                  }`}
                >
                  {isCompleted ? (
                    <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-sm font-bold">check</span>
                    </div>
                  ) : isActive ? (
                    <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0"></div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 shrink-0"></div>
                  )}

                  <span className={`text-sm ${
                    isCompleted ? 'text-slate-700 font-medium' :
                    isActive ? 'text-primary font-bold' :
                    'text-slate-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-500">
              <span>Analysis Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
