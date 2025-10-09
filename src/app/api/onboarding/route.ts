import 'server-only'
import { NextRequest } from 'next/server'
import { CRISIS_AND_SCOPE_GUARDRAILS, ONBOARDING_V1_PROMPT } from '@/server/ai/promptFragments'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
if (!OPENAI_API_KEY) console.warn('[onboarding] Missing OPENAI_API_KEY')

type Msg = { role: 'user'|'assistant'|'system'; content: string }

// Feature flag check
function isV1Enabled(): boolean {
  return process.env.FEATURE_V1 === '1' && process.env.FEATURE_ONBOARDING_MAP === '1'
}

// V0 Onboarding intake: coach-like, efficient, roadmap-driven (not MI-first, not scripted)
const SYSTEM_PROMPT_V0 = `
You are CMC Sober Coach, an AI **behavior coach** (not a therapist). You do not diagnose.

**Mode: INTAKE (Onboarding)**
Your job is to quickly learn how this person tends to make choices in tough moments so future coaching fits them. Keep a **coach-like intake** stance: plain language, warm but efficient, curious and practical.

**Tone & Interaction**
- Short acknowledgments ("Makes sense.", "Got it.") then move forward.
- Ask **one focused question at a time**; keep replies ~140–160 words.
- Avoid sounding like a survey or checklist; keep it conversational.
- Use reflections sparingly (1 short sentence max) to show understanding.

**What to learn (behavioral map seed)**
Capture enough to infer (without naming tools to the user):
- **Decision style:** pause vs. act fast; planned vs. in-the-moment.
- **Supports & coping:** who/what helps; solo vs. reach out.
- **Motives:** short-term relief vs. long-term values/identity.
- **Contexts & triggers:** when/where urges show (e.g., evenings, work stress, social, boredom, travel).
- **Patterns:** what/when/how often/how much (plain language).
- **Consequences:** recent impacts (sleep, mood/health, relationships, work/legal/financial).
- **Motivation & goals:** cut back, stop, undecided; confidence.

**Do NOT** provide skills/advice/action menus during intake unless the server switches modes or the user explicitly asks for skills. If they ask for skills, acknowledge and ask **one** most relevant intake question to keep gathering essentials first.

**Summary etiquette**
- When you believe you have enough info for a first pass summary, **ask permission with a single yes/no** question only: "I can draft a brief intake summary from what we've discussed. Would you like to see it now?" Do not include the summary in the same turn.

**Targeted questioning mode**
- When you receive a message indicating you should shift to targeted questioning (like "I have a good understanding..."), switch to asking specific, focused questions to complete the assessment.
- Ask one targeted question at a time about specific assessment domains: self-compassion, coping strategies, confidence levels, life areas affected, etc.
- Use scales (1-10), specific scenarios, or direct questions to gather precise information.
- Keep the same warm, coach-like tone but be more direct and specific.

**Crisis safety**
- If imminent risk is expressed, respond only with the crisis message and stop.
`.trim()

