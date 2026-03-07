'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function ChatIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

const CHAT_PATHS = ['/', '/advice', '/chat', '/onboarding', '/example-chat']
const PROFILE_PATHS = ['/profile', '/learn', '/crisis', '/plan']

export default function BottomNav() {
  const pathname = usePathname()

  const isChatActive =
    CHAT_PATHS.includes(pathname) ||
    pathname.startsWith('/example-chat')

  const isProfileActive =
    PROFILE_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50"
      style={{
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 -1px 0 rgba(0,0,0,0.06)',
      }}
    >
      <div
        className="flex items-stretch max-w-lg mx-auto"
        style={{ height: 'var(--bottom-nav-height)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Link
          href="/advice"
          className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-200"
          style={{ color: isChatActive ? 'var(--cmc-teal-600)' : 'var(--text-tertiary)' }}
          aria-label="Chat"
          aria-current={isChatActive ? 'page' : undefined}
        >
          <ChatIcon active={isChatActive} />
          <span
            className="text-[10px] font-semibold tracking-wide"
            style={{ letterSpacing: '0.03em' }}
          >
            Chat
          </span>
          {isChatActive && (
            <span
              className="absolute bottom-0 w-8 h-0.5 rounded-full"
              style={{ background: 'var(--cmc-teal-500)' }}
            />
          )}
        </Link>

        <Link
          href="/profile"
          className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-200 relative"
          style={{ color: isProfileActive ? 'var(--cmc-teal-600)' : 'var(--text-tertiary)' }}
          aria-label="Profile"
          aria-current={isProfileActive ? 'page' : undefined}
        >
          <ProfileIcon active={isProfileActive} />
          <span
            className="text-[10px] font-semibold tracking-wide"
            style={{ letterSpacing: '0.03em' }}
          >
            Profile
          </span>
          {isProfileActive && (
            <span
              className="absolute bottom-0 w-8 h-0.5 rounded-full"
              style={{ background: 'var(--cmc-teal-500)' }}
            />
          )}
        </Link>
      </div>
    </nav>
  )
}

/** Drop this at the bottom of any page to add space behind the fixed nav */
export function NavSpacer() {
  return (
    <div
      aria-hidden="true"
      style={{ height: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom))' }}
    />
  )
}
