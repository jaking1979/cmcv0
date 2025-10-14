'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import TopNav from '@/components/TopNav'
import TourOverlay from '@/components/lessons/TourOverlay'
import LessonPlayer from '@/components/lessons/LessonPlayer'
import { getTourFlagForLesson, setTourFlag } from '@/lib/state/lessonState'
import type { Lesson } from '@/lib/lessons/types'

export default function LessonPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [showTour, setShowTour] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !slug) return

    // Load lesson from API
    fetch(`/api/lessons/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLesson(data.lesson)
          
          // Check tour for this specific lesson
          const tourSeen = getTourFlagForLesson(slug)
          if (!tourSeen) {
            setShowTour(true)
          }
    } else {
          setError(true)
        }
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [slug, mounted])

  const handleCloseTour = () => {
    setShowTour(false)
    if (slug) {
      setTourFlag(slug, true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <TopNav title="Loading..." />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading lesson...</div>
      </main>
      </div>
    )
  }

  if (error || !lesson) {
  return (
      <div className="min-h-screen bg-white flex flex-col">
        <TopNav title="Lesson Not Found" />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Lesson Not Found</h1>
            <p className="text-gray-600 mb-4">
              The lesson "{slug}" could not be found.
            </p>
            <a
              href="/learn"
              className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              ← Back to Lessons
            </a>
          </div>
        </main>
        </div>
    )
  }

  // Clean up title for display
  const cleanTitle = lesson.title.replace(/^\|\s*|\s*\|$/g, '').trim()

  return (
    <div className="flex h-dvh flex-col bg-white">
      <TopNav title={cleanTitle} />

      {showTour && <TourOverlay variant="lesson" onClose={handleCloseTour} />}

      {/* Back to Lessons button */}
      <div className="border-b bg-white px-4 py-2">
        <div className="max-w-3xl mx-auto">
          <a
            href="/learn"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            <span>←</span>
            <span>Back to Lessons</span>
          </a>
        </div>
      </div>

      <LessonPlayer lesson={lesson} />
    </div>
  )
}
