import React from 'react';
import { FOLDERS } from '../constants';
import { ChatSession } from '../types';
import { BookIcon, ScrollIcon, PrayIcon, MenuIcon } from './Icons';

interface SidebarProps {
  chats: ChatSession[];
  activeChatId: string;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const getIcon = (iconName: string, className: string) => {
  switch(iconName) {
    case 'book': return <BookIcon className={className} />;
    case 'hand': return <PrayIcon className={className} />;
    case 'scroll': return <ScrollIcon className={className} />;
    default: return <MenuIcon className={className} />;
  }
};

export const Sidebar: React.FC<SidebarProps> = ({ chats, activeChatId, onSelectChat, onNewChat, isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-20 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar Content */}
      <aside 
        className={`
          fixed md:relative z-30
          w-72 h-full bg-white border-r border-sky-100
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          flex flex-col shadow-xl md:shadow-none
        `}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <span className="font-display font-bold text-lg">Е</span>
            </div>
            <div>
              <h1 className="text-lg font-bold font-display text-slate-800">Енох</h1>
              <span className="text-[11px] text-slate-400 font-medium">Светлый ИИ</span>
            </div>
          </div>
          <button onClick={onNewChat} className="p-2 hover:bg-sky-50 rounded-full transition-all text-sky-500 hover:text-sky-700" title="Новая беседа">
            <span className="text-2xl font-light leading-none">+</span>
          </button>
        </div>

        {/* Folder Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          {FOLDERS.map(folder => {
            const folderChats = chats.filter(c => c.folder === folder.id);
            if (folderChats.length === 0 && folder.id !== 'general') return null;

            return (
              <div key={folder.id} className="space-y-3">
                <div className="flex items-center gap-2 px-3 text-sky-400">
                  {getIcon(folder.icon, "w-4 h-4")}
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {folder.name}
                  </h3>
                </div>
                
                <div className="space-y-1">
                  {folderChats.length === 0 && folder.id === 'general' && (
                    <div className="text-sm text-slate-400 px-4 font-body">Пока пусто...</div>
                  )}
                  {folderChats.map(chat => (
                    <button
                      key={chat.id}
                      onClick={() => { onSelectChat(chat.id); onClose(); }}
                      className={`
                        w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                        ${activeChatId === chat.id 
                          ? 'bg-sky-50 text-sky-900 shadow-sm' 
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}
                      `}
                    >
                      <span className="line-clamp-1">{chat.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* User Profile Stub */}
        <div className="p-4 border-t border-slate-50 bg-slate-50/50">
          <div className="flex items-center gap-3 text-sm">
             <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 text-white flex items-center justify-center font-bold shadow-md">
               А
             </div>
             <div>
               <p className="font-semibold text-slate-700">Алексий</p>
               <p className="text-xs text-slate-400">В поиске истины</p>
             </div>
          </div>
        </div>
      </aside>
    </>
  );
};
