export default function Settings() {
  return (
    <div className="p-10 max-w-3xl">
      <h1 className="text-3xl font-extrabold text-[#101828] mb-8">Scoring Settings</h1>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500 mb-8">Adjust the weights for the resume ranking algorithm. The total must equal exactly 100%.</p>
        
        <div className="space-y-8">
          {/* Slider 1 */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="font-semibold text-[#101828]">Skills Match</label>
              <span className="font-bold text-[#1261D5]">35%</span>
            </div>
            <input type="range" min="0" max="100" defaultValue="35" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1261D5]" />
          </div>

          {/* Slider 2 */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="font-semibold text-[#101828]">Experience Relevance</label>
              <span className="font-bold text-[#1261D5]">25%</span>
            </div>
            <input type="range" min="0" max="100" defaultValue="25" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1261D5]" />
          </div>

          {/* Slider 3 */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="font-semibold text-[#101828]">Education</label>
              <span className="font-bold text-[#1261D5]">15%</span>
            </div>
            <input type="range" min="0" max="100" defaultValue="15" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1261D5]" />
          </div>

          {/* Slider 4 */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="font-semibold text-[#101828]">Projects</label>
              <span className="font-bold text-[#1261D5]">15%</span>
            </div>
            <input type="range" min="0" max="100" defaultValue="15" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1261D5]" />
          </div>

          {/* Slider 5 */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="font-semibold text-[#101828]">Keywords / Certifications</label>
              <span className="font-bold text-[#1261D5]">10%</span>
            </div>
            <input type="range" min="0" max="100" defaultValue="10" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1261D5]" />
          </div>
        </div>

        {/* Total Indicator */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between items-center">
          <div className="bg-green-50 text-green-700 font-bold px-4 py-2 rounded-lg border border-green-200">
            Total: 100%
          </div>
          <button className="bg-[#1261D5] text-white px-8 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}