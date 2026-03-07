'use client'

/**
 * ConsentGate
 *
 * Rendered during PRE_CONSENT stage.
 *
 * Displays:
 * 1. The three Kato intro bubbles (hardcoded, styled as assistant bubbles)
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

function KatoBubble({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <div
      className="flex justify-start items-end gap-2 slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
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

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col gap-3 px-4 pb-4 pt-4 max-w-lg mx-auto w-full">
      {/* The three static Kato intro bubbles */}
      {KATO_INTRO_MESSAGES.map((text, i) => (
        <KatoBubble key={i} text={text} delay={i * 120} />
      ))}

      {/* Any ongoing pre-consent Q&A */}
      {messages.length > 0 && (
        <div className="mt-1">
          <MessageList messages={messages} showAvatars />
        </div>
      )}

      {/* "I'm OK with this!" consent button */}
      <div className="flex justify-start pl-10 mt-1 slide-up" style={{ animationDelay: '420ms' }}>
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

      <div ref={endRef} />
    </div>
  )
}
