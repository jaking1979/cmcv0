'use client';

import * as React from 'react';
import { ChatMessage } from './types';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';

type ChatPaneProps = {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  isSending?: boolean;
  disabled?: boolean;
  inputValue?: string;
  onInputChange?: (v: string) => void;
  className?: string;
  footer?: React.ReactNode;
  renderHTML?: boolean;
};

export function ChatPane({
  messages,
  onSend,
  isSending = false,
  disabled = false,
  inputValue,
  onInputChange,
  className,
  footer,
  renderHTML = false,
}: ChatPaneProps) {
  return (
    <div 
      className={[
        "flex flex-col h-full",
        "glass-light shadow-medium border border-gray-200/30",
        "p-4 sm:p-5",
        "fade-in",
        className
      ].filter(Boolean).join(' ')}
      style={{ borderRadius: 'var(--radius-xl)' }}
    >
      <div className="flex-1 min-h-0 overflow-y-auto mb-4 pr-1" aria-live="polite">
        <MessageList messages={messages} renderHTML={renderHTML} />
      </div>
      <div className="flex-shrink-0">
        <MessageComposer
          value={inputValue}
          onChange={onInputChange}
          onSend={onSend}
          disabled={disabled}
          isSending={isSending}
        />
        {footer && (
          <div className="mt-3 text-xs text-gray-600 leading-relaxed">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
