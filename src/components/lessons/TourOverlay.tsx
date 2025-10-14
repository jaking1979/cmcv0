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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden">
        {/* Avatar Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-blue-100">
          <div className="flex items-start gap-4">
            <AvatarTalkingHead speaking={step === 0} size={64} className="shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-blue-200">
                <p className="text-sm text-gray-900 leading-relaxed">
                  {currentStep.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {currentStep.title}
            </h2>
            <div className="flex items-center gap-2">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    idx <= step ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            {step === 0 && (
              <button
                onClick={handleSkip}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Skip tour
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 font-medium transition-colors"
            >
              {step < steps.length - 1 ? 'Next' : 'Got it'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

