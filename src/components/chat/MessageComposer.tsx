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
  placeholder?: string;
};

function SendIcon({ spinning }: { spinning?: boolean }) {
  if (spinning) {
    return (
      <svg
        className="animate-spin"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    );
  }
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

export function MessageComposer({
  value,
  onChange,
  onSend,
  disabled = false,
  isSending = false,
  sendOnEnter = true,
  className,
  placeholder = 'Send a message',
}: MessageComposerProps) {
  const [inner, setInner] = React.useState(value ?? '');
  const ref = React.useRef<HTMLTextAreaElement | null>(null);
  const [isComposing, setIsComposing] = React.useState(false);

  React.useEffect(() => {
    if (value !== undefined) setInner(value);
  }, [value]);

  function doSend() {
    const text = (value !== undefined ? value : inner).trim();
    if (!text) return;
    onSend(text);
    if (value === undefined) setInner('');
    ref.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!sendOnEnter || isComposing) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !isSending) doSend();
    }
  }

  const currentValue = value !== undefined ? value : inner;
  const isEmpty = !currentValue.trim();
  const isDisabled = disabled || isSending;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!isDisabled) doSend();
      }}
      className={['flex items-end gap-2', className].filter(Boolean).join(' ')}
    >
      {/* Pill-shaped input */}
      <div
        className="flex-1 flex items-end transition-shadow duration-200"
        style={{
          background: 'rgba(0,0,0,0.05)',
          borderRadius: 'var(--radius-2xl)',
          minHeight: '50px',
          padding: '12px 18px',
        }}
      >
        <textarea
          ref={ref}
          value={currentValue}
          onChange={(e) => {
            onChange?.(e.target.value);
            if (value === undefined) setInner(e.target.value);
          }}
          onKeyDown={onKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder={placeholder}
          className="w-full bg-transparent resize-none outline-none text-wrap-anywhere leading-relaxed"
          style={{
            fontSize: '16px',
            lineHeight: '1.5',
            color: 'var(--text-primary)',
            maxHeight: '120px',
            overflowY: 'auto',
            minHeight: '24px',
            fieldSizing: 'content',
          } as React.CSSProperties}
          rows={1}
          disabled={isDisabled}
        />
      </div>

      {/* Circular send button */}
      <button
        type="submit"
        disabled={isDisabled || isEmpty}
        aria-label={isSending ? 'Sending…' : 'Send message'}
        className="flex-shrink-0 flex items-center justify-center text-white transition-all duration-200"
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background:
            isDisabled || isEmpty
              ? 'rgba(0,0,0,0.12)'
              : 'linear-gradient(135deg, var(--cmc-teal-500), var(--cmc-teal-700))',
          boxShadow:
            isDisabled || isEmpty ? 'none' : '0 4px 16px rgba(63,168,156,0.35)',
          transform: isDisabled || isEmpty ? 'scale(0.92)' : 'scale(1)',
          cursor: isDisabled || isEmpty ? 'not-allowed' : 'pointer',
        }}
      >
        <SendIcon spinning={isSending} />
      </button>
    </form>
  );
}
