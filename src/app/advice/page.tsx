'use client'

import { useEffect, useMemo, useState } from 'react'
import GlobalInstructionsModal from '@/components/GlobalInstructionsModal'
import { MessageList, MessageComposer } from '@/components/chat'
import BottomNav, { NavSpacer } from '@/components/BottomNav'

type Msg = { role: 'user' | 'assistant'; text: string; kind?: 'FOLLOWUP' | 'ADVICE' }
type Phase = 'NEED_CONTEXT' | 'CLARIFY_GOAL' | 'SUMMARY_PERMISSION' | 'AWAIT_PERMISSION' | 'SUGGEST_OPTIONS'

interface CoachEvent {
  id: string
  sessionId: string
  timestamp: number
  coachType: string
  messageId: string
  tags: Array<{ type: string; value: string; confidence: number }>
  confidence: number
}

interface PersonalizedPlan {
  id: string
  sessionId: string
  timestamp: number
  summary: string
  actions: Array<{ id: string; title: string; description: string; category: string; difficulty: string }>
  rationale: string
  confidence: number
}

interface RoleplayMeta {
  id: string
  title: string
  tags?: string[]
}

const USE_OPENAI = true
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

const CRISIS_TEXT = `Thanks for telling me. I'm a behavior coach, not a clinician, and what you're describing sounds like it needs immediate support. If you're in danger, call 911. If you're thinking about hurting yourself or feel suicidal, call or text 988 (or chat at 988lifeline.org) for 24/7 help.`

