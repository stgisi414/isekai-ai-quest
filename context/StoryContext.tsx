import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Character, Language, PlotState, Proficiency, Setting, Story, StoryLog, StorySettings, VoiceGender } from '../types';

interface StoryContextType {
  story: Story | null;
  initStory: (language: Language, proficiency: Proficiency) => void;
  updatePlot: (plot: Partial<PlotState>) => void;
  updateSettings: (settings: Partial<StorySettings>) => void;
  addCharacter: (char: Character) => void;
  addSetting: (setting: Setting) => void;
  addLog: (log: StoryLog) => void;
  updateLog: (id: string, updates: Partial<StoryLog>) => void;
  resetStory: () => void;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

export const StoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [story, setStory] = useState<Story | null>(() => {
    try {
      const saved = localStorage.getItem('isekai_story_state');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load story state from local storage:', error);
      return null;
    }
  });

  React.useEffect(() => {
    if (story) {
      localStorage.setItem('isekai_story_state', JSON.stringify(story));
    }
  }, [story]);

  const initStory = (language: Language, proficiency: Proficiency) => {
    setStory({
      id: crypto.randomUUID(),
      language,
      proficiency,
      characters: [],
      settings: [],
      plot: {
        genre: 'Adventure',
        currentArc: 'Introduction',
        tone: 'Exciting'
      },
      logs: [],
      settings: {
        voiceGender: VoiceGender.FEMALE
      }
    });
  };

  const updatePlot = (plotUpdates: Partial<PlotState>) => {
    if (!story) return;
    setStory(prev => prev ? { ...prev, plot: { ...prev.plot, ...plotUpdates } } : null);
  };

  const updateSettings = (settingsUpdates: Partial<StorySettings>) => {
    if (!story) return;
    setStory(prev => prev ? { ...prev, settings: { ...prev.settings, ...settingsUpdates } } : null);
  };

  const addCharacter = (char: Character) => {
    setStory(prev => prev ? { ...prev, characters: [...prev.characters, char] } : null);
  };

  const addSetting = (setting: Setting) => {
    setStory(prev => prev ? { ...prev, settings: [...prev.settings, setting] } : null);
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

  const resetStory = () => {
    setStory(null);
    localStorage.removeItem('isekai_story_state');
  };

  return (
    <StoryContext.Provider value={{ story, initStory, updatePlot, updateSettings, addCharacter, addSetting, addLog, updateLog, resetStory }}>
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