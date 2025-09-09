'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import TopNav from '@/components/TopNav'
import GlobalInstructionsModal from '@/components/GlobalInstructionsModal'

const lessons = {
  'relapse-justifications': {
    title: 'Relapse Justifications',
    content: (
      <>
        <p className="mb-4">
          Making the decision to stop using alcohol or other drugs is a huge step. But then, often out of nowhere, your brain starts making excuses. “I’ve been doing well, so I deserve this.” “It’s just one time.” “This doesn’t count because it’s a special occasion.” These are what we call relapse justifications — they are sneaky thoughts that make it easier to start using again.
        </p>
        <p className="mb-4">
          It doesn’t mean you’ve failed — these thoughts are normal. Your brain is trying to protect you from discomfort. The trick is learning to recognize these justifications for what they are: short-term relief strategies that don’t align with your long-term values.
        </p>
        <p>
          Once you identify your personal justifications, you can start creating space between the thought and the action. That space is where change happens.
        </p>
      </>
    ),
    practice: `What are some ways that you have justified use in the past?` ,
    reflect: `Now that you see these, how do you think you’ll handle it differently the next time your brain offers you a relapse justification?`,
  },
  'identifying-your-triggers': {
    title: 'Identifying Your Triggers',
    content: (
      <>
        <p className="mb-4">
          Even with a strong commitment to change, you’ll likely face cravings and urges. These are often triggered by specific situations, thoughts, or feelings. Identifying your personal triggers helps you build awareness so you’re not caught off guard.
        </p>
        <p className="mb-4">
          Triggers fall into two main categories:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li><strong>External triggers:</strong> places, people, situations, times of day</li>
          <li><strong>Internal triggers:</strong> emotions, thoughts, memories, physical sensations</li>
        </ul>
        <p className="mb-4">
          Awareness is key. Once you’ve identified your top triggers, you can make a plan to avoid or cope with them — before you’re in a high-risk situation.
        </p>
      </>
    ),
    practice: `Check off the triggers that apply to you from the internal and external lists.`,
    reflect: `Some triggers are avoidable and others are not. What’s your plan to avoid the avoidable ones?`,
  },
  'finding-your-pace-of-change': {
    title: 'Finding Your Pace of Change',
    content: (
      <>
        <p className="mb-4">
          People who decide to make a change in their lives often feel like they "should" have a certain attitude about it. They think they should be 100% positive, have no second thoughts, and be ready to change everything all at once.
        </p>
        <p className="mb-4">
          The truth is, it's completely normal to feel mixed emotions, or ambivalence, about changing old behaviors. The real issues that matter aren't about what you "should" be feeling. They're about what changes make sense for you and what changes you can truly get behind today.
        </p>
        <p className="mb-4">
          It’s important to remember that your journey is your own. Some people stop using and never look back, while others take a slower path with a few slip-ups along the way. Don’t compare your pace to anyone else’s; what's most important is finding a way to change that you can stick with.
        </p>
        <p>
          You may recognize yourself in one of these stages of change: Precontemplation, Contemplation, Preparation, Action, Maintenance. Knowing where you are helps you take the next step without shame or pressure.
        </p>
      </>
    ),
    practice: 'Which stage of change do you think you’re in, and what makes you think that?',
    reflect: 'Can you remember a time when you felt pressure to change faster than you were ready? How did that affect you?',
  },
  'your-brain-and-substance-use': {
    title: 'Your Brain and Substance Use',
    content: (
      <>
        <p className="mb-4">
          Your brain has a reward system that uses a chemical called dopamine to signal pleasure and satisfaction. This system is what helps you feel good about everyday things, like eating a tasty meal or getting a compliment.
        </p>
        <p className="mb-4">
          However, addictive substances and compulsive behaviors hijack this system. They cause a massive, unnatural flood of dopamine, which the brain can't sustain. Over time, your brain adapts by reducing its natural dopamine production and even decreasing the number of receptors.
        </p>
        <p className="mb-4">
          As your brain heals, it may take time to find joy in normal life again. This is part of recovery — not a sign you’re doing something wrong. It’s a temporary phase, not your new normal.
        </p>
        <p>
          Cravings aren’t just emotional — they are physical, neurological signals from your brain’s reward system. Knowing this can help you treat them with more compassion and less judgment.
        </p>
      </>
    ),
    practice: 'Journal freely about how this lesson changes how you think about cravings or your recovery.',
    reflect: 'How might your recovery feel different if you remember that your brain is healing, not broken?',
  },
  'avoiding-relapse-drift': {
    title: 'Avoiding Relapse Drift',
    content: (
      <>
        <p className="mb-4">
          Relapse rarely happens out of the blue. It's more like a ship slowly drifting away from its mooring. You gradually stop doing the new, healthy behaviors that were keeping you grounded — and the slide begins.
        </p>
        <p className="mb-4">
          To prevent this, identify the specific actions that support your change. Think of them as ropes that keep your recovery anchored. The more you define and repeat those actions, the more likely you are to stay connected to your goals.
        </p>
        <p>
          Recovery doesn’t have to be dramatic. Most success comes from repeating small actions with care and consistency.
        </p>
      </>
    ),
    practice: 'What are 2 or 3 daily or weekly “mooring line” behaviors that keep you anchored to your recovery?',
    reflect: 'How do you feel when you’re doing those consistently — and what happens when you stop?',
  },
  'stop-and-consider': {
    title: 'STOP - and Consider …',
    content: (
      <>
        <p className="mb-4">
          Making a big change often creates a conflict within you, with one part wanting to change and another wanting things to stay the same. This feeling of ambivalence is normal.
        </p>
        <p className="mb-4">
          A crucial part of moving forward is learning to change your decision-making process. When the thought of using turns into a plan, it's vital to STOP and CONSIDER.
        </p>
        <p className="mb-4">
          This pause gives you a buffer between a craving and an action. It prevents you from acting on impulse, which can lead to feelings of being "out of control" and disappointment in yourself. While giving in might offer temporary relief, the long-term effects can detach you from your goals.
        </p>
        <p>
          By taking a moment to consider the reasons, costs, and benefits of your actions, you stay in control. Even if you choose to use after this consideration, you'll learn something valuable about your decision-making process.
        </p>
      </>
    ),
    practice: 'Fill out a cost-benefit analysis of using vs. not using the next time a craving hits. What are you not considering?',
    reflect: 'How do you think your decision-making might change if you were to stop and consider before you acted on your impulses?',
  },
  'your-personal-emergency-plan': {
    title: 'Your Personal Emergency Plan',
    content: (
      <>
        <p className="mb-4">
          While it's crucial to identify triggers, there will be moments when the pull to use is especially strong. It's important to prepare for these "crossroads" ahead of time by creating a personal emergency plan.
        </p>
        <p className="mb-4">
          This plan gives you a clear strategy for handling high-risk situations and helps you get back on track if you slip up. Your plan could include: leaving the situation, delaying the decision to use for 15 minutes, calling a support person, or recalling your last experience with use — from start to finish.
        </p>
        <p>
          Thinking through how to cope with these moments in advance will make you more prepared to navigate them successfully.
        </p>
      </>
    ),
    practice: 'Write down your emergency plan: What are 3 things you can do instead of using when urges hit hard?',
    reflect: 'What situation do you feel least prepared for — and how could your plan help in that moment?',
  },
  'behavioral-strategies': {
    title: 'Behavioral Strategies to Support Change',
    content: (
      <>
        <p className="mb-4">
          Thinking differently can help you change — but sometimes it’s the actions you take that make the biggest difference.
        </p>
        <p className="mb-4">
          Behavioral strategies are about setting up your environment and routines in a way that supports your goals. These include:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Removing or limiting access to substances</li>
          <li>Making a weekly schedule and planning downtime</li>
          <li>Replacing old habits with new, value-driven activities</li>
          <li>Practicing healthy sleep, eating, and exercise routines</li>
        </ul>
        <p>
          You don’t have to do all of these at once. Small changes, practiced consistently, create the structure for long-term success.
        </p>
      </>
    ),
    practice: 'Pick one area (sleep, schedule, environment) and list one small change you could make to support your goals.',
    reflect: 'Which part of your daily routine makes change harder — and what could make that part easier?',
  },
} as const

