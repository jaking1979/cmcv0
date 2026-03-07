'use client'

/**
 * CoachLens
 *
 * Rendered during COACH_LENS stage.
 *
 * Shows a detailed view of one coach's perspective:
 * - What they focus on
 * - How they help
 * - How they differ from the others
 *
 * Navigation:
 * - "← Back" returns to TeamIntro (TEAM_INTRO stage)
 * - "Start with this lens" sets the active coach and enters LIGHT_CHAT
 *   (Kato remains primary; the selected coach's perspective is surfaced
 *    more readily during that session)
 */

import * as React from 'react'
import type { CoachId } from '@/lib/coaches/definitions'
import { getCoach, COACH_LIST } from '@/lib/coaches/definitions'

const KATO_ACCENT = 'linear-gradient(135deg, #3FA89C, #2C7A72)'

interface CoachLensProps {
  coachId: CoachId
  onBack: () => void
  onStartWithCoach: (id: CoachId) => void
  onStartWithKato: () => void
}

export function CoachLens({ coachId, onBack, onStartWithCoach, onStartWithKato }: CoachLensProps) {
  const coach = getCoach(coachId)
  const isKato = coachId === 'kato'

  // Other coaches for "explore another lens" strip
  const others = COACH_LIST.filter(c => c.id !== coachId)

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-4 max-w-lg mx-auto w-full slide-up">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium self-start"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to team
      </button>

      {/* Coach header card */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          borderTop: `4px solid ${coach.accentColor}`,
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
            style={{ background: coach.accentColor }}
          >
            {coach.avatar}
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              {coach.name}
            </h2>
            <p className="text-sm font-medium" style={{ color: coach.accentColor }}>
              {coach.role}
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed mb-1" style={{ color: 'var(--text-secondary)' }}>
          {coach.shortDescription}
        </p>

        <p
          className="text-[11px] font-semibold uppercase tracking-wider mt-3 mb-0.5"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Foundation
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {coach.modality}
        </p>
      </div>

      {/* Detail sections */}
      {[
        { label: 'What they focus on', content: coach.whatTheyFocusOn },
        { label: 'How they help', content: coach.howTheyHelp },
        { label: 'What makes them distinct', content: coach.howTheyDiffer },
      ].map(({ label, content }) => (
        <div
          key={label}
          className="rounded-2xl p-4"
          style={{
            background: 'white',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          <p
            className="text-[11px] font-bold uppercase tracking-wider mb-2"
            style={{ color: coach.accentColor }}
          >
            {label}
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {content}
          </p>
        </div>
      ))}

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-1">
        {!isKato && (
          <button
            onClick={() => onStartWithCoach(coachId)}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white"
            style={{ background: coach.accentColor, boxShadow: `0 4px 16px ${coach.accentColor}40` }}
          >
            Start with this lens active
          </button>
        )}
        <button
          onClick={onStartWithKato}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white"
          style={{ background: KATO_ACCENT }}
        >
          {isKato ? 'Start chatting with Kato →' : 'Start with Kato (default)'}
        </button>
      </div>

      {/* Explore other coaches */}
      {others.length > 0 && (
        <div className="mt-2">
          <p
            className="text-[11px] font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Explore another coach
          </p>
          <div className="flex gap-2 flex-wrap">
            {others.map(c => (
              <button
                key={c.id}
                onClick={onBack}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: `${c.accentColor}18`,
                  color: c.accentColor,
                  border: `1px solid ${c.accentColor}30`,
                }}
              >
                <span
                  className="w-4 h-4 rounded-full inline-flex items-center justify-center text-white text-[9px] font-bold"
                  style={{ background: c.accentColor }}
                >
                  {c.avatar}
                </span>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
