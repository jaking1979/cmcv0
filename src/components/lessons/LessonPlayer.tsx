'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import AvatarTalkingHead from '../AvatarTalkingHead'
import { MessageComposer } from '../chat/MessageComposer'
import Transcript from '../transcript/Transcript'
import type { Lesson, LessonState } from '@/lib/lessons/types'
import { getLessonState, saveLessonState, markLessonComplete } from '@/lib/state/lessonState'

interface LessonPlayerProps {
  lesson: Lesson
}

const CRISIS_TERMS = ['suicide', 'kill myself', 'overdose', 'od', 'self harm', 'hurt myself', 'harm myself']

function hasCrisisTerms(text: string): boolean {
  const t = text.toLowerCase()
  return CRISIS_TERMS.some((w) => t.includes(w))
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

export default function LessonPlayer({ lesson }: LessonPlayerProps) {
  const router = useRouter()
  const [scriptIndex, setScriptIndex] = useState(0)
  const [slideIndex, setSlideIndex] = useState(0)
  const [transcript, setTranscript] = useState<{ role: 'coach' | 'user'; text: string; id: string }[]>([])
  const [completed, setCompleted] = useState(false)
  const [redirectCount, setRedirectCount] = useState(0)
  const [input, setInput] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [crisisFlag, setCrisisFlag] = useState(false)
  const [inScript, setInScript] = useState(true)
  const [visibleCoachIdx, setVisibleCoachIdx] = useState(0)
  const [showSwitchToChatPrompt, setShowSwitchToChatPrompt] = useState(false)

  // Load persisted state
  useEffect(() => {
    const saved = getLessonState(lesson.slug)
    if (saved) {
      setScriptIndex(saved.scriptIndex)
      setSlideIndex(saved.slideIndex)
      setTranscript(saved.transcript)
      setCompleted(saved.completed)
      setRedirectCount(saved.redirectCount)
      
      // Check if we have any USER messages (not just coach intro)
      const hasUserMessages = saved.transcript.some(m => m.role === 'user')
      if (hasUserMessages) {
        // User has interacted, exit script mode
        setInScript(false)
        setVisibleCoachIdx(saved.transcript.filter(m => m.role === 'coach').length - 1)
      } else {
        // Still in script mode, just restore the coach messages
        setInScript(true)
        setVisibleCoachIdx(saved.transcript.filter(m => m.role === 'coach').length - 1)
      }
    } else {
      // Start fresh
      seedIntro()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.slug])

  // Persist state changes
  useEffect(() => {
    const state: LessonState = {
      scriptIndex,
      slideIndex,
      transcript,
      completed,
      redirectCount
    }
    saveLessonState(lesson.slug, state)
  }, [lesson.slug, scriptIndex, slideIndex, transcript, completed, redirectCount])

  function seedIntro() {
    if (lesson.coach_script.length === 0) return
    
    const first = lesson.coach_script[0]
    setScriptIndex(0)
    setSlideIndex(first.slide)
    pushCoach(first.text)
    setVisibleCoachIdx(0)
  }

  function pushCoach(text: string) {
    const msg = { id: crypto.randomUUID(), role: 'coach' as const, text }
    setTranscript(prev => [...prev, msg])
    setIsSpeaking(true)
    setTimeout(() => setIsSpeaking(false), Math.min(3000, Math.max(1200, text.length * 15)))
  }

  function pushUser(text: string) {
    const msg = { id: crypto.randomUUID(), role: 'user' as const, text }
    setTranscript(prev => [...prev, msg])
  }

  const coachMessages = useMemo(() => transcript.filter(m => m.role === 'coach'), [transcript])

  // Keep visible pointer following latest coach line
  useEffect(() => {
    if (coachMessages.length > 0 && (visibleCoachIdx === -1 || visibleCoachIdx === coachMessages.length - 2)) {
      setVisibleCoachIdx(coachMessages.length - 1)
    }
  }, [coachMessages.length, visibleCoachIdx])

  function advanceScript() {
    if (!inScript) return
    const next = scriptIndex + 1
    if (next >= lesson.coach_script.length) return
    
    const item = lesson.coach_script[next]
    setScriptIndex(next)
    setSlideIndex(item.slide)
    pushCoach(item.text)
    setVisibleCoachIdx(coachMessages.length) // Will be updated after push
  }

  async function handleUserInput(userInput: string) {
    const text = userInput.trim()
    if (!text) return

    // Crisis detection
    if (hasCrisisTerms(text)) {
      setCrisisFlag(true)
      return
    }

    pushUser(text)

    // Exit script mode if we were in it
    if (inScript) {
      setInScript(false)
    }

    // Check if input is off-topic using v1 coaches
    if (lesson.chat_mode === 'interactive') {
      await checkOffTopic(text)
    }

    // Check if this was answering a required input
    const currentStep = lesson.coach_script[scriptIndex]
    if (currentStep?.requires_input) {
      // Advance to next script item
      const nextIdx = scriptIndex + 1
      if (nextIdx < lesson.coach_script.length) {
        const nextStep = lesson.coach_script[nextIdx]
        setScriptIndex(nextIdx)
        setSlideIndex(nextStep.slide)
        pushCoach(nextStep.text)
      } else {
        // End of script
        pushCoach('Nice work completing this lesson. Would you like to mark it as complete?')
      }
    } else {
      // Generic acknowledgment
      pushCoach('Got it. Tell me more in your own words, or continue with the lesson.')
    }
  }

  async function checkOffTopic(text: string) {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }]
        })
      })

      if (response.ok) {
        const data = await response.json()
        const events = data.events || []
        
        // Check if coaches found low relevance (all confidence < 0.3)
        const allLowConfidence = events.length === 0 || events.every((e: any) => e.confidence < 0.3)
        
        if (allLowConfidence) {
          const newCount = redirectCount + 1
          setRedirectCount(newCount)

          if (newCount <= 2) {
            // Gentle redirect
            pushCoach(
              `I appreciate you sharing that. Let's focus on ${lesson.redirect_topic} for now. What you shared is valid, but let's stay on track with this lesson.`
            )
          } else if (newCount === 3) {
            // Offer to switch to chat
            setShowSwitchToChatPrompt(true)
            pushCoach(
              'It seems like you want to talk about something else. Would you like to switch to Just Chat instead?'
            )
          }
        }
      }
    } catch (error) {
      console.error('Error checking off-topic:', error)
    }
  }

  function handleComplete() {
    setCompleted(true)
    markLessonComplete(lesson.slug)
    pushCoach('Lesson marked as complete! You can review this lesson anytime from the Learn page.')
  }

  const currentCoach = coachMessages[visibleCoachIdx]
  const currentStep = lesson.coach_script[scriptIndex]
  const currentSlide = lesson.lesson_slides[slideIndex] || lesson.lesson_slides[0]

  // Navigation logic
  const canScriptNext = inScript && scriptIndex < lesson.coach_script.length - 1
  const canReviewNext = !inScript && visibleCoachIdx < coachMessages.length - 1
  const canPrev = visibleCoachIdx > 0

  const showComposer = lesson.chat_mode === 'interactive' && (
    currentStep?.requires_input || 
    !inScript || 
    showSwitchToChatPrompt
  )

  return (
    <main className="flex h-dvh flex-col bg-white">
      {/* Talking header (sticky) */}
      <section className="sticky top-12 z-30 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="flex items-start gap-3">
            <AvatarTalkingHead speaking={isSpeaking} className="shrink-0" />
            <div className="flex-1">
              <div className="max-w-[80%] rounded-xl bg-blue-50 ring-1 ring-blue-200 px-3 py-2 text-sm text-gray-900">
                {currentCoach?.text || 'Welcome to this lesson.'}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  disabled={!canPrev}
                  onClick={() => {
                    if (visibleCoachIdx > 0) setVisibleCoachIdx(visibleCoachIdx - 1)
                  }}
                >
                  ‹ Prev
                </button>
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  disabled={!(canScriptNext || canReviewNext)}
                  onClick={() => {
                    if (canScriptNext) {
                      advanceScript()
                    } else if (canReviewNext) {
                      setVisibleCoachIdx(visibleCoachIdx + 1)
                    }
                  }}
                >
                  Next ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transcript toggle */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-4 pb-2 pt-2">
          <Transcript messages={transcript} />
        </div>
      </section>

      {/* Lesson content (middle) */}
      <section className="border-b bg-white flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <h1 className="text-xl font-semibold">{currentSlide.title}</h1>
          <div 
            className="prose prose-sm max-w-none mt-2"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(currentSlide.body) }}
          />
        </div>
      </section>

      {/* Crisis banner */}
      {crisisFlag && (
        <div className="z-10 mx-auto w-full max-w-3xl bg-red-50 px-4 py-2 text-sm text-red-800">
          Thank you for sharing that. It sounds like you need immediate support beyond what I can provide. 
          If you're in danger, please call 911. If you're feeling suicidal or thinking of harming yourself, 
          please call 988.
        </div>
      )}

      {/* Switch to chat prompt */}
      {showSwitchToChatPrompt && (
        <div className="mx-auto w-full max-w-3xl bg-blue-50 px-4 py-3">
          <button
            onClick={() => router.push('/chat')}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Switch to Just Chat
          </button>
        </div>
      )}

      {/* Completion UI */}
      {!completed && transcript.some(m => m.text.toLowerCase().includes('mark it as complete')) && (
        <div className="mx-auto w-full max-w-3xl px-4 py-3">
          <button
            onClick={handleComplete}
            className="w-full rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
          >
            Mark Lesson Complete
          </button>
        </div>
      )}

      {completed && (
        <div className="mx-auto w-full max-w-3xl px-4 py-2 bg-emerald-50 text-emerald-800 text-sm">
          ✓ Lesson completed!
        </div>
      )}

      {/* Input composer (bottom sticky) */}
      {showComposer && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 pb-safe-area-inset-bottom pt-3">
          <div className="mx-auto w-full max-w-3xl">
            <MessageComposer 
              value={input}
              onChange={setInput}
              onSend={(text) => {
                handleUserInput(text)
                setInput('')
              }}
            />
          </div>
        </div>
      )}
    </main>
  )
}

