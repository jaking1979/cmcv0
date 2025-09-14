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
    <div className={["rounded-lg border border-gray-200 bg-white p-4", className].filter(Boolean).join(' ')}>
      <div className="min-h-[280px] max-h-[65vh] overflow-y-auto" aria-live="polite">
        <MessageList messages={messages} renderHTML={renderHTML} />
      </div>
      <MessageComposer
        value={inputValue}
        onChange={onInputChange}
        onSend={onSend}
        disabled={disabled}
        isSending={isSending}
      />
      {footer ? <div className="mt-2 text-xs text-gray-500">{footer}</div> : null}
    </div>
  );
}
