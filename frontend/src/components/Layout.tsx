import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BriefcaseBusiness, Trophy, Settings, Menu, X, BarChart3 } from 'lucide-react';
import Logo from './Logo';

export default function Layout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Job Descriptions', path: '/jobs', icon: BriefcaseBusiness },
    { name: 'Results', path: '/results', icon: Trophy },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-[#F4F8F8] font-sans overflow-hidden relative">
      
      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-10 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside 
        className={`bg-white border-r border-[#DCE7E8] flex flex-col shadow-sm z-20 transition-all duration-300 ease-in-out absolute h-full ${
          isSidebarOpen ? 'w-[260px] translate-x-0' : 'w-[260px] -translate-x-full'
        }`}
      >
        <div className="h-[72px] flex items-center px-6 border-b border-[#DCE7E8] shrink-0">
          <Logo className="w-9 h-9 mr-3" />
          <div className="flex flex-col">
            <span className="text-[20px] font-extrabold text-[#123C46] leading-tight">
              GFI <span className="text-[#0F766E]">Screener</span>
            </span>
            <span className="text-[11px] font-medium text-[#64748B]">AI Resume Screening</span>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto no-scrollbar">
          <p className="px-3 text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-3 mt-2">Menu</p>
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center h-[44px] px-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-[#E6FFFB] text-[#0F766E] font-semibold'
                      : 'text-[#64748B] hover:bg-[#F1F8F7] hover:text-[#123C46]'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-[#0F766E]' : 'text-[#64748B] group-hover:text-[#123C46]'}`} />
                  <span className="text-[14px]">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-[#DCE7E8] shrink-0">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F1F8F7] transition-colors cursor-pointer group">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-[#0F766E] text-white flex items-center justify-center font-bold text-sm shadow-sm">SP</div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-[#172B32] group-hover:text-[#123C46]">Sumit Pandey</span>
                <span className="text-[11px] text-[#64748B]">HR Administrator</span>
              </div>
            </div>
            <Settings className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0F766E] transition-colors" />
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'md:ml-[260px]' : 'ml-0'
      }`}>
        
        {/* HEADER */}
        <header className="h-[72px] bg-white border-b border-[#DCE7E8] flex items-center px-4 md:px-8 shrink-0 z-10 shadow-sm">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 mr-4 rounded-lg text-[#64748B] hover:bg-[#F4F8F8] hover:text-[#123C46] transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h2 className="text-lg font-bold text-[#123C46] capitalize hidden md:block">
            {location.pathname.replace('/', '') || 'Dashboard'}
          </h2>
        </header>

        {/* PAGE CONTAINER - This ensures perfect height and scroll behavior */}
        <main className="flex-1 overflow-y-auto no-scrollbar relative bg-[#F4F8F8]">
          <div className="h-full w-full max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}