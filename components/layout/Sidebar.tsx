'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlayCircle, ChevronLeft, ChevronRight, Hash, Clock, Settings, Search } from 'lucide-react';
import { useRecentVideos } from '@/hooks/useRecentVideos';
import { useEffect, useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { recentVideos } = useRecentVideos();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-50
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64' : 'w-20'}
        flex flex-col
        text-zinc-500 dark:text-zinc-400
        border-r border-transparent 
      `}
    >
      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 mb-2">
        <div className={`flex items-center gap-3 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
           <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-50 flex items-center justify-center text-white dark:text-zinc-900 font-bold shrink-0">
             L
           </div>
           <span className="text-zinc-900 dark:text-zinc-100 font-semibold text-lg tracking-tight whitespace-nowrap">
             LanguageLearn
           </span>
        </div>
        {/* Mobile-ish Logo when closed */}
        {!isOpen && (
           <div className="absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 font-bold">
             L
           </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto scrollbar-hide">
        {/* Main Section */}
        <div className="space-y-1">
          <NavItem 
            href="/" 
            icon={<Home size={20} />} 
            label="Home" 
            isOpen={isOpen} 
            active={pathname === '/'}
          />
          <NavItem 
            href="#" 
            icon={<Search size={20} />} 
            label="Explore" 
            isOpen={isOpen} 
            active={false}
          />
        </div>

        {/* Recent Videos Section */}
        {recentVideos.length > 0 && isOpen && (
          <div className="pt-4 animate-in fade-in duration-500">
            <h3 className="px-4 text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
              Recent
            </h3>
            <div className="space-y-1">
              {recentVideos.map((video) => (
                <Link
                  key={video.videoId}
                  href={`/workspace/${video.videoId}`}
                  className={`
                    group flex items-center gap-3 px-4 py-2 text-sm rounded-lg
                    hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors
                    ${pathname === `/workspace/${video.videoId}` ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white' : ''}
                  `}
                >
                  <PlayCircle size={16} className="shrink-0 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
                  <span className="truncate">{video.title || 'Untitled Video'}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Closed state recent icon */}
        {!isOpen && recentVideos.length > 0 && (
           <div className="flex justify-center py-4 border-t border-zinc-200 dark:border-zinc-800/50 mx-2">
              <Clock size={20} className="text-zinc-400" />
           </div>
        )}

      </nav>

      {/* Footer / Toggle */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/50">
         <button
            onClick={onToggle}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800/50 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all"
         >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
         </button>
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label, isOpen, active }: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  isOpen: boolean; 
  active: boolean; 
}) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
        ${active 
          ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-medium' 
          : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
        }
        ${!isOpen ? 'justify-center px-0' : ''}
      `}
    >
      <div className={`${active ? 'text-zinc-900 dark:text-zinc-50' : 'group-hover:text-zinc-700 dark:group-hover:text-zinc-300'}`}>
        {icon}
      </div>
      <span className={`
        whitespace-nowrap transition-all duration-300 origin-left
        ${isOpen ? 'opacity-100 translate-x-0 w-auto' : 'opacity-0 translate-x-[-10px] w-0 overflow-hidden absolute'}
      `}>
        {label}
      </span>
    </Link>
  );
}
