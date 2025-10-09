import { NextRequest, NextResponse } from 'next/server'
import { nextRoleplayTurn, getRoleplaySession } from '@/server/roleplays/session'

// Feature flag check
function isFeatureEnabled(): boolean {
  return process.env.FEATURE_V1 === '1' && process.env.FEATURE_ROLEPLAYS === '1'
}

// Session management
function getSessionId(request: NextRequest): string {
  const headerSessionId = request.headers.get('X-Session-Id')
  if (headerSessionId) {
    return headerSessionId
  }

  const cookieSessionId = request.cookies.get('session-id')?.value
  if (cookieSessionId) {
    return cookieSessionId
  }

  return `session_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 2 * 60 * 1000 // 2 minutes
const RATE_LIMIT_MAX_REQUESTS = 20

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const key = ip
  const current = rateLimitMap.get(key)

  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  current.count++
  return true
}

// Validation
function validateNextRequest(data: any): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.userMessage === 'string'
  )
}

// POST /api/roleplays/next - Get next roleplay turn
export async function POST(request: NextRequest) {
  try {
    // Feature flag check
    if (!isFeatureEnabled()) {
      return NextResponse.json(
        { error: 'Feature not enabled' },
        { status: 404 }
      )
    }

    // Rate limiting
    const ip = request.ip || request.headers.get('X-Forwarded-For') || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Get session ID
    const sessionId = getSessionId(request)
    
    // Parse and validate request body
    const body = await request.json()
    
    if (!validateNextRequest(body)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Check if session exists
    const session = getRoleplaySession(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: 'No active roleplay session found' },
        { status: 404 }
      )
    }

    // Get next turn(s)
    const turns = nextRoleplayTurn(sessionId, body.userMessage)

    if (turns.length === 0) {
      return NextResponse.json(
        { error: 'No more turns available' },
        { status: 404 }
      )
    }

    // Return turns
    return NextResponse.json({
      success: true,
      sessionId,
      turns,
      isComplete: turns[0]?.content === 'This roleplay scenario has concluded. Thank you for practicing!'
    })

  } catch (error) {
    console.error('[roleplays/next] POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/roleplays/next - Get current session status
export async function GET(request: NextRequest) {
  try {
    // Feature flag check
    if (!isFeatureEnabled()) {
      return NextResponse.json(
        { error: 'Feature not enabled' },
        { status: 404 }
      )
    }

    // Rate limiting
    const ip = request.ip || request.headers.get('X-Forwarded-For') || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const sessionId = getSessionId(request)
    const session = getRoleplaySession(sessionId)

    if (!session) {
      return NextResponse.json({
        success: true,
        hasActiveSession: false,
        sessionId
      })
    }

    return NextResponse.json({
      success: true,
      hasActiveSession: true,
      sessionId,
      roleplayId: session.roleplayId,
      title: session.roleplay.title,
      currentStepIndex: session.currentStepIndex,
      totalSteps: session.roleplay.steps.length,
      startedAt: session.startedAt
    })

  } catch (error) {
    console.error('[roleplays/next] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}




