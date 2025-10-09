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
    <div className="min-h-screen bg-white flex flex-col">
      <TopNav title="⚠️ Crisis Support" />

      <main className="flex-1 flex flex-col px-3 sm:px-4 py-4 max-w-3xl mx-auto w-full min-h-0">
        <div className="flex-1 overflow-y-auto">
          {/* Hero / Disclaimer */}
          <section className="rounded-lg border border-red-200 bg-red-50 p-4 sm:p-5 mb-4">
            <h1 className="text-xl sm:text-2xl font-semibold text-red-800 mb-2 text-wrap-anywhere">
              If you're in immediate danger
            </h1>
            <p className="text-red-900/90 mb-4 text-sm sm:text-base leading-relaxed text-wrap-anywhere">
              CMC Sober Coach is a <strong>behavior coaching</strong> app — not medical care and not a
              substitute for a licensed mental health professional. If there's an emergency, contact
              professional support immediately.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => demoCall('911')}
                className="
                  w-full rounded-lg bg-red-600 text-white py-3 px-4
                  text-sm sm:text-base font-semibold 
                  hover:bg-red-700 active:bg-red-800
                  focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                  min-h-[44px] transition-colors
                "
              >
                Call 911 (demo)
              </button>
              <button
                type="button"
                onClick={() => demoCall('988')}
                className="
                  w-full rounded-lg bg-orange-600 text-white py-3 px-4
                  text-sm sm:text-base font-semibold 
                  hover:bg-orange-700 active:bg-orange-800
                  focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                  min-h-[44px] transition-colors
                "
              >
                Call 988 (demo)
              </button>
            </div>
          </section>

          {/* Quick safety steps */}
          <section className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 text-wrap-anywhere">
              Quick safety steps (right now)
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-800 text-sm sm:text-base">
              <li className="text-wrap-anywhere">Get to a <strong>safe place</strong> with other people if you can.</li>
              <li className="text-wrap-anywhere">Text or call a <strong>trusted person</strong> to let them know you need support.</li>
              <li className="text-wrap-anywhere">Remove access to substances, paraphernalia, or other risky items in the moment.</li>
              <li className="text-wrap-anywhere">Take slow breaths: in through your nose for 4, hold 4, out for 6 — repeat for 1 minute.</li>
            </ul>
          </section>

          {/* Naloxone / Overdose */}
          <section className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 text-wrap-anywhere">
              Naloxone (Narcan) — how to use
            </h2>
            <div className="aspect-video w-full overflow-hidden rounded-md border mb-3">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/hQG1W_yR2yY"
                title="Naloxone training (demo video)"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <p className="text-xs sm:text-sm text-gray-600 text-wrap-anywhere">
              If you suspect an opioid overdose: <strong>Call 911</strong>, give naloxone if available, and
              stay with the person until help arrives.
            </p>
          </section>

          {/* More resources */}
          <section className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 text-wrap-anywhere">
              Helpful resources
            </h2>
            <ul className="space-y-2 text-blue-700 text-sm sm:text-base">
              <li>
                <a 
                  className="underline hover:text-blue-800 text-wrap-anywhere" 
                  href="https://findtreatment.gov" 
                  target="_blank" 
                  rel="noreferrer"
                >
                  U.S. treatment locator (findtreatment.gov)
                </a>
              </li>
              <li>
                <a 
                  className="underline hover:text-blue-800 text-wrap-anywhere" 
                  href="https://988lifeline.org" 
                  target="_blank" 
                  rel="noreferrer"
                >
                  988 Suicide & Crisis Lifeline
                </a>
              </li>
              <li>
                <a 
                  className="underline hover:text-blue-800 text-wrap-anywhere" 
                  href="https://www.narcan.com" 
                  target="_blank" 
                  rel="noreferrer"
                >
                  Learn more about naloxone (Narcan)
                </a>
              </li>
            </ul>
          </section>

          <p className="text-xs text-gray-500 text-wrap-anywhere pb-4">
            This page is a demo. In production, the call buttons would open your phone dialer and location-aware
            resources would be provided.
          </p>
        </div>
      </main>
    </div>
  )
}
