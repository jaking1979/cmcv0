/**
 * CBT (Cognitive Behavioral Therapy) / Behavioral Skills Coach
 * Identifies cognitive distortions, behavioral patterns, and opportunities
 * for behavioral activation and cognitive restructuring
 */

import type { CoachMessage, CoachAnalysis, CoachTag } from '../types'

// Cognitive distortion patterns
const COGNITIVE_DISTORTIONS = {
  allOrNothing: [
    /\b(?:always|never|every time|all the time)\b/i,
    /\b(?:everything|nothing)\b/i,
    /either.*or/i,
    /completely|totally|absolutely/i,
    /\bevery\b/i,
  ],
  catastrophizing: [
    /worst.*possible/i,
    /disaster/i,
    /terrible|awful|horrible/i,
    /everything.*fall apart/i,
    /end of the world/i,
  ],
  mindReading: [
    /they (?:think|thought) I/i,
    /(?:he|she|they) probably (?:thinks|believes)/i,
    /I know (?:he|she|they).*thinking/i,
  ],
  fortuneTelling: [
    /I'll (?:never|always)/i,
    /it's going to/i,
    /I just know/i,
    /it'll (?:never|always) be/i,
  ],
  shouldStatements: [
    /I should(?:n't| have| not)/i,
    /I must(?:n't| have)/i,
    /I have to/i,
    /I ought to/i,
  ],
  overgeneralization: [
    /this always happens/i,
    /I never succeed/i,
    /everyone|nobody/i,
    /typical/i,
  ],
}

// Behavioral activation opportunities
const BEHAVIORAL_ACTIVATION_SIGNALS = [
  /depressed/i,
  /no motivation/i,
  /don't (?:feel like|want to) do anything/i,
  /staying in bed/i,
  /avoiding/i,
  /isolating/i,
  /withdrawn/i,
]

// Avoidance patterns
const AVOIDANCE_PATTERNS = [
  /putting off/i,
  /procrastinat/i,
  /don't want to (?:face|deal with)/i,
  /hiding from/i,
  /can't bring myself to/i,
]

// Negative thought spirals
const THOUGHT_SPIRAL_PATTERNS = [
  /can't stop thinking about/i,
  /ruminating/i,
  /thoughts.*racing/i,
  /stuck in my head/i,
  /overthinking/i,
]

// Behavioral patterns (positive)
const POSITIVE_BEHAVIORS = [
  /went to (?:the gym|work out)/i,
  /called a friend/i,
  /went for a walk/i,
  /practiced/i,
  /tried.*new/i,
  /reached out/i,
]

/**
 * Analyze messages for CBT opportunities
 */
export function analyzeForCBT(messages: CoachMessage[]): CoachAnalysis {
  const tags: CoachTag[] = []
  const signals: string[] = []
  let totalScore = 0
  
  // Analyze recent messages
  const recentMessages = messages.slice(-5)
  
  for (const message of recentMessages) {
    if (message.role !== 'user') continue
    
    const content = message.content
    
    // Check for all-or-nothing thinking
    let foundDistortion = false
    for (const pattern of COGNITIVE_DISTORTIONS.allOrNothing) {
      if (pattern.test(content)) {
        tags.push({
          type: 'behavior',
          value: 'cognitive-distortion-all-or-nothing',
          confidence: 0.7,
          context: 'All-or-nothing thinking detected'
        })
        signals.push('all-or-nothing')
        totalScore += 2
        foundDistortion = true
        break
      }
    }
    
    // Check for catastrophizing
    if (!foundDistortion) {
      for (const pattern of COGNITIVE_DISTORTIONS.catastrophizing) {
        if (pattern.test(content)) {
          tags.push({
            type: 'behavior',
            value: 'cognitive-distortion-catastrophizing',
            confidence: 0.75,
            context: 'Catastrophizing detected'
          })
          signals.push('catastrophizing')
          totalScore += 3
          foundDistortion = true
          break
        }
      }
    }
    
    // Check for mind reading
    if (!foundDistortion) {
      for (const pattern of COGNITIVE_DISTORTIONS.mindReading) {
        if (pattern.test(content)) {
          tags.push({
            type: 'behavior',
            value: 'cognitive-distortion-mind-reading',
            confidence: 0.65,
            context: 'Mind reading detected'
          })
          signals.push('mind-reading')
          totalScore += 2
          foundDistortion = true
          break
        }
      }
    }
    
    // Check for fortune telling
    if (!foundDistortion) {
      for (const pattern of COGNITIVE_DISTORTIONS.fortuneTelling) {
        if (pattern.test(content)) {
          tags.push({
            type: 'behavior',
            value: 'cognitive-distortion-fortune-telling',
            confidence: 0.7,
            context: 'Fortune telling detected'
          })
          signals.push('fortune-telling')
          totalScore += 2
          foundDistortion = true
          break
        }
      }
    }
    
    // Check for should statements
    for (const pattern of COGNITIVE_DISTORTIONS.shouldStatements) {
      if (pattern.test(content)) {
        tags.push({
          type: 'behavior',
          value: 'should-statement',
          confidence: 0.8,
          context: 'Rigid "should" thinking detected'
        })
        signals.push('should-statements')
        totalScore += 2
        break
      }
    }
    
    // Check for behavioral activation needs
    for (const pattern of BEHAVIORAL_ACTIVATION_SIGNALS) {
      if (pattern.test(content)) {
        tags.push({
          type: 'behavior',
          value: 'behavioral-activation-needed',
          confidence: 0.75,
          context: 'User may benefit from behavioral activation'
        })
        signals.push('behavioral-activation')
        totalScore += 3
        break
      }
    }
    
    // Check for avoidance
    for (const pattern of AVOIDANCE_PATTERNS) {
      if (pattern.test(content)) {
        tags.push({
          type: 'behavior',
          value: 'avoidance-pattern',
          confidence: 0.7,
          context: 'Avoidance behavior detected'
        })
        signals.push('avoidance')
        totalScore += 2
        break
      }
    }
    
    // Check for thought spirals
    for (const pattern of THOUGHT_SPIRAL_PATTERNS) {
      if (pattern.test(content)) {
        tags.push({
          type: 'behavior',
          value: 'rumination',
          confidence: 0.75,
          context: 'Rumination or thought spiral detected'
        })
        signals.push('rumination')
        totalScore += 2
        break
      }
    }
    
    // Check for positive behaviors (reduce activation need)
    for (const pattern of POSITIVE_BEHAVIORS) {
      if (pattern.test(content)) {
        tags.push({
          type: 'strengths',
          value: 'positive-behavior',
          confidence: 0.8,
          context: 'User engaging in positive behaviors'
        })
        signals.push('positive-behavior')
        totalScore -= 1
        break
      }
    }
  }
  
  // Calculate overall confidence (normalize to 0-1)
  // Adjusted scoring: divide by 6 instead of 10 for better sensitivity with fewer messages
  const confidence = Math.min(Math.max(totalScore / 6, 0), 1.0)
  
  return {
    coachType: 'cbt',
    tags,
    signals: Array.from(new Set(signals)),
    confidence,
  }
}

/**
 * Get suggested CBT intervention
 */
export function suggestCBTIntervention(analysis: CoachAnalysis): string | undefined {
  if (analysis.confidence < 0.5) {
    return undefined
  }
  
  const { signals } = analysis
  
  // Prioritize based on signal importance
  if (signals.includes('behavioral-activation')) {
    return 'User may benefit from behavioral activation. Explore small, achievable activities that align with their values.'
  }
  
  if (signals.includes('catastrophizing')) {
    return 'Help user examine evidence for and against their catastrophic predictions. What is more likely to happen?'
  }
  
  if (signals.includes('all-or-nothing')) {
    return 'Gently challenge all-or-nothing thinking. Explore the middle ground or shades of gray.'
  }
  
  if (signals.includes('should-statements')) {
    return 'Help reframe rigid "should" thinking into preferences or values-based language.'
  }
  
  if (signals.includes('rumination')) {
    return 'User is caught in rumination. Consider thought-stopping techniques or shifting to problem-solving mode.'
  }
  
  if (signals.includes('avoidance')) {
    return 'Explore what they\'re avoiding and help break it down into smaller, manageable steps.'
  }
  
  if (signals.includes('mind-reading')) {
    return 'Gently question assumptions about what others are thinking. Encourage checking the facts.'
  }
  
  return undefined
}

/**
 * Check if CBT coach should be active
 */
export function shouldActivateCBT(messages: CoachMessage[]): boolean {
  const analysis = analyzeForCBT(messages)
  return analysis.confidence >= 0.5
}

/**
 * Generate a CBT prompt snippet for the AI
 */
export function getCBTPrompt(analysis: CoachAnalysis): string {
  const { signals } = analysis
  
  let prompt = 'CBT opportunity detected. '
  
  if (signals.includes('catastrophizing')) {
    prompt += 'Help them examine evidence and consider more balanced perspectives. '
  }
  
  if (signals.includes('behavioral-activation')) {
    prompt += 'Explore small behavioral experiments or activities that might improve their mood. '
  }
  
  if (signals.includes('all-or-nothing')) {
    prompt += 'Gently point out the all-or-nothing thinking and explore the middle ground. '
  }
  
  if (signals.includes('should-statements')) {
    prompt += 'Help reframe "shoulds" into preferences or choices. '
  }
  
  prompt += 'Use Socratic questioning to help them discover insights rather than telling them what to think.'
  
  return prompt
}
