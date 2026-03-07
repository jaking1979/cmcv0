'use client'

/**
 * useChatState
 *
 * Central hook that owns all stateful chat logic. Previously this was
 * scattered across ~30 useState calls inside advice/page.tsx.
 *
 * Responsibilities:
 * - userId (anonymous identity, from userIdentity.ts)
 * - appStage (first-run state machine, persisted in localStorage)
 * - messages (chat history for the current session — ephemeral, in-memory)
 * - send() (calls /api/advice with full structured context)
 * - memory (persistent user context, via MemoryStore)
 * - activeCoach (which coach lens is currently active)
 * - status / error
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '@/components/chat/types'
import type { AppStage } from '@/lib/appState'
import { clearAppStage, loadAppStage, saveAppStage } from '@/lib/appState'
import { clearUserId, getUserId } from '@/lib/userIdentity'
import { localStorageStore } from '@/lib/memory/localStorageStore'
import type { UserMemory } from '@/lib/memory/types'
import { buildMemorySummary, createEmptyMemory } from '@/lib/memory/types'
import type { CoachId } from '@/lib/coaches/definitions'

// ── Kato intro messages shown during PRE_CONSENT ─────────────────────────────

export const KATO_INTRO_MESSAGES: string[] = [
  "Hi, my name is Kato. I'm your AI sober coach. I'm here to help you make behavioral changes so you can live your most valued life.",
  "I want to be clear to start, I am a behavioral coach, not a therapist. What's the difference? I'm here to help you make behavior changes and to learn the skills you need in order to make and maintain those changes over time.",
  "If you want to talk about deeper issues, like your mental health in general, or big things that come up for you, like trauma, depression, anxiety, etc, I will not be able to help. Those are issues that are for trained mental health professionals. If you're OK with this, please let me know by hitting the 'I'm OK with this!' button below. Otherwise, you can ask me more questions about this before we begin.",
]

// ── Types ────────────────────────────────────────────────────────────────────

export type SendStatus = 'idle' | 'thinking' | 'streaming' | 'done'

export interface ChatStateReturn {
  // Stage
  appStage: AppStage
  setAppStage: (stage: AppStage) => void

  // Messages
  messages: ChatMessage[]
  addMessage: (msg: ChatMessage) => void
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  clearMessages: () => void

  // Sending
  status: SendStatus
  isBusy: boolean
  send: (input: string) => Promise<void>
  error: string | null
  clearError: () => void

  // Identity & memory
  userId: string
  memory: UserMemory
  updateMemory: (patch: Partial<UserMemory>) => Promise<void>
  resetUser: () => Promise<void>

  // Active coach
  activeCoach: CoachId | null
  setActiveCoach: (id: CoachId | null) => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useChatState(): ChatStateReturn {
  // ── User ID (stable across renders) ────────────────────────────────────
  const [userId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'usr_server'
    return getUserId()
  })

  // ── App stage (read from localStorage on mount) ─────────────────────────
  const [appStage, _setAppStage] = useState<AppStage>(() => {
    if (typeof window === 'undefined') return 'PRE_CONSENT'
    return loadAppStage()
  })

  // ── Messages (ephemeral — in-memory only, cleared on page refresh) ──────
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const messagesRef = useRef<ChatMessage[]>([])
  messagesRef.current = messages

  // ── Send status & error ─────────────────────────────────────────────────
  const [status, setStatus] = useState<SendStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  // ── User memory (loaded from localStorage on mount) ─────────────────────
  const [memory, setMemory] = useState<UserMemory>(() => createEmptyMemory(userId))

  // ── Active coach ────────────────────────────────────────────────────────
  const [activeCoach, setActiveCoach] = useState<CoachId | null>(null)

  // ── Load memory from localStorage after hydration ───────────────────────
  useEffect(() => {
    localStorageStore.load(userId).then(loaded => {
      if (loaded) setMemory(loaded)
    })
  }, [userId])

  // ── Stage helpers ────────────────────────────────────────────────────────
  const setAppStage = useCallback((stage: AppStage) => {
    _setAppStage(stage)
    saveAppStage(stage)
  }, [])

  // ── Message helpers ──────────────────────────────────────────────────────
  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg])
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  const clearError = useCallback(() => setError(null), [])

  // ── Memory update ────────────────────────────────────────────────────────
  const updateMemory = useCallback(async (patch: Partial<UserMemory>) => {
    const updated = await localStorageStore.update(userId, patch)
    setMemory(updated)
  }, [userId])

  // ── Full user reset ───────────────────────────────────────────────────────
  // Wipes all localStorage state for this user and reloads so a brand-new
  // anonymous ID is generated and the app starts again at PRE_CONSENT.
  const resetUser = useCallback(async () => {
    if (typeof window === 'undefined') return

    const confirmed = window.confirm(
      'Start over as a new user? This will clear your local profile, memory, and all first-run progress for this browser.'
    )
    if (!confirmed) return

    await localStorageStore.clear(userId)
    clearAppStage()
    clearUserId()

    // Reset in-memory state before reload so there's no flicker
    setMessages([])
    setMemory(createEmptyMemory('usr_server'))
    setActiveCoach(null)
    setError(null)
    setStatus('idle')
    _setAppStage('PRE_CONSENT')

    window.location.reload()
  }, [userId])

  // ── Send a user message to /api/advice ───────────────────────────────────
  const send = useCallback(async (input: string) => {
    const trimmed = input.trim()
    if (!trimmed || status === 'thinking' || status === 'streaming') return

    clearError()

    // Add user message to the history
    const userMsgId = `msg_${Date.now()}_u`
    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', content: trimmed, createdAt: Date.now() },
    ])

    // Build history payload from messages BEFORE the new user message
    const historyForApi = messagesRef.current.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const memorySummary = buildMemorySummary(memory)

    setStatus('thinking')

    try {
      const isOnboarding = appStage === 'ONBOARDING'
      const res = await fetch(isOnboarding ? '/api/onboarding' : '/api/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: isOnboarding
          ? JSON.stringify({ input: trimmed, history: historyForApi, finalize: false })
          : JSON.stringify({
              input: trimmed,
              history: historyForApi,
              userId,
              appStage,
              consentAccepted: memory.consentAccepted,
              preferredName: memory.preferredName ?? undefined,
              activeCoach: activeCoach ?? 'kato',
              memorySummary,
            }),
      })

      if (!res.ok || !res.body) {
        throw new Error(`API error ${res.status}`)
      }

      // Add a streaming placeholder for the assistant reply
      const assistantMsgId = `msg_${Date.now()}_a`
      setMessages(prev => [
        ...prev,
        { id: assistantMsgId, role: 'assistant', content: '', createdAt: Date.now() },
      ])

      setStatus('streaming')

      // Read the response body chunk-by-chunk
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assembled = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assembled += decoder.decode(value, { stream: true })
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId ? { ...m, content: assembled + '▌' } : m
          )
        )
      }

      // Finalize — remove the streaming cursor
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId ? { ...m, content: assembled.trim() } : m
        )
      )

      setStatus('done')
    } catch {
      setError('Something went wrong. Please try again.')
      setStatus('idle')
      // Remove the incomplete assistant placeholder if it was added
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last?.role === 'assistant' && last.content === '') {
          return prev.slice(0, -1)
        }
        return prev
      })
    }
  }, [status, memory, userId, appStage, activeCoach, clearError])

  return {
    appStage,
    setAppStage,
    messages,
    addMessage,
    setMessages,
    clearMessages,
    status,
    isBusy: status === 'thinking' || status === 'streaming',
    send,
    error,
    clearError,
    userId,
    memory,
    updateMemory,
    resetUser,
    activeCoach,
    setActiveCoach,
  }
}