const demoScenarios: Record<string, { title: string; text: string; reflection: string; validation: string; followUp: string; actions: string[] }> = {
  '1': {
    title: 'Evening Loneliness After Conflict',
    text: `Earlier today I argued with my brother over text, and now that it's evening and I'm home alone, I feel the urge to drink to quiet my frustration and loneliness. I skipped dinner and have been scrolling on my phone for the last hour.`,
    reflection: `You're feeling alone and frustrated after your argument, and you notice the urge to numb out or distract yourself instead of feeling those emotions.`,
    validation: `It makes sense you'd want to withdraw and distract after a fight—anyone would feel unsettled and want relief in that situation.`,
    followUp: `If you didn't have to wrestle with these feelings tonight, how would you want to spend your evening instead?`,
    actions: [
      '✅ Easiest: Do a brief grounding exercise to reconnect right now.',
      "💚 Values-based: Take a small step toward how you'd like your evening to look.",
      '🛡️ Preventive: Swap scrolling for a short, active, or creative task.',
      '🔄 Alt: Try a quick physical activity or something playful to shift your state.',
      '🎯 Bonus: Practice self-compassion—give yourself care, not criticism.',
    ],
  },
  '2': {
    title: 'Stress at Work with Overwhelm',
    text: `I'm overwhelmed with a big work deadline coming up. I put in extra hours but keep getting distracted and procrastinating. I'm worried I won't finish and my boss will be disappointed.`,
    reflection: `You're feeling overloaded and distracted, and it's tough to focus under pressure right now.`,
    validation: `Given the looming deadline and your worries about disappointing your boss, it's understandable you'd feel frazzled and stuck.`,
    followUp: `If the overwhelm was turned down a notch, what's one tiny next step you could take on your project?`,
    actions: [
      '✅ Easiest: Take a 1-minute breathing break to reset.',
      '💚 Values-based: Choose a meaningful task that fits your goals and start with that.',
      '🛡️ Preventive: Use a short focus timer (20–25 min) with a planned break.',
      '🔄 Alt: Change your environment briefly to refresh your attention.',
      '🎯 Bonus: Remember a time you finished a tough project—what helped then?',
    ],
  },
  '3': {
    title: 'Anxiety Before Social Event',
    text: `I'm anxious about going to a social event tonight. I worry I won't know what to say or that people will judge me, and I'm tempted to cancel or avoid it.`,
    reflection: `You're feeling nervous and uncertain, and avoiding the event seems safer than risking discomfort or judgment.`,
    validation: `It's normal to worry about being judged in social situations—your reaction is completely understandable.`,
    followUp: `If you felt even a little more at ease, how would you want to show up at the event?`,
    actions: [
      '✅ Easiest: Try a calming breath before you go in.',
      '💚 Values-based: Remind yourself why connecting matters to you.',
      '🛡️ Preventive: Prepare a couple of conversation starters to lean on.',
      "🔄 Alt: Arrive a little early so you can settle in before it's busy.",
      '🎯 Bonus: Recall a positive social memory to boost your confidence.',
    ],
  },
  '4': {
    title: 'Difficulty Sleeping Due to Worry',
    text: `I can't sleep because my mind races with worries about my family and finances. I lie awake for hours and feel exhausted the next day.`,
    reflection: `Your mind is busy and restless, making it hard to settle down for sleep.`,
    validation: `It's natural for stress to disrupt rest—there's nothing wrong with you for having a noisy brain at night.`,
    followUp: `If your evenings felt a bit calmer, what would your ideal wind-down routine look like?`,
    actions: [
      '✅ Easiest: Do a short body scan or guided relaxation before bed.',
      '💚 Values-based: Choose one small ritual to signal "off-duty" to your brain.',
      '🛡️ Preventive: Power down screens 30–60 minutes before sleep.',
      '🔄 Alt: Jot down worries in a quick "brain dump" earlier in the evening.',
      '🎯 Bonus: Stick to a consistent sleep/wake schedule for a week.',
    ],
  },
  '5': {
    title: 'Feeling Unmotivated to Exercise',
    text: `I haven't felt motivated to exercise lately. Even though I know it helps, I keep putting it off and making excuses. I feel guilty but can't seem to get going.`,
    reflection: `You're feeling stuck between wanting the benefits of movement and not having motivation show up.`,
    validation: `Motivation naturally comes and goes—it's understandable to stall when you're tired or stretched thin.`,
    followUp: `If you felt just a bit more energized, what kind of movement would genuinely fit today?`,
    actions: [
      '✅ Easiest: Start tiny—2 minutes of stretching or a short walk.',
      '💚 Values-based: Name why being active matters and let that guide a step.',
      '🛡️ Preventive: Put movement on your calendar like any other priority.',
      '🔄 Alt: Try a new, low-bar activity to spark interest.',
      '🎯 Bonus: Ask a friend to join you for accountability and fun.',
    ],
  },
  '6': {
    title: 'Struggling with Healthy Eating',
    text: `When I'm stressed or tired, I reach for junk food even though I want to eat better. I feel frustrated with myself for not making healthier choices.`,
    reflection: `You're craving comfort and convenience, even though you want to care for your body in a different way.`,
    validation: `Turning to familiar foods under stress is human—change takes practice, not perfection.`,
    followUp: `If you felt a little more supported, what's one small change that would make eating well easier this week?`,
    actions: [
      '✅ Easiest: Keep a healthy snack within reach for the next two days.',
      '💚 Values-based: Connect your eating choices to how you want to feel.',
      '🛡️ Preventive: Plan one or two simple meals ahead to avoid last-minute grabs.',
      '🔄 Alt: Try a new, appealing recipe to make healthy eating enjoyable.',
      '🎯 Bonus: Eat mindfully—pause and notice taste and fullness cues.',
    ],
  },
  '7': {
    title: 'Difficulty Managing Anger',
    text: `Lately, small things set me off and I regret how I react. I want to handle my anger better but don't know how.`,
    reflection: `You're feeling flooded by strong emotions, and it's tough to steer your reactions in the moment.`,
    validation: `When you're stressed or feel unheard, anger is a natural response—new habits take practice over time.`,
    followUp: `If you could respond even a little more calmly, what would that look like in a real moment this week?`,
    actions: [
      '✅ Easiest: Pause and take three slow breaths at the first sign of anger.',
      '💚 Values-based: Clarify what you want to communicate and how you want to show up.',
      '🛡️ Preventive: Move your body to release tension (walk, stretch, shake out).',
      '🔄 Alt: Channel feelings into journaling or creative outlets before responding.',
      '🎯 Bonus: Get support practicing scripts and regulation tools.',
    ],
  },
  '8': {
    title: 'Feeling Isolated and Disconnected',
    text: `I feel isolated and disconnected. Even when I'm around people, I don't feel understood or supported, and it's making me lonely and down.`,
    reflection: `You're feeling lonely and longing for connection that feels real and meaningful.`,
    validation: `It's natural to feel down when your need for connection isn't met—many people struggle with this, and you're not alone.`,
    followUp: `If you felt a bit more connected, what kinds of relationships or interactions would you want to nurture first?`,
    actions: [
      "✅ Easiest: Text or call someone you trust and share a bit of what's real for you.",
      '💚 Values-based: Name the qualities you value in relationships and seek them out.',
      '🛡️ Preventive: Join a group or activity that matches your interests this month.',
      '🔄 Alt: Offer yourself active self-compassion as you build new connections.',
      '🎯 Bonus: Consider short-term support to boost social confidence and skills.',
    ],
  },
}

