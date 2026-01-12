import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface Video {
  id: string;
  video_id: string;
  title: string;
  user_id: string;
  created_at: string;
}

export interface Transcript {
  id: string;
  video_id: string;
  text: string;
  start: number;
  duration: number;
  translation: string;
  created_at: string;
}

export interface Vocabulary {
  id: string;
  user_id: string;
  word: string;
  translation: string;
  context: string;
  video_id: string;
  timestamp: number;
  created_at: string;
}
