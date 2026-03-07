'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import TopNav from '@/components/TopNav'
import BottomNav, { NavSpacer } from '@/components/BottomNav'

function FeatureCard({
  href,
  emoji,
  title,
  description,
}: {
  href: string
  emoji: string
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 active:scale-98"
      style={{
        background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)',
      }}
    >
      <div
        className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
        style={{ background: 'var(--bg-primary)' }}
      >
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-wrap-anywhere" style={{ color: 'var(--text-primary)' }}>
          {title}
        </p>
        <p className="text-xs mt-0.5 text-wrap-anywhere" style={{ color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          {description}
        </p>
      </div>
      <svg
        className="shrink-0"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-bold uppercase tracking-widest px-1 mb-3"
      style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}
    >
      {children}
    </p>
  )
}

export default function ProfilePage() {
  useEffect(() => {
    document.title = 'Profile — CMC Sober Coach'
  }, [])

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: 'var(--bg-primary)' }}
    >
      <TopNav title="Profile" />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">

        {/* Avatar / greeting */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl text-white font-bold shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--cmc-teal-400), var(--cmc-teal-700))',
            }}
          >
            👤
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Your Space
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
              CMC Sober Coach · Science-based support
            </p>
          </div>
        </div>

        {/* Features section */}
        <div className="mb-6">
          <SectionLabel>Features</SectionLabel>
          <div className="space-y-2">
            <FeatureCard
              href="/onboarding"
              emoji="🌱"
              title="Onboarding"
              description="Personalized intake to understand your situation and goals"
            />
            <FeatureCard
              href="/learn"
              emoji="📚"
              title="Learn"
              description="Short, skills-focused lessons aligned to your recovery goals"
            />
            <FeatureCard
              href="/plan"
              emoji="📋"
              title="My Action Plan"
              description="Personalized strategies based on your conversations"
            />
          </div>
        </div>

        {/* Safety section */}
        <div className="mb-6">
          <SectionLabel>Safety</SectionLabel>
          <div className="space-y-2">
            <FeatureCard
              href="/crisis"
              emoji="🆘"
              title="Crisis Support"
              description="Immediate resources if you need urgent help right now"
            />
          </div>
        </div>

        {/* About section */}
        <div className="mb-6">
          <SectionLabel>About</SectionLabel>
          <div
            className="p-4 rounded-2xl space-y-3"
            style={{
              background: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                CMC Sober Coach
              </p>
              <p
                className="text-xs leading-relaxed text-wrap-anywhere"
                style={{ color: 'var(--text-secondary)' }}
              >
                A compassionate, evidence-based behavior coaching tool using the Community Reinforcement Approach (CRA) and Motivational Interviewing techniques to support lasting change.
              </p>
            </div>
            <div
              className="pt-3"
              style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
            >
              <p
                className="text-[11px] leading-relaxed text-wrap-anywhere"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <strong className="font-semibold">Disclaimer:</strong> This is a behavior coaching tool, not a medical device or mental health service. In an emergency, call 911. For suicidal crisis, call or text 988 (24/7).
              </p>
            </div>
          </div>
        </div>

        {/* Version */}
        <p className="text-center text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          Demo version · No data is persisted
        </p>
      </main>

      <NavSpacer />
      <BottomNav />
    </div>
  )
}
