// src/app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import TopNav from '@/components/TopNav'
import logo from '../assets/logo.png'

export default function Home() {
  const [showModal, setShowModal] = useState(true)

  // If you prefer to only show once per session, uncomment below:
  // useEffect(() => {
  //   const seen = sessionStorage.getItem('homeSeen')
  //   if (!seen) {
  //     setShowModal(true)
  //     sessionStorage.setItem('homeSeen', '1')
  //   } else {
  //     setShowModal(false)
  //   }
  // }, [])

  return (
    <>
      {/* Sticky global nav (hamburger menu lives inside TopNav) */}
      <TopNav title="🏠 Home" />

      <main className="min-h-screen bg-gray-50 px-4">
        <div className="max-w-3xl mx-auto py-8 flex flex-col items-center">
          <Image
            src={logo}
            alt="CMC Sober Coach"
            width={140}
            height={140}
            className="mb-4 rounded"
            priority
          />

          <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Welcome to CMC Sober Coach
          </h1>

          {/* Big primary button for Onboarding */}
          <Link
            href="/onboarding"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-white text-lg font-medium shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mb-6"
          >
            🚀 Start Onboarding
          </Link>

          {/* Secondary actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <Link href="/learn" className="button-primary">📚 Learn Something</Link>
            <Link href="/advice" className="button-primary">💡 Get Advice</Link>
            <Link href="/chat" className="button-primary">💬 Just Chat</Link>
            <Link href="/crisis" className="button-primary">🚨 Crisis Support</Link>
          </div>

          {/* Inline “Instructions” trigger */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="mt-6 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            aria-label="Show instructions"
            title="Instructions"
          >
            ☰ Instructions
          </button>
        </div>
      </main>

      {/* First-run modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-white rounded-lg shadow-lg">
            <div className="border-b px-5 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Welcome to CMC Sober Coach (Demo)</h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 text-sm text-gray-700">
              <p>
                This is a demo version of the CMC Sober Coach app. It’s a behavior coaching
                tool, not a medical device or a mental health service. In an emergency, contact
                professional support immediately (911 in the U.S.; 988 for suicidal crisis).
              </p>

              <div className="space-y-2">
                <h3 className="font-medium">What you can explore here:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Onboarding</strong>: a conversational intake that infers your stage
                    of change and areas to focus on, ending with a summary report.
                  </li>
                  <li>
                    <strong>Learn</strong>: short, skills-focused lessons aligned to your goals.
                  </li>
                  <li>
                    <strong>Get Advice</strong>: a motivational-interviewing style chat that
                    gathers context and offers behavioral options when appropriate.
                  </li>
                  <li>
                    <strong>Just Chat</strong>: a lightweight space to talk things through.
                  </li>
                  <li>
                    <strong>Crisis Support</strong>: immediate safety info and resources (demo).
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">How to test the demo:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Click <em>Start Onboarding</em> and speak as a user changing substance use.</li>
                  <li>
                    If the assistant offers a summary too early, say “Not yet—keep going,” and
                    continue the conversation.
                  </li>
                  <li>
                    When ready, press the <em>Finish &amp; Generate Report</em> button on the
                    onboarding page to see a formatted summary.
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t px-5 py-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
              >
                Got it
              </button>
              <Link
                href="/onboarding"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Start Onboarding
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}