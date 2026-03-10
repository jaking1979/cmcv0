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

import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageList } from '@/components/chat/MessageList'
import { MessageComposer } from '@/components/chat/MessageComposer'
import BottomNav, { NavSpacer } from '@/components/BottomNav'
import { FirstRunFlow } from '@/components/firstRun/FirstRunFlow'
import { useChatState } from '@/hooks/useChatState'
import { useVisualViewport } from '@/hooks/useVisualViewport'
import type { CoachId } from '@/lib/coaches/definitions'
import type { ChatMessage } from '@/components/chat/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function katoGreeting(preferredName: string | null): string {
  return preferredName
    ? `Hey ${preferredName} — what would you like to work on today?`
    : "What would you like to work on today? I'm here and ready."
}

function getOnboardingProgressLabel(segment: number): string {
  const labels: Record<number, string> = {
    0: 'Just getting started',
    1: 'Understanding what brought you here',
    2: 'Getting a picture of things',
    3: 'What tends to happen',
    4: 'What you\'re hoping for',
    5: 'What makes it harder',
    6: 'What helps',
    7: 'How you handle things',
    8: 'Almost done',
  }
  return labels[Math.min(segment, 8)] ?? 'Pulling it together'
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdvicePage() {
  const {
    appStage, setAppStage,
    messages, addMessage, clearMessages,
    status, isBusy, send, error, clearError,
    lastCompletedMessageId,
    memory, updateMemory, resetUser,
    activeCoach, setActiveCoach,
    onboardingSegment,
    onboardingClosePhase,
  } = useChatState()

  const [finalizing, setFinalizing] = useState(false)

  // Ref guard: prevents the auto-transition from firing more than once per
  // onboarding session. Resets automatically when appStage leaves ONBOARDING
  // (the useChatState reset effect clears the close-phase flags, and on next
  // ONBOARDING entry this component will have a fresh closure).
  const onboardingTransitionedRef = useRef(false)

  // ── iOS PWA keyboard fix ───────────────────────────────────────────────
  // Primary fix (CSS): the root div uses `position: fixed; inset: 0`.
  // On iOS 15+ PWA, fixed elements anchor to the *visual* viewport — so when
  // the keyboard opens the root's bottom edge rises with the keyboard, the
  // flex column shrinks to fit, and the page never "shoots up".
  //
  // Secondary fix (JS): we also lock the document scroll so iOS cannot shift
  // the layout, and we hide the bottom nav when an input is focused so the
  // fixed nav bar doesn't overlay the composer.
  const { isKeyboardOpen } = useVisualViewport()

  // Prevent iOS from scrolling the document body when an input is focused.
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [])

  // Scroll messages to bottom whenever keyboard opens so latest message is visible.
  const messagesScrollRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (isKeyboardOpen && messagesScrollRef.current) {
      messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight
    }
  }, [isKeyboardOpen])

  // Auto-transition out of ONBOARDING when the written summary has been delivered
  // via the conversational path (user said "yes" to the summary offer).
  // handleFinalize() handles the explicit "Finish & see summary" button path separately.
  useEffect(() => {
    if (
      onboardingClosePhase.writtenDone &&
      appStage === 'ONBOARDING' &&
      !onboardingTransitionedRef.current
    ) {
      onboardingTransitionedRef.current = true
      addMessage({
        id: `kato_transition_${Date.now()}`,
        role: 'assistant',
        content: "I've got a first-pass picture of where you're starting from. We can start coaching from here — what's on your mind?",
        createdAt: Date.now(),
      })
      updateMemory({ appStage: 'LIGHT_CHAT' })
      setAppStage('LIGHT_CHAT')
    }
  }, [onboardingClosePhase.writtenDone, appStage, addMessage, updateMemory, setAppStage])

  // ONBOARDING uses the inline chat UI (not the FirstRunFlow overlay), so it's excluded from isFirstRun.
  const isFirstRun = appStage !== 'LIGHT_CHAT' && appStage !== 'PERSONALIZED_CHAT' && appStage !== 'ONBOARDING'

  // Composer is active during PRE_CONSENT (coaching-vs-therapy Q&A), ONBOARDING, LIGHT_CHAT, and PERSONALIZED_CHAT.
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
    updateMemory({ firstRunChoiceMade: choice })
    if (choice === 'talk-now') {
      enterLightChat()
    } else if (choice === 'team-intro') {
      updateMemory({ appStage: 'TEAM_INTRO' })
      setAppStage('TEAM_INTRO')
    } else {
      // Enter inline onboarding — stay on /advice, use the chat UI with /api/onboarding
      const openingMsg: ChatMessage = {
        id: `kato_onboarding_${Date.now()}`,
        role: 'assistant',
        content: "I'd like to take some time to get to know you better — your situation, what brings you here, and what matters most to you. This is a conversation, not a questionnaire, so feel free to share at your own pace. There's no right way to do this.\n\nWhat feels like a natural place to start?",
        createdAt: Date.now(),
      }
      clearMessages()
      addMessage(openingMsg)
      updateMemory({ onboardingStarted: true, appStage: 'ONBOARDING' })
      setAppStage('ONBOARDING')
    }
  }, [updateMemory, enterLightChat, setAppStage, clearMessages, addMessage])

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

  // ── Onboarding finalize ────────────────────────────────────────────────
  // Generates the written intake summary then transitions to coaching.
  // Includes closePhase state so the API's hard gate fires correctly after
  // the summary is delivered. The API injects coverage warnings when
  // required domains are missing.
  const handleFinalize = useCallback(async () => {
    if (finalizing || messages.length === 0) return
    setFinalizing(true)
    const historyForApi = messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: 'finish',
          history: historyForApi,
          finalize: true,
          closePhase: onboardingClosePhase,
        }),
      })
      const text = await res.text().catch(() => '')
      const summaryMsg: ChatMessage = {
        id: `kato_summary_${Date.now()}`,
        role: 'assistant',
        content: text.trim() || 'Here is a brief summary of what we covered.',
        createdAt: Date.now(),
      }
      addMessage(summaryMsg)
      updateMemory({ appStage: 'LIGHT_CHAT' })
      setAppStage('LIGHT_CHAT')
    } catch {
      // Fall back to entering coaching without a summary
      updateMemory({ appStage: 'LIGHT_CHAT' })
      setAppStage('LIGHT_CHAT')
    } finally {
      setFinalizing(false)
    }
  }, [finalizing, messages, onboardingClosePhase, addMessage, updateMemory, setAppStage])

  // ── Composer send ──────────────────────────────────────────────────────
  const handleSend = useCallback((text: string) => {
    void send(text)
  }, [send])

  const hasMessages = messages.length > 0

  return (
    <div
      className="flex flex-col relative overflow-hidden"
      style={{
        // `position: fixed; inset: 0` anchors the layout to the visual viewport.
        // On iOS 15+ PWA, this means the bottom edge automatically rises when
        // the soft keyboard appears — no JS height tracking needed.
        position: 'fixed',
        inset: 0,
        background: 'var(--bg-primary)',
      }}
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
          <div ref={messagesScrollRef} className="absolute inset-0 overflow-y-auto chat-messages px-4 pb-4 pt-2">
            <div className="max-w-lg mx-auto">
              <MessageList
                messages={messages}
                revealMessageId={appStage === 'ONBOARDING' ? null : lastCompletedMessageId}
              />
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

        {/* Progress + finalize controls — visible only during ONBOARDING stage */}
        {appStage === 'ONBOARDING' && (
          <div className="mb-2">
            {messages.length > 1 && onboardingSegment < 9 && (() => {
              const pct = Math.max(8, Math.round(((onboardingSegment + 1) / 10) * 100))
              return (
                <div className="mb-3 px-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {getOnboardingProgressLabel(onboardingSegment)}
                    </span>
                  </div>
                  <div
                    className="w-full rounded-full overflow-hidden"
                    style={{ height: 3, background: 'rgba(0,0,0,0.07)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, var(--cmc-teal-500), var(--cmc-teal-700))',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              )
            })()}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => enterLightChat()}
                className="text-xs font-medium px-4 py-2 rounded-full transition-opacity opacity-60 hover:opacity-100"
                style={{
                  color: 'var(--text-tertiary)',
                  background: 'rgba(0,0,0,0.04)',
                  border: '1px solid rgba(0,0,0,0.08)',
                }}
              >
                Skip to coaching
              </button>
              <button
                type="button"
                onClick={() => void handleFinalize()}
                disabled={finalizing || isBusy || messages.length === 0}
                className="text-xs font-semibold px-4 py-2 rounded-full text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--cmc-teal-500), var(--cmc-teal-700))' }}
              >
                {finalizing ? 'Generating…' : 'Finish & see summary'}
              </button>
            </div>
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
              : appStage === 'ONBOARDING'
              ? 'Share what\'s on your mind…'
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

      {/* Hide the nav bar when the keyboard is open to maximise visible message space */}
      {!isKeyboardOpen && <NavSpacer />}
      {!isKeyboardOpen && <BottomNav />}
    </div>
  )
}
