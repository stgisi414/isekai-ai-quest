import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useStory } from '../context/StoryContext';
import { useAuth } from '../context/AuthContext';
import { Sparkles, RefreshCw, Home, Settings as SettingsIcon, X, LayoutDashboard, Music, VolumeX, Volume2 as VolumeIcon, BookOpen, LogIn, LogOut, Loader2, Library, Cloud } from 'lucide-react';
import Button from './Button';
import { VoiceGender } from '../types';

const Layout: React.FC = () => {
  const { story, loading: storyLoading, isSaving, resetStory, updateSettings } = useStory();
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleStartOver = () => {
    if (window.confirm("Are you sure you want to reset your story progress? This cannot be undone.")) {
      resetStory();
      navigate('/');
    }
  };

  const isLanding = location.pathname === '/';
  const isDashboard = location.pathname === '/dashboard';
  const isLibrary = location.pathname === '/library';
  const isStory = location.pathname.startsWith('/story/');

  return (
    <div className="min-h-screen bg-anime-dark text-white flex flex-col font-sans selection:bg-anime-accent selection:text-white relative">
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b border-white/10 backdrop-blur-md transition-colors duration-300 ${isLanding ? 'bg-transparent border-transparent' : 'bg-anime-dark/80'}`}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="Isekai AI Quest" className="w-10 h-10 rounded-lg group-hover:scale-110 transition-transform duration-300 object-cover" />
            <span className="font-cjk font-bold text-xl tracking-tight">
              Isekai AI <span className="text-anime-primary">Quest</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Cloud Sync Status */}
                {story && (
                  <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-wider transition-all">
                    {isSaving ? (
                      <>
                        <Loader2 size={12} className="animate-spin text-anime-primary" />
                        <span className="text-gray-400">Saving...</span>
                      </>
                    ) : (
                      <>
                        <Cloud size={12} className="text-green-400" />
                        <span className="text-gray-500">Synced</span>
                      </>
                    )}
                  </div>
                )}

                {!isLanding && (
                  <Button 
                    onClick={() => navigate('/')} 
                    variant="ghost"
                    className="hidden md:flex text-sm px-3 py-1.5 gap-2 text-gray-400 hover:text-white"
                  >
                    <Home size={16} /> Home
                  </Button>
                )}

                {story && !isStory && (
                  <Button 
                    onClick={() => navigate('/story/active')} 
                    variant="primary"
                    className="text-sm px-3 py-1.5 gap-2"
                  >
                    <BookOpen size={16} /> Back to Story
                  </Button>
                )}

                {!isLibrary && (
                  <Button 
                    onClick={() => navigate('/library')} 
                    variant="secondary"
                    className="hidden sm:flex text-sm px-3 py-1.5 gap-2"
                  >
                    <Library size={16} /> Library
                  </Button>
                )}

                {!isDashboard && (
                  <Button 
                    onClick={() => navigate('/dashboard')} 
                    variant="secondary"
                    className="hidden sm:flex text-sm px-3 py-1.5 gap-2"
                  >
                    <LayoutDashboard size={16} /> Dashboard
                  </Button>
                )}

                {story && (
                  <>
                    <Button 
                        onClick={() => setIsSettingsOpen(true)}
                        variant="secondary"
                        className="text-sm px-3 py-1.5 gap-2"
                    >
                        <SettingsIcon size={16} /> <span className="hidden lg:inline">Settings</span>
                    </Button>
                    
                    <Button 
                        onClick={handleStartOver} 
                        variant="danger" 
                        className="text-sm px-3 py-1.5 gap-2"
                    >
                        <RefreshCw size={16} /> <span className="hidden lg:inline">Reset</span>
                    </Button>
                  </>
                )}

                <div className="h-8 w-px bg-white/10 mx-2 hidden md:block" />

                <div className="flex items-center gap-3">
                  {user.photoURL && (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-anime-primary shadow-lg shadow-anime-primary/20" />
                  )}
                  <button onClick={logout} className="text-gray-400 hover:text-red-400 transition-colors" title="Logout">
                    <LogOut size={20} />
                  </button>
                </div>
              </>
            ) : (
              <Button onClick={login} variant="primary" className="text-sm px-4 py-2 gap-2">
                <LogIn size={18} /> Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Loading Overlay for Firestore sync */}
      {user && storyLoading && (
        <div className="fixed inset-0 z-[60] bg-anime-dark/50 backdrop-blur-sm flex items-center justify-center">
          <Loader2 className="text-anime-primary animate-spin" size={48} />
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && story && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all scale-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <SettingsIcon className="text-anime-primary" /> Audio Settings
                    </h3>
                    <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm text-gray-400 mb-3">Narrator Voice Gender</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => updateSettings({ voiceGender: VoiceGender.FEMALE })}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                    (story.preferences?.voiceGender || VoiceGender.FEMALE) === VoiceGender.FEMALE 
                                    ? 'bg-anime-accent/20 border-anime-accent text-anime-accent ring-2 ring-anime-accent/50' 
                                    : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-400'
                                }`}
                            >
                                <span className="text-lg font-bold">Female</span>
                                <span className="text-xs opacity-70">Soft & Clear</span>
                            </button>
                            <button 
                                onClick={() => updateSettings({ voiceGender: VoiceGender.MALE })}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                    story.preferences?.voiceGender === VoiceGender.MALE 
                                    ? 'bg-anime-primary/20 border-anime-primary text-anime-primary ring-2 ring-anime-primary/50' 
                                    : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-400'
                                }`}
                            >
                                <span className="text-lg font-bold">Male</span>
                                <span className="text-xs opacity-70">Deep & Calm</span>
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-white/5 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold flex items-center gap-2">
                                <Music size={18} className="text-anime-primary" /> Background Music
                            </h4>
                            <button 
                                onClick={() => updateSettings({ bgmEnabled: !story.preferences.bgmEnabled })}
                                className={`w-12 h-6 rounded-full relative transition-colors ${story.preferences.bgmEnabled ? 'bg-anime-primary' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${story.preferences.bgmEnabled ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                        
                        <div className={`space-y-3 transition-opacity ${story.preferences.bgmEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                            <div className="flex items-center gap-3">
                                <VolumeX size={16} className="text-gray-500" />
                                <input 
                                    type="range" 
                                    min="0" max="1" step="0.01" 
                                    value={story.preferences.bgmVolume}
                                    onChange={(e) => updateSettings({ bgmVolume: parseFloat(e.target.value) })}
                                    className="flex-1 accent-anime-primary h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <VolumeIcon size={16} className="text-gray-500" />
                            </div>
                            <div className="text-[10px] text-gray-500 text-center uppercase tracking-widest font-bold">
                                Real-time Lyria AI Generation
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                    <Button onClick={() => setIsSettingsOpen(false)}>Done</Button>
                </div>
            </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow flex flex-col relative z-0">
        <Outlet />
      </main>

      {/* Footer */}
      {!location.pathname.startsWith('/story/') && (
        <footer className="border-t border-white/5 bg-black/20 py-8 mt-auto">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            <p className="mb-2">© {new Date().getFullYear()} Isekai AI Quest. Learning through Immersion.</p>
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