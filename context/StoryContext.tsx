import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Character, Language, PlotState, Proficiency, Setting, Story, StoryLog, StorySettings, VoiceGender, Item } from '../types';
import { musicService } from '../services/musicService';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { deleteImage } from '../services/imageService';

interface StoryContextType {
  story: Story | null;
  quests: Story[];
  loading: boolean;
  isSaving: boolean;
  initStory: (language: Language, proficiency: Proficiency) => void;
  updatePlot: (plot: Partial<PlotState>) => void;
  updateSettings: (settings: Partial<StorySettings>) => void;
  addCharacter: (char: Character) => void;
  deleteCharacter: (id: string) => void;
  addSetting: (setting: Setting) => void;
  deleteSetting: (id: string) => void;
  addItem: (item: Item) => void;
  deleteItem: (id: string) => void;
  setActiveSetting: (id: string) => void;
  addLog: (log: StoryLog) => void;
  updateLog: (id: string, updates: Partial<StoryLog>) => void;
  deleteLastLog: () => void;
  selectQuest: (id: string) => void;
  deleteQuest: (id: string) => Promise<void>;
  refreshQuests: () => Promise<void>;
  resetStory: () => void;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

export const StoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [quests, setQuests] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load all quests from Firestore
  useEffect(() => {
    const loadQuests = async () => {
      if (!user) {
        setQuests([]);
        setStory(null);
        setLoading(false);
        return;
      }

      try {
        const questsRef = collection(db, 'users', user.uid, 'quests');
        const questsSnap = await getDocs(questsRef);
        const loadedQuests = questsSnap.docs.map(d => d.data() as Story);
        
        setQuests(loadedQuests);

        // Load active quest from user metadata or default to first one
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        let activeId = userSnap.exists() ? userSnap.data().activeQuestId : null;

        if (!activeId && loadedQuests.length > 0) {
            activeId = loadedQuests[0].id;
        }

        if (activeId) {
            const activeQuest = loadedQuests.find(q => q.id === activeId);
            if (activeQuest) {
                // BGM should always start OFF per user request
                if (activeQuest.preferences) {
                    activeQuest.preferences.bgmEnabled = false;
                }
                setStory(activeQuest);
            }
        }
      } catch (error) {
        console.error('Failed to load quests from Firestore:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuests();
  }, [user]);

  // Save active story to Firestore
  useEffect(() => {
    const saveStory = async () => {
      if (user && story) {
        setIsSaving(true);
        try {
          // Sanitize object to remove 'undefined' values before saving to Firestore
          const sanitizedStory = JSON.parse(JSON.stringify(story));
          
          // Save the quest data
          await setDoc(doc(db, 'users', user.uid, 'quests', story.id), sanitizedStory);
          // Update user metadata for active quest
          await setDoc(doc(db, 'users', user.uid), { activeQuestId: story.id }, { merge: true });
          
          // Update quests list locally
          setQuests(prev => {
              const idx = prev.findIndex(q => q.id === story.id);
              if (idx > -1) {
                  const updated = [...prev];
                  updated[idx] = story;
                  return updated;
              }
              return [story, ...prev];
          });
        } catch (error) {
          console.error('Failed to save story to Firestore:', error);
        } finally {
          setIsSaving(false);
        }
      }
    };

    if (!loading) saveStory();
  }, [story, user, loading]);

  useEffect(() => {
    if (story?.preferences.bgmEnabled) {
      musicService.connect().then(() => {
        musicService.start();
        musicService.setVolume(story.preferences.bgmVolume);
        
        if (story.logs.length > 0) {
            const lastLog = story.logs[story.logs.length - 1];
            const activeSetting = story.settings.find(s => s.id === story.activeSettingId) || story.settings[0];
            musicService.updateBGM(lastLog.mood || 'Peaceful', activeSetting?.name || 'Unknown');
        }
      });
    } else {
      musicService.stop();
    }
  }, [story?.preferences.bgmEnabled]);

  useEffect(() => {
    if (story?.preferences.bgmEnabled) {
        musicService.setVolume(story.preferences.bgmVolume);
    }
  }, [story?.preferences.bgmVolume]);

  const initStory = (language: Language, proficiency: Proficiency) => {
    const newStory: Story = {
      id: crypto.randomUUID(),
      language,
      proficiency,
      characters: [],
      settings: [],
      items: [],
      activeSettingId: '',
      plot: {
        genre: 'Adventure',
        currentArc: 'Introduction',
        tone: 'Exciting'
      },
      logs: [],
      preferences: {
        voiceGender: VoiceGender.FEMALE,
        bgmEnabled: false,
        bgmVolume: 0.5
      }
    };
    setStory(newStory);
  };

  const refreshQuests = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const questsRef = collection(db, 'users', user.uid, 'quests');
      const questsSnap = await getDocs(questsRef);
      setQuests(questsSnap.docs.map(d => d.data() as Story));
    } finally {
      setLoading(false);
    }
  };

  const selectQuest = (id: string) => {
    const quest = quests.find(q => q.id === id);
    if (quest) {
        // Ensure BGM starts off when switching
        setStory({ ...quest, preferences: { ...quest.preferences, bgmEnabled: false } });
    }
  };

  const deleteQuest = async (id: string) => {
    if (!user) return;
    try {
        const questToDelete = quests.find(q => q.id === id);
        
        if (questToDelete) {
            const deletePromises: Promise<void>[] = [];

            // Characters
            questToDelete.characters.forEach(c => {
                if (c.referenceImageUrl) deletePromises.push(deleteImage(c.referenceImageUrl));
            });

            // Settings
            questToDelete.settings.forEach(s => {
                if (s.referenceImageUrl) deletePromises.push(deleteImage(s.referenceImageUrl));
            });

            // Items
            if (questToDelete.items) {
                questToDelete.items.forEach(i => {
                    if (i.referenceImageUrl) deletePromises.push(deleteImage(i.referenceImageUrl));
                });
            }

            // Story Logs (Scene Illustrations)
            questToDelete.logs.forEach(log => {
                if (log.illustrationUrl) deletePromises.push(deleteImage(log.illustrationUrl));
            });

            await Promise.allSettled(deletePromises);
        }

        await deleteDoc(doc(db, 'users', user.uid, 'quests', id));
        setQuests(prev => prev.filter(q => q.id !== id));
        if (story?.id === id) {
            setStory(null);
        }
    } catch (error) {
        console.error('Failed to delete quest:', error);
    }
  };

  const updatePlot = (plotUpdates: Partial<PlotState>) => {
    setStory(prev => prev ? { ...prev, plot: { ...prev.plot, ...plotUpdates } } : null);
  };

  const updateSettings = (settingsUpdates: Partial<StorySettings>) => {
    setStory(prev => prev ? { ...prev, preferences: { ...prev.preferences, ...settingsUpdates } } : null);
  };

  const addCharacter = (char: Character) => {
    setStory(prev => prev ? { ...prev, characters: [...prev.characters, char] } : null);
  };

  const deleteCharacter = (id: string) => {
    setStory(prev => {
        if (!prev) return null;
        const char = prev.characters.find(c => c.id === id);
        if (char?.referenceImageUrl) deleteImage(char.referenceImageUrl);
        return { ...prev, characters: prev.characters.filter(c => c.id !== id) };
    });
  };

  const addSetting = (setting: Setting) => {
    setStory(prev => {
        if (!prev) return null;
        const isFirst = prev.settings.length === 0;
        return { 
            ...prev, 
            settings: [...prev.settings, setting],
            activeSettingId: isFirst ? setting.id : prev.activeSettingId
        };
    });
  };

  const deleteSetting = (id: string) => {
    setStory(prev => {
        if (!prev) return null;
        const setting = prev.settings.find(s => s.id === id);
        if (setting?.referenceImageUrl) deleteImage(setting.referenceImageUrl);
        
        const newSettings = prev.settings.filter(s => s.id !== id);
        // If we deleted the active setting, fallback to the first available one or empty string
        const newActiveId = prev.activeSettingId === id 
            ? (newSettings.length > 0 ? newSettings[0].id : '') 
            : prev.activeSettingId;

        return { 
            ...prev, 
            settings: newSettings,
            activeSettingId: newActiveId
        };
    });
  };

  const addItem = (item: Item) => {
    setStory(prev => prev ? { ...prev, items: [...prev.items, item] } : null);
  };

  const deleteItem = (id: string) => {
    setStory(prev => {
        if (!prev) return null;
        const item = prev.items.find(i => i.id === id);
        if (item?.referenceImageUrl) deleteImage(item.referenceImageUrl);
        return { ...prev, items: prev.items.filter(i => i.id !== id) };
    });
  };

  const setActiveSetting = (id: string) => {
    setStory(prev => prev ? { ...prev, activeSettingId: id } : null);
  };

  const addLog = (log: StoryLog) => {
    setStory(prev => prev ? { ...prev, logs: [...prev.logs, log] } : null);
  };

  const updateLog = (id: string, updates: Partial<StoryLog>) => {
    setStory(prev => {
        if(!prev) return null;
        return {
            ...prev,
            logs: prev.logs.map(log => log.id === id ? { ...log, ...updates } : log)
        };
    });
  };

  const deleteLastLog = () => {
    setStory(prev => {
        if (!prev || prev.logs.length === 0) return prev;
        
        const lastLog = prev.logs[prev.logs.length - 1];
        if (lastLog.illustrationUrl) {
            deleteImage(lastLog.illustrationUrl);
        }

        return {
            ...prev,
            logs: prev.logs.slice(0, -1)
        };
    });
  };

  const resetStory = () => {
    setStory(null);
  };

  return (
    <StoryContext.Provider value={{ story, quests, loading, isSaving, initStory, updatePlot, updateSettings, addCharacter, deleteCharacter, addSetting, deleteSetting, addItem, deleteItem, setActiveSetting, addLog, updateLog, deleteLastLog, selectQuest, deleteQuest, refreshQuests, resetStory }}>
      {children}
    </StoryContext.Provider>
  );
};

export const useStory = () => {
  const context = useContext(StoryContext);
  if (context === undefined) {
    throw new Error('useStory must be used within a StoryProvider');
  }
  return context;
};