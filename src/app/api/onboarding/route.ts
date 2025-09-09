import 'server-only'
import { NextRequest } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
if (!OPENAI_API_KEY) console.warn('[onboarding] Missing OPENAI_API_KEY')

type Msg = { role: 'user'|'assistant'|'system'; content: string }

const SYSTEM_PROMPT = `
You are CMC Sober Coach, an AI behavior coach. You are not a therapist and you do not diagnose.
Tone: warm, collaborative, non-judgmental. Use Motivational Interviewing first: reflect, validate, summarize; ask **one** open-ended question at a time.
Secondary lenses: ACT, DBT, Self-Compassion, Mindfulness, CBT (use only if it naturally fits).

**You are in INTAKE MODE (onboarding).**
Your purpose is to learn about the person and gather context, **not** to give skills or detailed advice in this flow.
Stay focused on: goals for change, current use (what/when/how often/how much), triggers (internal/external), consequences (health, relationships, work/legal, financial), supports, environment/safety, withdrawal/medical flags, motivation/concerns, and values.
Use plain language. Keep replies under ~160 words.

Goal of this onboarding chat:
• Get to know the person in an open conversation (free text; no checklists).
• Elicit enough information to **infer** (do not administer verbatim):
  – Addiction Severity Index domains (plain language; presence/recency/severity).
  – URICA stage(s) of change + confidence.
• Never mention “ASI” or “URICA” to the user.

IMPORTANT INTAKE BOUNDARIES:
• **Do NOT** give skills/advice/action menus/coping steps during intake unless the server explicitly switches modes or the user explicitly asks to switch to skills.
• If the user asks for “skills/what should I do/give me something,” **acknowledge the request** and ask a single, neutral question to keep onboarding moving, e.g.:
  “I can switch to skills after we capture a few basics so the suggestions fit you. Could I ask: [one most relevant intake question]?”
• If you believe you have enough information for a draft summary, FIRST ask permission with a single yes/no question:
  “I can draft a brief intake summary from what we’ve discussed. Would you like to see it now?”
  Do not mix this with other asks. Do not generate the summary in the same turn.

Crisis safety:
• If the user expresses imminent risk, respond only with the crisis message and stop.
`.trim()

const FINALIZE_PROMPT = `
You are generating a rich, plain-language intake summary for the user from the FULL conversation transcript. Do not invent facts; ground every statement in what the user actually said or clearly implied.

Format STRICTLY as GitHub-flavored Markdown and include ALL sections below:

# Intake Summary
A clear, person-centered narrative (220–320 words) in plain language describing who they are in this context, what they’re navigating, their goals/concerns, relevant patterns (what/when/how often), triggers, consequences (health/relationships/work/legal/financial), supports, and motivation. No diagnoses. No clinical jargon.

## What We Heard
- 6–9 short bullets in the user’s own phrasing where possible.
- Each bullet should capture a distinct fact or theme from the transcript.

## Strengths & Supports
- 3–5 bullets that reflect values, efforts, relationships, and resources the user mentioned.

## Inferred Scales
**Change Readiness (URICA, plain language):** Name the likely stage(s) and give a 1–2 sentence rationale tied to what the user said.
**Areas to Watch (ASI-style, plain language):**
- Domain — one-line observation tied to the transcript.
- Domain — one-line observation.
- Domain — one-line observation.

## Gentle Caveat
This is a behavior-coaching intake summary, not a medical or diagnostic assessment.
`.trim()

const OFFER_MARK = '<!--OFFER_SUMMARY-->'
const DONE_MARK  = '<!--SUMMARY_DONE-->'

/* -------- heuristics (domains) -------- */
function hasGoal(text: string) {
  const t = (text || '').toLowerCase()
  return /(quit|stop|cut\s*back|reduce|abstinen|moderate|change my (drinking|use)|stay sober|be sober|dry january|dry\s+jan)/.test(t)
}
function mentionsFrequency(text: string) {
  const t = (text || '').toLowerCase()
  return /(every day|daily|nightly|weekend|x\/wk|times a (day|week)|\b\d+\s*(drinks?|times?)\b|morning|evening|night)/.test(t)
}
function mentionsTriggers(text: string) {
  const t = (text || '').toLowerCase()
  return /(stress|anxiet|fight|argument|lonely|bored|party|airport|travel|work|craving|urge|social|friends?)/.test(t)
}
function mentionsConsequences(text: string) {
  const t = (text || '').toLowerCase()
  return /(hangover|withdrawal|dope\s*sick|tolerance|black(out|ed)|sleep|health|relationship|partner|kids?|job|work|boss|late|promotion|legal|court|probation|money|broke|finances?)/.test(t)
}
function mentionsSupports(text: string) {
  const t = (text || '').toLowerCase()
  return /(friend|uncle|aunt|mom|dad|partner|girlfriend|boyfriend|spouse|wife|husband|therap|group|meeting|sponsor|doctor|md|coach|support|community)/.test(t)
}

