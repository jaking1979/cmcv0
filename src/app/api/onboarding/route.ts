import 'server-only'
import { NextRequest } from 'next/server'
import { ITC_MASTER_PROMPT, CRISIS_AND_SCOPE_GUARDRAILS, ONBOARDING_V1_PROMPT } from '@/server/ai/promptFragments'
import { mapTranscriptToFormulation } from '@/server/ai/mapping/onboardingMapping'
import {
  type Msg,
  type DomainCoverage,
  type SafetyScreenResult,
  safetyScreen,
  isCrisis,
  computeDomainCoverage,
  domainToSegmentNumber,
  nextDomainToFocus,
  hasMinimumRequiredCoverage,
  shouldOfferSummaryNow,
  hasGoal,
  mentionsFrequency,
  mentionsTriggers,
  mentionsConsequences,
  mentionsPositiveProtection,
} from '@/server/onboarding/coverageModel'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
if (!OPENAI_API_KEY) console.warn('[onboarding] Missing OPENAI_API_KEY')

const FRUSTRATION_PHRASES = /\b(already (answered|discussed|said|covered|told you)|i (said|told you) (that|this|already)|you (already |just )asked (me |that|about)|we (already |just )(covered|went over|discussed|talked about)|i just (said|told you)|same question|i already (said|told|answered|mentioned|covered)|you already asked|we already (talked|went over|covered|discussed))\b/i

/**
 * Maps the fine-grained hint-domain keys (returned by nextDomainToFocus) to
 * their corresponding top-level field on DomainCoverage. Used to force-defer a
 * domain when the user signals frustration with repeated probing.
 *
 * 'safety' and 'opening' are intentionally absent — safety cannot be dismissed
 * by user frustration and opening is trivially complete after turn 1.
 */
const HINT_DOMAIN_TO_COVERAGE_FIELD: Partial<Record<string, keyof DomainCoverage>> = {
  currentUse:      'currentUse',
  function:        'currentUse',    // sub-area of currentUse
  emotionalDrivers: 'riskMap',
  costs:           'riskMap',
  goals:           'goals',
  identity:        'coachLens',
  protectionMap:   'protectionMap',
  coachLens:       'coachLens',
  readiness:       'readiness',
  communication:   'communication',
}

// Onboarding intake: ITC-first, conversation-led, domain-aware
const SYSTEM_PROMPT_V1 = [
  ITC_MASTER_PROMPT,
  '',
  CRISIS_AND_SCOPE_GUARDRAILS,
  '',
  ONBOARDING_V1_PROMPT,
].join('\n').trim()
const SPOKEN_SUMMARY_PROMPT = `
SPOKEN SUMMARY — generate this now. Do not ask another intake question.

Deliver the spoken summary in EXACTLY this structure and order — do not improvise the sequence:

1. Open with: "Here's what I'm hearing from you." (or a close natural variation — do not skip this line)
2. One sentence: plain-language description of the current use or behavior pattern, using the user's own words.
3. One sentence: why they came now plus their goal, even if vague or undecided.
4. One sentence: 1–2 key risk factors — specific triggers, high-risk situations, or emotional drivers they actually named.
5. One sentence beginning with "But you've also got" or a natural equivalent: 1–2 concrete protective factors (a person, a routine, a past stretch of doing better, a resource). REQUIRED — do not skip this sentence. If you have no signal for protective factors yet, do not deliver the summary — ask one more question about what has helped, even a little.
6. One sentence: one observation about how they tend to handle this — a skill, a gap, or a useful starting point. Do not moralize or prescribe.
7. End with exactly: "This is a first pass — I'll get a better picture as we keep talking. Does this feel roughly right, or is there something important I missed?"
8. After a blank line, add exactly: "Would you like me to write up a fuller version you can keep?"

RULES:
- Reflect BOTH risk (sentence 4) and protection (sentence 5) — never skip either.
- ≤130 words total.
- No headers, no bullets, no clinical terms, no stage names.
- Use the user's own words wherever possible.
- Do not insert generic filler phrases like "as we navigate this journey" or "one useful place to begin."
`.trim()

