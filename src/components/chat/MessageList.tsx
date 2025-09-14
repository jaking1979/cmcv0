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

  return (
    <div className={["space-y-3", className].filter(Boolean).join(' ')}>
      {messages.map((m) => {
        const isUser = m.role === 'user';
        const bubbleBase = "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[15px] leading-relaxed";
        const userBubble = "bg-blue-600 text-white rounded-br-sm";
        const asstBubble = "bg-gray-100 text-gray-900 rounded-bl-sm";

        return (
          <div key={m.id} className={["flex", isUser ? "justify-end" : "justify-start"].join(' ')}>
            {!isUser && showAvatars ? <div className="h-7 w-7 shrink-0 rounded-full bg-gray-200 mr-2" /> : null}
            <div className={[bubbleBase, isUser ? userBubble : asstBubble].join(' ')}>
              {renderHTML ? (
                <div dangerouslySetInnerHTML={{ __html: m.content }} />
              ) : (
                m.content
              )}
            </div>
            {isUser && showAvatars ? <div className="h-7 w-7 shrink-0 rounded-full bg-blue-200 ml-2" /> : null}
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
