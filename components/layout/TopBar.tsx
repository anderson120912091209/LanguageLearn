'use client';

import { useState, useEffect } from 'react';
import { signOut, getCurrentUser } from '@/lib/auth';
import AuthModal from '@/components/AuthModal';
import { LogOut, Loader2 } from 'lucide-react';

interface User {
  id: string;
  email?: string;
}

export default function TopBar() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    window.addEventListener('focus', checkUser);
    return () => window.removeEventListener('focus', checkUser);
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error: any) {
      alert('Error signing out: ' + error.message);
    }
  };

  return (
    <>
      {(loading || user) && (
      <div className="w-full h-16 flex items-center justify-end px-8 py-4">
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="flex items-center gap-2 text-zinc-400">
               <Loader2 className="animate-spin w-4 h-4" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-zinc-200 dark:border-zinc-800">
              <div className="flex flex-col items-end">
                <span className="text-xs text-zinc-500 font-medium">Signed in as</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
                  {user.email?.split('@')[0]}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-red-500 transition-colors"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : null}
        </div>
      </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={checkUser}
      />
    </>
  );
}
