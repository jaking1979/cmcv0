'use client';

import * as React from 'react';
import { ChatMessage } from './types';

// ── Timing ────────────────────────────────────────────────────────────────────
/** Gap between revealing successive paragraphs of a new assistant message */
const PARAGRAPH_GAP_MS = 800;

// ── Helpers ───────────────────────────────────────────────────────────────────
/**
 * Split assistant message content into displayable chunks.
 * Splits on blank lines (two or more newlines in a row).
 * Single-paragraph messages return a one-element array.
 */
function splitChunks(content: string): string[] {
  return content
    .split(/\n{2,}/)
    .map(s => s.trim())
    .filter(Boolean);
}

/** Returns true while the message is still being streamed (has the cursor). */
function isStreaming(content: string): boolean {
  return content.endsWith('▌');
}

// ── Types ─────────────────────────────────────────────────────────────────────
type MessageListProps = {
  messages: ChatMessage[];
  className?: string;
  showAvatars?: boolean;
  renderHTML?: boolean;
  /**
   * ID of the most recently *completed* (non-streaming) assistant message.
   * When this changes, that message's paragraphs will be revealed sequentially.
   */
  revealMessageId?: string | null;
};

// ── AssistantBubble ───────────────────────────────────────────────────────────
/**
 * Renders an assistant message as one or more sequential bubbles.
 *
 * - If `revealMessageId` matches this message's id: split content into
 *   paragraphs and reveal them one at a time at PARAGRAPH_GAP_MS intervals.
 * - Otherwise (historical messages, single-paragraph): render immediately.
 */
function AssistantBubble({
  message,
  isNew,
  showAvatar,
  renderHTML,
}: {
  message: ChatMessage;
  isNew: boolean;
  showAvatar: boolean;
  renderHTML: boolean;
}) {
  const streaming = isStreaming(message.content);
  const chunks = React.useMemo(
    () => (streaming ? [message.content] : splitChunks(message.content)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Re-compute when content changes (during streaming), but keep stable once done
    [message.content, streaming]
  );

  // How many chunks are currently visible.
  // Historical messages (isNew=false) start fully revealed.
  const [visibleChunks, setVisibleChunks] = React.useState<number>(
    isNew && !streaming && chunks.length > 1 ? 1 : chunks.length
  );

  React.useEffect(() => {
    // If streaming or not a new multi-chunk message: nothing to sequence
    if (streaming || !isNew || chunks.length <= 1) {
      setVisibleChunks(chunks.length);
      return;
    }

    // Start at 1 (already set in initial state) and schedule the rest
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 2; i <= chunks.length; i++) {
      timers.push(
        setTimeout(() => setVisibleChunks(i), PARAGRAPH_GAP_MS * (i - 1))
      );
    }
    return () => timers.forEach(clearTimeout);
    // Only run when the message transitions from streaming to done (chunks array identity changes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunks]);

  const bubbleStyle: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: '20px 20px 20px 4px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    color: 'var(--text-primary)',
  };

  return (
    <>
      {chunks.slice(0, visibleChunks).map((chunk, chunkIdx) => (
        <div
          key={chunkIdx}
          className="flex justify-start items-end gap-2 slide-up"
        >
          {/* Avatar: only show on first chunk of this message turn */}
          {showAvatar ? (
            chunkIdx === 0 ? (
              <div
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold mb-0.5"
                style={{
                  background:
                    'linear-gradient(135deg, var(--lavender-400), var(--lavender-500))',
                }}
              >
                J
              </div>
            ) : (
              // Spacer to keep subsequent bubbles aligned
              <div className="shrink-0 w-7" />
            )
          ) : null}

          <div
            className="max-w-[82%] px-4 py-3 text-[15px] leading-relaxed text-wrap-anywhere whitespace-pre-line"
            style={bubbleStyle}
          >
            {renderHTML ? (
              <div dangerouslySetInnerHTML={{ __html: chunk }} />
            ) : (
              chunk
            )}
          </div>
        </div>
      ))}
    </>
  );
}

// ── MessageList ───────────────────────────────────────────────────────────────
export function MessageList({
  messages,
  className,
  showAvatars = false,
  renderHTML = false,
  revealMessageId,
}: MessageListProps) {
  const endRef = React.useRef<HTMLDivElement | null>(null);

  // Track which message IDs have already been "new" so we don't re-animate
  // historical messages if the parent re-renders with the same revealMessageId.
  const revealedRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) return <div ref={endRef} />;

  return (
    <div className={['space-y-3', className].filter(Boolean).join(' ')}>
      {messages.map((m, idx) => {
        const isUser = m.role === 'user';
        const animClass = `slide-up stagger-${Math.min(idx, 5)}`;

        if (isUser) {
          return (
            <div key={m.id} className={`flex justify-end ${animClass}`}>
              <div
                className="max-w-[78%] px-4 py-3 text-[15px] leading-relaxed text-wrap-anywhere text-white"
                style={{
                  background:
                    'linear-gradient(135deg, var(--cmc-teal-500), var(--cmc-teal-700))',
                  borderRadius: '20px 20px 4px 20px',
                  boxShadow: '0 2px 12px rgba(63,168,156,0.25)',
                }}
              >
                {renderHTML ? (
                  <div dangerouslySetInnerHTML={{ __html: m.content }} />
                ) : (
                  m.content
                )}
              </div>
            </div>
          );
        }

        // Determine whether this is the "new" message to reveal sequentially.
        // A message is "new" only the first time its ID appears as revealMessageId.
        const isNewReveal =
          revealMessageId === m.id && !revealedRef.current.has(m.id);
        if (isNewReveal) {
          revealedRef.current.add(m.id);
        }

        return (
          <AssistantBubble
            key={m.id}
            message={m}
            isNew={isNewReveal}
            showAvatar={showAvatars}
            renderHTML={renderHTML}
          />
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
