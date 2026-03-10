/**
 * Coverage-led onboarding model — V1.
 *
 * Extracted from route.ts so that it can be imported by both the API route
 * and the unit test suite without violating Next.js's constraint that route
 * files may only export HTTP handler names (GET, POST, etc.).
 */

export type Msg = { role: 'user' | 'assistant' | 'system'; content: string }

/* -------- heuristics -------- */

export function hasGoal(text: string) {
  const t = (text || '').toLowerCase()
  // Substance goals (original)
  if (/(quit|stop|cut\s*back|reduce|abstinen|moderate|change my (drinking|use)|stay sober|be sober|dry january|dry\s+jan)/.test(t)) return true
  // Exercise / activity goals
  if (/(exercise (more|regularly|consistently|better)|work\s*out\s*(more|regularly|consistently)|get\s*(fit|in\s*shape|more\s*active|stronger|healthier)|be\s*more\s*active|start\s*(exercising|running|going\s*to\s*the\s*gym|working\s*out)|feel\s*(stronger|better|healthier|fitter)|look\s*(better|fitter)|build\s*(muscle|strength|fitness))/.test(t)) return true
  // Sleep goals
  if (/(sleep\s*(better|more|longer)|fix\s*my\s*sleep|improve\s*my\s*sleep)/.test(t)) return true
  // Eating / diet goals
  if (/(eat\s*(better|healthier|less|more\s*consistently)|change\s*my\s*(eating|diet)|lose\s*weight|improve\s*my\s*(diet|nutrition))/.test(t)) return true
  // General behavior-change goals
  if (/(change\s*my\s*habits?|work\s*on\s*(myself|this|it)|get\s*back\s*on\s*track|do\s*(better|more|differently|something\s*about))/.test(t)) return true
  return false
}
export function mentionsFrequency(text: string) {
  const t = (text || '').toLowerCase()
  return /(every day|daily|nightly|weekend|x\/wk|times a (day|week)|\b\d+\s*(drinks?|times?|steps?|miles?|km|minutes?|min\b|hours?)\b|\b\d+k\s*steps|morning|evening|night|once a (day|week|month)|twice a (week|day)|a few times|rarely|never exercise|little (activity|exercise|movement)|almost (never|nothing)|not (much|really)|barely move|don'?t (exercise|work out|move much)|little to no)/.test(t)
}
export function mentionsTriggers(text: string) {
  const t = (text || '').toLowerCase()
  return /(stress|anxiet|fight|argument|lonely|bored|party|airport|travel|work|craving|urge|social|friends?)/.test(t)
}
export function mentionsConsequences(text: string) {
  const t = (text || '').toLowerCase()
  return /(hangover|withdrawal|dope\s*sick|tolerance|black(out|ed)|sleep|health|relationship|partner|kids?|job|work|boss|late|promotion|legal|court|probation|money|broke|finances?)/.test(t)
}

/** Positive protective factors — people, routines, or past successes explicitly framed as helpful.
 *
 * Bare person mentions ("my family", "my partner") are intentionally excluded.
 * A person only counts as a protective factor when the statement explicitly frames
 * them as helpful (e.g. "my family helps me", "I lean on my partner", "I can count on
 * my friend"). This prevents conflict mentions ("my partner and I fight") or neutral
 * mentions from inflating the protection map.
 */
export function mentionsPositiveProtection(text: string) {
  const t = (text || '').toLowerCase()
  return /(helps? me|helped me|keeps? me|kept me|grounds? me|calms? me|steadies me|i lean on|i can count on|routine (helps?|keeps?|grounds?)|working out|exercise helps?|gym helps?|meeting helps?|talking to|got through|made it through|better when|good stretch|sober (for|stretch|period)|worked before|what worked|has worked|makes it easier|anchor|support (system|network)|i'm not alone|someone i trust|people who|someone who cares)/.test(t)
}

/** Count distinct positive-protection signal categories present in text.
 *
 * Category 1 uses only verb-anchored patterns (helps me, keeps me going, I lean on,
 * I can count on, someone I trust). Bare person mentions ("my family", "my partner")
 * are excluded — they may represent conflict or isolation rather than support.
 */
export function countPositiveProtectionSignals(text: string): number {
  const t = text.toLowerCase()
  let count = 0
  if (/(helps? me|helped me|keeps? me|kept me|grounds? me|calms? me|steadies me|i lean on|i can count on|someone i trust)/.test(t)) count++
  if (/(routine|working out|exercise|gym|walk|meeting|yoga|meditation|sober (for|stretch)|program)/.test(t)) count++
  if (/(got through|made it through|better when|good stretch|worked before|what worked|has worked|made it)/.test(t)) count++
  if (/(therapist|therapy|counselor|doctor|treatment|sponsor|aa\b|na\b|coach)/.test(t)) count++
  return count
}

/** Communication style is complete only if there is a usable style signal — not just "I don't know". */
export function mentionsCommunicationStyleComplete(text: string) {
  const t = (text || '').toLowerCase()
  return /(direct|give it to me straight|just tell me|be blunt|practical|step.?by.?step|reflective|help me think|think (it|things) through|gentle|soft|not too hard|go easy|mixed.*support|prefer.*direct|prefer.*gentle|prefer.*practical|prefer.*reflective|both.*practical|both.*reflective|then get practical|get practical|help me figure|understand (me|first)|need structure|just the facts)/.test(t)
}

/** User expressing desire or movement toward change. */
export function hasChangeTalk(text: string) {
  const t = (text || '').toLowerCase()
  return /(want to (change|stop|quit|cut back|reduce|be different|do better)|ready to|i should|i need to change|trying to change|i want to be|hoping to|i decided|i'm done|enough is enough|time to|making a change|work on (this|it|myself)|get better|get help|something has to change)/.test(t)
}

/** User expressing pull away from change or reasons to stay the same. */
export function hasSustainTalk(text: string) {
  const t = (text || '').toLowerCase()
  // "it helps me" removed — it fires as a false positive in non-substance contexts
  // (e.g. "exercise helps me") and is already covered by mentionsFunction() for the
  // correct domain. Sustain talk requires an explicit resistance or ambivalence signal.
  return /(not ready|don't want to stop|don't want to quit|part of me (doesn'?t|don'?t want|wants to keep|likes|enjoys)|can'?t imagine (not|without)|i'?d miss|i need it|i like (it|drinking|using)|can'?t (stop|quit|give it up)|not sure (if|whether|i want to)|still want|don'?t think i can|it'?s not that bad|works for me|not a problem|i'?m fine|others have it worse|everyone does it|it'?s just|i'?m in control)/.test(t)
}

/** True if substance or behavior was explicitly named. */
export function mentionsSubstance(text: string) {
  const t = (text || '').toLowerCase()
  return /(drink|drinking|alcohol|wine|beer|spirits|smoke|smoking|weed|cannabis|marijuana|cocaine|coke|meth\b|methamphetamine|pill|pills|opioid|opioids|heroin|fentanyl|benzo|xanax|oxy\b|oxycontin|adderall|stimulant|drug|substance|using|i use|i've been using)/.test(t)
}

/** Non-substance behavior categories (exercise, sleep, eating, screen use, etc.) */
export function mentionsNonSubstanceBehavior(text: string) {
  const t = (text || '').toLowerCase()
  return /(\bexercise\b|workout|work\s*out|working\s*out|\bgym\b|\brunning\b|\bjog(ging)?\b|\bwalking\b|\bcycling\b|\bbiking?\b|\bswimming\b|\byoga\b|\bpilates\b|\bcrossfit\b|weight\s*(lift|train)|strength\s*train|physical\s*activity|get\s*(fit|in\s*shape|more\s*active|moving|stronger)|be\s*more\s*active|more\s*active|sedentary|start\s*(exercising|running|going\s*to\s*the\s*gym|working\s*out)|\bfitness\b|sleep\s*(better|more|less|hygiene|routine)|\binsomnia\b|can'?t\s*sleep|eat\s*(better|healthier|less)|\bbinge\s*(eating)?\b|\bovereat\b|screen\s*time|\bvaping?\b|\bgambling\b|social\s*media\s*use|phone\s*use)/.test(t)
}
export function mentionsFunction(text: string) {
  const t = (text || '').toLowerCase()
  return /(relax|calm|numbs?|takes? (the )?edge|feel(s)? better|helps? me|escape|forget|cope|relief|wind down|unwinding|unwind|socialize)/.test(t)
}
export function mentionsIdentity(text: string) {
  const t = (text || '').toLowerCase()
  return /(who i am|who i'd be|who i would be|my identity|part of me|defines? me|without (drinking|using|it)|i'm (not )?(just |really )?(a |an )?(drinker|user|addict|alcoholic)|always been|how i see myself)/.test(t)
}
export function mentionsStrengths(text: string) {
  const t = (text || '').toLowerCase()
  return /(tried before|cut back before|quit for|was sober|i can|i've managed|proud|strong|resilient|value|good at|worked hard|fought through|pushed through|survived)/.test(t)
}
export function mentionsReadiness(text: string) {
  const t = (text || '').toLowerCase()
  return /(ready|not ready|thinking about|considering|want to change|don't want to|part of me wants|ambivalen|not sure (if|whether)|on the fence|maybe|someday|not yet)/.test(t)
}
export function mentionsCommunicationStyle(text: string) {
  const t = (text || '').toLowerCase()
  return /(direct|give it to me straight|just tell me|practical|gentle|reflective|prefer.*support|how (i'd like|you) to talk|feedback style|blunt|soft|help me think|think (it|things) through|think through|understand first|figure it out|more (reflective|practical|direct|gentle)|both.*practical|both.*think|then get practical|get practical|step.?by.?step|need someone to)/.test(t)
}
export function mentionsSafetyTopics(text: string) {
  const t = (text || '').toLowerCase()
  return /(safe|safety|overdose|overdosed|withdrawal|blackout|blacked out|using alone|alone when (i use|using)|mixing|suicid|harm yourself|physically unsafe|medical emergency|domestic|violence)/.test(t)
}
export function mentionsEmotionalDrivers(text: string) {
  const t = (text || '').toLowerCase()
  return /(anxiet|depress|mood|mental health|panic|sad|overwhelm|numb|empty|disconnected|trauma|ptsd|worthless|shame|guilt|angry|rage|lonely|isolat|grief|stress|burnout|can't (sleep|function|cope)|low energy|exhausted|hopeless|excite|thrill|rush\b|feel alive|feel something|feel (good|better)\b|relief|to forget|to not think|to deal with|escape|bored\b|boredom|when i'm (stressed|upset|bored|alone|anxious|frustrated)|it helps me|makes me feel|makes it easier|feel more (social|confident|fun|relaxed|calm))/.test(t)
}
export function mentionsValues(text: string) {
  const t = (text || '').toLowerCase()
  return /(matter(s)? to me|important to me|care about|believe in|kind of person|my kids|my family|my health|my career|my relationship|what i want|legacy|proud of|not who i am|who i want to be|i value|my values|what matters)/.test(t)
}

/* -------- safety screen -------- */

export interface SafetyScreenResult {
  triggered: boolean
  type?: 'suicidality' | 'self_harm' | 'overdose' | 'withdrawal' | 'blackout' | 'domestic_violence'
  response?: string
}

/**
 * Expanded safety screen covering suicidality, overdose, withdrawal,
 * blackout-with-risk, and domestic violence.
 */
export function safetyScreen(text: string): SafetyScreenResult {
  const t = (text || '').toLowerCase()

  const falsePositives = [
    /kill time/,
    /this game.*kill me/,
    /die of laughter|dying of laughter/,
    /harm reduction/,
    /overdose (awareness|prevention|education)/,
  ]
  const isFalsePositive = falsePositives.some(re => re.test(t))

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

  const blackoutPattern = /(blacked out|blackout|don'?t remember (what|where|how|anything)|lost (consciousness|time|hours|the night))/
  const unsafeContext = /(dangerous|hurt|accident|drove|driving|alone|unsafe|strange place|didn'?t know where)/
  if (blackoutPattern.test(t) && unsafeContext.test(t)) {
    return {
      triggered: true,
      type: 'blackout',
      response: `I'm hearing something that concerns me — losing memory or consciousness in unsafe situations carries real physical risk, and I want to take that seriously. Are you in a safe place right now? And can you tell me a bit more about what happened?`,
    }
  }

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

/** Thin backward-compat wrapper. */
export function isCrisis(text: string): boolean {
  return safetyScreen(text).triggered
}

/* -------- coverage model -------- */

export type DomainStatus = 'unseen' | 'partial' | 'complete' | 'deferred'
export type SafetyStatus = 'unseen' | 'screened_low' | 'screened_concern' | 'deferred_low_signal'

export interface DomainCoverage {
  opening: DomainStatus
  currentUse: DomainStatus
  goals: DomainStatus
  readiness: DomainStatus
  riskMap: DomainStatus
  protectionMap: DomainStatus
  coachLens: DomainStatus
  communication: DomainStatus
  safety: SafetyStatus
  ambivalence_clearly_present: boolean
}

/**
 * Compute per-domain coverage status from the full conversation.
 * All statuses are derived from user message content only.
 */
export function computeDomainCoverage(history: Msg[], latest: string): DomainCoverage {
  const userMessages = history.filter(m => m.role === 'user').map(m => m.content || '')
  const allUserText = [...userMessages, latest || ''].join(' ')
  const userTurns = userMessages.length

  // opening — complete after first user message
  const opening: DomainStatus = userTurns >= 1 ? 'complete' : 'unseen'

  // currentUse — partial: any target behavior named; complete: behavior + (frequency OR function OR emotional)
  // Covers substance use AND non-substance behaviors (exercise, sleep, eating, etc.)
  const substancePresent = mentionsSubstance(allUserText)
  const behaviorPresent  = substancePresent || mentionsNonSubstanceBehavior(allUserText)
  const frequencyPresent = mentionsFrequency(allUserText)
  const functionPresent  = mentionsFunction(allUserText)
  const emotionalPresent = mentionsEmotionalDrivers(allUserText)
  let currentUse: DomainStatus = 'unseen'
  if (behaviorPresent) {
    currentUse = (frequencyPresent || functionPresent || emotionalPresent) ? 'complete' : 'partial'
  }
  if (currentUse === 'partial' && userTurns >= 8) currentUse = 'deferred'

  // goals — partial: any vague goal language; complete: hasGoal() fires
  const vagueGoal = /(what.*want|what.*hoping|figuring it out|don't know what.*want|thinking about|not sure (yet|what)|might|considering)/.test(allUserText.toLowerCase())
  let goals: DomainStatus = 'unseen'
  if (hasGoal(allUserText)) {
    goals = 'complete'
  } else if (vagueGoal) {
    goals = 'partial'
  }
  if (goals === 'partial' && userTurns >= 10) goals = 'deferred'

  // readiness — partial: any ambivalence or readiness signal; complete: both sides present
  // AND enough turns for both sides to have been explored (>= 10 user turns).
  // Detecting ambivalence alone does NOT auto-complete readiness — it requires the
  // conversation to have had room for both sides to surface and be reflected.
  const changeTalkPresent  = hasChangeTalk(allUserText)
  const sustainTalkPresent = hasSustainTalk(allUserText)
  const ambivalence_clearly_present = changeTalkPresent && sustainTalkPresent
  const anyReadinessSignal = mentionsReadiness(allUserText) || changeTalkPresent || sustainTalkPresent
  let readiness: DomainStatus = 'unseen'
  if (ambivalence_clearly_present && userTurns >= 10) {
    readiness = 'complete'
  } else if (ambivalence_clearly_present || anyReadinessSignal) {
    readiness = 'partial'
  }
  if (readiness === 'partial' && userTurns >= 12 && !ambivalence_clearly_present) readiness = 'deferred'

  // riskMap — partial: 1 risk category; complete: 2+ distinct risk categories
  const triggerPresent      = mentionsTriggers(allUserText)
  const consequencePresent  = mentionsConsequences(allUserText)
  const emotionalRiskPresent = emotionalPresent
  const riskCategoryCount = [triggerPresent, consequencePresent, emotionalRiskPresent].filter(Boolean).length
  let riskMap: DomainStatus = 'unseen'
  if (riskCategoryCount >= 2) {
    riskMap = 'complete'
  } else if (riskCategoryCount >= 1) {
    riskMap = 'partial'
  }
  if (riskMap === 'partial' && userTurns >= 10) riskMap = 'deferred'

  // protectionMap — partial: mentionsPositiveProtection; complete: 2+ distinct categories OR 1 + prior success
  const posProtectionCount = countPositiveProtectionSignals(allUserText)
  const hasPriorSuccess    = mentionsStrengths(allUserText)
  let protectionMap: DomainStatus = 'unseen'
  if (posProtectionCount >= 2 || (posProtectionCount >= 1 && hasPriorSuccess)) {
    protectionMap = 'complete'
  } else if (mentionsPositiveProtection(allUserText)) {
    protectionMap = 'partial'
  }
  if (protectionMap === 'partial' && userTurns >= 12) protectionMap = 'deferred'

  // coachLens — partial: one of identity/values/strengths; complete: strengths + (identity OR values)
  const identityPresent  = mentionsIdentity(allUserText)
  const valuesPresent    = mentionsValues(allUserText)
  const strengthPresent  = mentionsStrengths(allUserText)
  let coachLens: DomainStatus = 'unseen'
  if (strengthPresent && (identityPresent || valuesPresent)) {
    coachLens = 'complete'
  } else if (strengthPresent || identityPresent || valuesPresent) {
    coachLens = 'partial'
  }
  if (coachLens === 'partial' && userTurns >= 12) coachLens = 'deferred'

  // communication — partial: any style signal or "I don't know"; complete: usable style signal.
  // "I don't know" without a real style preference is promoted to 'deferred' early (turn 8+)
  // rather than holding at 'partial' until turn 14. This prevents a hollow "I don't know"
  // answer from permanently blocking the summary gate once a reasonable probe has happened.
  const commCompletePresent = mentionsCommunicationStyleComplete(allUserText)
  const commAnyPresent      = mentionsCommunicationStyle(allUserText)
  const iDontKnowStyle      = /(don'?t know (how|what)|not sure (how|what)|hard to say|whatever works|i guess)/.test(allUserText.toLowerCase())
  let communication: DomainStatus = 'unseen'
  if (commCompletePresent) {
    communication = 'complete'
  } else if (commAnyPresent || iDontKnowStyle) {
    communication = 'partial'
  }
  if (communication === 'partial' && (userTurns >= 14 || (iDontKnowStyle && !commAnyPresent && userTurns >= 8))) {
    communication = 'deferred'
  }

  // safety — 4-state SafetyStatus
  const anySafetyTrigger = history
    .filter(m => m.role === 'user')
    .some(m => safetyScreen(m.content || '').triggered) ||
    safetyScreen(latest || '').triggered
  let safety: SafetyStatus = 'unseen'
  if (anySafetyTrigger) {
    safety = 'screened_concern'
  } else if (mentionsSafetyTopics(allUserText)) {
    safety = 'screened_low'
  } else if (userTurns >= 10) {
    safety = 'deferred_low_signal'
  }

  return {
    opening, currentUse, goals, readiness, riskMap, protectionMap,
    coachLens, communication, safety, ambivalence_clearly_present,
  }
}

/**
 * Map a fine-grained domain/hint key to a 0-9 segment number for the
 * X-Onboarding-Segment header (client progress indicator).
 */
export function domainToSegmentNumber(domain: string): number {
  const map: Record<string, number> = {
    opening: 0,
    currentUse: 1, function: 2, emotionalDrivers: 2,
    costs: 3,
    goals: 4,
    identity: 5,
    protectionMap: 6,
    coachLens: 7,
    readiness: 8,
    communication: 9, safety: 9,
  }
  return map[domain] ?? 9
}

/**
 * Return the hint-domain key we should focus on next, based on current
 * coverage and how many user turns have elapsed.
 */
export function nextDomainToFocus(coverage: DomainCoverage, userTurns: number): string {
  const { opening, currentUse, goals, riskMap, protectionMap, coachLens,
          communication, safety, readiness, ambivalence_clearly_present } = coverage

  if (opening === 'unseen') return 'opening'

  if (currentUse === 'unseen') return 'currentUse'
  if (currentUse === 'partial' && userTurns < 5) {
    return riskMap === 'unseen' ? 'function' : 'emotionalDrivers'
  }

  if (riskMap === 'unseen') return 'costs'
  if (riskMap === 'partial' && userTurns < 8) return 'emotionalDrivers'

  if (goals === 'unseen' || goals === 'partial') return 'goals'

  if (protectionMap === 'unseen') return 'protectionMap'
  if (protectionMap === 'partial' && userTurns < 12) return 'protectionMap'

  if (safety === 'unseen' && userTurns >= 8) return 'safety'

  if (coachLens === 'unseen') return 'identity'
  if (coachLens === 'partial') return 'coachLens'

  if (ambivalence_clearly_present && (readiness === 'unseen' || readiness === 'partial')) return 'readiness'
  if (readiness === 'unseen' && userTurns >= 9) return 'readiness'

  if (communication === 'unseen' || communication === 'partial') return 'communication'

  return 'communication'
}

/**
 * All required domains must reach at least 'complete' or 'deferred' before the
 * summary is offered. 'partial' is not enough for the three quality-critical domains:
 *
 * - protectionMap: partial means a thin or unverified mention; we need real signal
 *   or an explicit deferral after probing.
 * - communication: partial includes "I don't know" which is not an actionable style
 *   signal; require a real preference or an explicit deferral after probing.
 * - readiness (when ambivalence is present): ambivalence detected does not mean
 *   ambivalence explored; require complete (both sides present + >= 10 turns) or
 *   deferred before summary fires.
 */
export function hasMinimumRequiredCoverage(coverage: DomainCoverage): boolean {
  const { currentUse, goals, riskMap, protectionMap, communication,
          safety, readiness, ambivalence_clearly_present } = coverage

  if (currentUse !== 'complete') return false
  if (goals === 'unseen') return false
  if (riskMap === 'unseen') return false
  if (protectionMap === 'unseen' || protectionMap === 'partial') return false
  if (safety === 'unseen') return false
  if (communication === 'unseen' || communication === 'partial') return false
  if (ambivalence_clearly_present && readiness !== 'complete' && readiness !== 'deferred') return false

  return true
}

export function shouldOfferSummaryNow(coverage: DomainCoverage, history: Msg[]): boolean {
  const userTurns = history.filter(m => m.role === 'user').length
  if (userTurns < 8) return false
  return hasMinimumRequiredCoverage(coverage)
}
