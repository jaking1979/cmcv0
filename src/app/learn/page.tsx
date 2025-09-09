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
    <>
      <TopNav title="📚 Learn Something" onShowInstructions={() => setShowInstructions(true)} />
      <main className="min-h-screen p-6 max-w-3xl mx-auto bg-white">
        <p className="text-sm text-gray-600 mb-6">{completed.length} / {Object.keys(lessons).length} lessons completed</p>
        <input
          type="text"
          placeholder="Search lessons..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full mb-4 p-2 border border-gray-300 rounded-md"
        />
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="mb-6 p-2 border border-gray-300 rounded-md"
          aria-label="Filter lessons by tag"
        >
          {tags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
        <ul className="space-y-6">
          {filteredLessons.map(([slug, lesson]) => {
            const isDone = completed.includes(slug as string)
            return (
              <li key={slug} className="border border-gray-300 p-6 rounded-lg shadow-sm hover:shadow-md transition flex flex-col gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <Link href={`/learn/${slug}`} className="text-xl font-semibold text-blue-700 hover:underline">
                    {lesson.title}
                  </Link>
                  <span className="text-xs font-medium bg-blue-100 text-blue-800 rounded-full px-3 py-1">
                    {lesson.tag}
                  </span>
                  {isDone && (
                    <span className="text-xs font-medium bg-green-100 text-green-800 rounded-full px-3 py-1">✓ Completed</span>
                  )}
                </div>
                <p className="text-gray-700">{lesson.teaser}</p>
              </li>
            )
          })}
        </ul>
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