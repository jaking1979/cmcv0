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
    <div className={["space-y-4", className].filter(Boolean).join(' ')}>
      {messages.map((m, idx) => {
        const isUser = m.role === 'user';
        const bubbleBase = "max-w-[85%] whitespace-pre-wrap px-5 py-3.5 text-[15px] leading-relaxed slide-up";
        const userBubble = "bg-gradient-to-br from-[#5ECBBC] to-[#3FA89C] text-white glow-teal";
        const asstBubble = "glass-medium shadow-soft border border-gray-200/50";
        const borderRadius = isUser ? "rounded-3xl rounded-br-lg" : "rounded-3xl rounded-bl-lg";

        return (
          <div 
            key={m.id} 
            className={["flex", isUser ? "justify-end" : "justify-start", `stagger-${Math.min(idx, 5)}`].join(' ')}
          >
            {!isUser && showAvatars ? (
              <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-[#B8AEE8] to-[#9B8FD9] mr-2 shadow-soft" />
            ) : null}
            <div className={[bubbleBase, isUser ? userBubble : asstBubble, borderRadius].join(' ')}>
              {renderHTML ? (
                <div dangerouslySetInnerHTML={{ __html: m.content }} className={isUser ? 'text-white' : 'text-gray-900'} />
              ) : (
                <span className={isUser ? 'text-white' : 'text-gray-900'}>{m.content}</span>
              )}
            </div>
            {isUser && showAvatars ? (
              <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-[#7FD9CC] to-[#5ECBBC] ml-2 shadow-soft" />
            ) : null}
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
