export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface Commentary {
  author: string;
  summary: string;
  source?: string;
  aiExplanation?: string; // AI's explanation of logic in context of the question
}

export interface CitedVerse {
  reference: string; // e.g. "Мф. 5:3"
  text: string;
  book: string;
  chapter: number;
  verse: number;
  commentaries: Commentary[]; // Nested commentaries specific to this verse
}

export interface StructuredContent {
  pastoralResponse: string;
  citedVerses: CitedVerse[];
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string | StructuredContent;
  timestamp: Date;
  isAudioPlaying?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  folder?: string;
  createdAt: Date;
  messages: Message[];
}

export interface UserSettings {
  voiceEnabled: boolean;
  voiceName: string;
  theme: 'light';
}