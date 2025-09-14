'use client';

import * as React from 'react';

type MessageComposerProps = {
  value?: string;
  onChange?: (v: string) => void;
  onSend: (v: string) => void;
  disabled?: boolean;
  isSending?: boolean;
  sendOnEnter?: boolean;
  className?: string;
};

export function MessageComposer({
  value,
  onChange,
  onSend,
  disabled = false,
  isSending = false,
  sendOnEnter = true,
  className,
}: MessageComposerProps) {
  const [inner, setInner] = React.useState(value ?? "");
  const ref = React.useRef<HTMLTextAreaElement | null>(null);
  const [isComposing, setIsComposing] = React.useState(false);

  React.useEffect(() => {
    if (value !== undefined) setInner(value);
  }, [value]);

  function doSend() {
    const text = (value !== undefined ? value : inner).trim();
    if (!text) return;
    onSend(text);
    if (value === undefined) setInner("");
    ref.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!sendOnEnter || isComposing) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !isSending) doSend();
    }
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (!disabled && !isSending) doSend(); }}
      className={["mt-4 flex items-end gap-3", className].filter(Boolean).join(' ')}
    >
      <textarea
        ref={ref}
        value={value !== undefined ? value : inner}
        onChange={(e) => { onChange?.(e.target.value); if (value === undefined) setInner(e.target.value); }}
        onKeyDown={onKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        placeholder="Type your message… (Enter to send, Shift+Enter for newline)"
        className="flex-1 rounded-lg border border-gray-300 p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
      <button
        type="submit"
        disabled={disabled || isSending || !(value !== undefined ? value.trim() : inner.trim())}
        className="rounded-md bg-blue-600 text-white px-4 py-3 text-sm font-medium disabled:opacity-50"
      >
        {isSending ? 'Sending…' : 'Send'}
      </button>
    </form>
  );
}
