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

// O iOS ignora `user-scalable=no`, então o zoom de pinça é barrado na mão:
// `gesture*` são eventos exclusivos do WebKit; o touchmove com 2+ dedos cobre o resto.
function blockPinchZoom() {
  const preventGesture = (e: Event) => e.preventDefault();
  const preventMultiTouch = (e: TouchEvent) => {
    if (e.touches.length > 1) e.preventDefault();
  };

  document.addEventListener('gesturestart', preventGesture, { passive: false });
  document.addEventListener('gesturechange', preventGesture, { passive: false });
  document.addEventListener('touchmove', preventMultiTouch, { passive: false });

  return () => {
    document.removeEventListener('gesturestart', preventGesture);
    document.removeEventListener('gesturechange', preventGesture);
    document.removeEventListener('touchmove', preventMultiTouch);
  };
}

export default function PwaManager() {
  useEffect(() => {
    registerServiceWorker();
    return blockPinchZoom();
  }, []);

  return null;
}
