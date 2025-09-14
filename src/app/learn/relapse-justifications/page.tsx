'use client';

import React, { useEffect, useMemo, useState } from 'react';
// ⬇️ Adjust these paths to match your project
import AvatarTalkingHead from '../../../components/AvatarTalkingHead';
import { MessageComposer } from '../../../components/chat/MessageComposer';
import TopNav from '../../../components/TopNav';

type PracticeKey = 'DELAY_15' | 'TEXT_SUPPORT' | 'GROUNDING' | 'PLAY_TAPE' | null;
type Role = 'coach' | 'user' | 'system';
type Msg = { id: string; role: Role; text: string; chips?: string[] };

const LESSON_SLIDES: { id: number; title: string; body: React.ReactNode }[] = [
  {
    id: 0,
    title: 'Relapse Justifications',
    body: (
      <>
        <p className="mt-2 text-sm text-gray-700">
          Relapse justification is a brain-driven process where your “rational brain” generates good-sounding reasons to
          use in response to urges from the “primitive brain.” Knowing this ahead of time helps you spot it fast and
          redirect. The key: keep these as fleeting thoughts—don’t dwell.
        </p>
      </>
    ),
  },
  {
    id: 1,
    title: 'Common Categories',
    body: (
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <ul className="rounded-md border bg-gray-50 p-3 text-sm leading-6">
          <li className="font-medium">“Accidents” &amp; Other People</li>
          <li>It was offered ● Old friend called ● Found a stash ● Guests brought it</li>
        </ul>
        <ul className="rounded-md border bg-gray-50 p-3 text-sm leading-6">
          <li className="font-medium">Catastrophic Events</li>
          <li>Family angry ● Injury ruined plans ● Lost my job</li>
        </ul>
        <ul className="rounded-md border bg-gray-50 p-3 text-sm leading-6">
          <li className="font-medium">For a Specific Purpose</li>
          <li>Control weight ● Need energy ● To meet people ● For sex</li>
        </ul>
        <ul className="rounded-md border bg-gray-50 p-3 text-sm leading-6">
          <li className="font-medium">Depression, Anger &amp; Boredom</li>
          <li>I’m depressed ● Things can’t get worse ● They think I used—might as well</li>
        </ul>
      </div>
    ),
  },
  {
    id: 2,
    title: 'Attention & Timing',
    body: (
      <div className="mt-2 space-y-3 rounded-md border p-3 text-sm text-gray-700">
        <p>
          These thoughts are normal. The skill is attention management: the more you dwell on justifications, the more compelling they feel.
        </p>
        <p>
          Spot → label → act within ~90 seconds. Ask supports for feedback and review the real consequences of use.
        </p>
      </div>
    ),
  },
];

// Scripted intro bubbles the coach will speak through before asking the first question.
const INTRO_SCRIPT: { text: string; slide: number; requiresInput?: boolean }[] = [
  {
    text:
      'This session is about a phenomenon almost everyone experiences. Your brain offers “good-sounding” reasons to go back. Learning to spot those quickly is the move.',
    slide: 0,
  },
  {
    text:
      'When you remove the chemical, receptors get agitated and create discomfort. Your rational brain tries to explain it away so returning to use “makes sense.”',
    slide: 0,
  },
  {
    text:
      'Take a look at the categories in the lesson below. Have you thought about this process before—how your brain argues for “just this once”?',
    slide: 1,
    requiresInput: true,
  },
];

const STORAGE_KEY = 'cmc_lesson_relapse_justifications_v01';
const COMPLETED_KEY = 'cmc_completed_lessons';
const LESSON_SLUG = 'relapse-justifications';


const CRISIS_TERMS = [
  'suicide',
  'kill myself',
  'overdose',
  'od',
  'self harm',
  'hurt myself',
  'harm myself',
];

function hasCrisisTerms(text: string) {
  const t = text.toLowerCase();
  return CRISIS_TERMS.some((w) => t.includes(w));
}

