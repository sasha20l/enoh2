import React, { useState, useRef, useEffect } from 'react';
import { MicIcon, SendIcon } from './Icons';

interface InputAreaProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'ru-RU';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Ваш браузер не поддерживает голосовой ввод.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md p-6 md:p-8 border-t border-brand-50">
      <div className="max-w-4xl mx-auto flex items-end gap-3 relative">
        <div className="flex-1 bg-white rounded-box border border-brand-100 shadow-sm focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-50 transition-all duration-300">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="О чем болит ваша душа?"
            className="w-full bg-transparent border-none p-5 min-h-[60px] max-h-40 resize-none focus:ring-0 font-body text-slate-700 placeholder-slate-400 outline-none leading-relaxed"
            rows={1}
          />
        </div>
        
        <button 
          onClick={toggleListening}
          className={`
            p-4 rounded-box transition-all duration-300 shadow-sm border
            ${isListening 
              ? 'bg-red-50 text-red-500 border-red-100 animate-pulse' 
              : 'bg-white text-slate-400 border-brand-100 hover:text-brand-500 hover:border-brand-200'}
          `}
          title="Голос"
        >
          <MicIcon className="w-6 h-6" active={isListening} />
        </button>

        <button 
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className={`
            p-4 rounded-box transition-all duration-300 shadow-md
            ${!input.trim() || isLoading
              ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
              : 'bg-brand-500 text-white hover:bg-brand-600 hover:shadow-lg hover:-translate-y-0.5'}
          `}
          title="Отправить"
        >
          <SendIcon className="w-6 h-6" />
        </button>
      </div>
      <div className="text-center mt-3">
        <p className="text-[10px] text-slate-400 font-medium">
          Енох помогает найти ответы в Писании, но не заменяет живого священника.
        </p>
      </div>
    </div>
  );
};