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
  const [isFocused, setIsFocused] = React.useState(false);

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
      className={["flex items-end gap-3", className].filter(Boolean).join(' ')}
    >
      <textarea
        ref={ref}
        value={value !== undefined ? value : inner}
        onChange={(e) => { onChange?.(e.target.value); if (value === undefined) setInner(e.target.value); }}
        onKeyDown={onKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Type your message…"
        className={`
          flex-1 glass-light border-2 p-4
          focus:outline-none focus:glass-medium
          resize-none min-h-[44px] max-h-32
          text-wrap-anywhere
          transition-all duration-300
          ${isFocused ? 'border-[#5ECBBC] glow-teal' : 'border-gray-200/50'}
        `}
        rows={1}
        style={{
          fieldSizing: 'content',
          borderRadius: 'var(--radius-xl)'
        } as any}
        disabled={disabled || isSending}
      />
      <button
        type="submit"
        disabled={disabled || isSending || !(value !== undefined ? value.trim() : inner.trim())}
        className="
          bg-gradient-to-br from-[#5ECBBC] to-[#3FA89C]
          text-white px-4 py-3 sm:px-5
          text-sm font-semibold shadow-soft
          hover:glow-teal-strong hover:scale-105
          active:scale-95
          focus:outline-none focus:glow-teal-strong
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          transition-all duration-300
          min-h-[44px] min-w-[44px]
          flex items-center justify-center
        "
        style={{ borderRadius: 'var(--radius-lg)' }}
        aria-label={isSending ? 'Sending message' : 'Send message'}
      >
        {isSending ? (
          <span className="flex items-center gap-1">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="hidden sm:inline">Sending…</span>
          </span>
        ) : (
          <span>Send</span>
        )}
      </button>
    </form>
  );
}
