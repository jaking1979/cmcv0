'use client'

/**
 * ChoiceHub
 *
 * Rendered during FIRST_RUN_CHOICE stage.
 *
 * Presents Kato's personalized greeting (using preferredName if set) and
 * three inline action cards for the user to choose their first path:
 *
 * 1. Start onboarding  — structured background gathering (scaffold for now)
 * 2. Start talking now — begin light coaching immediately
 * 3. Meet your team   — explore the coaching symphony
 */

import * as React from 'react'

const KATO_ACCENT = 'linear-gradient(135deg, #3FA89C, #2C7A72)'

interface Choice {
  id: 'onboarding' | 'talk-now' | 'team-intro'
  emoji: string
  title: string
  description: string
}

const CHOICES: Choice[] = [
  {
    id: 'onboarding',
    emoji: '📋',
    title: 'Start onboarding',
    description: 'Help Kato get to know you so coaching can be more tailored over time.',
  },
  {
    id: 'talk-now',
    emoji: '💬',
    title: 'Start talking now',
    description: 'Jump right in. Kato can give useful support even without a full background.',
  },
  {
    id: 'team-intro',
    emoji: '🎼',
    title: 'Meet your coaching team',
    description: "See who's on your team and what each coach brings to the table.",
  },
]

interface ChoiceHubProps {
  preferredName: string | null
  onChoose: (choice: 'onboarding' | 'talk-now' | 'team-intro') => void
}

export function ChoiceHub({ preferredName, onChoose }: ChoiceHubProps) {
  const greeting = preferredName
    ? `Great to meet you, ${preferredName}! Here's how we can get started:`
    : "Great — here's how we can get started:"

  return (
    <div className="flex flex-col gap-3 px-4 pb-4 pt-4 max-w-lg mx-auto w-full">
      {/* Kato greeting bubble */}
      <div className="flex justify-start items-end gap-2 slide-up">
        <div
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mb-0.5"
          style={{ background: KATO_ACCENT }}
        >
          K
        </div>
        <div
          className="max-w-[82%] px-4 py-3 text-[15px] leading-relaxed"
          style={{
            background: '#FFFFFF',
            borderRadius: '20px 20px 20px 4px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
            color: 'var(--text-primary)',
          }}
        >
          {greeting}
        </div>
      </div>

      {/* Choice cards */}
      <div className="pl-10 flex flex-col gap-2">
        {CHOICES.map((choice, idx) => (
          <button
            key={choice.id}
            onClick={() => onChoose(choice.id)}
            className="w-full text-left px-4 py-3.5 rounded-2xl transition-all slide-up"
            style={{
              background: 'white',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 2px 12px rgba(0,0,0,0.04)',
              animationDelay: `${(idx + 1) * 80}ms`,
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5 shrink-0">{choice.emoji}</span>
              <div>
                <p
                  className="text-sm font-semibold mb-0.5"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {choice.title}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {choice.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
