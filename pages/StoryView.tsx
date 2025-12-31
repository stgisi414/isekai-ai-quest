import React, { useEffect, useRef, useState } from 'react';
import { useStory } from '../context/StoryContext';
import { generateNextStorySegment, generateSceneIllustration } from '../services/geminiService';
import StoryLogItem from '../components/StoryLogItem';
import Button from '../components/Button';
import { Play, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StoryView: React.FC = () => {
  const { story, addLog, updateLog } = useStory();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Redirect if no story exists
  useEffect(() => {
    if (!story) {
      navigate('/builder');
    }
  }, [story, navigate]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [story?.logs]);

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

    try {
      // 2. Generate Text Content
      const lastLog = story.logs.length > 0 ? story.logs[story.logs.length - 1].text : "Start of story.";
      const segmentData = await generateNextStorySegment(
        story.language,
        story.proficiency,
        `Last event: ${lastLog}`,
        story.characters,
        story.settings
      );

      // Update log with text
      updateLog(tempId, {
        ...segmentData,
        isLoading: true // Still loading image
      });

      // 3. Generate Image Content
      const imageUrl = await generateSceneIllustration(
        segmentData.text,
        story.characters,
        story.settings.length > 0 ? story.settings[0] : null // Default to first setting for demo
      );

      // Finalize log
      updateLog(tempId, {
        illustrationUrl: imageUrl,
        isLoading: false
      });

    } catch (error) {
      console.error("Story generation failed", error);
      // Remove temp log or show error state (omitted for brevity)
    } finally {
      setIsGenerating(false);
    }
  };

  if (!story) return null;

  return (
    <div className="min-h-screen bg-anime-dark text-white flex flex-col">
      {/* Sticky Header */}
      <div className="fixed top-0 w-full z-50 bg-anime-dark/80 backdrop-blur-md border-b border-white/5 p-4 flex justify-between items-center">
        <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-anime-primary to-anime-accent">
                {story.plot.genre} in {story.language}
            </h1>
            <p className="text-xs text-gray-400">Proficiency: {story.proficiency}</p>
        </div>
        <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate('/')}>Exit</Button>
        </div>
      </div>

      {/* Main Content Feed */}
      <div className="flex-1 container mx-auto px-4 py-24 max-w-3xl">
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
      <div className="fixed bottom-0 w-full bg-gradient-to-t from-anime-dark via-anime-dark to-transparent pt-12 pb-6 px-4">
        <div className="max-w-xl mx-auto flex gap-4">
            <Button 
                onClick={handleNext} 
                isLoading={isGenerating} 
                className="w-full text-lg h-14 shadow-2xl shadow-anime-primary/50"
            >
                {story.logs.length === 0 ? "Start Story" : "Continue Story"} <Play className="ml-2" fill="currentColor" />
            </Button>
        </div>
      </div>
    </div>
  );
};

export default StoryView;