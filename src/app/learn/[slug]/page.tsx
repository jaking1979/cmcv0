'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import TopNav from '@/components/TopNav'
import TourOverlay from '@/components/lessons/TourOverlay'
import LessonPlayer from '@/components/lessons/LessonPlayer'
import { getTourFlagForLesson, setTourFlag } from '@/lib/state/lessonState'
import BottomNav, { NavSpacer } from '@/components/BottomNav'
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

    fetch(`/api/lessons/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLesson(data.lesson)
          const tourSeen = getTourFlagForLesson(slug)
          if (!tourSeen) setShowTour(true)
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
    if (slug) setTourFlag(slug, true)
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg-primary)' }}>
        <TopNav title="Loading…" showBack backHref="/learn" />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <svg className="animate-spin h-5 w-5" style={{ color: 'var(--cmc-teal-500)' }} viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm">Loading lesson…</span>
          </div>
        </main>
        <NavSpacer />
        <BottomNav />
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg-primary)' }}>
        <TopNav title="Not Found" showBack backHref="/learn" />
        <main className="flex-1 flex items-center justify-center px-4">
          <div
            className="w-full max-w-sm text-center p-6 rounded-3xl"
            style={{ background: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
          >
            <div className="text-4xl mb-3">🔍</div>
            <h1 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Lesson not found</h1>
            <p className="text-sm mb-4 text-wrap-anywhere" style={{ color: 'var(--text-secondary)' }}>
              The lesson "<code className="text-xs font-mono">{slug}</code>" could not be found.
            </p>
            <a
              href="/learn"
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white inline-block"
              style={{ background: 'linear-gradient(135deg, var(--cmc-teal-500), var(--cmc-teal-700))' }}
            >
              ← Back to Lessons
            </a>
          </div>
        </main>
        <NavSpacer />
        <BottomNav />
      </div>
    )
  }

  const cleanTitle = lesson.title.replace(/^\|\s*|\s*\|$/g, '').trim()

  return (
    <div className="flex h-dvh flex-col" style={{ background: 'var(--bg-primary)' }}>
      <TopNav title={cleanTitle} showBack backHref="/learn" />

      {showTour && <TourOverlay variant="lesson" onClose={handleCloseTour} />}

      <LessonPlayer lesson={lesson} />

      <NavSpacer />
      <BottomNav />
    </div>
  )
}
