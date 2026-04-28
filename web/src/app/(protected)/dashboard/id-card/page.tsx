'use client';

import { useAuth } from '@/store/useAuth';
import { 
  User, 
  QrCode, 
  MapPin, 
  Phone, 
  Calendar,
  ShieldCheck,
  Zap
} from 'lucide-react';
import Image from 'next/image';

export default function IdCardPage() {
  const { currentUser } = useAuth();
  
  const roleLabels: Record<string, string> = {
    visitor: 'Visitante',
    member: 'Membro Efetivo',
    secretary: 'Secretaria',
    pastor: 'Pastor Presidente',
    pending_member: 'Membro em Observação'
  };

  const roleColors: Record<string, string> = {
    visitor: 'from-slate-400 to-slate-600',
    member: 'from-blue-500 to-indigo-600',
    secretary: 'from-emerald-500 to-teal-600',
    pastor: 'from-purple-600 to-indigo-700',
    pending_member: 'from-amber-400 to-orange-500'
  };

  const userRole = currentUser?.role || 'visitor';
  const cardGradient = roleColors[userRole] || 'from-blue-500 to-indigo-600';

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4 md:p-8">
      {/* Container principal - No mobile ele rotaciona se necessário ou expande */}
      <div className="relative w-full max-w-2xl group">
        
        {/* Efeito de brilho de fundo */}
        <div className={`absolute -inset-1 bg-gradient-to-r ${cardGradient} rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200`}></div>
        
        {/* Carteirinha */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col md:flex-row min-h-[350px] border border-slate-200 dark:border-slate-800">
          
          {/* Lado Esquerdo - Branding e Foto */}
          <div className={`w-full md:w-1/3 bg-gradient-to-br ${cardGradient} p-8 flex flex-col items-center justify-between text-white relative`}>
            {/* Decorativo de fundo */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <Zap className="w-full h-full scale-150 rotate-12" />
            </div>

            <div className="z-10 flex flex-col items-center gap-4">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md border border-white/30">
                <Image src="/logo.png" alt="Logo" width={50} height={50} className="brightness-0 invert" />
              </div>
              <h1 className="text-xl font-black tracking-tighter uppercase text-center">Hebrom Church</h1>
            </div>

            <div className="z-10 relative mt-4">
              <div className="w-32 h-32 rounded-full border-4 border-white/50 overflow-hidden shadow-xl bg-slate-200">
                {currentUser?.profile.avatar_url ? (
                  <img 
                    src={currentUser.profile.avatar_url} 
                    alt={currentUser.profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                    <User className="w-16 h-16 text-slate-400" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white text-blue-600 p-2 rounded-full shadow-lg border border-slate-100">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="z-10 text-center mt-4">
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-80">Identificação</p>
              <p className="text-lg font-bold truncate max-w-[150px]">#{currentUser?.uid.slice(-6).toUpperCase()}</p>
            </div>
          </div>

          {/* Lado Direito - Dados */}
          <div className="w-full md:w-2/3 p-8 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                    {currentUser?.profile.full_name || 'Membro da Igreja'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gradient-to-r ${cardGradient} text-white`}>
                      {roleLabels[userRole]}
                    </span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Desde 2024</span>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <QrCode className="w-12 h-12 text-slate-200 dark:text-slate-700" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Grupo</p>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <Zap className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <span className="text-sm font-semibold">{currentUser?.sub_groups[0] || 'Geral'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Contato</p>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <Phone className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <span className="text-sm font-semibold">{currentUser?.profile.phone || '(00) 00000-0000'}</span>
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Endereço</p>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <span className="text-sm font-semibold truncate">{currentUser?.profile.address || 'Não informado'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Nascimento</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{currentUser?.profile.birth_date || '--/--/----'}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Batismo</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{currentUser?.profile.baptism_date || 'N/A'}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-2 text-blue-500 font-black text-lg italic">
                  <span>HEBROM</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  <span className="opacity-50">SYS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selo Holográfico */}
          <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-200 via-yellow-400 to-yellow-600 opacity-30 blur-[2px] animate-pulse"></div>
        </div>

        {/* Instrução mobile */}
        <div className="mt-6 text-center md:hidden">
          <p className="text-slate-500 text-sm flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-blue-500" />
            Vire o celular para ver melhor
          </p>
        </div>
      </div>
    </div>
  );
}