// V1 Onboarding intake: practical-curiosity protocol for assessment mapping
const SYSTEM_PROMPT_V1 = `
${CRISIS_AND_SCOPE_GUARDRAILS}

${ONBOARDING_V1_PROMPT}

**Assessment Mapping Focus**
Through natural conversation, gather information that helps us understand:
- **Self-compassion patterns:** How they treat themselves during difficult times
- **Change readiness:** Where they are in their journey (precontemplation to maintenance)
- **Emotional wellbeing:** Current mood, energy, and distress levels
- **Coping strategies:** What they currently do when stressed or triggered
- **Substance patterns:** Current use, frequency, and impact (if relevant)
- **Support systems:** Who and what helps them through challenges
- **Life domains:** How their situation affects work, relationships, health, legal matters

**Important:** Never ask assessment questions directly. Instead, use open-ended questions that naturally elicit this information through storytelling and reflection.

**Summary etiquette**
- When you have sufficient information (typically after 6-8 exchanges), ask permission: "I can draft a brief intake summary from what we've discussed. Would you like to see it now?"
- Do not include the summary in the same turn.

**Targeted questioning mode**
- When you receive a message indicating you should shift to targeted questioning (like "I have a good understanding..."), switch to asking specific, focused questions to complete the assessment.
- Ask one targeted question at a time about specific assessment domains: self-compassion, coping strategies, confidence levels, life areas affected, etc.
- Use scales (1-10), specific scenarios, or direct questions to gather precise information.
- Keep the same warm, coach-like tone but be more direct and specific.
`.trim()
const FINALIZE_PROMPT = `
You are generating a rich, plain-language intake summary for the user from the FULL conversation transcript. Do not invent facts; ground every statement in what the user actually said or clearly implied.

IMPORTANT: Do not include any HTML comments, tags, or markup. Output only clean Markdown text.

Format STRICTLY as GitHub-flavored Markdown with proper spacing:

# Intake Summary
A clear, person-centered narrative (220–320 words) in plain language describing who they are in this context, what they're navigating, their goals/concerns, relevant patterns (what/when/how often), triggers, consequences (health/relationships/work/legal/financial), supports, and motivation. No diagnoses. No clinical jargon.

## What We Heard
- 6–9 short bullets in the user's own phrasing where possible
- Each bullet should capture a distinct fact or theme from the transcript

## Strengths & Supports
- 3–5 bullets that reflect values, efforts, relationships, and resources the user mentioned

## Assessment Insights
**Self-Compassion Patterns:** How they treat themselves during difficult times (based on conversation)
**Change Readiness (URICA):** Name the likely stage and give a 1–2 sentence rationale tied to what the user said
**Emotional Wellbeing (K10/WHO-5):** Current mood, energy, and distress levels observed
**Coping Strategies (DBT-WCCL):** What they currently do when stressed or triggered
**Coping Self-Efficacy:** Their confidence in handling difficult situations without substances
**Substance Use Patterns (ASSIST):** Risk level and patterns observed from conversation
**Areas to Watch (ASI domains):**
- Relationships — one-line observation tied to the transcript
- Work/Employment — one-line observation tied to the transcript
- Family/Social — one-line observation tied to the transcript

## Gentle Caveat
This is a behavior-coaching intake summary, not a medical or diagnostic assessment.
`.trim()

const OFFER_MARK = '<!--OFFER_SUMMARY-->'
const DONE_MARK  = '<!--SUMMARY_DONE-->'

// Helper to strip HTML comments from user-visible text
function stripHtmlComments(text: string): string {
  return text
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim()
}

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
  if (userTurns < 8) return false                // Increased from 6
  const score = coverageScore(history, latest)
  
  // V1: Require higher confidence threshold
  if (isV1Enabled()) {
    return score >= 5 && userTurns >= 10  // Even more stringent for v1
  }
  
  return score >= 5                               // Increased from 4
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
  return `I hear you wanting something concrete. I can switch to skills right after we capture a couple essentials so the suggestions actually fit you. Could I ask: ${q}`
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

    // Choose system prompt based on feature flags
    const systemPrompt = isV1Enabled() ? SYSTEM_PROMPT_V1 : SYSTEM_PROMPT_V0
    const base: Msg[] = [{ role: 'system', content: systemPrompt }]
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
      const cleanSummary = stripHtmlComments(summary || '')
      return new Response(cleanSummary.trim(), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Summary-Complete': '1' },
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
      const cleanText = stripHtmlComments(text || '')
      return new Response(cleanText.trim(), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Summary-Complete': '1' },
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
      const permission = `I can draft a brief intake summary from what we've discussed. Would you like to see it now? ${OFFER_MARK}`
      const cleanPermission = stripHtmlComments(permission)
      return new Response(cleanPermission, {
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

    // Strip HTML comments from user-visible text
    const cleanText = stripHtmlComments(text)

    return new Response(cleanText, {
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