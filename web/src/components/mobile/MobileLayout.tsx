'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { MobileBottomNav } from './MobileBottomNav';
import { useAuth } from '@/store/useAuth';
import { User, Menu } from 'lucide-react';
import { useMenuState } from '@/store/useMenuState';
import Image from 'next/image';

interface MobileLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
  className?: string;
  contentClassName?: string;
}

export function MobileLayout({ children, showBottomNav = true, className, contentClassName }: MobileLayoutProps) {
  const { currentUser } = useAuth();
  const { setMenuIsOpen } = useMenuState();

  return (
    <div className={cn('flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950', className)}>
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <button
          onClick={() => setMenuIsOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Hebrom" width={32} height={32} className="object-contain" />
          <span className="font-bold text-slate-900 dark:text-white">Hebrom Sys</span>
        </div>

        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-blue-500/10">
          {currentUser?.profile.avatar_url ? (
            <img src={currentUser.profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <User className="h-5 w-5 text-blue-500" />
          )}
        </div>
      </header>

      <main className={cn('flex-1 overflow-y-auto px-4 py-6', showBottomNav && 'pb-mobile-nav', contentClassName)}>
        {children}
      </main>

      {showBottomNav && <MobileBottomNav />}
    </div>
  );
}
