'use client'

import { useState } from 'react'

interface AssessmentConfidence {
  selfCompassion: number
  urica: number
  kessler10: number
  who5: number
  dbtWccl: number
  copingSelfEfficacy: number
  assist: number
  asi: number
}

interface AssessmentProgressMeterProps {
  confidence: AssessmentConfidence
  className?: string
  isSticky?: boolean
}

const assessmentAreas = [
  {
    key: 'selfCompassion' as keyof AssessmentConfidence,
    label: 'Self-Kindness',
    tooltip: 'How you treat yourself when things get tough - whether you\'re kind to yourself or harsh and critical.'
  },
  {
    key: 'urica' as keyof AssessmentConfidence,
    label: 'Readiness for Change',
    tooltip: 'Where you are in thinking about making changes - from just starting to think about it to actively working on it.'
  },
  {
    key: 'kessler10' as keyof AssessmentConfidence,
    label: 'Stress & Worry',
    tooltip: 'How much stress, anxiety, or emotional distress you\'ve been experiencing lately.'
  },
  {
    key: 'who5' as keyof AssessmentConfidence,
    label: 'Overall Wellbeing',
    tooltip: 'Your general mood, energy levels, and how good you\'ve been feeling about life recently.'
  },
  {
    key: 'dbtWccl' as keyof AssessmentConfidence,
    label: 'Coping Strategies',
    tooltip: 'The different ways you handle stress and difficult situations - what works and what doesn\'t.'
  },
  {
    key: 'copingSelfEfficacy' as keyof AssessmentConfidence,
    label: 'Confidence in Handling Challenges',
    tooltip: 'How confident you feel about managing difficult situations without turning to substances.'
  },
  {
    key: 'assist' as keyof AssessmentConfidence,
    label: 'Substance Use Patterns',
    tooltip: 'Your current relationship with alcohol or other substances - how often, how much, and what role they play.'
  },
  {
    key: 'asi' as keyof AssessmentConfidence,
    label: 'Life Areas',
    tooltip: 'How your situation affects different parts of your life like relationships, work, health, and daily activities.'
  }
]

export default function AssessmentProgressMeter({ confidence, className = '', isSticky = false }: AssessmentProgressMeterProps) {
  const [hoveredArea, setHoveredArea] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate overall progress
  const totalConfidence = Object.values(confidence).reduce((sum, conf) => sum + conf, 0)
  const averageConfidence = totalConfidence / Object.keys(confidence).length
  const isComplete = Object.values(confidence).every(c => c > 0.7)
  const displayProgress = isComplete ? 100 : Math.min(95, averageConfidence * 100)

  // Get progress message
  const getProgressMessage = () => {
    if (displayProgress === 100) return "Assessment complete!"
    if (displayProgress >= 75) return "Completing your profile..."
    if (displayProgress >= 50) return "Mapping your strengths and challenges..."
    if (displayProgress >= 25) return "Understanding your patterns..."
    return "Beginning your assessment..."
  }

  // Get color for confidence level
  const getConfidenceColor = (conf: number) => {
    if (conf > 0.7) return 'bg-green-400'
    if (conf > 0.3) return 'bg-yellow-400'
    return 'bg-gray-200'
  }

  return (
    <div className={`
      bg-blue-50 border border-blue-200 rounded-lg
      ${isSticky ? 'sticky top-16 z-20 bg-blue-50/95 backdrop-blur-sm' : ''}
      ${className}
    `}>
      {/* Header - Always visible */}
      <div 
        className="p-4 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <h3 className="text-sm font-semibold text-blue-900">Assessment Progress</h3>
              <button className="text-blue-700 hover:text-blue-900 transition-colors">
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-blue-700">{getProgressMessage()}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-blue-900">{Math.round(displayProgress)}%</div>
            <div className="text-xs text-blue-600">Complete</div>
          </div>
        </div>

        {/* Overall progress bar - Always visible */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Expandable content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-blue-200/50">
          {/* Individual assessment areas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            {assessmentAreas.map((area) => {
              const conf = confidence[area.key] || 0
              const isHovered = hoveredArea === area.key
              
              return (
                <div
                  key={area.key}
                  className="relative"
                  onMouseEnter={() => setHoveredArea(area.key)}
                  onMouseLeave={() => setHoveredArea(null)}
                >
                  <div className="flex flex-col items-center p-2 rounded-md hover:bg-white/50 transition-colors cursor-help">
                    <div className={`w-4 h-4 rounded-full ${getConfidenceColor(conf)} mb-1 transition-colors`} />
                    <span className="text-xs text-center text-gray-700 leading-tight">
                      {area.label}
                    </span>
                  </div>

                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-30">
                      <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 max-w-48 text-center">
                        <div className="font-medium mb-1">{area.label}</div>
                        <div className="text-gray-300">{area.tooltip}</div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                          <div className="border-4 border-transparent border-t-gray-900" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-200" />
              <span>Not yet explored</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <span>Partially understood</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span>Well understood</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
