import { NextRequest } from 'next/server'
import yaml from 'js-yaml'
import { CRISIS_AND_SCOPE_GUARDRAILS } from '@/server/ai/promptFragments'

export const runtime = 'edge'

// Roleplay library lives in /public/roleplays
const ROLEPLAYS_BASE = '/roleplays'

const MODEL = (process.env.OPENAI_MODEL || 'gpt-4o-mini').trim()

// Feature flag check
function isV1Enabled(): boolean {
  return process.env.FEATURE_V1 === '1'
}

// V0 system prompt (original)
function systemPromptV0() {
  return [
    'Always respond in clear, grammatical, natural English. Keep it conversational and readable (no jargon).',
    'You are CMC Sober Coach, an AI behavior coach (not a clinician).',
    'Never use generic sympathy lines like "you\'re carrying a lot here".',
    'Ground replies in 1–2 concrete details from the user\'s last message. Echo a short quoted fragment if natural.',
    'Do NOT invent specifics (no people, places, times) unless explicitly given.',
    'Tone: warm, validating, practical. Use Motivational Interviewing. ≤180 words.',
    'Never ask more than one question per turn.',
    'Your goal is to gather enough info to offer evidence-based behavioral interventions.',
    'If the user explicitly asks for help/options: give a brief summary + validation, then ASK PERMISSION with EXACTLY: "Would it be helpful if I share a few options you can try right now?" Do not list options until they say yes.',
    'Interventions must come from CBT, DBT, ACT, Self-Compassion, or Mindfulness. Label harm reduction clearly if used.',
    'If explicit crisis language detected (suicide, self-harm, overdose): stop and output the crisis safety message.',
    'When users ask for validation or reassurance (like "am I a good person?"), provide warm, supportive responses without triggering crisis protocols.',
    'Output exactly ONE paragraph per turn. No lists, no bullets, no role labels.'
  ].join('\n')
}

// V1 system prompt with coach hints
function systemPromptV1(coachTags?: Array<{ type: string; value: string; confidence: number }>) {
  const basePrompt = [
    CRISIS_AND_SCOPE_GUARDRAILS,
    'Always respond in clear, grammatical, natural English. Keep it conversational and readable (no jargon).',
    'You are CMC Sober Coach, an AI behavior coach (not a clinician).',
    'Never use generic sympathy lines like "you\'re carrying a lot here".',
    'Ground replies in 1–2 concrete details from the user\'s last message. Echo a short quoted fragment if natural.',
    'Do NOT invent specifics (no people, places, times) unless explicitly given.',
    'Tone: warm, validating, practical. Use Motivational Interviewing. ≤180 words.',
    'Never ask more than one question per turn.',
    'Your goal is to gather enough info to offer evidence-based behavioral interventions.',
    'If the user explicitly asks for help/options: give a brief summary + validation, then ASK PERMISSION with EXACTLY: "Would it be helpful if I suggest a plan based on our conversation?" STOP after asking - do not provide the plan yourself. The system will generate it separately.',
    'Interventions must come from CBT, DBT, ACT, Self-Compassion, or Mindfulness. Label harm reduction clearly if used.',
    'When users ask for validation or reassurance (like "am I a good person?"), provide warm, supportive responses without triggering crisis protocols.',
    'Output exactly ONE paragraph per turn. No lists, no bullets, no role labels.'
  ]

  // Add coach context if available
  if (coachTags && coachTags.length > 0) {
    const relevantTags = coachTags.filter(tag => tag.confidence > 0.6)
    if (relevantTags.length > 0) {
      basePrompt.push(
        '',
        'COACH CONTEXT: Based on our conversation, I\'ve noticed signals related to:',
        relevantTags.map(tag => `- ${tag.type}: ${tag.value}`).join('\n'),
        'Consider these patterns when responding, but don\'t explicitly mention them unless relevant.'
      )
    }
  }

  return basePrompt.join('\n')
}

