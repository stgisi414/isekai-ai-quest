import React, { useState } from 'react';
import { StoryLog } from '../types';
import { BookOpen, Sparkles, Volume2, Eye, EyeOff } from 'lucide-react';

interface StoryLogItemProps {
  log: StoryLog;
}

const StoryLogItem: React.FC<StoryLogItemProps> = ({ log }) => {
  const [showTranslation, setShowTranslation] = useState(false);
  const [showGrammar, setShowGrammar] = useState(false);
  const [activeVocab, setActiveVocab] = useState<number | null>(null);

  if (log.isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto mb-12 p-4 animate-pulse">
        <div className="w-full h-64 bg-gray-800 rounded-lg mb-4"></div>
        <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-800 rounded w-1/2"></div>
      </div>
    );
  }

  // Safe defaults
  const text = log.text || "";
  const vocab = Array.isArray(log.vocab) ? log.vocab : [];
  const options = log.quiz?.options || [];

  return (
    <div className="w-full max-w-2xl mx-auto mb-16 relative group">
      {/* Anime Visual */}
      <div className="relative rounded-xl overflow-hidden shadow-2xl border border-anime-glass bg-black mb-6">
        <img 
          src={log.illustrationUrl || 'https://picsum.photos/800/450?grayscale'} 
          alt="Scene illustration" 
          className="w-full h-auto object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
      </div>

      {/* Story Text */}
      <div className="relative z-10 bg-gray-900/80 backdrop-blur-md rounded-xl p-6 border border-white/10 shadow-xl">
        
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <button className="p-2 hover:bg-white/10 rounded-full text-anime-primary transition-colors">
              <Volume2 size={20} />
            </button>
            <button 
              onClick={() => setShowTranslation(!showTranslation)}
              className="p-2 hover:bg-white/10 rounded-full text-anime-accent transition-colors"
            >
              {showTranslation ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {log.grammar && (
            <button 
                onClick={() => setShowGrammar(!showGrammar)}
                className="text-xs uppercase tracking-widest font-bold text-gray-400 hover:text-white flex items-center gap-1"
            >
                <BookOpen size={14} /> Grammar Focus
            </button>
          )}
        </div>

        {/* Target Text */}
        <p className="text-xl md:text-2xl font-cjk leading-relaxed text-white mb-4">
          {text.split(' ').map((word, idx) => {
             // Basic naive matching for demo. In production, use token offsets provided by AI.
             const vocabMatch = vocab.find(v => word.includes(v.word) || v.word.includes(word));
             return vocabMatch ? (
                <span 
                    key={idx} 
                    className="cursor-pointer text-indigo-300 border-b border-indigo-500/50 hover:bg-indigo-500/20 transition-colors"
                    onClick={() => setActiveVocab(idx)}
                >
                    {word}{' '}
                </span>
             ) : (
                 <span key={idx}>{word} </span>
             );
          })}
        </p>

        {/* Translation */}
        <div className={`overflow-hidden transition-all duration-300 ${showTranslation ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
          <p className="text-gray-400 italic text-lg border-l-2 border-anime-accent pl-4">
            {log.translation}
          </p>
        </div>

        {/* Vocab Popup/Card */}
        {activeVocab !== null && vocab[activeVocab] && (
            <div className="mt-4 bg-gray-800 rounded-lg p-4 border border-indigo-500/30">
                <div className="flex justify-between">
                    <h4 className="font-bold text-lg text-indigo-300">{vocab[activeVocab].word}</h4>
                    <button onClick={() => setActiveVocab(null)} className="text-gray-500 hover:text-white">&times;</button>
                </div>
                <p className="text-sm text-gray-400">{vocab[activeVocab].reading}</p>
                <p className="text-white mt-1">{vocab[activeVocab].meaning}</p>
            </div>
        )}

        {/* Grammar Card */}
        {showGrammar && log.grammar && (
            <div className="mt-4 bg-gray-800 rounded-lg p-4 border border-pink-500/30 animate-fade-in">
                <h4 className="font-bold text-pink-400 flex items-center gap-2">
                    <Sparkles size={16} />
                    {log.grammar.title}
                </h4>
                <p className="text-sm text-gray-300 mt-2">{log.grammar.explanation}</p>
                <div className="mt-2 p-2 bg-gray-900 rounded text-sm font-mono text-gray-400">
                    {log.grammar.example}
                </div>
            </div>
        )}

        {/* Quiz Widget */}
        {log.quiz && (
            <div className="mt-6 border-t border-gray-700 pt-4">
                <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-4 rounded-xl border border-white/5">
                    <span className="text-xs font-bold text-indigo-400 uppercase mb-2 block">Quick Check</span>
                    <p className="font-semibold text-white mb-3">{log.quiz.question}</p>
                    <div className="grid grid-cols-1 gap-2">
                        {options.map((opt, i) => (
                            <button 
                                key={i}
                                className="text-left px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 text-sm transition-colors focus:bg-indigo-600 focus:text-white"
                                onClick={(e) => {
                                    if(i === log.quiz!.correctIndex) {
                                        e.currentTarget.classList.add('bg-green-600', 'text-white');
                                        e.currentTarget.innerText += " ✅ Correct!";
                                    } else {
                                        e.currentTarget.classList.add('bg-red-600', 'text-white');
                                    }
                                }}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default StoryLogItem;