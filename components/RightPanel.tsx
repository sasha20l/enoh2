import React, { useState, useEffect } from 'react';
import { Message, StructuredContent, MessageRole } from '../types';
import { BookIcon, ChevronDownIcon, CrossIcon } from './Icons';

interface RightPanelProps {
  message: Message | null;
  onClose: () => void;
  onGenerateExplanation: (messageId: string, verseIdx: number, commentaryIdx: number, verseText: string, summary: string) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({ message, onClose, onGenerateExplanation }) => {
  const [expandedVerseIndex, setExpandedVerseIndex] = useState<number | null>(null);
  // Track loading state for specific commentary explanation: `${verseIdx}-${commIdx}`
  const [loadingExplanation, setLoadingExplanation] = useState<string | null>(null);

  useEffect(() => {
    // Reset expansion when message changes
    setExpandedVerseIndex(null);
    setLoadingExplanation(null);
  }, [message?.id]);

  const isOpen = !!message && message.role === MessageRole.MODEL && typeof message.content !== 'string';

  const handleExplainClick = async (verseIdx: number, commIdx: number, verseText: string, summary: string) => {
    if (!message) return;
    const key = `${verseIdx}-${commIdx}`;
    setLoadingExplanation(key);
    await onGenerateExplanation(message.id, verseIdx, commIdx, verseText, summary);
    setLoadingExplanation(null);
  };

  // Desktop Placeholder State (When no message selected)
  if (!isOpen) {
    return (
      <aside className="hidden lg:flex w-96 bg-white border-l border-sky-50 flex-col h-full transition-all duration-300">
        <div className="p-6 border-b border-sky-50 bg-white">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Источники
          </h3>
        </div>
        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center opacity-50">
           <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mb-4 text-sky-200">
             <BookIcon className="w-8 h-8" />
           </div>
           <p className="font-body text-sm text-slate-400">
             Нажмите на кнопку "Открыть источники" под ответом Еноха, чтобы увидеть Священное Писание и толкования Отцов.
           </p>
        </div>
      </aside>
    );
  }

  const content = message.content as StructuredContent;
  const citedVerses = content.citedVerses || [];

  const toggleVerse = (idx: number) => {
    setExpandedVerseIndex(expandedVerseIndex === idx ? null : idx);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel Content */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-full md:w-96 lg:static lg:flex lg:w-96 
        bg-sky-50/50 border-l border-sky-100 flex flex-col h-full overflow-hidden 
        shadow-2xl lg:shadow-none transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-sky-100 bg-white/80 backdrop-blur flex items-center justify-between">
          <div className="flex items-center gap-2 text-sky-600">
            <BookIcon className="w-5 h-5" />
            <h3 className="text-sm font-bold font-display uppercase tracking-wider">
              Источники Истины
            </h3>
          </div>
          {/* Mobile Close Button */}
          <button onClick={onClose} className="lg:hidden p-1 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
            <CrossIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {citedVerses.length > 0 ? (
            <div className="space-y-4">
               {citedVerses.map((verse, idx) => {
                 const isExpanded = expandedVerseIndex === idx;
                 const hasCommentaries = verse.commentaries && verse.commentaries.length > 0;

                 return (
                   <div key={idx} className={`bg-white rounded-xl border transition-all duration-300 ${isExpanded ? 'border-sky-300 shadow-md' : 'border-sky-100 hover:border-sky-200'}`}>
                     {/* Verse Header (Clickable) */}
                     <div 
                       className="p-5 cursor-pointer select-none"
                       onClick={() => toggleVerse(idx)}
                     >
                       <div className="flex justify-between items-start mb-2">
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                            Канон (Библия)
                          </span>
                          <ChevronDownIcon className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                       </div>
                       
                       <div className="text-sky-700 font-display font-bold text-sm mb-2">
                         {verse.reference}
                       </div>
                       <p className="text-sm font-body text-slate-700 leading-relaxed italic">
                         «{verse.text}»
                       </p>
                       
                       {!isExpanded && (
                         <p className="text-[10px] text-sky-400 mt-3 font-medium text-center">
                           Нажмите, чтобы открыть толкование
                         </p>
                       )}
                     </div>

                     {/* Commentaries (Expanded) */}
                     {isExpanded && (
                       hasCommentaries ? (
                         <div className="border-t border-sky-50 bg-sky-50/30 p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                           <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                             Святоотеческое предание
                           </h5>
                           {verse.commentaries.map((comm, cIdx) => {
                             const isLoadingThis = loadingExplanation === `${idx}-${cIdx}`;
                             
                             return (
                               <div key={cIdx} className="bg-white p-4 rounded-lg border border-sky-100 shadow-sm relative overflow-hidden">
                                 {/* Decorative accent */}
                                 <div className="absolute top-0 left-0 w-1 h-full bg-sky-200"></div>
                                 
                                 <div className="flex items-center gap-2 mb-2 pl-2">
                                    <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                                      Источник
                                    </span>
                                 </div>

                                 <div className="pl-2">
                                   <div className="font-display font-bold text-sm text-slate-800 mb-1">
                                     {comm.author}
                                   </div>
                                   <p className="text-xs font-body text-slate-600 leading-relaxed mb-2">
                                     {comm.summary}
                                   </p>
                                   {comm.source && (
                                     <p className="text-[10px] text-sky-400 italic text-right">
                                       — {comm.source}
                                     </p>
                                   )}
                                 </div>

                                 {/* Enoch's Explanation (AI) - Lazy Load */}
                                 <div className="mt-3 pt-3 border-t border-sky-50 ml-2">
                                    {comm.aiExplanation ? (
                                      <>
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                          <div className="w-1.5 h-1.5 bg-sky-400 rounded-full"></div>
                                          <span className="text-[9px] font-bold text-sky-500 uppercase tracking-wide">
                                            Пояснение Еноха
                                          </span>
                                        </div>
                                        <p className="text-xs text-slate-500 italic bg-sky-50/50 p-2 rounded-md border border-sky-50 animate-in fade-in">
                                          {comm.aiExplanation}
                                        </p>
                                      </>
                                    ) : (
                                      <button 
                                        onClick={() => handleExplainClick(idx, cIdx, verse.text, comm.summary)}
                                        disabled={isLoadingThis}
                                        className="w-full text-left flex items-center justify-center gap-2 p-2 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-600 transition-colors group"
                                      >
                                        {isLoadingThis ? (
                                           <span className="flex items-center gap-2 text-xs font-medium">
                                             <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce"></span>
                                             Енох размышляет...
                                           </span>
                                        ) : (
                                           <span className="text-xs font-medium group-hover:text-sky-700">
                                             Пояснить духовный смысл
                                           </span>
                                        )}
                                      </button>
                                    )}
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                       ) : (
                         <div className="border-t border-sky-50 bg-sky-50/20 p-6 text-center animate-in fade-in">
                           <p className="text-xs text-slate-400 italic">
                             Для этого стиха Енох не нашел прямых толкований, но он важен для контекста ответа.
                           </p>
                         </div>
                       )
                     )}
                   </div>
                 );
               })}
            </div>
          ) : (
            <div className="text-center mt-10 p-6 bg-white rounded-2xl border border-sky-100 border-dashed">
              <p className="text-sm text-slate-400 italic">
                В этом ответе Енох говорит от своего сердца, опираясь на общий дух учения, без прямых цитат.
              </p>
            </div>
          )}

        </div>
      </aside>
    </>
  );
};