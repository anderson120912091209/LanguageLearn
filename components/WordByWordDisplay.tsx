'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TranscriptSegment } from '@/lib/youtube';
import { 
  generateWordTimestamps, 
  findActiveWord, 
  cleanWord,
  WordTimestamp 
} from '@/lib/word-timing';
import { fetchWordDefinition, WordDefinition } from '@/lib/dictionary';
import { Loader2, X, Volume2, Plus, Lock, Unlock, Eye, EyeOff, VenetianMask } from 'lucide-react';

interface WordByWordDisplayProps {
  transcript: TranscriptSegment[];
  currentTime: number;
  onSaveWord: (word: string, translation: string, context: string, timestamp: number) => void;
  onSeekTo?: (time: number) => void;
  variant?: 'document' | 'theater';
}

type TranslationMode = 'visible' | 'blurred' | 'hidden';

export default function WordByWordDisplay({
  transcript,
  currentTime,
  onSaveWord,
  onSeekTo,
  variant = 'document'
}: WordByWordDisplayProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordDefinition, setWordDefinition] = useState<WordDefinition | null>(null);
  const [loadingDefinition, setLoadingDefinition] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Reader Controls
  const [autoScroll, setAutoScroll] = useState(true);
  const [translationMode, setTranslationMode] = useState<TranslationMode>('visible');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  
  // Generate word-level timestamps
  const wordTimestamps = useMemo(() => {
    return generateWordTimestamps(transcript);
  }, [transcript]);
  
  // Find currently active word
  const activeWordIndex = useMemo(() => {
    return findActiveWord(wordTimestamps, currentTime);
  }, [wordTimestamps, currentTime]);

  const activeSegmentIndex = activeWordIndex >= 0 
    ? wordTimestamps[activeWordIndex].segmentIndex 
    : -1;

  // Auto-scroll logic
  useEffect(() => {
    if (!autoScroll || selectedWord) return;

    if (activeWordIndex >= 0 && activeWordRef.current && containerRef.current) {
      const container = containerRef.current;
      const element = activeWordRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const relativeTop = elementRect.top - containerRect.top;
      
      if (variant === 'theater') {
         // Manual scroll calculation to position active text near the top (20-25%)
         // This reduces visually perceived gap from the video
         const targetY = containerRect.height * 0.25; 
         const currentRelativeY = elementRect.top - containerRect.top;
         const offset = currentRelativeY - targetY;
         
         container.scrollTo({
            top: container.scrollTop + offset,
            behavior: 'smooth'
         });
      } else {
        // Comfortable reading zone for document mode
        if (relativeTop < containerRect.height * 0.3 || relativeTop > containerRect.height * 0.6) {
           element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [activeWordIndex, autoScroll, selectedWord, variant]);

  // Handle word click
  const handleWordClick = async (wordData: WordTimestamp, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleaned = cleanWord(wordData.word);
    
    if (!cleaned || cleaned.length < 2) return;
    
    // Calculate smart position
    const x = Math.min(Math.max(20, e.clientX), window.innerWidth - 320);
    const y = Math.min(Math.max(20, e.clientY + 20), window.innerHeight - 300);

    setPopoverPosition({ x, y });
    setSelectedWord(cleaned);
    setLoadingDefinition(true);
    setWordDefinition(null);
    setAutoScroll(false); // Pause auto-scroll when interacting
    
    try {
      const definition = await fetchWordDefinition(cleaned);
      setWordDefinition(definition);
    } catch (error) {
      console.error('Error fetching definition:', error);
    } finally {
      setLoadingDefinition(false);
    }
  };
  
  const handleSaveWord = () => {
    if (!selectedWord || activeWordIndex === -1) return;
    const segment = activeSegmentIndex >= 0 ? transcript[activeSegmentIndex] : transcript[0];
    
    onSaveWord(
        selectedWord, 
        segment?.translation || 'Translation not available', 
        segment?.text || 'Context not available', 
        segment?.start || 0
    );
    setSelectedWord(null);
  };

  const wordsBySegment = useMemo(() => {
    const grouped: { [key: number]: WordTimestamp[] } = {};
    wordTimestamps.forEach(word => {
      if (!grouped[word.segmentIndex]) grouped[word.segmentIndex] = [];
      grouped[word.segmentIndex].push(word);
    });
    return grouped;
  }, [wordTimestamps]);

  // Close popover on outside click
  useEffect(() => {
     const close = () => setSelectedWord(null);
     if (selectedWord) window.addEventListener('click', close);
     return () => window.removeEventListener('click', close);
  }, [selectedWord]);

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Determine container styles based on variant
  const containerStyles = variant === 'theater'
    ? "h-full overflow-y-auto px-8 py-10 relative scrollbar-none [mask-image:linear-gradient(to_bottom,transparent,black_5%,black_95%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_5%,black_95%,transparent)]"
    : "flex-1 overflow-y-auto px-6 py-8 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800";
  return (
    <div className={`h-full relative flex flex-col ${variant === 'theater' ? 'bg-transparent' : 'bg-white dark:bg-zinc-900'}`}>
      {/* Reader Toolbar */}
      {variant === 'theater' ? (
        /* Mini Toolbar for Theater Mode */
        <div className="absolute bottom-2 right-0 z-20 flex pointer-events-none">
            <div className="flex items-center gap-1 bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-full px-2 py-1 pointer-events-auto transition-opacity duration-300 hover:bg-zinc-900/80">
                <button 
                  onClick={() => setAutoScroll(!autoScroll)}
                  className={`p-1.5 rounded-full transition-colors ${autoScroll ? 'text-indigo-400 bg-white/10' : 'text-zinc-400 hover:text-zinc-200'}`}
                  title={autoScroll ? "開啟自動捲動" : "關閉自動捲動"}
                >
                   {autoScroll ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
                <div className="w-px h-3 bg-white/10 mx-0.5" />
                
                <button
                   onClick={() => setTranslationMode('visible')}
                   className={`p-1.5 rounded-full transition-all ${translationMode === 'visible' ? 'text-white bg-white/10' : 'text-zinc-400 hover:text-zinc-200'}`}
                   title="顯示翻譯"
                >
                   <Eye size={14} />
                </button>
                <button
                   onClick={() => setTranslationMode('blurred')}
                   className={`p-1.5 rounded-full transition-all ${translationMode === 'blurred' ? 'text-white bg-white/10' : 'text-zinc-400 hover:text-zinc-200'}`}
                   title="模糊翻譯"
                >
                   <VenetianMask size={14} />
                </button>
                <button
                   onClick={() => setTranslationMode('hidden')}
                   className={`p-1.5 rounded-full transition-all ${translationMode === 'hidden' ? 'text-white bg-white/10' : 'text-zinc-400 hover:text-zinc-200'}`}
                   title="隱藏翻譯"
                >
                   <EyeOff size={14} />
                </button>
            </div>
        </div>
      ) : (
        /* Standard Toolbar for Document Mode */
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm z-10 sticky top-0">
           <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
              閱讀控制
           </div>
           <div className="flex gap-2">
              <button 
                onClick={() => setAutoScroll(!autoScroll)}
                className={`p-1.5 rounded-md transition-colors ${autoScroll ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}
                title={autoScroll ? "開啟自動捲動" : "關閉自動捲動"}
              >
                 {autoScroll ? <Lock size={16} /> : <Unlock size={16} />}
              </button>
              <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1" />
              
              <button
                 onClick={() => setTranslationMode('visible')}
                 className={`p-1.5 rounded-md transition-all ${translationMode === 'visible' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-600'}`}
                 title="顯示翻譯"
              >
                 <Eye size={16} />
              </button>
              <button
                 onClick={() => setTranslationMode('blurred')}
                 className={`p-1.5 rounded-md transition-all ${translationMode === 'blurred' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-600'}`}
                 title="模糊翻譯"
              >
                 <VenetianMask size={16} />
              </button>
              <button
                 onClick={() => setTranslationMode('hidden')}
                 className={`p-1.5 rounded-md transition-all ${translationMode === 'hidden' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-600'}`}
                 title="隱藏翻譯"
              >
                 <EyeOff size={16} />
              </button>
           </div>
        </div>
      )}

      <div 
        ref={containerRef}
        className={containerStyles}
      >
        <div className={`mx-auto space-y-8 ${variant === 'theater' ? 'max-w-none space-y-12' : 'max-w-prose space-y-8'}`}>
           {transcript.map((segment, segIdx) => {
             const segmentWords = wordsBySegment[segIdx] || [];
             const isPast = segIdx < activeSegmentIndex;
             const isCurrent = segIdx === activeSegmentIndex;
             
             // In theater mode, hide past/future lines more aggressively
             const opacityClass = variant === 'theater'
                ? isCurrent ? 'opacity-100 scale-100 blur-0' : 'opacity-30 blur-[1px] scale-95 origin-left'
                : isPast ? 'opacity-50 hover:opacity-100' : 'opacity-100';

             return (
               <div 
                  key={segIdx} 
                  onClick={() => onSeekTo?.(segment.start)}
                  className={`flex gap-4 group transition-all duration-500 cursor-pointer ${opacityClass} ${variant === 'theater' ? 'justify-start' : ''}`}
                >
                 {/* Timestamp - Hide in Theater Mode */}
                 {variant === 'document' && (
                   <div className="shrink-0 w-12 pt-1.5">
                      <button 
                         onClick={() => onSeekTo?.(segment.start)}
                         className={`text-xs font-mono transition-colors hover:underline ${isCurrent ? 'text-indigo-500 font-bold' : 'text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400'}`}
                      >
                         {formatTime(segment.start)}
                      </button>
                   </div>
                 )}

                 {/* Text Content */}
                 <div className="flex-1">
                    <p className={`leading-relaxed text-zinc-800 dark:text-zinc-100 ${variant === 'theater' ? 'text-2xl font-semibold mb-2 block text-left' : 'text-xl'}`}>
                      {segmentWords.map((wordData, wIdx) => {
                        const isActive = activeWordIndex >= 0 && wordData === wordTimestamps[activeWordIndex];
                        
                        return (
                          <span
                            key={wIdx}
                            ref={isActive ? activeWordRef : null}
                            onClick={(e) => handleWordClick(wordData, e)}
                            className={`
                              inline-block px-0.5 rounded-sm cursor-pointer transition-colors duration-150
                              ${isActive 
                                ? 'bg-yellow-200 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-100 decoration-clone' 
                                : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                              }
                            `}
                          >
                            {wordData.word}{' '}
                          </span>
                        );
                      })}
                    </p>
                    
                    {/* Translation based on mode */}
                    {translationMode !== 'hidden' && (
                       <p 
                        className={`
                            font-light transition-all duration-300
                            ${variant === 'theater' ? 'text-lg text-zinc-400 block mt-1' : 'text-base border-l-2 pl-3 mt-2'}
                            ${variant !== 'theater' && (isCurrent ? 'border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400' : 'border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500')}
                            ${translationMode === 'blurred' && 'blur-sm hover:blur-none select-none cursor-help'}
                        `}
                       >
                           {segment.translation}
                       </p>
                    )}
                 </div>
               </div>
             );
           })}
           
           <div className="h-40" />
        </div>
      </div>


      {/* Popover Card */}
      {selectedWord && popoverPosition && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 w-80 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200"
          style={{ top: popoverPosition.y, left: popoverPosition.x }}
        >
          {loadingDefinition ? (
             <div className="p-8 flex justify-center">
                 <Loader2 className="animate-spin text-zinc-400" />
             </div>
          ) : wordDefinition ? (
             <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                   <div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white capitalize">{selectedWord}</h3>
                      <span className="text-sm text-zinc-500 font-mono">{wordDefinition.phonetic}</span>
                   </div>
                   <button onClick={() => setSelectedWord(null)} className="text-zinc-400 hover:text-zinc-600">
                      <X size={18} />
                   </button>
                </div>
                
                <div className="space-y-3 my-3 max-h-60 overflow-y-auto scrollbar-thin">
                   {wordDefinition.meanings.slice(0, 2).map((m, i) => (
                      <div key={i} className="text-sm">
                         <span className="text-xs font-bold uppercase text-indigo-500 tracking-wider mr-2">{m.partOfSpeech}</span>
                         <span className="text-zinc-700 dark:text-zinc-300">{m.definitions[0].definition}</span>
                      </div>
                   ))}
                </div>

                <div className="pt-3 mt-2 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
                   <button 
                     onClick={handleSaveWord}
                     className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
                   >
                     <Plus size={16} /> 儲存單字
                   </button>
                </div>
             </div>
          ) : (
             <div className="p-6 text-center">
                <p className="text-zinc-500 mb-4">找不到定義。</p>
                <button 
                  onClick={handleSaveWord}
                   className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 py-2 rounded-lg text-sm font-medium"
                >
                  強行儲存
                </button>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