const FINALIZE_PROMPT = `
You are writing the fuller written onboarding summary for the user. Write all 4 paragraphs. This is a requirement — do not skip any paragraph.

RULES — any violation is a failure:
- Plain conversational prose only — NO markdown headers (# or ##), NO bold labels (**text**), NO bullet lists
- NO clinical instrument names: do not write URICA, K10, WHO-5, DBT-WCCL, ASSIST, ASI, or any readiness stage names
- NO diagnoses, disorder labels, or stage language (precontemplation, contemplation, etc.)
- Ground every sentence in what the user actually said — do not invent or extrapolate beyond the transcript
- Do not moralize, push toward change, or reframe pain as growth
- Do not use clinical jargon: no "relapse," "dependence," "disorder," "addict"
- Do not use generic filler phrases like "one useful place to begin," "as we navigate this," or "it may be worth exploring"
- Tone: warm, tentative, grounded — like a thoughtful colleague capturing what they heard, not a therapy note

Write exactly 4 plain paragraphs separated by blank lines:

Paragraph 1: What they are using or doing, how often, what brought them here now, and their goal in their own words. If they expressed ambivalence (e.g., "I can win it back," "part of me doesn't want to stop"), reflect both sides — do not flatten it.

Paragraph 2: The specific triggers, situations, and emotional states that make it hardest — name what they actually said. Be concrete. Do not produce a generic list of risk factors.

Paragraph 3: What helps or has helped, even a little — people, routines, places, past stretches when things went better. Reflect at least one concrete protective factor using their language. If there are genuinely no protective factors in the transcript, write: "You haven't named much on this side yet — that's something we can pay attention to as we go."

Paragraph 4: One thing you noticed about how they approach this — a skill, a gap, or a useful starting point. Frame it as a first observation, not a plan. End with exactly: "This is a first pass — we can fill in more as we go. From here, we can start wherever feels most relevant."

Maximum 220 words total. No markdown. No headers. Plain paragraphs separated by blank lines only.
`.trim()

const OFFER_MARK = '<!--OFFER_SUMMARY-->'
const DONE_MARK  = '<!--SUMMARY_DONE-->'

// Minimal system context for finalize-only calls.
// Does NOT include SYSTEM_PROMPT_V1 / ONBOARDING_V1_PROMPT — those contain
// "Responses ≤160 words" and conversational guardrails that override
// FINALIZE_PROMPT and cause the model to produce another spoken-summary-length
// response instead of the distinct fuller written writeup.
const FINALIZE_BASE: Msg[] = [{
  role: 'system',
  content: 'You are Kato, an Invitation to Change AI coach. Write the intake summary exactly as instructed. Do not ask questions. Do not hold back on length. Follow the formatting rules in the next instruction.',
}]

// Helper to strip HTML comments from user-visible text
function stripHtmlComments(text: string): string {
  return text
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim()
}

/* -------- recent non-acute overdose detection -------- */

/**
 * Returns true when the user is describing a past/recent overdose that is not
 * an active medical emergency. These cases should NOT get the generic 911 exit
 * response — they need the post-overdose conversational assessment branch.
 */
function isRecentNonAcuteOverdose(text: string): boolean {
  const t = (text || '').toLowerCase()
  return /(overdosed (last|a few|recently|this (week|month|year))|had an? (od|overdose)|experienced an? (od|overdose)|was in the (er|hospital|emergency room)|went to the (er|hospital|emergency)|narcan was used|they (used|gave me) (narcan|naloxone)|i (used|took) (too much|fentanyl|heroin|pills|opioids?) (last|a few|recently)|nar-?can (saved|helped|was there))/.test(t)
}

/**
 * Returns true if the conversation is currently in the post-overdose assessment
 * branch. Measured by finding the first user message that disclosed a recent
 * non-acute overdose and counting user turns since then.
 *
 * Stays active for up to MAX_OVERDOSE_BRANCH_TURNS user turns — enough to
 * cover all 7 assessment areas. After that, the model bridges back naturally
 * to regular onboarding regardless of what the assistant history contains.
 * This avoids the fragile phrase-matching approach which could keep the branch
 * alive indefinitely if the model keeps using words like "narcan".
 */
const MAX_OVERDOSE_BRANCH_TURNS = 8
function isInPostOverdoseBranch(history: Msg[]): boolean {
  const overdoseIdx = history.findIndex(
    m => m.role === 'user' && isRecentNonAcuteOverdose(m.content || '')
  )
  if (overdoseIdx === -1) return false
  const userTurnsSince = history.slice(overdoseIdx).filter(m => m.role === 'user').length
  return userTurnsSince <= MAX_OVERDOSE_BRANCH_TURNS
}

