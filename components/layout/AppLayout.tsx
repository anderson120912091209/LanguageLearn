'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen w-full flex bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 overflow-hidden relative selection:bg-zinc-200 dark:selection:bg-zinc-800 selection:text-zinc-900 dark:selection:text-white">
      {/* Layer 1: Background Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Layer 2: Main Content */}
      <div 
        className={`
          flex-1 flex flex-col h-screen
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'ml-56' : 'ml-20'}

        `}
      >
        <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900
         rounded-2xl shadow-sm overflow-hidden relative m-2 border-sm border-zinc-200">
           {/* Top Bar inside the rounded container */}
           <TopBar />
           
           {/* Page Content */}
           <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
             {children}
           </main>
        </div>
      </div>
    </div>
  );
}
