import React, { useState, useRef, useEffect } from 'react';
import demoVideo from '../assets/HireLens_product_demo_teaser_16x9.mp4';

export default function LandingPage({ onNavigate, user, onSignOut }) {
  const [showFloatingVideo, setShowFloatingVideo] = useState(true);
  const [isFloatingMuted, setIsFloatingMuted] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPlayingMain, setIsPlayingMain] = useState(false);
  const [activeTab, setActiveTab] = useState('scorecard'); // 'scorecard' | 'evidence' | 'questions'
  const [copiedQuestion, setCopiedQuestion] = useState(null);

  const mainVideoRef = useRef(null);

  // Fallback video URL array for GitHub Pages, local dev, or direct root hosting
  const baseUrl = import.meta.env.BASE_URL || './';
  const publicVideoFallback = `${baseUrl}HireLens_product_demo_teaser_16x9.mp4`.replace(/\/\//g, '/');

  const handleToggleMainPlay = () => {
    if (mainVideoRef.current) {
      if (mainVideoRef.current.paused) {
        mainVideoRef.current.play();
        setIsPlayingMain(true);
      } else {
        mainVideoRef.current.pause();
        setIsPlayingMain(false);
      }
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedQuestion(id);
    setTimeout(() => setCopiedQuestion(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B1C30] flex flex-col font-body-md relative selection:bg-primary/20 overflow-x-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-tr from-blue-400/15 via-cyan-300/20 to-indigo-500/15 blur-[120px] pointer-events-none rounded-full -z-10"></div>
      <div className="absolute top-[800px] right-0 w-[600px] h-[500px] bg-cyan-400/10 blur-[140px] pointer-events-none rounded-full -z-10"></div>

      {/* Floating Compact Video Widget (Bottom-Right) */}
      {showFloatingVideo && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-[360px] bg-[#0B1C30] text-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] border border-cyan-500/30 overflow-hidden transition-all duration-300 transform hover:scale-[1.01]">
          {/* Widget Header Bar */}
          <div className="px-4 py-2.5 bg-slate-900/95 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="font-display font-bold text-xs text-white tracking-wide">HireLens Live Teaser</span>
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

          {/* Video Container with Multi-Source Fallbacks */}
          {!isMinimized && (
            <div className="relative aspect-video w-full bg-black group">
              <video 
                autoPlay 
                muted={isFloatingMuted} 
                loop 
                playsInline
                preload="auto"
                controls
                className="w-full h-full object-cover"
              >
                <source src={demoVideo} type="video/mp4" />
                <source src={publicVideoFallback} type="video/mp4" />
                <source src="./HireLens_product_demo_teaser_16x9.mp4" type="video/mp4" />
                <source src="HireLens_product_demo_teaser_16x9.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Unmute Floating Button Overlay */}
              {isFloatingMuted && (
                <button 
                  onClick={() => setIsFloatingMuted(false)}
                  className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold hover:bg-primary transition-all flex items-center gap-1.5 border border-white/20 shadow-md"
                >
                  <span className="material-symbols-outlined text-sm text-cyan-400">volume_off</span>
                  <span>Click to Unmute</span>
                </button>
              )}
            </div>
          )}

          {/* Widget Footer */}
          {!isMinimized && (
            <div className="p-3 bg-slate-900/95 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium truncate max-w-[190px]">16:9 Evidence Engine Demo</span>
              <button 
                onClick={() => { setShowFloatingVideo(false); onNavigate('/analyze'); }}
                className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold transition-all shadow flex items-center gap-1"
              >
                <span>Try Analyzer</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 px-6 lg:px-12 py-3.5 flex items-center justify-between transition-all">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('/')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#004AC6] to-[#0f69dc] flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>lens_blur</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-display font-bold text-[#0B1C30] tracking-tight leading-none">HireLens</h1>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-[10px] font-bold text-primary tracking-wider uppercase">AI v2.4</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-0.5">Zero-Hallucination Talent Intelligence</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-7">
          <button onClick={() => onNavigate('/dashboard')} className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors flex items-center gap-1.5">
            <span className="material-symbols-outlined text-lg">dashboard</span>
            <span>Dashboard</span>
          </button>
          <button onClick={() => onNavigate('/rankings')} className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors flex items-center gap-1.5">
            <span className="material-symbols-outlined text-lg">leaderboard</span>
            <span>Rankings</span>
          </button>
          <button onClick={() => onNavigate('/bulk-analyze')} className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors flex items-center gap-1.5">
            <span className="material-symbols-outlined text-lg">cloud_upload</span>
            <span>Bulk Screening</span>
          </button>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onNavigate('/dashboard')}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Dashboard
              </button>
              <button 
                onClick={onSignOut}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onNavigate('/login')}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => onNavigate('/signup')}
                className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all shadow-sm"
              >
                Get Started
              </button>
            </div>
          )}
          <button 
            onClick={() => onNavigate('/analyze')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-bold text-sm hover:opacity-95 transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 hover:translate-y-[-1px]"
          >
            <span className="material-symbols-outlined text-lg">psychology</span>
            <span>Analyze Resume</span>
          </button>
        </div>
      </header>

      {/* Main Hero Section */}
      <section className="relative px-6 lg:px-12 pt-16 pb-12 max-w-7xl mx-auto w-full flex flex-col items-center text-center">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50/80 backdrop-blur-md border border-blue-200 text-primary text-xs font-bold uppercase tracking-wider mb-6 shadow-xs">
          <span className="material-symbols-outlined text-base text-cyan-600">verified_user</span>
          <span>Verifiable Evidence • Anti-Bias Engine • Deterministic Scoring</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0B1C30] max-w-5xl leading-[1.12] mb-6">
          Evidence-Based AI Resume Analysis <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 bg-clip-text text-transparent">
            Built for High-Stakes Hiring.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-3xl mb-10 leading-relaxed font-normal">
          Tired of opaque 0–100 AI scores? HireLens parses resumes, neutralizes unconscious demographic bias, extracts verbatim textual evidence for every competency, and generates surgical interview questions in seconds.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-14">
          <button 
            onClick={() => onNavigate('/analyze')}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-primary via-blue-600 to-indigo-600 text-white font-bold text-base hover:opacity-95 transition-all shadow-lg hover:shadow-xl hover:translate-y-[-2px] flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined text-2xl">document_scanner</span>
            <span>Upload & Analyze Resume</span>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>

          <button 
            onClick={() => {
              const videoElement = document.getElementById('main-video-player');
              if (videoElement) {
                videoElement.scrollIntoView({ behavior: 'smooth' });
                mainVideoRef.current?.play();
                setIsPlayingMain(true);
              }
            }}
            className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-base hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2.5"
          >
            <span className="material-symbols-outlined text-2xl text-cyan-600">play_circle</span>
            <span>Watch 2-Min Walkthrough</span>
          </button>
        </div>

        {/* Verified Impact Metrics Pill Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm mb-16">
          <div className="p-3 text-center border-r border-slate-100 last:border-0">
            <p className="font-display text-2xl lg:text-3xl font-extrabold text-[#0B1C30]">76%</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Faster Screening</p>
          </div>
          <div className="p-3 text-center border-r border-slate-100 last:border-0">
            <p className="font-display text-2xl lg:text-3xl font-extrabold text-cyan-600">89%</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Transferable Skills</p>
          </div>
          <div className="p-3 text-center border-r border-slate-100 last:border-0">
            <p className="font-display text-2xl lg:text-3xl font-extrabold text-blue-600">100%</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Verbatim Grounding</p>
          </div>
          <div className="p-3 text-center">
            <p className="font-display text-2xl lg:text-3xl font-extrabold text-green-600">Zero</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Demographic Bias</p>
          </div>
        </div>

        {/* SHOWCASE VIDEO PLAYER CARD (Runs on GitHub Deploy & Localhost) */}
        <div id="main-video-player" className="w-full max-w-5xl bg-[#0B1C30] rounded-3xl p-4 sm:p-6 lg:p-7 border border-slate-200/20 shadow-2xl text-left space-y-4 glow-cyan relative">
          
          {/* Studio Header Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
              </div>
              <div className="h-4 w-[1px] bg-white/20 mx-1"></div>
              <div className="flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-cyan-400 text-xl">smart_display</span>
                <span className="font-display font-bold text-sm sm:text-base">HireLens Product Demo Teaser (16:9 Official)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>HD 1080p Stream</span>
              </span>
            </div>
          </div>

          {/* High-Fidelity Video Screen */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-inner group">
            <video 
              ref={mainVideoRef}
              controls 
              playsInline
              preload="auto"
              className="w-full h-full object-contain"
              onPlay={() => setIsPlayingMain(true)}
              onPause={() => setIsPlayingMain(false)}
            >
              {/* Prioritized sources: Bundled asset first, then public base URL, then relative */}
              <source src={demoVideo} type="video/mp4" />
              <source src={publicVideoFallback} type="video/mp4" />
              <source src="./HireLens_product_demo_teaser_16x9.mp4" type="video/mp4" />
              <source src="HireLens_product_demo_teaser_16x9.mp4" type="video/mp4" />
              <source src="/HireLens_product_demo_teaser_16x9.mp4" type="video/mp4" />
              Your browser does not support HTML5 video streaming.
            </video>

            {/* Custom Overlay Play Button for First-Click Experience */}
            {!isPlayingMain && (
              <div 
                onClick={handleToggleMainPlay}
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-black/30 group"
              >
                <div className="w-20 h-20 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform border-2 border-white/40">
                  <span className="material-symbols-outlined text-4xl ml-1">play_arrow</span>
                </div>
                <p className="text-white font-bold text-sm mt-4 tracking-wide bg-black/60 px-4 py-1 rounded-full border border-white/10">
                  Click to Play HireLens Product Teaser
                </p>
              </div>
            )}
          </div>

          {/* Pipeline Footnotes Under Video */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-white/70 text-xs">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="material-symbols-outlined text-cyan-400 text-base">document_scanner</span>
              <span>1. Text & Layout Parsing</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="material-symbols-outlined text-green-400 text-base">shield</span>
              <span>2. PII Demographics Redacted</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="material-symbols-outlined text-blue-400 text-base">plagiarism</span>
              <span>3. Verbatim Substring Proof</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="material-symbols-outlined text-purple-400 text-base">psychology</span>
              <span>4. Targeted Interview Prober</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Architecture Bento Grid */}
      <section className="py-20 px-6 lg:px-12 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-primary bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
            Engineered For Accuracy
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0B1C30]">
            The 4 Pillars of HireLens AI Architecture
          </h2>
          <p className="text-slate-600 text-base">
            Moving recruitment from black-box intuition to auditable, evidence-backed decision science.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm card-shadow-hover space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>
            <h3 className="font-display font-bold text-lg text-[#0B1C30]">Verbatim Grounding</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every matched competency is paired with an exact verbatim quote from the candidate's CV. If it isn't in the resume, it's flagged as unverified.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm card-shadow-hover space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">calculate</span>
            </div>
            <h3 className="font-display font-bold text-lg text-[#0B1C30]">Deterministic Math</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Final score = (45% Skills) + (35% Experience) + (20% Impact). No stochastic random score drift across different evaluation runs.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm card-shadow-hover space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">visibility_off</span>
            </div>
            <h3 className="font-display font-bold text-lg text-[#0B1C30]">Anti-Bias Sanitizer</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              PII Redaction engine masks names, gender markers, photos, and personal URLs before AI inference to ensure legally compliant blind screening.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm card-shadow-hover space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">psychology</span>
            </div>
            <h3 className="font-display font-bold text-lg text-[#0B1C30]">Adaptive Prober</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Automatically generates 3 deep technical drill-downs to verify weak claims and 2 STAR-format behavioral questions for the screener.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Live Sample Explorer Preview */}
      <section className="py-16 px-6 lg:px-12 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-6xl mx-auto w-full space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 bg-cyan-100/60 px-3 py-1 rounded-full border border-cyan-200">
                Interactive Audit Preview
              </span>
              <h2 className="font-display text-3xl font-bold text-[#0B1C30] mt-2">
                What a HireLens Evaluation Looks Like
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Explore an actual evaluation output for a Senior Software Engineer candidate.
              </p>
            </div>

            {/* Tab Selectors */}
            <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
              <button 
                onClick={() => setActiveTab('scorecard')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${activeTab === 'scorecard' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:text-[#0B1C30]'}`}
              >
                Fit Scorecard
              </button>
              <button 
                onClick={() => setActiveTab('evidence')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${activeTab === 'evidence' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:text-[#0B1C30]'}`}
              >
                Verbatim Evidence
              </button>
              <button 
                onClick={() => setActiveTab('questions')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${activeTab === 'questions' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:text-[#0B1C30]'}`}
              >
                Generated Questions
              </button>
            </div>
          </div>

          {/* Tab Content Cards */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-md">
            {activeTab === 'scorecard' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-100 pb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-xl font-bold text-[#0B1C30]">Candidate: Alex Mercer</h3>
                      <span className="badge-found">VERIFIED EVALUATION</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">Role: Senior Full Stack Engineer (React, Node.js, AWS)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-display text-3xl font-extrabold text-[#004AC6]">84%</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DETERMINISTIC FIT</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-600">Skills Match (45%)</span>
                      <span className="text-[#0B1C30]">88%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full rounded-full" style={{ width: '88%' }}></div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-600">Experience Depth (35%)</span>
                      <span className="text-[#0B1C30]">80%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-600">Quantified Impact (20%)</span>
                      <span className="text-[#0B1C30]">85%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-slate-700 leading-relaxed">
                  <strong className="text-primary font-bold">Executive Rationale:</strong> Candidate demonstrates verified production React 18 and Node.js microservices experience with proven 38% latency reduction metrics. Identified minor gap in AWS ECS container deployment.
                </div>
              </div>
            )}

            {activeTab === 'evidence' && (
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-slate-800">Verbatim Sentence Grounding</h4>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0B1C30]">React.js Frontend Architecture</span>
                      <span className="badge-found">VERBATIM MATCHED</span>
                    </div>
                    <p className="text-slate-600 font-mono-code bg-white p-2.5 rounded-lg border border-slate-200">
                      "Architected responsive customer-facing dashboard in React 18, cutting initial paint time by 38% for 50k DAU."
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0B1C30]">Node.js & PostgreSQL Scale</span>
                      <span className="badge-found">VERBATIM MATCHED</span>
                    </div>
                    <p className="text-slate-600 font-mono-code bg-white p-2.5 rounded-lg border border-slate-200">
                      "Engineered 15+ REST endpoints in Express/PostgreSQL with connection pooling, maintaining 99.9% uptime under holiday traffic."
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-red-50/40 border border-red-200/80 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-red-900">AWS ECS Container Deployment</span>
                      <span className="badge-not-found">UNVERIFIED CLAIM</span>
                    </div>
                    <p className="text-red-700 leading-relaxed">
                      AWS listed in skills keywords, but zero project descriptions verify Dockerfile creation or auto-scaling cluster setup.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-slate-800">Targeted Probing Questions for Screeners</h4>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start justify-between gap-3">
                    <div>
                      <span className="px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-800 font-bold text-[10px] uppercase">
                        Technical Deep Dive
                      </span>
                      <p className="font-medium text-slate-800 mt-2 leading-relaxed">
                        "In your React 18 project where you reduced initial paint by 38%, which specific code-splitting or asset caching strategy contributed the most to that improvement?"
                      </p>
                    </div>
                    <button 
                      onClick={() => handleCopy("In your React 18 project where you reduced initial paint by 38%, which specific code-splitting or asset caching strategy contributed the most to that improvement?", 1)}
                      className="text-slate-400 hover:text-cyan-600 p-1 shrink-0"
                      title="Copy Question"
                    >
                      <span className="material-symbols-outlined text-base">
                        {copiedQuestion === 1 ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200/80 text-xs flex items-start justify-between gap-3">
                    <div>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] uppercase">
                        Behavioral Incident Response
                      </span>
                      <p className="font-medium text-slate-800 mt-2 leading-relaxed">
                        "Tell me about a time a critical performance bottleneck slipped into production despite test coverage. How did you coordinate the rollback and diagnose the root cause?"
                      </p>
                    </div>
                    <button 
                      onClick={() => handleCopy("Tell me about a time a critical performance bottleneck slipped into production despite test coverage. How did you coordinate the rollback and diagnose the root cause?", 2)}
                      className="text-slate-400 hover:text-amber-700 p-1 shrink-0"
                      title="Copy Question"
                    >
                      <span className="material-symbols-outlined text-base">
                        {copiedQuestion === 2 ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-12 px-6 lg:px-12 text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>lens_blur</span>
            </div>
            <div>
              <p className="font-display font-bold text-sm text-[#0B1C30]">HireLens AI</p>
              <p className="text-xs text-slate-400">Evidence-First Talent Intelligence Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold">
            <button onClick={() => onNavigate('/analyze')} className="hover:text-primary transition-colors">Analyze Resume</button>
            <button onClick={() => onNavigate('/rankings')} className="hover:text-primary transition-colors">Rankings</button>
            <button onClick={() => onNavigate('/dashboard')} className="hover:text-primary transition-colors">Dashboard</button>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
              <span>GitHub</span>
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </a>
          </div>

          <p className="text-xs text-slate-400">
            © 2026 HireLens AI. All rights reserved. Zero-Hallucination Recruitment.
          </p>
        </div>
      </footer>
    </div>
  );
}
