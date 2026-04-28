'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/store/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ROUTES } from '@/paths';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const registerSchema = z.object({
  name: z.string().min(2, 'Informe seu nome'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const { signInWithEmail, signInWithGoogle, signUpWithEmail, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onLogin = async (values: LoginFormValues) => {
    setError(null);
    try {
      await signInWithEmail(values.email, values.password);
      router.replace(ROUTES.AUTHENTICATED.HOME);
    } catch (err) {
      console.error(err);
      setError('Não foi possível entrar. Verifique suas credenciais.');
    }
  };

  const onRegister = async (values: RegisterFormValues) => {
    setRegisterError(null);
    try {
      await signUpWithEmail(values.name, values.email, values.password);
      setIsRegisterOpen(false);
      router.replace(ROUTES.AUTHENTICATED.HOME);
    } catch (err) {
      console.error(err);
      setRegisterError('Não foi possível registrar. Tente novamente.');
    }
  };

  const onGoogle = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      router.replace(ROUTES.AUTHENTICATED.HOME);
    } catch (err) {
      console.error(err);
      setError('Falha no login com Google.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 bg-[url('https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop')] bg-cover bg-fixed bg-center bg-no-repeat">
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-950/80 px-4 py-12">
        <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-8 text-center flex flex-col items-center">
            <img src="/logo.png" alt="Hebrom Sys" className="mb-4 h-16 w-auto drop-shadow-md" />
            <p className="text-sm text-slate-400 font-medium">Acesse a plataforma Hebrom</p>
          </div>

          <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
              <input
                {...loginRegister('email')}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 p-2.5 text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="seu@email.com"
              />
              {loginErrors.email && (
                <p className="mt-1.5 text-sm text-red-400 font-medium">{loginErrors.email.message}</p>
              )}
            </div>
            
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Senha</label>
              <input
                type="password"
                {...loginRegister('password')}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 p-2.5 text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="••••••••"
              />
              {loginErrors.password && (
                <p className="mt-1.5 text-sm text-red-400 font-medium">{loginErrors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-red-800/50 bg-red-900/30 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              disabled={loading.signIn}
              type="submit"
              className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
            >
              {loading.signIn ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-slate-800"></div>
            <span className="px-3 text-sm text-slate-500 font-medium">ou</span>
            <div className="flex-1 border-t border-slate-800"></div>
          </div>

          <button
            type="button"
            onClick={onGoogle}
            disabled={loading.signIn}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2.5 font-medium text-slate-200 transition-all hover:bg-slate-700 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
          >
            {loading.signIn ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-white"></div>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                Google
              </>
            )}
          </button>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(true)}
              className="text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors"
            >
              Não tem uma conta? Registrar-se
            </button>
          </div>
        </div>
      </div>

      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
            <h2 className="mb-6 text-2xl font-bold text-slate-100 tracking-tight">Criar nova conta</h2>
            <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Nome Completo</label>
                <input
                  {...registerRegister('name')}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="Seu nome"
                />
                {registerErrors.name && (
                  <p className="mt-1.5 text-sm text-red-400 font-medium">{registerErrors.name.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
                <input
                  {...registerRegister('email')}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="seu@email.com"
                />
                {registerErrors.email && (
                  <p className="mt-1.5 text-sm text-red-400 font-medium">{registerErrors.email.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Senha</label>
                <input
                  type="password"
                  {...registerRegister('password')}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="••••••••"
                />
                {registerErrors.password && (
                  <p className="mt-1.5 text-sm text-red-400 font-medium">{registerErrors.password.message}</p>
                )}
              </div>
              
              {registerError && (
                <div className="rounded-lg border border-red-800/50 bg-red-900/30 p-3 text-sm text-red-300">
                  {registerError}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="w-1/2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  disabled={loading.signIn}
                  type="submit"
                  className="w-1/2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-all disabled:opacity-70"
                >
                  {loading.signIn ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
