'use client';

import { useState, useEffect, useCallback } from 'react';

/** Converts the VAPID public key from base64url to an ArrayBuffer */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0))).buffer as ArrayBuffer;
}

export type PushState = 'unsupported' | 'loading' | 'denied' | 'subscribed' | 'unsubscribed';

export function usePushNotifications() {
  const [state, setState] = useState<PushState>('loading');
  const [error, setError] = useState<string | null>(null);

  // Detect support and check existing subscription on mount
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      !('Notification' in window)
    ) {
      setState('unsupported');
      return;
    }

    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }

    navigator.serviceWorker.ready
      .then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setState(sub ? 'subscribed' : 'unsubscribed');
      })
      .catch(() => setState('unsubscribed'));
  }, []);

  const subscribe = useCallback(async () => {
    setError(null);
    setState('loading');

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState('denied');
        setError('Notification permission was not granted.');
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setState('unsubscribed');
        setError('Push notifications are not configured yet.');
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      if (!res.ok) throw new Error('Failed to register subscription with server.');

      setState('subscribed');
    } catch (err: unknown) {
      setState('unsubscribed');
      setError(err instanceof Error ? err.message : 'Failed to enable notifications.');
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setError(null);
    setState('loading');

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }

      setState('unsubscribed');
    } catch (err: unknown) {
      setState('subscribed');
      setError(err instanceof Error ? err.message : 'Failed to disable notifications.');
    }
  }, []);

  return { state, error, subscribe, unsubscribe };
}
