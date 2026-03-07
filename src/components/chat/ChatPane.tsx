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
  placeholder?: string;
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
  placeholder,
}: ChatPaneProps) {
  return (
    <div
      className={['flex flex-col h-full min-h-0', className].filter(Boolean).join(' ')}
    >
      {/* Message area */}
      <div
        className="flex-1 min-h-0 overflow-y-auto chat-messages"
        style={{ padding: '16px 4px 8px' }}
        aria-live="polite"
      >
        <MessageList messages={messages} renderHTML={renderHTML} />
      </div>

      {/* Composer */}
      <div className="flex-shrink-0 pt-3">
        <MessageComposer
          value={inputValue}
          onChange={onInputChange}
          onSend={onSend}
          disabled={disabled}
          isSending={isSending}
          placeholder={placeholder}
        />
        {footer && (
          <p
            className="mt-2 text-[11px] text-center leading-relaxed px-2 text-wrap-anywhere"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}
