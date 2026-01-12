'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlayCircle, ChevronLeft, ChevronRight, Hash, Clock, Settings, Search, LogIn, UserPlus } from 'lucide-react';
import { useRecentVideos } from '@/hooks/useRecentVideos';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/auth';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { recentVideos } = useRecentVideos();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (e) {
      console.error('Error loading user', e);
    }
  };

  if (!mounted) return null;

  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-50
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-56' : 'w-20'}
        flex flex-col
        bg-white dark:bg-zinc-950
      `}
    >
      {/* Header: Logo & Toggle */}
      {/* Header: Logo & Toggle */}
      <div className={`h-16 flex items-center px-4 mb-2 shrink-0 ${isOpen ? 'justify-between' : 'justify-center'}`}>
        {isOpen && (
            <div className="flex items-center gap-2 overflow-hidden animate-in fade-in duration-300">
                <img src="/logo.png" alt="LanguageLearn" className="w-8 h-8 object-contain" />
                <span className="text-zinc-900 dark:text-zinc-100 font-semibold text-lg tracking-tight whitespace-nowrap">
                    LanguageLearn
                </span>
            </div>
        )}
        
        <button
            onClick={onToggle}
            className={`p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors ${!isOpen ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}
            title={isOpen ? "收起側邊欄" : "展開側邊欄"}
        >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto scrollbar-hide">
        {/* Main Section */}
        <div className="space-y-1">
          
          <NavItem 
            href="/" 
            icon={<Home size={20} />} 
            label="首頁" 
            isOpen={isOpen} 
            active={pathname === '/'}
          />
          <NavItem 
            href="#" 
            icon={<Search size={20} />} 
            label="探索" 
            isOpen={isOpen} 
            active={false}
          />
        </div>

        {/* Recent Videos Section */}
        {recentVideos.length > 0 && isOpen && (
          <div className="pt-4 animate-in fade-in duration-500">
            <h3 className="px-4 text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
              最近觀看
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
                  <span className="truncate">{video.title || '未命名影片'}</span>
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
      
      {/* Auth Section for Guests */}
      {!user && (
        <div className={`p-4 ${isOpen ? '' : 'flex justify-center'}`}>
           <div className={`space-y-1 ${isOpen ? '' : 'flex flex-col gap-2'}`}>
                <NavItem 
                    href="/login" 
                    icon={<LogIn size={20} />} 
                    label="登入" 
                    isOpen={isOpen} 
                    active={pathname === '/login'}
                />
                <NavItem 
                    href="/signup" 
                    icon={<UserPlus size={20} />} 
                    label="註冊" 
                    isOpen={isOpen} 
                    active={pathname === '/signup'}
                />
           </div>
        </div>
      )}
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
