// Mock user profile for lesson recommendation
// In the future, this will pull from actual onboarding assessment data

export interface UserProfile {
  skills: Record<string, number>
}

export function getMockUserProfile(): UserProfile {
  return {
    skills: {
      'Impulse Control': 0.3,
      'Emotion Regulation': 0.35,
      'Craving Response': 0.4,
      'Interpersonal Effectiveness': 0.45,
      'Values Clarification': 0.5,
      'Relapse Prevention': 0.4,
      'Self-Compassion': 0.6,
      'Mindfulness': 0.55,
      'Distress Tolerance': 0.38,
      'Sleep & Routine': 0.42
    }
  }
}

