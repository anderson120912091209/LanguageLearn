'use client';

import { useState } from 'react';

interface SavedWord {
  id: string;
  word: string;
  translation: string;
  context: string;
  timestamp: number;
  created_at: string;
}

interface VocabularyPanelProps {
  words: SavedWord[];
  onDelete: (id: string) => void;
  onSeekTo: (time: number) => void;
}

export default function VocabularyPanel({ words, onDelete, onSeekTo }: VocabularyPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const filteredWords = words.filter((word) =>
    word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.translation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNextCard = () => {
    setShowAnswer(false);
    setCurrentCardIndex((prev) => (prev + 1) % filteredWords.length);
  };

  const handlePrevCard = () => {
    setShowAnswer(false);
    setCurrentCardIndex((prev) => (prev - 1 + filteredWords.length) % filteredWords.length);
  };

  const exportToCSV = () => {
    const csv = [
      ['Word', 'Translation', 'Context', 'Timestamp'],
      ...words.map((w) => [
        w.word,
        w.translation,
        w.context,
        formatTimestamp(w.timestamp),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vocabulary_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (showFlashcards && filteredWords.length > 0) {
    const currentCard = filteredWords[currentCardIndex];
    
    return (
      <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
        <div className="border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Flashcards
          </h2>
          <button
            onClick={() => setShowFlashcards(false)}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          >
            Close
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-sm">
            <div className="bg-zinc-900 dark:bg-zinc-100 rounded-2xl shadow-xl p-8 min-h-[300px] flex flex-col items-center justify-center text-white dark:text-zinc-900 cursor-pointer transition-all hover:scale-[1.02]"
                 onClick={() => setShowAnswer(!showAnswer)}>
              <div className="text-center">
                {!showAnswer ? (
                  <>
                    <p className="text-xs opacity-50 uppercase tracking-widest mb-6 font-medium">Question</p>
                    <h3 className="text-3xl font-bold mb-4">{currentCard.word}</h3>
                    <p className="text-sm opacity-70 italic">"{currentCard.context}"</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs opacity-50 uppercase tracking-widest mb-6 font-medium">Answer</p>
                    <h3 className="text-3xl font-bold mb-2">{currentCard.word}</h3>
                    <div className="w-12 h-1 bg-white/20 dark:bg-zinc-900/10 mx-auto my-4 rounded-full"></div>
                    <p className="text-xl mb-4 font-medium">{currentCard.translation}</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-8">
              <button
                onClick={handlePrevCard}
                className="px-4 py-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                ← Previous
              </button>
              
              <span className="text-zinc-400 text-sm font-mono">
                {currentCardIndex + 1} / {filteredWords.length}
              </span>
              
              <button
                onClick={handleNextCard}
                className="px-4 py-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/50">
        <div className="flex items-center justify-between mb-4">
           <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
             Saved Words
           </h2>
           <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs px-2 py-0.5 rounded-full font-medium">
             {words.length}
           </span>
        </div>
        
        {/* Search and Actions */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search your list..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 text-sm placeholder:text-zinc-400 text-zinc-900 dark:text-white"
          />
          
          <div className="flex gap-2">
            <button
              onClick={() => filteredWords.length > 0 && setShowFlashcards(true)}
              disabled={filteredWords.length === 0}
              className="flex-1 px-3 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-zinc-900 text-xs font-semibold uppercase tracking-wide rounded-lg transition"
            >
              Flashcards
            </button>
            <button
              onClick={exportToCSV}
              disabled={words.length === 0}
              className="px-3 py-2 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 text-zinc-900 dark:text-zinc-300 text-xs font-semibold uppercase tracking-wide rounded-lg transition"
            >
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Vocabulary List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
        {filteredWords.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center">
            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3">
               <span className="text-xl">📚</span>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">No words found</p>
            <p className="text-zinc-400 text-xs mt-1">
              Click words in the transcript to save them here.
            </p>
          </div>
        ) : (
          filteredWords.map((word) => (
            <div
              key={word.id}
              className="group bg-white dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl p-4 transition-all"
            >
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {word.word}
                  </h3>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                    {word.translation}
                  </p>
                </div>
                <button
                  onClick={() => onDelete(word.id)}
                  className="text-zinc-300 hover:text-red-500 transition-colors"
                  title="Remove"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="text-xs text-zinc-500 dark:text-zinc-400 italic leading-relaxed mb-3 line-clamp-2">
                "{word.context}"
              </p>
              
              <button
                onClick={() => onSeekTo(word.timestamp)}
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
              >
                <span>⏱ {formatTimestamp(word.timestamp)}</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
