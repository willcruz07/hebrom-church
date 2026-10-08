'use client';

import { Sidebar } from '@/components/Sidebar';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import NotificationPrompt from '@/components/notifications/NotificationPrompt';
import { useEffect, useState } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { useAuth } from '@/store/useAuth';
import { onForegroundMessage, syncNotificationToken } from '@/services/firebase/messaging';
import { seedFixedGroups } from '@/services/firebase/groups';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  // Mesmo breakpoint `lg` do Tailwind e do Sidebar
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const { currentUser } = useAuth();

  useEffect(() => {
    setMounted(true);

    if (currentUser) {
      onForegroundMessage();
      syncNotificationToken(currentUser.uid);
    }
    // Só quando troca de usuário — o objeto currentUser muda a cada atualização de perfil
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]);

  useEffect(() => {
    // Garante que os 20 grupos fixos por atribuição existam — ver specs/mural-grupos.md
    if (currentUser && (currentUser.role === 'secretary' || currentUser.role === 'pastor')) {
      seedFixedGroups().catch((error) => {
        console.error('Erro ao configurar grupos padrão:', error);
      });
    }
  }, [currentUser]);

  if (!mounted) {
    return <div className="h-screen bg-slate-950" />;
  }

  // Renderiza UM layout só. Montar os dois e esconder um via CSS duplicava a página
  // inteira (leituras do Firestore em dobro, gráficos do Recharts medindo 0x0).
  return (
    <>
      {isDesktop ? (
        <div className="grid h-screen grid-cols-[320px_1fr] bg-slate-950">
          <aside className="h-full overflow-hidden">
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
      ) : (
        <>
          <MobileLayout>{children}</MobileLayout>
          <Sidebar />
        </>
      )}
      <NotificationPrompt />
    </>
  );
}
