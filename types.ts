export enum Language {
  CN = 'Chinese (Mandarin)',
  JP = 'Japanese',
  KR = 'Korean',
}

export enum Proficiency {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
}

export interface Character {
  id: string;
  name: string;
  personality: string;
  appearance: string;
  referenceImageUrl?: string;
}

export interface Setting {
  id: string;
  name: string;
  atmosphere: string;
  appearance: string;
  referenceImageUrl?: string;
}

export interface VocabItem {
  word: string;
  reading: string; // Pinyin, Romaji, etc.
  meaning: string;
  exampleSentence?: string;
}

export interface GrammarPoint {
  title: string;
  explanation: string;
  example: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface StoryLog {
  id: string;
  text: string;
  translation: string;
  illustrationUrl?: string;
  vocab: VocabItem[];
  grammar?: GrammarPoint;
  quiz?: QuizQuestion;
  isLoading?: boolean;
}

export interface PlotState {
  genre: string;
  currentArc: string;
  tone: string;
}

export interface Story {
  id: string;
  language: Language;
  proficiency: Proficiency;
  characters: Character[];
  settings: Setting[];
  plot: PlotState;
  logs: StoryLog[];
}