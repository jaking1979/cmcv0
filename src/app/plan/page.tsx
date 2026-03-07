'use client'

import { useEffect, useState } from 'react'
import TopNav from '@/components/TopNav'
import BottomNav, { NavSpacer } from '@/components/BottomNav'

interface PlanAction {
  id: string
  title: string
  description: string
  category: 'immediate' | 'short-term' | 'long-term'
  difficulty: 'easy' | 'medium' | 'hard'
}

interface PersonalizedPlan {
  id: string
  sessionId: string
  timestamp: number
  summary: string
  actions: PlanAction[]
  rationale: string
  confidence: number
}

function difficultyBadge(d: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    easy: { label: 'Easy', color: '#15803D', bg: '#F0FDF4' },
    medium: { label: 'Medium', color: '#B45309', bg: '#FFFBEB' },
    hard: { label: 'Challenging', color: '#9333EA', bg: '#FAF5FF' },
  }
  const style = map[d] || map.easy
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  )
}

function categorySection(
  category: 'immediate' | 'short-term' | 'long-term',
  actions: PlanAction[],
  completedIds: Set<string>,
  onToggle: (id: string) => void
) {
  const filtered = actions.filter(a => a.category === category)
  if (!filtered.length) return null
  const config = {
    immediate: { emoji: '⚡', label: 'Right Now', color: 'var(--cmc-teal-600)' },
    'short-term': { emoji: '📅', label: 'This Week', color: 'var(--lavender-500)' },
    'long-term': { emoji: '🎯', label: 'Long-Term', color: 'var(--peach-400)' },
  }
  const c = config[category]
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{c.emoji}</span>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: c.color, letterSpacing: '0.1em' }}>
          {c.label}
        </p>
      </div>
      <div className="space-y-2">
        {filtered.map(action => {
          const done = completedIds.has(action.id)
          return (
            <div
              key={action.id}
              className="flex items-start gap-3 p-4 rounded-2xl transition-all cursor-pointer active:scale-98"
              style={{
                background: done ? 'rgba(94,203,188,0.08)' : 'white',
                border: done ? '1.5px solid rgba(94,203,188,0.25)' : '1.5px solid rgba(0,0,0,0.05)',
                boxShadow: done ? 'none' : '0 1px 4px rgba(0,0,0,0.04)',
                opacity: done ? 0.75 : 1,
              }}
              onClick={() => onToggle(action.id)}
            >
              <div
                className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all"
                style={{
                  border: done ? 'none' : '1.5px solid rgba(0,0,0,0.2)',
                  background: done ? 'linear-gradient(135deg, var(--cmc-teal-500), var(--cmc-teal-700))' : 'transparent',
                }}
              >
                {done && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p
                    className="text-sm font-semibold text-wrap-anywhere leading-tight"
                    style={{
                      color: 'var(--text-primary)',
                      textDecoration: done ? 'line-through' : 'none',
                    }}
                  >
                    {action.title.replace(/\*\*/g, '')}
                  </p>
                  {difficultyBadge(action.difficulty)}
                </div>
                <p className="text-xs leading-relaxed text-wrap-anywhere" style={{ color: 'var(--text-secondary)' }}>
                  {action.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function PlanPage() {
  const [plan, setPlan] = useState<PersonalizedPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    document.title = 'Action Plan — CMC Sober Coach'
    const saved = typeof window !== 'undefined' && window.localStorage.getItem('cmc_plan')
    if (saved) {
      try { setPlan(JSON.parse(saved)) } catch { }
    }
    const savedCompleted = typeof window !== 'undefined' && window.localStorage.getItem('cmc_plan_completed')
    if (savedCompleted) {
      try { setCompletedIds(new Set(JSON.parse(savedCompleted))) } catch { }
    }
  }, [])

  function toggleAction(id: string) {
    setCompletedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try { window.localStorage.setItem('cmc_plan_completed', JSON.stringify([...next])) } catch { }
      return next
    })
  }

  const completedCount = plan ? plan.actions.filter(a => completedIds.has(a.id)).length : 0
  const totalCount = plan?.actions.length ?? 0
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <TopNav title="Action Plan" />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">

        {!plan ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              No plan yet
            </h2>
            <p
              className="text-sm mb-6 max-w-xs leading-relaxed text-wrap-anywhere"
              style={{ color: 'var(--text-secondary)' }}
            >
              Start a conversation in the Chat tab. After a few exchanges, your coach will offer to create a personalized action plan for you.
            </p>
            <a
              href="/advice"
              className="px-6 py-3 rounded-full text-sm font-semibold text-white inline-block"
              style={{ background: 'linear-gradient(135deg, var(--cmc-teal-500), var(--cmc-teal-700))' }}
            >
              Open Chat
            </a>
          </div>
        ) : (
          <>
            {/* Summary card */}
            <div
              className="rounded-3xl p-5 mb-5"
              style={{
                background: 'linear-gradient(135deg, rgba(94,203,188,0.1), rgba(63,168,156,0.06))',
                border: '1.5px solid rgba(94,203,188,0.2)',
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="text-sm font-semibold" style={{ color: 'var(--cmc-teal-700)' }}>Your Plan Summary</p>
                <span className="text-xs shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                  {new Date(plan.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-wrap-anywhere mb-4" style={{ color: 'var(--text-secondary)' }}>
                {plan.summary}
              </p>
              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <span>{completedCount} of {totalCount} completed</span>
                  <span className="font-semibold" style={{ color: 'var(--cmc-teal-600)' }}>{Math.round(progressPct)}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progressPct}%`,
                      background: 'linear-gradient(to right, var(--cmc-teal-400), var(--cmc-teal-600))',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Action categories */}
            {categorySection('immediate', plan.actions, completedIds, toggleAction)}
            {categorySection('short-term', plan.actions, completedIds, toggleAction)}
            {categorySection('long-term', plan.actions, completedIds, toggleAction)}

            {/* Rationale */}
            {plan.rationale && (
              <div
                className="rounded-2xl p-4 mt-2"
                style={{ background: 'rgba(0,0,0,0.03)' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                  Coach's reasoning
                </p>
                <p className="text-xs leading-relaxed text-wrap-anywhere" style={{ color: 'var(--text-secondary)' }}>
                  {plan.rationale}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  if (confirm('Clear your current plan?')) {
                    setPlan(null)
                    setCompletedIds(new Set())
                    try { window.localStorage.removeItem('cmc_plan'); window.localStorage.removeItem('cmc_plan_completed') } catch { }
                  }
                }}
                className="px-4 py-2.5 rounded-full text-sm font-medium min-h-[44px]"
                style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--text-secondary)' }}
              >
                Clear plan
              </button>
              <a
                href="/advice"
                className="flex-1 flex items-center justify-center py-2.5 rounded-full text-sm font-semibold text-white min-h-[44px]"
                style={{ background: 'linear-gradient(135deg, var(--cmc-teal-500), var(--cmc-teal-700))' }}
              >
                Continue chatting
              </a>
            </div>
          </>
        )}
      </main>

      <NavSpacer />
      <BottomNav />
    </div>
  )
}
