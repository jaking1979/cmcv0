'use client'

import { useEffect, useRef, useState } from 'react'
import TopNav from '@/components/TopNav'

type Msg = { role: 'user' | 'assistant'; content: string }

export default function OnboardingPage() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, loading, finalizing])

  useEffect(() => {
    setShowInstructions(true)
  }, [])

  async function fetchAndFill(
    url: string,
    body: any,
    assistantIndex: number,
    simulateTyping = true
  ) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60_000)

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      const text = await res.text().catch(() => '')
      const content =
        (text && text.trim()) ||
        'Thanks for sharing — could you say a bit more so I can tailor this to you?'

      if (!simulateTyping) {
        setMessages((prev) => {
          const next = [...prev]
          if (assistantIndex >= 0 && assistantIndex < next.length) {
            next[assistantIndex] = { role: 'assistant', content }
          }
          return next
        })
        return
      }

      const steps = Math.min(40, Math.max(15, Math.ceil(content.length / 18)))
      for (let i = 1; i <= steps; i++) {
        await new Promise((r) => setTimeout(r, 25))
        const partial = content.slice(0, Math.ceil((i / steps) * content.length))
        setMessages((prev) => {
          const next = [...prev]
          if (assistantIndex >= 0 && assistantIndex < next.length) {
            next[assistantIndex] = { role: 'assistant', content: partial }
          }
          return next
        })
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev]
        if (assistantIndex >= 0 && assistantIndex < next.length) {
          next[assistantIndex] = {
            role: 'assistant',
            content:
              'I had trouble connecting just now. Mind trying that again in a moment?',
          }
        }
        return next
      })
    } finally {
      clearTimeout(timeout)
    }
  }

  async function sendCurrentInput() {
    if (loading) return
    const text = input.trim()
    if (!text) return

    setInput('')
    setLoading(true)

    const userMsg: Msg = { role: 'user', content: text }
    const assistantPlaceholder: Msg = { role: 'assistant', content: '' }
    const nextMessages = [...messages, userMsg, assistantPlaceholder]
    const assistantIndex = nextMessages.length - 1
    setMessages(nextMessages)

    try {
      await fetchAndFill(
        '/api/onboarding',
        {
          input: text,
          history: messages.slice(-12),
          finalize: false,
        },
        assistantIndex,
        true
      )
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!loading) void sendCurrentInput()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (isComposing) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!loading) void sendCurrentInput()
    }
  }

  async function handleFinalize() {
    if (finalizing || messages.length === 0) return
    setFinalizing(true)

    const assistantPlaceholder: Msg = { role: 'assistant', content: '' }
    const nextMessages = [...messages, assistantPlaceholder]
    const assistantIndex = nextMessages.length - 1
    setMessages(nextMessages)

    try {
      await fetchAndFill(
        '/api/onboarding',
        {
          input: 'finish',
          history: messages.slice(-12),
          finalize: true,
        },
        assistantIndex,
        false
      )
    } finally {
      setFinalizing(false)
    }
  }

  return (
    <main className="h-screen max-w-3xl mx-auto p-6 flex flex-col min-h-0">
      {/* ✅ Global, sticky top nav */}
      <TopNav title="🧭 Onboarding Chat" onShowInstructions={() => setShowInstructions(true)} />

      <section
        ref={scrollRef}
        className="mt-4 flex-1 min-h-0 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div className="text-gray-500 text-sm">
            Welcome! Tell me a bit about yourself and what brings you here. I’ll ask one gentle question at a time.
          </div>
        )}

        <div className="space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                }`}
                dangerouslySetInnerHTML={{ __html: markdownToHtml(m.content || '') }}
              />
            </div>
          ))}

          {(loading || finalizing) && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-700 rounded-2xl rounded-bl-sm px-3 py-2 text-sm">
                Thinking…
              </div>
            </div>
          )}
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          const target = e.target as HTMLElement
          const isTextArea = target && target.tagName === 'TEXTAREA'
          if (!isTextArea && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            if (!loading) void sendCurrentInput()
          }
        }}
        className="mt-4 flex items-end gap-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="Type your message… (Enter to send, Shift+Enter for newline)"
          className="flex-1 rounded-lg border border-gray-300 p-3 min-h-[64px] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-md bg-blue-600 text-white px-4 py-3 text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Send'}
        </button>
      </form>

      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-gray-500">
          CMC Sober Coach provides behavior coaching. It is not a medical tool and does not provide therapy, diagnosis, or emergency services.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowInstructions(true)}
            className="rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
          >
            Instructions
          </button>
          <button
            type="button"
            onClick={handleFinalize}
            disabled={finalizing || loading || messages.length === 0}
            className="rounded-md bg-blue-600 text-white px-3 py-2 text-xs disabled:opacity-50"
          >
            {finalizing ? 'Generating…' : 'Finish & Generate Report'}
          </button>
        </div>
      </div>

      {/* Instructions modal */}
      {showInstructions && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-instructions-title"
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowInstructions(false)
          }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowInstructions(false)} />
          <div className="relative z-10 w-[min(680px,92vw)] rounded-xl bg-white shadow-xl border border-gray-200">
            <div className="p-5 border-b border-gray-200 flex items-start justify-between gap-4">
              <h2 id="onboarding-instructions-title" className="text-lg font-semibold">
                How to try this onboarding demo
              </h2>
              <button
                onClick={() => setShowInstructions(false)}
                className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                autoFocus
              >
                Close
              </button>
            </div>
            <div className="p-5 text-[15px] leading-6 text-gray-800 space-y-4">
              <p>
                This page is a <strong>demo</strong> of the onboarding conversation that will ship in the full app.
                Please act as if you are a user who wants to change your substance-use behaviors.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The assistant will chat with you to understand your situation and goals.</li>
                <li>
                  There are known bugs. Sometimes it may offer to generate a summary <em>too early</em>. If that happens,
                  reply “not yet” and continue the conversation.
                </li>
                <li>
                  When you’ve shared enough, click <em>Finish &amp; Generate Report</em> (top-right) to see a summary
                  written in plain language.
                </li>
              </ul>
              <p className="text-sm text-gray-600">
                Note: This is a behavior-coaching demo, not a medical or mental-health tool. In an emergency, contact
                professional support.
              </p>
            </div>
            <div className="px-5 pb-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowInstructions(false)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function markdownToHtml(md: string): string {
  const lines = (md || '').split(/\r?\n/)

  const out: string[] = []
  let inList = false

  const flushList = () => {
    if (inList) {
      out.push('</ul>')
      inList = false
    }
  }

  for (let raw of lines) {
    const line = raw.trim()

    // Headers
    let m
    if ((m = /^###\s+(.*)$/.exec(line))) {
      flushList()
      out.push(`<h3 class="font-semibold text-base mt-3 mb-1">${escapeHtml(m[1])}</h3>`)
      continue
    }
    if ((m = /^##\s+(.*)$/.exec(line))) {
      flushList()
      out.push(`<h2 class="font-semibold text-lg mt-4 mb-2">${escapeHtml(m[1])}</h2>`)
      continue
    }
    if ((m = /^#\s+(.*)$/.exec(line))) {
      flushList()
      out.push(`<h1 class="font-bold text-xl mt-4 mb-2">${escapeHtml(m[1])}</h1>`)
      continue
    }

    // List item
    if (/^[-*]\s+/.test(line)) {
      if (!inList) {
        inList = true
        out.push('<ul class="list-disc pl-6">')
      }
      out.push(`<li>${escapeHtml(line.replace(/^[-*]\s+/, ''))}</li>`)
      continue
    } else {
      flushList()
    }

    // Blank line => paragraph break
    if (line === '') {
      out.push('<br/>')
      continue
    }

    // Paragraph
    out.push(`<p>${escapeHtml(line)}</p>`)
  }

  flushList()

  // Join and coalesce multiple <br/> into paragraph spacing
  return out.join('\n').replace(/(?:<br\/>\s*){2,}/g, '<br/>')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}