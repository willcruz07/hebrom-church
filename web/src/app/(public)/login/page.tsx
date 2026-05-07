'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/store/useAuth'
import { ROUTES } from '@/paths'
import Image from 'next/image'
import { HebromSpinner } from '@/components/ui/HebromSpinner'

export default function LoginPage() {
  const { signInWithGoogle, signInWithApple, loading } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (method: 'google' | 'apple') => {
    setError(null)
    try {
      if (method === 'google') {
        await signInWithGoogle()
      } else {
        await signInWithApple()
      }
      router.replace(ROUTES.AUTHENTICATED.HOME)
    } catch (err: any) {
      console.error(err)
      setError(`Falha na autenticação com ${method === 'google' ? 'Google' : 'Apple'}.`)
    }
  }

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Background with Ambient Light */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-amber-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 animate-in fade-in zoom-in duration-700">
        {/* Card */}
        <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-2xl md:p-12">
          {/* Header */}
          <div className="mb-10 flex flex-col items-center text-center">
            <div className="relative mb-6 flex h-24 w-full items-center justify-center">
              <Image
                src="/logo_sb.png"
                width={300}
                height={120}
                alt="Hebrom Sys"
                priority
                className="h-auto w-48 object-contain drop-shadow-2xl"
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Bem-vindo ao{' '}
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                Hebrom Sys
              </span>
            </h1>
            <p className="mt-3 text-slate-400">
              Gerencie sua jornada espiritual com simplicidade e elegância.
            </p>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-4">
            <button
              onClick={() => handleLogin('google')}
              disabled={loading.signIn}
              className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-4 font-semibold text-white transition-all hover:bg-white/10 active:scale-[0.98] disabled:opacity-50"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-600/0 via-amber-600/5 to-amber-600/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              {loading.signIn ? (
                <HebromSpinner size="sm" />
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6 shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Logar com Google
                </>
              )}
            </button>

            {/* <button
              onClick={() => handleLogin('apple')}
              disabled={loading.signIn}
              className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-4 font-semibold text-black transition-all hover:bg-slate-200 active:scale-[0.98] disabled:opacity-50"
            >
              {loading.signIn ? (
                <HebromSpinner size="sm" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.021-.013-3.179-1.221-3.218-4.857-.026-3.039 2.481-4.494 2.585-4.56-.039-.051-2.453-2.908-5.337-3.116-1.44-.117-2.82.883-3.663.883zm3.173-3.155c.783-.948 1.3-2.261 1.153-3.57-1.12.046-2.48.75-3.282 1.688-.718.82-1.354 2.156-1.183 3.441 1.25.097 2.529-.611 3.312-1.559z"/>
                  </svg>
                  Continuar com Apple
                </>
              )}
            </button> */}
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm font-medium text-red-400">
              {error}
            </div>
          )}

          {/* Footer Info */}
          <div className="mt-10 text-center">
            <p className="text-xs text-slate-500">
              Ao continuar, você concorda com nossos <br />
              <button className="text-slate-400 hover:underline">Termos de Serviço</button> e{' '}
              <button className="text-slate-400 hover:underline">Privacidade</button>
            </p>
          </div>
        </div>

        {/* Small version info or similar */}
        <div className="mt-8 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600 font-bold">
            Hebrom System © 2026
          </p>
        </div>
      </div>
    </main>
  )
}
