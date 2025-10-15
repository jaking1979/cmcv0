'use client'

import { useState } from 'react'
import AvatarTalkingHead from '../AvatarTalkingHead'

interface OnboardingTourOverlayProps {
  onClose: () => void
}

export default function OnboardingTourOverlay({ onClose }: OnboardingTourOverlayProps) {
  const [step, setStep] = useState(0)

  const steps = [
    {
      title: "Hi, I'm Josh, your AI sober coach.",
      description: "Welcome to the onboarding process. I'm here to get to know you better so I can provide personalized support for your recovery journey."
    },
    {
      title: "What we'll cover",
      description: "I'll ask you about your goals, challenges, strengths, and what support you need. This helps me understand where you are in your change process and what skills might be most helpful."
    },
    {
      title: "Your privacy matters",
      description: "This is a safe space. Take your time, and share what feels comfortable. You can see your progress with the assessment meter at the top, and we'll create a personalized plan based on our conversation."
    }
  ]

  const currentStep = steps[step]

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      onClose()
    }
  }

  const handleSkip = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 fade-in" style={{ background: 'linear-gradient(135deg, rgba(94, 203, 188, 0.1) 0%, rgba(155, 143, 217, 0.1) 100%)' }}>
      <div className="w-full max-w-lg glass-strong shadow-medium overflow-hidden scale-in" style={{ borderRadius: 'var(--radius-2xl)' }}>
        {/* Avatar Header */}
        <div className="p-6 border-b border-gray-200/30" style={{ background: 'linear-gradient(135deg, var(--cmc-teal-200) 0%, var(--lavender-300) 100%)' }}>
          <div className="flex items-start gap-4">
            <AvatarTalkingHead speaking={step === 0} size={64} className="shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="glass-strong px-4 py-3 shadow-soft border border-gray-200/30" style={{ borderRadius: 'var(--radius-lg)' }}>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {currentStep.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              {currentStep.title}
            </h2>
            <div className="flex items-center gap-2">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 flex-1 transition-all duration-300`}
                  style={{ 
                    borderRadius: 'var(--radius-sm)',
                    background: idx <= step ? 'linear-gradient(90deg, var(--cmc-teal-500) 0%, var(--cmc-teal-400) 100%)' : 'var(--bg-secondary)',
                    boxShadow: idx <= step ? 'var(--glow-teal)' : 'none'
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            {step === 0 && (
              <button
                onClick={handleSkip}
                className="flex-1 glass-light border border-gray-200/50 px-4 py-2 hover:glass-medium hover:glow-teal transition-all duration-300"
                style={{ 
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--text-primary)'
                }}
              >
                Skip tour
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 bg-gradient-to-br from-[#5ECBBC] to-[#3FA89C] px-4 py-2 text-white font-semibold hover:glow-teal-strong hover:scale-105 active:scale-95 transition-all duration-300 shadow-soft"
              style={{ borderRadius: 'var(--radius-lg)' }}
            >
              {step < steps.length - 1 ? 'Next' : "Let's begin!"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

