'use client'

import { ReactNode } from 'react'
import TopNav from '@/components/TopNav'

interface MobilePageShellProps {
  title: string
  children: ReactNode
  onShowInstructions?: () => void
  className?: string
  footer?: ReactNode
  hasChat?: boolean
  stickyHeader?: ReactNode
  fixedFooter?: ReactNode
}

export default function MobilePageShell({
  title,
  children,
  onShowInstructions,
  className = '',
  footer,
  hasChat = false,
  stickyHeader,
  fixedFooter
}: MobilePageShellProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopNav title={title} onShowInstructions={onShowInstructions} />
      
      {/* Sticky header content (like progress meters) */}
      {stickyHeader}
      
      <main className={`
        flex-1 flex flex-col
        px-3 sm:px-4 py-4
        max-w-3xl mx-auto w-full
        ${hasChat ? 'pb-safe-area-inset-bottom min-h-0' : 'pb-6'}
        ${fixedFooter ? 'pb-20' : ''}
        ${className}
      `}>
        <div className={`
          flex-1 flex flex-col
          ${hasChat ? 'min-h-0' : ''}
        `}>
          {children}
        </div>
        
        {footer && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex-shrink-0">
            {footer}
          </div>
        )}
      </main>

      {/* Fixed footer content (like action bars) */}
      {fixedFooter}
    </div>
  )
}
