/**
 * Self-Compassion Coach
 * Identifies self-criticism, shame, and opportunities for self-kindness
 * Based on Kristin Neff's self-compassion framework
 */

import type { CoachMessage, CoachAnalysis, CoachTag } from '../types'

// Self-criticism patterns
const SELF_CRITICISM_PATTERNS = [
  /I'm (?:such a|a) (?:failure|loser|mess|disaster)/i,
  /I (?:can't|couldn't) do anything right/i,
  /I (?:hate|despise) myself/i,
  /I'm (?:so|such a) (?:weak|pathetic|useless)/i,
  /what's wrong with me/i,
  /I'm a terrible (?:person|parent|friend|partner)/i,
  /I (?:feel|am) terrible/i,
  /I (?:always|just|keep) (?:screw|mess)(?:ing)? (?:up|everything up|things up)/i,
  /I (?:don't|do not) deserve/i,
  /I'm (?:not|never) good enough/i,
  /everyone else can do it except me/i,
  /(?:I )?(?:just|keep) (?:mess|screw)(?:ing)? (?:up|everything)/i,
]

// Shame patterns
const SHAME_PATTERNS = [
  /ashamed/i,
  /embarrassed/i,
  /humiliated/i,
  /feel.*disgusting/i,
  /can't face/i,
  /hide.*from everyone/i,
  /what will (?:people|they|everyone) think/i,
]

// Harsh self-judgment
const HARSH_JUDGMENT = [
  /should have known better/i,
  /never should have/i,
  /how could I be so (?:stupid|dumb)/i,
  /I knew better/i,
  /there's no excuse/i,
]

// Isolation feelings (vs. common humanity)
const ISOLATION_PATTERNS = [
  /I'm the only one/i,
  /nobody (?:else )?understands/i,
  /no one (?:else )?(?:has|does) this/i,
  /I'm alone in this/i,
  /everyone else has it together/i,
  /something's wrong with me specifically/i,
]

// Over-identification with negative experiences
const OVER_IDENTIFICATION = [
  /I am my (?:addiction|problem|mistake)/i,
  /this (?:is|defines) who I am/i,
  /I'll always be/i,
  /that's just (?:how|who) I am/i,
  /I can't change/i,
]

// Positive self-compassion indicators
const SELF_KINDNESS_PATTERNS = [
  /be kind to myself/i,
  /treat myself/i,
  /self-compassion/i,
  /give myself (?:a )?break/i,
  /everyone makes mistakes/i,
  /I'm doing (?:my|the) best/i,
]

/**
 * Analyze messages for self-compassion opportunities
 */
export function analyzeForSelfCompassion(messages: CoachMessage[]): CoachAnalysis {
  const tags: CoachTag[] = []
  const signals: string[] = []
  let totalScore = 0
  
  // Analyze recent messages
  const recentMessages = messages.slice(-5)
  
  for (const message of recentMessages) {
    if (message.role !== 'user') continue
    
    const content = message.content
    
    // Check for self-criticism
    for (const pattern of SELF_CRITICISM_PATTERNS) {
      if (pattern.test(content)) {
        tags.push({
          type: 'emotion',
          value: 'self-criticism',
          confidence: 0.85,
          context: 'User engaging in harsh self-judgment'
        })
        signals.push('self-criticism')
        totalScore += 4
        break
      }
    }
    
    // Check for shame
    for (const pattern of SHAME_PATTERNS) {
      if (pattern.test(content)) {
        tags.push({
          type: 'emotion',
          value: 'shame',
          confidence: 0.8,
          context: 'User expressing shame'
        })
        signals.push('shame')
        totalScore += 4
        break
      }
    }
    
    // Check for harsh judgment
    for (const pattern of HARSH_JUDGMENT) {
      if (pattern.test(content)) {
        tags.push({
          type: 'behavior',
          value: 'harsh-self-judgment',
          confidence: 0.75,
          context: 'Harsh self-judgment detected'
        })
        signals.push('harsh-judgment')
        totalScore += 3
        break
      }
    }
    
    // Check for isolation
    for (const pattern of ISOLATION_PATTERNS) {
      if (pattern.test(content)) {
        tags.push({
          type: 'emotion',
          value: 'isolation',
          confidence: 0.7,
          context: 'Feeling isolated in struggle (common humanity opportunity)'
        })
        signals.push('isolation')
        totalScore += 3
        break
      }
    }
    
    // Check for over-identification
    for (const pattern of OVER_IDENTIFICATION) {
      if (pattern.test(content)) {
        tags.push({
          type: 'behavior',
          value: 'over-identification',
          confidence: 0.75,
          context: 'Over-identifying with negative experience (mindfulness opportunity)'
        })
        signals.push('over-identification')
        totalScore += 3
        break
      }
    }
    
    // Check for self-kindness (positive)
    for (const pattern of SELF_KINDNESS_PATTERNS) {
      if (pattern.test(content)) {
        tags.push({
          type: 'strengths',
          value: 'self-kindness',
          confidence: 0.8,
          context: 'User demonstrating self-compassion'
        })
        signals.push('self-kindness')
        totalScore -= 1 // Reduce activation score (already doing well)
        break
      }
    }
  }
  
  // Calculate overall confidence (normalize to 0-1)
  // Adjusted scoring: divide by 6 instead of 10 for better sensitivity with fewer messages
  const confidence = Math.min(Math.max(totalScore / 6, 0), 1.0)
  
  return {
    coachType: 'self-compassion',
    tags,
    signals: Array.from(new Set(signals)),
    confidence,
  }
}

/**
 * Get suggested self-compassion intervention
 */
export function suggestSelfCompassionIntervention(analysis: CoachAnalysis): string | undefined {
  if (analysis.confidence < 0.5) {
    return undefined
  }
  
  const { signals } = analysis
  
  // Prioritize based on signal importance
  if (signals.includes('shame')) {
    return 'Consider exploring self-compassion around the shame they\'re experiencing. Normalize the experience and emphasize common humanity.'
  }
  
  if (signals.includes('self-criticism')) {
    return 'User is engaging in harsh self-judgment. Gentle reframe toward self-kindness may be helpful.'
  }
  
  if (signals.includes('isolation')) {
    return 'User feels alone in their struggle. Emphasize common humanity - many people face similar challenges.'
  }
  
  if (signals.includes('over-identification')) {
    return 'User is over-identifying with their challenges. Help create space between their identity and this moment.'
  }
  
  if (signals.includes('harsh-judgment')) {
    return 'Invite user to consider how they might speak to a friend in this situation, then apply that same kindness to themselves.'
  }
  
  return undefined
}

/**
 * Check if self-compassion coach should be active
 */
export function shouldActivateSelfCompassion(messages: CoachMessage[]): boolean {
  const analysis = analyzeForSelfCompassion(messages)
  return analysis.confidence >= 0.6
}

/**
 * Generate a self-compassion prompt snippet for the AI
 */
export function getSelfCompassionPrompt(analysis: CoachAnalysis): string {
  const { signals } = analysis
  
  let prompt = 'The user is showing signs of self-criticism. '
  
  if (signals.includes('shame')) {
    prompt += 'They are experiencing shame. Normalize their experience and emphasize that many people struggle with similar challenges. '
  }
  
  if (signals.includes('self-criticism')) {
    prompt += 'Help them shift from harsh self-judgment toward self-kindness. '
  }
  
  if (signals.includes('isolation')) {
    prompt += 'They feel alone in this. Remind them that their struggle is part of being human and many others face similar challenges. '
  }
  
  prompt += 'Use a warm, validating tone. Avoid toxic positivity - acknowledge their pain while encouraging self-compassion.'
  
  return prompt
}
