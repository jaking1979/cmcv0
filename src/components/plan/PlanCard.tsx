'use client'

import { useState } from 'react'
import type { PersonalizedPlan } from '@/server/ai/types'

interface PlanCardProps {
  plan: PersonalizedPlan
  onAccept?: (planId: string) => void
  onDismiss?: (planId: string) => void
  isPinned?: boolean
}

export default function PlanCard({ plan, onAccept, onDismiss, isPinned }: PlanCardProps) {
  const [expanded, setExpanded] = useState(true)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'hard':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'immediate':
        return '🔴 Immediate'
      case 'short-term':
        return '🟡 Short-term'
      case 'long-term':
        return '🟢 Long-term'
      default:
        return category
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-blue-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Your Personalized Action Plan
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {plan.summary}
            </p>
            {plan.rationale && (
              <p className="text-xs text-gray-600 mt-2 italic">
                {plan.rationale}
              </p>
            )}
          </div>
          {isPinned && (
            <span className="flex-shrink-0 text-xs font-medium bg-blue-600 text-white rounded-full px-2 py-1">
              📌 Pinned
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
          <span>Confidence: {Math.round((plan.confidence || 0) * 100)}%</span>
          <span>•</span>
          <span>{new Date(plan.timestamp).toLocaleDateString()}</span>
          {plan.eventsAnalyzed !== undefined && (
            <>
              <span>•</span>
              <span>{plan.eventsAnalyzed} insights</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      {expanded && plan.actions && plan.actions.length > 0 && (
        <div className="p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Suggested Actions:</h4>
          <div className="space-y-3">
            {plan.actions.map((action) => (
              <div
                key={action.id}
                className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h5 className="text-sm font-medium text-gray-900 flex-1">
                    {action.title.replace(/\*\*/g, '')}
                  </h5>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs">
                      {getCategoryLabel(action.category)}
                    </span>
                    <span className={`text-xs rounded-full px-2 py-0.5 ${getDifficultyColor(action.difficulty)}`}>
                      {action.difficulty}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {action.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between gap-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          {expanded ? '▼ Collapse' : '▶ Expand'}
        </button>
        <div className="flex gap-2">
          {!isPinned && onDismiss && (
            <button
              onClick={() => onDismiss(plan.id)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Dismiss
            </button>
          )}
          {!isPinned && onAccept && (
            <button
              onClick={() => onAccept(plan.id)}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 transition-colors"
            >
              Pin This Plan
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

