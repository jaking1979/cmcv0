'use client'

import { useEffect, useMemo, useState } from 'react'
import TopNav from '@/components/TopNav'
import GlobalInstructionsModal from '@/components/GlobalInstructionsModal'
import { ChatPane } from '@/components/chat'

type Msg = { role: 'user' | 'assistant'; text: string; kind?: 'FOLLOWUP' | 'ADVICE' }
type Phase = 'NEED_CONTEXT' | 'CLARIFY_GOAL' | 'SUMMARY_PERMISSION' | 'AWAIT_PERMISSION' | 'SUGGEST_OPTIONS'

// V1 types
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

const CRISIS_TEXT = `Thanks for telling me. I’m a behavior coach, not a clinician, and what you’re describing sounds like it needs immediate support. If you’re in danger, call 911. If you’re thinking about hurting yourself or feel suicidal, call or text 988 (or chat at 988lifeline.org) for 24/7 help.`

// ── Demo scenarios (unchanged)
const demoScenarios: Record<string, { title: string; text: string; reflection: string; validation: string; followUp: string; actions: string[] }> = {
  '1': {
    title: 'Evening Loneliness After Conflict',
    text: `Earlier today I argued with my brother over text, and now that it's evening and I'm home alone, I feel the urge to drink to quiet my frustration and loneliness. I skipped dinner and have been scrolling on my phone for the last hour.`,
    reflection: `You’re feeling alone and frustrated after your argument, and you notice the urge to numb out or distract yourself instead of feeling those emotions.`,
    validation: `It makes sense you’d want to withdraw and distract after a fight—anyone would feel unsettled and want relief in that situation.`,
    followUp: `If you didn’t have to wrestle with these feelings tonight, how would you want to spend your evening instead?`,
    actions: [
      '✅ Easiest: Do a brief grounding exercise to reconnect right now.',
      '💚 Values-based: Take a small step toward how you’d like your evening to look.',
      '🛡️ Preventive: Swap scrolling for a short, active, or creative task.',
      '🔄 Alt: Try a quick physical activity or something playful to shift your state.',
      '🎯 Bonus: Practice self-compassion—give yourself care, not criticism.',
    ],
  },
  '2': {
    title: 'Stress at Work with Overwhelm',
    text: `I’m overwhelmed with a big work deadline coming up. I put in extra hours but keep getting distracted and procrastinating. I’m worried I won’t finish and my boss will be disappointed.`,
    reflection: `You’re feeling overloaded and distracted, and it’s tough to focus under pressure right now.`,
    validation: `Given the looming deadline and your worries about disappointing your boss, it’s understandable you’d feel frazzled and stuck.`,
    followUp: `If the overwhelm was turned down a notch, what’s one tiny next step you could take on your project?`,
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
    text: `I’m anxious about going to a social event tonight. I worry I won’t know what to say or that people will judge me, and I’m tempted to cancel or avoid it.`,
    reflection: `You’re feeling nervous and uncertain, and avoiding the event seems safer than risking discomfort or judgment.`,
    validation: `It’s normal to worry about being judged in social situations—your reaction is completely understandable.`,
    followUp: `If you felt even a little more at ease, how would you want to show up at the event?`,
    actions: [
      '✅ Easiest: Try a calming breath before you go in.',
      '💚 Values-based: Remind yourself why connecting matters to you.',
      '🛡️ Preventive: Prepare a couple of conversation starters to lean on.',
      '🔄 Alt: Arrive a little early so you can settle in before it’s busy.',
      '🎯 Bonus: Recall a positive social memory to boost your confidence.',
    ],
  },
  '4': {
    title: 'Difficulty Sleeping Due to Worry',
    text: `I can’t sleep because my mind races with worries about my family and finances. I lie awake for hours and feel exhausted the next day.`,
    reflection: `Your mind is busy and restless, making it hard to settle down for sleep.`,
    validation: `It’s natural for stress to disrupt rest—there’s nothing wrong with you for having a noisy brain at night.`,
    followUp: `If your evenings felt a bit calmer, what would your ideal wind-down routine look like?`,
    actions: [
      '✅ Easiest: Do a short body scan or guided relaxation before bed.',
      '💚 Values-based: Choose one small ritual to signal “off-duty” to your brain.',
      '🛡️ Preventive: Power down screens 30–60 minutes before sleep.',
      '🔄 Alt: Jot down worries in a quick “brain dump” earlier in the evening.',
      '🎯 Bonus: Stick to a consistent sleep/wake schedule for a week.',
    ],
  },
  '5': {
    title: 'Feeling Unmotivated to Exercise',
    text: `I haven’t felt motivated to exercise lately. Even though I know it helps, I keep putting it off and making excuses. I feel guilty but can’t seem to get going.`,
    reflection: `You’re feeling stuck between wanting the benefits of movement and not having motivation show up.`,
    validation: `Motivation naturally comes and goes—it’s understandable to stall when you’re tired or stretched thin.`,
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
    text: `When I’m stressed or tired, I reach for junk food even though I want to eat better. I feel frustrated with myself for not making healthier choices.`,
    reflection: `You’re craving comfort and convenience, even though you want to care for your body in a different way.`,
    validation: `Turning to familiar foods under stress is human—change takes practice, not perfection.`,
    followUp: `If you felt a little more supported, what’s one small change that would make eating well easier this week?`,
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
    text: `Lately, small things set me off and I regret how I react. I want to handle my anger better but don’t know how.`,
    reflection: `You’re feeling flooded by strong emotions, and it’s tough to steer your reactions in the moment.`,
    validation: `When you’re stressed or feel unheard, anger is a natural response—new habits take practice over time.`,
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
    text: `I feel isolated and disconnected. Even when I’m around people, I don’t feel understood or supported, and it’s making me lonely and down.`,
    reflection: `You’re feeling lonely and longing for connection that feels real and meaningful.`,
    validation: `It’s natural to feel down when your need for connection isn’t met—many people struggle with this, and you’re not alone.`,
    followUp: `If you felt a bit more connected, what kinds of relationships or interactions would you want to nurture first?`,
    actions: [
      '✅ Easiest: Text or call someone you trust and share a bit of what’s real for you.',
      '💚 Values-based: Name the qualities you value in relationships and seek them out.',
      '🛡️ Preventive: Join a group or activity that matches your interests this month.',
      '🔄 Alt: Offer yourself active self-compassion as you build new connections.',
      '🎯 Bonus: Consider short-term support to boost social confidence and skills.',
    ],
  },
}

