'use client'

/**
 * ChoiceHub
 *
 * Rendered during FIRST_RUN_CHOICE stage.
 *
 * Shows a 3-bubble sequential app introduction (state-driven, ~900ms between
 * bubbles) followed by the three inline action cards once all bubbles have
 * appeared. This gives users a grounded sense of the app before they choose
 * their first path.
 *
 * 1. Greeting + app purpose + team mention
 * 2. What onboarding is and why it helps
 * 3. "What would you like to do?" + choice cards
 */

import * as React from 'react'

const KATO_ACCENT = 'linear-gradient(135deg, #3FA89C, #2C7A72)'

// ── Timing ────────────────────────────────────────────────────────────────────
// Delay before the first bubble appears (small pause after name is submitted)
const INITIAL_DELAY_MS = 400
// Gap between each subsequent bubble
const BUBBLE_GAP_MS = 900
// Extra pause after the last bubble before choice cards appear
const CHOICES_DELAY_MS = 600

// ── Copy ──────────────────────────────────────────────────────────────────────
function getBubbles(preferredName: string | null): string[] {
  const greeting = preferredName ? `Nice to meet you, ${preferredName}.` : 'Nice to meet you.'
  return [
    `${greeting} As I mentioned, I'm Kato — your primary sober coach. I want to briefly introduce what we're building together here. I'm here to help you make and maintain changes to your substance use. Those changes are yours to define — I'm here to help. And I'm not working alone. When you work with me, you also work with a team of coaches who'll be bringing things like mindfulness, self-compassion, and skills building to our conversations. You can meet them in a moment.`,
    `To start, we recommend doing an onboarding — about a 15-minute conversation with me so I can get to know you better. It helps all of us tailor our coaching to you specifically: your goals, your strengths, and where things feel harder.`,
    `You don't have to do it now — I can still be useful without it. But the more I know going in, the more I can tailor things from the start. What would you like to do?`,
  ]
}

// ── Choice cards ──────────────────────────────────────────────────────────────
interface Choice {
  id: 'onboarding' | 'talk-now' | 'team-intro'
  emoji: string
  title: string
  description: string
}

const CHOICES: Choice[] = [
  {
    id: 'onboarding',
    emoji: '📋',
    title: 'Start onboarding',
    description: 'Help Kato get to know you so coaching can be more tailored right away.',
  },
  {
    id: 'talk-now',
    emoji: '💬',
    title: 'Start talking now',
    description: 'Jump right in. Kato can give useful support even without a full background.',
  },
  {
    id: 'team-intro',
    emoji: '🎼',
    title: 'Meet your coaching team',
    description: "See who's on your team and what each coach brings to the table.",
  },
]

// ── Bubble component ──────────────────────────────────────────────────────────
function KatoBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-start items-end gap-2 slide-up">
      <div
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mb-0.5"
        style={{ background: KATO_ACCENT }}
      >
        K
      </div>
      <div
        className="max-w-[82%] px-4 py-3 text-[15px] leading-relaxed text-wrap-anywhere"
        style={{
          background: '#FFFFFF',
          borderRadius: '20px 20px 20px 4px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          color: 'var(--text-primary)',
        }}
      >
        {text}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface ChoiceHubProps {
  preferredName: string | null
  onChoose: (choice: 'onboarding' | 'talk-now' | 'team-intro') => void
}

export function ChoiceHub({ preferredName, onChoose }: ChoiceHubProps) {
  // 0 = nothing shown yet, 1 = bubble 1 visible, 2 = bubble 2 visible,
  // 3 = all bubbles visible, 4 = choice cards visible
  const [visibleCount, setVisibleCount] = React.useState(0)
  const bubbles = getBubbles(preferredName)

  React.useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    timers.push(setTimeout(() => setVisibleCount(1), INITIAL_DELAY_MS))
    timers.push(setTimeout(() => setVisibleCount(2), INITIAL_DELAY_MS + BUBBLE_GAP_MS))
    timers.push(setTimeout(() => setVisibleCount(3), INITIAL_DELAY_MS + BUBBLE_GAP_MS * 2))
    timers.push(setTimeout(() => setVisibleCount(4), INITIAL_DELAY_MS + BUBBLE_GAP_MS * 2 + CHOICES_DELAY_MS))

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="flex flex-col gap-3 px-4 pb-4 pt-4 max-w-lg mx-auto w-full">
      {/* Sequential Kato intro bubbles */}
      {bubbles.map((text, i) =>
        visibleCount > i ? <KatoBubble key={i} text={text} /> : null
      )}

      {/* Choice cards — appear after all 3 bubbles are shown */}
      {visibleCount >= 4 && (
        <div className="pl-10 flex flex-col gap-2">
          {CHOICES.map((choice, idx) => (
            <button
              key={choice.id}
              onClick={() => onChoose(choice.id)}
              className="w-full text-left px-4 py-3.5 rounded-2xl transition-all slide-up"
              style={{
                background: 'white',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 2px 12px rgba(0,0,0,0.04)',
                animationDelay: `${idx * 80}ms`,
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5 shrink-0">{choice.emoji}</span>
                <div>
                  <p
                    className="text-sm font-semibold mb-0.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {choice.title}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {choice.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
