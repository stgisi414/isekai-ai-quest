import React, { useEffect, useState } from 'react';
import { useLearning } from '../context/LearningContext';
import { useStory } from '../context/StoryContext';
import { Plus, Check } from 'lucide-react';

const SelectionTooltip: React.FC = () => {
  const { addNote, hasNote } = useLearning();
  const { story } = useStory();
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectionContext, setSelectionContext] = useState('');

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setPosition(null);
        return;
      }

      const text = selection.toString().trim();
      // Limit to 50 chars as requested
      if (text.length === 0 || text.length > 50) {
        setPosition(null);
        return;
      }

      // Check if selection is within the story area? 
      // Ideally yes, but "dashboard note taker" implies taking notes from the app content.
      // We assume mostly story text.

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Get context (simple paragraph extraction)
      let context = "";
      if (selection.anchorNode && selection.anchorNode.parentElement) {
         context = selection.anchorNode.parentElement.textContent || "";
      }

      setSelectedText(text);
      setSelectionContext(context);
      
      // Calculate position (fixed coordinates relative to viewport)
      // 40px above the selection
      const top = rect.top - 45; 
      const left = rect.left + rect.width / 2;

      // Ensure it's on screen (roughly)
      if (top < 0) {
          // Flip to bottom if top is clipped
          setPosition({ top: rect.bottom + 10, left });
      } else {
          setPosition({ top, left });
      }
    };

    // Debounce selection change slightly to avoid flickering
    let timeout: any;
    const onSelectionChange = () => {
        clearTimeout(timeout);
        timeout = setTimeout(handleSelection, 200);
    };

    document.addEventListener('selectionchange', onSelectionChange);

    return () => {
        document.removeEventListener('selectionchange', onSelectionChange);
        clearTimeout(timeout);
    };
  }, []);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (story && selectedText) {
      addNote(selectedText, story.language, story.proficiency, selectionContext);
    }
  };

  if (!position || !story) return null;
  
  const isSaved = hasNote(selectedText);

  return (
    <div 
        className="fixed z-50 transform -translate-x-1/2 bg-gray-900 border border-anime-primary text-white text-sm rounded-lg shadow-2xl flex items-center gap-2 px-3 py-1.5 animate-fade-in pointer-events-auto select-none backdrop-blur-md"
        style={{ top: position.top, left: position.left }}
        onMouseDown={(e) => e.preventDefault()} // Prevent clearing selection when clicking tooltip
    >
       <span className="font-bold truncate max-w-[150px] font-cjk">{selectedText}</span>
       {isSaved ? (
           <span className="text-green-400 flex items-center gap-1 text-xs font-bold uppercase tracking-wider"><Check size={14} /> Saved</span>
       ) : (
           <button 
             onClick={handleSave} 
             className="bg-anime-primary hover:bg-indigo-500 rounded p-1 transition-colors flex items-center gap-1 text-xs font-bold px-2"
           >
             <Plus size={14} /> Save Note
           </button>
       )}
       {/* Arrow */}
       <div className="absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 border-anime-primary transform rotate-45"
            style={{ 
                bottom: position.top < (window.getSelection()?.getRangeAt(0).getBoundingClientRect().top || 0) ? '-5px' : 'auto',
                top: position.top > (window.getSelection()?.getRangeAt(0).getBoundingClientRect().top || 0) ? '-5px' : 'auto', // Logic bit fuzzy here due to flip, simplifying:
                borderBottomWidth: '1px', borderRightWidth: '1px',
                // This arrow logic is tricky with flipping. I'll stick to bottom arrow (tooltip on top) default
                // If flipped, arrow should be on top.
            }}
       ></div>
    </div>
  );
};

export default SelectionTooltip;