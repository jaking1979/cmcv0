'use client'

import React from 'react'

type Props = {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}

export default function GlobalInstructionsModal({ open, title, onClose, children }: Props) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-instructions-title"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-[min(680px,92vw)] rounded-xl bg-white shadow-xl border border-gray-200">
        <div className="p-5 border-b border-gray-200 flex items-start justify-between gap-4">
          <h2 id="global-instructions-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
            autoFocus
          >
            Close
          </button>
        </div>
        <div className="p-5 text-[15px] leading-6 text-gray-800 space-y-4">
          {children}
        </div>
        <div className="px-5 pb-5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
