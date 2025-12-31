import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStory } from '../context/StoryContext';
import { generateCharacterVisual, generateSettingVisual } from '../services/geminiService';
import { Language, Proficiency } from '../types';
import Button from '../components/Button';
import { Sparkles, MapPin, User, ChevronRight } from 'lucide-react';

const Builder: React.FC = () => {
  const navigate = useNavigate();
  const { initStory, addCharacter, addSetting } = useStory();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // State for form
  const [language, setLanguage] = useState<Language>(Language.JP);
  const [proficiency, setProficiency] = useState<Proficiency>(Proficiency.BEGINNER);
  
  const [charName, setCharName] = useState('');
  const [charDesc, setCharDesc] = useState('');
  const [charImg, setCharImg] = useState<string | null>(null);
  
  const [settingName, setSettingName] = useState('');
  const [settingDesc, setSettingDesc] = useState('');
  const [settingAtmosphere, setSettingAtmosphere] = useState('');
  const [settingImg, setSettingImg] = useState<string | null>(null);

  const handleGenerateCharacter = async () => {
    if (!charName || !charDesc) return;
    setLoading(true);
    const url = await generateCharacterVisual(charName, charDesc);
    setCharImg(url);
    setLoading(false);
  };

  const handleGenerateSetting = async () => {
    if (!settingName || !settingDesc) return;
    setLoading(true);
    const url = await generateSettingVisual(settingName, settingDesc, settingAtmosphere);
    setSettingImg(url);
    setLoading(false);
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

    if (settingName) {
      addSetting({
        id: crypto.randomUUID(),
        name: settingName,
        appearance: settingDesc,
        atmosphere: settingAtmosphere,
        referenceImageUrl: settingImg || undefined
      });
    }

    // Small delay to ensure state updates
    setTimeout(() => navigate('/story/active'), 100);
  };

  return (
    <div className="min-h-screen bg-anime-dark text-white p-6 md:p-12">
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
                    onClick={() => setLanguage(lang)}
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
                        onClick={() => setProficiency(level)}
                        className={`px-4 py-2 rounded-full border text-sm ${proficiency === level ? 'border-anime-accent bg-anime-accent/20 text-anime-accent' : 'border-gray-600 text-gray-400'}`}
                      >
                          {level}
                      </button>
                  ))}
              </div>
            </div>

            <Button onClick={() => setStep(2)} className="w-full mt-8">Next Step <ChevronRight /></Button>
          </div>
        )}

        {/* STEP 2: Character */}
        {step === 2 && (
          <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Character Name</label>
                    <input 
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:border-anime-primary outline-none transition-colors"
                        value={charName}
                        onChange={(e) => setCharName(e.target.value)}
                        placeholder="e.g. Akira"
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Visual Description</label>
                    <textarea 
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 h-32 focus:border-anime-primary outline-none transition-colors"
                        value={charDesc}
                        onChange={(e) => setCharDesc(e.target.value)}
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
                 <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                 <Button onClick={() => setStep(3)} disabled={!charImg}>Next Step <ChevronRight /></Button>
            </div>
          </div>
        )}

        {/* STEP 3: Setting */}
        {step === 3 && (
          <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Location Name</label>
                    <input 
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:border-anime-primary outline-none transition-colors"
                        value={settingName}
                        onChange={(e) => setSettingName(e.target.value)}
                        placeholder="e.g. Neo-Tokyo Sector 7"
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Visual Description</label>
                    <textarea 
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 h-24 focus:border-anime-primary outline-none transition-colors"
                        value={settingDesc}
                        onChange={(e) => setSettingDesc(e.target.value)}
                        placeholder="e.g. Narrow alleyway filled with neon signs, raining, steam rising from vents."
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Atmosphere</label>
                    <input 
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:border-anime-primary outline-none transition-colors"
                        value={settingAtmosphere}
                        onChange={(e) => setSettingAtmosphere(e.target.value)}
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
                 <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                 <Button onClick={handleFinish} disabled={!settingImg} className="bg-green-600 hover:bg-green-500 shadow-green-500/30">Start Story</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Builder;