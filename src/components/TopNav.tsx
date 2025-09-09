'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function TopNav({
  title,
  onShowInstructions,
}: {
  title: string
  onShowInstructions?: () => void
}) {
  const [open, setOpen] = useState(false)

  // Close drawer on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              ☰
            </button>
            <h1 className="text-lg font-semibold truncate">{title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Home
            </Link>
            {onShowInstructions && (
              <button
                type="button"
                onClick={onShowInstructions}
                className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                aria-label="Show instructions"
                title="Instructions"
              >
                ?
              </button>
            )}
          </div>
        </div>
      </header>

      {open && (
        <>
          {/* overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* slide-over drawer */}
          <aside className="fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-xl border-r border-gray-200 flex flex-col">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <span className="font-semibold">CMC Sober Coach</span>
              <button
                className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <nav className="p-2 flex-1">
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/"
                    className="block rounded-md px-3 py-2 hover:bg-gray-50"
                    onClick={() => setOpen(false)}
                  >
                    🏠 Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/learn"
                    className="block rounded-md px-3 py-2 hover:bg-gray-50"
                    onClick={() => setOpen(false)}
                  >
                    📚 Learn
                  </Link>
                </li>
                <li>
                  <Link
                    href="/advice"
                    className="block rounded-md px-3 py-2 hover:bg-gray-50"
                    onClick={() => setOpen(false)}
                  >
                    💬 Advice
                  </Link>
                </li>
                <li>
                  <Link
                    href="/onboarding"
                    className="block rounded-md px-3 py-2 hover:bg-gray-50"
                    onClick={() => setOpen(false)}
                  >
                    🧾 Onboarding (demo)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/crisis"
                    className="block rounded-md px-3 py-2 hover:bg-gray-50"
                    onClick={() => setOpen(false)}
                  >
                    🚨 Crisis
                  </Link>
                </li>
              </ul>
            </nav>

            {onShowInstructions && (
              <div className="p-3 border-t">
                <button
                  className="w-full rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={() => {
                    setOpen(false)
                    onShowInstructions()
                  }}
                >
                  📖 Instructions
                </button>
              </div>
            )}
          </aside>
        </>
      )}
    </>
  )
}