import React, { useState } from 'react';
import { useLearning } from '../context/LearningContext';
import { useStory } from '../context/StoryContext';
import { Note, Language, VoiceGender } from '../types';
import Button from '../components/Button';
import { Volume2, Brain, Trash2, Globe } from 'lucide-react';
import { playTextToSpeech } from '../services/ttsService';
import { explainText } from '../services/geminiService';

const Dashboard: React.FC = () => {
    const { notes, removeNote } = useLearning();
    const { story } = useStory(); // Access story mainly for voice settings preferences if available
    const [explanation, setExplanation] = useState<{id: string, text: string} | null>(null);
    const [loadingExplanation, setLoadingExplanation] = useState<string | null>(null);

    // Group notes by language
    const notesByLang = notes.reduce((acc, note) => {
        if (!acc[note.language]) acc[note.language] = [];
        acc[note.language].push(note);
        return acc;
    }, {} as Record<string, Note[]>);

    const handleSpeak = (note: Note) => {
        // Use story preference if available, else default to Female
        const gender = story?.preferences?.voiceGender || VoiceGender.FEMALE;
        playTextToSpeech(note.text, note.language, gender);
    };

    const handleExplain = async (note: Note) => {
        if (explanation?.id === note.id) {
            setExplanation(null);
            return;
        }
        setLoadingExplanation(note.id);
        const text = await explainText(note.text, note.language, note.context || "");
        setExplanation({ id: note.id, text });
        setLoadingExplanation(null);
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-anime-primary to-anime-accent">
                Study Dashboard
            </h1>

            {notes.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-white/5 rounded-2xl border border-white/5">
                    <Brain size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-xl font-bold mb-2">No notes yet</p>
                    <p>Highlight text in your story to add them here!</p>
                </div>
            ) : (
                Object.entries(notesByLang).map(([lang, langNotes]) => (
                    <div key={lang} className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
                            <Globe className="text-anime-primary" /> {lang}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {langNotes.map(note => (
                                <div key={note.id} className="bg-gray-800 rounded-xl p-6 border border-white/5 hover:border-anime-primary/50 transition-colors shadow-lg relative group flex flex-col">
                                    <div className="mb-4">
                                        <h3 className="text-2xl font-cjk font-bold mb-2 text-white">{note.text}</h3>
                                        {note.context && (
                                            <p className="text-sm text-gray-400 italic line-clamp-3">"{note.context}"</p>
                                        )}
                                    </div>

                                    {explanation?.id === note.id && (
                                        <div className="mb-4 p-3 bg-indigo-900/30 rounded border border-indigo-500/30 text-sm animate-fade-in">
                                            <p className="font-bold text-indigo-300 mb-1">Explanation:</p>
                                            {explanation.text}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/5">
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleSpeak(note)} 
                                                className="p-2 hover:bg-white/10 rounded-full text-anime-primary transition-colors"
                                                title="Listen"
                                            >
                                                <Volume2 size={20} />
                                            </button>
                                            <button 
                                                onClick={() => handleExplain(note)} 
                                                className={`p-2 hover:bg-white/10 rounded-full transition-colors ${explanation?.id === note.id ? 'text-anime-accent' : 'text-gray-300'}`}
                                                title="Explain"
                                                disabled={loadingExplanation === note.id}
                                            >
                                                {loadingExplanation === note.id ? (
                                                    <span className="animate-spin block w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
                                                ) : (
                                                    <Brain size={20} />
                                                )}
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => removeNote(note.id)} 
                                            className="p-2 hover:bg-red-500/20 rounded-full text-gray-500 hover:text-red-400 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <span className="text-xs text-gray-600 font-mono bg-black/50 px-1 rounded">{note.proficiency}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default Dashboard;