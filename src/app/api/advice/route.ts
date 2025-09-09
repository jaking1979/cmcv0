import { NextRequest } from 'next/server'

const t0 = Date.now()
function dbg(...args: any[]) { try { console.log('[advice]', ...args) } catch {} }

export const runtime = 'edge'


const MODEL = process.env.OPENAI_MODEL || 'gpt-4o'
// Allow-list chat models (fallback if env is misconfigured)
const ALLOWED_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4-turbo',
  'gpt-3.5-turbo',
]
function getModel() {
  const envModel = (process.env.OPENAI_MODEL || MODEL || '').trim()
  if (ALLOWED_MODELS.includes(envModel)) return envModel
  try { console.warn('[advice] Unsupported OPENAI_MODEL:', envModel, '— falling back to gpt-4o-mini') } catch {}
  return 'gpt-4o'
}

type Phase = 'NEED_CONTEXT' | 'CLARIFY_GOAL' | 'SUMMARY_PERMISSION' | 'AWAIT_PERMISSION' | 'SUGGEST_OPTIONS'

type ScenarioId =
  | 'evening-loneliness'
  | 'party-invite'
  | 'post-work-habit'
  | 'morning-regret'
  | 'social-media-trigger'
  | 'rainy-boredom'
  | 'family-pressure'
  | 'airport-delay'

function guessScenario(text: string): ScenarioId | null {
  const t = (text || '').toLowerCase()
  if (/(lonely|alone|evening|scroll(ing)?|skipped dinner|argument|fight\b)/.test(t)) return 'evening-loneliness'
  if (/(party|invite|saturday|friends\b|peer pressure|pressure to drink)/.test(t)) return 'party-invite'
  if (/(friday|after work|long week|habit|liquor cabinet)/.test(t)) return 'post-work-habit'
  if (/(slip(ped)?|regret|this morning|blew it)/.test(t)) return 'morning-regret'
  if (/(instagram|social media|photos|nostalgia|just one)/.test(t)) return 'social-media-trigger'
  if (/(rainy|bored|sunday|stuck at home|idle)/.test(t)) return 'rainy-boredom'
  if (/(family|aunt|uncle|toast|champagne|one sip)/.test(t)) return 'family-pressure'
  if (/(airport|flight|delay|terminal|vacation)/.test(t)) return 'airport-delay'
  return null
}

// ---------- Heuristics ----------
function hasEnoughContext(text: string) {
  const t = (text || '').toLowerCase().trim()

  // obvious short / minimal cases
  if (t.length < 60) return false
  if (/^\s*i (want|need|might)\b.*(drink|use|get high)/i.test(text)) return false

  // look for context signals
  const signals = [
    // time / temporal
    /\b(today|tonight|tomorrow|this (morning|afternoon|evening)|after work|weekend)\b/,
    // people
    /\b(wife|husband|partner|kids?|boss|friend|brother|sister|family|coworker)\b/,
    // place
    /\b(home|house|kitchen|bar|party|office|airport|car)\b/,
    // feelings / triggers
    /\b(angry|anxious|lonely|bored|stressed|guilty|ashamed|triggered|craving|urge)\b/,
    // goal/constraint keywords
    /\b(abstinen(t|ce)|cutting down|limit|goal|slip|relapse|stay sober|stay on track)\b/,
  ]

  let hits = 0
  for (const re of signals) if (re.test(t)) hits++
  // "enough" if we saw at least 2 signals and it's not ultra-short
  return hits >= 2
}

function wantsOptions(text: string) {
  const t = (text || '').toLowerCase().replace(/[—–]/g, '-').trim()
  const patterns: RegExp[] = [
    /\bwhat\s+(?:should|can|could)\s+i\s+do\b/,
    /\bwhat\s+do\s+i\s+do\b/,
    /\b(?:please\s*)?give\s+me\s+(?:something\s+to\s+do|something|an\s+idea|options?)\b/,
    /\bi\s+need\s+something\s+to\s+do\b/,
    /\b(?:please\s+)?help(?:\s+me)?\b/,
    /\bcan\s+you\s+help\b/,
    /\b(?:suggest(?:ion|ions)?|advice|options?|ideas?)\b/,
    /\b(?:skills?|tools?|tips?|strategy|strategies|technique|techniques|exercise|exercises)\b/,
    /\b(tell\s+me\s+what\s+to\s+do)\b/,
    /\b(i\s+need\s+help|help\s+now|please\s+help\s+now)\b/,
  ]
  return patterns.some((re) => re.test(t))
}

