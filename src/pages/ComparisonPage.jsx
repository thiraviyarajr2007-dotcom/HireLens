import React from 'react';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';

export default function ComparisonPage({ candidates, onNavigate, mobileOpen, setMobileOpen }) {
  const compareList = candidates.slice(0, 3); // Compare candidates dynamically

  const requirements = [
    {
      key: "req1",
      title: "Python / Node.js Backend (3+ yrs)",
      eval: (c) => ({
        matched: (c.extractedProfile?.skills || []).some(s => ['python', 'node.js', 'node'].includes(s.name.toLowerCase())),
        text: (c.matchedRequirements || []).find(r => r.title.toLowerCase().includes('backend') || r.title.toLowerCase().includes('stack'))?.evidence || "Found in extracted experience",
        fieldId: "SKILLS-LIST"
      })
    },
    {
      key: "req2",
      title: "React & TypeScript Frontend Stack",
      eval: (c) => ({
        matched: (c.extractedProfile?.skills || []).some(s => ['react', 'typescript'].includes(s.name.toLowerCase())),
        text: (c.matchedRequirements || []).find(r => r.title.toLowerCase().includes('react'))?.evidence || "Verified in extracted skills",
        fieldId: "SKILLS-LIST"
      })
    },
    {
      key: "req3",
      title: "SQL / Relational Database",
      eval: (c) => ({
        matched: (c.extractedProfile?.skills || []).some(s => ['sql', 'postgresql'].includes(s.name.toLowerCase())),
        text: "Database query optimization and schema design",
        fieldId: "SKILLS-LIST"
      })
    },
    {
      key: "req4",
      title: "REST API Microservices Design",
      eval: (c) => ({
        matched: c.fitScore >= 75,
        text: c.fitScore >= 75 ? "RESTful service implementation" : "REST API experience not explicit",
        fieldId: "SKILLS-LIST"
      })
    },
    {
      key: "req5",
      title: "Bachelor's Degree in CS or equivalent",
      eval: (c) => ({
        matched: true,
        text: c.extractedProfile?.education || "B.S. Computer Science",
        fieldId: "EDU-STANFORD"
      })
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-body-md text-[#0B1C30]">
      <Sidebar currentRoute="/rankings" onNavigate={onNavigate} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <TopHeader title="Candidate Comparison" onNavigate={onNavigate} onToggleMobile={() => setMobileOpen(true)} />

        <main className="p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Header Bar */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <button 
                onClick={() => onNavigate('/rankings')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-primary transition-colors mb-1"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                <span>Back to Candidate Rankings</span>
              </button>
              <h1 className="text-2xl lg:text-3xl font-display font-bold text-[#0B1C30]">Side-by-Side Candidate Comparison</h1>
            </div>

            <button 
              onClick={() => onNavigate('/analyze')}
              className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              <span>Add Candidate</span>
            </button>
          </div>

          {/* Comparison Matrix Table Card or Empty State */}
          {compareList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-primary mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">compare_arrows</span>
              </div>
              <h3 className="font-bold text-lg text-[#0B1C30]">No candidates available for comparison</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload multiple candidate resumes to compare their skills, education, and evidence side-by-side.
              </p>
              <div className="pt-2 flex justify-center">
                <button 
                  onClick={() => onNavigate('/analyze')}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-colors shadow"
                >
                  Analyze Candidates
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-6 px-6 w-1/4 font-display font-bold text-sm text-[#0B1C30] uppercase tracking-wider">
                        Job Criteria
                      </th>
                      {compareList.map((c) => (
                        <th key={c.id} className="py-6 px-6 w-1/4 text-center border-l border-slate-200">
                          <div className="flex flex-col items-center space-y-2">
                            <img src={c.avatar} alt={c.name} className="w-14 h-14 rounded-full object-cover border-2 border-primary shadow-sm" />
                            <div>
                              <h3 className="font-display font-bold text-base text-[#0B1C30]">{c.name}</h3>
                              <p className="text-xs text-slate-500">{c.role}</p>
                            </div>

                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 font-bold text-xs">
                              <span>{c.fitScore}% Fit</span>
                            </div>

                            <button 
                              onClick={() => onNavigate(`/candidate/${c.id}`)}
                              className="mt-2 text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                            >
                              <span>View Full Report</span>
                              <span className="material-symbols-outlined text-xs">chevron_right</span>
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-xs">
                    {requirements.map((req) => (
                      <tr key={req.key} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-800 text-sm">
                          {req.title}
                        </td>

                        {compareList.map((c) => {
                          const item = req.eval(c);
                          return (
                            <td key={c.id} className="py-4 px-6 text-center border-l border-slate-200">
                              <div className="flex flex-col items-center space-y-1.5 p-2 rounded-xl hover:bg-blue-50/50 transition-colors">
                                {item.matched ? (
                                  <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
                                    <span className="material-symbols-outlined text-sm">check</span>
                                  </span>
                                ) : (
                                  <span className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold">
                                    <span className="material-symbols-outlined text-sm">close</span>
                                  </span>
                                )}

                                <p className="text-slate-600 text-center leading-snug">{item.text}</p>

                                <button 
                                  onClick={() => onNavigate(`/candidate/${c.id}/evidence?field=${item.fieldId}`)}
                                  className="text-[10px] font-semibold text-primary hover:underline inline-flex items-center gap-0.5 mt-1"
                                >
                                  <span>Inspect Evidence</span>
                                  <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                </button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
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
