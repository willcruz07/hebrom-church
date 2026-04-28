'use client';

import { useEffect } from 'react';

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })
      .catch((err) => {
        console.error('SW registration failed:', err);
      });
  }
}

export default function PwaManager() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
