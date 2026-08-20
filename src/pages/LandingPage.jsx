import React, { useState } from 'react';

export default function LandingPage({ onNavigate, user, onSignOut }) {
  const [showFloatingVideo, setShowFloatingVideo] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B1C30] flex flex-col font-body-md relative">
      {/* Floating Compact Video Widget (Bottom-Right) */}
      {showFloatingVideo && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-[360px] bg-[#0B1C30] text-white rounded-2xl shadow-2xl border border-white/10 overflow-hidden transition-all duration-300 transform hover:scale-[1.01] animate-bounce-short">
          {/* Widget Header Bar */}
          <div className="px-4 py-2.5 bg-slate-900/90 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span className="font-display font-bold text-xs text-white">Product Demo Teaser</span>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
                title={isMinimized ? "Expand Video" : "Minimize Video"}
              >
                <span className="material-symbols-outlined text-base">
                  {isMinimized ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              <button 
                onClick={() => setShowFloatingVideo(false)}
                className="w-7 h-7 rounded-lg hover:bg-red-500/20 text-white/70 hover:text-red-400 flex items-center justify-center transition-colors"
                title="Close Video"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </div>

          {/* Video Container */}
          {!isMinimized && (
            <div className="relative aspect-video w-full bg-black">
              <video 
                src="/HireLens_product_demo_teaser_16x9.mp4" 
                autoPlay 
                muted={isMuted} 
                loop 
                controls 
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Unmute Floating Button Overlay */}
              {isMuted && (
                <button 
                  onClick={() => setIsMuted(false)}
                  className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold hover:bg-primary transition-all flex items-center gap-1 border border-white/20"
                >
                  <span className="material-symbols-outlined text-xs">volume_off</span>
                  <span>Unmute</span>
                </button>
              )}
            </div>
          )}

          {/* Widget Footer */}
          {!isMinimized && (
            <div className="p-3 bg-slate-900/90 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-white/60 truncate max-w-[180px]">HireLens AI 16:9 Overview</span>
              <button 
                onClick={() => { setShowFloatingVideo(false); onNavigate('/analyze'); }}
                className="px-3 py-1 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1"
              >
                <span>Try Demo</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('/')}>
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-md">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>lens_blur</span>
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-[#0B1C30] leading-none">HireLens</h1>
            <p className="text-[10px] font-label-sm text-primary uppercase tracking-widest mt-0.5">Evidence AI</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <button onClick={() => onNavigate('/dashboard')} className="font-label-md text-sm text-slate-600 hover:text-primary transition-colors">Dashboard</button>
          <button onClick={() => onNavigate('/rankings')} className="font-label-md text-sm text-slate-600 hover:text-primary transition-colors">Candidate Rankings</button>
          <button onClick={() => onNavigate('/bulk-analyze')} className="font-label-md text-sm text-slate-600 hover:text-primary transition-colors">Bulk Analyze</button>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onNavigate('/dashboard')}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Dashboard
              </button>
              <button 
                onClick={onSignOut}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onNavigate('/login')}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => onNavigate('/signup')}
                className="px-4 py-2.5 rounded-lg bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all shadow-sm"
              >
                Create Account
              </button>
            </div>
          )}
          <button 
            onClick={() => onNavigate('/analyze')}
            className="px-5 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all shadow-md flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">psychology</span>
            <span>Analyze a Resume</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 lg:px-12 pt-16 pb-20 max-w-7xl mx-auto w-full flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
          <span className="material-symbols-outlined text-base">verified</span>
          <span>Trust + Transparency + AI Recruitment Intelligence</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0B1C30] max-w-4xl leading-tight mb-6">
          Evidence-Based AI Resume Analysis for Modern Hiring
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
          Stop relying on black-box AI scores. HireLens segments resumes, verifies factual evidence, and traces candidate fit scores directly back to source text.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
          <button 
            onClick={() => onNavigate('/analyze')}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined text-2xl">arrow_forward</span>
            <span>Analyze a Resume Now</span>
          </button>

          {!showFloatingVideo && (
            <button 
              onClick={() => { setShowFloatingVideo(true); setIsMinimized(false); }}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-base hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-3"
            >
              <span className="material-symbols-outlined text-2xl text-primary">play_circle</span>
              <span>Show Floating Video</span>
            </button>
          )}
        </div>

        {/* Hero Section Video Player Card */}
        <div className="w-full max-w-4xl bg-[#0B1C30] rounded-3xl p-4 lg:p-6 border border-slate-200 shadow-2xl text-left space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-cyan-400">videocam</span>
              <span className="font-display font-bold text-sm">HireLens Official Product Teaser (16:9)</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-semibold uppercase">
              HD Video
            </span>
          </div>

          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-lg">
            <video 
              src="/HireLens_product_demo_teaser_16x9.mp4" 
              controls 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 px-6 lg:px-12 text-center text-xs text-slate-500">
        <p>© 2026 HireLens AI. All rights reserved. Zero-Hallucination Evidence-Based Recruitment Intelligence.</p>
      </footer>
    </div>
  );
}
