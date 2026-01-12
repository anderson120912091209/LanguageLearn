'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Youtube, ArrowRight, Play, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const [videoUrl, setVideoUrl] = useState('');
  const router = useRouter();

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractVideoId(videoUrl);
    
    if (videoId) {
      router.push(`/workspace/${videoId}`);
    } else {
      alert('Please enter a valid YouTube URL');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-2">
      <div className="flex flex-col items-center text-center mb-24 space-y-8">
        <div className="inline-flex items-center justify-center p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl mb-4 ring-1 ring-zinc-200 dark:ring-zinc-800">
            <Youtube className="w-8 h-8 text-zinc-900 dark:text-white" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900 dark:text-white max-w-4xl">
          透過真實影片，<br className="hidden md:block" />
          <span className="text-zinc-500 dark:text-zinc-400">精通英語。</span>
        </h1>
        
        <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed font-light">
          沉浸在您喜愛的內容中。互動翻譯、個人化單字庫，以及智慧學習追蹤。
        </p>
      </div>

      <div className="max-w-xl mx-auto mb-32">
        <div className="group relative">
           <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-2 transition-all duration-300 focus-within:ring-2 focus-within:ring-zinc-900 dark:focus-within:ring-zinc-100 focus-within:border-transparent">
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="在此貼上 YouTube 連結..."
                  className="flex-1 bg-transparent px-4 py-3 text-lg outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 font-light"
                  required
                />
                <button
                  type="submit"
                  className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  開始學習 <ArrowRight size={18} />
                </button>
            </form>
           </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <FeatureCard 
           icon={<Play className="w-5 h-5" />}
           title="互動播放"
           description="觀看同步雙語字幕影片，保持高度專注。"
        />
        <FeatureCard 
           icon={<CheckCircle2 className="w-5 h-5" />}
           title="智慧單字庫"
           description="點擊任意單字即刻儲存。我們將自動追蹤您的學習進度。"
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 p-8 rounded-3xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300">
      <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mb-6 text-zinc-900 dark:text-white group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">{title}</h3>
      <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed font-light">
        {description}
      </p>
    </div>
  );
}
