import { useState } from 'react';
import axios from 'axios';
import { X, UploadCloud, FileText, CheckCircle2, ChevronRight, AlertCircle, RefreshCw, Briefcase, Palette } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STAGES = [
  "Uploading resume",
  "Extracting candidate information",
  "Identifying technical skills",
  "Analysing experience and education",
  "Matching against LCA Consultant JD",
  "Matching against UI/UX Intern JD",
  "Calculating both match scores",
  "Generating final HR report"
];

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  
  // Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resultData, setResultData] = useState<any>(null);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!file) return;

    // Reset states
    setIsProcessing(true);
    setIsSuccess(false);
    setErrorMsg('');
    setCurrentStage(0);
    setResultData(null);

    // Visual Simulation for Stages
    const stageInterval = setInterval(() => {
      setCurrentStage(prev => {
        if (prev < STAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 600); 

    // Actual Backend Call
    const formData = new FormData();
    formData.append("file", file);

    try {
      // The backend automatically analyzes against both JDs now
      const res = await axios.post('http://127.0.0.1:8000/analyze-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      clearInterval(stageInterval);
      setCurrentStage(STAGES.length);
      setResultData(res.data);
      setIsSuccess(true);
      
    } catch (error: any) {
      clearInterval(stageInterval);
      const msg = error.response?.data?.detail || "Failed to process the resume. Please try again.";
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setIsProcessing(false);
    setIsSuccess(false);
    setErrorMsg('');
    setCurrentStage(0);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Determine best match
  const isLcaBest = isSuccess && resultData?.lca_evaluation?.total_score >= resultData?.uiux_evaluation?.total_score;

  return (
    <div className="fixed inset-0 bg-[#123C46]/80 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col relative max-h-[95vh]">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-[#DCE7E8] flex justify-between items-center bg-[#F8FAFC] shrink-0">
          <div>
            <h2 className="text-[20px] font-bold text-[#123C46]">
              {isSuccess ? 'Dual-Role Analysis Complete' : isProcessing ? 'AI Processing...' : 'Upload & Analyse Resume'}
            </h2>
            <p className="text-[13px] text-[#64748B] mt-0.5">
              {isSuccess ? 'Your candidate is evaluated against both LCA and UI/UX roles.' : isProcessing ? 'Please wait while our AI engine evaluates the candidate.' : 'Upload a candidate resume to automatically evaluate suitability for available roles.'}
            </p>
          </div>
          {!isProcessing && (
            <button onClick={handleClose} className="text-[#64748B] hover:text-[#DC2626] p-2 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* BODY (Scrollable) */}
        <div className="p-8 flex-1 overflow-y-auto no-scrollbar flex flex-col justify-center">
          
          {/* STATE 1: UPLOAD FORM */}
          {!isProcessing && !isSuccess && !errorMsg && (
            <div className="animate-fade-in max-w-xl mx-auto w-full">
              {/* File Dropzone */}
              <div className="border-2 border-dashed border-[#0F766E] bg-[#E6FFFB] p-10 rounded-xl text-center hover:bg-[#d9faf4] transition-colors cursor-pointer relative">
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-12 h-12 text-[#0F766E] mx-auto mb-3 floating-icon" />
                <h3 className="text-[16px] font-bold text-[#123C46]">Drag & drop candidate resume here</h3>
                <p className="text-[13px] text-[#64748B] mt-1 mb-4">Or click to browse from your device (PDF only)</p>
                {file ? (
                  <div className="inline-flex items-center bg-white px-4 py-2 rounded-lg border border-[#0F766E]/30 shadow-sm">
                    <FileText className="w-4 h-4 text-red-500 mr-2" />
                    <span className="text-[13px] font-semibold text-[#123C46] truncate max-w-[200px]">{file.name}</span>
                  </div>
                ) : (
                  <span className="inline-block bg-[#0F766E] text-white px-6 py-2 rounded-lg text-[13px] font-bold">Choose File</span>
                )}
              </div>

              <div className="mt-6 bg-[#F8FAFC] border border-[#DCE7E8] rounded-lg p-4 text-center">
                <p className="text-[12px] text-[#64748B] font-semibold mb-2">Automatic Screening Enabled</p>
                <div className="flex justify-center space-x-6 text-[12px] text-[#0F766E] font-bold">
                  <span className="flex items-center"><Briefcase className="w-3 h-3 mr-1" /> LCA Consultant</span>
                  <span className="flex items-center"><Palette className="w-3 h-3 mr-1" /> UI/UX Intern</span>
                </div>
              </div>

              <button 
                onClick={handleUpload}
                disabled={!file}
                className="w-full mt-6 bg-[#0F766E] text-white py-3 rounded-xl font-bold text-[14px] shadow-md hover:bg-[#0b5c55] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Analyse Resume Against Both Roles
              </button>
            </div>
          )}

          {/* STATE 2: AI PROCESSING ANIMATION */}
          {isProcessing && (
            <div className="animate-fade-in flex flex-col items-center">
              {/* Scanner Visual */}
              <div className="relative w-32 h-40 bg-white border-2 border-[#DCE7E8] rounded-lg shadow-lg mb-8 overflow-hidden flex flex-col items-center pt-6">
                <div className="w-10 h-10 bg-[#F1F5F9] rounded-full mb-3"></div>
                <div className="w-16 h-2 bg-[#F1F5F9] rounded mb-2"></div>
                <div className="w-12 h-2 bg-[#F1F5F9] rounded"></div>
                <div className="scanner-line"></div>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-sm mb-8">
                <div className="flex justify-between text-[12px] font-bold text-[#64748B] mb-2">
                  <span>Processing</span>
                  <span>{Math.round((currentStage / STAGES.length) * 100)}%</span>
                </div>
                <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-[#2DD4BF] h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(currentStage / STAGES.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Timeline Steps */}
              <div className="w-full max-w-sm space-y-2">
                {STAGES.map((stage, index) => {
                  const isCompleted = currentStage > index;
                  const isCurrent = currentStage === index;
                  return (
                    <div key={index} className={`flex items-center text-[12px] ${isCompleted ? 'text-[#0F766E] font-semibold' : isCurrent ? 'text-[#172B32] font-bold' : 'text-[#94A3B8]'}`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 mr-3 text-[#0F766E]" />
                      ) : isCurrent ? (
                        <RefreshCw className="w-4 h-4 mr-3 text-[#0F766E] animate-spin" />
                      ) : (
                        <div className="w-4 h-4 mr-3 rounded-full border-2 border-[#DCE7E8]"></div>
                      )}
                      {stage}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STATE 3: DUAL-ROLE SUCCESS SCREEN */}
          {isSuccess && resultData && (
            <div className="animate-fade-in flex flex-col items-center w-full">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 mx-auto border-4 border-green-100">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-[22px] font-extrabold text-[#123C46] mb-1">Analysis Complete</h3>
                <p className="text-[13px] text-[#64748B]">Candidate: <strong className="text-[#172B32]">{file?.name}</strong></p>
              </div>

              {/* Dual Score Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
                
                {/* LCA Card */}
                <div className={`p-5 rounded-xl border-2 transition-all ${isLcaBest ? 'border-[#0F766E] bg-[#E6FFFB]' : 'border-[#DCE7E8] bg-white'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-[#123C46] text-[16px]">LCA Consultant</h4>
                      <p className="text-[11px] text-[#64748B]">Chennai Onsite</p>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[11px] font-bold ${isLcaBest ? 'bg-[#0F766E] text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {isLcaBest ? 'Best Match' : 'Match'}
                    </span>
                  </div>
                  
                  <div className="flex items-end space-x-2 mb-3">
                    <span className={`text-[32px] font-extrabold ${isLcaBest ? 'text-[#0F766E]' : 'text-[#123C46]'}`}>{resultData.lca_evaluation.total_score}%</span>
                  </div>

                  <p className="text-[12px] font-bold text-[#16A34A] mb-1">Matched Skills:</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {resultData.lca_evaluation.matched_skills.slice(0, 4).map((s: string) => (
                      <span key={s} className="bg-white border border-green-200 text-green-700 text-[10px] px-2 py-0.5 rounded">{s}</span>
                    ))}
                  </div>

                  <p className="text-[12px] font-bold text-[#DC2626] mb-1">Missing Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {resultData.lca_evaluation.missing_skills.slice(0, 3).map((s: string) => (
                      <span key={s} className="bg-white border border-red-200 text-red-700 text-[10px] px-2 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                </div>

                {/* UI/UX Card */}
                <div className={`p-5 rounded-xl border-2 transition-all ${!isLcaBest ? 'border-[#2DD4BF] bg-[#F0FDF4]' : 'border-[#DCE7E8] bg-white'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-[#123C46] text-[16px]">UI/UX Intern</h4>
                      <p className="text-[11px] text-[#64748B]">Fully Remote</p>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[11px] font-bold ${!isLcaBest ? 'bg-[#2DD4BF] text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {!isLcaBest ? 'Best Match' : 'Match'}
                    </span>
                  </div>
                  
                  <div className="flex items-end space-x-2 mb-3">
                    <span className={`text-[32px] font-extrabold ${!isLcaBest ? 'text-[#2DD4BF]' : 'text-[#123C46]'}`}>{resultData.uiux_evaluation.total_score}%</span>
                  </div>

                  <p className="text-[12px] font-bold text-[#16A34A] mb-1">Matched Skills:</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {resultData.uiux_evaluation.matched_skills.slice(0, 4).map((s: string) => (
                      <span key={s} className="bg-white border border-green-200 text-green-700 text-[10px] px-2 py-0.5 rounded">{s}</span>
                    ))}
                  </div>

                  <p className="text-[12px] font-bold text-[#DC2626] mb-1">Missing Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {resultData.uiux_evaluation.missing_skills.slice(0, 3).map((s: string) => (
                      <span key={s} className="bg-white border border-red-200 text-red-700 text-[10px] px-2 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                </div>

              </div>

              <div className="flex space-x-3 w-full">
                <button onClick={resetModal} className="flex-1 py-3 rounded-xl font-bold text-[14px] text-[#64748B] bg-white border border-[#DCE7E8] hover:bg-gray-50 transition">
                  Analyse Another
                </button>
                <button onClick={handleClose} className="flex-1 bg-[#0F766E] text-white py-3 rounded-xl font-bold text-[14px] shadow-md hover:bg-[#0b5c55] transition flex items-center justify-center">
                  View Full Report <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* STATE 4: ERROR */}
          {errorMsg && !isProcessing && (
            <div className="animate-fade-in text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 border-4 border-red-100">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-[22px] font-extrabold text-[#DC2626] mb-2">Processing Failed</h3>
              <p className="text-[14px] text-[#64748B] mb-8 max-w-xs mx-auto">{errorMsg}</p>

              <div className="flex space-x-3 w-full max-w-sm">
                <button onClick={handleClose} className="flex-1 py-3 rounded-xl font-bold text-[14px] text-[#64748B] bg-white border border-[#DCE7E8] hover:bg-gray-50 transition">
                  Close
                </button>
                <button onClick={() => handleUpload()} className="flex-1 bg-[#0F766E] text-white py-3 rounded-xl font-bold text-[14px] shadow-md hover:bg-[#0b5c55] transition">
                  Try Again
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}