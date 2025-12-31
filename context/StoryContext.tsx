import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Character, Language, PlotState, Proficiency, Setting, Story, StoryLog } from '../types';

interface StoryContextType {
  story: Story | null;
  initStory: (language: Language, proficiency: Proficiency) => void;
  updatePlot: (plot: Partial<PlotState>) => void;
  addCharacter: (char: Character) => void;
  addSetting: (setting: Setting) => void;
  addLog: (log: StoryLog) => void;
  updateLog: (id: string, updates: Partial<StoryLog>) => void;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

export const StoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [story, setStory] = useState<Story | null>(null);

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
      logs: []
    });
  };

  const updatePlot = (plotUpdates: Partial<PlotState>) => {
    if (!story) return;
    setStory(prev => prev ? { ...prev, plot: { ...prev.plot, ...plotUpdates } } : null);
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

  return (
    <StoryContext.Provider value={{ story, initStory, updatePlot, addCharacter, addSetting, addLog, updateLog }}>
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