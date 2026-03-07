'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface TopNavProps {
  title?: string
  showBack?: boolean
  backHref?: string
  /** Deprecated – kept for API compatibility but no longer renders a drawer */
  onShowInstructions?: () => void
  badge?: string
  rightSlot?: React.ReactNode
}

/**
 * Minimal page header – replaces the old hamburger-drawer TopNav.
 * Navigation is now handled by BottomNav.
 */
export default function TopNav({
  title,
  showBack = false,
  backHref,
  onShowInstructions,
  badge,
  rightSlot,
}: TopNavProps) {
  const router = useRouter()

  const handleBack = () => {
    if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  return (
    <header
      className="sticky top-0 z-30 flex-shrink-0"
      style={{
        background: 'rgba(248,247,245,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div
        className="flex items-center gap-2 h-14 px-4 max-w-lg mx-auto"
      >
        {/* Back button */}
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
            style={{ color: 'var(--cmc-teal-600)', background: 'rgba(94,203,188,0.1)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Title */}
        {title && (
          <h1
            className="flex-1 text-base font-semibold truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
            {badge && (
              <span
                className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, var(--cmc-teal-500), var(--cmc-teal-600))',
                  color: 'white',
                  verticalAlign: 'middle',
                }}
              >
                {badge}
              </span>
            )}
          </h1>
        )}

        {/* Right slot */}
        <div className="flex items-center gap-1 ml-auto">
          {onShowInstructions && (
            <button
              type="button"
              onClick={onShowInstructions}
              aria-label="Show instructions"
              className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
              style={{ color: 'var(--text-tertiary)', background: 'rgba(0,0,0,0.04)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </button>
          )}
          {rightSlot}
        </div>
      </div>
    </header>
  )
}

/** Thin back-navigation bar, used on sub-pages (e.g. lesson detail) */
export function BackBar({ href, label = 'Back' }: { href: string; label?: string }) {
  return (
    <div
      className="sticky top-14 z-20 flex-shrink-0 px-4 py-2 max-w-lg mx-auto w-full"
      style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}
    >
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        style={{ color: 'var(--cmc-teal-600)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {label}
      </Link>
    </div>
  )
}
