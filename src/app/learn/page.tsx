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
  const [mounted, setMounted] = useState(false)
  const [recommendedPlan, setRecommendedPlan] = useState<{ ordered: Lesson[]; rationale: string } | null>(null)

  useEffect(() => {
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
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading lessons...</div>
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