function looksCrisis(text: string) {
  const s = (text || '').toLowerCase()
  return ['suicide', 'suicidal', 'kill myself', 'end my life', 'self harm', 'self-harm', 'hurt myself', 'overdose'].some(k => s.includes(k)) || /\bod\b(?![a-z])/.test(s)
}

const goalMentioned = /(abstain|avoid(ing)?|quit|stop|not drink|cut\s*down|reduce|moderate|stay sober|skip(\s+it)?)/i
const isAffirmative = (s: string) => /\b(yes|yep|yeah|ok(ay)?|sure|please|sounds good|do it|go ahead)\b/i.test(s)

function inferPhase(
  history: { role: 'user' | 'assistant'; text: string; kind?: 'FOLLOWUP' | 'ADVICE' }[],
  incoming: string
): Phase {
  const last = history[history.length - 1]
  const msg = (incoming || '').trim()
  if (!history.length) return 'NEED_CONTEXT'
  if (last?.role === 'assistant' && /would it be ok|would it be okay|is it ok if i|share (a|some) options|offer options|share a few/i.test(last.text)) {
    return isAffirmative(msg) ? 'SUGGEST_OPTIONS' : 'AWAIT_PERMISSION'
  }
  if (last?.role === 'assistant' && (last.kind === 'FOLLOWUP' || /\?\s*$/.test(last.text))) {
    if (msg.length < 120 || !goalMentioned.test(msg)) return 'CLARIFY_GOAL'
    return 'SUMMARY_PERMISSION'
  }
  if (last?.role === 'user') {
    if (msg.length < 120 || !goalMentioned.test(msg)) return 'NEED_CONTEXT'
    return 'SUMMARY_PERMISSION'
  }
  return 'NEED_CONTEXT'
}

function buildLocalAdvice(
  input: string,
  demo?: { reflection: string; validation: string; followUp: string }
) {
  const t = (input || '').toLowerCase()
  const isShort = t.length < 60
  const mentionsUse = /(drink|use|get high|relapse|slip|urge|craving)/i.test(t)
  const mentionsConflict = /(fight|argu(e|ment)|conflict|yell|shout|mad|angry)/i.test(t)
  const reflection = demo?.reflection || (mentionsUse ? "You're feeling a strong pull toward relief right now." : "You're dealing with something that's weighing on you.")
  const validation = demo?.validation || (mentionsConflict ? "After conflict, wanting quick relief is a very human reaction." : "Wanting fast relief when you're stressed is understandable.")
  const follow = isShort ? (mentionsUse ? "What just happened that's fueling this urge, and what's your goal—avoid, cut down, or ride it out?" : "Tell me a bit more about what's going on and what you'd like help with right now.") : ""
  return `${reflection} ${validation}${follow ? ' ' + follow : ''}`
}

// Date helpers for the empty state
function getTodayLabel() {
  const d = new Date()
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
}

