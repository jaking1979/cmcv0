'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

// Chrome/Android deferred install event type
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Platform = 'ios' | 'android' | 'other';

const STORAGE_KEY = 'cmc-install-prompt-dismissed';

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream)
    return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'other';
}

function isAlreadyInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// ─── Step Row ────────────────────────────────────────────────────────────────
function Step({
  number,
  children,
}: {
  number: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
        style={{ background: 'var(--cmc-teal-600)' }}
      >
        {number}
      </span>
      <p className="text-sm leading-snug pt-0.5" style={{ color: 'var(--text-secondary)' }}>
        {children}
      </p>
    </div>
  );
}

// ─── iOS Instructions ─────────────────────────────────────────────────────────
function IOSSteps() {
  return (
    <div className="space-y-4">
      <Step number={1}>
        Open this page in <strong>Safari</strong> (not Chrome or Firefox — iOS only supports PWA
        install from Safari).
      </Step>
      <Step number={2}>
        Tap the{' '}
        <strong>Share button</strong>{' '}
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded align-middle text-white text-xs"
          style={{ background: 'var(--cmc-teal-600)', verticalAlign: 'middle' }}
        >
          ↑
        </span>{' '}
        at the bottom of the screen.
      </Step>
      <Step number={3}>
        Scroll down and tap <strong>"Add to Home Screen"</strong>.
      </Step>
      <Step number={4}>
        Tap <strong>"Add"</strong> in the top-right corner.
      </Step>
    </div>
  );
}

// ─── Android Instructions ─────────────────────────────────────────────────────
function AndroidSteps({ onInstall }: { onInstall: () => void }) {
  return (
    <div className="space-y-4">
      <Step number={1}>
        Tap the button below — your browser will ask if you want to install the app.
      </Step>
      <button
        onClick={onInstall}
        className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-opacity active:opacity-80"
        style={{ background: 'linear-gradient(135deg, var(--cmc-teal-600), var(--cmc-teal-700))' }}
      >
        Install App
      </button>
      <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
        Or: tap the <strong>⋮</strong> menu → <strong>"Add to Home screen"</strong>
      </p>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export function InstallPromptModal() {
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [platform, setPlatform] = useState<Platform>('other');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Capture Android install event before we show the modal
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Decide whether to show
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f1961c80-78b9-4cad-bc69-e41762315ff4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InstallPromptModal.tsx:useEffect',message:'Install modal platform detection',data:{ua:navigator.userAgent,alreadyInstalled:isAlreadyInstalled(),dismissed:!!(sessionStorage.getItem(STORAGE_KEY)||localStorage.getItem(STORAGE_KEY)),platform:detectPlatform()},hypothesisId:'H-C',timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (isAlreadyInstalled()) return;
    if (sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY)) return;

    const detected = detectPlatform();
    setPlatform(detected);

    // Only show on mobile platforms
    if (detected === 'other') return;

    // Small delay so the page loads before the modal appears
    const timer = setTimeout(() => {
      setVisible(true);
      requestAnimationFrame(() => setAnimateIn(true));
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  function dismiss(permanent = true) {
    setAnimateIn(false);
    setTimeout(() => setVisible(false), 350);
    if (permanent) {
      localStorage.setItem(STORAGE_KEY, '1');
    } else {
      sessionStorage.setItem(STORAGE_KEY, '1');
    }
  }

  async function handleAndroidInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      dismiss(true);
    }
  }

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => dismiss(false)}
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background: 'rgba(26, 35, 50, 0.45)',
          opacity: animateIn ? 1 : 0,
        }}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add to Home Screen"
        className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-350"
        style={{
          transform: animateIn ? 'translateY(0)' : 'translateY(100%)',
          transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div
          className="w-full max-w-lg mx-auto rounded-t-3xl px-6 pt-5 pb-8"
          style={{
            background: 'var(--bg-elevated)',
            boxShadow: '0 -8px 40px rgba(26, 35, 50, 0.14)',
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center mb-5">
            <div
              className="w-10 h-1 rounded-full"
              style={{ background: 'rgba(0,0,0,0.12)' }}
            />
          </div>

          {/* App identity */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <Image
                src="/icons/icon-192.png"
                alt="CMC Sober Coach"
                width={56}
                height={56}
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                Add to Your Home Screen
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                CMC Sober Coach · Works offline
              </p>
            </div>
          </div>

          {/* What you get */}
          <div
            className="flex gap-4 mb-6 p-3 rounded-2xl"
            style={{ background: 'var(--bg-secondary)' }}
          >
            {[
              { icon: '⚡', label: 'Instant access' },
              { icon: '📵', label: 'Works offline' },
              { icon: '🔔', label: 'Check-in reminders' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-lg">{icon}</span>
                <span className="text-[10px] font-medium text-center leading-tight" style={{ color: 'var(--text-secondary)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Platform-specific steps */}
          <div className="mb-6">
            {platform === 'ios' && <IOSSteps />}
            {platform === 'android' && (
              <AndroidSteps onInstall={handleAndroidInstall} />
            )}
          </div>

          {/* Dismiss */}
          <button
            onClick={() => dismiss(true)}
            className="w-full text-sm py-2 font-medium"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </>
  );
}