type RoleplayMeta = { id: string; title: string; path: string; themes?: string[] }
type RoleplayDoc = {
  id?: string
  title?: string
  situation?: string
  themes?: string[]
  coach_moves?: string[]
  emergent_strategies?: string[]
  relational_stance?: string
  dialogue?: string
  notes?: string
}

async function fetchRoleplaysIndex(req: NextRequest): Promise<RoleplayMeta[]> {
  try {
    const origin = req.nextUrl.origin
    const res = await fetch(`${origin}${ROLEPLAYS_BASE}/index.json`, { cache: 'no-store' })
    if (!res.ok) return []
    return (await res.json()) as RoleplayMeta[]
  } catch {
    return []
  }
}

async function fetchRoleplayYaml(req: NextRequest, path: string): Promise<RoleplayDoc | null> {
  try {
    const origin = req.nextUrl.origin
    const res = await fetch(`${origin}${path}`, { cache: 'no-store' })
    if (!res.ok) return null
    const text = await res.text()
    const doc = yaml.load(text) as RoleplayDoc
    return doc && typeof doc === 'object' ? doc : null
  } catch {
    return null
  }
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
    // naive score: count of keyword overlaps
    let score = 0
    for (const token of q.split(/\W+/).filter(Boolean)) {
      if (hay.includes(token)) score += 1
    }
    return { rp, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, max).map(s => s.rp)
}

function roleplayToFewshots(rp: RoleplayDoc, maxTurns = 6): { role: 'user' | 'assistant'; content: string }[] {
  // Expect lines like **User:** and **Coach:** in the dialogue block
  const lines = (rp.dialogue || '').split(/\r?\n/)
  const pairs: { role: 'user' | 'assistant'; content: string }[] = []
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('**User:**')) {
      pairs.push({ role: 'user', content: line.replace(/^\*\*User:\*\*\s*/, '') })
    } else if (line.startsWith('**Coach:**')) {
      pairs.push({ role: 'assistant', content: line.replace(/^\*\*Coach:\*\*\s*/, '') })
    }
  }
  // Keep only the last few turns so prompt stays small
  return pairs.slice(-maxTurns)
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response('Missing API key', { status: 500 })
    }

    const body = await req.json()
    const input: string = body?.input ?? ''
    const history: { role: 'user' | 'assistant'; content: string }[] = body?.history ?? []
    const coachTags: Array<{ type: string; value: string; confidence: number }> = body?.coachTags ?? []

    // Load roleplay library and pick contextually relevant examples
    const library = await loadRoleplays(req)
    const picked = pickRoleplaysForInput(input, library, 2)
    const FEWSHOTS: { role: 'user' | 'assistant'; content: string }[] = []
    for (const rp of picked) FEWSHOTS.push(...roleplayToFewshots(rp))

    if (!input || !input.trim()) {
      return new Response('Can you share a bit about what you\'re facing right now?', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    }

    if (/suicid|kill myself|end my life|hurt myself|harm myself|overdose|\bod\b(?![a-z])/i.test(input || '')) {
      const crisisText =
        "Thank you for sharing that. It sounds like you need immediate support beyond what I can provide. If you're in danger, please call 911. If you're feeling suicidal or thinking of harming yourself, please call 988."
      return new Response(crisisText, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    }

    // Choose system prompt based on feature flags
    const systemPrompt = isV1Enabled() ? systemPromptV1(coachTags) : systemPromptV0()

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = []
    messages.push({ role: 'system', content: systemPrompt })
    for (const m of FEWSHOTS) messages.push(m)
    for (const m of (history || []).slice(-6)) messages.push(m)
    messages.push({ role: 'user', content: `User says: "${input.replace(/"/g, '\\"')}"` })

    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 60000)
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
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

    const json = await res.json().catch(() => null as any)
    const content: string = json?.choices?.[0]?.message?.content ?? ''

    return new Response((content || '').trim(), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch (e) {
    return new Response('Sorry—something went wrong generating a response.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}