export default function Page() {
  // ---------- pinned lesson expand/collapse ----------
  // const [showMore, setShowMore] = useState(false);

  // ---------- conversation state ----------
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [crisisFlag, setCrisisFlag] = useState(false);
  const [practice, setPractice] = useState<PracticeKey>(null);
  const [completed, setCompleted] = useState(false);
  const [topSlide, setTopSlide] = useState<number>(0);

  // Index for intro script progress; -1 means not in scripted intro
  const [scriptIndex, setScriptIndex] = useState<number>(-1);

  // persisted answers
  const [answers, setAnswers] = useState<{
    q1_seen?: string; // Often | Sometimes | Not really | Not sure | free text
    q2_justifs?: string[]; // chips/free text split
    q3_context?: string; // free text/chip
    q4_interrupt?: PracticeKey;
    summary?: string;
  }>({});

  // ---------- persistence ----------
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setAnswers(parsed.answers ?? {});
        setPractice(parsed.practice ?? null);
        setCompleted(!!parsed.completed);
        setMessages(parsed.messages ?? []);
        if (!parsed.messages || parsed.messages.length === 0) {
          seedIntro();
        }
      } catch {
        seedIntro();
      }
    } else {
      seedIntro();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const payload = { answers, practice, completed, messages };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [answers, practice, completed, messages]);

  // ---------- helpers ----------
  function pushCoach(text: string, chips?: string[], slide?: number) {
    const msg: Msg = { id: crypto.randomUUID(), role: 'coach', text, chips };
    setMessages((m) => [...m, msg]);
    if (typeof slide === 'number') setTopSlide(slide);
    // drive avatar animation
    setIsSpeaking(true);
    // simulate speech done toggle (if you later add real TTS, wire onend -> setIsSpeaking(false))
    setTimeout(() => setIsSpeaking(false), Math.min(3000, Math.max(1200, text.length * 15)));
  }

  function pushUser(text: string) {
    const msg: Msg = { id: crypto.randomUUID(), role: 'user', text };
    setMessages((m) => [...m, msg]);
  }

  function seedIntro() {
    // start script at first bubble
    setScriptIndex(0);
    const first = INTRO_SCRIPT[0];
    pushCoach(first.text, undefined, first.slide);
  }

  function advanceScript() {
    // If we're not in script mode, ignore
    if (scriptIndex < 0) return;
    const next = scriptIndex + 1;
    if (next >= INTRO_SCRIPT.length) return;
    const item = INTRO_SCRIPT[next];
    setScriptIndex(next);
    pushCoach(item.text, undefined, item.slide);
  }

  // deterministic routing for Q1 user response → brief reflection
  function reflectQ1(userText: string) {
    const normalized =
      userText.toLowerCase().includes('often') ||
      userText.toLowerCase().includes('yes') ||
      userText.toLowerCase().includes('sometimes') ||
      userText.toLowerCase().includes('not really') ||
      userText.toLowerCase().includes('not sure');

    const text = normalized
      ? 'Totally normal. The key is attention management—keep these thoughts fleeting; don’t dwell on them.'
      : 'Makes sense. Whether it’s new or familiar, we’ll keep the thoughts brief and pivot quickly.';
    pushCoach(text);
    pushCoach('Which kinds of justifications show up for you? Scan the list below and type the ones that fit you.', undefined, 1);
  }

  function routeValidationBlock(inputs: string[]) {
    const t = inputs.join(' ').toLowerCase();

    if (t.includes('offered') || t.includes('friend') || t.includes('stash') || t.includes('guests')) {
      pushCoach(
        'In “accident/other people” moments, a decline script and small environmental changes help. In hindsight, what alternative reaction or pre-plan would have helped?',
        undefined,
        2
      );
      return;
    }
    if (t.includes('angry') || t.includes('injury') || t.includes('lost my job') || t.includes('lost')) {
      pushCoach(
        'Catastrophic events are understandable “rainy-day” justifications. How would using compound the problem? Name one protective step instead.',
        undefined,
        2
      );
      return;
    }
    if (
      t.includes('weight') ||
      t.includes('energy') ||
      t.includes('meet people') ||
      t.includes('sex') ||
      t.includes('purpose')
    ) {
      pushCoach(
        'Fast results are tempting. What non-substance way could meet that goal (energy, social ease, intimacy) without restarting the cycle?',
        undefined,
        2
      );
      return;
    }
    if (t.includes('depress') || t.includes('worse') || t.includes('might as well')) {
      pushCoach(
        'Totally human to want relief when feelings spike. Skill target: “don’t make it worse.” What is one emotion skill you can use instead?',
        undefined,
        2
      );
      return;
    }
    // general justifications group
    if (t.includes('deserve') || t.includes('just one') || t.includes('special')) {
      if (t.includes('deserve')) {
        pushCoach(
          'You’ve been putting in effort, so a “treat” thought makes sense. Let’s protect the progress you earned without handing the wheel back to the habit.',
          undefined,
          2
        );
      } else if (t.includes('just one')) {
        pushCoach('“Just one” sounds small, but your pattern matters more than the count. Tiny exceptions retrain the loop fast.', undefined, 2);
      } else {
        pushCoach('Celebrate without restarting the cycle—honor the occasion and your longer-term values with a safer plan.', undefined, 2);
      }
      return;
    }

    pushCoach('Makes sense that your brain offers a good-sounding reason. Naming it creates space to choose differently.', undefined, 2);
  }

  function offerInterrupt() {
    pushCoach(
      'Label the thought and buy ~90 seconds before acting. What will you do in those 90 seconds? (e.g., Delay 15 minutes; Text a support person; Grounding/breath; Play the tape forward)',
      undefined,
      2
    );
  }

  function setPracticeFromChoice(choice: string) {
    switch (choice.toLowerCase()) {
      case 'delay 15 minutes':
        setPractice('DELAY_15');
        break;
      case 'text a support person':
        setPractice('TEXT_SUPPORT');
        break;
      case 'grounding / breath':
        setPractice('GROUNDING');
        break;
      case 'play the tape forward':
        setPractice('PLAY_TAPE');
        break;
      default:
        setPractice(null);
    }
  }

  function buildSummary(a = answers, p = practice) {
    const justifs = (a.q2_justifs?.length ? a.q2_justifs : ['(not specified)']).join(', ');
    const ctxt = a.q3_context || '(no context)';
    const practiceLabel =
      p === 'DELAY_15'
        ? 'Delay 15'
        : p === 'TEXT_SUPPORT'
        ? 'Text a support person'
        : p === 'GROUNDING'
        ? 'Grounding / breath'
        : p === 'PLAY_TAPE'
        ? 'Play the tape forward'
        : '(no practice chosen)';
    return `You noticed ${justifs} in ${ctxt}. You chose ${practiceLabel}. Keep the thought fleeting; act within 90 seconds.`;
  }

  // ---------- message handler ----------
  function onSend(input: string) {
    const text = input?.trim();
    if (!text) return;

    // crisis scan
    if (hasCrisisTerms(text)) {
      setCrisisFlag(true);
    }

    pushUser(text);

    // Decide where we are in the flow by looking at last coach question
    const lastCoach = [...messages].reverse().find((m) => m.role === 'coach');
    const lcText = lastCoach?.text ?? '';

    // Q1 → reflection + Q2 intro
    if (lcText.toLowerCase().includes('just this once')) {
      setAnswers((p) => ({ ...p, q1_seen: text }));
      reflectQ1(text);
      return;
    }

    // Q2 selection (justifications list)
    if (lcText.includes('Which kinds of justifications show up for you?')) {
      const picks = parseUserChoices(text);
      setAnswers((p) => ({ ...p, q2_justifs: picks }));
      routeValidationBlock(picks);
      // then ask for context apply (Q3)
      pushCoach(
        'Pick one you actually faced recently. What was the situation, and what could you have done differently—or planned ahead?',
        undefined,
        2
      );
      return;
    }

    // Q3 → context captured, now offer interrupts
    if (lcText.includes('recently. What was the situation')) {
      setAnswers((p) => ({ ...p, q3_context: text }));
      offerInterrupt();
      return;
    }

    // Q4 → set practice + summary
    if (lcText.includes('What will you do in those 90 seconds')) {
      setPracticeFromChoice(text);
      const q4Key = choiceToPracticeKey(text);
      setAnswers((p) => ({ ...p, q4_interrupt: q4Key }));

      const summary = buildSummary({ ...answers, q4_interrupt: q4Key }, q4Key);
      setAnswers((p) => ({ ...p, summary }));
      pushCoach(`Summary: ${summary}`, undefined, 2);
      pushCoach('Want to mark this lesson complete? Type "complete" or keep practicing.');
      return;
    }

    // Completion step
    if (lcText.includes('mark this lesson complete')) {
      if (text.toLowerCase().includes('complete')) {
        setCompleted(true);
        try {
          const raw = localStorage.getItem(COMPLETED_KEY);
          const arr: string[] = raw ? JSON.parse(raw) : [];
          if (!arr.includes(LESSON_SLUG)) {
            localStorage.setItem(COMPLETED_KEY, JSON.stringify([...arr, LESSON_SLUG]));
          }
        } catch {
          localStorage.setItem(COMPLETED_KEY, JSON.stringify([LESSON_SLUG]));
        }
        pushCoach('Nice work. Logged as complete. You can revisit your summary anytime from this page.');
      } else {
        pushCoach('Cool. We can keep practicing—try another scenario or refine your interrupt.');
      }
      return;
    }

    // Fallback: if we’re mid-flow but unmatched, gently nudge
    pushCoach('Got it. Tell me more in your own words.');
  }

  function choiceToPracticeKey(choice: string): PracticeKey {
    const c = choice.toLowerCase();
    if (c.includes('delay')) return 'DELAY_15';
    if (c.includes('text')) return 'TEXT_SUPPORT';
    if (c.includes('ground')) return 'GROUNDING';
    if (c.includes('tape')) return 'PLAY_TAPE';
    return null;
  }

  function parseUserChoices(text: string) {
    // Split by comma or semicolon; trim
    const raw = text.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
    // If they typed one of the common phrases without commas, keep as one
    if (raw.length === 0) return [text.trim()];
    return raw;
  }

  // ---------- talking header state ----------
  const summaryText = answers.summary ?? '';
  const coachMessages = useMemo(() => messages.filter((m) => m.role === 'coach'), [messages]);
  const [visibleCoachIdx, setVisibleCoachIdx] = useState<number>(-1);
  const [autoFollow, setAutoFollow] = useState<boolean>(true);
  useEffect(() => {
    if (coachMessages.length === 0) { setVisibleCoachIdx(-1); return; }
    if (visibleCoachIdx === -1 || autoFollow) {
      setVisibleCoachIdx(coachMessages.length - 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachMessages.length]);
  const visibleCoach = visibleCoachIdx >= 0 ? coachMessages[visibleCoachIdx] : undefined;

  // Transcript toggle state and component
  const [showTranscript, setShowTranscript] = useState<boolean>(false);
  function TranscriptToggle() {
    return (
      <div>
        <button
          type="button"
          className="rounded border px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
          onClick={() => setShowTranscript((s) => !s)}
        >
          {showTranscript ? 'Hide transcript' : 'View transcript'}
        </button>
        {showTranscript && (
          <div className="mt-2 max-h-56 overflow-y-auto rounded-md border bg-gray-50 p-2">
            {messages.length === 0 ? (
              <div className="text-xs text-gray-500">No messages yet.</div>
            ) : (
              <ul className="space-y-2">
                {messages.map((m) => (
                  <li key={m.id} className={m.role === 'coach' ? 'flex items-start gap-2' : 'flex justify-end'}>
                    {m.role === 'coach' ? (
                      <>
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">C</span>
                        <span className="max-w-[80%] rounded-md bg-white px-2 py-1 text-xs text-gray-800 ring-1 ring-gray-200">
                          {m.text}
                        </span>
                      </>
                    ) : (
                      <span className="max-w-[80%] rounded-md bg-blue-600 px-2 py-1 text-xs text-white">{m.text}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="flex h-dvh flex-col bg-white">
      <TopNav />
      {/* Talking header (avatar + latest coach bubble + nav) */}
      <section className="sticky top-12 z-30 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="flex items-start gap-3">
            <AvatarTalkingHead speaking={isSpeaking} className="shrink-0" />
            <div className="flex-1">
              <div className="max-w-[80%] rounded-xl bg-blue-50 ring-1 ring-blue-200 px-3 py-2 text-sm text-gray-900">
                {visibleCoach ? visibleCoach.text : 'Welcome. I’ll talk through the idea up here, then point you to the lesson below.'}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  disabled={visibleCoachIdx <= 0}
                  onClick={() => {
                    if (visibleCoachIdx > 0) {
                      setAutoFollow(false);
                      setVisibleCoachIdx(visibleCoachIdx - 1);
                    }
                  }}
                >
                  ‹ Prev
                </button>
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  disabled={(() => {
                    const canAdvanceScript =
                      scriptIndex >= 0 &&
                      scriptIndex < INTRO_SCRIPT.length - 1 &&
                      !INTRO_SCRIPT[scriptIndex]?.requiresInput;
                    const hasNextCoach = visibleCoachIdx < coachMessages.length - 1;
                    return !(canAdvanceScript || hasNextCoach);
                  })()}
                  onClick={() => {
                    const canAdvanceScript =
                      scriptIndex >= 0 &&
                      scriptIndex < INTRO_SCRIPT.length - 1 &&
                      !INTRO_SCRIPT[scriptIndex]?.requiresInput;
                    const hasNextCoach = visibleCoachIdx < coachMessages.length - 1;

                    if (canAdvanceScript) {
                      setAutoFollow(true);
                      advanceScript();
                      return;
                    }
                    if (hasNextCoach) {
                      const nextIdx = visibleCoachIdx + 1;
                      setVisibleCoachIdx(nextIdx);
                      setAutoFollow(nextIdx === coachMessages.length - 1);
                    }
                  }}
                >
                  Next ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transcript toggle + panel */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-4 pb-2 pt-2">
          <TranscriptToggle />
        </div>
      </section>

      {/* Pinned lesson block */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <h1 className="text-xl font-semibold">{LESSON_SLIDES[topSlide]?.title ?? 'Relapse Justifications'}</h1>
          <div>{LESSON_SLIDES[topSlide]?.body}</div>
        </div>
      </section>

      {/* Crisis banner */}
      {crisisFlag && (
        <div className="z-10 bg-red-50 px-4 py-2 text-sm text-red-800">
          Thank you so much for sharing that. It appears you’re asking me something beyond my ability to help. I’m a behavior
          coach, not a therapist. If you’re in danger or need immediate help, call 911 (or 988 for suicidal thoughts). If
          you’re looking for additional support, please connect with a licensed therapist. {/* Josh’s preferred copy */}
        </div>
      )}

      {/* Summary */}
      <div className="mx-auto w-full max-w-3xl px-4 pt-4">
        {summaryText && (
          <div className="mt-4 rounded-md border bg-emerald-50 p-3 text-sm text-emerald-900">
            <div className="font-medium">Your recap</div>
            <p className="mt-1">{summaryText}</p>
            <div className="mt-2 flex gap-2">
              <button
                className="rounded bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-700"
                onClick={() => {
                  navigator.clipboard?.writeText(summaryText);
                }}
              >
                Copy
              </button>
              {!completed ? (
                <button
                  className="rounded border border-emerald-600 px-3 py-1 text-emerald-700 hover:bg-emerald-100"
                  onClick={() => onSend('Mark complete')}
                >
                  Mark Complete
                </button>
              ) : (
                <span className="text-emerald-700">Marked complete ✓</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="mt-auto mx-auto w-full max-w-3xl px-4 py-4">
        <MessageComposer onSend={onSend} />
      </div>
    </main>
  );
}
