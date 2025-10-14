'use client'

import { useState } from 'react'

interface Message {
  role: 'coach' | 'user'
  text: string
  id: string
}

interface TranscriptProps {
  messages: Message[]
  isOpen?: boolean
  onToggle?: () => void
}

export default function Transcript({ messages, isOpen: controlledIsOpen, onToggle }: TranscriptProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
  const handleToggle = onToggle || (() => setInternalIsOpen(!internalIsOpen))

  return (
    <div>
      <button
        type="button"
        className="rounded border px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
        onClick={handleToggle}
      >
        {isOpen ? 'Hide transcript' : 'View transcript'}
      </button>

      {isOpen && (
        <div className="mt-2 max-h-56 overflow-y-auto rounded-md border bg-gray-50 p-2">
          {messages.length === 0 ? (
            <div className="text-xs text-gray-500">No messages yet.</div>
          ) : (
            <ul className="space-y-2">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={m.role === 'coach' ? 'flex items-start gap-2' : 'flex justify-end'}
                >
                  {m.role === 'coach' ? (
                    <>
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                        C
                      </span>
                      <span className="max-w-[80%] rounded-md bg-white px-2 py-1 text-xs text-gray-800 ring-1 ring-gray-200">
                        {m.text}
                      </span>
                    </>
                  ) : (
                    <span className="max-w-[80%] rounded-md bg-blue-600 px-2 py-1 text-xs text-white">
                      {m.text}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

