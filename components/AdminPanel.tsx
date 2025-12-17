import React, { useState, useEffect } from 'react';
import { ChatMode } from '../types';
import { StorageService } from '../services/storageService';
import { CrossIcon, SendIcon } from './Icons';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [modes, setModes] = useState<ChatMode[]>([]);
  const [editingMode, setEditingMode] = useState<ChatMode | null>(null);

  useEffect(() => {
    setModes(StorageService.getModes());
  }, []);

  const handleSave = () => {
    if (!editingMode) return;
    const newModes = modes.map(m => m.id === editingMode.id ? editingMode : m);
    // If it's a new mode
    if (!modes.find(m => m.id === editingMode.id)) {
        newModes.push(editingMode);
    }
    
    setModes(newModes);
    StorageService.saveModes(newModes);
    setEditingMode(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот режим?')) {
      const newModes = modes.filter(m => m.id !== id);
      setModes(newModes);
      StorageService.saveModes(newModes);
    }
  };

  const handleAddNew = () => {
    setEditingMode({
      id: Date.now().toString(),
      name: 'Новый режим',
      description: 'Описание режима...',
      icon: 'message',
      systemPrompt: 'Инструкция для нейросети...'
    });
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col">
      <div className="px-8 py-5 border-b border-sky-100 flex items-center justify-between bg-sky-50/50">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-800">Панель Администратора</h2>
          <p className="text-xs text-slate-500">Управление режимами общения и догматическими установками</p>
        </div>
        <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100">
          <CrossIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Mode List */}
        <div className="w-1/3 border-r border-sky-100 overflow-y-auto bg-slate-50 p-4">
          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="font-bold text-slate-700">Режимы</h3>
            <button onClick={handleAddNew} className="text-xs bg-sky-500 text-white px-3 py-1 rounded-full hover:bg-sky-600">
              + Добавить
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
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 p-8 overflow-y-auto bg-white">
          {editingMode ? (
            <div className="max-w-2xl mx-auto space-y-6">
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Название режима</label>
                 <input 
                   className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-sky-400 outline-none font-bold text-lg"
                   value={editingMode.name}
                   onChange={e => setEditingMode({...editingMode, name: e.target.value})}
                 />
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Описание (для пользователя)</label>
                 <input 
                   className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-sky-400 outline-none text-sm"
                   value={editingMode.description}
                   onChange={e => setEditingMode({...editingMode, description: e.target.value})}
                 />
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">System Prompt (Инструкция ИИ)</label>
                 <p className="text-[10px] text-slate-400 mb-2">
                    Этот текст будет добавлен к базовой догматической инструкции. Опишите здесь стиль, цель и формат ответов для данного режима.
                 </p>
                 <textarea 
                   className="w-full p-4 bg-slate-900 text-slate-200 border border-slate-700 rounded-lg focus:border-sky-500 outline-none font-mono text-sm leading-relaxed h-96"
                   value={editingMode.systemPrompt}
                   onChange={e => setEditingMode({...editingMode, systemPrompt: e.target.value})}
                 />
               </div>

               <div className="flex gap-4 pt-4">
                 <button onClick={handleSave} className="flex-1 bg-sky-500 text-white py-3 rounded-lg font-bold hover:bg-sky-600 transition-colors">
                   Сохранить изменения
                 </button>
                 <button onClick={() => handleDelete(editingMode.id)} className="px-6 text-red-400 hover:text-red-600 font-medium">
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
    </div>
  );
};