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
 *   ONBOARDING        → null (inline chat takes over on /advice; see advice/page.tsx)
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
  /** Return to the FIRST_RUN_CHOICE hub (from TeamIntro or CoachLens "Start with Kato") */
  onReturnToChoices: () => void
  /** Enter LIGHT_CHAT directly — used when the user picks a specific coach lens */
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
  onReturnToChoices,
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

      {/* ONBOARDING stage redirects to /onboarding via useEffect above */}

      {appStage === 'TEAM_INTRO' && (
        <TeamIntro
          onViewCoach={onViewCoach}
          onStartChat={onReturnToChoices}
        />
      )}

      {appStage === 'COACH_LENS' && activeCoach && (
        <CoachLens
          coachId={activeCoach}
          onBack={onBackToTeam}
          onStartWithCoach={onStartWithCoach}
          onStartWithKato={onReturnToChoices}
        />
      )}
    </div>
  )
}
