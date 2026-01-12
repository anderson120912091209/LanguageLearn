'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import YouTube, { YouTubePlayer } from 'react-youtube';
import WordByWordDisplay from '@/components/WordByWordDisplay';
import VocabularyPanel from '@/components/VocabularyPanel';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { useRecentVideos } from '@/hooks/useRecentVideos';
import { BookOpen, TableProperties, ArrowLeft, Loader2, Sidebar } from 'lucide-react';
import Link from 'next/link';
import { getTranscript, saveTranscript } from '@/lib/db';

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
  translation: string;
}

interface SavedWord {
  id: string;
  word: string;
  translation: string;
  context: string;
  timestamp: number;
  created_at: string;
}

export default function WorkspacePage() {
  const params = useParams();
  const videoId = params.videoId as string;
  
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [showVocabulary, setShowVocabulary] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'split' | 'stacked'>('split');
  const [showRightPanel, setShowRightPanel] = useState(false);
  
  const [userId, setUserId] = useState<string | null>(null);
  const { addVideo } = useRecentVideos();
  
  const playerRef = useRef<YouTubePlayer | null>(null);

  useEffect(() => {
    checkAuth();
    fetchTranscript();
    loadSavedWords();
    addVideo(videoId, `Video ${videoId.substring(0, 5)}...`);
  }, [videoId]);

  const checkAuth = async () => {
    const user = await getCurrentUser();
    setUserId(user?.id || null);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [player]);

  const fetchTranscript = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      
      // 1. Try to load from cache first
      try {
        const cached = await getTranscript(videoId);
        if (cached && cached.data && cached.data.length > 0) {
            console.log('Loaded transcript from cache');
            setTranscript(cached.data);
            setLoading(false);
            return;
        }
      } catch (cacheErr) {
        console.warn('Cache lookup failed, proceeding to network fetch:', cacheErr);
      }

      // 2. If not in cache, fetch from API
      const response = await fetch('/api/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to fetch transcript');
      }

      const data = await response.json();
      
      if (!data.transcript || data.transcript.length === 0) {
        throw new Error('No transcript data received from API');
      }
      
      setTranscript(data.transcript);
      
      // 3. Save to cache
      await saveTranscript(videoId, data.transcript);
      
    } catch (err: any) {
      console.error('Error fetching transcript:', err);
      setError(err.message || 'Failed to load transcript');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedWords = async () => {
    try {
      const user = await getCurrentUser();
      
      if (user) {
        const { data, error: savedError } = await supabase
          .from('vocabulary')
          .select('*')
          .eq('user_id', user.id)
          .eq('video_id', videoId)
          .order('created_at', { ascending: false });

        if (savedError) throw savedError;
        
        if (data) {
          setSavedWords(data.map(item => ({
            id: item.id,
            word: item.word,
            translation: item.translation,
            context: item.context,
            timestamp: item.timestamp,
            created_at: item.created_at,
          })));
        }
      } else {
        const stored = localStorage.getItem(`vocabulary_${videoId}`);
        if (stored) {
          setSavedWords(JSON.parse(stored));
        }
      }
    } catch (err) {
      console.error('Error loading saved words:', err);
      const stored = localStorage.getItem(`vocabulary_${videoId}`);
      if (stored) {
        setSavedWords(JSON.parse(stored));
      }
    }
  };

  const onPlayerReady = (event: { target: YouTubePlayer }) => {
    setPlayer(event.target);
    playerRef.current = event.target;
  };

  const seekToTime = (time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time, true);
      playerRef.current.playVideo();
    }
  };

  const handleSaveWord = async (word: string, translation: string, context: string, timestamp: number) => {
    try {
      const user = await getCurrentUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('vocabulary')
          .insert({
            user_id: user.id,
            word,
            translation,
            context,
            video_id: videoId,
            timestamp,
          })
          .select()
          .single();

        if (error) throw error;
        
        if (data) {
          const newWord: SavedWord = {
            id: data.id,
            word: data.word,
            translation: data.translation,
            context: data.context,
            timestamp: data.timestamp,
            created_at: data.created_at,
          };
          setSavedWords([newWord, ...savedWords]);
        }
      } else {
        const newWord: SavedWord = {
          id: Date.now().toString(),
          word,
          translation,
          context,
          timestamp,
          created_at: new Date().toISOString(),
        };
        const updatedWords = [newWord, ...savedWords];
        setSavedWords(updatedWords);
        localStorage.setItem(`vocabulary_${videoId}`, JSON.stringify(updatedWords));
      }
    } catch (err) {
      console.error('Error saving word:', err);
      alert('Failed to save word. Please try again.');
    }
  };

  const handleDeleteWord = async (id: string) => {
    try {
      const user = await getCurrentUser();
      
      if (user) {
        const { error } = await supabase
          .from('vocabulary')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      }
      
      const updatedWords = savedWords.filter(w => w.id !== id);
      setSavedWords(updatedWords);
      localStorage.setItem(`vocabulary_${videoId}`, JSON.stringify(updatedWords));
    } catch (err) {
      console.error('Error deleting word:', err);
      alert('Failed to delete word. Please try again.');
    }
  };

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      modestbranding: 1,
      rel: 0,
    },
  };

  return (
    <div className="h-full flex flex-col p-2">
      
      {/* Workspace Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
                <ArrowLeft size={18} />
                <span className="font-medium">返回首頁</span>
            </Link>

            {/* Layout Toggle */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 gap-1">
                <button
                    onClick={() => setLayoutMode('split')}
                    className={`p-1.5 rounded-md transition-all ${layoutMode === 'split' ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                    title="分割檢視"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                        <line x1="12" x2="12" y1="3" y2="21"/>
                    </svg>
                </button>
                <button
                    onClick={() => setLayoutMode('stacked')}
                    className={`p-1.5 rounded-md transition-all ${layoutMode === 'stacked' ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                    title="劇院模式"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                        <line x1="3" x2="21" y1="12" y2="12"/>
                    </svg>
                </button>
            </div>
        </div>

        <div className="flex gap-3">
            <button
            onClick={() => setShowVocabulary(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border ${!showVocabulary ? 'bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-900' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
            >
            <BookOpen size={18} />
            <span>逐字稿</span>
            </button>
            <button
            onClick={() => setShowVocabulary(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border ${showVocabulary ? 'bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-900' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
            >
            <TableProperties size={18} />
            <span>單字庫</span>
            <span className="ml-1 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs">
                {savedWords.length}
            </span>
            </button>
            <button
            onClick={() => setShowRightPanel((prev) => !prev)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all border ${showRightPanel ? 'bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-900' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
            title="切換筆記區"
            >
            <Sidebar size={18} />
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex gap-6 relative">
        
        {/* Left/Center Content */}
        {/* Left/Center Content */}
        <div 
            className={`
                flex-1 flex min-h-0 transition-all duration-500 ease-in-out
                ${layoutMode === 'split' 
                    ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' 
                    : 'flex flex-col items-start gap-4' // Theater: Column, aligned left
                }
            `}
        >
            {/* Video Player */}
            <div 
                className={`
                    bg-black rounded-2xl shadow-sm overflow-hidden ring-1 ring-zinc-900/5 transition-all duration-500
                    ${layoutMode === 'split' 
                        ? 'aspect-video lg:aspect-auto lg:h-full' 
                        : 'w-full max-w-5xl aspect-video shrink-0 shadow-lg ring-zinc-900/10 z-20' // Theater: Bigger (max-w-5xl), matches caption width
                    }
                `}
            >
                <YouTube
                videoId={videoId}
                opts={opts}
                onReady={onPlayerReady}
                className="w-full h-full"
                />
            </div>

            {/* Transcript or Vocabulary Panel */}
            <div 
                className={`
                    transition-all duration-500 ease-in-out
                    ${layoutMode === 'split'
                        ? 'bg-white dark:bg-zinc-900 rounded-2xl shadow-sm overflow-hidden ring-1 ring-zinc-200 dark:ring-zinc-800 h-[500px] lg:h-full flex flex-col'
                        : 'w-full max-w-5xl flex-1 min-h-0 overflow-hidden' // Theater: Same width as video
                    }
                `}
            >
                 <div className={`h-full flex flex-col ${layoutMode === 'stacked' ? 'bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm ring-1 ring-zinc-100 dark:ring-zinc-800' : ''}`}>
                    {showVocabulary ? (
                        <VocabularyPanel
                            words={savedWords}
                            onDelete={handleDeleteWord}
                            onSeekTo={seekToTime}
                        />
                    ) : loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin text-zinc-900 dark:text-white w-8 h-8" />
                            <p className="text-zinc-500 font-medium">內容載入中...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-full text-center text-red-500">
                            <div>
                                <h3 className="font-bold text-lg mb-2">無法使用</h3>
                                <p className="text-sm opacity-80">{error}</p>
                            </div>
                        </div>
                    ) : (
                        <WordByWordDisplay
                            transcript={transcript}
                            currentTime={currentTime}
                            onSaveWord={handleSaveWord}
                            onSeekTo={seekToTime}
                            variant={layoutMode === 'stacked' ? 'theater' : 'document'}
                        />
                    )}
                 </div>
            </div>
        </div>

        {/* Right Sidebar (Workspace) */}
        {showRightPanel && (
            <div className="w-80 shrink-0 flex flex-col bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 transition-all duration-300">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                    <h2 className="font-semibold text-sm uppercase tracking-wider text-zinc-500">筆記區</h2>
                </div>
                <div className="p-4 flex-1">
                    <textarea 
                        className="w-full h-full resize-none bg-transparent outline-none text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 text-sm leading-relaxed"
                        placeholder="在此輸入您的筆記..." 
                    />
                </div>
            </div>
        )}

      </div>
    </div>
  );
}
