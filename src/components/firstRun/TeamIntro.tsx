'use client'

/**
 * TeamIntro
 *
 * Rendered during TEAM_INTRO stage.
 *
 * Introduces the coaching symphony — Kato and the three supporting coaches.
 * Each coach gets a card with their name, role, and short description.
 * Tapping a card opens the CoachLens view.
 *
 * A "Start chatting with Kato" button at the bottom transitions to LIGHT_CHAT.
 *
 * Design rule: Supporting coaches are introduced here but remain in the
 * background during actual coaching. They surface only when especially relevant
 * or when the user asks to hear from a specific lens.
 */

import * as React from 'react'
import type { CoachDefinition, CoachId } from '@/lib/coaches/definitions'
import { COACH_LIST } from '@/lib/coaches/definitions'

const KATO_ACCENT = 'linear-gradient(135deg, #3FA89C, #2C7A72)'

interface TeamIntroProps {
  onViewCoach: (id: CoachId) => void
  onStartChat: () => void
}

function CoachCard({
  coach,
  onView,
  delay = 0,
}: {
  coach: CoachDefinition
  onView: () => void
  delay?: number
}) {
  const isKato = coach.id === 'kato'

  return (
    <button
      onClick={onView}
      className="w-full text-left px-4 py-4 rounded-2xl transition-all slide-up"
      style={{
        background: 'white',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        animationDelay: `${delay}ms`,
        borderLeft: `3px solid ${coach.accentColor}`,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5"
          style={{ background: coach.accentColor }}
        >
          {coach.avatar}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {coach.name}
            </p>
            {isKato && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(63,168,156,0.12)', color: '#2C7A72' }}
              >
                Primary Voice
              </span>
            )}
          </div>
          <p className="text-[11px] font-medium mb-1.5" style={{ color: coach.accentColor }}>
            {coach.role}
          </p>
          <p className="text-[13px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            {coach.shortDescription}
          </p>
          <p
            className="text-[11px] mt-1.5 font-medium"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Tap to learn more →
          </p>
        </div>
      </div>
    </button>
  )
}

export function TeamIntro({ onViewCoach, onStartChat }: TeamIntroProps) {
  return (
    <div className="flex flex-col gap-3 px-4 pb-6 pt-4 max-w-lg mx-auto w-full">
      {/* Kato intro bubble */}
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
          Here's your coaching team. I'm the primary voice — the other coaches bring specific
          lenses that I draw from when they're especially relevant. Tap any coach to learn more.
        </div>
      </div>

      {/* Coach cards */}
      <div className="flex flex-col gap-2 mt-1">
        {COACH_LIST.map((coach, idx) => (
          <CoachCard
            key={coach.id}
            coach={coach}
            onView={() => onViewCoach(coach.id)}
            delay={(idx + 1) * 80}
          />
        ))}
      </div>

      {/* Start chatting CTA */}
      <div className="mt-2 slide-up" style={{ animationDelay: '480ms' }}>
        <button
          onClick={onStartChat}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all"
          style={{
            background: KATO_ACCENT,
            boxShadow: '0 4px 16px rgba(63,168,156,0.3)',
          }}
        >
          Start chatting with Kato →
        </button>
      </div>
    </div>
  )
}