/* -------- post-overdose assessment prompt -------- */
const POST_OVERDOSE_BRANCH_PROMPT = `
POST-OVERDOSE CONTEXT — the person disclosed a recent overdose that was not an active emergency.

Your priorities over the next several turns, in order:
1. Immediate physical safety: Are they feeling okay physically right now? Any lingering effects?
2. Current use: Have they used since the overdose? What does that look like right now?
3. Overdose context: What happened — substance involved, alone or with others?
4. Naloxone access: Do they have Narcan at home now? Does anyone around them know how to use it?
5. Alone vs. with others: Do they tend to use alone, or is someone usually around?
6. Treatment/medication linkage: Are they connected to a doctor, program, or medication like Suboxone or methadone?
7. Near-future risk: Any upcoming high-risk situations in the next few days?

DE-ESCALATION — calibrate tone based on what they've said:
- Once they confirm they are physically safe now, not in immediate danger, and their current situation is clear: lower the sense of urgency immediately. Do not continue in a crisis register. Shift to warm, curious, conversational tone — the same you would use for any onboarding topic.
- If they are on Suboxone or connected to treatment, acknowledge that directly and briefly ("Good to know — that's a solid foundation"), then move on. Do not keep circling back to the same safety question.
- Do not project danger onto a situation the person has already described as stable.
- Areas 1–3 are urgent; areas 4–7 are important but not urgent. If 1–3 are clearly covered, your tone should reflect that.

STYLE RULES:
- Warm and direct, not clinical. One question per turn.
- Do not use the word "assessment" or "screening" aloud.
- Do not dramatize. Do not extract promises.
- After gathering the areas above, bridge naturally back into regular onboarding: "I want to make sure I understand what brought you here more broadly — what else feels important to share?"
- Offer SAMHSA (1-800-662-4357) as a resource for treatment connection only if relevant and not already connected.
`.trim()

/* -------- flow helpers -------- */
function conversationText(history: Msg[], latest: string) {
  return [...(history || []), { role: 'user', content: latest || '' }]
    .map(m => m.content || '')
    .join(' ')
}

