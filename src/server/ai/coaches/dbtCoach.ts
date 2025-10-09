/**
 * DBT (Dialectical Behavior Therapy) Coach
 * Identifies opportunities for DBT skills: mindfulness, distress tolerance,
 * emotion regulation, and interpersonal effectiveness
 */

import type { CoachMessage, CoachAnalysis, CoachTag } from '../types'

// DBT skill keywords and patterns
const DBT_SKILL_PATTERNS = {
  mindfulness: [
    /mindful/i,
    /present moment/i,
    /awareness/i,
    /observe/i,
    /describe/i,
    /participate/i,
    /\bin the moment\b/i,
    /paying attention/i,
  ],
  distressTolerance: [
    /can't handle/i,
    /overwhelming/i,
    /unbearable/i,
    /crisis/i,
    /intense urge/i,
    /strong craving/i,
    /distract/i,
    /self-soothe/i,
    /TIP\b/i, // Temperature, Intense exercise, Paced breathing
  ],
  emotionRegulation: [
    /emotion/i,
    /feeling.*out of control/i,
    /mood swing/i,
    /anger/i,
    /sadness/i,
    /anxiety/i,
    /regulate/i,
    /opposite action/i,
  ],
  interpersonal: [
    /relationship/i,
    /conflict/i,
    /boundary/i,
    /assertive/i,
    /say no/i,
    /communicate/i,
    /DEAR MAN/i,
    /GIVE/i,
    /FAST/i,
  ],
}

// Crisis/distress signals
const DISTRESS_SIGNALS = [
  /overwhelm/i,
  /can't cope/i,
  /too much/i,
  /breaking point/i,
  /losing control/i,
  /shutting down/i,
]

// Emotion dysregulation signals
const DYSREGULATION_SIGNALS = [
  /angry all the time/i,
  /mood swing/i,
  /explosive/i,
  /numb/i,
  /emotional rollercoaster/i,
]

/**
 * Analyze messages for DBT-relevant content
 */
export function analyzeForDBT(messages: CoachMessage[]): CoachAnalysis {
  const tags: CoachTag[] = []
  const signals: string[] = []
  let totalScore = 0
  
  // Analyze recent messages (last 5)
  const recentMessages = messages.slice(-5)
  
  for (const message of recentMessages) {
    if (message.role !== 'user') continue
    
    const content = message.content.toLowerCase()
    
    // Check for distress tolerance needs
    for (const pattern of DBT_SKILL_PATTERNS.distressTolerance) {
      if (pattern.test(content)) {
        tags.push({
          type: 'coping-strategy',
          value: 'distress-tolerance-needed',
          confidence: 0.75,
          context: 'User expressing distress that DBT crisis skills could address'
        })
        signals.push('distress-tolerance')
        totalScore += 3
        break
      }
    }
    
    // Check for emotion regulation needs
    for (const pattern of DBT_SKILL_PATTERNS.emotionRegulation) {
      if (pattern.test(content)) {
        tags.push({
          type: 'emotion',
          value: 'dysregulation-signal',
          confidence: 0.7,
          context: 'Emotion regulation skills may be helpful'
        })
        signals.push('emotion-regulation')
        totalScore += 2
        break
      }
    }
    
    // Check for interpersonal effectiveness needs
    for (const pattern of DBT_SKILL_PATTERNS.interpersonal) {
      if (pattern.test(content)) {
        tags.push({
          type: 'behavior',
          value: 'interpersonal-challenge',
          confidence: 0.7,
          context: 'Interpersonal effectiveness skills may be helpful'
        })
        signals.push('interpersonal')
        totalScore += 2
        break
      }
    }
    
    // Check for mindfulness opportunities
    for (const pattern of DBT_SKILL_PATTERNS.mindfulness) {
      if (pattern.test(content)) {
        tags.push({
          type: 'coping-strategy',
          value: 'mindfulness-opportunity',
          confidence: 0.65,
          context: 'User may benefit from mindfulness practice'
        })
        signals.push('mindfulness')
        totalScore += 1
        break
      }
    }
    
    // Check distress level
    for (const pattern of DISTRESS_SIGNALS) {
      if (pattern.test(content)) {
        tags.push({
          type: 'emotion',
          value: 'high-distress',
          confidence: 0.8,
          context: 'User reporting high distress'
        })
        signals.push('high-distress')
        totalScore += 4
        break
      }
    }
    
    // Check for dysregulation
    for (const pattern of DYSREGULATION_SIGNALS) {
      if (pattern.test(content)) {
        tags.push({
          type: 'emotion',
          value: 'emotion-dysregulation',
          confidence: 0.75,
          context: 'Signs of emotion dysregulation'
        })
        signals.push('dysregulation')
        totalScore += 3
        break
      }
    }
  }
  
  // Calculate overall confidence (normalize to 0-1)
  // Adjusted scoring: divide by 6 instead of 10 for better sensitivity with fewer messages
  const confidence = Math.min(totalScore / 6, 1.0)
  
  return {
    coachType: 'dbt',
    tags,
    signals: Array.from(new Set(signals)),
    confidence,
  }
}

/**
 * Get suggested DBT intervention based on analysis
 */
export function suggestDBTIntervention(analysis: CoachAnalysis): string | undefined {
  if (analysis.confidence < 0.5) {
    return undefined
  }
  
  const { signals } = analysis
  
  // Prioritize based on signal importance
  if (signals.includes('high-distress')) {
    return 'Consider introducing TIP skills (Temperature, Intense exercise, Paced breathing) for immediate distress reduction.'
  }
  
  if (signals.includes('distress-tolerance')) {
    return 'DBT distress tolerance skills like ACCEPTS or self-soothing could help manage this crisis moment.'
  }
  
  if (signals.includes('dysregulation')) {
    return 'Emotion regulation skills like opposite action or checking the facts might be valuable here.'
  }
  
  if (signals.includes('interpersonal')) {
    return 'DEAR MAN or GIVE skills could help navigate this interpersonal challenge.'
  }
  
  if (signals.includes('mindfulness')) {
    return 'A brief mindfulness exercise might help create space between urges and actions.'
  }
  
  return undefined
}

/**
 * Check if DBT coach should be active for this conversation
 */
export function shouldActivateDBT(messages: CoachMessage[]): boolean {
  const analysis = analyzeForDBT(messages)
  return analysis.confidence >= 0.6
}
