import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';
import { SAMPLE_JOB_DESCRIPTION } from '../data/mockData';

export default function BulkAnalyzePage({ onStartBulkAnalysis, onNavigate, mobileOpen, setMobileOpen }) {
  const [fileList, setFileList] = useState([]);
  const [jobDescription, setJobDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFilesChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFileList((prev) => [...prev, ...files]);
      setErrorMsg('');
    }
  };

  const handleRemoveFile = (index) => {
    setFileList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUseSampleJD = () => {
    setJobDescription(SAMPLE_JOB_DESCRIPTION);
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (fileList.length === 0) {
      setErrorMsg('Please select at least one resume file.');
      return;
    }
    if (!jobDescription.trim()) {
      setErrorMsg('Please provide a job description.');
      return;
    }

    setErrorMsg('');
    onStartBulkAnalysis(fileList, jobDescription);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-body-md text-[#0B1C30]">
      <Sidebar currentRoute="/bulk-analyze" onNavigate={onNavigate} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <TopHeader title="Bulk Resume Analysis" onNavigate={onNavigate} onToggleMobile={() => setMobileOpen(true)} />

        <main className="p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-[#0B1C30]">Bulk Resume Analysis Pipeline</h1>
            <p className="text-sm text-slate-500 mt-1">
              Upload multiple candidate resumes at once to rank applicants against target role specifications.
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-3">
              <span className="material-symbols-outlined text-xl text-red-600">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Multi-File Upload Zone */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">1</span>
                  <h2 className="text-lg font-display font-bold text-[#0B1C30]">Upload Multiple Resumes</h2>
                </div>
                <span className="text-xs font-medium text-slate-400">Select multiple PDF / DOCX files</span>
              </div>

              <div className="border-2 border-dashed border-slate-300 hover:border-primary rounded-2xl p-8 text-center bg-slate-50/50 transition-colors cursor-pointer relative group">
                <input 
                  type="file" 
                  multiple 
                  accept=".pdf,.docx,.doc" 
                  onChange={handleFilesChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                  </div>
                  <div>
                    <p className="font-bold text-[#0B1C30]">Click to select multiple resume files</p>
                    <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple files at once</p>
                  </div>
                </div>
              </div>

              {/* Uploaded File List */}
              {fileList.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Selected Resumes ({fileList.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                    {fileList.map((file, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className="material-symbols-outlined text-primary text-lg shrink-0">description</span>
                          <span className="text-xs font-semibold text-slate-800 truncate">{file.name}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveFile(idx)}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Job Description Input */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h2 className="text-lg font-display font-bold text-[#0B1C30]">Target Job Description</h2>
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
                rows={6}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste role requirements for candidate ranking evaluation..."
                className="w-full p-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary font-mono leading-relaxed"
              />
            </div>

            {/* Action */}
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
                <span className="material-symbols-outlined text-xl">dataset</span>
                <span>Analyze All Candidates ({fileList.length})</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
