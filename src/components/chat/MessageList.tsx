'use client';

import * as React from 'react';
import { ChatMessage } from './types';

type MessageListProps = {
  messages: ChatMessage[];
  className?: string;
  showAvatars?: boolean;
  renderHTML?: boolean;
};

export function MessageList({
  messages,
  className,
  showAvatars = false,
  renderHTML = false,
}: MessageListProps) {
  const endRef = React.useRef<HTMLDivElement | null>(null);

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

        // Assistant bubble
        return (
          <div key={m.id} className={`flex justify-start items-end gap-2 ${animClass}`}>
            {showAvatars && (
              <div
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold mb-0.5"
                style={{
                  background:
                    'linear-gradient(135deg, var(--lavender-400), var(--lavender-500))',
                }}
              >
                J
              </div>
            )}
            <div
              className="max-w-[82%] px-4 py-3 text-[15px] leading-relaxed text-wrap-anywhere"
              style={{
                background: '#FFFFFF',
                borderRadius: '20px 20px 20px 4px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
                color: 'var(--text-primary)',
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
      })}
      <div ref={endRef} />
    </div>
  );
}
