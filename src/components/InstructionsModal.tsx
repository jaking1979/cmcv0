'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function TopNav({
  title,
  onShowInstructions,
}: {
  title: string
  onShowInstructions?: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (menuOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* LEFT: hamburger opens drawer */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            aria-label="Open menu"
            title="Menu"
          >
            ☰
          </button>

          {/* CENTER: title */}
          <h1 className="text-base sm:text-lg font-semibold truncate">{title}</h1>

          {/* RIGHT: Home + Instructions */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
              aria-label="Home"
              title="Home"
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
                Instructions
              </button>
            )}
          </div>
        </div>
      </header>

      {/* NAV DRAWER */}
      <div
        className={`fixed inset-0 z-40 ${menuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!menuOpen}
      >
        {/* Scrim */}
        <div
          className={`absolute inset-0 bg-black/30 transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMenuOpen(false)}
        />

        {/* Panel */}
        <aside
          className={`absolute left-0 top-0 h-full w-72 max-w-[80%] bg-white shadow-xl border-r transition-transform duration-200 ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          role="dialog"
          aria-label="Navigation menu"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-semibold">Menu</span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="rounded-md border px-2.5 py-1.5 text-sm hover:bg-gray-50"
              aria-label="Close menu"
            >
              Close
            </button>
          </div>

          <nav className="p-2">
            <ul className="space-y-1">
              <li>
                <Link href="/" className="block rounded-md px-3 py-2 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/onboarding" className="block rounded-md px-3 py-2 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                  Onboarding
                </Link>
              </li>
              <li>
                <Link href="/learn" className="block rounded-md px-3 py-2 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                  Learn
                </Link>
              </li>
              <li>
                <Link href="/advice" className="block rounded-md px-3 py-2 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                  Get Advice
                </Link>
              </li>
              <li>
                <Link href="/crisis" className="block rounded-md px-3 py-2 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                  Crisis Support
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
      </div>
    </>
  )
}