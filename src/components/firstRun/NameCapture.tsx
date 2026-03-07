'use client'

/**
 * NameCapture
 *
 * Rendered during POST_CONSENT_NAME stage.
 *
 * Shows Kato's name question as a bubble and provides a dedicated
 * text input (the main composer is disabled at this stage).
 *
 * On submit: calls onNameSubmit(name) which the parent uses to
 * store preferredName in memory and advance to FIRST_RUN_CHOICE.
 */

import * as React from 'react'

const KATO_ACCENT = 'linear-gradient(135deg, #3FA89C, #2C7A72)'

interface NameCaptureProps {
  onNameSubmit: (name: string) => void
}

export function NameCapture({ onNameSubmit }: NameCaptureProps) {
  const [value, setValue] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  // Auto-focus the name input once mounted
  React.useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 400)
    return () => clearTimeout(t)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = value.trim()
    if (!name) return
    onNameSubmit(name)
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-4 pt-4 max-w-lg mx-auto w-full slide-up">
      {/* Kato bubble asking for name */}
      <div className="flex justify-start items-end gap-2">
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
          What would you like me to call you?
        </div>
      </div>

      {/* Name input */}
      <div className="pl-10 slide-up" style={{ animationDelay: '150ms' }}>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Your name or nickname…"
            className="flex-1 px-4 py-3 rounded-2xl text-[15px] outline-none"
            style={{
              background: 'rgba(0,0,0,0.05)',
              border: 'none',
              color: 'var(--text-primary)',
            }}
            maxLength={50}
            autoComplete="given-name"
          />
          <button
            type="submit"
            disabled={!value.trim()}
            className="px-4 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-40 transition-all"
            style={{ background: KATO_ACCENT }}
          >
            That's me →
          </button>
        </form>
      </div>
    </div>
  )
}
