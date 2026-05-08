'use client';

import { Sidebar } from '@/components/Sidebar';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { useEffect, useState } from 'react';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-screen bg-slate-950" />;
  }

  return (
    <>
      <div className="block lg:hidden">
        <MobileLayout>{children}</MobileLayout>
        <Sidebar />
      </div>

      <div className="hidden h-screen lg:grid lg:grid-cols-[320px_1fr] bg-slate-950">
      <aside className="hidden overflow-hidden lg:block h-full">
        <Sidebar />
      </aside>
      <div className="flex min-h-0 flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
    </>
  );
}
