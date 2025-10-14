// Lesson system types

export interface CoachStep {
  slide: number
  text: string
  requires_input?: boolean
}

export interface Slide {
  title: string
  body: string
}

export interface Lesson {
  slug: string
  title: string
  description: string
  skills?: {
    deficits: string[]
    strengths: string[]
  }
  tags: string[]
  outcomes: string[]
  chat_mode: 'interactive' | 'info-only'
  redirect_topic: string
  order_hint: number
  coach_script: CoachStep[]
  lesson_slides: Slide[]
  validation?: any[]
}

export interface LessonState {
  scriptIndex: number
  slideIndex: number
  transcript: { role: 'coach' | 'user'; text: string; id: string }[]
  completed: boolean
  redirectCount: number
}

export interface TourFlags {
  first_visit_learn_seen: boolean
  first_visit_lesson_seen: Record<string, boolean>
}

