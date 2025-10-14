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

  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return { background: 'linear-gradient(135deg, var(--cmc-teal-200) 0%, var(--cmc-teal-300) 100%)', color: 'var(--cmc-teal-700)' }
      case 'medium':
        return { background: 'linear-gradient(135deg, #FFF4D4 0%, #FFE8A3 100%)', color: '#92400E' }
      case 'hard':
        return { background: 'linear-gradient(135deg, #FFE5D4 0%, #FFD4A3 100%)', color: '#C2410C' }
      default:
        return { background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }
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
    <div className="glass-medium shadow-medium border border-gray-200/30 overflow-hidden slide-up" style={{ borderRadius: 'var(--radius-2xl)' }}>
      {/* Header */}
      <div className="p-5 border-b border-gray-200/30" style={{ background: 'linear-gradient(135deg, var(--cmc-teal-200) 0%, var(--lavender-300) 100%)' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Your Personalized Action Plan
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {plan.summary}
            </p>
            {plan.rationale && (
              <p className="text-xs mt-2 italic" style={{ color: 'var(--text-tertiary)' }}>
                {plan.rationale}
              </p>
            )}
          </div>
          {isPinned && (
            <span className="flex-shrink-0 text-xs font-semibold bg-gradient-to-br from-[#5ECBBC] to-[#3FA89C] text-white px-2.5 py-1 shadow-soft glow-pulse-teal" style={{ borderRadius: 'var(--radius-md)' }}>
              📌 Pinned
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
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
          <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Suggested Actions:</h4>
          <div className="space-y-3">
            {plan.actions.map((action, idx) => (
              <div
                key={action.id}
                className={`glass-light border border-gray-200/30 p-4 hover:glass-medium hover:glow-teal transition-all duration-300 stagger-${Math.min(idx + 1, 5)}`}
                style={{ borderRadius: 'var(--radius-lg)' }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h5 className="text-sm font-semibold flex-1" style={{ color: 'var(--text-primary)' }}>
                    {action.title.replace(/\*\*/g, '')}
                  </h5>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs">
                      {getCategoryLabel(action.category)}
                    </span>
                    <span className="text-xs px-2 py-0.5 font-semibold shadow-soft" style={{ ...getDifficultyStyle(action.difficulty), borderRadius: 'var(--radius-sm)' }}>
                      {action.difficulty}
                    </span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {action.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="px-4 py-3 border-t border-gray-200/30 flex items-center justify-between gap-3" style={{ background: 'var(--bg-secondary)' }}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm hover:scale-105 transition-all duration-300"
          style={{ color: 'var(--text-secondary)' }}
        >
          {expanded ? '▼ Collapse' : '▶ Expand'}
        </button>
        <div className="flex gap-2">
          {!isPinned && onDismiss && (
            <button
              onClick={() => onDismiss(plan.id)}
              className="glass-light border border-gray-200/50 px-3 py-1.5 text-sm hover:glass-medium hover:glow-teal transition-all duration-300"
              style={{ borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
            >
              Dismiss
            </button>
          )}
          {!isPinned && onAccept && (
            <button
              onClick={() => onAccept(plan.id)}
              className="bg-gradient-to-br from-[#5ECBBC] to-[#3FA89C] px-3 py-1.5 text-sm text-white font-semibold hover:glow-teal-strong hover:scale-105 active:scale-95 transition-all duration-300 shadow-soft"
              style={{ borderRadius: 'var(--radius-md)' }}
            >
              Pin This Plan
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

