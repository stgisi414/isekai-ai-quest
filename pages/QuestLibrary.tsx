import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStory } from '../context/StoryContext';
import { useAuth } from '../context/AuthContext';
import { Book, Trash2, Plus, Globe, User, MapPin, Loader2, RefreshCw } from 'lucide-react';
import Button from '../components/Button';

const QuestLibrary: React.FC = () => {
  const { quests, deleteQuest, selectQuest, loading, refreshQuests } = useStory();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSelect = (id: string) => {
    selectQuest(id);
    navigate('/story/active');
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Delete this quest forever? This cannot be undone.")) {
      await deleteQuest(id);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-12">
        <Loader2 className="w-12 h-12 text-anime-primary animate-spin mb-4" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Scanning the Multiverse...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-anime-primary to-anime-accent">
          Quest Library
        </h1>
        <div className="flex gap-4">
            <Button onClick={refreshQuests} variant="ghost" className="text-gray-500 hover:text-white">
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </Button>
            <Button onClick={() => navigate('/builder')} className="gap-2">
                <Plus size={20} /> New Quest
            </Button>
        </div>
      </div>

      {quests.length === 0 ? (
        <div className="text-center py-32 bg-white/5 rounded-3xl border border-dashed border-white/10">
          <Book size={64} className="mx-auto mb-6 text-gray-600" />
          <h2 className="text-2xl font-bold mb-2">No Quests Found</h2>
          <p className="text-gray-500 mb-8">Begin your first isekai journey today!</p>
          <Button onClick={() => navigate('/builder')} variant="primary" className="px-8 py-4 text-lg">
            Start New Adventure
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* New Quest Shortcut */}
          <div 
            onClick={() => navigate('/builder')}
            className="group cursor-pointer border-2 border-dashed border-gray-700 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 hover:border-anime-primary hover:bg-anime-primary/5 transition-all min-h-[300px]"
          >
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-anime-primary group-hover:text-white transition-all text-gray-500">
                <Plus size={32} />
            </div>
            <span className="font-bold text-gray-500 group-hover:text-anime-primary">Start New Quest</span>
          </div>

          {quests.map(q => {
            const hero = q.characters[0]?.name || "Nameless Hero";
            const world = q.settings[0]?.name || "Unknown World";
            const lastLog = q.logs.length;

            return (
              <div 
                key={q.id}
                onClick={() => handleSelect(q.id)}
                className="bg-gray-800/50 border border-white/5 rounded-3xl overflow-hidden hover:border-anime-primary/50 transition-all hover:shadow-2xl hover:shadow-anime-primary/10 group cursor-pointer flex flex-col"
              >
                {/* Visual Header (using first setting or character image if available) */}
                <div className="h-40 bg-black relative">
                    <img 
                        src={q.settings[0]?.referenceImageUrl || q.characters[0]?.referenceImageUrl || 'https://picsum.photos/400/200?grayscale'} 
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" 
                        alt={q.id}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                    <div className="absolute bottom-4 left-6">
                        <span className="bg-anime-primary text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">
                            {q.language}
                        </span>
                    </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold mb-4 line-clamp-1">{hero}'s Tale</h3>
                    
                    <div className="space-y-3 mb-8">
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                            <MapPin size={16} className="text-anime-primary" />
                            <span>{world}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                            <Book size={16} className="text-anime-primary" />
                            <span>{lastLog} Scenes Recorded</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                            <Globe size={16} className="text-anime-primary" />
                            <span>Level: {q.proficiency}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/5">
                        <Button variant="ghost" className="text-sm px-0 text-anime-primary hover:bg-transparent">
                            Continue Journey
                        </Button>
                        <button 
                            onClick={(e) => handleDelete(e, q.id)}
                            className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                            title="Delete Quest"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuestLibrary;