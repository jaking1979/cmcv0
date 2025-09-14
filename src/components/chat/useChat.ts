'use client';

import * as React from 'react';
import { ChatMessage } from './types';

type UseChatOptions = {
  seed?: ChatMessage[];
};

export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = React.useState<ChatMessage[]>(options.seed ?? []);
  const [input, setInput] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content) return;
    const userMsg: ChatMessage = {
      id: `m_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      role: 'user',
      content,
      createdAt: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsSending(true);

    try {
      // Placeholder: replace with your existing API call / handler
      const reply: ChatMessage = {
        id: `m_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        role: 'assistant',
        content: "Thanks — I received your message.",
        createdAt: Date.now(),
      };
      // Simulate latency
      await new Promise(r => setTimeout(r, 300));
      setMessages((m) => [...m, reply]);
    } finally {
      setIsSending(false);
    }
  }

  function clear() {
    setMessages([]);
  }

  return { messages, setMessages, input, setInput, send, isSending, clear };
}
