import { Users, LayoutDashboard, Heart, ShieldCheck, Smartphone, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/paths';

export default function LandingPage() {
  return (
    <div className="bg-slate-950 bg-[url('https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop')] bg-cover bg-fixed bg-center bg-no-repeat min-h-screen">
      <div className="min-h-screen w-full bg-slate-950/80">
        <main>
          {/* Hero Section */}
          <section className="flex min-h-screen flex-col items-center justify-center gap-8 py-12 px-4">
            <div className="mx-auto max-w-4xl text-center flex flex-col items-center">
              <img src="/logo.png" alt="Hebrom Sys" className="mb-6 h-24 w-auto drop-shadow-lg" />
              <p className="mb-8 text-lg text-slate-300 sm:text-xl lg:text-2xl max-w-2xl mx-auto">
                Conectando nossa comunidade, centralizando informações e fortalecendo a gestão da nossa igreja.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  className="bg-blue-600 hover:bg-blue-700 w-full rounded-lg px-6 py-3 font-medium text-white transition-colors sm:w-auto text-center"
                  href={ROUTES.NO_AUTH.SIGN_IN}
                >
                  Acessar Plataforma
                </Link>
                <Link
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-6 py-3 font-medium text-slate-200 transition-colors hover:bg-slate-800 sm:w-auto text-center"
                  href={ROUTES.AUTHENTICATED.HOME}
                >
                  Área do Membro
                </Link>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-16 lg:py-24 px-4">
            <div className="mx-auto max-w-6xl">
              <h2 className="mb-12 text-center text-3xl font-bold text-slate-100 sm:text-4xl">
                Tudo para a <span className="text-blue-500">gestão eficiente</span> da igreja
              </h2>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg bg-slate-800/50 p-6 text-center backdrop-blur-sm transition-all hover:bg-slate-800/70 border border-slate-700/50">
                  <div className="mb-4 flex justify-center">
                    <div className="bg-blue-500/20 rounded-full p-3">
                      <LayoutDashboard className="text-blue-500 h-8 w-8" />
                    </div>
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-slate-100">Painel Administrativo</h3>
                  <p className="text-slate-400 text-sm">
                    Gestão centralizada para pastores e secretaria. Controle de aprovações, avisos e relatórios em tempo real.
                  </p>
                </div>

                <div className="rounded-lg bg-slate-800/50 p-6 text-center backdrop-blur-sm transition-all hover:bg-slate-800/70 border border-slate-700/50">
                  <div className="mb-4 flex justify-center">
                    <div className="bg-blue-500/20 rounded-full p-3">
                      <Users className="text-blue-500 h-8 w-8" />
                    </div>
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-slate-100">Diretório de Membros</h3>
                  <p className="text-slate-400 text-sm">
                    Conheça a comunidade. Informações de contato, grupos e carteirinha digital sempre à mão.
                  </p>
                </div>

                <div className="rounded-lg bg-slate-800/50 p-6 text-center backdrop-blur-sm transition-all hover:bg-slate-800/70 border border-slate-700/50">
                  <div className="mb-4 flex justify-center">
                    <div className="bg-blue-500/20 rounded-full p-3">
                      <Heart className="text-blue-500 h-8 w-8" />
                    </div>
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-slate-100">Mural e Feed</h3>
                  <p className="text-slate-400 text-sm">
                    Avisos gerais e comunicados segmentados por ministério. Nunca perca um evento importante.
                  </p>
                </div>

                <div className="rounded-lg bg-slate-800/50 p-6 text-center backdrop-blur-sm transition-all hover:bg-slate-800/70 border border-slate-700/50">
                  <div className="mb-4 flex justify-center">
                    <div className="bg-blue-500/20 rounded-full p-3">
                      <BookOpen className="text-blue-500 h-8 w-8" />
                    </div>
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-slate-100">Pedidos de Oração</h3>
                  <p className="text-slate-400 text-sm">
                    Compartilhe seus motivos de oração com a igreja ou de forma confidencial apenas com a liderança.
                  </p>
                </div>

                <div className="rounded-lg bg-slate-800/50 p-6 text-center backdrop-blur-sm transition-all hover:bg-slate-800/70 border border-slate-700/50">
                  <div className="mb-4 flex justify-center">
                    <div className="bg-blue-500/20 rounded-full p-3">
                      <Smartphone className="text-blue-500 h-8 w-8" />
                    </div>
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-slate-100">Mobile First</h3>
                  <p className="text-slate-400 text-sm">
                    Interface otimizada para o seu celular. Tenha a igreja com você onde quer que vá.
                  </p>
                </div>

                <div className="rounded-lg bg-slate-800/50 p-6 text-center backdrop-blur-sm transition-all hover:bg-slate-800/70 border border-slate-700/50">
                  <div className="mb-4 flex justify-center">
                    <div className="bg-blue-500/20 rounded-full p-3">
                      <ShieldCheck className="text-blue-500 h-8 w-8" />
                    </div>
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-slate-100">Segurança Total</h3>
                  <p className="text-slate-400 text-sm">
                    Acesso restrito e validado. Dados protegidos com as melhores práticas de segurança da nuvem.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-slate-800 py-8 px-4">
            <div className="mx-auto max-w-6xl text-center">
              <p className="text-slate-400 text-sm">© {new Date().getFullYear()} Hebrom Sys - Conectando nossa comunidade</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
