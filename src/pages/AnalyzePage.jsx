import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';
import { SAMPLE_JOB_DESCRIPTION } from '../data/mockData';

export default function AnalyzePage({ onStartAnalysis, onNavigate, mobileOpen, setMobileOpen }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMsg('');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleUseSampleJD = () => {
    setJobDescription(SAMPLE_JOB_DESCRIPTION);
    setErrorMsg('');
  };

  const handleUseSampleResume = () => {
    const sampleText = `ALEX MERCER
Email: alex.mercer@example.com | Phone: +1 555-0192 | San Francisco, CA
LinkedIn: linkedin.com/in/alexmercer

SUMMARY
Senior Full Stack Engineer with 4+ years of hands-on experience building high-performance web applications using React, Node.js, Express, and PostgreSQL. Proven track record of optimizing client-side performance and scaling microservices.

EXPERIENCE
Lead Frontend Developer | CloudScale Systems (2022 - Present)
- Architected customer-facing dashboard in React 18, cutting initial paint time by 38% for 50,000+ daily active users.
- Designed reusable UI component system with TypeScript and TailwindCSS, reducing delivery cycles by 25%.
- Implemented state management using Redux Toolkit and React Query for optimistic UI updates.

Full Stack Engineer | DataFlow Tech (2020 - 2022)
- Engineered 15+ REST endpoints in Node.js and Express with PostgreSQL database indexing, maintaining 99.9% uptime.
- Optimized slow SQL queries with connection pooling, cutting API p95 response latency from 450ms to 120ms.
- Built automated unit and integration tests using Jest and Supertest, achieving 88% test coverage.

SKILLS
Frontend: React, TypeScript, Redux, JavaScript, HTML5, CSS3, TailwindCSS
Backend: Node.js, Express, Python, REST APIs, GraphQL
Databases: PostgreSQL, SQL, Redis
Tools: Git, Docker, Webpack, Vite, Jest

EDUCATION
B.S. in Computer Science | State University (2020)`;

    const mockFile = new File([sampleText], "Alex_Mercer_Senior_FullStack.pdf", { type: "application/pdf" });
    setSelectedFile(mockFile);
    if (!jobDescription.trim()) {
      setJobDescription(SAMPLE_JOB_DESCRIPTION);
    }
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please upload a resume.');
      return;
    }
    if (!jobDescription.trim()) {
      setErrorMsg('Please provide a job description.');
      return;
    }

    setErrorMsg('');
    onStartAnalysis(selectedFile, jobDescription);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-body-md text-[#0B1C30]">
      <Sidebar currentRoute="/analyze" onNavigate={onNavigate} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <TopHeader title="Analyze Candidate" onNavigate={onNavigate} onToggleMobile={() => setMobileOpen(true)} />

        <main className="p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-display font-bold text-[#0B1C30]">Analyze a Candidate Resume</h1>
              <p className="text-sm text-slate-500 mt-1">
                Upload a candidate resume (PDF / DOCX) and verify factual claims against Job Description criteria.
              </p>
            </div>

            <button
              type="button"
              onClick={handleUseSampleResume}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all hover:scale-[1.02] shrink-0"
            >
              <span className="material-symbols-outlined text-base">auto_awesome</span>
              <span>1-Click Demo Profile</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-3">
              <span className="material-symbols-outlined text-xl text-red-600">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Resume Upload */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">1</span>
                  <h2 className="text-lg font-display font-bold text-[#0B1C30]">Upload Candidate Resume</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={handleUseSampleResume}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Load Demo CV
                  </button>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-medium text-slate-400">PDF, DOCX up to 10MB</span>
                </div>
              </div>

              {!selectedFile ? (
                <div className="border-2 border-dashed border-slate-300 hover:border-primary rounded-2xl p-8 lg:p-12 text-center bg-slate-50/50 transition-colors cursor-pointer relative group">
                  <input 
                    type="file" 
                    accept=".pdf,.docx,.doc" 
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-3xl">upload_file</span>
                    </div>
                    <div>
                      <p className="font-bold text-[#0B1C30]">Click to upload or drag & drop</p>
                      <p className="text-xs text-slate-500 mt-1">Supports PDF, DOCX formatting</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">description</span>
                    </div>
                    <div>
                      <p className="font-bold text-[#0B1C30] text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Document'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">check_circle</span> Ready
                    </span>
                    <button 
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors"
                      title="Remove file"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Job Description */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h2 className="text-lg font-display font-bold text-[#0B1C30]">Job Description & Requirements</h2>
                </div>
                <button 
                  type="button"
                  onClick={handleUseSampleJD}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-primary font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  <span>Use Sample JD</span>
                </button>
              </div>

              <textarea 
                rows={8}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste job description requirements, responsibilities, or tech stack criteria here..."
                className="w-full p-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary font-mono focus:ring-1 focus:ring-primary leading-relaxed"
              />

              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Provide explicit requirement points for evidence verification.</span>
                <span>{jobDescription.length} characters</span>
              </div>
            </div>

            {/* Analyze Action */}
            <div className="flex justify-end gap-4">
              <button 
                type="button"
                onClick={() => onNavigate('/dashboard')}
                className="px-6 py-3 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-sm"
              >
                Cancel
              </button>

              <button 
                type="submit"
                className="px-8 py-3.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-md flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-xl">psychology</span>
                <span>Analyze Candidate</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