function wantsSkills(text: string) {
  const t = (text || '').toLowerCase().replace(/[—–]/g, '-')
  return /\b(what\s+(should|can|could)\s+i\s+do|give\s+me\s+(something|options?)\s*(to\s+do)?|skills?|tool|strategy|help me|please help|advice)\b/.test(t)
}
function userAskedForSummary(s: string) {
  const t = (s || '').toLowerCase()
  return /\b(summary|report|intake\s+summary|write\s+it\s+up|can\s+you\s+summarize|fuller\s+version|full\s+version|write\s+it|write\s+that\s+up|write\s+the\s+full|full\s+writeup|please\s+write)\b/.test(t)
}
function userConsentedYes(s: string) {
  const t = (s || '').toLowerCase()
  return /\b(yes|yeah|yep|sure|please|ok(ay)?|let'?s\s+see\s+it|show\s+me)\b/.test(t)
}
function hasOfferedSummaryRecently(history: Msg[], withinTurns = 8) {
  const last = history.slice(-withinTurns)
  return last.some(m =>
    m.role === 'assistant' &&
    ((m.content || '').includes(OFFER_MARK) || // backward compat
     (m.content || '').toLowerCase().includes('write up a fuller version') ||
     (m.content || '').toLowerCase().includes('would you like me to write'))
  )
}
function hasRecentlySummarized(history: Msg[], withinTurns = 14) {
  const last = history.slice(-withinTurns)
  return last.some(m => {
    if (m.role !== 'assistant') return false
    const c = (m.content || '').toLowerCase()
    return (
      c.includes(DONE_MARK) ||                                          // backward compat
      c.includes("we'll fill in more as we keep talking") ||            // old FINALIZE_PROMPT phrase
      c.includes("from here, we can start wherever feels most relevant") || // new FINALIZE_PROMPT closer
      c.includes("i'll get a better picture as we keep talking") ||     // SPOKEN_SUMMARY_PROMPT phrase
      c.includes("here's what i'm hearing") ||                          // model-generated spoken summary
      c.includes("here's a brief summary") ||
      c.includes("here's what i've heard") ||
      c.includes("here's a summary") ||
      c.includes("if you have any other thoughts") ||                   // model wrap-up language
      c.includes("i'm here to support you in whatever") ||
      c.includes("as we move forward") ||
      c.includes("i'll keep in mind your preference") ||
      c.includes("does that capture what you wanted to share")          // post-summary confirmation
    )
  })
}
function lastTurnWasOfferAndUserSaidYes(history: Msg[]) {
  if (history.length < 2) return false
  const a = history[history.length - 2]
  const u = history[history.length - 1]
  if (a.role !== 'assistant') return false
  const assistantText = (a.content || '').toLowerCase()
  // Detect the canonical offer phrase the model is instructed to produce at the
  // end of the spoken summary — OFFER_MARK is stripped before reaching history,
  // so we match on text content instead.
  const offeredWrittenSummary =
    assistantText.includes('write up a fuller version') ||
    assistantText.includes('fuller written summary') ||
    assistantText.includes('write it up') ||
    assistantText.includes('draft a brief summary') ||
    assistantText.includes('starting to get a real picture') ||
    assistantText.includes(OFFER_MARK) // backward compat
  return offeredWrittenSummary && userConsentedYes(u.content || '')
}

/* When user asks for skills too early, return exactly one targeted intake question */
function nextIntakeQuestion(history: Msg[], latest: string): string {
  const blob = conversationText(history, latest).toLowerCase()
  if (!hasGoal(blob)) {
    return 'What are you hoping for — what would a good outcome actually look like for you?'
  }
  if (!mentionsFrequency(blob)) {
    return 'To get the fit right, what does a typical week look like — how often does this tend to happen, and what does it look like?'
  }
  if (!mentionsTriggers(blob)) {
    return 'What usually makes it harder — particular situations, feelings, or certain times?'
  }
  if (!mentionsConsequences(blob)) {
    return 'What have you noticed getting harder because of this — anything that has shifted?'
  }
  if (!mentionsPositiveProtection(blob)) {
    return 'Who or what helps, even a little — any people, routines, or things you lean on when it gets hard?'
  }
  return 'Before we switch to skills, what would a good outcome from this actually feel like in your day-to-day life?'
}

function skillsIntercept(coverage: DomainCoverage, history: Msg[], latest: string) {
  const coveredCount = [
    coverage.currentUse !== 'unseen',
    coverage.goals !== 'unseen',
    coverage.riskMap !== 'unseen',
    coverage.protectionMap !== 'unseen',
    coverage.communication !== 'unseen',
  ].filter(Boolean).length
  if (coveredCount >= 4) return null
  const q = nextIntakeQuestion(history, latest)
  return `I hear you wanting something concrete. I can switch to skills right after we capture a couple essentials so the suggestions actually fit you. Could I ask: ${q}`
}

/* -------- vague-loop detection -------- */

/**
 * True if a single user message looks like an uncertain / deflecting non-answer.
 */
function isVagueResponse(text: string): boolean {
  const t = (text || '').toLowerCase().trim()
  return (
    t.length < 80 &&
    /\b(i (don'?t|do not) know|idk|i have no (clue|idea)|not sure|i'?m not sure|no idea|i haven'?t thought|i can'?t think|nothing comes to mind|i guess not)\b/.test(t)
  )
}

/**
 * Count how many of the last 3 user messages (plus the current input) were vague.
 */
function countRecentVague(prior: Msg[], input: string): number {
  return prior
    .filter(m => m.role === 'user')
    .slice(-3)
    .concat({ role: 'user', content: input })
    .filter(m => isVagueResponse(m.content))
    .length
}

/* -------- per-turn domain focus hint -------- */

const DOMAIN_HINTS: Record<string, string> = {
  opening: `CURRENT ONBOARDING FOCUS: Opening / Why Now
Goal: Understand what brought this person here and how they frame the situation in their own words.
Example stems: "What's been going on that brought you here?" or "What made this feel like the right time to try something different?"
Do not yet ask about patterns, triggers, solutions, or what would help.`,

  currentUse: `CURRENT ONBOARDING FOCUS: Behavior Pattern
Goal: Understand what they are doing or struggling with, when, how often, and roughly what it looks like — in their own words.
Example stems: "What does a typical week look like for you?" or "How often does this tend to happen, and what does it usually look like when it does?"
Do not ask what would help or what might change. Gather information only.`,

  function: `CURRENT ONBOARDING FOCUS: Function (What does it give them?)
Goal: Understand what the behavior does for them in the short term — relief, connection, escape, routine, reward.
Example stems: "What does this do for you in the moment?" or "What does it give you that's hard to get another way?"
Do not name the function for them. Do not move to costs yet. Do not ask what they could do instead.`,

  emotionalDrivers: `CURRENT ONBOARDING FOCUS: Emotional Drivers
Goal: Understand the moods, feelings, and mental states most connected to the behavior.
Example stems: "Are there particular feelings that tend to come just before — like stress, loneliness, numbness, or something else?" or "What's usually going on emotionally when it's hardest to stay with your intentions?"
Explore without labeling. Do not suggest emotions. Do not move to coping strategies.`,

  costs: `CURRENT ONBOARDING FOCUS: Costs and Consequences
Goal: Let them name what concerns or bothers them — do not list impacts for them.
Example stems: "What, if anything, has felt harder or changed because of this?" or "Has anything shifted lately that you've noticed?"
Sit with ambivalence. Do not reassure or suggest. Do not ask what would help.`,

  goals: `CURRENT ONBOARDING FOCUS: Motivation and Goals
Goal: Understand what they want and what a good outcome looks like — even if it's vague or undecided.
Example stems: "What are you hoping for, even if it's not totally clear yet?" or "If things went better, what would be the first sign of that?"
Do not push toward a specific goal type. If they named a goal already, do NOT ask about goals again — move to the next domain.`,

  identity: `CURRENT ONBOARDING FOCUS: Identity and Meaning
Goal: Explore who they are, what this means to their sense of self, who they want to be.
Example stems: "What does this feel like it means about you, if anything?" or "Is there a version of yourself connected to this that feels important to understand?"
Explore gently. Do not interpret, resolve, or reframe. Do not ask what they could do differently.`,

  protectionMap: `CURRENT ONBOARDING FOCUS: Supports and Resources
Goal: Map who or what helps them, even a little — people, routines, places, prior efforts. Look for concrete protective factors.
Example stems: "Is there anyone who makes it a bit easier?" or "Have there been times — even briefly — when things went better? What was different then?"
Do not frame absence of support as a deficit. Accept "nothing" without pushing. Do not ask what would help going forward.`,

  coachLens: `CURRENT ONBOARDING FOCUS: Strengths and Prior Navigation
Goal: Surface what they have already tried, what capacity they have, what they've managed before — how they handle difficult decisions and impulses.
Example stems: "Have you had a stretch where things went better — even briefly? What made that possible?" or "When the urge or pull toward this hits, what tends to happen — do you usually go with it or find yourself pausing?"
Do not praise or cheerlead. If they minimize a past effort, explore what they actually did — not just the outcome.`,

  readiness: `CURRENT ONBOARDING FOCUS: Readiness and Ambivalence
Goal: Understand where they are right now — not to resolve ambivalence but to understand it clearly on both sides.
Example stems: "How does it feel right now — is part of you still unsure about this?" or "What pulls you toward trying, and what pulls you back?"
Reflect both sides. Do not push toward change. Do not insert change talk.`,

  communication: `CURRENT ONBOARDING FOCUS: Communication Style and Closing
Goal: Understand how they prefer to receive support — practical, reflective, direct, gentle, or mixed.
Example stems: "When you're working through something tough, do you find it more helpful when someone gets practical, or when they help you think it through?" or "Is there anything about how you'd like me to talk to you that would help?"
Note: "I don't know" is partial, not complete — gently probe once more if needed. This is the final intake domain before the summary.`,

  safety: `CURRENT ONBOARDING FOCUS: Safety Screen
Goal: Briefly and warmly check in on any safety-relevant areas that haven't come up — without interrogating.
Example stems: "Before we go further, I want to check in on one thing — is there anything going on physically or safety-wise that I should know about?" or "Sometimes when people are dealing with this kind of thing, there are moments that feel really unsafe. Has anything like that been happening?"
Keep it brief. One question only. Do not dramatize. If nothing concerning arises, move on.`,
}

const FRUSTRATION_REPAIR_ADDITION = `
LOOP REPAIR REQUIRED: The user has signaled they already provided this information.
— Do NOT ask about this domain again — not even with different wording.
— Mark this domain as covered for now and move on.
— Respond with one of: (a) briefly acknowledge what you've heard on this topic and shift to a genuinely new domain, (b) offer a short recap of what you've gathered so far and ask what would be useful to explore next, or (c) repair the loop explicitly: "I realize I've circled back to that — let me move on."
— Do NOT continue normal intake behavior as if nothing happened.
— Do NOT ask another question about the same domain in this turn.`

const VAGUE_LOOP_ADDITION = `
VAGUE LOOP DETECTED: The user has given uncertain or deflecting answers more than once.
— Try a concrete reframe: "Even just thinking about last week — was there one particular night that stands out?"
— Or a different angle: "Is it easier to talk about what happens before you drink, or what happens after?"
— If the next answer is also vague, accept low confidence for this domain and move on to the next one.
Do NOT repeat the same question in different words. Do NOT ask "what might help" or "what could change".`

/**
 * Extract the last 2–3 question sentences from recent assistant turns.
 * Used to inject a concrete "do not rephrase these" anti-repetition warning
 * into the domain hint — a structural guard that doesn't rely on the model
 * honoring a general instruction about repetition.
 */
function buildRecentQuestionsWarning(history: Msg[]): string {
  const questions = history
    .filter(m => m.role === 'assistant')
    .slice(-4)
    .flatMap(m =>
      (m.content || '')
        .split(/(?<=[.!?])\s+/)
        .filter(s => s.trim().endsWith('?'))
        .map(s => s.trim())
    )
    .slice(-3)
  if (questions.length === 0) return ''
  return `\nANTI-REPETITION: Do NOT ask a question with similar phrasing or covering the same angle as these recent questions:\n${questions.map(q => `- ${q}`).join('\n')}\nIf this domain already has enough signal from what was said, do not ask again — move to the next domain or offer a reflection-only bridge.`
}

/**
 * Build a short, directive system message telling the model which domain
 * is currently in focus and what a useful next question looks like.
 * Injected as a system message immediately before the user's latest input.
 */
function buildDomainHint(domainKey: string, vagueCount: number, history: Msg[], frustrationDetected = false): string {
  const base = DOMAIN_HINTS[domainKey] ?? DOMAIN_HINTS['communication']
  const repetitionWarning = buildRecentQuestionsWarning(history)
  const vagueAddition = vagueCount >= 2 ? VAGUE_LOOP_ADDITION : ''
  const frustrationAddition = frustrationDetected ? FRUSTRATION_REPAIR_ADDITION : ''
  return (base + repetitionWarning + vagueAddition + frustrationAddition).trim()
}

/* Fallback if OpenAI ever returns empty */
function buildFallback(input: string) {
  const t = (input || '').trim()
  if (!t) {
    return 'What would you like me to understand about you so I can tailor things to what you need?'
  }
  if (t.length < 40) {
    return `Something brought you here today. Could you share a bit more about what’s been going on so I can understand better?`
  }
  return `I want to make sure I have this right — ${t.slice(0, 140)}… What would you most like help with as we get started?`
}

/* Single, non-streaming call with a generous timeout */
async function callOpenAI(messages: Msg[], max_tokens = 650, temperature = 0.7) {
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
        temperature,
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
    const {
      input,
      history = [],
      finalize = false,
      closePhase,
    } = await req.json() as {
      input: string
      history?: Msg[]
      finalize?: boolean
      closePhase?: { spokenDone: boolean; writtenDone: boolean }
    }

    // Hard gate: if the written summary has already been delivered, never re-enter
    // summary or wrap-up mode regardless of what the model might generate.
    if (closePhase?.writtenDone) {
      const base: Msg[] = [{ role: 'system', content: SYSTEM_PROMPT_V1 }]
      const prior = (history || []).filter(m => m.role === 'user' || m.role === 'assistant')
      const convo = [
        ...base,
        ...prior,
        {
          role: 'system' as const,
          content: 'CLOSE PHASE COMPLETE. The intake summary has already been delivered. Do NOT summarize again, do NOT say "as we wrap up," do NOT offer to write anything up. Acknowledge briefly and ask how they want to begin coaching.',
        },
        { role: 'user' as const, content: input || '' },
      ]
      const text = await callOpenAI(convo, 300, 0.4)
      return new Response(stripHtmlComments(text), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Onboarding-Segment': '9',
        },
      })
    }

    // Safety screen — expanded beyond simple crisis check.
    // Overdose patterns are split: acute → static exit; recent non-acute → assessment branch.
    const safety = safetyScreen(input)
    if (safety.triggered) {
      // For overdose type, check if it is actually a recent non-acute disclosure
      // before returning the static exit response.
      if (safety.type === 'overdose' && isRecentNonAcuteOverdose(input)) {
        // Fall through to the post-overdose branch below — do not return here.
      } else {
        return new Response(safety.response ?? '', {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Safety-Type': safety.type ?? 'unknown',
          },
        })
      }
    }

    const base: Msg[] = [{ role: 'system', content: SYSTEM_PROMPT_V1 }]
    const prior = (history || []).filter(m => m.role === 'user' || m.role === 'assistant')
    const transcriptWithCurrent = prior.concat({ role: 'user', content: input || '' })

    // Compute coverage-led state — replaces old deriveCurrentSegment / hasEnoughSignal
    const coverage = computeDomainCoverage(prior, input)
    const userTurns = prior.filter(m => m.role === 'user').length
    let activeDomain = nextDomainToFocus(coverage, userTurns)

    // Frustration structural deferral: when the user signals they already answered a
    // domain, force that domain to 'deferred' in a working copy of coverage and
    // re-derive the next domain. This is a state change — not just a prompt hint —
    // so the same domain is not re-probed on the next turn either.
    const frustrationDetected = FRUSTRATION_PHRASES.test(input || '')
    let workingCoverage = coverage
    if (frustrationDetected) {
      const field = HINT_DOMAIN_TO_COVERAGE_FIELD[activeDomain]
      if (field && workingCoverage[field] !== 'complete') {
        workingCoverage = { ...coverage, [field]: 'deferred' as const }
        activeDomain = nextDomainToFocus(workingCoverage, userTurns)
      }
    }

    const currentSegment = domainToSegmentNumber(activeDomain)

    // Post-overdose branch: check early — before summary checks — so the
    // assessment takes priority over spoken-summary or finalize triggers.
    // The branch exits automatically after MAX_OVERDOSE_BRANCH_TURNS user turns.
    const inOverdoseBranch = isRecentNonAcuteOverdose(input) || isInPostOverdoseBranch(prior)
    if (inOverdoseBranch) {
      const overdoseConvo: Msg[] = [
        ...base,
        ...prior,
        { role: 'system', content: POST_OVERDOSE_BRANCH_PROMPT },
        { role: 'user', content: input || '' },
      ]
      const overdoseText = await callOpenAI(overdoseConvo, 500, 0.4)
      return new Response(stripHtmlComments(overdoseText || buildFallback(input)), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Onboarding-Segment': String(currentSegment),
          'X-Safety-Type': 'post_overdose_branch',
        },
      })
    }

    /**
     * Build the formulation context string for summary generation.
     * Runs mapTranscriptToFormulation synchronously before generating the
     * written summary so the summary is grounded in structured formulation
     * state — not just the raw transcript alone.
     */
    async function buildFormulationContext(transcript: Msg[]): Promise<string> {
      try {
        const transcriptText = transcript
          .filter(m => m.role !== 'system')
          .map(m => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content || ''}`)
          .join('\n\n')
        const formulation = await mapTranscriptToFormulation(`session_${Date.now()}`, transcriptText)
        return `\n\nSTRUCTURED FORMULATION CONTEXT (produced from this transcript — use alongside the conversation to strengthen accuracy):\n${JSON.stringify(formulation, null, 2)}`
      } catch {
        return ''
      }
    }

    // If last turn was a summary offer and user said yes now, produce the written summary.
    if (lastTurnWasOfferAndUserSaidYes(transcriptWithCurrent) || userAskedForSummary(input || '')) {
      const formulationCtx = await buildFormulationContext(transcriptWithCurrent)
      const messages: Msg[] = [
        ...FINALIZE_BASE,
        { role: 'system', content: FINALIZE_PROMPT + formulationCtx },
        {
          role: 'user',
          content: `Here is the full transcript as JSON array of {role,content}. Write the intake summary report now:\n\n${JSON.stringify(transcriptWithCurrent)}`
        }
      ]
      const summary = await callOpenAI(messages, 900)
      const cleanSummary = stripHtmlComments(summary || '')
      return new Response(cleanSummary.trim(), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Summary-Complete': '1',
          'X-Onboarding-Segment': String(currentSegment),
        },
      })
    }

    // Explicit finalize flag (button) -> produce the written summary now, bypassing coverage gate.
    // Keyword detection (wantsFinish) is intentionally NOT included here — when a user says
    // something like "wrap up" mid-conversation, the AI should check intent first rather than
    // immediately producing a summary. The spoken → written flow handles that naturally.
    if (finalize) {
      const transcript = prior.concat({ role: 'user', content: input || '' })
      const formulationCtx = await buildFormulationContext(transcript)
      // Add coverage warning if domains are still missing
      const missingDomains: string[] = []
      if (coverage.protectionMap === 'unseen') missingDomains.push('protection map (what helps)')
      if (coverage.safety === 'unseen') missingDomains.push('safety screen')
      if (coverage.communication === 'unseen') missingDomains.push('communication style')
      const coverageNote = missingDomains.length > 0
        ? `\n\nCOVERAGE NOTE: The following domains were not covered in this transcript — write around the gaps honestly: ${missingDomains.join(', ')}.`
        : ''
      const messages: Msg[] = [
        ...FINALIZE_BASE,
        { role: 'system', content: FINALIZE_PROMPT + formulationCtx + coverageNote },
        {
          role: 'user',
          content: `Here is the full transcript as JSON array of {role,content}. Write the intake summary report now:\n\n${JSON.stringify(transcript)}`,
        },
      ]
      const finText = await callOpenAI(messages, 900)
      const cleanFinText = stripHtmlComments(finText || '')
      return new Response(cleanFinText.trim(), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Summary-Complete': '1',
          'X-Onboarding-Segment': String(currentSegment),
        },
      })
    }

    // Intercept skills requests during onboarding until we have enough coverage
    if (wantsSkills(input)) {
      const intercept = skillsIntercept(coverage, prior, input)
      if (intercept) {
        return new Response(intercept, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Onboarding-Segment': String(currentSegment),
          },
        })
      }
      // else: allow model to proceed
    }

    // Coverage complete: generate spoken summary, then offer written version
    // Uses workingCoverage so frustration-deferred domains don't block unnecessarily.
    const readyToOffer = shouldOfferSummaryNow(workingCoverage, prior)
    if (
      readyToOffer &&
      !hasOfferedSummaryRecently(prior) &&
      !hasRecentlySummarized(prior)
    ) {
      const spokenConvo: Msg[] = [
        ...base,
        ...prior,
        { role: 'system', content: SPOKEN_SUMMARY_PROMPT },
        { role: 'user', content: input || '' },
      ]
      const spokenText = await callOpenAI(spokenConvo, 300, 0.5)
      // Append OFFER_MARK so lastTurnWasOfferAndUserSaidYes() can detect it next turn
      const spokenWithMark = `${spokenText || ''}\n${OFFER_MARK}`.trim()
      const cleanSpoken = stripHtmlComments(spokenWithMark)
      return new Response(cleanSpoken, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Onboarding-Segment': String(currentSegment),
          'X-Spoken-Summary': '1',
        },
      })
    }

    // Regular onboarding turn — inject per-turn domain focus hint before user message
    const vagueCount = countRecentVague(prior, input)
    const domainHint = buildDomainHint(activeDomain, vagueCount, prior, frustrationDetected)
    const convo: Msg[] = [
      ...base,
      ...prior,
      { role: 'system', content: domainHint },
      { role: 'user', content: input || '' },
    ]
    // Lower temperature for structured intake — reduces improvisational drift
    const text = await callOpenAI(convo, 500, 0.4)

    if (!text) {
      const fb = buildFallback(input || '')
      console.warn('[onboarding] Empty OpenAI content; returning fallback.')
      return new Response(fb, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Onboarding-Fallback': '1',
          'X-Onboarding-Segment': String(currentSegment),
        },
      })
    }

    // Strip HTML comments from user-visible text
    const cleanText = stripHtmlComments(text)

    return new Response(cleanText, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Onboarding-Segment': String(currentSegment),
      },
    })
  } catch (e) {
    console.error('[onboarding] Handler error:', e)
    return new Response('Sorry — something went wrong generating a response.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}

// isCrisis() is defined above as a thin wrapper around safetyScreen().