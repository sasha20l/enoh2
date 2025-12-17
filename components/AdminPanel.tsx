import React, { useState, useEffect } from 'react';
import { ChatMode, AppConfig } from '../types';
import { StorageService } from '../services/storageService';
import { CrossIcon } from './Icons';
import { VOICE_OPTIONS } from '../constants';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'modes' | 'settings'>('modes');
  
  // Modes State
  const [modes, setModes] = useState<ChatMode[]>([]);
  const [editingMode, setEditingMode] = useState<ChatMode | null>(null);

  // Config State
  const [config, setConfig] = useState<AppConfig>(StorageService.getConfig());

  useEffect(() => {
    setModes(StorageService.getModes());
    setConfig(StorageService.getConfig());
  }, []);

  const handleSaveModes = () => {
    if (!editingMode) return;
    const newModes = modes.map(m => m.id === editingMode.id ? editingMode : m);
    if (!modes.find(m => m.id === editingMode.id)) {
        newModes.push(editingMode);
    }
    setModes(newModes);
    StorageService.saveModes(newModes);
    setEditingMode(null);
  };

  const handleSaveConfig = () => {
    StorageService.saveConfig(config);
    alert("Настройки сохранены. Обновите страницу, если меняли API ключи.");
  };

  const handleDeleteMode = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот режим?')) {
      const newModes = modes.filter(m => m.id !== id);
      setModes(newModes);
      StorageService.saveModes(newModes);
    }
  };

  const handleAddNewMode = () => {
    setEditingMode({
      id: Date.now().toString(),
      name: 'Новый режим',
      description: 'Описание режима...',
      icon: 'message',
      voiceName: 'Fenrir',
      systemPrompt: 'Инструкция для нейросети...'
    });
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col">
      <div className="px-8 py-5 border-b border-sky-100 flex items-center justify-between bg-sky-50/50">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-800">Панель Администратора</h2>
          </div>
          <div className="flex bg-white rounded-lg p-1 border border-slate-200">
             <button 
               onClick={() => setActiveTab('modes')}
               className={`px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${activeTab === 'modes' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500 hover:text-sky-600'}`}
             >
               Режимы
             </button>
             <button 
               onClick={() => setActiveTab('settings')}
               className={`px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${activeTab === 'settings' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500 hover:text-sky-600'}`}
             >
               Подключения (БД/ИИ)
             </button>
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100">
          <CrossIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden bg-white">
        {activeTab === 'modes' ? (
            <div className="flex h-full">
                {/* Mode List */}
                <div className="w-1/3 border-r border-sky-100 overflow-y-auto bg-slate-50 p-4">
                  <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className="font-bold text-slate-700">Список Режимов</h3>
                    <button onClick={handleAddNewMode} className="text-xs bg-sky-500 text-white px-3 py-1 rounded-full hover:bg-sky-600">
                      + Создать
                    </button>
                  </div>
                  <div className="space-y-2">
                    {modes.map(mode => (
                      <div 
                        key={mode.id} 
                        className={`p-4 rounded-xl cursor-pointer border transition-all ${editingMode?.id === mode.id ? 'bg-white border-sky-300 shadow-md' : 'bg-white border-transparent hover:border-sky-200'}`}
                        onClick={() => setEditingMode(mode)}
                      >
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-800">{mode.name}</span>
                          <span className="text-[10px] text-slate-400 uppercase">{mode.icon}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{mode.description}</p>
                        <span className="text-[9px] text-sky-500 bg-sky-50 px-1.5 py-0.5 rounded mt-2 inline-block">
                            Голос: {mode.voiceName || 'Default'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mode Editor */}
                <div className="flex-1 p-8 overflow-y-auto">
                  {editingMode ? (
                    <div className="max-w-2xl mx-auto space-y-6">
                       <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Название</label>
                         <input 
                           className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-sky-400 outline-none font-bold text-lg"
                           value={editingMode.name}
                           onChange={e => setEditingMode({...editingMode, name: e.target.value})}
                         />
                       </div>

                       <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Описание</label>
                         <input 
                           className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-sky-400 outline-none text-sm"
                           value={editingMode.description}
                           onChange={e => setEditingMode({...editingMode, description: e.target.value})}
                         />
                       </div>

                       <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Голос Еноха</label>
                         <select
                           className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-sky-400 outline-none text-sm"
                           value={editingMode.voiceName || 'Fenrir'}
                           onChange={e => setEditingMode({...editingMode, voiceName: e.target.value})}
                         >
                           {VOICE_OPTIONS.map(voice => (
                               <option key={voice.id} value={voice.id}>{voice.name}</option>
                           ))}
                         </select>
                       </div>

                       <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">System Prompt</label>
                         <textarea 
                           className="w-full p-4 bg-slate-900 text-slate-200 border border-slate-700 rounded-lg focus:border-sky-500 outline-none font-mono text-sm leading-relaxed h-96"
                           value={editingMode.systemPrompt}
                           onChange={e => setEditingMode({...editingMode, systemPrompt: e.target.value})}
                         />
                       </div>

                       <div className="flex gap-4 pt-4">
                         <button onClick={handleSaveModes} className="flex-1 bg-sky-500 text-white py-3 rounded-lg font-bold hover:bg-sky-600 transition-colors">
                           Сохранить
                         </button>
                         <button onClick={() => handleDeleteMode(editingMode.id)} className="px-6 text-red-400 hover:text-red-600 font-medium">
                           Удалить
                         </button>
                       </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-300">
                      Выберите режим для редактирования
                    </div>
                  )}
                </div>
            </div>
        ) : (
            <div className="p-8 max-w-4xl mx-auto overflow-y-auto h-full">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Конфигурация Подключений</h3>
                
                {/* AI Config */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-sky-600 mb-4 flex items-center gap-2">
                        🤖 Настройки Нейросети (LLM)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Google Gemini API Key</label>
                            <input 
                                type="password"
                                className="w-full p-3 bg-white border border-slate-200 rounded-lg"
                                placeholder="Введите ключ..."
                                value={config.aiApiKey}
                                onChange={e => setConfig({...config, aiApiKey: e.target.value})}
                            />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Модель</label>
                            <select 
                                className="w-full p-3 bg-white border border-slate-200 rounded-lg"
                                value={config.aiModel}
                                onChange={e => setConfig({...config, aiModel: e.target.value})}
                            >
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option>
                                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Legacy)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* DB Config */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-amber-600 mb-4 flex items-center gap-2">
                        🗄️ Подключение к БД (PostgreSQL)
                    </h4>
                    <p className="text-xs text-slate-400 mb-4">
                        Эти настройки используются бэкендом для RAG. В демо-режиме браузера используется эмуляция.
                    </p>
                    
                    <div className="flex items-center gap-2 mb-6">
                        <input 
                           type="checkbox" 
                           id="mockDb"
                           checked={config.useMockDb}
                           onChange={e => setConfig({...config, useMockDb: e.target.checked})}
                           className="w-4 h-4 text-sky-600 rounded"
                        />
                        <label htmlFor="mockDb" className="text-sm font-medium text-slate-700">Использовать Эмуляцию БД (Mock Data)</label>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${config.useMockDb ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Host</label>
                            <input 
                                className="w-full p-3 bg-white border border-slate-200 rounded-lg"
                                value={config.dbHost}
                                onChange={e => setConfig({...config, dbHost: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Port</label>
                            <input 
                                className="w-full p-3 bg-white border border-slate-200 rounded-lg"
                                value={config.dbPort}
                                onChange={e => setConfig({...config, dbPort: e.target.value})}
                            />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">User</label>
                            <input 
                                className="w-full p-3 bg-white border border-slate-200 rounded-lg"
                                value={config.dbUser}
                                onChange={e => setConfig({...config, dbUser: e.target.value})}
                            />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Password</label>
                            <input 
                                type="password"
                                className="w-full p-3 bg-white border border-slate-200 rounded-lg"
                                value={config.dbPass}
                                onChange={e => setConfig({...config, dbPass: e.target.value})}
                            />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Database Name</label>
                            <input 
                                className="w-full p-3 bg-white border border-slate-200 rounded-lg"
                                value={config.dbName}
                                onChange={e => setConfig({...config, dbName: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button 
                        onClick={handleSaveConfig}
                        className="bg-sky-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-sky-700 shadow-md"
                    >
                        Сохранить Настройки
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};