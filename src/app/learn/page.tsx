'use client'

import { useState, useEffect } from 'react'
import TopNav from '@/components/TopNav'
import TourOverlay from '@/components/lessons/TourOverlay'
import LessonCard from '@/components/lessons/LessonCard'
import LessonFilters from '@/components/lessons/LessonFilters'
import { generateRecommendedPlan } from '@/lib/plan/recommender'
import { getCompletedLessons, getTourFlags, setTourFlag } from '@/lib/state/lessonState'
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
    // Set page title
    document.title = "Learn Something - CMC Sober Coach"
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Load lessons from API
    fetch('/api/lessons')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLessons(data.lessons)
          setTags(data.tags)

          // Generate recommended plan
          const plan = generateRecommendedPlan(data.lessons)
          setRecommendedPlan(plan)
        }
        setLoading(false)
      })
      .catch(error => {
        console.error('Error loading lessons:', error)
        setError('Unable to load lessons. Please check your connection and try again.')
        setLoading(false)
      })

    // Load completed lessons
    const completedList = getCompletedLessons()
    setCompleted(completedList)

    // Check tour
    const tourFlags = getTourFlags()
    if (!tourFlags.first_visit_learn_seen) {
      setShowTour(true)
    }
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
      <div className="min-h-screen bg-white flex flex-col">
        <TopNav title="📚 Learn Something" />
        <main className="flex-1 flex flex-col px-3 sm:px-4 py-4 max-w-3xl mx-auto w-full">
          <div className="text-center mb-6" aria-live="polite" aria-busy="true">
            <div className="inline-flex items-center gap-2 glass-light px-4 py-3 shadow-soft" style={{ borderRadius: 'var(--radius-lg)' }}>
              <svg className="animate-spin h-5 w-5" style={{ color: 'var(--cmc-teal-500)' }} viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span style={{ color: 'var(--text-secondary)' }}>Loading lessons...</span>
            </div>
          </div>
          {/* Skeleton cards */}
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-light border border-gray-200/30 p-5 animate-pulse" style={{ borderRadius: 'var(--radius-xl)' }}>
                <div className="h-6 bg-gray-200 mb-3" style={{ borderRadius: 'var(--radius-md)', width: '60%' }} />
                <div className="h-4 bg-gray-200 mb-2" style={{ borderRadius: 'var(--radius-sm)', width: '90%' }} />
                <div className="h-4 bg-gray-200 mb-4" style={{ borderRadius: 'var(--radius-sm)', width: '70%' }} />
                <div className="h-10 bg-gray-200" style={{ borderRadius: 'var(--radius-lg)', width: '120px' }} />
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <TopNav title="📚 Learn Something" />
        <main className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="max-w-md w-full glass-medium border-2 border-red-300 p-6 shadow-soft text-center" style={{ borderRadius: 'var(--radius-2xl)', background: 'linear-gradient(135deg, #FEE 0%, #FDD 100%)' }}>
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#991B1B' }}>Unable to Load Lessons</h2>
            <p className="text-sm mb-4" style={{ color: '#991B1B' }}>{error}</p>
            <button
              onClick={() => { setError(null); setLoading(true); window.location.reload(); }}
              className="bg-gradient-to-br from-[#5ECBBC] to-[#3FA89C] px-4 py-2 text-white font-semibold hover:glow-teal-strong hover:scale-105 active:scale-95 transition-all duration-300 shadow-soft"
              style={{ borderRadius: 'var(--radius-lg)' }}
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopNav title="📚 Learn Something" />

      {showTour && <TourOverlay variant="learn" onClose={handleCloseTour} />}

      <main className="flex-1 flex flex-col px-3 sm:px-4 py-4 max-w-3xl mx-auto w-full min-h-0">
        {view === 'choose' && (
          <div className="space-y-4">
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                {completed.length} / {lessons.length} lessons completed
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => setView('plan')}>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">📋 Follow the Lesson Plan</h2>
              <p className="text-gray-700 mb-4">
                Get a personalized sequence of lessons based on your strengths and areas for growth.
              </p>
              <button className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 font-medium">
                View My Plan
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-emerald-50 to-teal-50 hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => setView('all')}>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">📚 See All Lessons</h2>
              <p className="text-gray-700 mb-4">
                Browse the complete library and choose lessons that interest you most.
              </p>
              <button className="w-full rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 font-medium">
                Browse All Lessons
              </button>
            </div>
          </div>
        )}

        {view === 'plan' && recommendedPlan && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Your Lesson Plan</h2>
              <button
                onClick={() => setView('choose')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                ← Back
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 leading-relaxed">
                {recommendedPlan.rationale}
              </p>
            </div>

            <div className="space-y-4 overflow-y-auto pb-4">
              {recommendedPlan.ordered.map((lesson, idx) => (
                <div key={lesson.slug} className="relative">
                  <div className="absolute -left-8 top-4 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                  <LessonCard
                    lesson={lesson}
                    isCompleted={completed.includes(lesson.slug)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'all' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">All Lessons</h2>
              <button
                onClick={() => setView('choose')}
                className="text-sm text-blue-600 hover:text-blue-700"
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

            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4 pb-4">
                {filteredLessons.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No lessons found matching your criteria.
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
          </div>
        )}
      </main>
    </div>
  )
}
