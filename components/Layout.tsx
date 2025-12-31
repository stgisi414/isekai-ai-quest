import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useStory } from '../context/StoryContext';
import { Sparkles, RefreshCw, Home } from 'lucide-react';
import Button from './Button';

const Layout: React.FC = () => {
  const { story, resetStory } = useStory();
  const navigate = useNavigate();
  const location = useLocation();

  const handleStartOver = () => {
    if (window.confirm("Are you sure you want to reset your story progress? This cannot be undone.")) {
      resetStory();
      navigate('/');
    }
  };

  const isLanding = location.pathname === '/';

  return (
    <div className="min-h-screen bg-anime-dark text-white flex flex-col font-sans selection:bg-anime-accent selection:text-white">
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b border-white/10 backdrop-blur-md transition-colors duration-300 ${isLanding ? 'bg-transparent border-transparent' : 'bg-anime-dark/80'}`}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-gradient-to-tr from-anime-primary to-anime-accent p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="font-cjk font-bold text-xl tracking-tight">
              AnimeLang <span className="text-anime-primary">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {!isLanding && (
              <Button 
                onClick={() => navigate('/')} 
                variant="secondary"
                className="hidden md:flex text-sm px-3 py-1.5 gap-2"
              >
                <Home size={16} /> Home
              </Button>
            )}

            {story && (
              <Button 
                onClick={handleStartOver} 
                variant="danger" // Assuming Button supports variants, if not default styles apply
                className="text-sm px-3 py-1.5 gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
              >
                <RefreshCw size={16} /> Start Over
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col relative z-0">
        <Outlet />
      </main>

      {/* Footer */}
      {!location.pathname.startsWith('/story/') && (
        <footer className="border-t border-white/5 bg-black/20 py-8 mt-auto">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            <p className="mb-2">© {new Date().getFullYear()} AnimeLang AI. Learning through Immersion.</p>
            <p className="text-xs text-gray-600">
              Powered by Google Gemini 1.5 Pro & Flash. 
              <br />
              Characters and stories are AI-generated.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;