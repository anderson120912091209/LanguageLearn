"use client";

import { useState, useEffect } from "react";

export interface RecentVideo {
  videoId: string;
  title: string; // We might not have the title immediately available in all contexts, but good to store if we can
  timestamp: number;
}

const STORAGE_KEY = "language_learn_recent_videos";
const MAX_RECENT_VIDEOS = 10;

export function useRecentVideos() {
  const [recentVideos, setRecentVideos] = useState<RecentVideo[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setRecentVideos(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recent videos", e);
      }
    }
  }, []);

  const addVideo = (videoId: string, title: string = "Untitled Video") => {
    setRecentVideos((prev) => {
      // Remove if already exists to move to top
      const filtered = prev.filter((v) => v.videoId !== videoId);

      const newVideo = {
        videoId,
        title,
        timestamp: Date.now(),
      };

      const updated = [newVideo, ...filtered].slice(0, MAX_RECENT_VIDEOS);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return { recentVideos, addVideo };
}
