import { useState, useEffect } from 'react';
import axios from 'axios';
import { BriefcaseBusiness, Plus, Trash2, Eye } from 'lucide-react';

const API_URL = "https://gfi-resume-screener.onrender.com";

export default function JobDescriptions() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [viewingJD, setViewingJD] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState({
    title: '', category: 'LCA', description: '', experience_level: 'Fresher (0-1 Year)', required_skills: '', responsibilities: ''
  });

  useEffect(() => {
    axios.get(`${API_URL}/jobs`).then(res => setJobs(res.data)).catch(() => {
      // Fallback just in case of network error
      setJobs([
        { id: 1, title: "JD1 – Life-Cycle Assessment (LCA) Role", category: "LCA", experience_level: "2-3 Years", description: "The LCA Consultant helps organizations measure environmental impacts across product life cycles.", required_skills: "LCA, SimaPro, ISO 14040", responsibilities: "Data collection, LCA modelling." },
        { id: 2, title: "JD2 – UI/UX Design Internship", category: "UI/UX", experience_level: "Fresher (0-1 Year)", description: "Design intuitive, attractive, and user-friendly digital experiences for the web platform.", required_skills: "Figma, Wireframing, User Research", responsibilities: "UI design, Prototyping." }
      ]);
    });
  }, []);

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this Job Description?")) {
      axios.delete(`${API_URL}/jobs/${id}`).then(() => {
        setJobs(jobs.filter(j => j.id !== id));
      }).catch(() => {
        // Fallback
        setJobs(jobs.filter(j => j.id !== id));
      });
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description) return alert("Title and Description are required.");
    
    try {
      await axios.post(`${API_URL}/jobs`, formData);
      window.location.reload(); // Quick refresh to get the real IDs from DB
    } catch (e) {
      // Local fallback for UI testing if API fails
      setJobs([...jobs, { ...formData, id: Date.now() }]);
      setIsAdding(false);
      setFormData({ title: '', category: 'LCA', description: '', experience_level: 'Fresher (0-1 Year)', required_skills: '', responsibilities: '' });
    }
  };

  return (
    <div className="h-full p-6 md:p-8 flex flex-col gap-6 animate-fade-in bg-[#F4F8F8] overflow-y-auto no-scrollbar">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 shrink-0 mb-2">
        <div>
          <h1 className="text-[22px] font-bold text-[#123C46]">Job Descriptions</h1>
          <p className="text-[14px] text-[#64748B] mt-1">Manage job requirements and create structured role profiles for AI matching.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)} 
          className="bg-[#0F766E] text-white px-5 py-2.5 rounded-lg text-[14px] font-semibold shadow-sm hover:bg-[#0b5c55] transition flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Job Description
        </button>
      </div>

      {/* JOB CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white p-6 rounded-xl border border-[#DCE7E8] shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-[#0F766E]/40 group">
            
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="bg-[#E6FFFB] text-[#0F766E] px-3 py-1 rounded-md text-[11px] font-bold border border-[#0F766E]/20 uppercase tracking-wider">
                  {job.category}
                </span>
                <span className="text-[12px] text-[#64748B] font-semibold bg-gray-100 px-3 py-1 rounded-md">
                  {job.experience_level}
                </span>
              </div>
              
              <h2 className="text-[18px] font-bold text-[#123C46] mt-2 group-hover:text-[#0F766E] transition-colors">{job.title}</h2>
              <p className="text-[13px] text-[#64748B] mt-2 line-clamp-2 leading-relaxed">{job.description}</p>
            </div>
            
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#DCE7E8]">
              <button 
                onClick={() => handleDelete(job.id)} 
                className="text-[#DC2626] bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg font-bold text-[13px] transition flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Delete
              </button>
              
              <button 
                onClick={() => setViewingJD(job)} 
                className="text-[#0F766E] bg-[#E6FFFB] hover:bg-[#2DD4BF] hover:text-white px-4 py-2 rounded-lg font-bold text-[13px] transition flex items-center"
              >
                <Eye className="w-4 h-4 mr-1.5" /> View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- VIEW JD MODAL --- */}
      {viewingJD && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-[#DCE7E8]">
            
            <div className="flex justify-between items-center p-6 border-b border-[#DCE7E8] bg-[#F4F8F8]">
              <div>
                <span className="text-[11px] font-bold text-[#0F766E] uppercase tracking-wider mb-1 block">{viewingJD.category}</span>
                <h2 className="text-[20px] font-bold text-[#123C46]">{viewingJD.title}</h2>
              </div>
              <button onClick={() => setViewingJD(null)} className="text-[#64748B] hover:text-[#DC2626] text-3xl font-bold leading-none">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto no-scrollbar text-[#172B32] space-y-6">
              
              <div>
                <h3 className="text-[14px] font-bold text-[#123C46] mb-2 uppercase tracking-wider">Role Overview</h3>
                <p className="text-[14px] text-[#64748B] leading-relaxed bg-[#F4F8F8] p-4 rounded-lg">{viewingJD.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F4F8F8] p-4 rounded-lg">
                  <h3 className="text-[13px] font-bold text-[#123C46] mb-1 uppercase tracking-wider">Experience</h3>
                  <p className="text-[14px] text-[#0F766E] font-semibold">{viewingJD.experience_level}</p>
                </div>
                <div className="bg-[#F4F8F8] p-4 rounded-lg">
                  <h3 className="text-[13px] font-bold text-[#123C46] mb-1 uppercase tracking-wider">Required Skills</h3>
                  <p className="text-[14px] text-[#64748B] font-medium">{viewingJD.required_skills}</p>
                </div>
              </div>

              <div>
                <h3 className="text-[14px] font-bold text-[#123C46] mb-2 uppercase tracking-wider">Key Responsibilities</h3>
                <p className="text-[14px] text-[#64748B] leading-relaxed whitespace-pre-wrap">{viewingJD.responsibilities}</p>
              </div>

            </div>

            <div className="p-4 border-t border-[#DCE7E8] bg-[#F4F8F8] flex justify-end">
              <button onClick={() => setViewingJD(null)} className="bg-[#123C46] text-white px-6 py-2 rounded-lg font-bold text-[14px] hover:bg-[#0B171B] transition">Close Details</button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD JD MODAL --- */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-[#DCE7E8]">
            
            <div className="flex justify-between items-center p-6 border-b border-[#DCE7E8] bg-[#F4F8F8]">
              <h2 className="text-[20px] font-bold text-[#123C46] flex items-center">
                <BriefcaseBusiness className="w-5 h-5 mr-2 text-[#0F766E]" /> Create Job Description
              </h2>
              <button onClick={() => setIsAdding(false)} className="text-[#64748B] hover:text-[#DC2626] text-3xl font-bold leading-none">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto no-scrollbar space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-[#123C46] mb-1.5">Job Title</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3 rounded-lg border border-[#DCE7E8] bg-[#F4F8F8] focus:bg-white focus:ring-2 focus:ring-[#0F766E] text-[14px] outline-none transition-all" placeholder="e.g. LCA Consultant" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#123C46] mb-1.5">Role Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-3 rounded-lg border border-[#DCE7E8] bg-[#F4F8F8] focus:bg-white focus:ring-2 focus:ring-[#0F766E] text-[14px] outline-none transition-all">
                    <option value="LCA">LCA</option>
                    <option value="UI/UX">UI/UX</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#123C46] mb-1.5">Experience Level</label>
                <select value={formData.experience_level} onChange={e => setFormData({...formData, experience_level: e.target.value})} className="w-full p-3 rounded-lg border border-[#DCE7E8] bg-[#F4F8F8] focus:bg-white focus:ring-2 focus:ring-[#0F766E] text-[14px] outline-none transition-all">
                  <option value="Fresher (0-1 Year)">Fresher (0-1 Year)</option>
                  <option value="1-2 Years">1-2 Years</option>
                  <option value="2-3 Years">2-3 Years</option>
                  <option value="3-5 Years">3-5 Years</option>
                  <option value="5+ Years">5+ Years</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#123C46] mb-1.5">Short Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 rounded-lg border border-[#DCE7E8] bg-[#F4F8F8] focus:bg-white focus:ring-2 focus:ring-[#0F766E] text-[14px] outline-none h-20 transition-all" placeholder="Brief overview of the role..."></textarea>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#123C46] mb-1.5">Required Skills (Comma separated)</label>
                <input type="text" value={formData.required_skills} onChange={e => setFormData({...formData, required_skills: e.target.value})} className="w-full p-3 rounded-lg border border-[#DCE7E8] bg-[#F4F8F8] focus:bg-white focus:ring-2 focus:ring-[#0F766E] text-[14px] outline-none transition-all" placeholder="e.g. Figma, User Research" />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#123C46] mb-1.5">Key Responsibilities</label>
                <textarea value={formData.responsibilities} onChange={e => setFormData({...formData, responsibilities: e.target.value})} className="w-full p-3 rounded-lg border border-[#DCE7E8] bg-[#F4F8F8] focus:bg-white focus:ring-2 focus:ring-[#0F766E] text-[14px] outline-none h-24 transition-all" placeholder="Enter responsibilities..."></textarea>
              </div>
            </div>

            <div className="p-4 border-t border-[#DCE7E8] bg-[#F4F8F8] flex justify-end space-x-3">
              <button onClick={() => setIsAdding(false)} className="px-6 py-2 rounded-lg font-bold text-[#64748B] bg-white border border-[#DCE7E8] hover:bg-gray-50 transition text-[14px]">Cancel</button>
              <button onClick={handleSave} className="bg-[#0F766E] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#0b5c55] transition shadow-sm text-[14px]">Save Job</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}