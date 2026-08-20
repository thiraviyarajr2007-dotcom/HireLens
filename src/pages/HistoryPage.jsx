import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';

export default function HistoryPage({ historyList, onNavigate, mobileOpen, setMobileOpen }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = historyList.filter(h => 
    h.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-body-md text-[#0B1C30]">
      <Sidebar currentRoute="/history" onNavigate={onNavigate} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <TopHeader title="Analysis History" onNavigate={onNavigate} onToggleMobile={() => setMobileOpen(true)} />

        <main className="p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-display font-bold text-[#0B1C30]">Analysis History & Logs</h1>
              <p className="text-sm text-slate-500 mt-1">Review past candidate evaluations and verified evidence reports.</p>
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by candidate or role..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {filteredHistory.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-primary mx-auto flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl">history</span>
                </div>
                <h3 className="font-bold text-lg text-[#0B1C30]">No analysis history found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Completed resume evaluations and evidence reports will automatically be recorded in your history log.
                </p>
                <div className="pt-2 flex justify-center">
                  <button 
                    onClick={() => onNavigate('/analyze')}
                    className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-colors shadow"
                  >
                    Start First Analysis
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-4 px-6">Candidate</th>
                      <th className="py-4 px-6">Target Role</th>
                      <th className="py-4 px-6">Fit Score</th>
                      <th className="py-4 px-6">Evaluation Date</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-bold text-[#0B1C30]">
                          {item.candidateName}
                        </td>
                        <td className="py-4 px-6 text-slate-600">{item.role}</td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                            {item.fitScore}%
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500">{item.date}</td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold uppercase tracking-wider border border-green-200 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button 
                            onClick={() => onNavigate(`/candidate/${item.candidateId}`)}
                            className="px-4 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white font-semibold text-xs transition-colors inline-flex items-center gap-1"
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
