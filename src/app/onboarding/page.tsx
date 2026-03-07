'use client'

import { useEffect, useState } from 'react'
import TopNav from '@/components/TopNav'
import { ChatPane } from '@/components/chat'
import OnboardingTourOverlay from '@/components/onboarding/OnboardingTourOverlay'
import BottomNav, { NavSpacer } from '@/components/BottomNav'

type Msg = { role: 'user' | 'assistant'; content: string }

export default function OnboardingPage() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isV1Enabled, setIsV1Enabled] = useState(true)
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  useEffect(() => {
    document.title = 'Onboarding — CMC Sober Coach'
    setShowInstructions(true)
    const tourSeen = localStorage.getItem('first_visit_onboarding_seen')
    if (!tourSeen) {
      setShowTour(true)
    } else {
      if (messages.length === 0) {
        setMessages([{
          role: 'assistant',
          content: "Hi, I'm Josh, your AI sober coach. I'd like to get to know you better so I can provide personalized support. Tell me a bit about what brings you here today and what you're hoping to achieve.",
        }])
      }
    }
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('v1') === '0') {
      setIsV1Enabled(false)
    }
    if (process.env.NEXT_PUBLIC_LEGAL_ASSESSMENT_DISCLAIMER === '1') setShowDisclaimer(true)
  }, [])

  async function fetchAndFill(url: string, body: any, assistantIndex: number, simulateTyping = true) {
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
      const content = (text && text.trim()) || 'Thanks for sharing — could you say a bit more so I can tailor this to you?'
      if (!simulateTyping) {
        setMessages((prev) => {
          const next = [...prev]
          if (assistantIndex >= 0 && assistantIndex < next.length) next[assistantIndex] = { role: 'assistant', content }
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
          if (assistantIndex >= 0 && assistantIndex < next.length) next[assistantIndex] = { role: 'assistant', content: partial }
          return next
        })
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev]
        if (assistantIndex >= 0 && assistantIndex < next.length) {
          next[assistantIndex] = { role: 'assistant', content: 'I had trouble connecting just now. Mind trying that again in a moment?' }
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
    setError(null)
    const userMsg: Msg = { role: 'user', content: text }
    const assistantPlaceholder: Msg = { role: 'assistant', content: '' }
    const nextMessages = [...messages, userMsg, assistantPlaceholder]
    const assistantIndex = nextMessages.length - 1
    setMessages(nextMessages)
    try {
      await fetchAndFill('/api/onboarding', { input: text, history: messages.slice(-12), finalize: false }, assistantIndex, true)
      if (isV1Enabled && nextMessages.length >= 1) {
        triggerAssessmentMapping(nextMessages).catch(console.error)
      }
    } catch {
      setError('Sorry, I encountered an error. Please try again.')
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  async function triggerAssessmentMapping(conversationMessages: Msg[]) {
    try {
      const transcript = conversationMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')
      const response = await fetch('/api/onboarding/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: `session_${Date.now()}`, transcript }),
      })
      if (response.ok) {
        // Background V1 formulation mapping — result consumed by server-side pipeline
        await response.json()
      }
    } catch (error) {
      console.error('Assessment mapping failed:', error)
    }
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
      await fetchAndFill('/api/onboarding', { input: 'finish', history: messages.slice(-12), finalize: true }, assistantIndex, false)
      if (isV1Enabled) await triggerAssessmentMapping(nextMessages)
    } finally {
      setFinalizing(false)
    }
  }

  return (
    <div
      className="h-dvh flex flex-col"
      style={{ background: 'var(--bg-primary)' }}
    >
      <TopNav
        title="Onboarding"
        onShowInstructions={() => setShowInstructions(true)}
        badge={isV1Enabled ? 'v1' : undefined}
      />

      {/* Error banner */}
      {error && (
        <div
          className="mx-4 mt-3 px-4 py-3 rounded-2xl flex items-start justify-between gap-2 flex-shrink-0 max-w-lg mx-auto w-full slide-up"
          style={{ background: 'rgba(254,226,226,0.9)', border: '1px solid rgba(252,165,165,0.5)' }}
        >
          <p className="text-sm flex-1 text-wrap-anywhere" style={{ color: '#991B1B' }}>{error}</p>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => { setError(null); void sendCurrentInput() }} className="text-xs font-semibold" style={{ color: '#991B1B' }}>Retry</button>
            <button onClick={() => setError(null)} className="text-xs" style={{ color: '#991B1B' }}>✕</button>
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 min-h-0 px-4 py-3 max-w-lg mx-auto w-full">
        <ChatPane
          className="h-full"
          messages={messages.map((m, i) => ({ id: String(i), role: m.role as 'user' | 'assistant', content: markdownToHtml(m.content) }))}
          onSend={(v) => { setInput(v); setTimeout(() => { void sendCurrentInput() }, 0) }}
          isSending={loading}
          inputValue={input}
          onInputChange={setInput}
          disabled={loading}
          footer="CMC Sober Coach provides behavior coaching. Not a medical tool."
          renderHTML
        />
      </div>

      {/* Bottom actions */}
      <div
        className="flex-shrink-0 px-4 pb-3 max-w-lg mx-auto w-full"
        style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center justify-end gap-2 py-2">
          <button
            type="button"
            onClick={() => setShowInstructions(true)}
            className="px-4 py-2 rounded-full text-xs font-medium min-h-[36px]"
            style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)' }}
          >
            Instructions
          </button>
          <button
            type="button"
            onClick={handleFinalize}
            disabled={finalizing || loading || messages.length === 0}
            className="px-4 py-2 rounded-full text-xs font-semibold text-white min-h-[36px] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--cmc-teal-500), var(--cmc-teal-700))' }}
          >
            {finalizing ? 'Generating…' : 'Finish & Generate Report'}
          </button>
        </div>

        {isV1Enabled && showDisclaimer && (
          <p className="text-[11px] leading-relaxed text-wrap-anywhere py-1" style={{ color: 'var(--text-tertiary)' }}>
            <strong>Assessment Disclaimer:</strong> This is an educational behavior-coaching tool, not a medical or diagnostic assessment.
          </p>
        )}
      </div>

      <NavSpacer />
      <BottomNav />

      {/* Tour Overlay */}
      {showTour && (
        <OnboardingTourOverlay
          onClose={() => {
            setShowTour(false)
            localStorage.setItem('first_visit_onboarding_seen', '1')
            if (messages.length === 0) {
              setMessages([{
                role: 'assistant',
                content: "Hi, I'm Josh, your AI sober coach. I'd like to get to know you better so I can provide personalized support. Tell me a bit about what brings you here today and what you're hoping to achieve.",
              }])
            }
          }}
        />
      )}

      {/* Instructions modal */}
      {showInstructions && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-instructions-title"
          tabIndex={-1}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowInstructions(false) }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowInstructions(false)} />
          <div
            className="relative z-10 w-full max-w-md rounded-3xl overflow-hidden scale-in"
            style={{ background: 'white', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}
          >
            <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <h2 id="onboarding-instructions-title" className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                How to try this onboarding demo
              </h2>
            </div>
            <div className="px-6 py-5 space-y-4 text-sm" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              <p>
                This page is a <strong>demo</strong> of the onboarding conversation that will ship in the full app.
                Please act as if you are a user who wants to change your substance-use behaviors.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>The assistant will chat with you to understand your situation and goals.</li>
                <li>
                  Sometimes it may offer to generate a summary <em>too early</em>. If that happens,
                  reply "not yet" and continue the conversation.
                </li>
                <li>
                  When you've shared enough, tap <em>Finish &amp; Generate Report</em> to see a plain-language summary.
                </li>
              </ul>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                This is a behavior-coaching demo, not a medical or mental-health tool. In an emergency, contact professional support.
              </p>
            </div>
            <div className="px-6 pb-6 flex justify-end">
              <button
                onClick={() => setShowInstructions(false)}
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, var(--cmc-teal-500), var(--cmc-teal-700))' }}
                autoFocus
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function markdownToHtml(md: string): string {
  const lines = (md || '').split(/\r?\n/)
  const out: string[] = []
  let inList = false
  const flushList = () => {
    if (inList) { out.push('</ul>'); inList = false }
  }
  for (const raw of lines) {
    const line = raw.trim()
    let m
    if ((m = /^###\s+(.*)$/.exec(line))) { flushList(); out.push(`<h3 class="font-semibold text-base mt-3 mb-1">${escapeHtml(m[1])}</h3>`); continue }
    if ((m = /^##\s+(.*)$/.exec(line))) { flushList(); out.push(`<h2 class="font-semibold text-lg mt-4 mb-2">${escapeHtml(m[1])}</h2>`); continue }
    if ((m = /^#\s+(.*)$/.exec(line))) { flushList(); out.push(`<h1 class="font-bold text-xl mt-4 mb-2">${escapeHtml(m[1])}</h1>`); continue }
    if (/^[-*]\s+/.test(line)) {
      if (!inList) { inList = true; out.push('<ul class="list-disc pl-6">') }
      out.push(`<li>${escapeHtml(line.replace(/^[-*]\s+/, ''))}</li>`)
      continue
    } else { flushList() }
    if (line === '') { out.push('<br/>'); continue }
    out.push(`<p>${escapeHtml(line)}</p>`)
  }
  flushList()
  return out.join('\n').replace(/(?:<br\/>\s*){2,}/g, '<br/>')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
