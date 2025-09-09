'use client'

import TopNav from '@/components/TopNav'
import { useState } from 'react'

export default function CrisisPage() {
  const [showConfirm, setShowConfirm] = useState<string | null>(null)

  function demoCall(kind: '911' | '988') {
    setShowConfirm(kind)
    alert(
      kind === '911'
        ? 'DEMO ONLY — In the real app this would start a 911 call.'
        : 'DEMO ONLY — In the real app this would start a 988 call.'
    )
  }

  return (
    <main className="min-h-screen max-w-3xl mx-auto p-6">
      <TopNav title="⚠️ Crisis Support" />

      {/* Hero / Disclaimer */}
      <section className="mt-4 rounded-lg border border-red-200 bg-red-50 p-5">
        <h1 className="text-2xl font-semibold text-red-800 mb-2">If you’re in immediate danger</h1>
        <p className="text-red-900/90 mb-4">
          CMC Sober Coach is a <strong>behavior coaching</strong> app — not medical care and not a
          substitute for a licensed mental health professional. If there’s an emergency, contact
          professional support immediately.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => demoCall('911')}
            className="w-full rounded-md bg-red-600 text-white py-3 text-base font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Call 911 (demo)
          </button>
          <button
            type="button"
            onClick={() => demoCall('988')}
            className="w-full rounded-md bg-orange-600 text-white py-3 text-base font-semibold hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            Call 988 (demo)
          </button>
        </div>
      </section>

      {/* Quick safety steps */}
      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-xl font-semibold mb-3">Quick safety steps (right now)</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-800">
          <li>Get to a <strong>safe place</strong> with other people if you can.</li>
          <li>Text or call a <strong>trusted person</strong> to let them know you need support.</li>
          <li>Remove access to substances, paraphernalia, or other risky items in the moment.</li>
          <li>Take slow breaths: in through your nose for 4, hold 4, out for 6 — repeat for 1 minute.</li>
        </ul>
      </section>

      {/* Naloxone / Overdose */}
      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-xl font-semibold mb-3">Naloxone (Narcan) — how to use</h2>
        <div className="aspect-video w-full overflow-hidden rounded-md border">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/hQG1W_yR2yY"
            title="Naloxone training (demo video)"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <p className="text-sm text-gray-600 mt-3">
          If you suspect an opioid overdose: <strong>Call 911</strong>, give naloxone if available, and
          stay with the person until help arrives.
        </p>
      </section>

      {/* More resources */}
      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-xl font-semibold mb-3">Helpful resources</h2>
        <ul className="space-y-2 text-blue-700">
          <li>
            <a className="underline" href="https://findtreatment.gov" target="_blank" rel="noreferrer">
              U.S. treatment locator (findtreatment.gov)
            </a>
          </li>
          <li>
            <a className="underline" href="https://988lifeline.org" target="_blank" rel="noreferrer">
              988 Suicide & Crisis Lifeline
            </a>
          </li>
          <li>
            <a className="underline" href="https://www.narcan.com" target="_blank" rel="noreferrer">
              Learn more about naloxone (Narcan)
            </a>
          </li>
        </ul>
      </section>

      <p className="mt-6 text-xs text-gray-500">
        This page is a demo. In production, the call buttons would open your phone dialer and location-aware
        resources would be provided.
      </p>
    </main>
  )
}
