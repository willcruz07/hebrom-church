import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthSession } from '@/providers/AuthSession'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { MessagesProvider } from '@/hooks/useMessages'
import PwaManager from '@/components/PwaManager'
import InstallPrompt from '@/components/notifications/InstallPrompt'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppMessageDialog } from '@/components/ui/app-message-dialog'
import { Toaster } from 'sonner'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

// Base para resolver URLs relativas do Open Graph (ex.: /logo.png) em URLs absolutas.
// VERCEL_PROJECT_PRODUCTION_URL é preenchida automaticamente pela Vercel (sem protocolo).
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')

// Declarado aqui (e não com <meta> manual): o Next injeta o próprio viewport depois do
// manual, e o dele sem `viewport-fit=cover` fazia o iOS reservar a faixa da status bar.
// Com `cover` + status bar `black-translucent`, o conteúdo desenha por baixo da status
// bar; cada tela compensa com env(safe-area-inset-top) onde precisa.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Mesma cor da barra superior do app (MobileLayout): white / slate-900
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  appleWebApp: {
    capable: true,
    title: 'Hebrom Sys',
    statusBarStyle: 'black-translucent',
  },
  title: 'Hebrom Sys',
  description: 'Sistema de Gestão - Hebrom',
  icons: {
    icon: '/hearth.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Hebrom Sys',
    description: 'Sistema de Gestão - Hebrom',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 600,
        alt: 'Hebrom Sys',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* O Next só gera `mobile-web-app-capable`; o iOS ainda lê a versão apple- */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider enableSystem attribute="class" defaultTheme="dark" disableTransitionOnChange>
          <PwaManager />
          <InstallPrompt />
          <AuthSession>
            <TooltipProvider>
              <MessagesProvider>
                {children}
                <AppMessageDialog />
                <Toaster
                  richColors
                  position="top-right"
                  // Não deixa o toast nascer por baixo da status bar no iOS
                  offset={{ top: 'calc(env(safe-area-inset-top) + 24px)' }}
                  mobileOffset={{ top: 'calc(env(safe-area-inset-top) + 16px)' }}
                />
              </MessagesProvider>
            </TooltipProvider>
          </AuthSession>
        </ThemeProvider>
      </body>
    </html>
  )
}
