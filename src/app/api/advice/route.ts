import { NextRequest } from 'next/server'

function dbg(...args: unknown[]) { try { console.log('[advice]', ...args) } catch {} }

export const runtime = 'edge'

// ---------- Model Handling ----------
const DEFAULT_MODEL = 'gpt-4o-mini'
const ALLOWED_MODELS = [
  'gpt-4o-mini',
  'gpt-4o',
  'gpt-4.1-mini',
  'gpt-4.1',
  'gpt-4-turbo',
  'gpt-3.5-turbo',
]
function getModel(): string {
  const m = (process.env.OPENAI_MODEL || DEFAULT_MODEL).trim()
  if (ALLOWED_MODELS.includes(m)) return m
  try { console.warn('[advice] Unsupported OPENAI_MODEL:', m, '— falling back to', DEFAULT_MODEL) } catch {}
  return DEFAULT_MODEL
}

type Phase = 'NEED_CONTEXT' | 'CLARIFY_GOAL' | 'SUMMARY_PERMISSION' | 'AWAIT_PERMISSION' | 'SUGGEST_OPTIONS'

// ---------- System Prompt ----------
function systemPrompt() {
  return [
    `Always respond in clear, grammatical, natural English. Keep it conversational and readable (no jargon).`,
    `You are CMC Sober Coach, an AI behavior coach (not a clinician).`,
    `Never use generic sympathy lines like "you're carrying a lot here".`,
    `Ground replies in 1–2 concrete details from the user's last message. Echo a short quoted fragment if natural.`,
    `Do NOT invent specifics (no people, places, times) unless explicitly given.`,
    `Tone: warm, validating, practical. Use Motivational Interviewing. Keep under ~180 words.`,
    `Never ask more than one question per turn.`,
    `Your goal is to gather enough info to offer evidence-based behavioral interventions.`,
    `If the user explicitly asks for help/options: give a brief summary + validation, then ASK PERMISSION with: "Would it be helpful if I share a few options you can try right now?" Do not list options until they say yes.`,
    `Logic Path:
     1) If not enough info: reflect/validate + ask one open question.
     2) If enough: validate, add change-support, then ask permission.
     3) If permission given: offer 3 concise, evidence-based options (one sentence each with why).`,
    `Interventions must come from CBT, DBT, ACT, Self-Compassion, or Mindfulness. Label harm reduction clearly if used.`,
    `If self-harm/crisis detected: stop and output the crisis safety message.`,
    `Output exactly ONE paragraph per turn. No lists, no bullets, no role labels.`,
  ].join('\n')
}

// Few-shot examples to keep style consistent
const FEWSHOTS = [
  { role: 'user', content: 'I keep feeling a pull to have a drink when the stress spikes, and I want to handle it differently.' },
  { role: 'assistant', content: 'That surge of stress can make a drink feel like instant relief, so the pull makes sense. If we pause a moment, what feels most intense right now—the stress in your body, the thoughts, or the urge itself?' },
  { role: 'user', content: 'I want to break the habit tonight and stay aligned with my goal.' },
  { role: 'assistant', content: 'I hear your commitment to staying aligned with your goal. Would it be helpful if I share a few options you can try right now?' },
]

// ---------- OpenAI Stream ----------
async function streamOpenAI({ input, history }: {
  input: string
  history: { role: 'user' | 'assistant', content: string }[]
}) {
  const messages: { role: 'system' | 'user' | 'assistant', content: string }[] = []
  messages.push({ role: 'system', content: systemPrompt() })
  for (const fs of FEWSHOTS) messages.push(fs as any)
  const trimmedHistory = history?.slice(-6) ?? []
  for (const m of trimmedHistory) messages.push({ role: m.role, content: m.content })
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
      temperature: 0,
      max_tokens: 400,
      stream: true,
      messages,
    }),
    signal: controller.signal,
  }).finally(() => clearTimeout(t))

  if (!res.ok || !res.body) {
    dbg('openai-not-ok', res.status, res.statusText)
    throw new Error(`OpenAI ${res.status} ${res.statusText}`)
  }

  const reader = res.body.getReader()
  const encoder = new TextEncoder()

  return new ReadableStream({
    start(controller) {
      const keep = setInterval(() => { try { controller.enqueue(encoder.encode('')) } catch {} }, 3000)
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
        } catch { }
      }
    },
    cancel() { clearInterval((this as any)._keep); reader.cancel() },
  })
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('[Advice API] Missing OPENAI_API_KEY')
      return new Response('Missing API key', { status: 500 })
    }

    const { input, history = [] } = await req.json() as {
      input: string
      history?: { role: 'user' | 'assistant', content: string }[]
    }

    if (!input || !input.trim()) {
      return new Response('Can you share a bit about what you’re facing right now?', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    }

    const crisis = /suicid|kill myself|end my life|hurt myself|harm myself|overdose|od\b/i.test(input)
    if (crisis) {
      const crisisText =
        "Thank you for sharing that. It sounds like you need immediate support beyond what I can provide. If you’re in danger, please call 911. If you’re feeling suicidal or thinking of harming yourself, please call 988."
      return new Response(crisisText, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    }

    const stream = await streamOpenAI({ input, history })
    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch (e) {
    console.error('[Advice API] Error', e)
    return new Response('Sorry—something went wrong generating a response.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}