export default function AdvicePage() {
  const [mode] = useState<'advice' | 'chat'>('advice')
  const [scenarioId, setScenarioId] = useState<string>('')
  const [input, setInput] = useState<string>('')
  const [status, setStatus] = useState<'idle' | 'thinking' | 'streaming' | 'done'>('idle')
  const [responseText, setResponseText] = useState('')
  const [messages, setMessages] = useState<Msg[]>([])
  const [lastKind, setLastKind] = useState<'FOLLOWUP' | 'ADVICE' | null>(null)
  const [phase, setPhase] = useState<Phase>('NEED_CONTEXT')
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [askPlan, setAskPlan] = useState<boolean>(false)
  const [planText, setPlanText] = useState<string>('')
  const [showInstr, setShowInstr] = useState(false)
  const [showScenarioPicker, setShowScenarioPicker] = useState(false)
  const [isV1Enabled, setIsV1Enabled] = useState(true)
  const [isRoleplayEnabled] = useState(false)
  const [roleplayMode, setRoleplayMode] = useState(false)
  const [availableRoleplays] = useState<RoleplayMeta[]>([])
  const [currentPlan, setCurrentPlan] = useState<PersonalizedPlan | null>(null)
  const [showPlanCTA, setShowPlanCTA] = useState(false)
  const [recentCoachTags, setRecentCoachTags] = useState<Array<{ type: string; value: string; confidence: number }>>([])
  const [error, setError] = useState<string | null>(null)

  const dateLabel = useMemo(() => getTodayLabel(), [])
    
  useEffect(() => {
    document.title = "CMC Sober Coach"
    const seen = typeof window !== 'undefined' && window.localStorage.getItem('advice_seen')
    if (!seen) {
      setShowInstr(true)
      try { window.localStorage.setItem('advice_seen', '1') } catch { }
    }
  }, [])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('v1') === '0') setIsV1Enabled(false)
  }, [])

  const isBusy = status === 'thinking' || status === 'streaming'
  const demo = useMemo(() => (scenarioId ? demoScenarios[scenarioId] : null), [scenarioId])
  const showCrisis = looksCrisis(input)

  const onPickDemo = (id: string) => {
    setScenarioId(id)
    setInput(demoScenarios[id].text)
    setMessages([])
    setLastKind(null)
    setSelectedAction(null)
    setAskPlan(false)
    setPlanText('')
    setPhase('NEED_CONTEXT')
    setShowScenarioPicker(false)
  }

  function cleanActionLabel(a: string) {
    const parts = a.split(':')
    return parts.length > 1 ? parts.slice(1).join(':').trim() : a.trim()
  }

  const paneMessages = useMemo(() => {
    const base = messages.map((m, i) => ({ id: String(i), role: m.role as 'user' | 'assistant', content: m.text }))
    if (status === 'thinking') base.push({ id: 'thinking', role: 'assistant', content: 'Thinking…' })
    else if (status === 'streaming') base.push({ id: 'stream', role: 'assistant', content: responseText + '▌' })
    return base
  }, [messages, status, responseText])

  const canShowButtons = mode === 'advice' && phase === 'SUGGEST_OPTIONS' && !showCrisis

  async function generateAdvice() {
    if (!input.trim()) return
    setMessages(prev => [...prev, { role: 'user', text: input }])
    const localInput = input
    setInput('')
    const nextHistory = [...messages, { role: 'user' as const, text: localInput }]
    setSelectedAction(null)
    setAskPlan(false)
    setPlanText('')

    if (isV1Enabled && showPlanCTA && isAffirmative(localInput)) {
      await handlePlanRequest()
      return
    }

    setResponseText('')
    setLastKind(null)
    setStatus('thinking')
    await sleep(250)
    setStatus('streaming')

    const nextPhase = inferPhase(nextHistory, localInput)
    setPhase(nextPhase)

    let detected: 'FOLLOWUP' | 'ADVICE' | null = null
    let assembled = ''

    try {
      if (USE_OPENAI) {
        const historyPayload = nextHistory.map(m => ({ role: m.role, content: m.text }))
        const res = await fetch('/api/advice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: localInput,
            history: historyPayload,
            scenarioId: scenarioId || null,
            phase: nextPhase,
            coachTags: isV1Enabled ? recentCoachTags : undefined,
          }),
        })
        if (!res.ok || !res.body) throw new Error('No stream')
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          setResponseText(prev => prev + chunk)
          assembled += chunk
        }
      } else {
        throw new Error('offline')
      }
    } catch {
      setError('Sorry, I encountered an error. Please try again.')
      setStatus('done')
      return
    }

    const finalText = (assembled || responseText).trim()
    if (!detected) detected = nextPhase === 'SUGGEST_OPTIONS' ? 'ADVICE' : 'FOLLOWUP'
    setStatus('done')
    setLastKind(detected)
    setMessages(prev => [...prev, { role: 'assistant', text: finalText, kind: detected || undefined }])
    setResponseText('')

    if (isV1Enabled) {
      await postToEventsAPI(nextHistory, finalText)
      checkForPlanCTA(finalText)
    }
  }

  async function postToEventsAPI(history: Msg[], assistantResponse: string) {
    try {
      const messagesPayload = [
        ...history.map(m => ({ role: m.role, content: m.text })),
        { role: 'assistant' as const, content: assistantResponse },
      ]
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesPayload }),
        })
      if (response.ok) {
        const data = await response.json()
        if (data.events?.length > 0) {
          const allTags = data.events.flatMap((e: CoachEvent) => e.tags)
          setRecentCoachTags(allTags)
          const highConf = data.events.filter((e: CoachEvent) => e.confidence >= 0.6)
          if (highConf.length >= 2 && messages.length >= 4) {
            setTimeout(() => setShowPlanCTA(true), 2000)
          }
        }
      }
    } catch { }
  }

  function checkForPlanCTA(response: string) {
    if (/\b(would it be helpful if i suggest a plan|would you like me to suggest a plan|shall i create a plan)\b/i.test(response)) {
      setShowPlanCTA(true)
    }
  }

  async function handlePlanRequest() {
    try {
      setShowPlanCTA(false)
      setStatus('thinking')
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages.map(m => ({ role: m.role, content: m.text })) }),
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.plan) {
          setCurrentPlan(data.plan)
          setMessages(prev => [...prev, {
            role: 'assistant',
            text: `I've created a personalized plan for you based on our conversation. It includes ${data.plan.actions.length} specific actions tailored to what you've shared.`,
            kind: 'ADVICE',
          }])
        }
      }
      setStatus('idle')
    } catch {
      setStatus('idle')
      setShowPlanCTA(true)
    }
  }

  const hasMessages = messages.length > 0 || status === 'thinking' || status === 'streaming'

  return (
    <div
      className="h-dvh flex flex-col relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* ── Gradient wash: visible in both empty and message state, stronger when empty ── */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: 'linear-gradient(to bottom, transparent 30%, rgba(232,228,255,0.28) 65%, rgba(255,180,163,0.22) 100%)',
          opacity: hasMessages ? 0.4 : 1,
        }}
      />

      {/* ── Minimal header (only when there are messages) ── */}
      {hasMessages && (
        <header
          className="relative z-10 flex-shrink-0 flex items-center h-14 px-4 max-w-lg mx-auto w-full"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center gap-2 flex-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, var(--cmc-teal-500), var(--cmc-teal-700))' }}
            >
              C
          </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              CMC Coach
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* Clear chat */}
            {messages.length > 0 && (
                <button
                type="button"
                onClick={() => {
                  setMessages([])
                  setInput('')
                  setStatus('idle')
                  setPhase('NEED_CONTEXT')
                  setCurrentPlan(null)
                  setShowPlanCTA(false)
                  setError(null)
                }}
                className="flex items-center justify-center w-9 h-9 rounded-full"
                style={{ color: 'var(--text-tertiary)', background: 'rgba(0,0,0,0.04)' }}
                aria-label="New conversation"
                title="New conversation"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                </button>
            )}
                <button
              type="button"
              onClick={() => setShowInstr(true)}
              className="flex items-center justify-center w-9 h-9 rounded-full"
              style={{ color: 'var(--text-tertiary)', background: 'rgba(0,0,0,0.04)' }}
              aria-label="Instructions"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
                </button>
              </div>
        </header>
      )}

      {/* ── Main area ── */}
      <div className="flex-1 min-h-0 relative">
        {!hasMessages ? (
          /* ── Empty state (Ash-like) ── */
          <div
            className="absolute inset-0 flex flex-col items-center justify-center px-6 fade-in"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            {/* Date */}
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-8"
              style={{ color: 'var(--text-tertiary)', letterSpacing: '0.12em' }}
            >
              {dateLabel}
            </p>

            {/* Brand mark */}
            <div className="mb-6" style={{ opacity: 0.35 }}>
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="26" cy="20" r="6" stroke="var(--cmc-teal-600)" strokeWidth="1.5" fill="none" />
                <line x1="26" y1="26" x2="26" y2="44" stroke="var(--cmc-teal-600)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="18" y1="32" x2="26" y2="38" stroke="var(--cmc-teal-600)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="34" y1="30" x2="26" y2="36" stroke="var(--cmc-teal-600)" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="26" cy="20" r="3" fill="var(--cmc-teal-400)" opacity="0.6" />
              </svg>
            </div>

            {/* Prompt */}
            <h2
              className="text-2xl font-semibold text-center mb-2 text-wrap-anywhere"
              style={{ color: 'var(--text-primary)', lineHeight: 1.3 }}
            >
              What's on your mind?
            </h2>
            <p
              className="text-sm text-center max-w-xs text-wrap-anywhere"
              style={{ color: 'var(--text-tertiary)', lineHeight: 1.6 }}
            >
              Share what you're going through and I'll listen.
            </p>
          </div>
        ) : (
          /* ── Message list ── */
          <div className="absolute inset-0 overflow-y-auto chat-messages px-4 pb-4 pt-2">
            <div className="max-w-lg mx-auto">
              <MessageList messages={paneMessages} />

              {/* Inline: crisis warning */}
          {looksCrisis(input) && (
                <div
                  className="mt-4 p-4 rounded-2xl text-sm leading-relaxed text-wrap-anywhere slide-up"
                  style={{ background: 'rgba(254,226,226,0.9)', color: '#991B1B', border: '1px solid rgba(252,165,165,0.5)' }}
                >
              {CRISIS_TEXT}
            </div>
          )}

              {/* Inline: plan CTA */}
          {isV1Enabled && showPlanCTA && !currentPlan && (
                <div
                  className="mt-4 p-4 rounded-2xl slide-up"
                  style={{ background: '#F0FDF4', border: '1px solid rgba(134,239,172,0.5)' }}
                >
                  <p className="text-sm font-semibold mb-1" style={{ color: '#166534' }}>Ready for a personalized plan?</p>
                  <p className="text-xs mb-3 leading-relaxed" style={{ color: '#15803D' }}>
                    Based on our conversation, I can create a customized action plan with specific steps tailored to your situation.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePlanRequest}
                      disabled={status === 'thinking'}
                      className="px-4 py-2 rounded-full text-sm font-semibold text-white disabled:opacity-50 min-h-[40px]"
                      style={{ background: '#16A34A' }}
                    >
                      {status === 'thinking' ? 'Creating…' : 'Yes, create my plan'}
                    </button>
                    <button
                      onClick={() => setShowPlanCTA(false)}
                      className="px-4 py-2 rounded-full text-sm font-medium min-h-[40px]"
                      style={{ background: 'white', color: '#15803D', border: '1.5px solid rgba(134,239,172,0.7)' }}
                    >
                      Not now
                    </button>
              </div>
            </div>
          )}

              {/* Inline: personalized plan */}
          {isV1Enabled && currentPlan && (
                <div
                  className="mt-4 p-4 rounded-2xl slide-up"
                  style={{ background: '#EFF6FF', border: '1px solid rgba(147,197,253,0.5)' }}
                >
              <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm font-semibold" style={{ color: '#1E3A5F' }}>Your Personalized Plan</h3>
                <button
                  onClick={() => setCurrentPlan(null)}
                      className="text-sm"
                      style={{ color: '#3B82F6' }}
                  aria-label="Close plan"
                >
                  ✕
                </button>
              </div>
                  <p className="text-sm mb-3 leading-relaxed text-wrap-anywhere" style={{ color: '#1E40AF' }}>{currentPlan.summary}</p>
              {(['immediate', 'short-term', 'long-term'] as const).map(category => {
                    const acts = currentPlan.actions.filter(a => a.category === category)
                    if (!acts.length) return null
                    const emoji = category === 'immediate' ? '⚡' : category === 'short-term' ? '📅' : '🎯'
                    const label = category === 'immediate' ? 'Right Now' : category === 'short-term' ? 'This Week' : 'Long-term'
                return (
                      <div key={category} className="mb-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#3B82F6' }}>{emoji} {label}</p>
                        <div className="space-y-2">
                          {acts.map(action => (
                            <div key={action.id} className="bg-white rounded-xl p-3 text-wrap-anywhere" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                              <p className="text-xs font-semibold mb-0.5" style={{ color: '#1E3A5F' }}>{action.title.replace(/\*\*/g, '')}</p>
                              <p className="text-[11px] leading-relaxed" style={{ color: '#374151' }}>{action.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
                  <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(147,197,253,0.4)' }}>
                  <button
                    onClick={() => {
                        setMessages(prev => [...prev, { role: 'assistant', text: "Great! I've noted your plan. Which action would you like to start with?", kind: 'FOLLOWUP' }])
                      setCurrentPlan(null)
                    }}
                      className="flex-1 py-2 rounded-full text-sm font-semibold text-white"
                      style={{ background: '#3B82F6' }}
                  >
                    Accept & Continue
                  </button>
                  <button
                    onClick={() => setCurrentPlan(null)}
                      className="px-4 py-2 rounded-full text-sm font-medium"
                      style={{ background: 'white', color: '#3B82F6', border: '1.5px solid rgba(147,197,253,0.7)' }}
                  >
                    Dismiss
                  </button>
              </div>
            </div>
          )}

              {/* Inline: action buttons */}
          {canShowButtons && demo?.actions?.length ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--text-tertiary)' }}>Choose an approach</p>
              {demo.actions.map((a, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedAction(a); setAskPlan(true) }}
                      className="w-full text-left px-4 py-3 rounded-2xl text-sm font-medium transition-all slide-up"
                      style={{
                        background: 'white',
                        color: 'var(--text-primary)',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        animationDelay: `${idx * 60}ms`,
                      }}
                >
                  {cleanActionLabel(a)}
                </button>
              ))}
            </div>
          ) : null}

              {/* Inline: plan this action */}
          {askPlan && selectedAction && (
                <div
                  className="mt-4 p-4 rounded-2xl slide-up"
                  style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                >
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Plan this step?</p>
                  <p className="text-sm mb-3 text-wrap-anywhere" style={{ color: 'var(--text-secondary)' }}>
                    You chose: <span className="font-medium">{cleanActionLabel(selectedAction)}</span>
                  </p>
              <div className="space-y-2">
                <input
                      className="w-full px-4 py-2.5 rounded-xl text-sm"
                      style={{ background: 'rgba(0,0,0,0.04)', border: 'none', outline: 'none', color: 'var(--text-primary)' }}
                      placeholder="First small step…"
                  value={planText}
                  onChange={(e) => setPlanText(e.target.value)}
                />
                    <div className="flex gap-2">
                      <button onClick={() => setAskPlan(false)} className="px-4 py-2 rounded-full text-sm" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)' }}>No thanks</button>
                  <button
                    onClick={() => {
                          const text = `Great — let's make it doable. First step: ${planText || '⟨define a first step⟩'}. When will you do it, and what might get in the way?`
                      setMessages(prev => [...prev, { role: 'assistant', text }])
                      setAskPlan(false)
                      setSelectedAction(null)
                      setPlanText('')
                    }}
                        className="flex-1 py-2 rounded-full text-sm font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg, var(--cmc-teal-500), var(--cmc-teal-700))' }}
                  >
                    Add to chat
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
          </div>
        )}
      </div>

      {/* ── Bottom area: errors + composer ── */}
      <div
        className="relative z-10 flex-shrink-0 max-w-lg mx-auto w-full"
        style={{ padding: '8px 16px 12px' }}
      >
        {/* Error banner */}
        {error && (
          <div
            className="mb-3 px-4 py-3 rounded-2xl flex items-start justify-between gap-2 slide-up"
            style={{ background: 'rgba(254,226,226,0.9)', border: '1px solid rgba(252,165,165,0.5)' }}
          >
            <p className="text-sm flex-1 text-wrap-anywhere" style={{ color: '#991B1B' }}>{error}</p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => { setError(null); void generateAdvice() }}
                className="text-xs font-semibold"
                style={{ color: '#991B1B' }}
              >
                Retry
              </button>
              <button onClick={() => setError(null)} className="text-xs" style={{ color: '#991B1B' }}>✕</button>
            </div>
          </div>
        )}

        {/* Composer */}
        <MessageComposer
          value={input}
          onChange={setInput}
          onSend={(v) => { setInput(v); void generateAdvice() }}
          disabled={isBusy}
          isSending={status === 'thinking' || status === 'streaming'}
          placeholder="What's on your mind?"
        />

        {/* Demo scenario picker (subtle, below composer) */}
        <div className="mt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setShowScenarioPicker(p => !p)}
            className="text-[11px] font-medium transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {showScenarioPicker ? 'Hide scenarios ↑' : 'Try a demo scenario →'}
          </button>
          {messages.length === 0 && (
            <button
              type="button"
              onClick={() => setShowInstr(true)}
              className="text-[11px] font-medium"
              style={{ color: 'var(--text-tertiary)' }}
            >
              How it works
            </button>
          )}
        </div>

        {showScenarioPicker && (
          <div
            className="mt-2 p-2 rounded-2xl slide-up"
            style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
          >
            <select
              value={scenarioId}
              onChange={(e) => onPickDemo(e.target.value)}
              disabled={isBusy}
              className="w-full px-3 py-2.5 text-sm rounded-xl disabled:opacity-50"
              style={{ background: 'rgba(0,0,0,0.04)', border: 'none', outline: 'none', color: 'var(--text-primary)' }}
              aria-label="Choose a demo scenario"
            >
              <option value="">Pick a scenario…</option>
              <option value="1">Evening loneliness after conflict</option>
              <option value="2">Stress at work with overwhelm</option>
              <option value="3">Anxiety before a social event</option>
              <option value="4">Difficulty sleeping due to worry</option>
              <option value="5">Feeling unmotivated to exercise</option>
              <option value="6">Struggling with healthy eating</option>
              <option value="7">Difficulty managing anger</option>
              <option value="8">Feeling isolated and disconnected</option>
            </select>
          </div>
        )}
      </div>

      <NavSpacer />
      <BottomNav />

      {/* Instructions modal */}
      {showInstr && (
        <GlobalInstructionsModal
          open={true}
          title="How this works"
          onClose={() => setShowInstr(false)}
        >
          <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              Share what's going on and I'll respond with one thoughtful follow-up or reflection at a time.
            </p>
            <p>
              When I understand enough, I'll briefly summarize what I heard, ask if you'd like options, then offer a few evidence-based approaches (CBT, DBT, ACT, Mindfulness, Self-Compassion). You can plan a first small step from there.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>One question per turn.</li>
              <li>No lists until you say yes.</li>
              <li>Warm, plain language — not clinical.</li>
            </ul>
            <p className="text-xs pt-2" style={{ color: 'var(--text-tertiary)', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              In an emergency, call 911. For suicidal thoughts, call or text 988 (24/7).
            </p>
          </div>
        </GlobalInstructionsModal>
      )}
    </div>
  )
}