function hasAnyGoal(text: string) {
  const t = (text || '').toLowerCase()
  // explicit sobriety/cut-down goals or immediate state change goals
  return /\b(abstain|sober|stop( drinking| using)?|quit|cut(ting)? down|no (drink|alcohol)|stay on track|stick to my goal|not drink|skip (it|tonight)|stay sober)\b/.test(t)
    || /\b(calm|grounded|present|ride it out|get through (this|tonight)|cope|handle this|manage this)\b/.test(t)
}

function userApproved(text: string) {
  const t = (text || '').toLowerCase().trim()
  return /(^(yes|yep|yeah|sure|ok|okay)\b|\b(that would help|please|go ahead|sounds good|do it|let's do it|share them|share options|give me options)\b)/i.test(t)
}

function userDeclined(text: string) {
  const t = (text || '').toLowerCase().trim()
  return /(^(no|nah|nope)\b|\b(not now|not yet|hold on|wait|don't|do not)\b)/i.test(t)
}

// ---------- System Prompt ----------
function systemPrompt() {
  return [
    // High-priority do/don’t
    `Always respond in clear, grammatical, natural English. Keep it conversational and readable for a general audience (no clinical jargon).`,
    `You are CMC Sober Coach, an AI behavior coach (not a clinician).`,
    `Do NOT use generic sympathy lines. Never say: "you're carrying a lot here", "given your history", "what's happening today".`,
    `Ground each reply in 1–2 concrete details from the user's latest message. When natural, echo a short quoted fragment (2–6 words).`,
    `Do NOT invent specifics (no fights, relatives, days of week, places, routines) unless the user explicitly mentioned them in their most recent message.`,
    // Style & modalities
    `Use Motivational Interviewing (collaborative, evocative, non-pressuring). Secondary lenses: ACT, DBT, Self-Compassion, Mindfulness, CBT—choose what fits.`,
    `Tone: warm, validating, grounded, practical. Avoid jargon. Keep it concise.`,
    `Never ask more than ONE question in a turn. Keep replies under ~180 words.`,
    `Do not provide therapy, diagnosis, medical advice, or instructions to get alcohol.`,
    // Logic path (no labels in output)
    `Your goal is to gather just enough information to offer evidence-based behavioral interventions aligned with the user's stated goal/outcome.`,
    `If the user explicitly asks for help/options/what to do, FIRST give a brief summary + validation and ASK PERMISSION to offer options; do NOT list options until they say yes. Do not ask ANY other question on that turn besides the permission line: "Would it be helpful if I share a few options you can try right now?"`,
    `Do not output a generic fallback; ground in the user's words or ask a specific, open question.`,
    `Logic Path:
     1) First check: do you have enough info to suggest tailored interventions?
        - If NOT enough: reply with a mix of reflection/validation/open-ended question (any 1–2–3 of those). Keep it a SINGLE paragraph.
        - If UNSURE: give a brief summary-check (single paragraph) and ask "Do I have that right?" and clarify their goal.
    2) When you DO have enough: validate why the behavior/urge makes sense (normalize) and add a brief change-support statement. Then ASK PERMISSION: "Would it be okay if I share a few options?" Do not list options unless the user clearly agrees.
    3) After the user picks an option: explain the intervention (what it is + how to do it) clearly. Then ask how they’d like to follow up.
    `,
    // Interventions guardrails
    `Interventions must be behavioral and come from CBT, DBT, Self-Compassion, Mindfulness, or (if explicitly requested) Harm Reduction.
     - If using harm reduction: clearly label it as such, explain how it reduces harm, and note inherent risk.
     - Never suggest drinking/using unless user explicitly asks for harm reduction AND you’ve confirmed that’s what they want.
     - If user mentions self-harm or imminent danger: stop and show the crisis safety message (the client may also enforce this).`,
    // Output rules
    `Output exactly ONE paragraph per turn. No headings, no lists, no bullet points. No role labels. Keep it conversational and strictly grounded in the user's words.`,
    `Language: English only.`,
  ].join('\n')
}

// Few-shot to set format (no stock phrasing)
const FEWSHOTS = [
  {
    role: 'user',
    content:
      'I keep feeling a pull to have a drink when the stress spikes, and I want to handle it differently.',
  },
  {
    role: 'assistant',
    content:
      "That surge of stress can make a drink feel like instant relief, so the pull makes sense. If we pause for a moment, what feels most intense right now—the stress in your body, the thoughts, or the urge itself?",
  },
  {
    role: 'user',
    content:
      "I want to break the habit tonight and stay aligned with my goal.",
  },
  {
    role: 'assistant',
    content:
      "I hear your commitment to staying aligned with your goal. Would it be okay if I share a few options that can shift your state quickly without feeding the habit?",
  },
]

async function streamOpenAI({ input, history, directives = [] }: {
  input: string
  history: { role: 'user' | 'assistant', content: string }[]
  directives?: string[]
}) {
  const messages: { role: 'system' | 'user' | 'assistant', content: string }[] = []

  messages.push({ role: 'system', content: systemPrompt() })

  // Add a couple of few-shots to shape style (lower priority than per-turn directives)
  for (const fs of FEWSHOTS) messages.push(fs as any)

  // Per-turn directives come in as system messages LAST so they override few-shots
  for (const d of directives.filter(Boolean)) {
    messages.push({ role: 'system', content: d })
  }

  // Include a compact history (last 6 turns max) to keep context (after directives)
  const trimmedHistory = history?.slice(-6) ?? []
  for (const m of trimmedHistory) messages.push({ role: m.role, content: m.content })

  // Finally, the live user message (use quotes so the model can echo a fragment)
  messages.push({ role: 'user', content: `User says: "${input}"` })

  dbg('streamOpenAI start')
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), 30000)
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: getModel(),
      temperature: 0.0,
      max_tokens: 400,
      presence_penalty: 0,
      frequency_penalty: 0,
      stream: true,
      messages,
      response_format: { type: 'text' },
    }),
    signal: controller.signal,
  }).finally(() => clearTimeout(t))

  if (!res.ok || !res.body) {
    dbg('openai-not-ok', res.status, res.statusText)
    let errTxt = ''
    try { errTxt = await res.text() } catch {}
    console.error('[OpenAI API error]', res.status, res.statusText, errTxt)
    throw new Error(`OpenAI ${res.status} ${res.statusText} ${errTxt}`)
  }

  const reader = res.body.getReader()
  const encoder = new TextEncoder()

  return new ReadableStream({
    start(controller) {
      // Keep-alive in case of long first token latency
      const keep = setInterval(() => {
        try { controller.enqueue(new TextEncoder().encode('')) } catch {}
      }, 3000)
      ;(controller as any)._keep = keep
    },
    async pull(controller) {
      const { done, value } = await reader.read()
      if (done) { clearInterval((controller as any)._keep); return controller.close() }

      const chunk = new TextDecoder().decode(value)
      for (const line of chunk.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') { clearInterval((controller as any)._keep); return controller.close() }
        try {
          const json = JSON.parse(data)
          const delta = json.choices?.[0]?.delta?.content
          if (delta) controller.enqueue(encoder.encode(delta))
        } catch {
          // swallow partials
        }
      }
    },
    cancel() { clearInterval((this as any)._keep); reader.cancel() },
  })
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('[Advice API] Missing OPENAI_API_KEY')
      return new Response('Server misconfiguration: missing OpenAI API key', { status: 500 })
    }

    const { input, history = [], scenarioId = null, phase = null } = await req.json() as {
      input: string
      history?: { role: 'user' | 'assistant', content: string }[]
      scenarioId?: string | null
      phase?: Phase | null
    }

    let scenario: ScenarioId | null = (scenarioId as ScenarioId) || guessScenario(input)

    if (!input || !input.trim()) {
      return new Response('Can you share a bit about what you’re facing right now?', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    }

    // Quick crisis gate for server-side (client should also guard)
    const crisis = /suicid|kill myself|end my life|hurt myself|harm myself|overdose|od\b/i.test(input || '')
    if (crisis) {
      const crisisText =
        "Thank you for sharing that. What you’re describing sounds like it needs immediate support beyond what I can provide. If you’re in danger, please call 911. If you’re feeling suicidal or thinking of harming yourself, please call 988."
      return new Response(crisisText, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    }

    // See if the last assistant asked permission and the user answered
    const lastAssistant = [...(history || [])].reverse().find(m => m.role === 'assistant')
    const assistantAskedPermission = !!lastAssistant && /share a few options you can try right now\?/i.test(lastAssistant.content || '')

    dbg('input=', input)
    dbg(
      'assistantAskedPermission=', assistantAskedPermission,
      'wantsOptions=', wantsOptions(input),
      'hasGoal=', hasAnyGoal(input),
      'hasEnoughContext=', hasEnoughContext(input),
      'scenario=', scenario
    )

    let serverPhase: Phase | null = phase

    // Count recent assistant clarifiers (questions that are NOT the permission line)
    const recentAssistant = (history || []).filter(m => m.role === 'assistant').slice(-6)
    const clarifierCount = recentAssistant.filter(m =>
      /\?\s*$/.test(m.content || '') &&
      !/share a few options you can try right now\?/i.test(m.content || '')
    ).length

    // If assistant just asked permission and user responded, honor it first
    if (!serverPhase && assistantAskedPermission) {
      if (userApproved(input)) serverPhase = 'SUGGEST_OPTIONS'
      else if (userDeclined(input)) serverPhase = 'AWAIT_PERMISSION'
    }

    // Direct Help Request -> summary + ask permission (no options yet)
    if (!serverPhase && wantsOptions(input)) {
      serverPhase = 'SUMMARY_PERMISSION'
    }

    // Anti-loop guard: if we asked multiple clarifiers already, force permission step
    if (!serverPhase && clarifierCount >= 2) {
      serverPhase = 'SUMMARY_PERMISSION'
    }

    // Scenario match -> start with RVQ-style turn (launch), then continue normally
    if (!serverPhase && scenario) {
      serverPhase = 'NEED_CONTEXT'
    }

    // No scenario: MI clarify until enough; then summary+permission
    if (!serverPhase) {
      if (hasEnoughContext(input) || hasAnyGoal(input)) serverPhase = 'SUMMARY_PERMISSION'
      else serverPhase = 'NEED_CONTEXT'
    }

    dbg('serverPhase=', serverPhase as string)

    const phaseDirective = serverPhase ? (() => {
      switch (serverPhase) {
        case 'NEED_CONTEXT':
        case 'CLARIFY_GOAL':
          return "\n\n[INSTRUCTION: ONE short paragraph blending reflection/validation with exactly ONE open-ended question to learn more. Do NOT ask permission yet. No options. ≤180 words.]"
        case 'SUMMARY_PERMISSION':
          return "\n\n[INSTRUCTION: ONE paragraph: brief validation + brief summary of what you heard, then EXACTLY THIS PERMISSION QUESTION: 'Would it be helpful if I share a few options you can try right now?' Do NOT ask for goals or more details this turn. Do NOT list options yet. ≤180 words.]"
        case 'AWAIT_PERMISSION':
          return "\n\n[INSTRUCTION: The user hasn’t agreed to options. Reply with ONE brief clarifier (reflection + exactly ONE question). No options. ≤180 words.]"
        case 'SUGGEST_OPTIONS':
          return "\n\n[INSTRUCTION: Offer exactly 3 concise, evidence-based behavioral OPTIONS (one sentence each with a brief why). Do NOT give how-to yet. End by asking which they choose. ≤180 words.]"
        default:
          return ''
      }
    })() : ''

    const scenarioDirective = scenario ? (() => {
      switch (scenario) {
        case 'evening-loneliness':
          return "\n\n[SCENARIO: evening-loneliness — prefer language about feeling lonely/frustrated and the pull to isolate/doomscroll; keep grounded in the user's words.]"
        case 'party-invite':
          return "\n\n[SCENARIO: party-invite — balance FOMO with risk, mention planning/limits/accountability if user brings it up.]"
        case 'post-work-habit':
          return "\n\n[SCENARIO: post-work-habit — acknowledge autopilot and breaking the loop; avoid invented specifics.]"
        case 'morning-regret':
          return "\n\n[SCENARIO: morning-regret — normalize slips without collapse; focus on learning and next-step repair.]"
        case 'social-media-trigger':
          return "\n\n[SCENARIO: social-media-trigger — nostalgia vs aftermath; suggest urge-surfing and reconnecting safely if user requests.]"
        case 'rainy-boredom':
          return "\n\n[SCENARIO: rainy-boredom — activate values-aligned activity; plan basics for unstructured time.]"
        case 'family-pressure':
          return "\n\n[SCENARIO: family-pressure — assertive boundaries and escape hatches; no invented relatives.]"
        case 'airport-delay':
          return "\n\n[SCENARIO: airport-delay — displacement (walk the terminal), distractions, contact support; label harm reduction only if requested.]"
        default:
          return ''
      }
    })() : ''

    const directives = [scenarioDirective, phaseDirective].filter(Boolean)

    const stream = await streamOpenAI({
      input: input || '',
      history,
      directives,
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('[Advice API] Unhandled error', e)
    return new Response('Sorry—something went wrong generating a response.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}
