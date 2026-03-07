'use client'

/**
 * Advice / Chat page — refactored shell
 *
 * This page is now a thin layout wrapper. All stateful chat logic lives in
 * useChatState(), and all first-run UI lives in FirstRunFlow + sub-components.
 *
 * Removed from this file:
 * - demoScenarios / scenario picker UI
 * - scenarioId state
 * - phase / inferPhase logic
 * - postToEventsAPI / handlePlanRequest / checkForPlanCTA
 * - plan CTA UI
 * - GlobalInstructionsModal
 * - roleplay state
 */

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MessageList } from '@/components/chat/MessageList'
import { MessageComposer } from '@/components/chat/MessageComposer'
import BottomNav, { NavSpacer } from '@/components/BottomNav'
import { FirstRunFlow } from '@/components/firstRun/FirstRunFlow'
import { useChatState } from '@/hooks/useChatState'
import type { CoachId } from '@/lib/coaches/definitions'
import type { ChatMessage } from '@/components/chat/types'

// ── Helper ────────────────────────────────────────────────────────────────────

function katoGreeting(preferredName: string | null): string {
  return preferredName
    ? `Hey ${preferredName} — what would you like to work on today?`
    : "What would you like to work on today? I'm here and ready."
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdvicePage() {
  const router = useRouter()
  const {
    appStage, setAppStage,
    messages, addMessage, clearMessages,
    status, isBusy, send, error, clearError,
    memory, updateMemory, resetUser,
    activeCoach, setActiveCoach,
  } = useChatState()

  const isFirstRun = appStage !== 'LIGHT_CHAT' && appStage !== 'PERSONALIZED_CHAT'

  // Composer is active during PRE_CONSENT (coaching-vs-therapy Q&A) and LIGHT_CHAT / PERSONALIZED_CHAT.
  // It is disabled during all other first-run stages (those stages have their own inputs).
  const composerDisabled = isBusy || (isFirstRun && appStage !== 'PRE_CONSENT')

  // ── Transition: enter LIGHT_CHAT ───────────────────────────────────────
  const enterLightChat = useCallback((coachId?: CoachId) => {
    const greeting: ChatMessage = {
      id: `kato_greeting_${Date.now()}`,
      role: 'assistant',
      content: katoGreeting(memory.preferredName),
      createdAt: Date.now(),
    }
    addMessage(greeting)
    setAppStage('LIGHT_CHAT')
    if (coachId) setActiveCoach(coachId)
    updateMemory({ appStage: 'LIGHT_CHAT' })
  }, [memory.preferredName, addMessage, setAppStage, setActiveCoach, updateMemory])

  // ── First-run callbacks ────────────────────────────────────────────────

  const handleConsent = useCallback(() => {
    // Clear any pre-consent Q&A messages so the chat history starts fresh
    clearMessages()
    updateMemory({ consentAccepted: true, appStage: 'POST_CONSENT_NAME' })
    setAppStage('POST_CONSENT_NAME')
  }, [clearMessages, updateMemory, setAppStage])

  const handleNameSubmit = useCallback((name: string) => {
    updateMemory({ preferredName: name, appStage: 'FIRST_RUN_CHOICE' })
    setAppStage('FIRST_RUN_CHOICE')
  }, [updateMemory, setAppStage])

  const handleChoose = useCallback((choice: 'onboarding' | 'talk-now' | 'team-intro') => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f1961c80-78b9-4cad-bc69-e41762315ff4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'advice/page.tsx:handleChoose',message:'handleChoose called',data:{choice},hypothesisId:'H-A-H-B',runId:'post-fix',timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    updateMemory({ firstRunChoiceMade: choice })
    if (choice === 'talk-now') {
      enterLightChat()
    } else if (choice === 'team-intro') {
      updateMemory({ appStage: 'TEAM_INTRO' })
      setAppStage('TEAM_INTRO')
    } else {
      // Navigate directly to the onboarding page (already built at /onboarding)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f1961c80-78b9-4cad-bc69-e41762315ff4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'advice/page.tsx:handleChoose:onboarding-branch',message:'Navigating to /onboarding via router.push',data:{choice},hypothesisId:'H-B',runId:'post-fix',timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      updateMemory({ onboardingStarted: true })
      router.push('/onboarding')
    }
  }, [updateMemory, enterLightChat, setAppStage, router])

  const handleViewCoach = useCallback((id: CoachId) => {
    setActiveCoach(id)
    setAppStage('COACH_LENS')
  }, [setActiveCoach, setAppStage])

  const handleBackToTeam = useCallback(() => {
    setAppStage('TEAM_INTRO')
  }, [setAppStage])

  const handleStartChat = useCallback(() => {
    enterLightChat()
  }, [enterLightChat])

  // From TeamIntro / CoachLens "Start with Kato": return to choice hub
  // so the user still sees the onboarding option before entering chat.
  const handleReturnToChoices = useCallback(() => {
    setAppStage('FIRST_RUN_CHOICE')
  }, [setAppStage])

  const handleStartWithCoach = useCallback((id: CoachId) => {
    enterLightChat(id)
  }, [enterLightChat])

  // ── Composer send ──────────────────────────────────────────────────────
  const handleSend = useCallback((text: string) => {
    void send(text)
  }, [send])

  const hasMessages = messages.length > 0

  return (
    <div
      className="h-dvh flex flex-col relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* ── Gradient wash ──────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background:
            'linear-gradient(to bottom, transparent 30%, rgba(232,228,255,0.28) 65%, rgba(255,180,163,0.22) 100%)',
          opacity: isFirstRun ? 1 : 0.4,
        }}
      />

      {/* ── Header (only during active chat stages) ─────────────────────── */}
      {!isFirstRun && (
        <header
          className="relative z-10 flex-shrink-0 flex items-center h-14 px-4 max-w-lg mx-auto w-full"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center gap-2 flex-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{
                background:
                  'linear-gradient(135deg, var(--cmc-teal-500), var(--cmc-teal-700))',
              }}
            >
              K
          </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Kato
            </span>
            {memory.preferredName && (
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                · {memory.preferredName}
              </span>
            )}
          </div>

          {hasMessages && (
                <button
              type="button"
              onClick={() => clearMessages()}
              className="flex items-center justify-center w-9 h-9 rounded-full"
              style={{ color: 'var(--text-tertiary)', background: 'rgba(0,0,0,0.04)' }}
              aria-label="New conversation"
              title="New conversation"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
                </button>
          )}
        </header>
      )}

      {/* ── Main area ──────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 relative">
        {isFirstRun ? (
          /* First-run UI fills the area */
          <FirstRunFlow
            appStage={appStage}
            memory={memory}
            activeCoach={activeCoach}
            onConsent={handleConsent}
            onNameSubmit={handleNameSubmit}
            onChoose={handleChoose}
            onViewCoach={handleViewCoach}
            onBackToTeam={handleBackToTeam}
            onReturnToChoices={handleReturnToChoices}
            onStartChat={handleStartChat}
            onStartWithCoach={handleStartWithCoach}
            preConsentMessages={messages}
            isBusy={isBusy}
          />
        ) : (
          /* Normal chat UI */
          <div className="absolute inset-0 overflow-y-auto chat-messages px-4 pb-4 pt-2">
            <div className="max-w-lg mx-auto">
              <MessageList messages={messages} />
        </div>
          </div>
        )}
      </div>

      {/* ── Composer area ──────────────────────────────────────────────────── */}
      <div
        className="relative z-10 flex-shrink-0 max-w-lg mx-auto w-full"
        style={{ padding: '8px 16px 12px' }}
      >
        {/* Error banner */}
        {error && (
          <div
            className="mb-3 px-4 py-3 rounded-2xl flex items-start justify-between gap-2 slide-up"
            style={{
              background: 'rgba(254,226,226,0.9)',
              border: '1px solid rgba(252,165,165,0.5)',
            }}
          >
            <p
              className="text-sm flex-1 text-wrap-anywhere"
              style={{ color: '#991B1B' }}
            >
              {error}
            </p>
              <button
              onClick={clearError}
              className="text-xs shrink-0"
                style={{ color: '#991B1B' }}
              >
              ✕
              </button>
          </div>
        )}

        {/* Composer — disabled during non-chat first-run stages */}
        <MessageComposer
          onSend={handleSend}
          disabled={composerDisabled}
          isSending={status === 'thinking' || status === 'streaming'}
          placeholder={
            appStage === 'PRE_CONSENT'
              ? 'Ask about coaching vs. therapy…'
              : "What's on your mind?"
          }
        />

        {/* Reset — dev/founder convenience, clears all local user state */}
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => void resetUser()}
            className="text-xs font-medium px-3 py-1.5 rounded-full transition-opacity opacity-40 hover:opacity-100"
            style={{
              color: '#991B1B',
              background: 'rgba(254,226,226,0.9)',
              border: '1px solid rgba(252,165,165,0.5)',
            }}
          >
            Start over as a new user
          </button>
        </div>
      </div>

      <NavSpacer />
      <BottomNav />
    </div>
  )
}
