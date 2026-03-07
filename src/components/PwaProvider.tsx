'use client';

import { useEffect } from 'react';

/**
 * PwaProvider — registers the service worker on the client.
 * Rendered once in the root layout; returns no visible UI.
 */
export function PwaProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[PWA] Service worker registered', reg.scope);
      })
      .catch((err) => {
        console.error('[PWA] Service worker registration failed', err);
      });
  }, []);

  return null;
}
