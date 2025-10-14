'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function TopNav({
  title,
  onShowInstructions,
  badge,
}: {
  title: string
  onShowInstructions?: () => void
  badge?: string
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
      <header className="sticky top-0 z-30 glass-strong shadow-soft border-b border-gray-200/30 flex-shrink-0">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className="
                inline-flex items-center justify-center
                glass-light border border-gray-200/50
                min-h-[44px] min-w-[44px] px-3
                text-sm hover:glass-medium hover:glow-teal
                transition-all duration-300
              "
              style={{ borderRadius: 'var(--radius-md)' }}
            >
              <span className="text-lg">☰</span>
            </button>
            <h1 className="text-base sm:text-lg font-semibold truncate flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              {title}
              {badge && (
                <span className="text-xs font-semibold bg-gradient-to-br from-[#5ECBBC] to-[#3FA89C] text-white px-2.5 py-1 shadow-soft flex-shrink-0" style={{ borderRadius: 'var(--radius-md)' }}>
                  {badge}
                </span>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Link
              href="/"
              className="
                inline-flex items-center justify-center
                glass-light border border-gray-200/50
                min-h-[44px] px-3 sm:px-4
                text-sm hover:glass-medium hover:glow-teal
                transition-all duration-300
              "
              style={{ borderRadius: 'var(--radius-md)' }}
            >
              <span className="hidden sm:inline">Home</span>
              <span className="sm:hidden">🏠</span>
            </Link>
            {onShowInstructions && (
              <button
                type="button"
                onClick={onShowInstructions}
                className="
                  inline-flex items-center justify-center
                  glass-light border border-gray-200/50
                  min-h-[44px] min-w-[44px] px-3
                  text-sm hover:glass-medium hover:glow-teal
                  transition-all duration-300
                "
                style={{ borderRadius: 'var(--radius-md)' }}
                aria-label="Show instructions"
                title="Instructions"
              >
                <span className="text-lg">?</span>
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
          <aside className="fixed top-0 left-0 z-50 h-full w-80 max-w-[85vw] glass-strong shadow-medium border-r border-gray-200/30 flex flex-col slide-in-left">
            <div className="px-4 py-4 border-b border-gray-200/30 flex items-center justify-between">
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>CMC Sober Coach</span>
              <button
                className="
                  glass-light border border-gray-200/50
                  min-h-[44px] min-w-[44px] px-3
                  text-sm hover:glass-medium hover:glow-teal
                  transition-all duration-300
                "
                style={{ borderRadius: 'var(--radius-md)' }}
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <span className="text-lg">✕</span>
              </button>
            </div>

            <nav className="p-3 flex-1 overflow-y-auto">
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/"
                    className="
                      flex items-center gap-3 px-4 py-3
                      glass-light hover:glass-medium hover:glow-teal
                      transition-all duration-300 min-h-[44px]
                      font-medium
                    "
                    style={{ 
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)'
                    }}
                    onClick={() => setOpen(false)}
                  >
                    <span className="text-xl">🏠</span>
                    <span>Home</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/learn"
                    className="
                      flex items-center gap-3 px-4 py-3
                      glass-light hover:glass-medium hover:glow-teal
                      transition-all duration-300 min-h-[44px]
                      font-medium
                    "
                    style={{ 
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)'
                    }}
                    onClick={() => setOpen(false)}
                  >
                    <span className="text-xl">📚</span>
                    <span>Learn</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/advice"
                    className="
                      flex items-center gap-3 px-4 py-3
                      glass-light hover:glass-medium hover:glow-teal
                      transition-all duration-300 min-h-[44px]
                      font-medium
                    "
                    style={{ 
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)'
                    }}
                    onClick={() => setOpen(false)}
                  >
                    <span className="text-xl">💬</span>
                    <span>Advice</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/onboarding"
                    className="
                      flex items-center gap-3 px-4 py-3
                      glass-light hover:glass-medium hover:glow-teal
                      transition-all duration-300 min-h-[44px]
                      font-medium
                    "
                    style={{ 
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)'
                    }}
                    onClick={() => setOpen(false)}
                  >
                    <span className="text-xl">🧾</span>
                    <span>Onboarding <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>(demo)</span></span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/crisis"
                    className="
                      flex items-center gap-3 px-4 py-3
                      glass-light hover:glass-medium hover:glow-teal
                      transition-all duration-300 min-h-[44px]
                      font-medium
                    "
                    style={{ 
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)'
                    }}
                    onClick={() => setOpen(false)}
                  >
                    <span className="text-xl">🚨</span>
                    <span>Crisis</span>
                  </Link>
                </li>
              </ul>
            </nav>

            {onShowInstructions && (
              <div className="p-4 border-t">
                <button
                  className="
                    w-full flex items-center justify-center gap-2
                    rounded-lg border border-gray-300 px-4 py-3
                    text-sm font-medium hover:bg-gray-50 active:bg-gray-100
                    transition-colors min-h-[44px]
                    text-gray-900
                  "
                  onClick={() => {
                    setOpen(false)
                    onShowInstructions()
                  }}
                >
                  <span className="text-lg">📖</span>
                  <span>Instructions</span>
                </button>
              </div>
            )}
          </aside>
        </>
      )}
    </>
  )
}