import React from 'react';
import { Sparkles, Zap, Layers, Share2, Terminal, Shield } from 'lucide-react';

interface LandingPageProps {
  onMockLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onMockLogin }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* Navigation */}
      <nav className="w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-600 w-3 h-8 rounded-sm"></span>
            <span className="text-xl font-bold text-white tracking-tight">PromptForge</span>
          </div>
          <div>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-20 pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -z-10 opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] -z-10 opacity-30"></div>

        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles size={12} />
            Powered by Gemini 2.5 Flash
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Craft the Perfect <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400">
              AI Art Prompts
            </span>
          </h1>
          
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            A modular prompt engineering environment. Build, organize, and enhance your prompts with AI-assisted tools and instant previews.
          </p>

          {/* Login Actions */}
          <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <div className="bg-slate-900 p-1 rounded-full border border-slate-800 shadow-2xl flex items-center gap-4 pr-6 min-h-[58px]">
               {/* Google Button Container */}
               <div id="google-btn-landing" className="min-h-[40px]"></div>
               
               <div className="w-px h-8 bg-slate-800"></div>
               
               <button 
                onClick={onMockLogin}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2"
               >
                 <Terminal size={14} />
                 Try Demo Mode
               </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Sign in to save your library and history securely.
            </p>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="py-24 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-colors group">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-900/30 transition-colors">
                <Layers className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Modular Library</h3>
              <p className="text-slate-400 leading-relaxed">
                Break prompts into reusable blocks (Style, Lighting, Camera). Drag, drop, and toggle them to experiment rapidly without rewriting.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 hover:border-purple-500/50 transition-colors group">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-900/30 transition-colors">
                <Zap className="text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI Enhancement</h3>
              <p className="text-slate-400 leading-relaxed">
                Stuck? Let Gemini 2.5 analyze your text and inject professional-grade details, or visualize your idea instantly with generated previews.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition-colors group">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-900/30 transition-colors">
                <Shield className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">History & Storage</h3>
              <p className="text-slate-400 leading-relaxed">
                Never lose a golden prompt. We auto-save your history, generated images, and custom blocks to the cloud (or local storage).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-slate-600 text-sm">
        <p>&copy; {new Date().getFullYear()} PromptForge. Built for AI Artists.</p>
      </footer>
    </div>
  );
};
