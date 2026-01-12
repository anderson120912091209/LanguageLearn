'use client';

import React, { useState, useRef, useEffect } from 'react';

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
  translation: string;
}

interface TranscriptPanelProps {
  transcript: TranscriptSegment[];
  currentTime: number;
  onSeekTo: (time: number) => void;
  onSaveWord: (word: string, translation: string, context: string, timestamp: number) => void;
}

export default function TranscriptPanel({
  transcript,
  currentTime,
  onSeekTo,
  onSaveWord,
}: TranscriptPanelProps) {
  const [selectedText, setSelectedText] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [selectedSegment, setSelectedSegment] = useState<TranscriptSegment | null>(null);
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  // Debug: Log transcript data
  React.useEffect(() => {
    if (transcript && transcript.length > 0) {
      console.log('[TranscriptPanel] Received transcript:', {
        count: transcript.length,
        firstItem: transcript[0],
        hasTranslation: !!transcript[0]?.translation,
      });
    }
  }, [transcript]);

  // Find current active segment
  const activeSegmentIndex = transcript.findIndex(
    (segment) =>
      currentTime >= segment.start &&
      currentTime < segment.start + segment.duration
  );

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeSegmentRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeSegmentIndex]);

  const handleTextSelection = (segment: TranscriptSegment, e: React.MouseEvent) => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0) {
      setSelectedText(text);
      setSelectedSegment(segment);
      setPopupPosition({ x: e.clientX, y: e.clientY });
      setShowPopup(true);
    }
  };

  const handleSave = () => {
    if (selectedText && selectedSegment) {
      // Try to find translation of the selected word from the full translation
      const words = selectedSegment.text.split(/\s+/);
      const selectedWords = selectedText.split(/\s+/);
      const wordIndex = words.findIndex(w => 
        w.toLowerCase().includes(selectedWords[0].toLowerCase())
      );
      
      // Simple heuristic for translation
      let wordTranslation = selectedSegment.translation;
      
      onSaveWord(
        selectedText,
        wordTranslation,
        selectedSegment.text,
        selectedSegment.start
      );
      
      setShowPopup(false);
      setSelectedText('');
    }
  };

  return (
    <div className="h-[600px] flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Interactive Transcript
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Select any word to save it to your vocabulary
        </p>
      </div>

      {/* Transcript Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {transcript.map((segment, index) => {
          const isActive = index === activeSegmentIndex;
          
          return (
            <div
              key={index}
              ref={isActive ? activeSegmentRef : null}
              className={`p-4 rounded-lg border transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700'
                  : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={() => onSeekTo(segment.start)}
              onMouseUp={(e) => handleTextSelection(segment, e)}
            >
              <div className="flex items-start gap-3">
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-1 min-w-[60px]">
                  {Math.floor(segment.start / 60)}:{Math.floor(segment.start % 60).toString().padStart(2, '0')}
                </span>
                <div className="flex-1 space-y-2">
                  <p className="text-gray-900 dark:text-white font-medium select-text">
                    {segment.text}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm select-text">
                    {segment.translation}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selection Popup */}
      {showPopup && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPopup(false)}
          />
          <div
            className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[200px]"
            style={{
              left: `${popupPosition.x}px`,
              top: `${popupPosition.y + 10}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Save "{selectedText}" to vocabulary?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded transition"
              >
                Save
              </button>
              <button
                onClick={() => setShowPopup(false)}
                className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm rounded transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
