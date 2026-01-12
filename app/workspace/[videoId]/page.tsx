'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import YouTube, { YouTubePlayer } from 'react-youtube';
import WordByWordDisplay from '@/components/WordByWordDisplay';
import VocabularyPanel from '@/components/VocabularyPanel';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { useRecentVideos } from '@/hooks/useRecentVideos';
import { BookOpen, TableProperties, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

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
  const [userId, setUserId] = useState<string | null>(null);
  const { addVideo } = useRecentVideos();
  
  const playerRef = useRef<YouTubePlayer | null>(null);

  useEffect(() => {
    checkAuth();
    fetchTranscript();
    loadSavedWords();
    // We'll add the video to history once the player is ready/title is available, 
    // or just add it now with a default title and update it if we could fetch title (not implemented yet)
    addVideo(videoId, `Video ${videoId.substring(0, 5)}...`);
  }, [videoId]);

  const checkAuth = async () => {
    const user = await getCurrentUser();
    setUserId(user?.id || null);
  };

  useEffect(() => {
    // Update current time more frequently for word-by-word highlighting
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedWords = async () => {
    try {
      const user = await getCurrentUser();
      
      if (user) {
        // Load from Supabase if authenticated
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
        // Fallback to localStorage if not authenticated
        const stored = localStorage.getItem(`vocabulary_${videoId}`);
        if (stored) {
          setSavedWords(JSON.parse(stored));
        }
      }
    } catch (err) {
      console.error('Error loading saved words:', err);
      // Fallback to localStorage on error
      const stored = localStorage.getItem(`vocabulary_${videoId}`);
      if (stored) {
        setSavedWords(JSON.parse(stored));
      }
    }
  };

  const onPlayerReady = (event: { target: YouTubePlayer }) => {
    setPlayer(event.target);
    playerRef.current = event.target;
    // Optionally update title here if API allows access to video data
    // const videoData = event.target.getVideoData();
    // addVideo(videoId, videoData.title);
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
        // Save to Supabase if authenticated
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
        // Fallback to localStorage
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
        // Delete from Supabase if authenticated
        const { error } = await supabase
          .from('vocabulary')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      }
      
      // Update local state
      const updatedWords = savedWords.filter(w => w.id !== id);
      setSavedWords(updatedWords);
      
      // Also update localStorage
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
      autoplay: 1, // Auto-play when entering workspace is usually expected
      modestbranding: 1,
      rel: 0,
    },
  };

  return (
    <div className="h-full flex flex-col p-6 pt-0">
      
      {/* Workspace Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
            <ArrowLeft size={18} />
            <span className="font-medium">Back to Home</span>
        </Link>
        <div className="flex gap-3">
            <button
            onClick={() => setShowVocabulary(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border ${!showVocabulary ? 'bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-900' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
            >
            <BookOpen size={18} />
            <span>Transcript</span>
            </button>
            <button
            onClick={() => setShowVocabulary(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border ${showVocabulary ? 'bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-900' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
            >
            <TableProperties size={18} />
            <span>Vocabulary</span>
            <span className="ml-1 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs">
                {savedWords.length}
            </span>
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* Video Player */}
        <div className="bg-black rounded-2xl shadow-sm overflow-hidden ring-1 ring-zinc-900/5 aspect-video lg:aspect-auto lg:h-full">
            <YouTube
            videoId={videoId}
            opts={opts}
            onReady={onPlayerReady}
            className="w-full h-full"
            />
        </div>

        {/* Transcript or Vocabulary Panel */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm overflow-hidden ring-1 ring-zinc-200 dark:ring-zinc-800 flex flex-col h-[500px] lg:h-full">
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
                <p className="text-zinc-500 font-medium">Loading contents...</p>
                </div>
            </div>
            ) : error ? (
            <div className="flex items-center justify-center h-full p-8 text-center text-red-500">
                <div>
                    <h3 className="font-bold text-lg mb-2">Unavailable</h3>
                    <p className="text-sm opacity-80">{error}</p>
                </div>
            </div>
            ) : (
            <WordByWordDisplay
                transcript={transcript}
                currentTime={currentTime}
                onSaveWord={handleSaveWord}
                onSeekTo={seekToTime}
            />
            )}
        </div>
      </div>
    </div>
  );
}
