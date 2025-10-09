/**
 * Plan Manager
 * Synthesizes insights from multiple coaches into a coherent personalized plan
 */

import type { CoachEvent, PersonalizedPlan, PlanAction, CoachMessage } from '../types'
import { CRISIS_AND_SCOPE_GUARDRAILS } from '../promptFragments'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

/**
 * Synthesize a personalized plan from coach events and conversation
 */
export async function synthesizePlan(
  sessionId: string,
  coachEvents: CoachEvent[],
  recentMessages: CoachMessage[]
): Promise<PersonalizedPlan> {
  // Extract key insights from coach events
  const insights = extractInsights(coachEvents)
  
  // Build context from recent messages
  const conversationContext = recentMessages
    .slice(-10)
    .map(m => `${m.role}: ${m.content}`)
    .join('\n')
  
  // Create synthesis prompt
  const systemPrompt = buildSynthesisPrompt(insights)
  
  // Call OpenAI to generate plan
  const planText = await generatePlanWithAI(systemPrompt, conversationContext)
  
  // Parse the plan into structured format
  const plan = parsePlanText(planText, sessionId)
  
  return plan
}

/**
 * Extract key insights from coach events
 */
function extractInsights(events: CoachEvent[]): {
  dbt: string[]
  selfCompassion: string[]
  cbt: string[]
  allTags: Array<{ type: string; value: string; confidence: number }>
} {
  const insights = {
    dbt: [] as string[],
    selfCompassion: [] as string[],
    cbt: [] as string[],
    allTags: [] as Array<{ type: string; value: string; confidence: number }>
  }
  
  for (const event of events) {
    // Collect tags
    for (const tag of event.tags) {
      insights.allTags.push({
        type: tag.type,
        value: tag.value,
        confidence: tag.confidence
      })
    }
    
    // Categorize by coach type
    const signals = event.tags.map(t => t.value).join(', ')
    if (signals) {
      switch (event.coachType) {
        case 'dbt':
          insights.dbt.push(signals)
          break
        case 'self-compassion':
          insights.selfCompassion.push(signals)
          break
        case 'cbt':
          insights.cbt.push(signals)
          break
      }
    }
  }
  
  return insights
}

/**
 * Build the synthesis prompt for the AI
 */
function buildSynthesisPrompt(insights: ReturnType<typeof extractInsights>): string {
  let prompt = `${CRISIS_AND_SCOPE_GUARDRAILS}

You are the Plan Manager for CMC Sober Coach, synthesizing insights from multiple specialized coaches into a coherent, personalized action plan.

**Your Role:**
- Review insights from DBT, Self-Compassion, and CBT coaches
- Identify the 3-5 most relevant and actionable recommendations
- Create a brief, practical plan that addresses the user's immediate needs
- Prioritize based on urgency, feasibility, and alignment with user's situation

**Insights from Coaches:**
`

  if (insights.dbt.length > 0) {
    prompt += `\n**DBT Coach signals:** ${Array.from(new Set(insights.dbt)).join('; ')}`
  }
  
  if (insights.selfCompassion.length > 0) {
    prompt += `\n**Self-Compassion Coach signals:** ${Array.from(new Set(insights.selfCompassion)).join('; ')}`
  }
  
  if (insights.cbt.length > 0) {
    prompt += `\n**CBT Coach signals:** ${Array.from(new Set(insights.cbt)).join('; ')}`
  }
  
  prompt += `

**Output Format:**
Generate a plan with:
1. A brief summary paragraph (2-3 sentences) explaining the overall strategy
2. 3-5 specific action items, each with:
   - A clear, actionable title
   - A 1-2 sentence description of how to do it
   - A category (immediate, short-term, or long-term)
   - A difficulty rating (easy, medium, or hard)

**Guidelines:**
- Be specific and practical - avoid vague advice
- Start with easier, more immediate actions
- Prioritize skills that address current distress or challenges
- Use plain language, avoid jargon
- Keep the total plan under 200 words
- Do not diagnose or provide medical advice

Format your response as:

SUMMARY:
[2-3 sentence summary]

ACTIONS:
1. [Title] | [Category] | [Difficulty]
[Description]

2. [Title] | [Category] | [Difficulty]
[Description]

...and so on.
`

  return prompt
}

/**
 * Generate plan using OpenAI
 */
async function generatePlanWithAI(systemPrompt: string, conversationContext: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured')
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Based on this recent conversation, create a personalized plan:\n\n${conversationContext}` }
      ],
      temperature: 0.7,
      max_tokens: 800,
    })
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${error}`)
  }
  
  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

/**
 * Parse the AI-generated plan text into structured format
 */
function parsePlanText(planText: string, sessionId: string): PersonalizedPlan {
  const actions: PlanAction[] = []
  let summary = ''
  let rationale = ''
  
  // Extract summary
  const summaryMatch = planText.match(/SUMMARY:\s*(.+?)(?=ACTIONS:|$)/s)
  if (summaryMatch) {
    summary = summaryMatch[1].trim()
    rationale = summary // Use summary as rationale for now
  }
  
  // Extract actions
  const actionsMatch = planText.match(/ACTIONS:\s*(.+)/s)
  if (actionsMatch) {
    const actionsText = actionsMatch[1]
    const actionBlocks = actionsText.split(/\n\d+\./)
    
    for (let i = 1; i < actionBlocks.length; i++) {
      const block = actionBlocks[i].trim()
      
      // Parse title, category, difficulty
      const headerMatch = block.match(/^(.+?)\s*\|\s*(immediate|short-term|long-term)\s*\|\s*(easy|medium|hard)/i)
      if (headerMatch) {
        const title = headerMatch[1].trim()
        const category = headerMatch[2].toLowerCase() as 'immediate' | 'short-term' | 'long-term'
        const difficulty = headerMatch[3].toLowerCase() as 'easy' | 'medium' | 'hard'
        
        // Extract description (everything after the header line)
        const descMatch = block.match(/\n(.+)/s)
        const description = descMatch ? descMatch[1].trim() : ''
        
        actions.push({
          id: `action_${i}`,
          title,
          description,
          category,
          difficulty
        })
      }
    }
  }
  
  // Calculate overall confidence based on number of actions
  const confidence = Math.min(actions.length / 5, 1.0)
  
  return {
    id: `plan_${Date.now()}`,
    sessionId,
    timestamp: Date.now(),
    summary: summary || 'Based on our conversation, here is a personalized plan to support your goals.',
    actions,
    rationale,
    confidence
  }
}

/**
 * Get a quick plan summary (for inline display)
 */
export function getQuickPlanSummary(plan: PersonalizedPlan): string {
  const immediateActions = plan.actions.filter(a => a.category === 'immediate')
  
  if (immediateActions.length === 0) {
    return plan.summary
  }
  
  return `${plan.summary} Your first step: ${immediateActions[0].title}`
}

/**
 * Filter actions by category
 */
export function getActionsByCategory(
  plan: PersonalizedPlan,
  category: 'immediate' | 'short-term' | 'long-term'
): PlanAction[] {
  return plan.actions.filter(a => a.category === category)
}

/**
 * Filter actions by difficulty
 */
export function getActionsByDifficulty(
  plan: PersonalizedPlan,
  difficulty: 'easy' | 'medium' | 'hard'
): PlanAction[] {
  return plan.actions.filter(a => a.difficulty === difficulty)
}
