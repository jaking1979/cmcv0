'use client'

import { useState } from 'react'
import AvatarTalkingHead from '../AvatarTalkingHead'

interface TourOverlayProps {
  variant: 'learn' | 'lesson'
  onClose: () => void
}

export default function TourOverlay({ variant, onClose }: TourOverlayProps) {
  const [step, setStep] = useState(0)

  const learnSteps = [
    {
      title: "Hi, I'm Josh, your AI sober coach.",
      description: "Welcome to the Learn section. I'll help you build skills and knowledge to support your recovery journey."
    },
    {
      title: "Choose your learning path",
      description: "You can follow a personalized lesson plan tailored to your needs, or browse all available lessons to pick what interests you most."
    },
    {
      title: "Track your progress",
      description: "Lessons you complete will be marked with a checkmark. You can revisit any lesson anytime to refresh your skills."
    }
  ]

  const lessonSteps = [
    {
      title: "Hi, I'm Josh",
      description: "I'll guide you through this lesson. Let's walk through how it works."
    },
    {
      title: "I'll talk from up here",
      description: "At the top, you'll see my avatar and what I'm saying. Use the Prev/Next buttons to review what I've said or move forward."
    },
    {
      title: "Content and transcript below",
      description: "The lesson content appears in the middle. At the bottom, you can view our conversation transcript. I'll sometimes ask for your input—otherwise I'll just guide you through the material."
    }
  ]

  const steps = variant === 'learn' ? learnSteps : lessonSteps
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
              {step < steps.length - 1 ? 'Next' : 'Got it'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

