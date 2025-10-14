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
    <div className="border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 bg-white">
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2 flex-wrap">
          <Link
            href={`/learn/${lesson.slug}`}
            className="text-lg sm:text-xl font-semibold text-blue-700 hover:text-blue-800 hover:underline leading-tight flex-1 min-w-0 text-wrap-anywhere"
          >
            {cleanTitle}
          </Link>
          <div className="flex items-center gap-2 flex-shrink-0">
            {lesson.tags.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="text-xs font-medium bg-blue-100 text-blue-800 rounded-full px-2 py-1"
              >
                {tag}
              </span>
            ))}
            {isCompleted && (
              <span className="text-xs font-medium bg-green-100 text-green-800 rounded-full px-2 py-1">
                ✓ Completed
              </span>
            )}
          </div>
        </div>

        {lesson.description && (
          <p className="text-gray-700 text-sm sm:text-base leading-relaxed text-wrap-anywhere line-clamp-2">
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
          className="mt-2 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          {isCompleted ? 'Review Lesson' : 'Start Lesson'}
        </Link>
      </div>
    </div>
  )
}

