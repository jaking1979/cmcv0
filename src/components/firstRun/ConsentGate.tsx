'use client'

/**
 * ConsentGate
 *
 * Rendered during PRE_CONSENT stage.
 *
 * Displays:
 * 1. The three Kato intro bubbles (state-driven sequential reveal, ~800ms apart)
 * 2. The ongoing chat messages list (user may ask coaching-vs-therapy questions
 *    before consenting — those messages stream in from /api/advice with the
 *    strict pre-consent system prompt)
 * 3. The "I'm OK with this!" inline consent button
 *
 * The composer in page.tsx remains active during this stage so the user can
 * ask questions. All replies are gated server-side to coaching-vs-therapy only.
 */

import * as React from 'react'
import type { ChatMessage } from '@/components/chat/types'
import { MessageList } from '@/components/chat/MessageList'
import { KATO_INTRO_MESSAGES } from '@/hooks/useChatState'

const KATO_ACCENT = 'linear-gradient(135deg, #3FA89C, #2C7A72)'

// ── Timing ────────────────────────────────────────────────────────────────────
const INITIAL_DELAY_MS = 300
const BUBBLE_GAP_MS = 800
// Extra pause before the consent button appears after the last bubble
const CONSENT_BUTTON_DELAY_MS = 500

function KatoBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-start items-end gap-2 slide-up">
      {/* Kato avatar */}
      <div
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mb-0.5"
        style={{ background: KATO_ACCENT }}
      >
        K
      </div>
      {/* Bubble */}
      <div
        className="max-w-[82%] px-4 py-3 text-[15px] leading-relaxed text-wrap-anywhere"
        style={{
          background: '#FFFFFF',
          borderRadius: '20px 20px 20px 4px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          color: 'var(--text-primary)',
        }}
      >
        {text}
      </div>
    </div>
  )
}

interface ConsentGateProps {
  /** Ongoing chat messages (user questions + Kato pre-consent replies) */
  messages: ChatMessage[]
  onConsent: () => void
  isBusy: boolean
}

export function ConsentGate({ messages, onConsent, isBusy }: ConsentGateProps) {
  const endRef = React.useRef<HTMLDivElement | null>(null)

  // visibleCount: 0 = nothing, 1/2/3 = bubbles revealed, 4 = consent button visible
  const [visibleCount, setVisibleCount] = React.useState(0)
  const totalBubbles = KATO_INTRO_MESSAGES.length // 3

  React.useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    for (let i = 0; i < totalBubbles; i++) {
      timers.push(
        setTimeout(() => setVisibleCount(i + 1), INITIAL_DELAY_MS + BUBBLE_GAP_MS * i)
      )
    }

    // Consent button appears after all bubbles + extra pause
    timers.push(
      setTimeout(
        () => setVisibleCount(totalBubbles + 1),
        INITIAL_DELAY_MS + BUBBLE_GAP_MS * totalBubbles + CONSENT_BUTTON_DELAY_MS
      )
    )

    return () => timers.forEach(clearTimeout)
  }, [totalBubbles])

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, visibleCount])

  return (
    <div className="flex flex-col gap-3 px-4 pb-4 pt-4 max-w-lg mx-auto w-full">
      {/* Sequential Kato intro bubbles */}
      {KATO_INTRO_MESSAGES.map((text, i) =>
        visibleCount > i ? <KatoBubble key={i} text={text} /> : null
      )}

      {/* "I'm OK with this!" consent button — appears after all bubbles */}
      {visibleCount > totalBubbles && (
        <div className="flex justify-start pl-10 mt-1 slide-up">
          <button
            onClick={onConsent}
            disabled={isBusy}
            className="px-5 py-3 rounded-2xl text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{
              background: KATO_ACCENT,
              boxShadow: '0 4px 16px rgba(63,168,156,0.35)',
            }}
          >
            I'm OK with this!
          </button>
        </div>
      )}

      {/* Any ongoing pre-consent Q&A */}
      {messages.length > 0 && (
        <div className="mt-1">
          <MessageList messages={messages} showAvatars />
        </div>
      )}

      <div ref={endRef} />
    </div>
  )
}
