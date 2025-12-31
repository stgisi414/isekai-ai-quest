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

export enum VoiceGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export interface StorySettings {
  voiceGender: VoiceGender;
  bgmEnabled: boolean;
  bgmVolume: number;
}

export interface Note {
  id: string;
  text: string;
  context?: string;
  language: Language;
  proficiency: Proficiency;
  createdAt: number;
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

export interface Item {
  id: string;
  name: string;
  description: string;
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

export enum ActivityType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRANSLATION_MATCH = 'TRANSLATION_MATCH',
  WRITING = 'WRITING',
  SIMILAR_PHRASE = 'SIMILAR_PHRASE',
  SENTENCE_ORDER = 'SENTENCE_ORDER',
  CLOZE = 'CLOZE',
  READING = 'READING',
  PARTICLE = 'PARTICLE',
  CONJUGATION = 'CONJUGATION',
  SYNONYM = 'SYNONYM',
  HONORIFICS = 'HONORIFICS',
  TRUE_FALSE = 'TRUE_FALSE',
  LISTENING = 'LISTENING',
  ERROR_FIX = 'ERROR_FIX',
  CLASSIFIER = 'CLASSIFIER',
  HANZI_RADICAL = 'HANZI_RADICAL'
}

export interface Activity {
  type: ActivityType;
  question: string;
  options?: string[]; // For MC, Cloze, Reading, etc.
  correctIndex?: number; // For single choice
  pairs?: { item: string; match: string }[]; // For Matching (randomly shuffled in UI)
  scrambledWords?: string[]; // For Sentence Order
  correctText?: string; // For Writing or Similar Phrase check
  explanation: string;
}

export interface StoryLog {
  id: string;
  text: string;
  translation: string;
  mood?: string;
  illustrationUrl?: string;
  vocab: VocabItem[];
  grammar?: GrammarPoint;
  activity?: Activity;
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
  items: Item[];
  activeSettingId: string;
  plot: PlotState;
  logs: StoryLog[];
  preferences: StorySettings;
}