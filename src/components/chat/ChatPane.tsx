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
    <div className={[
      "flex flex-col h-full",
      "rounded-lg border border-gray-200 bg-white",
      "p-3 sm:p-4",
      className
    ].filter(Boolean).join(' ')}>
      <div className="flex-1 min-h-0 overflow-y-auto mb-4" aria-live="polite">
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
          <div className="mt-3 text-xs text-gray-500 leading-relaxed">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
