import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Note, Language, Proficiency } from '../types';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface LearningContextType {
  notes: Note[];
  loading: boolean;
  addNote: (text: string, language: Language, proficiency: Proficiency, context?: string) => void;
  removeNote: (id: string) => void;
  hasNote: (text: string) => boolean;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export const LearningProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Load notes from Firestore
  useEffect(() => {
    const loadNotes = async () => {
      if (!user) {
        setNotes([]);
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'learning', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setNotes(docSnap.data().notes || []);
        }
      } catch (error) {
        console.error('Failed to load learning data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [user]);

  // Save notes to Firestore
  useEffect(() => {
    const saveNotes = async () => {
      if (user) {
        try {
          const sanitizedNotes = JSON.parse(JSON.stringify(notes));
          await setDoc(doc(db, 'learning', user.uid), { notes: sanitizedNotes });
        } catch (error) {
          console.error('Failed to save learning data:', error);
        }
      }
    };

    if (!loading) {
      saveNotes();
    }
  }, [notes, user, loading]);

  const addNote = (text: string, language: Language, proficiency: Proficiency, context?: string) => {
    if (notes.some(n => n.text === text)) return;

    const newNote: Note = {
      id: crypto.randomUUID(),
      text,
      language,
      proficiency,
      context,
      createdAt: Date.now()
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const removeNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const hasNote = (text: string) => {
    return notes.some(n => n.text === text);
  };

  return (
    <LearningContext.Provider value={{ notes, loading, addNote, removeNote, hasNote }}>
      {children}
    </LearningContext.Provider>
  );
};

export const useLearning = () => {
  const context = useContext(LearningContext);
  if (context === undefined) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
};