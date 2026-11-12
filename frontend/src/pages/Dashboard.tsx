import { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { FileCheck, BriefcaseBusiness, Palette, ClipboardCheck, Layers, ArrowRight } from 'lucide-react';
import UploadModal from '../components/UploadModal';

const API_URL = "https://gfi-resume-screener.onrender.com";

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, lca: 0, uiux: 0, both: 0, manual: 0 });
  const [topCandidates, setTopCandidates] = useState<any[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const navigate = useNavigate();

  const fetchDashboardData = () => {
    axios.get(`${API_URL}/candidates`).then(res => {
      const candidates = res.data;
      let lca = 0, uiux = 0, both = 0, manual = 0;
      
      // Calculate KPIs
      candidates.forEach((c: any) => {
        if (c.classification.includes('Both')) both++;
        else if (c.classification.includes('LCA')) lca++;
        else if (c.classification.includes('UI/UX')) uiux++;
        else manual++;
      });

      setStats({ total: candidates.length, lca, uiux, both, manual });

      // Sort candidates by their highest score to get Top 5
      const sorted = [...candidates].sort((a, b) => Math.max(b.lca_score, b.uiux_score) - Math.max(a.lca_score, a.uiux_score));
      setTopCandidates(sorted.slice(0, 5));
    }).catch(err => console.error("Error fetching data:", err));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Chart Data
  const chartData = [
    { name: 'LCA Match', value: stats.lca, color: '#0F766E' },
    { name: 'UI/UX Match', value: stats.uiux, color: '#2DD4BF' },
    { name: 'Both Roles', value: stats.both, color: '#123C46' },
    { name: 'Manual Review', value: stats.manual, color: '#F59E0B' },
  ].filter(item => item.value > 0);

  return (
    <div className="h-full p-6 md:p-8 flex flex-col gap-6 animate-fade-in bg-[#F4F8F8] overflow-y-auto no-scrollbar">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-[22px] font-bold text-[#123C46]">Analytics Dashboard</h1>
          <p className="text-[14px] text-[#64748B] mt-1">Overview of your hiring performance and candidate analytics.</p>
        </div>
        <button 
          onClick={() => setIsUploadOpen(true)} 
          className="bg-[#0F766E] text-white px-5 py-2.5 rounded-lg text-[14px] font-semibold shadow-sm hover:bg-[#0b5c55] transition"
        >
          + Upload Resume
        </button>
      </div>

      {/* 5 KPI CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 shrink-0">
        
        <div className="bg-white p-5 rounded-xl border border-[#DCE7E8] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Total Processed</p>
            <FileCheck className="w-5 h-5 text-[#94A3B8]" />
          </div>
          <p className="text-[28px] font-bold text-[#123C46] leading-none">{stats.total}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#DCE7E8] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">LCA Candidates</p>
            <BriefcaseBusiness className="w-5 h-5 text-[#94A3B8]" />
          </div>
          <p className="text-[28px] font-bold text-[#0F766E] leading-none">{stats.lca}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#DCE7E8] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">UI/UX Candidates</p>
            <Palette className="w-5 h-5 text-[#94A3B8]" />
          </div>
          <p className="text-[28px] font-bold text-[#2DD4BF] leading-none">{stats.uiux}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#DCE7E8] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Both Roles</p>
            <Layers className="w-5 h-5 text-[#94A3B8]" />
          </div>
          <p className="text-[28px] font-bold text-[#123C46] leading-none">{stats.both}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#DCE7E8] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Manual Review</p>
            <ClipboardCheck className="w-5 h-5 text-[#94A3B8]" />
          </div>
          <p className="text-[28px] font-bold text-[#F59E0B] leading-none">{stats.manual}</p>
        </div>

      </div>

      {/* CHARTS & ATTENTION ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0">
        
        {/* PIE CHART */}
        <div className="bg-white p-6 rounded-xl border border-[#DCE7E8] shadow-sm flex flex-col">
          <h3 className="text-[16px] font-bold text-[#123C46] mb-2">Candidate Distribution</h3>
          <div className="flex flex-row items-center justify-between h-48">
            <div className="h-full w-1/2 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" innerRadius="65%" outerRadius="100%" paddingAngle={2} stroke="none">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #DCE7E8', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[24px] font-bold text-[#123C46] leading-none">{stats.total}</span>
                <span className="text-[10px] text-[#64748B] font-semibold mt-1">Total</span>
              </div>
            </div>
            <div className="w-1/2 flex flex-col space-y-3 pl-4 text-[12px] text-[#64748B]">
              <div className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: '#0F766E' }}></span>
                LCA - {stats.lca}
              </div>
              <div className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: '#2DD4BF' }}></span>
                UI/UX - {stats.uiux}
              </div>
              <div className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: '#123C46' }}></span>
                Both Roles - {stats.both}
              </div>
              <div className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: '#F59E0B' }}></span>
                Manual review - {stats.manual}
              </div>
            </div>
          </div>
        </div>

        {/* NEEDS ATTENTION */}
        <div className="bg-white p-6 rounded-xl border border-[#DCE7E8] shadow-sm flex flex-col">
          <h3 className="text-[16px] font-bold text-[#123C46] mb-4">Needs Attention</h3>
          <div className="space-y-4 flex-1">
            <div className="flex items-start">
              <div className="bg-orange-100 text-orange-700 text-[11px] font-bold px-2 py-0.5 rounded-md mt-0.5 whitespace-nowrap mr-3">
                {stats.manual} reviews
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#172B32]">Manual HR verification required.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-[#E6FFFB] text-[#0F766E] text-[11px] font-bold px-2 py-0.5 rounded-md mt-0.5 whitespace-nowrap mr-3">
                {stats.lca + stats.uiux} matches
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#172B32]">Strong matches ready to review.</p>
              </div>
            </div>
            <div className="mt-auto pt-4">
              <button onClick={() => navigate('/results')} className="text-[13px] font-semibold text-[#0F766E] hover:underline flex items-center">
                Review top-ranked candidates <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* TOP MATCHED CANDIDATES TABLE */}
      <div className="bg-white rounded-xl border border-[#DCE7E8] shadow-sm flex flex-col shrink-0">
        <div className="px-6 pt-6 pb-2">
          <h3 className="text-[16px] font-bold text-[#123C46]">Top Matched Candidates</h3>
          <p className="text-[12px] text-[#64748B] mt-1 mb-4">A compact ranking table with real candidate scores, key skills, and classification.</p>
        </div>
        
        <div className="overflow-x-auto no-scrollbar w-full">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="text-[12px] font-semibold text-[#64748B] border-b border-[#DCE7E8]">
                <th className="px-6 py-3">Candidate</th>
                <th className="px-6 py-3">Matched Role</th>
                <th className="px-6 py-3 text-right">Role Match Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE7E8]">
              {topCandidates.map((c) => {
                const isLcaStronger = c.lca_score > c.uiux_score;
                const matchedRole = isLcaStronger ? 'LCA Consultant' : 'UI/UX Intern';
                const roleScore = isLcaStronger ? c.lca_score : c.uiux_score;
                
                return (
                  <tr key={c.id} className="hover:bg-[#F4F8F8] transition-colors group cursor-pointer" onClick={() => navigate(`/candidate/${c.id}`)}>
                    <td className="px-6 py-4 text-[14px] font-semibold text-[#172B32]">{c.filename}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${
                        isLcaStronger 
                          ? 'bg-[#E6FFFB] text-[#0F766E] border-[#0F766E]/20' 
                          : 'bg-[#F0FDF4] text-[#166534] border-[#166534]/20'
                      }`}>
                        {matchedRole}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-[12px] font-bold px-2.5 py-1 rounded-md border ${
                        roleScore > 60 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        {roleScore.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {topCandidates.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-[#64748B] text-[14px]">No candidates processed yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => { setIsUploadOpen(false); fetchDashboardData(); }} 
      />
    </div>
  );
}