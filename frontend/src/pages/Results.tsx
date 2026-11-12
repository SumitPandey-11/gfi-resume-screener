import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FileText, Search } from 'lucide-react';

const API_URL = "https://gfi-resume-screener.onrender.com";

export default function Results() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'lca' | 'uiux'>('lca');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const rowsPerPage = 5;
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API_URL}/candidates`).then(res => setCandidates(res.data));
  }, []);

  // 1. Filter by Search
  const filteredCandidates = candidates.filter(c => 
    c.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2. Sort by Active Tab
  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    return activeTab === 'lca' ? b.lca_score - a.lca_score : b.uiux_score - a.uiux_score;
  });

  // 3. Pagination
  const totalPages = Math.ceil(sortedCandidates.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentCandidates = sortedCandidates.slice(startIndex, startIndex + rowsPerPage);

  // 4. Dynamic Badge Helper
  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-[#E6FFFB] text-[#0F766E] border-[#0F766E]/30'; 
    if (score >= 75) return 'bg-blue-50 text-blue-700 border-blue-200'; 
    if (score >= 60) return 'bg-amber-50 text-amber-700 border-amber-200'; 
    return 'bg-gray-100 text-gray-600 border-gray-300'; 
  };

  return (
    <div className="h-full p-6 md:p-8 flex flex-col gap-6 animate-fade-in bg-[#F4F8F8] overflow-y-auto no-scrollbar">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 shrink-0">
        <div>
          <h1 className="text-[22px] font-bold text-[#123C46]">Candidate Ranking</h1>
          <p className="text-[14px] text-[#64748B] mt-1">Explore candidate matches, compare job-specific skills, and identify resumes requiring HR review.</p>
        </div>
        
        {/* TAB SWITCHER */}
        <div className="flex space-x-1 bg-white p-1 rounded-xl border border-[#DCE7E8] shadow-sm w-max">
          <button
            onClick={() => { setActiveTab('lca'); setCurrentPage(1); }}
            className={`px-6 py-2 rounded-lg font-bold text-[13px] transition-all duration-200 ${
              activeTab === 'lca' ? 'bg-[#0F766E] text-white shadow-md' : 'text-[#64748B] hover:bg-[#F4F8F8]'
            }`}
          >
            LCA Rankings
          </button>
          <button
            onClick={() => { setActiveTab('uiux'); setCurrentPage(1); }}
            className={`px-6 py-2 rounded-lg font-bold text-[13px] transition-all duration-200 ${
              activeTab === 'uiux' ? 'bg-[#0F766E] text-white shadow-md' : 'text-[#64748B] hover:bg-[#F4F8F8]'
            }`}
          >
            UI/UX Rankings
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative w-full max-w-md shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
        <input 
          type="text" 
          placeholder="Search candidate by filename..." 
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DCE7E8] rounded-lg text-[14px] text-[#172B32] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all outline-none"
        />
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-xl border border-[#DCE7E8] shadow-sm flex flex-col shrink-0">
        
        <div className="overflow-x-auto no-scrollbar w-full rounded-t-xl">
          <table className="w-full text-left border-collapse min-w-[900px]">
            
            {/* STICKY TABLE HEADER */}
            <thead className="sticky top-0 z-10 bg-[#F8FAFC] border-b border-[#DCE7E8]">
              <tr className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="px-6 py-4 w-20 text-left">Rank</th>
                <th className="px-6 py-4 text-left">Candidate</th>
                <th className="px-6 py-4 w-28 text-left">Match Score</th>
                <th className="px-6 py-4 text-left">Key Matches</th>
                <th className="px-6 py-4 w-44 text-left">Classification</th>
                <th className="px-6 py-4 w-28 text-right">Action</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-[#DCE7E8]">
              {currentCandidates.map((c, index) => {
                const actualRank = startIndex + index + 1;
                const score = activeTab === 'lca' ? c.lca_score : c.uiux_score;
                const skills = c.skills || [];
                
                return (
                  <tr 
                    key={c.id} 
                    onClick={() => navigate(`/candidate/${c.id}`)} 
                    className="hover:bg-[#F4F8F8] transition-colors cursor-pointer group h-[58px]"
                  >
                    <td className="px-6 py-3 text-[14px] text-[#64748B] font-bold">#{actualRank}</td>
                    
                    <td className="px-6 py-3">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-[#0F766E]" />
                        <span className="font-semibold text-[#172B32] text-[14px] truncate max-w-[250px]" title={c.filename}>
                          {c.filename}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[12px] font-bold border ${getScoreBadge(score)}`}>
                        {score.toFixed(1)}%
                      </span>
                    </td>
                    
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {skills.length > 0 ? (
                          <>
                            {skills.slice(0, 3).map((skill: string) => (
                              <span key={skill} className="bg-[#E6FFFB] text-[#0F766E] px-2.5 py-1 rounded-md text-[11px] font-bold border border-[#0F766E]/10">
                                {skill}
                              </span>
                            ))}
                            {skills.length > 3 && (
                              <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-md text-[11px] font-bold" title={skills.slice(3).join(', ')}>
                                +{skills.length - 3}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[#94A3B8] text-[12px] italic">No direct matches</span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-3">
                      <span className={`inline-block px-3 py-1 rounded-md text-[11px] font-bold truncate max-w-full ${
                        c.classification.includes('Strong') ? 'bg-green-50 text-green-700 border border-green-200' :
                        c.classification.includes('Both') ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        c.classification.includes('Uncertain') ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                        'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {c.classification}
                      </span>
                    </td>

                    <td className="px-6 py-3 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/candidate/${c.id}`); }} 
                        className="text-[12px] font-bold text-[#0F766E] bg-[#E6FFFB] px-3 py-1.5 rounded-lg border border-[#0F766E]/20 hover:bg-[#2DD4BF] hover:text-white transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {currentCandidates.length === 0 && (
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <Search className="w-10 h-10 text-[#94A3B8] mb-4" />
              <p className="text-[16px] font-bold text-[#123C46]">No candidates found</p>
              <p className="text-[14px] text-[#64748B] mt-1">Try adjusting your search or upload new resumes.</p>
            </div>
          )}
        </div>

        {/* PAGINATION FOOTER */}
        {currentCandidates.length > 0 && (
          <div className="px-6 py-4 border-t border-[#DCE7E8] bg-white flex flex-col md:flex-row justify-between items-center gap-4 rounded-b-xl">
            <p className="text-[13px] text-[#64748B]">
              Showing <span className="font-bold text-[#123C46]">{startIndex + 1}–{Math.min(startIndex + rowsPerPage, sortedCandidates.length)}</span> of <span className="font-bold text-[#123C46]">{sortedCandidates.length}</span> candidates
            </p>
            
            <div className="flex items-center space-x-1">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#DCE7E8] text-[#64748B] hover:bg-[#F4F8F8] disabled:opacity-40 transition">«</button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#DCE7E8] text-[#64748B] hover:bg-[#F4F8F8] disabled:opacity-40 transition">‹</button>
              <span className="px-4 text-[13px] font-bold text-[#123C46]">Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#DCE7E8] text-[#64748B] hover:bg-[#F4F8F8] disabled:opacity-40 transition">›</button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#DCE7E8] text-[#64748B] hover:bg-[#F4F8F8] disabled:opacity-40 transition">»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}