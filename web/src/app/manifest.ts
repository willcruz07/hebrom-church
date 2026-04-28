import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Hebrom Sys',
    short_name: 'hebrom_sys',
    description: 'Plataforma para gestão e comunicação da igreja',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617', // slate-950
    theme_color: '#3B82F6', // blue-500
    orientation: 'portrait',
    lang: 'pt-BR',
    icons: [
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    categories: ['productivity', 'social'],
    scope: '/',
    shortcuts: [],
  };
}
