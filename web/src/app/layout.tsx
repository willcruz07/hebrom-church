import type { Metadata } from 'next'
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

export const metadata: Metadata = {
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
    <html lang="pt-BR">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#3B82F6" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider enableSystem attribute="class" defaultTheme="dark" disableTransitionOnChange>
          <PwaManager />
          <InstallPrompt />
          <AuthSession>
            <TooltipProvider>
              <MessagesProvider>
                {children}
                <AppMessageDialog />
                <Toaster richColors position="top-right" />
              </MessagesProvider>
            </TooltipProvider>
          </AuthSession>
        </ThemeProvider>
      </body>
    </html>
  )
}
