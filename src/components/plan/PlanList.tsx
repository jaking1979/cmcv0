'use client'

import PlanCard from './PlanCard'
import type { PersonalizedPlan } from '@/server/ai/types'

interface PlanListProps {
  plans: PersonalizedPlan[]
  pinnedPlanId?: string
  onAccept?: (planId: string) => void
  onDismiss?: (planId: string) => void
}

export default function PlanList({ plans, pinnedPlanId, onAccept, onDismiss }: PlanListProps) {
  if (plans.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Plans Yet</h3>
        <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
          Plans are generated based on your conversations. Visit the "Get Advice" page and have a
          conversation to get personalized action plans.
        </p>
        <a
          href="/advice?v1=1"
          className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
        >
          Start a Conversation
        </a>
      </div>
    )
  }

  // Sort plans: pinned first, then by timestamp descending
  const sortedPlans = [...plans].sort((a, b) => {
    if (a.id === pinnedPlanId) return -1
    if (b.id === pinnedPlanId) return 1
    return b.timestamp - a.timestamp
  })

  return (
    <div className="space-y-4">
      {sortedPlans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          isPinned={plan.id === pinnedPlanId}
          onAccept={onAccept}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  )
}

