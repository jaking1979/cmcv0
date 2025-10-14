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
    <div className="h-dvh flex flex-col" style={{ 
      background: 'linear-gradient(135deg, #F0F9FF 0%, #F0F4F8 50%, #FFF9F5 100%)'
    }}>
      {/* Sticky global nav (hamburger menu lives inside TopNav) */}
      <TopNav title="🏠 Home" />

      <main className="flex-1 flex flex-col px-3 sm:px-4 py-6 max-w-3xl mx-auto w-full min-h-0 overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-md flex flex-col items-center scale-in">
            <div className="relative mb-6">
              <div className="absolute inset-0 glow-teal-strong" style={{ borderRadius: '24px', transform: 'scale(1.1)' }} />
              <Image
                src={logo}
                alt="CMC Sober Coach"
                width={120}
                height={120}
                className="relative z-10 shadow-soft"
                style={{ borderRadius: '24px' }}
                priority
              />
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold mb-2 text-center text-wrap-anywhere" style={{ color: 'var(--text-primary)' }}>
              Welcome to CMC Sober Coach
            </h1>
            <p className="text-sm mb-8 text-center" style={{ color: 'var(--text-secondary)' }}>
              Science-based support for lasting change
            </p>

            {/* Big primary button for Onboarding */}
            <Link
              href="/onboarding"
              className="
                w-full inline-flex items-center justify-center 
                bg-gradient-to-br from-[#5ECBBC] to-[#3FA89C]
                px-6 py-4 
                text-white text-base sm:text-lg font-semibold 
                shadow-soft hover:glow-teal-strong hover:scale-105
                active:scale-95
                focus:outline-none focus:glow-teal-strong
                mb-6 min-h-[44px] transition-all duration-300
              "
              style={{ borderRadius: 'var(--radius-xl)' }}
            >
              🚀 Start Onboarding
            </Link>

            {/* Secondary actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-6">
              <Link 
                href="/learn" 
                className="
                  glass-medium shadow-soft border border-gray-200/30
                  font-semibold py-4 px-5
                  text-center transition-all duration-300 min-h-[44px]
                  flex items-center justify-center gap-2
                  hover:glass-strong hover:glow-lavender hover:scale-105
                  active:scale-95
                "
                style={{ 
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--text-primary)'
                }}
              >
                <span>📚</span>
                <span>Learn Something</span>
              </Link>
              <Link 
                href="/advice" 
                className="
                  glass-medium shadow-soft border border-gray-200/30
                  font-semibold py-4 px-5
                  text-center transition-all duration-300 min-h-[44px]
                  flex items-center justify-center gap-2
                  hover:glass-strong hover:glow-teal hover:scale-105
                  active:scale-95
                "
                style={{ 
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--text-primary)'
                }}
              >
                <span>💡</span>
                <span>Get Advice</span>
              </Link>
              <Link 
                href="/chat" 
                className="
                  glass-medium shadow-soft border border-gray-200/30
                  font-semibold py-4 px-5
                  text-center transition-all duration-300 min-h-[44px]
                  flex items-center justify-center gap-2
                  hover:glass-strong hover:glow-lavender hover:scale-105
                  active:scale-95
                "
                style={{ 
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--text-primary)'
                }}
              >
                <span>💬</span>
                <span>Just Chat</span>
              </Link>
              <Link 
                href="/crisis" 
                className="
                  glass-medium shadow-soft border-2
                  font-semibold py-4 px-5
                  text-center transition-all duration-300 min-h-[44px]
                  flex items-center justify-center gap-2
                  hover:glass-strong hover:scale-105
                  active:scale-95
                "
                style={{ 
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, #FFE5E5 0%, #FFD4D4 100%)',
                  color: '#B91C1C',
                  borderColor: 'rgba(185, 28, 28, 0.2)'
                }}
              >
                <span>🚨</span>
                <span>Crisis Support</span>
              </Link>
            </div>

            {/* Inline "Instructions" trigger */}
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="
                inline-flex items-center glass-light border border-gray-200/50
                px-4 py-2 text-sm hover:glass-medium hover:glow-teal
                transition-all duration-300 min-h-[44px]
              "
              style={{ 
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)'
              }}
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
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 overflow-y-auto fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg glass-strong shadow-medium border border-gray-200/30 max-h-[90vh] flex flex-col scale-in" style={{ borderRadius: 'var(--radius-2xl)' }}>
            <div className="border-b border-gray-200/30 px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Welcome to CMC Sober Coach</h2>
              <button
                onClick={() => setShowModal(false)}
                className="glass-light border border-gray-200/50 px-2 py-1 text-sm hover:glass-medium hover:glow-teal transition-all duration-300"
                style={{ borderRadius: 'var(--radius-md)' }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 text-sm flex-1 overflow-y-auto" style={{ color: 'var(--text-secondary)' }}>
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

            <div className="border-t border-gray-200/30 px-5 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="glass-light border border-gray-200/50 px-4 py-2 text-sm hover:glass-medium hover:glow-teal transition-all duration-300"
                style={{ 
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)'
                }}
              >
                Got it
              </button>
              <Link
                href="/onboarding"
                className="bg-gradient-to-br from-[#5ECBBC] to-[#3FA89C] px-4 py-2 text-sm text-white font-semibold hover:glow-teal-strong hover:scale-105 active:scale-95 transition-all duration-300"
                style={{ borderRadius: 'var(--radius-md)' }}
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