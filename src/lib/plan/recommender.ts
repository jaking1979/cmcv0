import type { Lesson } from '../lessons/types'
import { getMockUserProfile } from '../state/userProfile'

export interface RecommendedPlan {
  ordered: Lesson[]
  rationale: string
}

export function generateRecommendedPlan(lessons: Lesson[]): RecommendedPlan {
  const profile = getMockUserProfile()
  const deficitSkills = Object.entries(profile.skills)
    .filter(([_, score]) => score < 0.5)
    .map(([skill]) => skill)

  // Score each lesson based on how well it addresses user deficits
  const scored = lessons.map(lesson => {
    // Handle lessons without skills property
    const deficits = lesson.skills?.deficits || []
    const strengths = lesson.skills?.strengths || []
    
    const deficitCoverage = deficits.filter(d => 
      deficitSkills.includes(d)
    ).length
    const strengthDepth = strengths.length
    const score = deficitCoverage * 10 + strengthDepth + (lesson.order_hint || 0) / 100
    return { lesson, score }
  })

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)
  const ordered = scored.map(s => s.lesson)

  // Generate rationale
  const topDeficits = deficitSkills.slice(0, 3)
  const rationale = topDeficits.length > 0
    ? `Based on your profile (mock data for now), you could use support with ${topDeficits.join(', ')}. I've ordered these lessons to focus on those areas first, then build on your strengths. In the future, this will be personalized based on your actual onboarding assessment.`
    : `I've organized these lessons to build foundational skills first, then advance to more complex topics. Note: This lesson plan is based on demo data. In the future, it will be personalized from your onboarding assessment.`

  return { ordered, rationale }
}

