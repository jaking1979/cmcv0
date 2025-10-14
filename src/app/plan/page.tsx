'use client'

import { useEffect, useState } from 'react'
import TopNav from '@/components/TopNav'
import PlanList from '@/components/plan/PlanList'
import type { PersonalizedPlan } from '@/server/ai/types'

export default function PlanPage() {
  const [plans, setPlans] = useState<PersonalizedPlan[]>([])
  const [pinnedPlanId, setPinnedPlanId] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Load plans from session
    loadPlans()

    // Load pinned plan ID from localStorage
    const pinned = localStorage.getItem('cmc_pinned_plan_id')
    if (pinned) {
      setPinnedPlanId(pinned)
    }
  }, [mounted])

  async function loadPlans() {
    try {
      // Fetch all plans for this session
      const response = await fetch('/api/plan', {
        method: 'GET'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.plans) {
          setPlans(data.plans)
        }
      }
    } catch (error) {
      console.error('Error loading plans:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept(planId: string) {
    // Pin this plan
    setPinnedPlanId(planId)
    localStorage.setItem('cmc_pinned_plan_id', planId)

    // Optionally notify the server
    try {
      await fetch('/api/plan/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      })
    } catch (error) {
      console.error('Error pinning plan:', error)
    }
  }

  function handleDismiss(planId: string) {
    setPlans(prev => prev.filter(p => p.id !== planId))
    
    // If dismissing the pinned plan, clear it
    if (planId === pinnedPlanId) {
      setPinnedPlanId(undefined)
      localStorage.removeItem('cmc_pinned_plan_id')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <TopNav title="📋 My Action Plan" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading plans...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopNav title="📋 My Action Plan" />

      <main className="flex-1 px-3 sm:px-4 py-4 max-w-3xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Action Plans</h1>
          <p className="text-sm text-gray-600">
            Based on your conversations, here are personalized strategies to support your recovery journey.
          </p>
        </div>

        <PlanList
          plans={plans}
          pinnedPlanId={pinnedPlanId}
          onAccept={handleAccept}
          onDismiss={handleDismiss}
        />

        {plans.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">💡 About Your Plans</h4>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• Plans are generated based on patterns detected in your conversations</li>
              <li>• Pin a plan to keep it at the top for easy reference</li>
              <li>• New plans are created when you have meaningful conversations in "Get Advice"</li>
              <li>• Plans are stored for your current session only</li>
            </ul>
          </div>
        )}
      </main>
    </div>
  )
}

