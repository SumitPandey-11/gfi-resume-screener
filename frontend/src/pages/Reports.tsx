import { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, FileSpreadsheet, Users, CheckCircle2, AlertCircle } from 'lucide-react';

const API_URL = "https://gfi-resume-screener.onrender.com";

export default function Reports() {
  const [stats, setStats] = useState({ total: 0, strong: 0, manual: 0, shortlisted: 0 });

  useEffect(() => {
    axios.get(`${API_URL}/candidates`).then(res => {
      const candidates = res.data;
      let strong = 0;
      let manual = 0;
      let shortlisted = 0;

      candidates.forEach((c: any) => {
        if (c.classification.includes('Strong') || c.classification.includes('Both')) strong++;
        if (c.classification.includes('Uncertain') || c.classification.includes('Suitable')) manual++;
        if (c.hr_status === 'Shortlisted') shortlisted++;
      });

      setStats({ total: candidates.length, strong, manual, shortlisted });
    });
  }, []);

  const handleDownloadCSV = () => {
    // This triggers the FastAPI CSV download
    window.open(`${API_URL}/reports/export/csv`, '_blank');
  };

  return (
    <div className="h-full p-6 md:p-8 flex flex-col gap-6 animate-fade-in bg-[#F4F8F8] overflow-y-auto no-scrollbar">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 shrink-0">
        <div>
          <h1 className="text-[22px] font-bold text-[#123C46]">Recruitment Reports</h1>
          <p className="text-[14px] text-[#64748B] mt-1">Analyze high-level recruitment metrics and export raw data for offline review.</p>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <div className="bg-white p-5 rounded-xl border border-[#DCE7E8] shadow-sm flex items-center">
          <div className="p-3 bg-[#E6FFFB] text-[#0F766E] rounded-lg mr-4"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider">Total Candidates</p>
            <p className="text-[28px] font-bold text-[#123C46]">{stats.total}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-[#DCE7E8] shadow-sm flex items-center">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg mr-4"><CheckCircle2 className="w-6 h-6" /></div>
          <div>
            <p className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider">Strong Matches</p>
            <p className="text-[28px] font-bold text-[#16A34A]">{stats.strong}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#DCE7E8] shadow-sm flex items-center">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg mr-4"><AlertCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider">Shortlisted by HR</p>
            <p className="text-[28px] font-bold text-[#F59E0B]">{stats.shortlisted}</p>
          </div>
        </div>
      </div>

      {/* EXPORT CARD */}
      <div className="bg-white rounded-xl border border-[#DCE7E8] shadow-sm flex flex-col shrink-0">
        <div className="p-6 border-b border-[#DCE7E8]">
          <h3 className="text-[16px] font-bold text-[#123C46]">Download Data</h3>
          <p className="text-[13px] text-[#64748B] mt-1">Export all candidate screening data into a CSV file for Excel or Google Sheets.</p>
        </div>
        
        <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-[#F8FAFC] rounded-b-xl">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white border border-[#DCE7E8] rounded-xl flex items-center justify-center shadow-sm">
              <FileSpreadsheet className="w-8 h-8 text-[#16A34A]" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-[#123C46]">candidate_report.csv</p>
              <p className="text-[12px] text-[#64748B]">Contains all candidates, scores, classifications, and HR notes.</p>
            </div>
          </div>

          <button 
            onClick={handleDownloadCSV}
            className="bg-[#0F766E] text-white px-6 py-3 rounded-lg font-bold text-[14px] shadow-sm hover:bg-[#0b5c55] transition flex items-center gap-2 whitespace-nowrap w-full md:w-auto justify-center"
          >
            <Download className="w-5 h-5" /> Download CSV
          </button>
        </div>
      </div>

    </div>
  );
}