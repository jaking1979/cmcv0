'use client'

import { useState } from 'react'
import TopNav from '@/components/TopNav'
import GlobalInstructionsModal from '@/components/GlobalInstructionsModal'

export default function ChatHolderPage() {
  const [showInstructions, setShowInstructions] = useState(false)

  return (
    <>
      <TopNav
        title="💬 Just Chat"
        onShowInstructions={() => setShowInstructions(true)}
      />

      <main className="min-h-screen bg-gray-50 px-4">
        <div className="max-w-3xl mx-auto py-8">
          <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-semibold mb-2">💬 Just Chat (Demo)</h1>
            <p className="text-gray-700">
              This is a holder page. In the real app, there’d be a functioning chat
              that gathers information to personalize your experience. This chat isn’t
              limited to substance use or behavior change goals — it follows the same
              guardrails as the rest of the app, and anything you share here would help
              tailor the experience to you.
            </p>
          </section>
        </div>
      </main>

      <GlobalInstructionsModal
        open={showInstructions}
        onClose={() => setShowInstructions(false)}
        title="Just Chat — Demo Instructions"
      >
        <div className="space-y-3 text-sm">
          <p>
            This page is a placeholder. In the full app, this would be a general-purpose
            chat that can talk about anything and uses what it learns to personalize the app.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the hamburger menu for quick navigation.</li>
            <li>Click “Instructions” in the menu to reopen this info.</li>
            <li>No data is persisted in this demo.</li>
          </ul>
        </div>
      </GlobalInstructionsModal>
    </>
  )
}