const COMPLETED_KEY = 'cmc_completed_lessons'
function getCompleted(): string[] {
  try { return JSON.parse(localStorage.getItem(COMPLETED_KEY) || '[]') } catch { return [] }
}
function setCompleted(list: string[]) {
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(list))
}

export default function LessonPage() {
  const { slug } = useParams()
  const lesson = lessons[slug as keyof typeof lessons]

  const [isCompleted, setIsCompleted] = useState(false)
  const [showInstr, setShowInstr] = useState(false)

  useEffect(() => {
    const list = getCompleted()
    setIsCompleted(list.includes(String(slug)))
  }, [slug])

  const toggleComplete = () => {
    const list = getCompleted()
    const s = String(slug)
    if (list.includes(s)) {
      const next = list.filter(x => x !== s)
      setCompleted(next)
      setIsCompleted(false)
    } else {
      const next = Array.from(new Set([...list, s]))
      setCompleted(next)
      setIsCompleted(true)
    }
  }

  if (!lesson) {
    return (
      <main className="min-h-screen p-6">
        <h1 className="text-xl font-semibold text-red-600">Lesson not found.</h1>
      </main>
    )
  }

  return (
    <>
      <TopNav title="📚 Learn Something" onShowInstructions={() => setShowInstr(true)} />

      <main className="min-h-screen bg-white px-4 sm:px-6 pb-24 pt-4 sm:pt-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4 text-gray-800">{lesson.title}</h1>
        <section className="mb-6 text-gray-700">{lesson.content}</section>

        <section className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="font-medium text-blue-800 mb-2">🧠 Practice:</p>
          <p className="text-blue-900">{lesson.practice}</p>
        </section>

        <section className="bg-gray-100 p-4 rounded-lg">
          <p className="font-medium text-gray-800 mb-2">💬 Reflection:</p>
          <p className="text-gray-700">{lesson.reflect}</p>
        </section>

        <div className="fixed inset-x-0 bottom-0 bg-white/95 backdrop-blur border-t p-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <span className="text-sm text-gray-600">
              {isCompleted ? 'Marked complete. Nice work! ✅' : 'Mark this lesson complete to track progress.'}
            </span>
            <button
              onClick={toggleComplete}
              className={`px-4 py-2 rounded-lg font-semibold shadow transition ${isCompleted ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {isCompleted ? 'Completed ✓' : 'Mark Complete'}
            </button>
          </div>
        </div>
      </main>

      <GlobalInstructionsModal
        open={showInstr}
        onClose={() => setShowInstr(false)}
        title="How this page works"
      >
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            This page shows a single lesson. Read the content, then use the button at the bottom to mark it completed. Your progress shows up on the Learn catalog.
          </p>
          <ul className="list-disc pl-5">
            <li>The header (with the ☰ menu) is consistent across pages.</li>
            <li>Your completion is saved to your browser (demo only).</li>
            <li>You can reopen these instructions anytime from the ☰ menu.</li>
          </ul>
        </div>
      </GlobalInstructionsModal>
    </>
  )
}