'use client'

import { useState, useEffect } from 'react'
import TopNav from '@/components/TopNav'
import TourOverlay from '@/components/lessons/TourOverlay'
import LessonCard from '@/components/lessons/LessonCard'
import LessonFilters from '@/components/lessons/LessonFilters'
import { generateRecommendedPlan } from '@/lib/plan/recommender'
import { getCompletedLessons, getTourFlags, setTourFlag } from '@/lib/state/lessonState'
import BottomNav, { NavSpacer } from '@/components/BottomNav'
import type { Lesson } from '@/lib/lessons/types'

export default function LearnIndexPage() {
  const [view, setView] = useState<'choose' | 'plan' | 'all'>('choose')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('All')
  const [completed, setCompleted] = useState<string[]>([])
  const [showTour, setShowTour] = useState(false)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [recommendedPlan, setRecommendedPlan] = useState<{ ordered: Lesson[]; rationale: string } | null>(null)

  useEffect(() => {
    document.title = 'Learn — CMC Sober Coach'
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    fetch('/api/lessons')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLessons(data.lessons)
          setTags(data.tags)
          setRecommendedPlan(generateRecommendedPlan(data.lessons))
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Unable to load lessons. Please check your connection and try again.')
        setLoading(false)
      })
    setCompleted(getCompletedLessons())
    const tourFlags = getTourFlags()
    if (!tourFlags.first_visit_learn_seen) setShowTour(true)
  }, [mounted])

  const handleCloseTour = () => {
    setShowTour(false)
    setTourFlag('learn', true)
  }

  const filteredLessons = lessons.filter(lesson => {
    const title = lesson.title || ''
    const description = lesson.description || ''
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = selectedTag === 'All' || (lesson.tags && lesson.tags.includes(selectedTag))
    return matchesSearch && matchesTag
  })

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg-primary)' }}>
        <TopNav title="Learn" />
        <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
          <div className="flex items-center justify-center gap-2 mb-6" aria-live="polite" aria-busy="true">
            <svg className="animate-spin h-5 w-5" style={{ color: 'var(--cmc-teal-500)' }} viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading lessons…</span>
          </div>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="rounded-3xl p-5 mb-3 animate-pulse"
              style={{ background: 'white', height: '120px' }}
            />
          ))}
        </main>
        <NavSpacer />
        <BottomNav />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg-primary)' }}>
        <TopNav title="Learn" />
        <main className="flex-1 flex items-center justify-center px-4">
          <div
            className="w-full max-w-sm text-center p-6 rounded-3xl"
            style={{ background: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
          >
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#991B1B' }}>Unable to Load Lessons</h2>
            <p className="text-sm mb-4 text-wrap-anywhere" style={{ color: '#991B1B' }}>{error}</p>
            <button
              onClick={() => { setError(null); setLoading(true); window.location.reload() }}
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, var(--cmc-teal-500), var(--cmc-teal-700))' }}
            >
              Retry
            </button>
          </div>
        </main>
        <NavSpacer />
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <TopNav title="Learn" />
      {showTour && <TourOverlay variant="learn" onClose={handleCloseTour} />}

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">

        {view === 'choose' && (
          <div className="space-y-3">
            {/* Progress */}
            <div className="mb-4">
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                {completed.length} / {lessons.length} lessons completed
              </p>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: lessons.length > 0 ? `${(completed.length / lessons.length) * 100}%` : '0%',
                    background: 'linear-gradient(to right, var(--cmc-teal-400), var(--cmc-teal-600))',
                  }}
                />
              </div>
            </div>

            {/* Lesson plan card */}
            <button
              className="w-full text-left rounded-3xl p-5 transition-all active:scale-98"
              style={{
                background: 'linear-gradient(135deg, rgba(94,203,188,0.12), rgba(63,168,156,0.08))',
                border: '1.5px solid rgba(94,203,188,0.25)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
              onClick={() => setView('plan')}
            >
              <div className="flex items-start gap-3">
                <div
                  className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
                  style={{ background: 'rgba(94,203,188,0.15)' }}
                >
                  📋
                </div>
                <div>
                  <h2 className="text-base font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                    Follow the Lesson Plan
                  </h2>
                  <p className="text-sm leading-relaxed text-wrap-anywhere" style={{ color: 'var(--text-secondary)' }}>
                    A personalized sequence based on your strengths and areas for growth
                  </p>
                </div>
              </div>
            </button>

            {/* All lessons card */}
            <button
              className="w-full text-left rounded-3xl p-5 transition-all active:scale-98"
              style={{
                background: 'white',
                border: '1.5px solid rgba(0,0,0,0.06)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
              onClick={() => setView('all')}
            >
              <div className="flex items-start gap-3">
                <div
                  className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
                  style={{ background: 'var(--bg-primary)' }}
                >
                  📚
                </div>
                <div>
                  <h2 className="text-base font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                    Browse All Lessons
                  </h2>
                  <p className="text-sm leading-relaxed text-wrap-anywhere" style={{ color: 'var(--text-secondary)' }}>
                    Explore the complete library and choose what interests you most
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {view === 'plan' && recommendedPlan && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Your Lesson Plan</h2>
              <button
                onClick={() => setView('choose')}
                className="text-sm font-medium"
                style={{ color: 'var(--cmc-teal-600)' }}
              >
                ← Back
              </button>
            </div>
            <div
              className="rounded-2xl p-4 mb-4 text-sm leading-relaxed text-wrap-anywhere"
              style={{ background: 'rgba(94,203,188,0.08)', color: 'var(--text-secondary)' }}
            >
              {recommendedPlan.rationale}
            </div>
            <div className="space-y-3 pb-4">
              {recommendedPlan.ordered.map((lesson, idx) => (
                <div key={lesson.slug} className="relative pl-8">
                  <div
                    className="absolute left-0 top-4 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ background: 'linear-gradient(135deg, var(--cmc-teal-500), var(--cmc-teal-700))' }}
                  >
                    {idx + 1}
                  </div>
                  <LessonCard lesson={lesson} isCompleted={completed.includes(lesson.slug)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'all' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>All Lessons</h2>
              <button
                onClick={() => setView('choose')}
                className="text-sm font-medium"
                style={{ color: 'var(--cmc-teal-600)' }}
              >
                ← Back
              </button>
            </div>
            <LessonFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedTag={selectedTag}
              onTagChange={setSelectedTag}
              tags={tags}
            />
            <div className="space-y-3 pb-4 mt-4">
              {filteredLessons.length === 0 ? (
                <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
                  <p className="text-3xl mb-3">🔍</p>
                  <p className="text-sm">No lessons match your search.</p>
                </div>
              ) : (
                filteredLessons.map(lesson => (
                  <LessonCard
                    key={lesson.slug}
                    lesson={lesson}
                    isCompleted={completed.includes(lesson.slug)}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </main>

      <NavSpacer />
      <BottomNav />
    </div>
  )
}
