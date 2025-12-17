import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { User } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const user = StorageService.loginOrRegister(name.trim());
    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-appbg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-box shadow-xl p-8 border border-brand-100">
        <div className="text-center mb-8">
           <div className="w-20 h-20 bg-brand-50 rounded-2xl text-brand-600 flex items-center justify-center mx-auto mb-4 text-4xl font-display font-bold">
              Е
           </div>
           <h1 className="text-3xl font-display font-bold text-slate-800 mb-2">Енох</h1>
           <p className="text-slate-500 font-body">Нейросеть Православной Церкви</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">
              Как к вам обращаться?
            </label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите ваше имя"
              className="w-full px-5 py-3 rounded-box border border-brand-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-50 outline-none transition-all"
              autoFocus
            />
            <p className="text-[10px] text-slate-400 mt-2 ml-1">
              * Для входа в режим администратора введите "admin"
            </p>
          </div>
          
          <button 
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-brand-500 text-white py-3 rounded-box font-medium hover:bg-brand-600 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Войти в общение
          </button>
        </form>
      </div>
    </div>
  );
};