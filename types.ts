export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

// SQL Schema Mapping: bible_verses
export interface BibleVerse {
  id: number;
  translation: string; // e.g. 'RST'
  book_id: number;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
  azbyka_url?: string;
  azbyka_url2?: string;
}

// SQL Schema Mapping: bible_commentaries
export interface BibleCommentary {
  id: number;
  verse_id: number;
  translation?: string;
  book_id?: number;
  book_name?: string;
  chapter?: number;
  verse?: number;
  interp_id?: number;
  anchor?: string;
  label?: string; // "Толкование", "Беседа"
  author: string;
  html?: string;
  text_plain: string;
  source_url?: string;
  source_title?: string;
  azbyka_url?: string;
  created_at?: string;
}

export interface Commentary {
  author: string;
  summary: string;
  source?: string; // Title/Book
  sourceUrl?: string; // Link to Azbyka or external
  aiExplanation?: string;
  dataSource: 'db' | 'ai'; // Where this data came from
}

export interface CitedVerse {
  reference: string;
  text: string;
  book: string;
  chapter: number;
  verse: number;
  dataSource: 'db' | 'ai';
  azbykaUrl?: string; // Direct link if from DB
  commentaries: Commentary[];
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
  userId: string;
  title: string;
  folder?: string;
  modeId: string;
  createdAt: Date;
  messages: Message[];
}

export interface User {
  id: string;
  name: string;
  isAdmin: boolean;
}

export interface ChatMode {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  icon: string;
  voiceName?: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  borderRadius: string; // e.g. '0px', '0.5rem', '1rem', '1.5rem'
  fontSerif?: string;
  fontSans?: string;
}

export interface AppConfig {
  // AI Settings
  aiApiKey: string;
  aiModel: string;
  
  // DB Settings
  dbHost: string;
  dbPort: string;
  dbUser: string;
  dbPass: string;
  dbName: string;
  useMockDb: boolean; 
  
  // UI Settings
  currentThemeId: string;
}