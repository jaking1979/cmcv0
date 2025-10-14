import type { LessonState, TourFlags } from '../lessons/types'

const LESSON_STATE_PREFIX = 'cmc_lessonState:'
const COMPLETED_LESSONS_KEY = 'cmc_completed_lessons'
const TOUR_LEARN_KEY = 'cmc_first_visit_learn_seen'
const TOUR_LESSON_PREFIX = 'cmc_first_visit_lesson_seen:'

export function getLessonState(slug: string): LessonState | null {
  if (typeof window === 'undefined') return null
  
  try {
    const raw = localStorage.getItem(`${LESSON_STATE_PREFIX}${slug}`)
    if (!raw) return null
    return JSON.parse(raw) as LessonState
  } catch {
    return null
  }
}

export function saveLessonState(slug: string, state: LessonState): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(`${LESSON_STATE_PREFIX}${slug}`, JSON.stringify(state))
  } catch (error) {
    console.error('Error saving lesson state:', error)
  }
}

export function getCompletedLessons(): string[] {
  if (typeof window === 'undefined') return []
  
  try {
    const raw = localStorage.getItem(COMPLETED_LESSONS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function markLessonComplete(slug: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const completed = getCompletedLessons()
    if (!completed.includes(slug)) {
      localStorage.setItem(COMPLETED_LESSONS_KEY, JSON.stringify([...completed, slug]))
    }
  } catch (error) {
    console.error('Error marking lesson complete:', error)
  }
}

export function getTourFlags(): TourFlags {
  if (typeof window === 'undefined') {
    return {
      first_visit_learn_seen: false,
      first_visit_lesson_seen: {}
    }
  }
  
  const learnSeen = localStorage.getItem(TOUR_LEARN_KEY) === 'true'
  const lessonSeen: Record<string, boolean> = {}
  
  // This is a simplified version - in practice we'd need to scan all keys
  // but for now we'll populate on demand
  
  return {
    first_visit_learn_seen: learnSeen,
    first_visit_lesson_seen: lessonSeen
  }
}

export function setTourFlag(key: 'learn' | string, value: boolean): void {
  if (typeof window === 'undefined') return
  
  try {
    if (key === 'learn') {
      localStorage.setItem(TOUR_LEARN_KEY, value.toString())
    } else {
      // It's a lesson slug
      localStorage.setItem(`${TOUR_LESSON_PREFIX}${key}`, value.toString())
    }
  } catch (error) {
    console.error('Error setting tour flag:', error)
  }
}

export function getTourFlagForLesson(slug: string): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(`${TOUR_LESSON_PREFIX}${slug}`) === 'true'
}

