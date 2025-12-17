import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { InputArea } from './components/InputArea';
import { RightPanel } from './components/RightPanel';
import { MenuIcon, MicIcon } from './components/Icons';
import { LoginScreen } from './components/LoginScreen';
import { AdminPanel } from './components/AdminPanel';
import { ChatSession, Message, MessageRole, ChatMode, User, StructuredContent } from './types';
import { generateResponse, generateSpeech, playAudio, generateCommentaryExplanation } from './services/geminiService';
import { StorageService } from './services/storageService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
  
  // Modes State
  const [modes, setModes] = useState<ChatMode[]>([]);
  const [currentModeId, setCurrentModeId] = useState<string>('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Initial Data Load
  useEffect(() => {
    const user = StorageService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      loadUserData(user.id);
    }
    const storedModes = StorageService.getModes();
    setModes(storedModes);
    if (storedModes.length > 0) setCurrentModeId(storedModes[0].id);
  }, []);

  const loadUserData = (userId: string) => {
    const userChats = StorageService.getChats(userId);
    setChats(userChats);
    if (userChats.length > 0) {
      setActiveChatId(userChats[0].id);
      setCurrentModeId(userChats[0].modeId);
    } else {
      setActiveChatId(null);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    loadUserData(user.id);
  };

  const handleLogout = () => {
    StorageService.logout();
    setCurrentUser(null);
    setChats([]);
    setActiveChatId(null);
    setShowAdminPanel(false);
  };

  const activeChat = chats.find(c => c.id === activeChatId) || null;
  const selectedMessage = activeChat ? activeChat.messages.find(m => m.id === selectedMessageId) || null : null;
  const currentMode = modes.find(m => m.id === currentModeId) || modes[0];

  const handlePlayAudio = async (text: string) => {
    // Get voice from current mode or default
    const usedMode = modes.find(m => m.id === currentModeId) || modes[0];
    const voiceName = usedMode.voiceName || 'Fenrir';
    
    const base64Audio = await generateSpeech(text, voiceName);
    if (base64Audio) await playAudio(base64Audio);
  };

  const handleSendMessage = async (text: string) => {
    if (!currentUser) return;

    let chatId = activeChatId;
    let newChats = [...chats];
    let chatModeId = currentModeId;

    if (!chatId) {
      const newChat: ChatSession = {
        id: Date.now().toString(),
        userId: currentUser.id,
        title: text.substring(0, 30) + '...',
        folder: 'general',
        modeId: currentModeId,
        createdAt: new Date(),
        messages: []
      };
      newChats = [newChat, ...newChats];
      chatId = newChat.id;
      setActiveChatId(chatId);
    } else {
       const existingChat = newChats.find(c => c.id === chatId);
       if (existingChat) chatModeId = existingChat.modeId;
    }

    const usedMode = modes.find(m => m.id === chatModeId) || modes[0];

    const userMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      content: text,
      timestamp: new Date()
    };

    const updatedChats = newChats.map(chat => {
      if (chat.id === chatId) {
        return { ...chat, messages: [...chat.messages, userMsg] };
      }
      return chat;
    });
    setChats(updatedChats);
    setIsLoading(true);

    const chatToSave = updatedChats.find(c => c.id === chatId);
    if (chatToSave) StorageService.saveChat(chatToSave);

    try {
      const currentMessages = chatToSave ? chatToSave.messages : [userMsg];
      
      const history = currentMessages.slice(0, -1).map(m => {
        let contentStr = '';
        if (typeof m.content === 'string') {
          contentStr = m.content;
        } else {
          contentStr = JSON.stringify(m.content);
        }
        return {
          role: m.role === MessageRole.USER ? 'user' : 'model',
          parts: [{ text: contentStr }]
        };
      });

      const structuredResponse = await generateResponse(history, text, usedMode.systemPrompt);

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.MODEL,
        content: structuredResponse,
        timestamp: new Date()
      };

      const finalChats = updatedChats.map(chat => {
        if (chat.id === chatId) {
           return { ...chat, messages: [...chat.messages, modelMsg] };
        }
        return chat;
      });

      setChats(finalChats);
      
      const finalChatToSave = finalChats.find(c => c.id === chatId);
      if (finalChatToSave) StorageService.saveChat(finalChatToSave);

      setSelectedMessageId(modelMsg.id);

      // Auto Play if enabled
      if (autoPlayEnabled) {
          const responseText = structuredResponse.pastoralResponse;
          if (responseText) {
              await handlePlayAudio(responseText);
          }
      }

    } catch (error) {
      console.error("Chat Error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    if (!currentUser) return;
    const newChat: ChatSession = {
      id: Date.now().toString(),
      userId: currentUser.id,
      title: 'Новая беседа',
      folder: 'general',
      modeId: currentModeId, 
      createdAt: new Date(),
      messages: []
    };
    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    StorageService.saveChat(newChat);
    setActiveChatId(newChat.id);
    setSelectedMessageId(null);
    setSidebarOpen(false);
  };

  const handleGenerateExplanation = async (messageId: string, verseIdx: number, commentaryIdx: number, verseText: string, summary: string) => {
    const currentChatId = activeChatId;
    if (!currentChatId) return;

    // Use current state to get context, but explanation generation is async
    const chat = chats.find(c => c.id === currentChatId);
    if (!chat) return;

    const userMessages = chat.messages.filter(m => m.role === MessageRole.USER);
    const lastUserQuery = userMessages.length > 0 ? (userMessages[userMessages.length - 1].content as string) : "духовный смысл";

    const explanation = await generateCommentaryExplanation(lastUserQuery, verseText, summary);

    // Update state functionally to avoid stale closures
    setChats(prevChats => {
        const nextChats = prevChats.map(c => {
            if (c.id === currentChatId) {
                const nextMessages = c.messages.map(msg => {
                    if (msg.id === messageId && typeof msg.content !== 'string') {
                         const newContent = { ...msg.content };
                         if (newContent.citedVerses?.[verseIdx]?.commentaries?.[commentaryIdx]) {
                             const newVerses = [...newContent.citedVerses];
                             const verse = { ...newVerses[verseIdx] };
                             const newComms = [...verse.commentaries];
                             
                             newComms[commentaryIdx] = {
                                 ...newComms[commentaryIdx],
                                 aiExplanation: explanation
                             };
                             
                             verse.commentaries = newComms;
                             newVerses[verseIdx] = verse;
                             newContent.citedVerses = newVerses;
                             return { ...msg, content: newContent };
                         }
                    }
                    return msg;
                });
                
                // Persist the specific updated chat immediately
                const updatedChat = { ...c, messages: nextMessages };
                StorageService.saveChat(updatedChat);
                return updatedChat;
            }
            return c;
        });
        return nextChats;
    });
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (showAdminPanel && currentUser.isAdmin) {
    return (
      <AdminPanel onClose={() => {
        setShowAdminPanel(false);
        setModes(StorageService.getModes());
      }} />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAF9]">
      <Sidebar 
        chats={chats} 
        activeChatId={activeChatId || ''} 
        currentUser={currentUser}
        onSelectChat={(id) => { 
          setActiveChatId(id); 
          setSelectedMessageId(null);
          const chat = chats.find(c => c.id === id);
          if (chat) setCurrentModeId(chat.modeId);
        }} 
        onNewChat={handleNewChat}
        onOpenAdmin={() => setShowAdminPanel(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col h-full relative w-full shadow-xl z-10 transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6DEC6] bg-white">
          <div className="flex items-center gap-4">
             <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-[#2C2420]">
                <MenuIcon className="w-6 h-6" />
             </button>
             
             {/* Mode Selector */}
             <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors">
                  <span className="text-xs font-bold text-sky-700 uppercase tracking-wide">
                     Режим: {currentMode?.name}
                  </span>
                </button>
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-sky-100 hidden group-hover:block z-50">
                   <div className="p-2 space-y-1">
                      {modes.map(mode => (
                        <button 
                          key={mode.id}
                          onClick={() => {
                            setCurrentModeId(mode.id);
                            if (activeChat && activeChat.messages.length === 0) {
                               const updated = chats.map(c => c.id === activeChat.id ? {...c, modeId: mode.id} : c);
                               setChats(updated);
                            }
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${currentModeId === mode.id ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                           <span>{mode.name}</span>
                           {/* Small voice indicator in dropdown */}
                           <span className="text-[9px] text-slate-400 bg-slate-100 px-1 rounded ml-auto">
                              {mode.voiceName || 'Def'}
                           </span>
                        </button>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-3">
             {/* Auto Play Toggle */}
             <button 
               onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
               className={`p-2 rounded-full transition-all border ${autoPlayEnabled ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-300 border-slate-100 hover:text-sky-500'}`}
               title={autoPlayEnabled ? "Авто-озвучивание включено" : "Включить авто-озвучивание"}
             >
                <MicIcon className="w-5 h-5" active={autoPlayEnabled} />
             </button>

             <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 font-bold text-sm cursor-pointer" onClick={handleLogout} title="Выйти">
                {currentUser.name[0].toUpperCase()}
             </div>
          </div>
        </div>

        <ChatArea 
          messages={activeChat ? activeChat.messages : []} 
          isLoading={isLoading}
          onPlayAudio={handlePlayAudio}
          onSelectMessage={(msg) => setSelectedMessageId(msg.id)}
          selectedMessageId={selectedMessageId}
        />
        
        <InputArea 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading}
        />
      </main>

      <RightPanel 
        message={selectedMessage} 
        onClose={() => setSelectedMessageId(null)} 
        onGenerateExplanation={handleGenerateExplanation}
      />
    </div>
  );
};

export default App;