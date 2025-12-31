import React, { useEffect, useRef, useState } from 'react';
import { useStory } from '../context/StoryContext';
import { generateNextStorySegment, generateSceneIllustration, generateSettingVisual, generateRandomSetting, generateRandomCharacter, generateCharacterVisual, magicWand } from '../services/geminiService';
import { uploadBase64Image } from '../services/imageService';
import { musicService } from '../services/musicService';
import StoryLogItem from '../components/StoryLogItem';
import SelectionTooltip from '../components/SelectionTooltip';
import Button from '../components/Button';
import { Play, MapPin, Plus, X, Dices, Sparkles, Users, Package, User, Wand2, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StoryView: React.FC = () => {
  const { story, loading, addLog, updateLog, deleteLastLog, addSetting, deleteSetting, setActiveSetting, addCharacter, deleteCharacter, addItem, deleteItem } = useStory();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Location Modal State
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const [newSettingName, setNewSettingName] = useState('');
  const [newSettingDesc, setNewSettingDesc] = useState('');
  const [newSettingAtmosphere, setNewSettingAtmosphere] = useState('');
  
  // Character & Item Modal State
  const [isManifestOpen, setIsManifestOpen] = useState(false);
  const [isCreatingEntity, setIsCreatingEntity] = useState<'char' | 'item' | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newGender, setNewGender] = useState('Female');
  
  const [isCreatingLoading, setIsCreatingLoading] = useState(false);
  const [wandLoading, setWandLoading] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Redirect if no story exists
  useEffect(() => {
    if (!loading && !story) {
      navigate('/builder');
    }
  }, [story, loading, navigate]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [story?.logs]);

  // Initial BGM trigger
  useEffect(() => {
    if (story && story.logs.length > 0 && story.preferences.bgmEnabled) {
      const lastLog = story.logs[story.logs.length - 1];
      const activeSetting = story.settings.find(s => s.id === story.activeSettingId) || story.settings[0];
      musicService.updateBGM(lastLog.mood || 'Peaceful', activeSetting?.name || 'Unknown');
    }
  }, []);

  const activeSetting = story?.settings.find(s => s.id === story.activeSettingId) || story?.settings[0] || null;

  const handleMagicWand = async (field: any, current: string, setter: (val: string) => void) => {
    if (!story) return;
    setWandLoading(field);
    const newValue = await magicWand(field, current, story.language);
    setter(newValue);
    setWandLoading(null);
  };

  const handleNext = async () => {
    if (!story || isGenerating) return;
    setIsGenerating(true);

    // 1. Create a placeholder log entry
    const tempId = crypto.randomUUID();
    addLog({
      id: tempId,
      text: '',
      translation: '',
      vocab: [],
      isLoading: true
    });
    
    let textGenerated = false;

    try {
      // 2. Generate Text Content
      const lastLog = story.logs.length > 0 ? story.logs[story.logs.length - 1].text : "Start of story.";
      
      // Get last 5 activities to prevent repetition
      const recentActivities = story.logs
        .slice(-5)
        .filter(log => log.activity)
        .map(log => ({
            type: log.activity!.type,
            question: log.activity!.question
        }));

      const segmentData = await generateNextStorySegment(
        story.language,
        story.proficiency,
        `Last event: ${lastLog}`,
        story.characters,
        story.settings,
        recentActivities
      );

      // Update log with text
      updateLog(tempId, {
        ...segmentData,
        isLoading: true // Still loading image
      });
      textGenerated = true;

      // 3. Steer Background Music
      if (story.preferences.bgmEnabled) {
        musicService.updateBGM(segmentData.mood || 'Peaceful', activeSetting?.name || 'Unknown');
      }

      // 4. Generate Image Content
      // Max 5 human references, Max 9 object references
      const humanRefs = story.characters.filter(c => c.referenceImageUrl).slice(0, 5);
      const objectRefs = (story.items || []).filter(i => i.referenceImageUrl).slice(0, 9);

      const base64Image = await generateSceneIllustration(
        segmentData.text,
        humanRefs,
        activeSetting,
        objectRefs
      );

      const imageUrl = await uploadBase64Image(base64Image, 'scenes');

      updateLog(tempId, {
        illustrationUrl: imageUrl,
        isLoading: false
      });

    } catch (error) {
      console.error("Story generation failed", error);
      if (!textGenerated) {
          deleteLastLog();
      } else {
          updateLog(tempId, { isLoading: false });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAutoFillEntity = async () => {
    if (!story) return;
    setIsCreatingLoading(true);
    try {
        if (isCreatingEntity === 'char') {
            const profile = await generateRandomCharacter(story.language, newGender);
            setNewName(profile.name);
            setNewDesc(profile.appearance);
        } else {
            // For items, we'll use a generic random setting generator for now or create a specific one
            // Reusing generateRandomSetting but for objects
            const profile = await generateRandomSetting(story.language);
            setNewName(profile.name);
            setNewDesc(profile.appearance);
        }
    } finally {
        setIsCreatingLoading(false);
    }
  };

  const handleCreateEntity = async () => {
    if (!newName || !newDesc) return;
    setIsCreatingLoading(true);
    try {
        if (isCreatingEntity === 'char') {
            const base64 = await generateCharacterVisual(newName, newDesc);
            const url = await uploadBase64Image(base64, 'characters');
            addCharacter({
                id: crypto.randomUUID(),
                name: newName,
                appearance: newDesc,
                personality: 'New Companion',
                referenceImageUrl: url
            });
        } else {
            // Reusing generateCharacterVisual for items as well (it's general purpose image gen)
            const base64 = await generateCharacterVisual(newName, newDesc, "High-quality anime object design, detailed, neutral background");
            const url = await uploadBase64Image(base64, 'items');
            addItem({
                id: crypto.randomUUID(),
                name: newName,
                description: newDesc,
                referenceImageUrl: url
            });
        }
        setIsCreatingEntity(null);
        setIsManifestOpen(false);
        setNewName('');
        setNewDesc('');
    } catch (e) {
        console.error("Failed to create entity", e);
    } finally {
        setIsCreatingLoading(false);
    }
  };

  const handleAutoFillSetting = async () => {
    if (!story) return;
    setIsCreatingLoading(true);
    try {
        const profile = await generateRandomSetting(story.language);
        setNewSettingName(profile.name);
        setNewSettingDesc(profile.appearance);
        setNewSettingAtmosphere(profile.atmosphere);
    } finally {
        setIsCreatingLoading(false);
    }
  };

  const handleCreateSetting = async () => {
    if (!newSettingName || !newSettingDesc) return;
    setIsCreatingLoading(true);
    try {
        const base64 = await generateSettingVisual(newSettingName, newSettingDesc, newSettingAtmosphere);
        const url = await uploadBase64Image(base64, 'settings');
        const newId = crypto.randomUUID();
        addSetting({
            id: newId,
            name: newSettingName,
            appearance: newSettingDesc,
            atmosphere: newSettingAtmosphere,
            referenceImageUrl: url
        });
        setActiveSetting(newId);
        setIsCreatingLocation(false);
        setIsLocationModalOpen(false);
        setNewSettingName('');
        setNewSettingDesc('');
        setNewSettingAtmosphere('');
    } catch (e) {
        console.error("Failed to create setting", e);
    } finally {
        setIsCreatingLoading(false);
    }
  };

  if (loading) return null; // Handled by Layout overlay
  if (!story) return null;

  return (
    <div className="flex flex-col flex-grow relative">
      <SelectionTooltip />
      
      {/* Story Info Bar */}
      <div className="container mx-auto px-4 py-4 max-w-3xl border-b border-white/5 mb-4 flex flex-wrap items-center gap-4">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-anime-primary to-anime-accent inline-block mr-4">
              {story.plot.genre} in {story.language}
          </h1>
          <div className="flex gap-2">
            <span className="text-sm text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/10">
                Level: {story.proficiency}
            </span>
            <button 
                onClick={() => {
                    setIsLocationModalOpen(true);
                    setIsCreatingLocation(false);
                }} 
                className="flex items-center gap-1 text-sm text-gray-300 bg-white/5 px-2 py-1 rounded border border-white/10 hover:bg-white/10 hover:text-anime-primary transition-all"
            >
                <MapPin size={14} /> {activeSetting?.name || "Unknown Location"}
            </button>
            <button 
                onClick={() => {
                    setIsManifestOpen(true);
                    setIsCreatingEntity(null);
                }} 
                className="flex items-center gap-1 text-sm text-gray-300 bg-white/5 px-2 py-1 rounded border border-white/10 hover:bg-white/10 hover:text-anime-primary transition-all"
            >
                <Users size={14} /> Companions & Gear
            </button>
          </div>
      </div>

      {/* Main Content Feed */}
      <div className="flex-1 container mx-auto px-4 pb-32 max-w-3xl">
        {story.logs.length === 0 && (
           <div className="text-center py-20 opacity-50">
             <p className="text-xl mb-4">Your adventure is about to begin...</p>
             <p>Click "Continue Story" to generate the first scene.</p>
           </div>
        )}
        
        {story.logs.map(log => (
          <StoryLogItem key={log.id} log={log} />
        ))}
        
        <div ref={bottomRef} />
      </div>

      {/* Bottom Controls */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-anime-dark via-anime-dark to-transparent pt-12 pb-6 px-4 z-40">
        <div className="max-w-xl mx-auto flex gap-4">
            {story.logs.length > 0 && (
                <Button 
                    onClick={() => setIsDeleteConfirmOpen(true)} 
                    disabled={isGenerating}
                    variant="danger"
                    className="w-14 h-14 p-0 shrink-0"
                    title="Delete Last Segment"
                >
                    <Trash size={20} />
                </Button>
            )}
            <Button 
                onClick={handleNext} 
                isLoading={isGenerating} 
                className="w-full text-lg h-14 shadow-2xl shadow-anime-primary/50"
            >
                {story.logs.length === 0 ? "Start Story" : "Continue Story"} <Play className="ml-2" fill="currentColor" />
            </Button>
        </div>
      </div>

      {/* Location Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <MapPin className="text-anime-primary" /> 
                        {isCreatingLocation ? "Discover New Location" : "Travel Map"}
                    </h3>
                    <button onClick={() => setIsLocationModalOpen(false)} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 pr-2">
                    {!isCreatingLocation ? (
                        <div className="space-y-3">
                            {story.settings.map(setting => (
                                <div key={setting.id} className="relative group mb-3">
                                <button
                                    onClick={() => {
                                        setActiveSetting(setting.id);
                                        setIsLocationModalOpen(false);
                                    }}
                                    className={`w-full text-left p-4 rounded-xl border flex items-center gap-4 transition-all ${
                                        activeSetting?.id === setting.id
                                        ? 'bg-anime-primary/20 border-anime-primary ring-1 ring-anime-primary/50'
                                        : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                                    }`}
                                >
                                    <div className="w-16 h-16 rounded-lg bg-black/50 overflow-hidden shrink-0">
                                        <img src={setting.referenceImageUrl || 'https://picsum.photos/100'} className="w-full h-full object-cover" alt={setting.name} />
                                    </div>
                                    <div>
                                        <h4 className={`font-bold ${activeSetting?.id === setting.id ? 'text-anime-primary' : 'text-gray-200'}`}>{setting.name}</h4>
                                        <p className="text-xs text-gray-500 line-clamp-1">{setting.atmosphere}</p>
                                    </div>
                                    {activeSetting?.id === setting.id && <div className="ml-auto text-anime-primary text-xs font-bold uppercase tracking-wider">Current</div>}
                                </button>
                                {story.settings.length > 1 && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteSetting(setting.id);
                                        }}
                                        className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all z-10"
                                        title="Delete Location"
                                    >
                                        <Trash size={14} />
                                    </button>
                                )}
                                </div>
                            ))}
                            
                            <button 
                                onClick={() => setIsCreatingLocation(true)}
                                className="w-full p-4 rounded-xl border border-dashed border-gray-600 text-gray-400 hover:border-anime-accent hover:text-anime-accent hover:bg-anime-accent/5 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={20} /> Discover New Location
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                             <div className="flex justify-end">
                                <Button 
                                    onClick={handleAutoFillSetting} 
                                    disabled={isCreatingLoading} 
                                    variant="ghost" 
                                    className="text-xs text-anime-accent hover:text-pink-400 px-2 py-1"
                                >
                                    <Dices size={14} className="mr-1" /> Surprise Me
                                </Button>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm text-gray-400">Location Name</label>
                                    <button 
                                        onClick={() => handleMagicWand('settingName', newSettingName, setNewSettingName)}
                                        disabled={!!wandLoading}
                                        className={`text-anime-primary hover:text-indigo-400 transition-colors ${wandLoading === 'settingName' ? 'animate-spin' : ''}`}
                                    >
                                        <Wand2 size={14} />
                                    </button>
                                </div>
                                <input 
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:border-anime-primary outline-none"
                                    value={newSettingName}
                                    onChange={(e) => setNewSettingName(e.target.value)}
                                    placeholder="e.g. Crystal Cave"
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm text-gray-400">Visual Description</label>
                                    <button 
                                        onClick={() => handleMagicWand('settingDesc', newSettingDesc, setNewSettingDesc)}
                                        disabled={!!wandLoading}
                                        className={`text-anime-primary hover:text-indigo-400 transition-colors ${wandLoading === 'settingDesc' ? 'animate-spin' : ''}`}
                                    >
                                        <Wand2 size={14} />
                                    </button>
                                </div>
                                <textarea 
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 h-24 focus:border-anime-primary outline-none"
                                    value={newSettingDesc}
                                    onChange={(e) => setNewSettingDesc(e.target.value)}
                                    placeholder="e.g. Glowing crystals, underground lake."
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm text-gray-400">Atmosphere</label>
                                    <button 
                                        onClick={() => handleMagicWand('atmosphere', newSettingAtmosphere, setNewSettingAtmosphere)}
                                        disabled={!!wandLoading}
                                        className={`text-anime-primary hover:text-indigo-400 transition-colors ${wandLoading === 'atmosphere' ? 'animate-spin' : ''}`}
                                    >
                                        <Wand2 size={14} />
                                    </button>
                                </div>
                                <input 
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:border-anime-primary outline-none"
                                    value={newSettingAtmosphere}
                                    onChange={(e) => setNewSettingAtmosphere(e.target.value)}
                                    placeholder="e.g. Magical, Quiet"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex justify-between shrink-0">
                    {isCreatingLocation ? (
                        <>
                            <Button variant="ghost" onClick={() => setIsCreatingLocation(false)} disabled={isCreatingLoading}>Back</Button>
                            <Button 
                                onClick={handleCreateSetting} 
                                isLoading={isCreatingLoading} 
                                disabled={!newSettingName || !newSettingDesc}
                                variant="accent"
                            >
                                <Sparkles size={16} className="mr-2" /> Travel Here
                            </Button>
                        </>
                    ) : (
                        <Button variant="ghost" onClick={() => setIsLocationModalOpen(false)} className="ml-auto">Close</Button>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Companions & Items Modal */}
      {isManifestOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Users className="text-anime-primary" /> 
                        {isCreatingEntity === 'char' ? "Introduce Friend" : isCreatingEntity === 'item' ? "Add Equipment" : "Manifest"}
                    </h3>
                    <button onClick={() => setIsManifestOpen(false)} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 pr-2">
                    {!isCreatingEntity ? (
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Characters ({story.characters.length}/5)</h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {story.characters.map(char => (
                                        <div key={char.id} className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg border border-white/5 group">
                                            <img src={char.referenceImageUrl || 'https://picsum.photos/100'} className="w-10 h-10 rounded-md object-cover" alt={char.name} />
                                            <span className="font-bold flex-1">{char.name}</span>
                                            <button 
                                                onClick={() => deleteCharacter(char.id)} 
                                                className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                title="Dismiss Companion"
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {story.characters.length < 5 && (
                                        <button 
                                            onClick={() => setIsCreatingEntity('char')}
                                            className="w-full p-2 rounded-lg border border-dashed border-gray-700 text-gray-500 hover:border-anime-primary hover:text-anime-primary transition-all text-sm flex items-center justify-center gap-2"
                                        >
                                            <Plus size={16} /> Add Friend
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Items ({story.items?.length || 0}/9)</h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {(story.items || []).map(item => (
                                        <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg border border-white/5 group">
                                            <img src={item.referenceImageUrl || 'https://picsum.photos/100'} className="w-10 h-10 rounded-md object-cover" alt={item.name} />
                                            <span className="font-bold flex-1">{item.name}</span>
                                            <button 
                                                onClick={() => deleteItem(item.id)} 
                                                className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                title="Discard Item"
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {(story.items?.length || 0) < 9 && (
                                        <button 
                                            onClick={() => setIsCreatingEntity('item')}
                                            className="w-full p-2 rounded-lg border border-dashed border-gray-700 text-gray-500 hover:border-anime-accent hover:text-anime-accent transition-all text-sm flex items-center justify-center gap-2"
                                        >
                                            <Plus size={16} /> Add Item
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                             <div className="flex justify-between items-center">
                                {isCreatingEntity === 'char' ? (
                                    <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700">
                                        {['Male', 'Female', 'NB'].map((g) => (
                                            <button
                                                key={g}
                                                onClick={() => setNewGender(g)}
                                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                                                    newGender === g 
                                                    ? 'bg-anime-primary text-white' 
                                                    : 'text-gray-500'
                                                }`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                ) : <div />}
                                <Button 
                                    onClick={handleAutoFillEntity} 
                                    disabled={isCreatingLoading} 
                                    variant="ghost" 
                                    className="text-xs text-anime-accent hover:text-pink-400 px-2 py-1"
                                >
                                    <Dices size={14} className="mr-1" /> Surprise Me
                                </Button>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm text-gray-400">Name</label>
                                    <button 
                                        onClick={() => handleMagicWand(isCreatingEntity === 'char' ? 'name' : 'itemName', newName, setNewName)}
                                        disabled={!!wandLoading}
                                        className={`text-anime-primary hover:text-indigo-400 transition-colors ${wandLoading === (isCreatingEntity === 'char' ? 'name' : 'itemName') ? 'animate-spin' : ''}`}
                                    >
                                        <Wand2 size={14} />
                                    </button>
                                </div>
                                <input 
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:border-anime-primary outline-none"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder={isCreatingEntity === 'char' ? "e.g. Kaori" : "e.g. Magic Sword"}
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm text-gray-400">Description</label>
                                    <button 
                                        onClick={() => handleMagicWand(isCreatingEntity === 'char' ? 'appearance' : 'itemDesc', newDesc, setNewDesc)}
                                        disabled={!!wandLoading}
                                        className={`text-anime-primary hover:text-indigo-400 transition-colors ${wandLoading === (isCreatingEntity === 'char' ? 'appearance' : 'itemDesc') ? 'animate-spin' : ''}`}
                                    >
                                        <Wand2 size={14} />
                                    </button>
                                </div>
                                <textarea 
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 h-24 focus:border-anime-primary outline-none"
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    placeholder={isCreatingEntity === 'char' ? "e.g. Cheerful student with short hair." : "e.g. Glowing blade made of crystal."}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex justify-between shrink-0">
                    {isCreatingEntity ? (
                        <>
                            <Button variant="ghost" onClick={() => setIsCreatingEntity(null)} disabled={isCreatingLoading}>Back</Button>
                            <Button 
                                onClick={handleCreateEntity} 
                                isLoading={isCreatingLoading} 
                                disabled={!newName || !newDesc}
                                variant="primary"
                            >
                                <Sparkles size={16} className="mr-2" /> Manifest
                            </Button>
                        </>
                    ) : (
                        <Button variant="ghost" onClick={() => setIsManifestOpen(false)} className="ml-auto">Close</Button>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <div className="flex items-center gap-3 mb-4 text-red-400">
                    <Trash size={24} />
                    <h3 className="text-xl font-bold">Remove Segment?</h3>
                </div>
                
                <p className="text-gray-300 mb-6">
                    This will permanently delete the last story part and its illustration. This cannot be undone.
                </p>

                <div className="flex gap-3">
                    <Button 
                        variant="ghost" 
                        onClick={() => setIsDeleteConfirmOpen(false)}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={() => {
                            deleteLastLog();
                            setIsDeleteConfirmOpen(false);
                        }}
                        className="flex-1"
                    >
                        Delete
                    </Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default StoryView;