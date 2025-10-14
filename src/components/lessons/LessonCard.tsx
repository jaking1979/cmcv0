'use client'

import Link from 'next/link'
import type { Lesson } from '@/lib/lessons/types'

interface LessonCardProps {
  lesson: Lesson
  isCompleted: boolean
}

export default function LessonCard({ lesson, isCompleted }: LessonCardProps) {
  // Clean up title (remove table markers if present)
  const cleanTitle = lesson.title.replace(/^\|\s*|\s*\|$/g, '').trim()

  return (
    <div className="glass-medium shadow-soft border border-gray-200/30 p-5 hover:glass-strong hover:glow-teal hover:scale-105 transition-all duration-300 slide-up" style={{ borderRadius: 'var(--radius-xl)' }}>
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2 flex-wrap">
          <Link
            href={`/learn/${lesson.slug}`}
            className="text-lg sm:text-xl font-semibold hover:underline leading-tight flex-1 min-w-0 text-wrap-anywhere transition-colors duration-300"
            style={{ color: 'var(--cmc-teal-600)' }}
          >
            {cleanTitle}
          </Link>
          <div className="flex items-center gap-2 flex-shrink-0">
            {lesson.tags.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="text-xs font-semibold px-2.5 py-1 shadow-soft"
                style={{ 
                  background: 'linear-gradient(135deg, var(--lavender-300) 0%, var(--lavender-400) 100%)',
                  color: 'var(--cmc-teal-700)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                {tag}
              </span>
            ))}
            {isCompleted && (
              <span className="text-xs font-semibold px-2.5 py-1 shadow-soft glow-pulse-teal" style={{ 
                background: 'linear-gradient(135deg, var(--cmc-teal-200) 0%, var(--cmc-teal-300) 100%)',
                color: 'var(--cmc-teal-700)',
                borderRadius: 'var(--radius-md)'
              }}>
                ✓ Completed
              </span>
            )}
          </div>
        </div>

        {lesson.description && (
          <p className="text-sm sm:text-base leading-relaxed text-wrap-anywhere line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            {lesson.description.replace(/^\|\s*|\s*\|$/g, '').trim()}
          </p>
        )}

        {lesson.outcomes && lesson.outcomes.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600">What you'll learn:</div>
            <div className="flex flex-wrap gap-1">
              {lesson.outcomes.slice(0, 3).map((outcome, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-emerald-50 text-emerald-700 rounded-md px-2 py-1 border border-emerald-200"
                >
                  {outcome}
                </span>
              ))}
              {lesson.outcomes.length > 3 && (
                <span className="text-xs text-gray-500 px-2 py-1">
                  +{lesson.outcomes.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        <Link
          href={`/learn/${lesson.slug}`}
          className="mt-2 inline-flex items-center justify-center bg-gradient-to-br from-[#5ECBBC] to-[#3FA89C] px-4 py-2.5 text-sm font-semibold text-white hover:glow-teal-strong hover:scale-105 active:scale-95 transition-all duration-300 shadow-soft"
          style={{ borderRadius: 'var(--radius-lg)' }}
        >
          {isCompleted ? 'Review Lesson' : 'Start Lesson'}
        </Link>
      </div>
    </div>
  )
}

