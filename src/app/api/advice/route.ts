import { NextRequest } from 'next/server'
import yaml from 'js-yaml'
import { CRISIS_AND_SCOPE_GUARDRAILS } from '@/server/ai/promptFragments'
import type { AppStage } from '@/lib/appState'

export const runtime = 'edge'

const ROLEPLAYS_BASE = '/roleplays'
const MODEL = (process.env.OPENAI_MODEL || 'gpt-4o-mini').trim()

// ── Feature flag ─────────────────────────────────────────────────────────────

function isV1Enabled(): boolean {
  return process.env.FEATURE_V1 === '1'
}

// ── Request body ─────────────────────────────────────────────────────────────

interface AdviceRequestBody {
  input: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>

  // Structured context (new)
  userId?: string
  appStage?: AppStage
  consentAccepted?: boolean
  preferredName?: string
  activeCoach?: 'kato' | 'mindfulness' | 'dbt' | 'self-compassion' | 'act' | 'mi' | 'exec'
  memorySummary?: string

  // Legacy — kept for coach-event pipeline compatibility
  coachTags?: Array<{ type: string; value: string; confidence: number }>
}

// ── PRE-CONSENT system prompt ────────────────────────────────────────────────
//
// Used when consentAccepted === false.
// STRICTLY limits Kato to explaining coaching vs therapy.
// This is a server-side enforcement layer — the UI gate is not sufficient alone.

function systemPromptPreConsent(): string {
  return [
    CRISIS_AND_SCOPE_GUARDRAILS,
    '',
    'You are Kato, an AI behavior coach. You are in the INITIAL ORIENTATION phase with a new user.',
    '',
    'YOUR ONLY JOB RIGHT NOW is to explain coaching vs therapy and answer the user\'s questions about it.',
    '',
    'You MUST:',
    '- Explain what behavioral coaching is and what you (Kato) can help with.',
    '- Explain what therapy is and why you cannot provide it.',
    '- Clarify what kinds of problems are in-scope (behavior change, skills, motivation, coping) vs out-of-scope (mental health diagnoses, trauma processing, clinical treatment).',
    '- Answer questions about whether this app is the right fit.',
    '- Warmly encourage the user to click "I\'m OK with this!" when they feel ready.',
    '',
    'You MUST NOT:',
    '- Begin a coaching session.',
    '- Ask about or engage with the user\'s personal problems, challenges, or goals.',
    '- Offer behavioral skills, interventions, or advice.',
    '- Respond meaningfully to any topic outside of coaching vs therapy.',
    '',
    'If the user tries to share their personal situation or jump into their problem early, redirect warmly:',
    '"I\'m looking forward to getting into that with you. First I want to make sure you\'re comfortable with what kind of support I can offer — once you\'re OK with the coaching approach, we can get started. Do you have any questions about coaching vs therapy?"',
    '',
    'Keep responses warm, clear, and brief (under 150 words). No lists. One paragraph.',
  ].join('\n')
}

// ── Main Kato system prompt ──────────────────────────────────────────────────

