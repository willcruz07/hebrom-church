import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },
  // Serve o handler do Firebase Auth no próprio domínio do app. Necessário para o login
  // por redirect funcionar no Safari/iOS (bloqueio de storage de terceiros). Só tem efeito
  // quando NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN aponta para o domínio do app.
  async rewrites() {
    const firebaseHost = `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`
    return [
      { source: '/__/auth/:path*', destination: `${firebaseHost}/__/auth/:path*` },
      { source: '/__/firebase/:path*', destination: `${firebaseHost}/__/firebase/:path*` },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            // SAMEORIGIN (não DENY): o Firebase Auth embute /__/auth/iframe do próprio domínio
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },
}

export default nextConfig