// ── Helpers
function looksCrisis(text: string) {
  const s = (text || '').toLowerCase()
  return ['suicide','suicidal','kill myself','end my life','self harm','self-harm','hurt myself','overdose'].some(k => s.includes(k)) || /\bod\b(?![a-z])/.test(s)
}

const goalMentioned = /(abstain|avoid(ing)?|quit|stop|not drink|cut\s*down|reduce|moderate|stay sober|skip(\s+it)?)/i
const isAffirmative = (s: string) => /\b(yes|yep|yeah|ok(ay)?|sure|please|sounds good|do it|go ahead)\b/i.test(s)

function inferPhase(
  history: { role: 'user'|'assistant'; text: string; kind?: 'FOLLOWUP'|'ADVICE' }[],
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
  const t = (input || '').toLowerCase();
  const isShort = t.length < 60;
  const mentionsUse = /(drink|use|get high|relapse|slip|urge|craving)/i.test(t);
  const mentionsConflict = /(fight|argu(e|ment)|conflict|yell|shout|mad|angry)/i.test(t);

  const reflection = demo?.reflection || (
    mentionsUse ? "You’re feeling a strong pull toward relief right now."
                : "You’re dealing with something that’s weighing on you."
  );

  const validation = demo?.validation || (
    mentionsConflict ? "After conflict, wanting quick relief is a very human reaction."
                     : "Wanting fast relief when you’re stressed is understandable."
  );

  const follow = isShort
    ? (mentionsUse
        ? "What just happened that’s fueling this urge, and what’s your goal—avoid, cut down, or ride it out?"
        : "Tell me a bit more about what’s going on and what you’d like help with right now.")
    : "";

  return `${reflection} ${validation}${follow ? ' ' + follow : ''}`;
}