function systemPromptKato(
  appStage: AppStage | undefined,
  preferredName: string | undefined,
  activeCoach: string | undefined,
  memorySummary: string | undefined,
  coachTags: Array<{ type: string; value: string; confidence: number }> | undefined
): string {
  const parts: string[] = [
    CRISIS_AND_SCOPE_GUARDRAILS,
    '',
    'You are Kato, a warm and skilled AI behavior coach. You are NOT a therapist or clinician.',
    'Always respond in clear, grammatical, natural English. Keep it conversational (no jargon).',
    'Never use generic sympathy openers like "you\'re carrying a lot here".',
    'Ground replies in 1–2 concrete details from the user\'s last message.',
    'Tone: warm, validating, practical. Use Motivational Interviewing principles.',
    'Output ONE paragraph per turn. No lists, no bullets, no role labels. ≤200 words.',
    'Never ask more than one question per turn.',
  ]

  // Personalization from memory
  if (preferredName) {
    parts.push(`\nThe user's preferred name is ${preferredName}. Use it occasionally but naturally — not after every sentence.`)
  }

  if (memorySummary) {
    parts.push('\nKEY CONTEXT ABOUT THIS USER (from memory — treat as background, not to be read back verbatim):')
    parts.push(memorySummary)
  }

  // Stage-aware coaching behavior
  if (appStage === 'LIGHT_CHAT') {
    parts.push('\nCONTEXT: The user has not yet completed structured onboarding. You have limited background on them. Be helpful and warm, but do not pretend to know their history. Ask to learn what you need.')
  } else if (appStage === 'PERSONALIZED_CHAT') {
    parts.push('\nCONTEXT: You have good background context on this user. Be appropriately personalized.')
  } else if (appStage === 'ONBOARDING') {
    parts.push('\nCONTEXT: The user is in the onboarding phase. Your goal is to understand their situation, goals, and patterns through natural conversation — not to deliver skills yet.')
  }

  // Active supporting coach lens
  if (activeCoach && activeCoach !== 'kato') {
    const lensHints: Record<string, string> = {
      mindfulness: 'You are speaking from the Mindfulness lens. Focus on present-moment awareness, noticing without judgment, grounding, and the space between urge and action. Use body-based, sensory language. Keep it brief and inviting.',
      dbt: 'You are speaking from the DBT Skills lens. Identify which module (mindfulness, distress tolerance, emotion regulation, interpersonal effectiveness) is most relevant. Teach one skill clearly. Use DBT terms naturally but explain briefly.',
      'self-compassion': 'You are speaking from the Self-Compassion lens. Focus on self-kindness, common humanity, and balanced awareness. Gently challenge self-criticism. Encourage speaking to oneself as one would to a dear friend.',
      act: "You are speaking from the ACT lens. Focus on psychological flexibility: acceptance of difficult internal experiences, cognitive defusion (noticing thoughts as thoughts), values clarification, and committed action. Help the user identify what they care about and act toward it even alongside discomfort. Do not try to eliminate difficult feelings — help them act meaningfully with them present. Use ACT metaphors if helpful but explain them simply.",
      mi: "You are speaking from the Motivational Interviewing lens. Use the four MI processes: engaging, focusing, evoking (eliciting the user's own change talk), and planning when readiness is there. Reflect ambivalence without resolving it prematurely. Ask open-ended questions. Affirm strengths. Resist the righting reflex — do not push for action before the user is ready. Honor autonomy explicitly.",
      exec: "You are speaking from the Executive Functioning Coach lens. Focus on the practical mechanics of action: breaking tasks into concrete next steps, identifying environmental supports, building routines, and addressing EF barriers like task initiation difficulty, time blindness, and overwhelm. Be specific — avoid vague advice. Acknowledge that EF challenges are often neurological, not character flaws.",
    }
    const hint = lensHints[activeCoach]
    if (hint) {
      parts.push(`\nACTIVE COACH LENS: ${hint}`)
    }
  }

  // Coach context tags (V1 feature)
  if (isV1Enabled() && coachTags && coachTags.length > 0) {
    const relevant = coachTags.filter(t => t.confidence > 0.6)
    if (relevant.length > 0) {
      parts.push('\nCOACH SIGNALS (from conversation analysis — use as background context only):')
      parts.push(relevant.map(t => `- ${t.type}: ${t.value}`).join('\n'))
    }
  }

  return parts.join('\n')
}

// ── Roleplay few-shot helpers (retained from original) ───────────────────────

type RoleplayMeta = { id: string; title: string; path: string; themes?: string[] }
type RoleplayDoc = {
  id?: string
  title?: string
  situation?: string
  themes?: string[]
  coach_moves?: string[]
  dialogue?: string
}

async function fetchRoleplaysIndex(req: NextRequest): Promise<RoleplayMeta[]> {
  try {
    const origin = req.nextUrl.origin
    const res = await fetch(`${origin}${ROLEPLAYS_BASE}/index.json`, { cache: 'no-store' })
    if (!res.ok) return []
    return (await res.json()) as RoleplayMeta[]
  } catch { return [] }
}

async function fetchRoleplayYaml(req: NextRequest, path: string): Promise<RoleplayDoc | null> {
  try {
    const origin = req.nextUrl.origin
    const res = await fetch(`${origin}${path}`, { cache: 'no-store' })
    if (!res.ok) return null
    const text = await res.text()
    const doc = yaml.load(text) as RoleplayDoc
    return doc && typeof doc === 'object' ? doc : null
  } catch { return null }
}

