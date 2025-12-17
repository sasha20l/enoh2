import { ChatMode, ChatSession, User, AppConfig } from "../types";
import { DEFAULT_MODES } from "../constants";

const USERS_KEY = 'enoch_users';
const CHATS_KEY = 'enoch_chats';
const MODES_KEY = 'enoch_modes';
const CONFIG_KEY = 'enoch_config';
const CURRENT_USER_KEY = 'enoch_current_user_id';

const DEFAULT_CONFIG: AppConfig = {
  aiApiKey: '',
  aiModel: 'gemini-2.5-flash',
  dbHost: 'localhost',
  dbPort: '5432',
  dbUser: 'postgres',
  dbPass: '',
  dbName: 'enoch_db',
  useMockDb: true,
  currentThemeId: 'sky-soft'
};

// Initialize defaults
const initStorage = () => {
  if (!localStorage.getItem(MODES_KEY)) {
    localStorage.setItem(MODES_KEY, JSON.stringify(DEFAULT_MODES));
  }
  if (!localStorage.getItem(CHATS_KEY)) {
    localStorage.setItem(CHATS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(CONFIG_KEY)) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
  }
};

initStorage();

export const StorageService = {
  // --- Config ---
  getConfig: (): AppConfig => {
    const stored = JSON.parse(localStorage.getItem(CONFIG_KEY) || JSON.stringify(DEFAULT_CONFIG));
    // Merge with default to ensure new fields (like themeId) exist
    return { ...DEFAULT_CONFIG, ...stored };
  },
  
  saveConfig: (config: AppConfig) => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  },

  // --- Auth ---
  loginOrRegister: (name: string): User => {
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    let user = users.find(u => u.name.toLowerCase() === name.toLowerCase());
    const isAdmin = name.toLowerCase() === 'admin';
    
    if (!user) {
      user = {
        id: Date.now().toString(),
        name: name,
        isAdmin: isAdmin
      };
      users.push(user);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } else if (user.isAdmin !== isAdmin) {
      // Force update admin status if needed (e.g. if logic changed or legacy user)
      user.isAdmin = isAdmin;
      const updatedUsers = users.map(u => u.id === user!.id ? user! : u);
      localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    }
    
    localStorage.setItem(CURRENT_USER_KEY, user.id);
    return user;
  },

  getCurrentUser: (): User | null => {
    const id = localStorage.getItem(CURRENT_USER_KEY);
    if (!id) return null;
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return users.find(u => u.id === id) || null;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  // --- Modes ---
  getModes: (): ChatMode[] => {
    return JSON.parse(localStorage.getItem(MODES_KEY) || JSON.stringify(DEFAULT_MODES));
  },

  saveModes: (modes: ChatMode[]) => {
    localStorage.setItem(MODES_KEY, JSON.stringify(modes));
  },

  // --- Chats ---
  getChats: (userId: string): ChatSession[] => {
    const allChats: ChatSession[] = JSON.parse(localStorage.getItem(CHATS_KEY) || '[]');
    return allChats.filter(c => c.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  saveChat: (chat: ChatSession) => {
    const allChats: ChatSession[] = JSON.parse(localStorage.getItem(CHATS_KEY) || '[]');
    const index = allChats.findIndex(c => c.id === chat.id);
    
    if (index >= 0) {
      allChats[index] = chat;
    } else {
      allChats.push(chat);
    }
    
    localStorage.setItem(CHATS_KEY, JSON.stringify(allChats));
  },
  
  deleteChat: (chatId: string) => {
      let allChats: ChatSession[] = JSON.parse(localStorage.getItem(CHATS_KEY) || '[]');
      allChats = allChats.filter(c => c.id !== chatId);
      localStorage.setItem(CHATS_KEY, JSON.stringify(allChats));
  }
};