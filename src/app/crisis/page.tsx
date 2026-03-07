'use client'

import { useEffect, useState } from 'react'
import TopNav from '@/components/TopNav'
import BottomNav, { NavSpacer } from '@/components/BottomNav'

export default function CrisisPage() {
  const [showConfirm, setShowConfirm] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Crisis Support — CMC Sober Coach'
  }, [])

  function demoCall(kind: '911' | '988') {
    setShowConfirm(kind)
    alert(
      kind === '911'
        ? 'DEMO ONLY — In the real app this would start a 911 call.'
        : 'DEMO ONLY — In the real app this would start a 988 call.'
    )
  }

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: 'var(--bg-primary)' }}
    >
      <TopNav title="Crisis Support" />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">

        {/* Emergency hero card */}
        <div
          className="rounded-3xl p-5 mb-4"
          style={{
            background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
            border: '1.5px solid rgba(252,165,165,0.4)',
          }}
        >
          <h1 className="text-lg font-semibold mb-2 text-wrap-anywhere" style={{ color: '#991B1B' }}>
            If you're in immediate danger
          </h1>
          <p className="text-sm mb-4 leading-relaxed text-wrap-anywhere" style={{ color: '#7F1D1D' }}>
            CMC Sober Coach is a <strong>behavior coaching</strong> app — not medical care and not a
            substitute for a licensed mental health professional. If there's an emergency, contact
            professional support immediately.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => demoCall('911')}
              className="w-full rounded-2xl py-3.5 text-sm font-bold text-white min-h-[52px] transition-all active:scale-95"
              style={{ background: '#DC2626' }}
            >
              Call 911
              <span className="block text-[10px] font-normal opacity-75 mt-0.5">(DEMO)</span>
            </button>
            <button
              type="button"
              onClick={() => demoCall('988')}
              className="w-full rounded-2xl py-3.5 text-sm font-bold text-white min-h-[52px] transition-all active:scale-95"
              style={{ background: '#EA580C' }}
            >
              Call 988
              <span className="block text-[10px] font-normal opacity-75 mt-0.5">(DEMO)</span>
            </button>
          </div>
        </div>

        {/* Quick safety steps */}
        <div
          className="rounded-3xl p-5 mb-4"
          style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)' }}
        >
          <h2 className="text-base font-semibold mb-3 text-wrap-anywhere" style={{ color: 'var(--text-primary)' }}>
            Quick safety steps
          </h2>
          <ul className="space-y-3">
            {[
              'Get to a safe place with other people if you can.',
              'Text or call a trusted person to let them know you need support.',
              'Remove access to substances, paraphernalia, or other risky items.',
              'Breathe: in through nose for 4, hold 4, out for 6 — repeat for 1 minute.',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold mt-0.5"
                  style={{ background: 'linear-gradient(135deg, var(--cmc-teal-500), var(--cmc-teal-700))' }}
                >
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-wrap-anywhere" style={{ color: 'var(--text-secondary)' }}>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Naloxone */}
        <div
          className="rounded-3xl p-5 mb-4 overflow-hidden"
          style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)' }}
        >
          <h2 className="text-base font-semibold mb-3 text-wrap-anywhere" style={{ color: 'var(--text-primary)' }}>
            Naloxone (Narcan) — how to use
          </h2>
          <div className="aspect-video w-full overflow-hidden rounded-2xl mb-3 bg-gray-100">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/hQG1W_yR2yY"
              title="Naloxone training (demo video)"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <p className="text-xs leading-relaxed text-wrap-anywhere" style={{ color: 'var(--text-tertiary)' }}>
            If you suspect an opioid overdose: <strong className="font-semibold">Call 911</strong>, give naloxone if available, and
            stay with the person until help arrives.
          </p>
        </div>

        {/* Resources */}
        <div
          className="rounded-3xl p-5 mb-4"
          style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)' }}
        >
          <h2 className="text-base font-semibold mb-3 text-wrap-anywhere" style={{ color: 'var(--text-primary)' }}>
            Helpful resources
          </h2>
          <div className="space-y-3">
            {[
              { href: 'https://findtreatment.gov', label: 'U.S. treatment locator', sub: 'findtreatment.gov' },
              { href: 'https://988lifeline.org', label: '988 Suicide & Crisis Lifeline', sub: '988lifeline.org' },
              { href: 'https://www.narcan.com', label: 'Learn more about naloxone', sub: 'narcan.com' },
            ].map(({ href, label, sub }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 transition-colors"
                style={{ color: 'var(--cmc-teal-600)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-wrap-anywhere">{label}</p>
                  <p className="text-[11px] text-wrap-anywhere" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-center pb-2 text-wrap-anywhere" style={{ color: 'var(--text-tertiary)' }}>
          Demo version — call buttons are not functional.
        </p>
      </main>

      <NavSpacer />
      <BottomNav />
    </div>
  )
}
