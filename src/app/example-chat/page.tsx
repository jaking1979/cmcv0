'use client';

import * as React from 'react';
import { ChatPane, useChat } from '@/components/chat';
import { ChatMessage } from '@/components/chat';

export default function ExampleChatPage() {
  const seed: ChatMessage[] = [
    { id: 's1', role: 'assistant', content: 'Welcome! Tell me a bit about yourself and what brings you here.' },
  ];
  const { messages, input, setInput, send, isSending } = useChat({ seed });

  return (
    <div className="mx-auto max-w-3xl p-4">
      <ChatPane
        messages={messages}
        onSend={(v) => send(v)}
        isSending={isSending}
        inputValue={input}
        onInputChange={setInput}
        footer={<span>Not a therapist; this is behavior coaching.</span>}
      />
    </div>
  );
}
