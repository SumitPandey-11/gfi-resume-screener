import { useState } from 'react';
import axios from 'axios';

// Define the shape of our data based on the FastAPI response
interface AnalysisResult {
  filename: string;
  classification: string;
  lca_evaluation: {
    total_score: number;
    matched_skills: string[];
    missing_skills: string[];
  };
  uiux_evaluation: {
    total_score: number;
    matched_skills: string[];
    missing_skills: string[];
  };
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a PDF file first.");
    
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Send the file to our FastAPI backend
      const response = await axios.post('http://127.0.0.1:8000/analyze-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
    } catch (error) {
      console.error("Error uploading file", error);
      alert("Failed to process the resume. Check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-gfiBlue mb-2">GFI Resume Screener</h1>
        <p className="text-gray-600">Upload a resume to analyze it against LCA and UI/UX Roles.</p>
      </header>

      {/* Upload Section */}
      <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-md mb-8 border border-gray-200">
        <div className="border-2 border-dashed border-gray-300 p-8 rounded-lg text-center hover:bg-gray-50 transition">
          <input 
            type="file" 
            accept=".pdf" 
            onChange={handleFileChange} 
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-gfiBlue hover:file:bg-blue-100 mb-4"
          />
          <button 
            onClick={handleUpload} 
            disabled={loading || !file}
            className="bg-gfiBlue text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-800 disabled:bg-gray-400 w-full transition"
          >
            {loading ? 'Processing PDF...' : 'Analyze Resume'}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-gfiBlue">
            <h2 className="text-2xl font-bold mb-2">Results for: {result.filename}</h2>
            <span className="inline-block bg-blue-100 text-gfiBlue px-3 py-1 rounded-full text-sm font-semibold">
              Classification: {result.classification}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LCA Score Card */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-4 text-gray-800">LCA Role Match</h3>
              <div className="text-5xl font-extrabold text-blue-600 mb-4">
                {result.lca_evaluation.total_score}%
              </div>
              
              <div className="mb-2">
                <strong className="text-green-600">Matched Skills:</strong>
                <p className="text-sm text-gray-600">
                  {result.lca_evaluation.matched_skills.length > 0 ? result.lca_evaluation.matched_skills.join(', ') : "None"}
                </p>
              </div>
              
              <div>
                <strong className="text-red-500">Missing Skills:</strong>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {result.lca_evaluation.missing_skills.slice(0, 5).join(', ')}...
                </p>
              </div>
            </div>

            {/* UI/UX Score Card */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-4 text-gray-800">UI/UX Role Match</h3>
              <div className="text-5xl font-extrabold text-purple-600 mb-4">
                {result.uiux_evaluation.total_score}%
              </div>
              
              <div className="mb-2">
                <strong className="text-green-600">Matched Skills:</strong>
                <p className="text-sm text-gray-600">
                  {result.uiux_evaluation.matched_skills.length > 0 ? result.uiux_evaluation.matched_skills.join(', ') : "None"}
                </p>
              </div>
              
              <div>
                <strong className="text-red-500">Missing Skills:</strong>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {result.uiux_evaluation.missing_skills.slice(0, 5).join(', ')}...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;