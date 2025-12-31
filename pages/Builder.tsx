import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStory } from '../context/StoryContext';
import { useAuth } from '../context/AuthContext';
import { generateCharacterVisual, generateSettingVisual, generateRandomCharacter, generateRandomSetting, magicWand } from '../services/geminiService';
import { uploadBase64Image } from '../services/imageService';
import { Language, Proficiency } from '../types';
import Button from '../components/Button';
import { Sparkles, MapPin, User, ChevronRight, Dices, Loader2, Wand2 } from 'lucide-react';

const BUILDER_STORAGE_KEY = 'isekai_builder_state';

interface BuilderState {
  step: number;
  language: Language;
  proficiency: Proficiency;
  charName: string;
  charGender: string;
  charDesc: string;
  charImg: string | null;
  settingName: string;
  settingDesc: string;
  settingAtmosphere: string;
  settingImg: string | null;
}

const Builder: React.FC = () => {
  const navigate = useNavigate();
  const { initStory, addCharacter, addSetting } = useStory();
  const { user, login } = useAuth();
  
  const [state, setState] = useState<BuilderState>({
    step: 1,
    language: Language.JP,
    proficiency: Proficiency.BEGINNER,
    charName: '',
    charGender: 'Female',
    charDesc: '',
    charImg: null,
    settingName: '',
    settingDesc: '',
    settingAtmosphere: '',
    settingImg: null
  });
  const [loading, setLoading] = useState(false);
  const [wandLoading, setWandLoading] = useState<string | null>(null);

  const updateState = (updates: Partial<BuilderState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const { step, language, proficiency, charName, charGender, charDesc, charImg, settingName, settingDesc, settingAtmosphere, settingImg } = state;

  if (!user) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Adventurer Identity Required</h2>
        <p className="text-gray-400 mb-8 max-w-md">You need to sign in to manifest your isekai journey and save your progress to the cloud.</p>
        <Button onClick={login} variant="primary" className="px-8 py-4 text-lg">Sign In with Google</Button>
      </div>
    );
  }

  const handleMagicWand = async (field: 'name' | 'appearance' | 'settingName' | 'settingDesc' | 'atmosphere', current: string) => {
    setWandLoading(field);
    const newValue = await magicWand(field, current, language);
    
    const stateKeyMap: Record<string, keyof BuilderState> = {
        name: 'charName',
        appearance: 'charDesc',
        settingName: 'settingName',
        settingDesc: 'settingDesc',
        atmosphere: 'settingAtmosphere'
    };

    updateState({ [stateKeyMap[field]]: newValue } as any);
    setWandLoading(null);
  };

  const handleAutoFillCharacter = async () => {
    setLoading(true);
    const profile = await generateRandomCharacter(language, charGender);
    updateState({ charName: profile.name, charDesc: profile.appearance });
    setLoading(false);
  };

  const handleAutoFillSetting = async () => {
    setLoading(true);
    const profile = await generateRandomSetting(language);
    updateState({ 
        settingName: profile.name, 
        settingDesc: profile.appearance, 
        settingAtmosphere: profile.atmosphere 
    });
    setLoading(false);
  };

  const handleGenerateCharacter = async () => {
    if (!charName || !charDesc) return;
    setLoading(true);
    try {
        const base64 = await generateCharacterVisual(charName, charDesc);
        const url = await uploadBase64Image(base64, 'characters');
        updateState({ charImg: url });
    } finally {
        setLoading(false);
    }
  };

  const handleGenerateSetting = async () => {
    if (!settingName || !settingDesc) return;
    setLoading(true);
    try {
        const base64 = await generateSettingVisual(settingName, settingDesc, settingAtmosphere);
        const url = await uploadBase64Image(base64, 'settings');
        updateState({ settingImg: url });
    } finally {
        setLoading(false);
    }
  };

  const handleFinish = () => {
    initStory(language, proficiency);
    
    if (charName) {
      addCharacter({
        id: crypto.randomUUID(),
        name: charName,
        personality: 'Determined', // Simplified for demo
        appearance: charDesc,
        referenceImageUrl: charImg || undefined
      });
    }

    const settingId = crypto.randomUUID();
    if (settingName) {
      addSetting({
        id: settingId,
        name: settingName,
        appearance: settingDesc,
        atmosphere: settingAtmosphere,
        referenceImageUrl: settingImg || undefined
      });
    }

    // Clear builder state
    localStorage.removeItem(BUILDER_STORAGE_KEY);

    // Small delay to ensure state updates
    setTimeout(() => navigate('/story/active'), 100);
  };

  return (
    <div className="w-full h-full flex-grow p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
           <span className="text-anime-primary">Step {step}/3:</span> 
           {step === 1 ? 'Select Language' : step === 2 ? 'Create Protagonist' : 'World Building'}
        </h2>

        {/* STEP 1: Language */}
        {step === 1 && (
          <div className="animate-fade-in space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(Language).map((lang) => (
                <div 
                    key={lang}
                    onClick={() => updateState({ language: lang })}
                    className={`p-6 rounded-xl border cursor-pointer transition-all ${language === lang ? 'border-anime-primary bg-anime-primary/20 ring-2 ring-anime-primary' : 'border-gray-700 bg-gray-800 hover:bg-gray-700'}`}
                >
                    <h3 className="text-xl font-bold text-center">{lang}</h3>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <label className="block text-gray-400">Proficiency Level</label>
              <div className="flex gap-4">
                  {Object.values(Proficiency).map((level) => (
                      <button 
                        key={level}
                        onClick={() => updateState({ proficiency: level })}
                        className={`px-4 py-2 rounded-full border text-sm ${proficiency === level ? 'border-anime-accent bg-anime-accent/20 text-anime-accent' : 'border-gray-600 text-gray-400'}`}
                      >
                          {level}
                      </button>
                  ))}
              </div>
            </div>

            <Button onClick={() => updateState({ step: 2 })} className="w-full mt-8">Next Step <ChevronRight /></Button>
          </div>
        )}

        {/* STEP 2: Character */}
        {step === 2 && (
          <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="flex justify-end items-center gap-4">
                    <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700">
                        {['Male', 'Female', 'NB'].map((g) => (
                            <button
                                key={g}
                                onClick={() => updateState({ charGender: g })}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                                    charGender === g 
                                    ? 'bg-anime-primary text-white shadow-md' 
                                    : 'text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                    <Button 
                        onClick={handleAutoFillCharacter} 
                        disabled={loading} 
                        variant="ghost" 
                        className="text-sm text-anime-accent hover:text-pink-400"
                    >
                        <Dices size={16} className="mr-2" /> Surprise Me
                    </Button>
                </div>
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm text-gray-400">Character Name</label>
                        <button 
                            onClick={() => handleMagicWand('name', charName)}
                            disabled={!!wandLoading}
                            className={`text-anime-primary hover:text-indigo-400 transition-colors ${wandLoading === 'name' ? 'animate-spin' : ''}`}
                            title="AI Generate/Enhance"
                        >
                            <Wand2 size={16} />
                        </button>
                    </div>
                    <input 
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:border-anime-primary outline-none transition-colors"
                        value={charName}
                        onChange={(e) => updateState({ charName: e.target.value })}
                        placeholder="e.g. Akira"
                    />
                </div>
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm text-gray-400">Visual Description</label>
                        <button 
                            onClick={() => handleMagicWand('appearance', charDesc)}
                            disabled={!!wandLoading}
                            className={`text-anime-primary hover:text-indigo-400 transition-colors ${wandLoading === 'appearance' ? 'animate-spin' : ''}`}
                            title="AI Generate/Enhance"
                        >
                            <Wand2 size={16} />
                        </button>
                    </div>
                    <textarea 
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 h-32 focus:border-anime-primary outline-none transition-colors"
                        value={charDesc}
                        onChange={(e) => updateState({ charDesc: e.target.value })}
                        placeholder="e.g. Spiky blue hair, cybernetic arm, wearing a trenchcoat. Intense eyes."
                    />
                </div>
                <Button 
                    onClick={handleGenerateCharacter} 
                    isLoading={loading}
                    disabled={!charName || !charDesc}
                    variant="accent"
                    className="w-full"
                >
                    <Sparkles className="mr-2" size={18} /> Generate Design
                </Button>
            </div>

            <div className="flex items-center justify-center bg-black/50 rounded-xl border border-gray-800 h-80 md:h-auto overflow-hidden relative">
                {charImg ? (
                    <img src={charImg} alt="Character design" className="w-full h-full object-cover" />
                ) : (
                    <div className="text-center text-gray-600">
                        <User size={48} className="mx-auto mb-2 opacity-50" />
                        <p>Character Sheet Preview</p>
                    </div>
                )}
            </div>
            
            <div className="col-span-1 md:col-span-2 flex justify-between mt-4">
                 <Button variant="ghost" onClick={() => updateState({ step: 1 })}>Back</Button>
                 <Button onClick={() => updateState({ step: 3 })} disabled={!charImg}>Next Step <ChevronRight /></Button>
            </div>
          </div>
        )}

        {/* STEP 3: Setting */}
        {step === 3 && (
          <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="flex justify-end">
                    <Button 
                        onClick={handleAutoFillSetting} 
                        disabled={loading} 
                        variant="ghost" 
                        className="text-sm text-anime-accent hover:text-pink-400"
                    >
                        <Dices size={16} className="mr-2" /> Surprise Me
                    </Button>
                </div>
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm text-gray-400">Location Name</label>
                        <button 
                            onClick={() => handleMagicWand('settingName', settingName)}
                            disabled={!!wandLoading}
                            className={`text-anime-primary hover:text-indigo-400 transition-colors ${wandLoading === 'settingName' ? 'animate-spin' : ''}`}
                            title="AI Generate/Enhance"
                        >
                            <Wand2 size={16} />
                        </button>
                    </div>
                    <input 
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:border-anime-primary outline-none transition-colors"
                        value={settingName}
                        onChange={(e) => updateState({ settingName: e.target.value })}
                        placeholder="e.g. Neo-Tokyo Sector 7"
                    />
                </div>
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm text-gray-400">Visual Description</label>
                        <button 
                            onClick={() => handleMagicWand('settingDesc', settingDesc)}
                            disabled={!!wandLoading}
                            className={`text-anime-primary hover:text-indigo-400 transition-colors ${wandLoading === 'settingDesc' ? 'animate-spin' : ''}`}
                            title="AI Generate/Enhance"
                        >
                            <Wand2 size={16} />
                        </button>
                    </div>
                    <textarea 
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 h-24 focus:border-anime-primary outline-none transition-colors"
                        value={settingDesc}
                        onChange={(e) => updateState({ settingDesc: e.target.value })}
                        placeholder="e.g. Narrow alleyway filled with neon signs, raining, steam rising from vents."
                    />
                </div>
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm text-gray-400">Atmosphere</label>
                        <button 
                            onClick={() => handleMagicWand('atmosphere', settingAtmosphere)}
                            disabled={!!wandLoading}
                            className={`text-anime-primary hover:text-indigo-400 transition-colors ${wandLoading === 'atmosphere' ? 'animate-spin' : ''}`}
                            title="AI Generate/Enhance"
                        >
                            <Wand2 size={16} />
                        </button>
                    </div>
                    <input 
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:border-anime-primary outline-none transition-colors"
                        value={settingAtmosphere}
                        onChange={(e) => updateState({ settingAtmosphere: e.target.value })}
                        placeholder="e.g. Mysterious, Dangerous, Cozy"
                    />
                </div>
                <Button 
                    onClick={handleGenerateSetting} 
                    isLoading={loading}
                    disabled={!settingName || !settingDesc}
                    variant="accent"
                    className="w-full"
                >
                    <Sparkles className="mr-2" size={18} /> Generate Background
                </Button>
            </div>

            <div className="flex items-center justify-center bg-black/50 rounded-xl border border-gray-800 h-64 md:h-auto overflow-hidden relative">
                {settingImg ? (
                    <img src={settingImg} alt="Setting design" className="w-full h-full object-cover" />
                ) : (
                    <div className="text-center text-gray-600">
                        <MapPin size={48} className="mx-auto mb-2 opacity-50" />
                        <p>Background Preview</p>
                    </div>
                )}
            </div>

            <div className="col-span-1 md:col-span-2 flex justify-between mt-4">
                 <Button variant="ghost" onClick={() => updateState({ step: 2 })}>Back</Button>
                 <Button onClick={handleFinish} disabled={!settingImg} className="bg-green-600 hover:bg-green-500 shadow-green-500/30">Start Story</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Builder;