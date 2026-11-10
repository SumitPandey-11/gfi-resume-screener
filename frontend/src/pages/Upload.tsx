import { useState } from 'react';
import axios from 'axios';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState<any>(null);
  
  // State for Duplicate Modal
  const [duplicateData, setDuplicateData] = useState<any>(null);

  const handleUpload = async (forceReAnalyze = false) => {
    if (!file) return;
    
    setIsProcessing(true);
    setDuplicateData(null); 
    setReport(null);

    // Simulate a 3-second AI processing delay for the animation
    setTimeout(async () => {
      try {
        const formData = new FormData();
        
        let uploadFile = file;
        let finalFileName = file.name;

        // If the user clicks "Again Analyze", we append a number to the filename
        if (forceReAnalyze) {
          const lastDotIndex = file.name.lastIndexOf('.');
          const baseName = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
          const extension = lastDotIndex !== -1 ? file.name.substring(lastDotIndex) : '';
          
          // Generate a unique timestamp based name to bypass the backend duplicate check
          finalFileName = `${baseName}_${Date.now()}${extension}`;
          
          // Re-create the File object with the new name
          uploadFile = new File([file], finalFileName, { type: file.type });
        }

        formData.append("file", uploadFile);
        
        const res = await axios.post('http://127.0.0.1:8000/analyze-resume', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        setReport(res.data);
      } catch (error: any) {
        const errorMessage = error.response?.data?.detail;
        
        // If it's a duplicate error (and user hasn't clicked force re-analyze yet)
        if (errorMessage === "This resume has already been processed." && !forceReAnalyze) {
          try {
            const allRes = await axios.get('http://127.0.0.1:8000/candidates');
            // Find the first matching filename (without the timestamp)
            const existing = allRes.data.find((c: any) => c.filename.includes(file.name.replace('.pdf', '')));
            
            if (existing) {
              setDuplicateData(existing); 
            } else {
              alert("Duplicate detected, but could not load previous data.");
            }
          } catch (err) {
            alert("Duplicate detected, but failed to fetch previous records.");
          }
        } else {
          alert(errorMessage || "Failed to connect to the server.");
        }
      } finally {
        setIsProcessing(false);
      }
    }, 2000);
  };

  return (
    <div className="p-10 max-w-5xl mx-auto h-full overflow-y-auto no-scrollbar">
      <div className="mb-8">
        <h1 className="page-title">Upload & Analyse Resumes</h1>
        <p className="page-subtitle mt-2">Upload candidate resumes and receive detailed job-specific skill matching.</p>
      </div>

      {/* Upload Zone */}
      {!isProcessing && !report && !duplicateData && (
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-[#DCE7E8] animate-fade-in">
          <div className="border-2 border-dashed border-[#0F766E] bg-[#E6FFFB] p-12 rounded-xl text-center">
            <span className="text-6xl mb-4 block">☁️</span>
            <h3 className="text-xl font-bold text-[#123C46] mb-2">Drag & drop candidate resumes here</h3>
            <p className="text-[#64748B] mb-6">Supported format: PDF</p>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#0F766E] file:text-white hover:file:bg-[#0b5c55] cursor-pointer mb-4"
            />
            <button 
              onClick={() => handleUpload(false)}
              disabled={!file}
              className="bg-[#0F766E] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#0b5c55] transition disabled:bg-gray-400 w-full md:w-auto shadow-lg"
            >
              Analyse & Process Resume
            </button>
          </div>
        </div>
      )}

      {/* Processing Animation */}
      {isProcessing && (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-[#DCE7E8] text-center animate-fade-in">
          <div className="w-20 h-20 border-4 border-[#E6FFFB] border-t-[#0F766E] rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-[#123C46] mb-2">AI is analyzing the resume...</h2>
          <p className="text-[#64748B]">Extracting skills, matching with JDs, and generating HR report.</p>
        </div>
      )}

      {/* --- DUPLICATE RESUME MODAL --- */}
      {duplicateData && (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-orange-200 animate-fade-in max-w-2xl mx-auto mt-10">
          <div className="text-center mb-6">
            <span className="text-5xl mb-4 block">⚠️</span>
            <h2 className="text-2xl font-extrabold text-orange-600 mb-2">Duplicate Resume Detected</h2>
            <p className="text-[#64748B]">This resume was previously uploaded. Here is the previous analysis.</p>
          </div>

          <div className="bg-orange-50 rounded-xl p-6 mb-8 border border-orange-100">
            <p className="text-sm font-bold text-orange-800 mb-3">Previous Analysis Data:</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-700"><strong>Filename:</strong> {duplicateData.filename}</p>
              <p className="text-sm text-gray-700"><strong>LCA Score:</strong> {duplicateData.lca_score.toFixed(1)}%</p>
              <p className="text-sm text-gray-700"><strong>UI/UX Score:</strong> {duplicateData.uiux_score.toFixed(1)}%</p>
              <p className="text-sm text-gray-700"><strong>Classification:</strong> {duplicateData.classification}</p>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => { setDuplicateData(null); setFile(null); }} 
              className="px-6 py-3 rounded-lg font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
            >
              Close
            </button>
            <button 
              onClick={() => handleUpload(true)} 
              className="bg-orange-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-600 transition shadow-md"
            >
              Again Analyze
            </button>
          </div>
        </div>
      )}

      {/* --- HR ANALYSIS REPORT --- */}
      {report && !isProcessing && (
        <div className="bg-white rounded-2xl shadow-xl border border-[#DCE7E8] overflow-hidden animate-fade-in">
          <div className="bg-[#123C46] p-8 text-white flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-extrabold">Screening Report</h2>
              <p className="text-teal-200 mt-2">Candidate: {report.filename || file?.name}</p>
            </div>
            <button onClick={() => { setReport(null); setFile(null); }} className="text-white bg-white/20 hover:bg-white/30 px-6 py-2 rounded-lg font-bold transition">Upload New</button>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* LCA Analysis */}
            <div className="bg-[#F4F8F8] p-6 rounded-xl border border-[#DCE7E8]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[#123C46]">LCA Role Analysis</h3>
                <span className="text-4xl font-extrabold text-[#0F766E]">{report.lca_evaluation.total_score}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                <div className="bg-[#0F766E] h-3 rounded-full" style={{ width: `${report.lca_evaluation.total_score}%` }}></div>
              </div>
              <div>
                <p className="text-sm font-bold text-[#16A34A] mb-2">✓ Matched Skills</p>
                <div className="flex flex-wrap gap-2">
                  {report.lca_evaluation.matched_skills.length > 0 ? report.lca_evaluation.matched_skills.map((s: string) => (
                    <span key={s} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">{s}</span>
                  )) : <span className="text-gray-500 text-sm">None found</span>}
                </div>
              </div>
            </div>

            {/* UI/UX Analysis */}
            <div className="bg-[#F4F8F8] p-6 rounded-xl border border-[#DCE7E8]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[#123C46]">UI/UX Role Analysis</h3>
                <span className="text-4xl font-extrabold text-[#0F766E]">{report.uiux_evaluation.total_score}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                <div className="bg-[#0F766E] h-3 rounded-full" style={{ width: `${report.uiux_evaluation.total_score}%` }}></div>
              </div>
              <div>
                <p className="text-sm font-bold text-[#16A34A] mb-2">✓ Matched Skills</p>
                <div className="flex flex-wrap gap-2">
                  {report.uiux_evaluation.matched_skills.length > 0 ? report.uiux_evaluation.matched_skills.map((s: string) => (
                    <span key={s} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">{s}</span>
                  )) : <span className="text-gray-500 text-sm">None found</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}