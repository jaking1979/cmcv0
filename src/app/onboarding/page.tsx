'use client'

import { useEffect, useState } from 'react'
import TopNav from '@/components/TopNav'
import { ChatPane } from '@/components/chat'
import AssessmentProgressMeter from '@/components/AssessmentProgressMeter'

type Msg = { role: 'user' | 'assistant'; content: string }

// V1 Assessment Profile types
interface AssessmentProfile {
  sessionId: string
  timestamp: number
  constructs: {
    selfCompassion: any
    urica: any
    kessler10: any
    who5: any
    dbtWccl: any
    copingSelfEfficacy: any
    assist: any
    asi: any
  }
  confidence: {
    selfCompassion: number
    urica: number
    kessler10: number
    who5: number
    dbtWccl: number
    copingSelfEfficacy: number
    assist: number
    asi: number
    overall: number
  }
  rawTranscript: string
  redactedTranscript: string
}

export default function OnboardingPage() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  
  // V1 features
  const [isV1Enabled, setIsV1Enabled] = useState(false)
  const [assessmentProfile, setAssessmentProfile] = useState<AssessmentProfile | null>(null)
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [hasTriggeredTargetedMode, setHasTriggeredTargetedMode] = useState(false)

  useEffect(() => {
    setShowInstructions(true)
    
    // Check for V1 feature flags (client-side detection)
    const urlParams = new URLSearchParams(window.location.search)
    const v1Param = urlParams.get('v1')
    if (v1Param === '1') {
      setIsV1Enabled(true)
      
      // Initialize empty assessment profile for progress tracking
      const initialProfile: AssessmentProfile = {
        sessionId: `session_${Date.now()}`,
        timestamp: Date.now(),
        constructs: {
          selfCompassion: {},
          urica: {},
          kessler10: {},
          who5: {},
          dbtWccl: {},
          copingSelfEfficacy: {},
          assist: {},
          asi: {}
        },
        confidence: {
          selfCompassion: 0,
          urica: 0,
          kessler10: 0,
          who5: 0,
          dbtWccl: 0,
          copingSelfEfficacy: 0,
          assist: 0,
          asi: 0,
          overall: 0
        },
        rawTranscript: '',
        redactedTranscript: ''
      }
      setAssessmentProfile(initialProfile)
    }
    
    // Check for disclaimer requirement
    const hasDisclaimer = process.env.NEXT_PUBLIC_LEGAL_ASSESSMENT_DISCLAIMER === '1'
    if (hasDisclaimer) {
      setShowDisclaimer(true)
    }
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
      
          // V1: Update assessment mapping after each exchange
          if (isV1Enabled && nextMessages.length >= 1) {
            // Update assessment profile immediately for real-time progress
            updateAssessmentProfile(nextMessages)
            
            // Also trigger background mapping (for future real API integration)
            triggerAssessmentMapping(nextMessages).catch(console.error)
          }
    } finally {
      setLoading(false)
    }
  }

  // V1: Update assessment profile immediately for real-time progress
  function updateAssessmentProfile(conversationMessages: Msg[]) {
    const messageCount = conversationMessages.filter(m => m.role === 'user').length
    const mockProfile: AssessmentProfile = {
      sessionId: `session_${Date.now()}`,
      timestamp: Date.now(),
      constructs: {
        selfCompassion: {},
        urica: {},
        kessler10: {},
        who5: {},
        dbtWccl: {},
        copingSelfEfficacy: {},
        assist: {},
        asi: {}
      },
      confidence: {
        // Different areas progress at different rates based on typical conversation flow
        // Start showing progress immediately with first user message
        selfCompassion: Math.min(0.85, Math.max(0, (messageCount - 0.5) * 0.15)),
        urica: Math.min(0.9, Math.max(0, messageCount * 0.18)),
        kessler10: Math.min(0.8, Math.max(0, (messageCount - 1) * 0.16)),
        who5: Math.min(0.75, Math.max(0, (messageCount - 1.5) * 0.14)),
        dbtWccl: Math.min(0.7, Math.max(0, (messageCount - 2) * 0.12)),
        copingSelfEfficacy: Math.min(0.8, Math.max(0, (messageCount - 2.5) * 0.13)),
        assist: Math.min(0.95, Math.max(0, messageCount * 0.19)),
        asi: Math.min(0.85, Math.max(0, (messageCount - 0.5) * 0.17)),
        overall: Math.min(0.85, Math.max(0, messageCount * 0.12))
      },
      rawTranscript: conversationMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n'),
      redactedTranscript: conversationMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')
    }
    
    setAssessmentProfile(mockProfile)
    
    // Check if we should trigger targeted questioning mode
    const confidenceValues = Object.values(mockProfile.confidence).slice(0, -1) // Exclude overall
    const allDomainsAbove70 = confidenceValues.every(conf => conf >= 0.7)
    
    if (allDomainsAbove70 && !hasTriggeredTargetedMode) {
      setHasTriggeredTargetedMode(true)
      // Trigger a targeted questioning message
      setTimeout(() => {
        const targetedMessage = {
          role: 'assistant' as const,
          content: "I have a good understanding of your situation now. Let me shift to asking a few more specific questions to complete your assessment. How would you rate your confidence in your ability to handle stressful situations without turning to substances, on a scale from 1 to 10?"
        }
        setMessages(prev => [...prev, targetedMessage])
      }, 1000)
    }
  }

  // V1: Trigger assessment mapping
  async function triggerAssessmentMapping(conversationMessages: Msg[]) {
    try {
      const transcript = conversationMessages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n')
      
      const response = await fetch('/api/onboarding/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `session_${Date.now()}`,
          transcript
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.profile) {
          // Update with real API response when available
          setAssessmentProfile(data.profile)
        }
        // Note: If API fails, we rely on the immediate updateAssessmentProfile call
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
      
      // V1: Final assessment mapping
      if (isV1Enabled) {
        await triggerAssessmentMapping(nextMessages)
      }
    } finally {
      setFinalizing(false)
    }
  }


  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopNav title="🧭 Onboarding Chat" onShowInstructions={() => setShowInstructions(true)} />
      
      {/* V1: Sticky Assessment Progress Meter */}
      {isV1Enabled && assessmentProfile && (
        <AssessmentProgressMeter 
          confidence={assessmentProfile.confidence}
          isSticky={true}
        />
      )}

      <main className="flex-1 flex flex-col px-3 sm:px-4 py-4 max-w-3xl mx-auto w-full min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <ChatPane
            className="flex-1"
            messages={messages.map((m, i) => ({ id: String(i), role: m.role as any, content: markdownToHtml(m.content) }))}
            onSend={(v) => { setInput(v); setTimeout(() => { void sendCurrentInput(); }, 0); }}
            isSending={loading}
            inputValue={input}
            onInputChange={setInput}
            footer={
              <span className="text-wrap-anywhere">
                CMC Sober Coach provides behavior coaching. It is not a medical tool and does not provide therapy, diagnosis, or emergency services.
              </span>
            }
            renderHTML
          />
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <p className="text-xs text-gray-500 leading-relaxed text-wrap-anywhere">
              CMC Sober Coach provides behavior coaching. It is not a medical tool and does not provide therapy, diagnosis, or emergency services.
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowInstructions(true)}
                className="
                  rounded-md border border-gray-300 
                  px-3 py-2 min-h-[44px]
                  text-xs text-gray-700 
                  hover:bg-gray-50 active:bg-gray-100
                  transition-colors
                "
              >
                Instructions
              </button>
              <button
                type="button"
                onClick={handleFinalize}
                disabled={finalizing || loading || messages.length === 0}
                className="
                  rounded-md bg-blue-600 text-white 
                  px-3 py-2 min-h-[44px]
                  text-xs font-medium
                  disabled:opacity-50 disabled:cursor-not-allowed
                  hover:bg-blue-700 active:bg-blue-800
                  transition-colors
                "
              >
                {finalizing ? 'Generating…' : 'Finish & Generate Report'}
              </button>
            </div>
          </div>
        </div>


        {/* V1: Legal Disclaimer */}
        {isV1Enabled && showDisclaimer && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 leading-relaxed text-wrap-anywhere">
              <strong>Assessment Disclaimer:</strong> This is an educational behavior-coaching tool, not a medical or diagnostic assessment.
              The information gathered is used to personalize your coaching experience and is not intended for clinical purposes.
            </p>
          </div>
        )}
      </main>

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
    </div>
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

    if (line === '') {
      out.push('<br/>')
      continue
    }

    out.push(`<p>${escapeHtml(line)}</p>`)
  }

  flushList()
  return out.join('\n').replace(/(?:<br\/>\s*){2,}/g, '<br/>')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
