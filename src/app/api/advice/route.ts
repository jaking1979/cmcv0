import { NextRequest } from 'next/server'

export const runtime = 'edge'

const MODEL = (process.env.OPENAI_MODEL || 'gpt-4o-mini').trim()

function systemPrompt() {
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
    'If self-harm/crisis detected: stop and output the crisis safety message.',
    'Output exactly ONE paragraph per turn. No lists, no bullets, no role labels.'
  ].join('\n')
}

const FEWSHOTS: { role: 'user' | 'assistant'; content: string }[] = [
  { role: 'user', content: 'I keep feeling a pull to have a drink when the stress spikes, and I want to handle it differently.' },
  { role: 'assistant', content: 'That surge of stress can make a drink feel like instant relief, so the pull makes sense. If we pause a moment, what feels most intense right now—the stress in your body, the thoughts, or the urge itself?' },
  { role: 'user', content: 'I want to break the habit tonight and stay aligned with my goal.' },
  { role: 'assistant', content: 'I hear your commitment to staying aligned with your goal. Would it be helpful if I share a few options you can try right now?' }
]

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response('Missing API key', { status: 500 })
    }

    const body = await req.json()
    const input: string = body?.input ?? ''
    const history: { role: 'user' | 'assistant'; content: string }[] = body?.history ?? []

    if (!input || !input.trim()) {
      return new Response('Can you share a bit about what you’re facing right now?', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    }

    if (/suicid|kill myself|end my life|hurt myself|harm myself|overdose|od\b/i.test(input || '')) {
      const crisisText =
        "Thank you for sharing that. It sounds like you need immediate support beyond what I can provide. If you’re in danger, please call 911. If you’re feeling suicidal or thinking of harming yourself, please call 988."
      return new Response(crisisText, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    }

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = []
    messages.push({ role: 'system', content: systemPrompt() })
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
