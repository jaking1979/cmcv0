'use client'

/**
 * FirstRunFlow
 *
 * Orchestrator component that renders the correct first-run sub-component
 * based on the current AppStage.
 *
 * Stage → Component mapping:
 *   PRE_CONSENT       → ConsentGate  (intro bubbles + consent button)
 *   POST_CONSENT_NAME → NameCapture  (preferred name input)
 *   FIRST_RUN_CHOICE  → ChoiceHub   (3 inline path cards)
 *   ONBOARDING        → OnboardingEntry (scaffold placeholder)
 *   TEAM_INTRO        → TeamIntro   (coaching symphony cards)
 *   COACH_LENS        → CoachLens   (single-coach detail + return)
 *   LIGHT_CHAT        → null        (normal chat takes over)
 *   PERSONALIZED_CHAT → null        (normal chat takes over)
 *
 * During first-run stages, this component fills the main scrollable area
 * of the page. During LIGHT_CHAT / PERSONALIZED_CHAT, it returns null so
 * the normal MessageList + composer flow takes over.
 */

import * as React from 'react'
import type { AppStage } from '@/lib/appState'
import type { CoachId } from '@/lib/coaches/definitions'
import type { ChatMessage } from '@/components/chat/types'
import type { UserMemory } from '@/lib/memory/types'

import { ConsentGate } from './ConsentGate'
import { NameCapture } from './NameCapture'
import { ChoiceHub } from './ChoiceHub'
import { TeamIntro } from './TeamIntro'
import { CoachLens } from './CoachLens'

const KATO_ACCENT = 'linear-gradient(135deg, #3FA89C, #2C7A72)'

// ── Onboarding Entry (scaffold) ──────────────────────────────────────────────

function OnboardingEntry({
  preferredName,
  onSkip,
}: {
  preferredName: string | null
  onSkip: () => void
}) {
  const nameStr = preferredName ? `, ${preferredName}` : ''
  return (
    <div className="flex flex-col gap-3 px-4 pb-6 pt-4 max-w-lg mx-auto w-full">
      {/* Kato bubble */}
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
          I'd love to learn more about you{nameStr} so I can give you the most tailored coaching
          possible. The onboarding process is coming soon — I'll be adding questions to help
          understand your goals, patterns, and what's worked (or hasn't) for you before.
        </div>
      </div>

      {/* Scaffold notice */}
      <div
        className="ml-10 px-4 py-3 rounded-2xl text-[13px] leading-relaxed slide-up"
        style={{
          background: 'rgba(63,168,156,0.08)',
          border: '1px dashed rgba(63,168,156,0.4)',
          color: 'var(--text-secondary)',
          animationDelay: '120ms',
        }}
      >
        <strong style={{ color: '#2C7A72' }}>Coming soon:</strong> A structured intake to
        understand your goals, substances or behaviors you want to change, motivations, barriers,
        strengths, and preferred coaching style. This will make Kato much more tailored over time.
      </div>

      {/* Skip to chat CTA */}
      <div className="ml-10 mt-1 slide-up" style={{ animationDelay: '240ms' }}>
        <button
          onClick={onSkip}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white"
          style={{ background: KATO_ACCENT, boxShadow: '0 4px 16px rgba(63,168,156,0.3)' }}
        >
          Start talking now →
        </button>
      </div>
    </div>
  )
}

// ── Props ────────────────────────────────────────────────────────────────────

export interface FirstRunFlowProps {
  appStage: AppStage
  memory: UserMemory
  activeCoach: CoachId | null

  // Transition callbacks — all managed by useChatState / page.tsx
  onConsent: () => void
  onNameSubmit: (name: string) => void
  onChoose: (choice: 'onboarding' | 'talk-now' | 'team-intro') => void
  onViewCoach: (id: CoachId) => void
  onBackToTeam: () => void
  onStartChat: () => void
  onStartWithCoach: (id: CoachId) => void

  // For ConsentGate — the pre-consent Q&A messages
  preConsentMessages: ChatMessage[]
  isBusy: boolean
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export function FirstRunFlow({
  appStage,
  memory,
  activeCoach,
  onConsent,
  onNameSubmit,
  onChoose,
  onViewCoach,
  onBackToTeam,
  onStartChat,
  onStartWithCoach,
  preConsentMessages,
  isBusy,
}: FirstRunFlowProps) {
  const scrollRef = React.useRef<HTMLDivElement | null>(null)

  // Scroll to bottom when stage changes
  React.useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [appStage])

  // Stages that use the normal chat flow — render nothing here
  if (appStage === 'LIGHT_CHAT' || appStage === 'PERSONALIZED_CHAT') return null

  return (
    <div
      ref={scrollRef}
      className="absolute inset-0 overflow-y-auto overscroll-contain"
    >
      {appStage === 'PRE_CONSENT' && (
        <ConsentGate
          messages={preConsentMessages}
          onConsent={onConsent}
          isBusy={isBusy}
        />
      )}

      {appStage === 'POST_CONSENT_NAME' && (
        <NameCapture onNameSubmit={onNameSubmit} />
      )}

      {appStage === 'FIRST_RUN_CHOICE' && (
        <ChoiceHub
          preferredName={memory.preferredName}
          onChoose={onChoose}
        />
      )}

      {appStage === 'ONBOARDING' && (
        <OnboardingEntry
          preferredName={memory.preferredName}
          onSkip={onStartChat}
        />
      )}

      {appStage === 'TEAM_INTRO' && (
        <TeamIntro
          onViewCoach={onViewCoach}
          onStartChat={onStartChat}
        />
      )}

      {appStage === 'COACH_LENS' && activeCoach && (
        <CoachLens
          coachId={activeCoach}
          onBack={onBackToTeam}
          onStartWithCoach={onStartWithCoach}
          onStartWithKato={onStartChat}
        />
      )}
    </div>
  )
}