/* -------- flow helpers -------- */
function conversationText(history: Msg[], latest: string) {
  return [...(history || []), { role: 'user', content: latest || '' }]
    .map(m => m.content || '')
    .join(' ')
}

function coverageScore(history: Msg[], latest: string) {
  const userText = history
    .filter(m => m.role === 'user')
    .map(m => (m.content || '').toLowerCase())
    .concat((latest || '').toLowerCase())
    .join('\n')

  let score = 0
  if (hasGoal(userText)) score++
  if (mentionsFrequency(userText)) score++
  if (mentionsTriggers(userText)) score++
  if (mentionsConsequences(userText)) score++
  if (mentionsSupports(userText)) score++
  return score // 0..5
}

function shouldOfferSummaryNow(history: Msg[], latest: string) {
  const userTurns = history.filter(m => m.role === 'user').length
  if (userTurns < 6) return false                // was 4
  const score = coverageScore(history, latest)
  return score >= 4                               // was 3
}

function wantsFinish(text: string) {
  const t = (text || '').toLowerCase()
  return /\b(finish|wrap up|finalize|show (my )?(summary|report)|end onboarding|done)\b/.test(t)
}
function wantsSkills(text: string) {
  const t = (text || '').toLowerCase().replace(/[—–]/g, '-')
  return /\b(what\s+(should|can|could)\s+i\s+do|give\s+me\s+(something|options?)\s*(to\s+do)?|skills?|tool|strategy|help me|please help|advice)\b/.test(t)
}
function userAskedForSummary(s: string) {
  const t = (s || '').toLowerCase()
  return /\b(summary|report|intake\s+summary|write\s+it\s+up|can\s+you\s+summarize)\b/.test(t)
}
function userConsentedYes(s: string) {
  const t = (s || '').toLowerCase()
  return /\b(yes|yeah|yep|sure|please|ok(ay)?|let'?s\s+see\s+it|show\s+me)\b/.test(t)
}
function hasOfferedSummaryRecently(history: Msg[], withinTurns = 8) {
  const last = history.slice(-withinTurns)
  return last.some(m => m.role === 'assistant' && (m.content || '').includes(OFFER_MARK))
}
function hasRecentlySummarized(history: Msg[], withinTurns = 14) {
  const last = history.slice(-withinTurns)
  return last.some(m => m.role === 'assistant' && (m.content || '').includes(DONE_MARK))
}
function lastTurnWasOfferAndUserSaidYes(history: Msg[]) {
  if (history.length < 2) return false
  const a = history[history.length - 2]
  const u = history[history.length - 1]
  return a.role === 'assistant' && (a.content || '').includes(OFFER_MARK) && userConsentedYes(u.content || '')
}

/* When user asks for skills too early, return exactly one targeted intake question */
function nextIntakeQuestion(history: Msg[], latest: string): string {
  const blob = conversationText(history, latest).toLowerCase()
  if (!hasGoal(blob)) {
    return 'What feels most important to you right now—cutting back, stopping, or deciding later what change looks like?'
  }
  if (!mentionsFrequency(blob)) {
    return 'To get the fit right, what and when do you tend to use—how often, and about how much on a typical day or week?'
  }
  if (!mentionsTriggers(blob)) {
    return 'What usually sets off the urge—stress, certain people/places, feelings, or particular times of day?'
  }
  if (!mentionsConsequences(blob)) {
    return 'What impacts have you noticed lately—on sleep, mood, health, relationships, work, money, or anything legal?'
  }
  if (!mentionsSupports(blob)) {
    return 'Who or what helps even a little—people, routines, meetings, or anything you lean on when things are hard?'
  }
  return 'Before we switch to skills, what would “a good outcome” from this change look like in your day-to-day life?'
}

function skillsIntercept(history: Msg[], latest: string) {
  const score = coverageScore(history, latest)
  if (score >= 4) return null // we have enough—let model proceed (or later we can switch modes)
  const q = nextIntakeQuestion(history, latest)
  return `I hear you wanting something concrete. I can switch to skills right after we capture a couple basics so the suggestions fit you. Could I ask: ${q}`
}

/* Fallback if OpenAI ever returns empty */
function buildFallback(input: string) {
  const t = (input || '').trim()
  if (!t) {
    return 'Thanks for checking in. What would you like me to understand about you so I can tailor the onboarding?'
  }
  if (t.length < 40) {
    return `It sounds like this is really on your mind. Could you share a bit more about what’s been happening today so I can understand better?`
  }
  return `Thanks for sharing that. I want to make sure I have it right: ${t.slice(0, 140)}… What would you most like help with as we get started?`
}

/* Single, non-streaming call with a generous timeout */
async function callOpenAI(messages: Msg[], max_tokens = 650) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 90_000)

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        stream: false,
        max_tokens,
        messages,
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('[onboarding] OpenAI error body:', text)
      throw new Error(`OpenAI ${res.status} ${res.statusText}`)
    }

    const json = await res.json()
    const text: string = json?.choices?.[0]?.message?.content ?? ''
    console.log('[onboarding] OpenAI reply length:', text ? text.length : 0)
    return (text && text.trim()) || ''
  } finally {
    clearTimeout(timer)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { input, history = [], finalize = false } = await req.json() as {
      input: string
      history?: Msg[]
      finalize?: boolean
    }

    // Crisis check
    if (isCrisis(input)) {
      const crisis =
        "Thank you for sharing that. What you’re describing needs immediate support beyond what I can provide. If you’re in danger, please call 911. If you’re feeling suicidal or thinking of harming yourself, please call 988."
      return new Response(crisis, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    }

    const base: Msg[] = [{ role: 'system', content: SYSTEM_PROMPT }]
    const prior = (history || []).filter(m => m.role === 'user' || m.role === 'assistant')
    const transcriptWithCurrent = prior.concat({ role: 'user', content: input || '' })

    // If last turn was a summary offer and user said yes now, produce the summary.
    if (lastTurnWasOfferAndUserSaidYes(transcriptWithCurrent) || userAskedForSummary(input || '')) {
      const messages: Msg[] = [
        ...base,
        { role: 'system', content: FINALIZE_PROMPT },
        {
          role: 'user',
          content: `Here is the full transcript as JSON array of {role,content}. Write the intake summary report now:\n\n${JSON.stringify(transcriptWithCurrent)}`
        }
      ]
      const summary = await callOpenAI(messages, 1500)
      const withMark = (summary || '').trim() + `\n\n${DONE_MARK}`
      return new Response(withMark, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    }

    // Explicit "finish" or finalize flag -> produce the summary now.
    if (finalize || wantsFinish(input)) {
      const transcript = prior.concat({ role: 'user', content: input || '' })
      const messages: Msg[] = [
        ...base,
        { role: 'system', content: FINALIZE_PROMPT },
        {
          role: 'user',
          content: `Here is the full transcript as JSON array of {role,content}. Write the intake summary report now:\n\n${JSON.stringify(transcript)}`,
        },
      ]
      let text = await callOpenAI(messages, 1500)
      text = (text || '').trim() + `\n\n${DONE_MARK}`
      return new Response(text, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    }

    // Intercept skills requests during onboarding until we have enough coverage
    if (wantsSkills(input)) {
      const intercept = skillsIntercept(prior, input)
      if (intercept) {
        return new Response(intercept, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
        })
      }
      // else: allow model to proceed (we might later swap modes on the client)
    }

    // Offer summary only when thresholds met and not offered/summarized recently
    const readyToOffer = shouldOfferSummaryNow(prior, input)
    if (
      readyToOffer &&
      !wantsFinish(input) &&
      !hasOfferedSummaryRecently(prior) &&
      !hasRecentlySummarized(prior)
    ) {
      const permission = `I can draft a brief intake summary from what we’ve discussed. Would you like to see it now? ${OFFER_MARK}`
      return new Response(permission, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    }

    // Regular onboarding turn
    const convo: Msg[] = [...base, ...prior, { role: 'user', content: input || '' }]
    const text = await callOpenAI(convo, 500)

    if (!text) {
      const fb = buildFallback(input || '')
      console.warn('[onboarding] Empty OpenAI content; returning fallback.')
      return new Response(fb, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Onboarding-Fallback': '1' },
      })
    }

    return new Response(text, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch (e) {
    console.error('[onboarding] Handler error:', e)
    return new Response('Sorry — something went wrong generating a response.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}

function isCrisis(text: string): boolean {
  const t = (text || '').toLowerCase()
  const strong = [
    /\bkill myself\b/,
    /\btake my own life\b/,
    /\bend my life\b/,
    /\bsuicid(e|al)\b/,
    /\bhurt myself\b/,
    /\bharm myself\b/,
    /\boverdose\b/,
    /\bod\b(?![a-z])/,
  ]
  if (strong.some(re => re.test(t))) {
    const falsePositives = [
      /kill time/,
      /this game.*kill me/,
      /die of laughter|dying of laughter/,
      /harm reduction/,
    ]
    if (falsePositives.some(re => re.test(t))) return false
    return true
  }
  return false
}