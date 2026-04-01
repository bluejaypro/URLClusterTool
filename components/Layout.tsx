
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900 sticky top-0 z-50 px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">SEO Architecture <span className="text-indigo-400">Tool</span></h1>
            <p className="text-xs text-slate-400">Semantic & Intent Isolation</p>
          </div>
        </div>
        <nav className="flex items-center gap-6">
          <Link 
            to="/" 
            className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
          >
            Generator
          </Link>
          <Link 
            to="/history" 
            className={`text-sm font-medium transition-colors ${location.pathname === '/history' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
          >
            History
          </Link>
        </nav>
      </header>
      <main className="flex-1 container mx-auto p-4 md:p-8">
        {children}
      </main>
      <footer className="py-6 border-t border-slate-800 text-center text-slate-500 text-sm">
        &copy; {new Date().getFullYear()} SEO Architecture Tool • Built with Gemini 3 Pro
      </footer>
    </div>
  );
};

export default Layout;
