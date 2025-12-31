import React, { useState, useEffect } from 'react';
import { StoryLog, VoiceGender, ActivityType } from '../types';
import { BookOpen, Sparkles, Volume2, Eye, EyeOff, Check, X, MoveRight, ListFilter } from 'lucide-react';
import { useStory } from '../context/StoryContext';
import { playTextToSpeech } from '../services/ttsService';

interface StoryLogItemProps {
  log: StoryLog;
}

const StoryLogItem: React.FC<StoryLogItemProps> = ({ log }) => {
  const { story } = useStory();
  const [showTranslation, setShowTranslation] = useState(false);
  const [showGrammar, setShowGrammar] = useState(false);
  const [activeVocab, setActiveVocab] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Activity State
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [matchState, setMatchState] = useState<{ left: string | null; right: string | null }>({ left: null, right: null });
  const [completedMatches, setCompletedMatches] = useState<string[]>([]);
  const [orderState, setOrderState] = useState<string[]>([]);

  if (log.isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto mb-12 p-4 animate-pulse">
        <div className="w-full h-64 bg-gray-800 rounded-lg mb-4"></div>
        <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-800 rounded w-1/2"></div>
      </div>
    );
  }

  const { text, translation, activity, grammar, vocab: logVocab } = log;
  const vocab = Array.isArray(logVocab) ? logVocab : [];

  const handlePlayAudio = async (overrideText?: string) => {
    const t = overrideText || text;
    if (!story || isPlaying || !t) return;
    setIsPlaying(true);
    try {
      await playTextToSpeech(
        t, 
        story.language, 
        story.preferences?.voiceGender || VoiceGender.FEMALE
      );
    } catch (error) {
      console.error("Audio playback error", error);
    } finally {
      setIsPlaying(false);
    }
  };

  const checkWriting = () => {
    if (!activity?.correctText) return;
    const isCorrect = userInput.trim().toLowerCase() === activity.correctText.trim().toLowerCase();
    setFeedback({
        isCorrect,
        message: isCorrect ? "Excellent! " + activity.explanation : "Not quite. Correct answer: " + activity.correctText + ". " + activity.explanation
    });
  };

  const handleOrderClick = (word: string) => {
    if (orderState.includes(word)) {
        setOrderState(prev => prev.filter(w => w !== word));
    } else {
        setOrderState(prev => [...prev, word]);
    }
  };

  const checkOrder = () => {
    if (!activity) return;
    
    // If AI failed to provide correctText, accept any order that uses all words
    if (!activity.correctText) {
        setFeedback({
            isCorrect: true,
            message: "The AI didn't provide an answer key, so we'll count this as correct! " + activity.explanation
        });
        return;
    }

    const attempt = orderState.join('');
    const correct = activity.correctText.replace(/\s/g, '');
    
    // Fallback: If strict match fails, check if the attempt contains all characters of correct text (loose check)
    const isCorrect = attempt === correct;
    
    setFeedback({
        isCorrect,
        message: isCorrect ? "Perfectly ordered! " + activity.explanation : "Wrong order. " + activity.explanation
    });
  };

  const renderActivityUI = () => {
    if (!activity) return null;

    // Choice-based activities (Shared UI)
    const choiceTypes = [
        ActivityType.MULTIPLE_CHOICE, ActivityType.CLOZE, ActivityType.READING, 
        ActivityType.PARTICLE, ActivityType.CONJUGATION, ActivityType.SYNONYM, 
        ActivityType.HONORIFICS, ActivityType.TRUE_FALSE, ActivityType.LISTENING, 
        ActivityType.ERROR_FIX, ActivityType.CLASSIFIER, ActivityType.HANZI_RADICAL
    ];

    if (choiceTypes.includes(activity.type)) {
        return (
            <div className="grid grid-cols-1 gap-2">
                {activity.type === ActivityType.LISTENING && (
                    <button 
                        onClick={() => handlePlayAudio(activity.question)} 
                        className="mb-2 p-2 bg-indigo-500/20 text-indigo-300 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-500/30 transition-all"
                    >
                        <Volume2 size={18} /> Replay Audio
                    </button>
                )}
                {activity.options?.map((opt, i) => (
                    <button 
                        key={i}
                        className={`text-left px-4 py-3 rounded-xl bg-gray-800 border border-white/5 hover:bg-gray-700 transition-all disabled:opacity-50 ${
                            feedback && i === activity.correctIndex ? 'border-green-500 bg-green-500/10' : ''
                        }`}
                        disabled={!!feedback}
                        onClick={() => {
                            const isCorrect = i === activity.correctIndex;
                            setFeedback({ 
                                isCorrect, 
                                message: isCorrect ? "Correct! " + activity.explanation : "Incorrect. " + activity.explanation 
                            });
                        }}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        );
    }

    if (activity.type === ActivityType.TRANSLATION_MATCH && activity.pairs) {
        const leftItems = activity.pairs.map(p => p.item).sort();
        const rightItems = activity.pairs.map(p => p.match).sort();

        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        {leftItems.map(item => (
                            <button
                                key={item}
                                disabled={completedMatches.includes(item)}
                                onClick={() => setMatchState(prev => ({ ...prev, left: item }))}
                                className={`w-full p-2 text-sm rounded border transition-all ${
                                    completedMatches.includes(item) ? 'opacity-30 border-transparent bg-gray-800' :
                                    matchState.left === item ? 'border-anime-primary bg-anime-primary/20 shadow-lg' : 'border-gray-700 bg-gray-800'
                                }`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                    <div className="space-y-2">
                        {rightItems.map(match => (
                            <button
                                key={match}
                                disabled={completedMatches.some(item => activity.pairs?.find(p => p.item === item)?.match === match)}
                                onClick={() => {
                                    if (!matchState.left) return;
                                    const pair = activity.pairs?.find(p => p.item === matchState.left);
                                    if (pair?.match === match) {
                                        setCompletedMatches(prev => [...prev, matchState.left!]);
                                        setMatchState({ left: null, right: null });
                                        if (completedMatches.length + 1 === activity.pairs?.length) {
                                            setFeedback({ isCorrect: true, message: "All matched! " + activity.explanation });
                                        }
                                    } else {
                                        setMatchState({ left: null, right: null });
                                    }
                                }}
                                className={`w-full p-2 text-sm rounded border transition-all ${
                                    completedMatches.some(item => activity.pairs?.find(p => p.item === item)?.match === match) ? 'opacity-30 border-transparent bg-gray-800' :
                                    'border-gray-700 bg-gray-800 hover:border-anime-accent'
                                }`}
                            >
                                {match}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (activity.type === ActivityType.WRITING) {
        return (
            <div className="space-y-3">
                <textarea 
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl p-4 focus:border-anime-primary outline-none min-h-[100px] text-lg font-cjk"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your translation..."
                    disabled={!!feedback}
                />
                <button 
                    onClick={checkWriting}
                    disabled={!userInput || !!feedback}
                    className="w-full py-3 bg-anime-primary rounded-xl font-bold hover:brightness-110 disabled:opacity-50 transition-all"
                >
                    Check Answer
                </button>
            </div>
        );
    }

    if (activity.type === ActivityType.SENTENCE_ORDER && activity.scrambledWords) {
        return (
            <div className="space-y-6">
                <div className="min-h-[60px] p-4 bg-black/40 rounded-xl border border-dashed border-gray-700 flex flex-wrap gap-2">
                    {orderState.map((word, i) => (
                        <button key={i} onClick={() => handleOrderClick(word)} className="px-3 py-1 bg-anime-primary rounded-lg text-sm shadow-lg animate-fade-in">
                            {word}
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                    {activity.scrambledWords.filter(w => !orderState.includes(w)).map((word, i) => (
                        <button 
                            key={i} 
                            onClick={() => handleOrderClick(word)}
                            disabled={!!feedback}
                            className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-sm hover:bg-gray-700 transition-all"
                        >
                            {word}
                        </button>
                    ))}
                </div>
                <button 
                    onClick={checkOrder}
                    disabled={orderState.length !== activity.scrambledWords.length || !!feedback}
                    className="w-full py-3 bg-indigo-600 rounded-xl font-bold hover:brightness-110 disabled:opacity-50"
                >
                    Submit Order
                </button>
            </div>
        );
    }

    if (activity.type === ActivityType.SIMILAR_PHRASE) {
        return (
            <div className="flex gap-4">
                {["Yes, same meaning", "No, different"].map((opt) => (
                    <button
                        key={opt}
                        disabled={!!feedback}
                        onClick={() => {
                            const isYes = opt.startsWith("Yes");
                            const isCorrect = (isYes && activity.correctText === "Yes") || (!isYes && activity.correctText === "No");
                            setFeedback({ isCorrect, message: activity.explanation });
                        }}
                        className="flex-1 py-4 bg-gray-800 border border-white/5 rounded-xl hover:bg-gray-700 transition-all font-bold"
                    >
                        {opt}
                    </button>
                ))}
            </div>
        );
    }

    return null;
  };

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
            <button 
                onClick={() => handlePlayAudio()}
                disabled={isPlaying}
                className={`p-2 hover:bg-white/10 rounded-full text-anime-primary transition-colors ${isPlaying ? 'animate-pulse text-white' : ''}`}
            >
              <Volume2 size={20} />
            </button>
            <button 
              onClick={() => setShowTranslation(!showTranslation)}
              className="p-2 hover:bg-white/10 rounded-full text-anime-accent transition-colors"
            >
              {showTranslation ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {grammar && (
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
            {translation}
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
        {showGrammar && grammar && (
            <div className="mt-4 bg-gray-800 rounded-lg p-4 border border-pink-500/30 animate-fade-in">
                <h4 className="font-bold text-pink-400 flex items-center gap-2">
                    <Sparkles size={16} />
                    {grammar.title}
                </h4>
                <p className="text-sm text-gray-300 mt-2">{grammar.explanation}</p>
                <div className="mt-2 p-2 bg-gray-900 rounded text-sm font-mono text-gray-400">
                    {grammar.example}
                </div>
            </div>
        )}

        {/* Activity Widget */}
        {activity && (
            <div className="mt-6 border-t border-gray-700/50 pt-6">
                <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 p-6 rounded-2xl border border-white/5 shadow-inner">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] bg-indigo-500/10 px-2 py-1 rounded">
                            {activity.type.replace('_', ' ')}
                        </span>
                        {feedback && (
                            <span className={`flex items-center gap-1 text-xs font-bold ${feedback.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                {feedback.isCorrect ? <Check size={14} /> : <X size={14} />}
                                {feedback.isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                        )}
                    </div>
                    
                    <p className="font-semibold text-white text-lg mb-6 leading-snug">
                        {activity.question}
                    </p>

                    {renderActivityUI()}

                    {feedback && (
                        <div className={`mt-6 p-4 rounded-xl text-sm border animate-fade-in ${
                            feedback.isCorrect ? 'bg-green-500/10 border-green-500/20 text-green-200' : 'bg-red-500/10 border-red-500/20 text-red-200'
                        }`}>
                            {feedback.message}
                        </div>
                    )}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default StoryLogItem;