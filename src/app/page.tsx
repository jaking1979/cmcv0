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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Sticky global nav (hamburger menu lives inside TopNav) */}
      <TopNav title="🏠 Home" />

      <main className="flex-1 flex flex-col px-3 sm:px-4 py-4 max-w-3xl mx-auto w-full min-h-0">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-md flex flex-col items-center">
            <Image
              src={logo}
              alt="CMC Sober Coach"
              width={120}
              height={120}
              className="mb-4 rounded"
              priority
            />

            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6 text-center text-wrap-anywhere">
              Welcome to CMC Sober Coach
            </h1>

            {/* Big primary button for Onboarding */}
            <Link
              href="/onboarding"
              className="
                w-full inline-flex items-center justify-center 
                rounded-lg bg-blue-600 px-6 py-3 
                text-white text-base sm:text-lg font-medium 
                shadow-sm hover:bg-blue-700 active:bg-blue-800
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                mb-6 min-h-[44px] transition-colors
              "
            >
              🚀 Start Onboarding
            </Link>

            {/* Secondary actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-6">
              <Link 
                href="/learn" 
                className="
                  bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-lg 
                  shadow-sm hover:bg-gray-200 active:bg-gray-300
                  text-center transition-colors min-h-[44px]
                  flex items-center justify-center
                "
              >
                📚 Learn Something
              </Link>
              <Link 
                href="/advice" 
                className="
                  bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-lg 
                  shadow-sm hover:bg-gray-200 active:bg-gray-300
                  text-center transition-colors min-h-[44px]
                  flex items-center justify-center
                "
              >
                💡 Get Advice
              </Link>
              <Link 
                href="/chat" 
                className="
                  bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-lg 
                  shadow-sm hover:bg-gray-200 active:bg-gray-300
                  text-center transition-colors min-h-[44px]
                  flex items-center justify-center
                "
              >
                💬 Just Chat
              </Link>
              <Link 
                href="/crisis" 
                className="
                  bg-red-100 text-red-800 font-semibold py-3 px-4 rounded-lg 
                  shadow-sm hover:bg-red-200 active:bg-red-300
                  text-center transition-colors min-h-[44px]
                  flex items-center justify-center
                "
              >
                🚨 Crisis Support
              </Link>
            </div>

            {/* Inline "Instructions" trigger */}
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="
                inline-flex items-center rounded-lg border border-gray-300 
                px-4 py-2 text-sm hover:bg-gray-50 active:bg-gray-100
                transition-colors min-h-[44px]
              "
              aria-label="Show instructions"
              title="Instructions"
            >
              ☰ Instructions
            </button>
          </div>
        </div>
      </main>

      {/* First-run modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-white rounded-lg shadow-lg max-h-[90vh] flex flex-col">
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

            <div className="px-5 py-4 space-y-4 text-sm text-gray-700 flex-1 overflow-y-auto">
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
    </div>
  )
}