async function loadRoleplays(req: NextRequest): Promise<RoleplayDoc[]> {
  const idx = await fetchRoleplaysIndex(req)
  const out: RoleplayDoc[] = []
  for (const item of idx) {
    const rp = await fetchRoleplayYaml(req, item.path)
    if (rp?.dialogue) out.push(rp)
  }
  return out
}

function pickRoleplaysForInput(input: string, roleplays: RoleplayDoc[], max = 2): RoleplayDoc[] {
  const q = (input || '').toLowerCase()
  const scored = roleplays.map(rp => {
    const hay = [rp.title, rp.situation, ...(rp.themes || []), rp.dialogue].join('\n').toLowerCase()
    let score = 0
    for (const token of q.split(/\W+/).filter(Boolean)) {
      if (hay.includes(token)) score++
    }
    return { rp, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, max).map(s => s.rp)
}

function roleplayToFewshots(rp: RoleplayDoc, maxTurns = 6): Array<{ role: 'user' | 'assistant'; content: string }> {
  const lines = (rp.dialogue || '').split(/\r?\n/)
  const pairs: Array<{ role: 'user' | 'assistant'; content: string }> = []
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('**User:**')) {
      pairs.push({ role: 'user', content: line.replace(/^\*\*User:\*\*\s*/, '') })
    } else if (line.startsWith('**Coach:**')) {
      pairs.push({ role: 'assistant', content: line.replace(/^\*\*Coach:\*\*\s*/, '') })
    }
  }
  return pairs.slice(-maxTurns)
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response('Missing API key', { status: 500 })
    }

    const body: AdviceRequestBody = await req.json()
    const {
      input = '',
      history = [],
      coachTags = [],
      // New structured fields
      appStage,
      consentAccepted = false,
      preferredName,
      activeCoach,
      memorySummary,
    } = body

    // ── Crisis check (always, regardless of consent state) ───────────────
    if (/suicid|kill myself|end my life|hurt myself|harm myself|overdose|\bod\b(?![a-z])/i.test(input)) {
      return new Response(
        "Thank you for sharing that. It sounds like you need immediate support beyond what I can provide. If you're in danger, please call 911. If you're feeling suicidal or thinking of harming yourself, please call 988.",
        { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } }
      )
    }

    if (!input.trim()) {
      return new Response("Can you share a bit about what's on your mind right now?", {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    }

    // ── Choose system prompt based on consent state ──────────────────────
    const systemPrompt = !consentAccepted
      ? systemPromptPreConsent()
      : systemPromptKato(appStage, preferredName, activeCoach, memorySummary, coachTags)

    // ── Build few-shot examples (skipped during pre-consent) ─────────────
    const FEWSHOTS: Array<{ role: 'user' | 'assistant'; content: string }> = []
    if (consentAccepted) {
      try {
        const library = await loadRoleplays(req)
        const picked = pickRoleplaysForInput(input, library, 2)
        for (const rp of picked) FEWSHOTS.push(...roleplayToFewshots(rp))
      } catch { /* non-fatal — continue without few-shots */ }
    }

    // ── Assemble messages ────────────────────────────────────────────────
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = []
    messages.push({ role: 'system', content: systemPrompt })
    for (const m of FEWSHOTS) messages.push(m)
    for (const m of history.slice(-6)) messages.push(m)
    messages.push({ role: 'user', content: `User says: "${input.replace(/"/g, '\\"')}"` })

    // ── Call OpenAI ──────────────────────────────────────────────────────
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 60_000)

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        stream: false,
        max_tokens: 600,
        messages,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(t))

    if (!res.ok) {
      const errTxt = await res.text().catch(() => '')
      return new Response(`Upstream error ${res.status} ${res.statusText} ${errTxt}`.trim(), { status: 502 })
    }

    const json = await res.json().catch(() => null)
    const content: string = json?.choices?.[0]?.message?.content ?? ''

    return new Response((content || '').trim(), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch {
    return new Response('Sorry — something went wrong generating a response.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}
