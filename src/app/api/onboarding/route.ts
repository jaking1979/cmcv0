import 'server-only'
import { NextRequest } from 'next/server'
import { ITC_MASTER_PROMPT, CRISIS_AND_SCOPE_GUARDRAILS, ONBOARDING_V1_PROMPT } from '@/server/ai/promptFragments'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
if (!OPENAI_API_KEY) console.warn('[onboarding] Missing OPENAI_API_KEY')

type Msg = { role: 'user'|'assistant'|'system'; content: string }

// Feature flag check — used only for the onboarding map pipeline (shouldOfferSummaryNow).
// The conversational system prompt is always V1; V0 has been retired.
function isV1Enabled(): boolean {
  return process.env.FEATURE_V1 === '1' && process.env.FEATURE_ONBOARDING_MAP === '1'
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

Deliver the spoken summary in this order:
1. Open with: "Here's what I'm hearing from you." (or a natural variation)
2. 2–3 sentences: what they've shared about their use, what brought them here, and their goal — even if it's vague or undecided
3. 1–2 sentences: what tends to make it hard AND what has helped or could help, even a little
4. 1 sentence: one thing you noticed about how they approach this or what they bring to it, framed supportively
5. End with: "This is a first pass — I'll get a better picture as we keep talking. Does this feel roughly right, or is there something important I missed?"
6. After a line break, add exactly this line: "Would you like me to write up a fuller version you can keep?"

Total: ≤130 words. Plain conversational language only. No headers, no bullets, no clinical terms, no stage names.
`.trim()

const FINALIZE_PROMPT = `
You are writing the fuller onboarding summary for the user.

RULES — any violation is a failure:
- Plain conversational prose only — NO markdown headers (# or ##), NO bold labels (**text**), NO bullet lists
- NO clinical instrument names: do not write URICA, K10, WHO-5, DBT-WCCL, ASSIST, ASI, or any readiness stage names
- NO diagnoses, disorder labels, or stage language (precontemplation, contemplation, etc.)
- Ground every sentence in what the user actually said — do not invent or extrapolate beyond the transcript
- Do not moralize, push toward change, or reframe pain as growth
- Do not use clinical jargon: no "relapse," "dependence," "disorder," "addict"

Write exactly 3–4 plain paragraphs separated by blank lines:

Paragraph 1: What they shared about their use, what brought them here, and their goal — even if the goal is "not sure yet." Use their own words where possible.

Paragraph 2: What tends to make it hard — the specific triggers, situations, or feelings they named. Be concrete, tied to what they said, not general.

Paragraph 3: What helps, even a little — people, routines, past stretches when things went better, or anything they identified as a resource.

Paragraph 4 (include only if there is enough material): One thing that stands out as a useful place to begin. Frame it as a first hypothesis, not a plan or prescription. End the paragraph with: "This is a first pass — we'll fill in more as we keep talking."

Maximum 200 words total. No markdown. No headers. Plain paragraphs separated by blank lines only.
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
function mentionsFunction(text: string) {
  const t = (text || '').toLowerCase()
  return /(relax|calm|numbs?|takes? (the )?edge|feel(s)? better|helps? me|escape|forget|cope|relief|wind down|unwinding|unwind|socialize)/.test(t)
}
function mentionsIdentity(text: string) {
  const t = (text || '').toLowerCase()
  return /(who i am|who i'd be|who i would be|my identity|part of me|defines? me|without (drinking|using|it)|i'm (not )?(just |really )?(a |an )?(drinker|user|addict|alcoholic)|always been|how i see myself)/.test(t)
}
function mentionsStrengths(text: string) {
  const t = (text || '').toLowerCase()
  return /(tried before|cut back before|quit for|was sober|i can|i've managed|proud|strong|resilient|value|good at|worked hard|fought through|pushed through|survived)/.test(t)
}
function mentionsReadiness(text: string) {
  const t = (text || '').toLowerCase()
  return /(ready|not ready|thinking about|considering|want to change|don't want to|part of me wants|ambivalen|not sure (if|whether)|on the fence|maybe|someday|not yet)/.test(t)
}
function mentionsCommunicationStyle(text: string) {
  const t = (text || '').toLowerCase()
  return /(direct|give it to me straight|just tell me|practical|gentle|reflective|prefer.*support|how (i'd like|you) to talk|feedback style|blunt|soft|help me think)/.test(t)
}
function mentionsSafetyTopics(text: string) {
  const t = (text || '').toLowerCase()
  return /(safe|safety|overdose|overdosed|withdrawal|blackout|blacked out|using alone|alone when (i use|using)|mixing|suicid|harm yourself|physically unsafe|medical emergency|domestic|violence)/.test(t)
}
function mentionsEmotionalDrivers(text: string) {
  const t = (text || '').toLowerCase()
  return /(anxiet|depress|mood|mental health|panic|sad|overwhelm|numb|empty|disconnected|trauma|ptsd|worthless|shame|guilt|angry|rage|lonely|isolat|grief|stress|burnout|can't (sleep|function|cope)|low energy|exhausted|hopeless)/.test(t)
}
function mentionsValues(text: string) {
  const t = (text || '').toLowerCase()
  return /(matter(s)? to me|important to me|care about|believe in|kind of person|my kids|my family|my health|my career|my relationship|what i want|legacy|proud of|not who i am|who i want to be|i value|my values|what matters)/.test(t)
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
 * Returns true if any recent assistant or user message indicates the post-overdose
 * assessment branch is already active (so it persists across turns).
 */
function isInPostOverdoseBranch(history: Msg[]): boolean {
  return history.slice(-10).some(m => {
    if (m.role !== 'assistant') return false
    const c = (m.content || '').toLowerCase()
    return (
      c.includes('narcan') ||
      c.includes('naloxone') ||
      c.includes('glad you\'re still here') ||
      c.includes('post-overdose') ||
      c.includes('since the overdose') ||
      c.includes('after the od')
    )
  })
}

/* -------- post-overdose assessment prompt -------- */
const POST_OVERDOSE_BRANCH_PROMPT = `
POST-OVERDOSE ASSESSMENT — a recent overdose was disclosed. Pause the regular onboarding flow.

Your priorities for the next several turns, in order:
1. Immediate physical safety: Are they feeling okay physically right now? Any lingering effects?
2. Current use: Have they used since the overdose? What does use look like right now?
3. Overdose context: What happened — substance involved, alone or with others?
4. Naloxone access: Do they have Narcan at home now? Do people around them know how to use it?
5. Alone vs. with others: Do they tend to use alone, or is someone usually around?
6. Treatment/medication linkage: Are they connected to a doctor, program, or medication like Suboxone or methadone?
7. Near-future risk: Any upcoming high-risk situations in the next few days?

STYLE RULES for this branch:
- Warm and direct, not clinical. One question per turn.
- Do not use the word "assessment" or "screening" aloud.
- Do not dramatize. Do not extract promises.
- After gathering the 7 areas above, bridge naturally back into the regular onboarding domains.
- Offer SAMHSA (1-800-662-4357) as a resource for treatment connection if relevant.
`.trim()

/* -------- safety screen -------- */

interface SafetyScreenResult {
  triggered: boolean
  type?: 'suicidality' | 'self_harm' | 'overdose' | 'withdrawal' | 'blackout' | 'domestic_violence'
  response?: string
}

/**
 * Expanded safety screen covering suicidality, overdose, withdrawal,
 * blackout-with-risk, and domestic violence — replacing the simpler isCrisis().
 * Returns a structured result so callers can attach metadata.
 */
function safetyScreen(text: string): SafetyScreenResult {
  const t = (text || '').toLowerCase()

  const falsePositives = [
    /kill time/,
    /this game.*kill me/,
    /die of laughter|dying of laughter/,
    /harm reduction/,
    /overdose (awareness|prevention|education)/,
  ]
  const isFalsePositive = falsePositives.some(re => re.test(t))

  // Suicidality / self-harm
  const suicidalPatterns = [
    /\bkill myself\b/, /\btake my own life\b/, /\bend my life\b/,
    /\bsuicid(e|al)\b/, /\bhurt myself\b/, /\bharm myself\b/,
    /\bdon'?t want to (be here|live|exist)\b/,
    /\bwish i (was|were) dead\b/,
  ]
  if (!isFalsePositive && suicidalPatterns.some(re => re.test(t))) {
    return {
      triggered: true,
      type: 'suicidality',
      response: `Thank you for telling me that. What you're describing matters, and it's more than I can hold safely on my own. If you're thinking about ending your life or hurting yourself, please reach out to the 988 Suicide and Crisis Lifeline — call or text 988, anytime. If you're in immediate danger, please call 911. I'm still here, and I want to understand more about where you are right now — would it be okay to stay with this a moment?`,
    }
  }

  // Overdose risk
  const overdosePatterns = [
    /\boverdos(e|ing|ed)\b/,
    /\bod'?d?\b(?![a-zA-Z])/,
    /\btook too (much|many)\b/,
  ]
  if (!isFalsePositive && overdosePatterns.some(re => re.test(t))) {
    return {
      triggered: true,
      type: 'overdose',
      response: `I want to make sure you're okay right now. If you or someone near you may be overdosing, please call 911 immediately — this is a medical emergency. For naloxone access or overdose prevention support, SAMHSA is available at 1-800-662-4357. Can you tell me more about what's happening right now?`,
    }
  }

  // Withdrawal risk (physical symptoms that can be medically serious)
  const withdrawalPatterns = [
    /\bwithdraw(al|ing|n)\b/,
    /\bdope\s*sick\b/,
    /\bsick from (stopping|quitting|not (drinking|using))\b/,
    /\bseizure from (alcohol|drinking|stopping)\b/,
    /\bshaking (from|because|since) (quitting|stopping|not drinking)\b/,
    /\bsweating (from|because|since) (quitting|stopping|not drinking)\b/,
  ]
  if (withdrawalPatterns.some(re => re.test(t))) {
    return {
      triggered: true,
      type: 'withdrawal',
      response: `What you're describing sounds like it could be physical withdrawal, which can be medically serious — especially with alcohol or certain other substances. Please consider contacting a doctor or calling SAMHSA's helpline at 1-800-662-4357; they can connect you with medical support. Are you somewhere safe right now?`,
    }
  }

  // Blackout pattern with unsafe circumstances
  const blackoutPattern = /(blacked out|blackout|don'?t remember (what|where|how|anything)|lost (consciousness|time|hours|the night))/
  const unsafeContext = /(dangerous|hurt|accident|drove|driving|alone|unsafe|strange place|didn'?t know where)/
  if (blackoutPattern.test(t) && unsafeContext.test(t)) {
    return {
      triggered: true,
      type: 'blackout',
      response: `I'm hearing something that concerns me — losing memory or consciousness in unsafe situations carries real physical risk, and I want to take that seriously. Are you in a safe place right now? And can you tell me a bit more about what happened?`,
    }
  }

  // Domestic violence / physical danger
  const dvPatterns = [
    /\bhe (hit|beat|hurt|choked|threatened|grabbed) me\b/,
    /\bshe (hit|beat|hurt|choked|threatened|grabbed) me\b/,
    /\bbeing (abused|hurt|threatened) by\b/,
    /\bafraid of (my partner|him|her|them)\b/,
    /\bdomestic violence\b/,
    /\bhe'?s? going to (hurt|kill) me\b/,
    /\bshe'?s? going to (hurt|kill) me\b/,
  ]
  if (dvPatterns.some(re => re.test(t))) {
    return {
      triggered: true,
      type: 'domestic_violence',
      response: `What you just shared is important and I don't want to gloss over it. If you're in a situation where you feel unsafe with a partner or anyone in your home, the National Domestic Violence Hotline is available 24/7 at 1-800-799-7233 — you can also text START to 88788. You don't have to navigate this alone. Are you safe right now?`,
    }
  }

  return { triggered: false }
}

/** Thin backward-compat wrapper used in the existing route logic. */
function isCrisis(text: string): boolean {
  return safetyScreen(text).triggered
}

/* -------- segment tracking -------- */

/**
 * Derive which of the 10 onboarding domains we are likely in
 * based on coverage heuristics. Returns 0–9.
 */
function deriveCurrentSegment(history: Msg[], latest: string): number {
  const blob = conversationText(history, latest)
  const userTurns = history.filter(m => m.role === 'user').length

  // Domain 0 — Opening: always covered once they say anything substantive
  if (userTurns < 1) return 0

  // Domain 1 — Behavior pattern
  if (!mentionsFrequency(blob)) return 1

  // Domain 2 — Function: what the behavior gives them
  if (!mentionsFunction(blob) && userTurns < 4) return 2

  // Domain 3 — Costs & consequences
  if (!mentionsConsequences(blob)) return 3

  // Domain 4 — Motivation & goals
  if (!hasGoal(blob)) return 4

  // Domain 5 — Identity
  if (!mentionsIdentity(blob) && userTurns < 7) return 5

  // Domain 6 — Supports
  if (!mentionsSupports(blob)) return 6

  // Domain 7 — Strengths
  if (!mentionsStrengths(blob) && userTurns < 9) return 7

  // Domain 8 — Readiness & ambivalence
  if (!mentionsReadiness(blob) && userTurns < 11) return 8

  // Domain 9 — Communication style
  if (!mentionsCommunicationStyle(blob) && userTurns < 13) return 9

  // Domain 10 (stored as 9 since 0-indexed) — Safety screen + closing
  return 9
}

/**
 * Whether a given segment has gathered "enough signal" to be considered covered.
 * Used by the route to decide whether to advance the segment counter.
 */
function hasEnoughSignal(segment: number, history: Msg[], latest: string): boolean {
  const blob = conversationText(history, latest)
  const userTurns = history.filter(m => m.role === 'user').length

  switch (segment) {
    case 0: return userTurns >= 1
    case 1: return mentionsFrequency(blob)
    case 2: return mentionsFunction(blob) || userTurns >= 4
    case 3: return mentionsConsequences(blob)
    case 4: return hasGoal(blob)
    case 5: return mentionsIdentity(blob) || userTurns >= 7
    case 6: return mentionsSupports(blob)
    case 7: return mentionsStrengths(blob) || userTurns >= 9
    case 8: return mentionsReadiness(blob) || userTurns >= 11
    case 9: return mentionsCommunicationStyle(blob) || mentionsSafetyTopics(blob) || userTurns >= 14
    default: return false
  }
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
  if (mentionsFunction(userText)) score++
  if (mentionsStrengths(userText)) score++
  if (mentionsReadiness(userText)) score++
  if (mentionsEmotionalDrivers(userText)) score++
  if (mentionsValues(userText)) score++
  return score // 0..10
}

/**
 * Returns true when the minimum required domains for a complete onboarding
 * formulation all have at least some signal. Used instead of a raw score
 * threshold to ensure no specific domain is skipped.
 */
function hasMinimumRequiredCoverage(history: Msg[], latest: string): boolean {
  const userText = history
    .filter(m => m.role === 'user')
    .map(m => (m.content || '').toLowerCase())
    .concat((latest || '').toLowerCase())
    .join('\n')

  return (
    mentionsFrequency(userText) &&                   // behavior pattern
    mentionsTriggers(userText) &&                    // triggers/high-risk
    mentionsFunction(userText) &&                    // function
    mentionsConsequences(userText) &&                // costs
    hasGoal(userText) &&                             // goal
    (mentionsEmotionalDrivers(userText) ||           // emotional drivers OR supports
     mentionsSupports(userText))
  )
}

function shouldOfferSummaryNow(history: Msg[], latest: string) {
  const userTurns = history.filter(m => m.role === 'user').length
  if (userTurns < 7) return false
  const segment = deriveCurrentSegment(history, latest)
  // Require all 6 minimum required domains AND segment 9 (wrap-up domain) AND minimum turn count.
  return hasMinimumRequiredCoverage(history, latest) && userTurns >= 7 && segment >= 9
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
      c.includes("we'll fill in more as we keep talking") ||            // FINALIZE_PROMPT phrase
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

const DOMAIN_HINTS: Record<number, string> = {
  0: `CURRENT ONBOARDING FOCUS: Opening / Why Now
Goal: Understand what brought this person here and how they frame the situation in their own words.
Example stems: "What's been going on that brought you here?" or "What made this feel like the right time to try something different?"
Do not yet ask about patterns, triggers, solutions, or what would help.`,

  1: `CURRENT ONBOARDING FOCUS: Behavior Pattern
Goal: Understand what they are using, when, how often, and roughly how much — in their own words.
Example stems: "What does a typical week look like for you?" or "When you do drink, roughly how much tends to happen?"
Do not ask what would help or what might change. Gather information only.`,

  2: `CURRENT ONBOARDING FOCUS: Function (What does it give them?)
Goal: Understand what the behavior does for them in the short term — relief, connection, escape, routine, reward.
Example stems: "What does drinking do for you in the moment?" or "What does it give you that's hard to get another way?"
Do not name the function for them. Do not move to costs yet. Do not ask what they could do instead.`,

  3: `CURRENT ONBOARDING FOCUS: Costs and Consequences
Goal: Let them name what concerns or bothers them — do not list impacts for them.
Example stems: "What, if anything, has felt harder because of your drinking?" or "Has anything shifted lately that you've noticed?"
Sit with ambivalence. Do not reassure or suggest. Do not ask what would help.`,

  4: `CURRENT ONBOARDING FOCUS: Motivation and Goals
Goal: Understand what they want and what a good outcome looks like — even if it's vague or undecided.
Example stems: "What are you hoping for, even if it's not totally clear yet?" or "If things went better, what would be the first sign of that?"
Do not push toward a specific goal type. If they named a goal already, do NOT ask about goals again — move to the next domain.`,

  5: `CURRENT ONBOARDING FOCUS: Identity and Meaning
Goal: Explore who they are, what this means to their sense of self, who they want to be.
Example stems: "What does this feel like it means about you, if anything?" or "Is there a version of yourself connected to this that feels important to understand?"
Explore gently. Do not interpret, resolve, or reframe. Do not ask what they could do differently.`,

  6: `CURRENT ONBOARDING FOCUS: Supports and Resources
Goal: Map who or what helps them, even a little — people, routines, places, prior efforts.
Example stems: "Is there anyone who makes it a bit easier?" or "Have there been times — even briefly — when things went better? What was different then?"
Do not frame absence of support as a deficit. Accept "nothing" without pushing. Do not ask what would help going forward.`,

  7: `CURRENT ONBOARDING FOCUS: Strengths and Prior Navigation
Goal: Surface what they have already tried, what capacity they have, what they've managed before.
Example stems: "Have you gotten through a stretch without drinking before, even briefly? What made that possible?" or "What have you tried, even if it didn't stick?"
Do not praise or cheerlead. If they minimize a past effort, explore what they actually did — not just the outcome.`,

  8: `CURRENT ONBOARDING FOCUS: Readiness and Ambivalence
Goal: Understand where they are right now — not to resolve ambivalence but to understand it.
Example stems: "How does it feel right now — is part of you still unsure about this?" or "What pulls you toward trying, and what pulls you back?"
Reflect both sides. Do not push toward change. Do not insert change talk.`,

  9: `CURRENT ONBOARDING FOCUS: Communication Style and Closing
Goal: Understand how they prefer to receive support, then move toward a summary offer.
Example stems: "When you're working through something tough, do you find it more helpful when someone gets practical, or when they help you think it through?" or "Is there anything about how you'd like me to talk to you that would help?"
This is the final intake domain. After this, offer a summary.`,
}

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
function buildDomainHint(segment: number, vagueCount: number, history: Msg[]): string {
  const base = DOMAIN_HINTS[Math.min(segment, 9)] ?? DOMAIN_HINTS[9]
  const repetitionWarning = buildRecentQuestionsWarning(history)
  const vagueAddition = vagueCount >= 2 ? VAGUE_LOOP_ADDITION : ''
  return (base + repetitionWarning + vagueAddition).trim()
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
      segment: clientSegment,
      closePhase,
    } = await req.json() as {
      input: string
      history?: Msg[]
      finalize?: boolean
      segment?: number   // 0-9; client may pass current segment, server derives if absent
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

    // Choose system prompt based on feature flags
    const systemPrompt = SYSTEM_PROMPT_V1
    const base: Msg[] = [{ role: 'system', content: systemPrompt }]
    const prior = (history || []).filter(m => m.role === 'user' || m.role === 'assistant')
    const transcriptWithCurrent = prior.concat({ role: 'user', content: input || '' })

    // Derive current segment (use client hint if valid, otherwise compute)
    const currentSegment =
      typeof clientSegment === 'number' && clientSegment >= 0 && clientSegment <= 9
        ? clientSegment
        : deriveCurrentSegment(prior, input)
    const segmentComplete = hasEnoughSignal(currentSegment, prior, input)
    const nextSegment = segmentComplete ? Math.min(currentSegment + 1, 9) : currentSegment

    // If last turn was a summary offer and user said yes now, produce the summary.
    if (lastTurnWasOfferAndUserSaidYes(transcriptWithCurrent) || userAskedForSummary(input || '')) {
      const messages: Msg[] = [
        ...FINALIZE_BASE,
        { role: 'system', content: FINALIZE_PROMPT },
        {
          role: 'user',
          content: `Here is the full transcript as JSON array of {role,content}. Write the intake summary report now:\n\n${JSON.stringify(transcriptWithCurrent)}`
        }
      ]
      const summary = await callOpenAI(messages, 800)
      const cleanSummary = stripHtmlComments(summary || '')
      return new Response(cleanSummary.trim(), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Summary-Complete': '1',
          'X-Onboarding-Segment': String(nextSegment),
        },
      })
    }

    // Explicit "finish" or finalize flag -> produce the summary now.
    if (finalize || wantsFinish(input)) {
      const transcript = prior.concat({ role: 'user', content: input || '' })
      const messages: Msg[] = [
        ...FINALIZE_BASE,
        { role: 'system', content: FINALIZE_PROMPT },
        {
          role: 'user',
          content: `Here is the full transcript as JSON array of {role,content}. Write the intake summary report now:\n\n${JSON.stringify(transcript)}`,
        },
      ]
      const finText = await callOpenAI(messages, 800)
      const cleanFinText = stripHtmlComments(finText || '')
      return new Response(cleanFinText.trim(), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Summary-Complete': '1',
          'X-Onboarding-Segment': String(nextSegment),
        },
      })
    }

    // Intercept skills requests during onboarding until we have enough coverage
    if (wantsSkills(input)) {
      const intercept = skillsIntercept(prior, input)
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

    // Segment 9 close: generate spoken summary via model, then offer written version
    const readyToOffer = shouldOfferSummaryNow(prior, input)
    if (
      readyToOffer &&
      !wantsFinish(input) &&
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
          'X-Onboarding-Segment': String(nextSegment),
          'X-Spoken-Summary': '1',
        },
      })
    }

    // Post-overdose branch: inject specialized assessment prompt if recent non-acute
    // overdose was disclosed in the current input OR is already active in the history.
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

    // Regular onboarding turn — inject per-turn domain focus hint before user message
    const vagueCount = countRecentVague(prior, input)
    const domainHint = buildDomainHint(currentSegment, vagueCount, prior)
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
        'X-Onboarding-Segment': String(nextSegment),
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