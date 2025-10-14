import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { pinPlan, unpinPlan } from '@/server/store/memory'
import { getOrCreateSession, createSessionResponse } from '@/server/util/session'

// Feature flag check
function isPlanEnabled(): boolean {
  return process.env.FEATURE_V1 === '1' && process.env.FEATURE_PLAN === '1'
}

/**
 * POST /api/plan/pin
 * Pin or unpin a plan for the session
 */
export async function POST(request: NextRequest) {
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
    
    // Parse request body
    const body = await request.json()
    const { planId, unpin } = body as { planId?: string; unpin?: boolean }
    
    if (unpin) {
      unpinPlan(session.id)
    } else if (planId) {
      pinPlan(session.id, planId)
    } else {
      return NextResponse.json(
        { error: 'Missing planId' },
        { status: 400 }
      )
    }
    
    return createSessionResponse(
      {
        success: true,
        pinnedPlanId: unpin ? null : planId,
      },
      session
    )
  } catch (error) {
    console.error('Plan pin API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

