import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CheckCircle2, XCircle, User, Briefcase, GraduationCap, Save, FileText, Download } from 'lucide-react';

export default function CandidateDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // HR Review State
  const [hrStatus, setHrStatus] = useState('Pending Review');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    axios.get(`/candidates/${id}`)
      .then(res => {
        setCandidate(res.data);
        setHrStatus(res.data.hr_status || 'Pending Review');
        setNotes(res.data.hr_notes || '');
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching candidate:", err);
        setLoading(false);
      });
  }, [id]);

  const handleSaveReview = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      await axios.put(`/candidates/${id}/review`, {
        hr_status: hrStatus,
        hr_notes: notes
      });
      setSaveMessage('Review saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error("Error saving review:", err);
      alert("Failed to save review.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center text-[#64748B]">Loading candidate profile...</div>;
  }

  if (!candidate) {
    return <div className="h-full flex items-center justify-center text-red-500">Candidate not found.</div>;
  }

  // Determine which role is the primary match
  const isLca = candidate.lca_score > candidate.uiux_score;
  const primaryRole = isLca ? 'LCA Consultant' : 'UI/UX Design Intern';
  const primaryScore = isLca ? candidate.lca_score : candidate.uiux_score;

  // Build the SVG Circular Progress
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (primaryScore / 100) * circumference;

  return (
    <div className="h-full p-6 md:p-8 flex flex-col gap-6 animate-fade-in bg-[#F4F8F8] overflow-y-auto no-scrollbar">
      
      {/* HEADER & BACK BUTTON */}
      <div className="flex items-center gap-4 shrink-0">
        <button 
          onClick={() => navigate('/results')} 
          className="p-2 bg-white rounded-lg border border-[#DCE7E8] text-[#64748B] hover:text-[#0F766E] hover:bg-[#E6FFFB] transition shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[22px] font-bold text-[#123C46]">{candidate.filename}</h1>
          <p className="text-[14px] text-[#64748B] mt-1">Candidate Profile & AI Match Analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: SCORE & INFO */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Circular Score Card */}
          <div className="bg-white p-6 rounded-xl border border-[#DCE7E8] shadow-sm flex flex-col items-center justify-center text-center">
            <h3 className="text-[16px] font-bold text-[#123C46] mb-6">Match Summary</h3>
            
            <div className="relative w-40 h-40 flex items-center justify-center mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="12" />
                <circle 
                  cx="64" cy="64" r={radius} fill="none" 
                  stroke={isLca ? "#0F766E" : "#2DD4BF"} 
                  strokeWidth="12" 
                  strokeDasharray={circumference} 
                  strokeDashoffset={strokeDashoffset} 
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-[32px] font-extrabold text-[#123C46]">{primaryScore.toFixed(1)}%</span>
                <span className="text-[12px] text-[#64748B] font-bold uppercase tracking-wider">Match</span>
              </div>
            </div>
            
            <div className="bg-[#E6FFFB] text-[#0F766E] px-4 py-2 rounded-lg text-[13px] font-bold border border-[#0F766E]/20 w-full mb-4">
              Top Role: {primaryRole}
            </div>

            {/* Resume Actions */}
            <div className="flex w-full gap-2">
              <button className="flex-1 bg-white border border-[#DCE7E8] text-[#64748B] py-2 rounded-lg text-[12px] font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" /> Preview
              </button>
              <button className="flex-1 bg-white border border-[#DCE7E8] text-[#64748B] py-2 rounded-lg text-[12px] font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>

          {/* HR Actions Card */}
          <div className="bg-white p-6 rounded-xl border border-[#DCE7E8] shadow-sm">
            <h3 className="text-[16px] font-bold text-[#123C46] mb-4">HR Review</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#64748B] mb-1">Status</label>
                <select 
                  value={hrStatus} 
                  onChange={(e) => setHrStatus(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#DCE7E8] bg-[#F8FAFC] text-[14px] text-[#172B32] focus:ring-2 focus:ring-[#0F766E] outline-none"
                >
                  <option>Pending Review</option>
                  <option>Shortlisted</option>
                  <option>Interview Scheduled</option>
                  <option>Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#64748B] mb-1">Recruiter Notes</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add interview feedback or notes..."
                  className="w-full p-2.5 rounded-lg border border-[#DCE7E8] bg-[#F8FAFC] text-[14px] text-[#172B32] focus:ring-2 focus:ring-[#0F766E] outline-none h-24 resize-none"
                ></textarea>
              </div>

              <button 
                onClick={handleSaveReview}
                disabled={saving}
                className="w-full bg-[#0F766E] text-white py-2.5 rounded-lg font-bold text-[14px] shadow-sm hover:bg-[#0b5c55] transition flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Review</>}
              </button>

              {saveMessage && (
                <p className="text-green-600 text-[12px] font-bold text-center mt-2">{saveMessage}</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILS */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Extracted Information Card */}
          <div className="bg-white p-6 rounded-xl border border-[#DCE7E8] shadow-sm">
            <h3 className="text-[16px] font-bold text-[#123C46] mb-4">Extracted Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex items-start">
                <User className="w-5 h-5 text-[#94A3B8] mr-3 mt-0.5" />
                <div>
                  <p className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider">Candidate</p>
                  <p className="text-[14px] font-semibold text-[#172B32]">{candidate.filename.replace('.pdf', '')}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <GraduationCap className="w-5 h-5 text-[#94A3B8] mr-3 mt-0.5" />
                <div>
                  <p className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider">Education</p>
                  <p className="text-[14px] font-semibold text-[#172B32]">{candidate.education || 'Not detected'}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Briefcase className="w-5 h-5 text-[#94A3B8] mr-3 mt-0.5" />
                <div>
                  <p className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider">Experience</p>
                  <p className="text-[14px] font-semibold text-[#172B32]">{candidate.experience_years} Years detected</p>
                </div>
              </div>
            </div>
          </div>

          {/* Skill Match Analysis Card */}
          <div className="bg-white p-6 rounded-xl border border-[#DCE7E8] shadow-sm flex-1">
            <h3 className="text-[16px] font-bold text-[#123C46] mb-4">Skill Match Analysis</h3>
            
            <div className="space-y-6">
              {/* Matched Skills */}
              <div>
                <h4 className="text-[13px] font-bold text-[#16A34A] flex items-center mb-3">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Matched Skills ({candidate.skills.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.length > 0 ? (
                    candidate.skills.map((skill: string) => (
                      <span key={skill} className="bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-[12px] font-semibold">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-[13px] text-[#94A3B8] italic">No direct skill matches found.</span>
                  )}
                </div>
              </div>

              {/* Missing Skills (Example based on JD) */}
              <div>
                <h4 className="text-[13px] font-bold text-[#DC2626] flex items-center mb-3">
                  <XCircle className="w-4 h-4 mr-2" /> Missing Requirements
                </h4>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-[12px] font-semibold">
                    {isLca ? "SimaPro Software" : "Advanced Prototyping"}
                  </span>
                  <span className="bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-[12px] font-semibold">
                    {isLca ? "ISO 14040 Standards" : "User Research"}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Explanation Text */}
            <div className="mt-8 bg-[#F8FAFC] p-4 rounded-lg border border-[#DCE7E8]">
              <h4 className="text-[13px] font-bold text-[#172B32] mb-2">AI Reasoning</h4>
              <p className="text-[13px] text-[#64748B] leading-relaxed">
                This candidate demonstrates strong alignment with the {primaryRole} role. The extracted skills 
                (<strong>{candidate.skills.slice(0, 3).join(', ')}</strong>) directly match the core requirements. 
                The candidate has {candidate.experience_years} years of experience and holds a qualification in 
                {candidate.education || 'a relevant field'}. However, specific tools like {isLca ? "SimaPro" : "Figma"} 
                were not explicitly mentioned in the resume text.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}