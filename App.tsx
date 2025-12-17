import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { InputArea } from './components/InputArea';
import { RightPanel } from './components/RightPanel';
import { MenuIcon } from './components/Icons';
import { ChatSession, Message, MessageRole, StructuredContent } from './types';
import { MOCK_CHATS_INITIAL } from './constants';
import { generateResponse, generateSpeech, playAudio, generateCommentaryExplanation } from './services/geminiService';

const App: React.FC = () => {
  const [chats, setChats] = useState<ChatSession[]>(MOCK_CHATS_INITIAL);
  const [activeChatId, setActiveChatId] = useState<string>(MOCK_CHATS_INITIAL[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
  
  // Find the selected message object for the right panel
  const selectedMessage = activeChat.messages.find(m => m.id === selectedMessageId) || null;

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      content: text,
      timestamp: new Date()
    };

    // Optimistically add user message
    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return { ...chat, messages: [...chat.messages, userMsg] };
      }
      return chat;
    }));
    
    setIsLoading(true);

    try {
      // Prepare history: Use the CURRENT state of messages before the API call + the new user message
      const currentMessages = [...activeChat.messages, userMsg];
      
      const history = activeChat.messages.map(m => {
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

      const structuredResponse = await generateResponse(history, text);

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.MODEL,
        content: structuredResponse,
        timestamp: new Date()
      };

      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          const newTitle = chat.messages.length <= 1 ? text.substring(0, 30) + '...' : chat.title;
          return { ...chat, title: newTitle, messages: [...chat.messages, modelMsg] };
        }
        return chat;
      }));

      // Automatically select the new message to show its sources
      setSelectedMessageId(modelMsg.id);

    } catch (error) {
      console.error("Chat Error", error);
      // Add error message to chat
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: MessageRole.MODEL,
        content: {
          pastoralResponse: "Простите, произошла ошибка. Пожалуйста, попробуйте еще раз.",
          citedVerses: []
        },
        timestamp: new Date()
      };
      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return { ...chat, messages: [...chat.messages, errorMsg] };
        }
        return chat;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    const newChat: ChatSession = {
      id: Date.now().toString(),
      title: 'Новая беседа',
      folder: 'general',
      createdAt: new Date(),
      messages: []
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
    setSelectedMessageId(null);
    setSidebarOpen(false);
  };

  const handlePlayAudio = async (text: string) => {
    const base64Audio = await generateSpeech(text);
    if (base64Audio) {
      await playAudio(base64Audio);
    } else {
      alert("Не удалось озвучить текст. Попробуйте позже.");
    }
  };

  const handleGenerateExplanation = async (messageId: string, verseIdx: number, commentaryIdx: number, verseText: string, summary: string) => {
    // Determine the user's last question for context (simplification: take the last user message)
    const userMessages = activeChat.messages.filter(m => m.role === MessageRole.USER);
    const lastUserQuery = userMessages.length > 0 ? (userMessages[userMessages.length - 1].content as string) : "духовный смысл";

    const explanation = await generateCommentaryExplanation(lastUserQuery, verseText, summary);

    // Update the state deeply
    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          messages: chat.messages.map(msg => {
            if (msg.id === messageId && typeof msg.content !== 'string') {
              // Clone deep structure
              const newContent = { ...msg.content };
              if (newContent.citedVerses && newContent.citedVerses[verseIdx]) {
                const newVerses = [...newContent.citedVerses];
                const verse = { ...newVerses[verseIdx] };
                if (verse.commentaries && verse.commentaries[commentaryIdx]) {
                  const newCommentaries = [...verse.commentaries];
                  newCommentaries[commentaryIdx] = {
                    ...newCommentaries[commentaryIdx],
                    aiExplanation: explanation
                  };
                  verse.commentaries = newCommentaries;
                  newVerses[verseIdx] = verse;
                  newContent.citedVerses = newVerses;
                  return { ...msg, content: newContent };
                }
              }
            }
            return msg;
          })
        };
      }
      return chat;
    }));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAF9]">
      <Sidebar 
        chats={chats} 
        activeChatId={activeChatId} 
        onSelectChat={(id) => { setActiveChatId(id); setSelectedMessageId(null); }} 
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col h-full relative w-full shadow-xl z-10">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-[#FAF9F6] border-b border-[#E6DEC6]">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-[#2C2420]">
            <MenuIcon className="w-6 h-6" />
          </button>
          <span className="font-display font-bold text-[#2C2420] tracking-widest">ЕНОХ</span>
          <div className="w-8" />
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between px-8 py-5 border-b border-[#E6DEC6] bg-white">
          <div>
            <h2 className="text-lg font-bold font-display text-[#2C2420] tracking-wide">{activeChat.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-[#8C7B65] font-sans uppercase tracking-widest">Онлайн • Синодальный перевод</p>
            </div>
          </div>
        </div>

        <ChatArea 
          messages={activeChat.messages} 
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