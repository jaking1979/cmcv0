import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import type { CoachMessage } from '@/server/ai/types'
import { getEvents } from '@/server/store/memory'
import { storePlan, getLatestPlan } from '@/server/store/memory'
import { getOrCreateSession, createSessionResponse, isRateLimited } from '@/server/util/session'
import { redactMessages } from '@/server/util/redactPII'
import { synthesizePlan } from '@/server/ai/manager/planManager'

// Feature flag check
function isPlanEnabled(): boolean {
  return process.env.FEATURE_V1 === '1' && process.env.FEATURE_PLAN === '1'
}

/**
 * POST /api/plan
 * Generate a personalized plan from coach events and conversation
 */
export async function POST(request: NextRequest) {
  try {
    // Check feature flag
    if (!isPlanEnabled()) {
      return NextResponse.json(
        { error: 'Plan generation not enabled' },
        { status: 403 }
      )
    }
    
    // Get or create session
    const session = getOrCreateSession(request)
    
    // Rate limiting (stricter for plan generation)
    if (isRateLimited(`plan_${session.id}`)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before requesting another plan.' },
        { status: 429 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const { messages, limit } = body as { messages?: CoachMessage[]; limit?: number }
    
    // Get recent coach events for this session
    const recentEvents = getEvents(session.id, limit || 20)
    
    // Check if we have enough data to generate a plan
    if (recentEvents.length === 0 && (!messages || messages.length === 0)) {
      return NextResponse.json(
        { 
          error: 'Insufficient data to generate a plan. Please continue the conversation.',
          suggestion: 'Share more about your situation, challenges, or goals to receive personalized recommendations.'
        },
        { status: 400 }
      )
    }
    
    // Use provided messages or create empty array
    let conversationMessages = messages || []
    
    // Redact PII from messages
    if (conversationMessages.length > 0) {
      conversationMessages = redactMessages(conversationMessages)
    }
    
    // Generate plan
    const plan = await synthesizePlan(session.id, recentEvents, conversationMessages)
    
    // Store the plan
    storePlan(plan)
    
    // Return the plan
    return createSessionResponse(
      {
        success: true,
        plan,
        sessionId: session.id,
        eventsAnalyzed: recentEvents.length,
      },
      session
    )
  } catch (error) {
    console.error('Plan API error:', error)
    
    // Handle OpenAI API errors gracefully
    if (error instanceof Error && error.message.includes('OpenAI API')) {
      return NextResponse.json(
        { 
          error: 'Unable to generate plan at this time',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/plan
 * Retrieve the most recent plan for the session
 */
export async function GET(request: NextRequest) {
  try {
    // Check feature flag
    if (!isPlanEnabled()) {
      return NextResponse.json(
        { error: 'Plan feature not enabled' },
        { status: 403 }
      )
    }
    
    // Get session
    const session = getOrCreateSession(request)
    
    // Get latest plan
    const plan = getLatestPlan(session.id)
    
    if (!plan) {
      return NextResponse.json(
        { 
          success: true,
          plan: null,
          message: 'No plan generated yet for this session'
        },
        { status: 200 }
      )
    }
    
    return createSessionResponse(
      {
        success: true,
        plan,
        sessionId: session.id,
      },
      session
    )
  } catch (error) {
    console.error('Plan API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
