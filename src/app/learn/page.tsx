'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import TopNav from '@/components/TopNav'
import GlobalInstructionsModal from '@/components/GlobalInstructionsModal'

import InstructionsModal from '@/components/GlobalInstructionsModal'

const lessons = {
  'relapse-justifications': {
    title: 'Relapse Justifications',
    tag: 'ITC Core',
    teaser: `When you notice your brain is coming up with reasons it’s OK to use, it doesn’t mean that’s really what you want to do! It’s probably a Relapse Justification, and understanding that can help you avoid it.`
  },
  'identifying-your-triggers': {
    title: 'Identifying Your Triggers',
    tag: 'Triggers',
    teaser: `If you want to change a behavior, it’s helpful to understand what is driving that behavior.`
  },
  'finding-your-pace-of-change': {
    title: 'Finding Your Pace of Change',
    tag: 'Self-Compassion',
    teaser: `We all change at different rates. Understanding your own pace of change can help you figure out how to change effectively.`
  },
  'your-brain-and-substance-use': {
    title: 'Your Brain and Substance Use',
    tag: 'ACT Concepts',
    teaser: `Substance use isn’t just behavioral, a lot of it is how your brain reacts to substances.`
  },
  'avoiding-relapse-drift': {
    title: 'Avoiding Relapse Drift',
    tag: 'Coping Skills',
    teaser: `Relapse doesn’t usually happen “out of the blue,” it’s usually a slow drift back to old behaviors.`
  },
  'stop-and-consider': {
    title: 'STOP - and Consider …',
    tag: 'Values',
    teaser: `Stopping to consider your options provides you a bit of a buffer between your thoughts/feelings (wanting to use, having cravings) and your actions (taking a drink, calling the dealer).`
  },
  'your-personal-emergency-plan': {
    title: 'Your Personal Emergency Plan',
    tag: 'Coping Skills',
    teaser: `In life, if you never want to be unprepared, especially for an emergency.`
  },
  'behavioral-strategies': {
    title: 'Behavioral Strategies to Support Change',
    tag: 'ITC Core',
    teaser: `You’re trying to change. Let’s come up with plans for how to do it.`
  },
}

const tags = ["All", "ITC Core", "ACT Concepts", "Self-Compassion", "Values", "Coping Skills", "Triggers"];
const COMPLETED_KEY = 'cmc_completed_lessons'

export default function LearnIndexPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [completed, setCompleted] = useState<string[]>([])
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem(COMPLETED_KEY) || '[]')
      if (Array.isArray(list)) setCompleted(list)
    } catch {}
  }, [])

  const filteredLessons = Object.entries(lessons).filter(([_, lesson]) => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'All' || lesson.tag === selectedTag;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopNav title="📚 Learn Something" onShowInstructions={() => setShowInstructions(true)} />
      
      <main className="flex-1 flex flex-col px-3 sm:px-4 py-4 max-w-3xl mx-auto w-full min-h-0">
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-4">{completed.length} / {Object.keys(lessons).length} lessons completed</p>
          
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full p-3 border border-gray-300 rounded-lg shadow-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                min-h-[44px] text-base
              "
            />
            
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="
                w-full p-3 border border-gray-300 rounded-lg shadow-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                min-h-[44px] text-base bg-white
              "
              aria-label="Filter lessons by tag"
            >
              {tags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ul className="space-y-4 pb-4">
            {filteredLessons.map(([slug, lesson]) => {
              const isDone = completed.includes(slug as string)
              return (
                <li key={slug} className="
                  border border-gray-200 p-4 rounded-lg shadow-sm 
                  hover:shadow-md hover:border-gray-300 
                  transition-all duration-200
                  bg-white
                ">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-2 flex-wrap">
                      <Link 
                        href={`/learn/${slug}`} 
                        className="
                          text-lg sm:text-xl font-semibold text-blue-700 
                          hover:text-blue-800 hover:underline
                          leading-tight flex-1 min-w-0
                          text-wrap-anywhere
                        "
                      >
                        {lesson.title}
                      </Link>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-medium bg-blue-100 text-blue-800 rounded-full px-2 py-1">
                          {lesson.tag}
                        </span>
                        {isDone && (
                          <span className="text-xs font-medium bg-green-100 text-green-800 rounded-full px-2 py-1">
                            ✓ Completed
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm sm:text-base leading-relaxed text-wrap-anywhere">
                      {lesson.teaser}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </main>
      {showInstructions && (
        <GlobalInstructionsModal open={true}
          title="How to Use the Learn Page"
          onClose={() => setShowInstructions(false)}
        >
          <p>This is a demo of the Learn section of the app. You can:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Browse lessons by category or search.</li>
            <li>Click on a lesson to read it fully.</li>
            <li>Mark lessons as completed when you finish them.</li>
          </ul>
          <p className="mt-2 text-sm text-gray-600">
            Note: This is a prototype. Some features may not behave exactly as in the final app.
          </p>
        </GlobalInstructionsModal>
      )}
    </>
  )
}