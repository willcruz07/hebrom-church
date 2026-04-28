'use client';

import { useAuth } from '@/store/useAuth';
import { LogOut, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PendentePage() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <div className="flex h-full flex-col items-center justify-center py-12">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-900/30">
          <Clock className="h-12 w-12 text-blue-500" />
        </div>
        
        <h1 className="mb-4 text-3xl font-bold text-slate-100">Aprovação Pendente</h1>
        
        <p className="mb-8 text-slate-400">
          Sua solicitação foi enviada para a secretaria da igreja. Assim que seu cadastro for validado, você terá acesso a todos os recursos da plataforma Hebrom Sys.
        </p>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-sm text-slate-300">
            Enquanto aguarda, você pode fechar o aplicativo. Nós o avisaremos (ou verifique novamente mais tarde).
          </p>
          <button
            onClick={handleSignOut}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-slate-800 px-4 py-2 font-medium text-slate-200 transition-colors hover:bg-slate-700"
          >
            <LogOut className="h-4 w-4" />
            Sair da Conta
          </button>
        </div>
      </div>
    </div>
  );
}
