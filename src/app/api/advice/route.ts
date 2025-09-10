import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

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
  return ALLOWED_MODELS.includes(m) ? m : DEFAULT_MODEL
}

// ---------- Types ----------
type Phase =
  | 'NEED_CONTEXT'
  | 'CLARIFY_GOAL'
  | 'SUMMARY_PERMISSION'
  | 'AWAIT_PERMISSION'
  | 'SUGGEST_OPTIONS'

// ---------- System Prompt ----------
function systemPrompt() {
  return [
    `Always respond in clear, grammatical, natural English. Keep it conversational and readable (no jargon).`,
    `You are CMC Sober Coach, an AI behavior coach (not a clinician).`,
    `Never use generic sympathy lines like "you're carrying a lot here".`,
    `Ground replies in 1–2 concrete details from the user's last message. Echo a short quoted fragment if natural.`,
    `Do NOT invent specifics (no people, places, times) unless explicitly given.`,
    `Tone: warm, validating, practical. Use Motivational Interviewing. ≤180 words.`,
    `Never ask more than one question per turn.`,
    `Your goal is to gather enough info to offer evidence-based behavioral interventions.`,
    `If the user explicitly asks for help/options: give a brief summary + validation, then ASK PERMISSION with EXACTLY: "Would it be helpful if I share a few options you can try right now?" Do not list options until they say yes.`,
    `Logic Path:
     1) If not enough info: reflect/validate + one open question.
     2) If enough: validate, add change-support, then ask permission.
     3) If permission given: offer 3 concise, evidence-based options (one sentence each with why).`,
    `Interventions must come from CBT, DBT, ACT, Self-Compassion, or Mindfulness. Label harm reduction clearly if used.`,
    `If self-harm/crisis detected: stop and output the crisis safety message.`,
    `Output exactly ONE paragraph per turn. No lists, no bullets, no role labels.`,
  ].join('\n')
}

// Few-shot examples to keep style consistent
const FEWSHOTS = [
  { role: 'user' as const, content: 'I keep feeling a pull to have a drink when the stress spikes, and I want to handle it differently.' },
  { role: 'assistant' as const, content: 'That surge of stress can make a drink feel like instant relief, so the pull makes sense. If we pause a moment, what feels most intense right now—the stress in your body, the thoughts, or the urge itself?' },
  { role: 'user' as const, content: 'I want to break the habit tonight and stay aligned with my goal.' },
  { role: 'assistant' as const, content: 'I hear your commitment to staying aligned with your goal. Would it be helpful if I share a few options you can try right now?' },
]

// ---------- OpenAI Client ----------
const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response('Missing API key', { status: 500 })
    }

    const body = await req.json()
    const input: string = body?.input ?? ''
    const history: { role: 'user' | 'assistant'; content: string }[] = body?.history ?? []
    // (Optional) Accept phase/scenario but not required for basic parity with onboarding
    // const phase: Phase | null = body?.phase ?? null

    if (!input || !input.trim()) {
      return new Response('Can you share a bit about what you’re facing right now?', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    }

    // Crisis gate (server-side)
    if (/suicid|kill myself|end my life|hurt myself|harm myself|overdose|od\b/i.test(input || '')) {
      const crisisText =
        "Thank you for sharing that. It sounds like you need immediate support beyond what I can provide. If you’re in danger, please call 911. If you’re feeling suicidal or thinking of harming yourself, please call 988."
      return new Response(crisisText, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    }

    // Assemble messages for AI SDK: system + fewshots + compact history + live user
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = []
    // fewshots
    for (const m of FEWSHOTS) messages.push(m)
    // compact history (last 6)
    for (const m of (history || []).slice(-6)) messages.push(m)
    // current user message
    messages.push({ role: 'user', content: `User says: "${input}"` })

    // Stream using AI SDK v4; this matches onboarding’s expected SSE format for useChat.
    const result = await streamText({
      model: openai(getModel()),
      system: systemPrompt(),
      temperature: 0,
      messages,
    })

    return result.toDataStreamResponse()
  } catch (e) {
    console.error('[Advice API] Error', e)
    return new Response('Sorry—something went wrong generating a response.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}
