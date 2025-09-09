'use client'
import { ReactNode } from 'react'
import TopNav from '@/components/TopNav'

type Props = {
  title: string
  onShowInstructions?: () => void
  children: ReactNode
}

export default function PageShell({ title, onShowInstructions, children }: Props) {
  return (
    <main className="h-screen max-w-3xl mx-auto p-6 flex flex-col min-h-0">
      <TopNav title={title} onShowInstructions={onShowInstructions} />
      {children}
    </main>
  )
}