// ── Component
export default function AdvicePage() {
  const [mode, setMode] = useState<'advice'|'chat'>('advice')
  const [scenarioId, setScenarioId] = useState<string>('')

  const [input, setInput] = useState<string>('')
  const [status, setStatus] = useState<'idle'|'thinking'|'streaming'|'done'>('idle')
  const [responseText, setResponseText] = useState('')

  const [messages, setMessages] = useState<Msg[]>([])
  const [lastKind, setLastKind] = useState<'FOLLOWUP' | 'ADVICE' | null>(null)
  const [phase, setPhase] = useState<Phase>('NEED_CONTEXT')

  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [askPlan, setAskPlan] = useState<boolean>(false)
  const [planText, setPlanText] = useState<string>('')

  const [showInstr, setShowInstr] = useState(false)

  // V1 features
  const [isV1Enabled, setIsV1Enabled] = useState(false)
  const [isRoleplayEnabled, setIsRoleplayEnabled] = useState(false)
  const [roleplayMode, setRoleplayMode] = useState(false)
  const [availableRoleplays, setAvailableRoleplays] = useState<RoleplayMeta[]>([])
  const [currentPlan, setCurrentPlan] = useState<PersonalizedPlan | null>(null)
  const [showPlanCTA, setShowPlanCTA] = useState(false)
  const [recentCoachTags, setRecentCoachTags] = useState<Array<{ type: string; value: string; confidence: number }>>([])
  const [showCoachDebug, setShowCoachDebug] = useState(false)

  // Auto-open instructions once (same behavior as onboarding)
  useEffect(() => {
    const seen = typeof window !== 'undefined' && window.localStorage.getItem('advice_seen')
    if (!seen) {
      setShowInstr(true)
      try { window.localStorage.setItem('advice_seen', '1') } catch {}
    }
  }, [])

  // V1: Check feature flags and load roleplays
  useEffect(() => {
    // Check for V1 feature flags (client-side detection)
    const urlParams = new URLSearchParams(window.location.search)
    const v1Param = urlParams.get('v1')
    if (v1Param === '1') {
      setIsV1Enabled(true)
    }

    // Check for roleplay feature
    const roleplayParam = urlParams.get('roleplays')
    if (roleplayParam === '1') {
      setIsRoleplayEnabled(true)
      loadAvailableRoleplays()
    }

    // Check for debug mode
    const debugParam = urlParams.get('debug')
    if (debugParam === '1') {
      setShowCoachDebug(true)
    }
  }, [])

  // V1: Load available roleplays
  async function loadAvailableRoleplays() {
    try {
      // For now, use mock data. In real implementation, this would call an API
      const mockRoleplays: RoleplayMeta[] = [
        { id: 'dbt-mindfulness', title: 'DBT Mindfulness Practice', tags: ['dbt', 'mindfulness'] },
        { id: 'self-compassion-break', title: 'Self-Compassion Break', tags: ['self-compassion'] },
        { id: 'cbt-thought-challenge', title: 'CBT Thought Challenge', tags: ['cbt', 'cognitive'] }
      ]
      setAvailableRoleplays(mockRoleplays)
    } catch (error) {
      console.error('Failed to load roleplays:', error)
    }
  }

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
  }

  function cleanActionLabel(a: string) {
    const parts = a.split(':')
    return parts.length > 1 ? parts.slice(1).join(':').trim() : a.trim()
  }

  const paneMessages = useMemo(() => {
    const base = messages.map((m, i) => ({ id: String(i), role: m.role as any, content: m.text }));
    if (status === 'thinking') {
      base.push({ id: 'thinking', role: 'assistant' as const, content: 'Thinking…' });
    } else if (status === 'streaming') {
      base.push({ id: 'stream', role: 'assistant' as const, content: responseText + '▌' });
    }
    return base;
  }, [messages, status, responseText]);

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

    // V1: Check if this is a "yes" response to a plan question
    if (isV1Enabled && showPlanCTA && isAffirmative(localInput)) {
      // User said yes to plan - trigger plan generation directly
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
      detected = nextPhase === 'SUGGEST_OPTIONS' ? 'ADVICE' : 'FOLLOWUP'
      const paragraph = buildLocalAdvice(localInput, demo || undefined)
      assembled = paragraph
      for (let i = 0; i < paragraph.length; i += 3) {
        setResponseText(prev => prev + paragraph.slice(i, i + 3))
        await sleep(12)
      }
    }

    const finalText = (assembled || responseText).trim()
    if (!detected) detected = nextPhase === 'SUGGEST_OPTIONS' ? 'ADVICE' : 'FOLLOWUP'
    setStatus('done')
    setLastKind(detected)
    setMessages(prev => [...prev, { role: 'assistant', text: finalText, kind: detected || undefined }])
    setResponseText('')

    // V1: Post to events API and check for plan CTA
    if (isV1Enabled) {
      await postToEventsAPI(nextHistory, finalText)
      checkForPlanCTA(finalText)
    }
  }

  // V1: Post conversation to events API
  async function postToEventsAPI(history: Msg[], assistantResponse: string) {
    try {
      const messagesPayload = [
        ...history.map(m => ({ 
          role: m.role, 
          content: m.text 
        })),
        { 
          role: 'assistant' as const, 
          content: assistantResponse 
        }
      ]

      console.log('Posting to events API:', messagesPayload)

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesPayload
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Coach events logged:', data.events)
        
        // Extract and store coach tags for future API calls
        if (data.events && data.events.length > 0) {
          const allTags = data.events.flatMap((e: CoachEvent) => e.tags)
          setRecentCoachTags(allTags)
          
          // Check if we have high-confidence coach signals and should offer a plan
          const highConfidenceEvents = data.events.filter((e: CoachEvent) => e.confidence >= 0.6)
          if (highConfidenceEvents.length >= 2 && messages.length >= 4) {
            // Multiple coaches activated with high confidence - good time to offer a plan
            setTimeout(() => setShowPlanCTA(true), 2000)
          }
        }
      }
    } catch (error) {
      console.error('Failed to post to events API:', error)
    }
  }

  // V1: Check if assistant response contains plan CTA
  function checkForPlanCTA(response: string) {
    if (/\b(would it be helpful if i suggest a plan|would you like me to suggest a plan|shall i create a plan)\b/i.test(response)) {
      setShowPlanCTA(true)
    }
  }

  // V1: Handle plan request
  async function handlePlanRequest() {
    try {
      setShowPlanCTA(false)
      setStatus('thinking')
      
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({ 
            role: m.role, 
            content: m.text 
          }))
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.plan) {
          setCurrentPlan(data.plan)
          
          // Add a message to chat showing plan was generated
          setMessages(prev => [...prev, {
            role: 'assistant',
            text: `I've created a personalized plan for you based on our conversation. It includes ${data.plan.actions.length} specific actions tailored to what you've shared.`,
            kind: 'ADVICE'
          }])
        }
      }
      setStatus('idle')
    } catch (error) {
      console.error('Failed to generate plan:', error)
      setStatus('idle')
      setShowPlanCTA(true) // Show CTA again if failed
    }
  }

  // V1: Start roleplay
  async function startRoleplay(roleplayId: string) {
    try {
      const response = await fetch(`/api/roleplays/${roleplayId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `session_${Date.now()}`
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setRoleplayMode(true)
          setMessages([{ role: 'assistant', text: data.firstTurn.content, kind: 'FOLLOWUP' }])
        }
      }
    } catch (error) {
      console.error('Failed to start roleplay:', error)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopNav title="🧭 Get Advice" onShowInstructions={() => setShowInstr(true)} />

      <main className="flex-1 flex flex-col px-3 sm:px-4 py-4 max-w-3xl mx-auto w-full min-h-0">
        <div className="flex-shrink-0 mb-4">
          <h1 className="text-xl sm:text-2xl font-semibold mb-2 text-gray-900">🧭 Get Advice</h1>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed text-wrap-anywhere">
            Share what's going on or pick a demo. If I need more context, I'll reflect one thing I heard and ask one question. When it's clear, I'll give a brief summary, ask if you want options, then offer a few evidence‑based choices. You can plan a first small step if you want.
          </p>

          <div className="flex gap-2 mb-4 flex-wrap">
            <select
              value={scenarioId}
              onChange={(e) => onPickDemo(e.target.value)}
              disabled={isBusy}
              className="flex-1 min-w-[200px] px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              aria-label="Choose a demo scenario"
            >
              <option value="">Use a demo scenario…</option>
              <option value="1">#1 Evening Loneliness After Conflict</option>
              <option value="2">#2 Stress at Work with Overwhelm</option>
              <option value="3">#3 Anxiety Before Social Event</option>
              <option value="4">#4 Difficulty Sleeping Due to Worry</option>
              <option value="5">#5 Feeling Unmotivated to Exercise</option>
              <option value="6">#6 Struggling with Healthy Eating</option>
              <option value="7">#7 Difficulty Managing Anger</option>
              <option value="8">#8 Feeling Isolated and Disconnected</option>
            </select>
            
            {/* V1: Manual plan trigger (for testing) */}
            {isV1Enabled && messages.length >= 2 && !currentPlan && (
              <button
                onClick={() => setShowPlanCTA(true)}
                disabled={isBusy || showPlanCTA}
                className="px-3 py-2 text-xs bg-green-50 text-green-700 border border-green-300 rounded-md hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Manually trigger plan suggestion"
              >
                💡 Suggest Plan
              </button>
            )}
          </div>

          {/* V1: Coach Debug Panel */}
          {isV1Enabled && showCoachDebug && recentCoachTags.length > 0 && (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-purple-900 uppercase tracking-wide">
                  🔬 Active Coaches (Debug Mode)
                </h3>
                <button
                  onClick={() => setShowCoachDebug(false)}
                  className="text-purple-600 hover:text-purple-800 text-xs"
                >
                  Hide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentCoachTags.slice(-8).map((tag, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-purple-200 rounded-md text-xs"
                  >
                    <span className="font-medium text-purple-900">{tag.value}</span>
                    <span className="text-purple-600">({Math.round(tag.confidence * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* V1: Roleplay Mode Toggle */}
          {isRoleplayEnabled && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-blue-900">Practice a Scenario</h3>
                  <p className="text-xs text-blue-700">Try a structured roleplay to practice skills</p>
                </div>
                <button
                  onClick={() => setRoleplayMode(!roleplayMode)}
                  className={`px-3 py-1 text-xs rounded-md ${
                    roleplayMode 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-blue-600 border border-blue-600'
                  }`}
                >
                  {roleplayMode ? 'Exit Roleplay' : 'Start Roleplay'}
                </button>
              </div>
              
              {roleplayMode && (
                <div className="mt-3">
                  <select
                    onChange={(e) => e.target.value && startRoleplay(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    defaultValue=""
                  >
                    <option value="">Choose a roleplay scenario...</option>
                    {availableRoleplays.map(rp => (
                      <option key={rp.id} value={rp.id}>
                        {rp.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <ChatPane
            className="mb-3"
            messages={paneMessages}
            onSend={(v) => { setInput(v); void generateAdvice(); }}
            isSending={isBusy}
            inputValue={input}
            onInputChange={setInput}
          />

          <div className="flex gap-2 mt-2 mb-4">
            <button
              onClick={() => { if (!isBusy) { setMode('advice') } }}
              disabled={isBusy}
              className={`px-3 py-2 rounded-md border ${mode==='advice' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 border-blue-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >Get Advice</button>
            <button
              onClick={() => { if (!isBusy) { setMode('chat') } }}
              disabled={isBusy}
              className={`px-3 py-2 rounded-md border ${mode==='chat' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800 border-gray-800'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >Just Chat</button>
          </div>

          {looksCrisis(input) && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg whitespace-pre-wrap">
              {CRISIS_TEXT}
            </div>
          )}

          {/* V1: Plan CTA */}
          {isV1Enabled && showPlanCTA && !currentPlan && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-xl">💡</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-900 mb-1">
                    Ready for a personalized plan?
                  </p>
                  <p className="text-xs text-green-700 mb-3 leading-relaxed">
                    Based on our conversation, I can create a customized action plan with specific steps tailored to your situation.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePlanRequest}
                      disabled={status === 'thinking'}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 active:bg-green-800 transition-colors min-h-[44px] disabled:opacity-50"
                    >
                      {status === 'thinking' ? 'Creating plan...' : 'Yes, create my plan'}
                    </button>
                    <button
                      onClick={() => setShowPlanCTA(false)}
                      className="px-4 py-2 bg-white text-green-700 border border-green-600 text-sm font-medium rounded-md hover:bg-green-50 active:bg-green-100 transition-colors min-h-[44px]"
                    >
                      Not right now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* V1: Personalized Plan Display */}
          {isV1Enabled && currentPlan && (
            <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-blue-900 mb-1">📋 Your Personalized Plan</h3>
                  <p className="text-xs text-blue-600">Confidence: {Math.round(currentPlan.confidence * 100)}%</p>
                </div>
                <button
                  onClick={() => setCurrentPlan(null)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-bold"
                  aria-label="Close plan"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-sm text-gray-800 mb-4 leading-relaxed text-wrap-anywhere">{currentPlan.summary}</p>
              
              {/* Group actions by category */}
              {(['immediate', 'short-term', 'long-term'] as const).map(category => {
                const categoryActions = currentPlan.actions.filter(a => a.category === category)
                if (categoryActions.length === 0) return null
                
                const categoryEmoji = category === 'immediate' ? '⚡' : category === 'short-term' ? '📅' : '🎯'
                const categoryLabel = category === 'immediate' ? 'Immediate Actions' : 
                                    category === 'short-term' ? 'Short-term Actions' : 'Long-term Goals'
                
                return (
                  <div key={category} className="mb-4">
                    <h4 className="text-xs font-semibold text-blue-800 mb-2 uppercase tracking-wide">
                      {categoryEmoji} {categoryLabel}
                    </h4>
                    <div className="space-y-3">
                      {categoryActions.map((action, index) => (
                        <div key={action.id} className="bg-white rounded-md p-3 border border-blue-100">
                          <div className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-medium">
                              {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <div className="text-sm font-semibold text-gray-900 text-wrap-anywhere">
                                  {action.title.replace(/\*\*/g, '')}
                                </div>
                                <span className={`
                                  text-xs px-2 py-0.5 rounded-full flex-shrink-0
                                  ${action.difficulty === 'easy' ? 'bg-green-100 text-green-700' : 
                                    action.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 
                                    'bg-orange-100 text-orange-700'}
                                `}>
                                  {action.difficulty}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed text-wrap-anywhere">
                                {action.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              
              <div className="mt-4 pt-3 border-t border-blue-200 flex gap-2">
                <button
                  onClick={() => {
                    // Accept plan - add follow-up message
                    setMessages(prev => [...prev, {
                      role: 'assistant',
                      text: "Great! I've noted your plan. Which action would you like to start with, or would you like to talk through any of them?",
                      kind: 'FOLLOWUP'
                    }])
                    setCurrentPlan(null)
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors min-h-[44px]"
                >
                  Accept & Continue
                </button>
                <button
                  onClick={() => setCurrentPlan(null)}
                  className="px-4 py-2 bg-white text-blue-600 border border-blue-600 text-sm font-medium rounded-md hover:bg-blue-50 active:bg-blue-100 transition-colors min-h-[44px]"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {canShowButtons && demo?.actions?.length ? (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demo.actions.map((a, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedAction(a); setAskPlan(true) }}
                  className="text-left px-3 py-2 rounded-md border bg-green-50 hover:bg-green-100"
                >
                  {cleanActionLabel(a)}
                </button>
              ))}
            </div>
          ) : null}

          {askPlan && selectedAction && (
            <div className="mt-4 p-3 border rounded-lg bg-white">
              <p className="mb-2 font-medium">Plan this action?</p>
              <p className="text-sm text-gray-700 mb-3">
                You chose: <span className="font-semibold">{cleanActionLabel(selectedAction)}</span>. Do you want help planning how to implement it?
              </p>
              <div className="flex gap-2 mb-3">
                <button onClick={() => setAskPlan(false)} className="px-3 py-2 border rounded-md">No thanks</button>
                <button onClick={() => setAskPlan(true)} className="px-3 py-2 border rounded-md bg-blue-600 text-white">Yes, help me plan</button>
              </div>
              <div className="space-y-2">
                <input
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="First small step"
                  value={planText}
                  onChange={(e) => setPlanText(e.target.value)}
                />
                <div className="text-right">
                  <button
                    onClick={() => {
                      const text = `Great — let’s make it doable. First step: ${planText || '⟨define a first step⟩'}. When will you do it, and what might get in the way?`
                      setMessages(prev => [...prev, { role: 'assistant', text }])
                      setAskPlan(false)
                      setSelectedAction(null)
                      setPlanText('')
                    }}
                    className="px-3 py-2 rounded-md bg-blue-600 text-white"
                  >
                    Add to chat
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showInstr && (
        <GlobalInstructionsModal
          open={true}
          title="How this page works"
          onClose={() => setShowInstr(false)}
        >
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              This page is a demo of the advice experience. Share your situation or pick a demo. I'll keep it conversational and practical.
            </p>
            <p>
              Flow: If I need more context, I'll reflect back a detail and ask one open question. When it's clear, I'll summarize briefly, ask permission, and offer a few evidence‑based options (CBT/DBT/ACT/Mindfulness/Self‑Compassion). You can plan a first small step if that helps.
            </p>
            <ul className="list-disc pl-5">
              <li>One question per turn.</li>
              <li>No lists of options until you say yes.</li>
              <li>Warm, plain language—no clinical advice.</li>
            </ul>
            
            {isV1Enabled && (
              <>
                <div className="pt-3 border-t border-gray-200">
                  <p className="font-semibold text-blue-900 mb-2">🚀 V1 Features Enabled</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li><strong>Multi-Coach Analysis:</strong> Behind the scenes, specialized coaches (DBT, Self-Compassion, CBT) analyze your conversation to identify helpful patterns.</li>
                    <li><strong>Personalized Plans:</strong> When enough context is gathered, you'll be offered a customized action plan with specific, prioritized steps.</li>
                    <li><strong>Contextual Responses:</strong> The AI adjusts its responses based on which coaching approaches are most relevant to your situation.</li>
                    <li><strong>Debug Mode:</strong> Add <code>?debug=1</code> to the URL to see which coaches are active.</li>
                  </ul>
                </div>
              </>
            )}
            
            <p className="text-gray-600 pt-3 border-t border-gray-200">
              If there's an emergency, call 911. For suicidal thoughts, call or text 988 (24/7), or chat at 988lifeline.org.
            </p>
          </div>
        </GlobalInstructionsModal>
      )}
    </div>
  )
}
