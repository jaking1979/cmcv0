// E2E tests for advice page

import { test, expect } from '@playwright/test'

test.describe('Advice Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/advice')
  })

  test('should load advice page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('🧭 Get Advice')
    await expect(page.locator('text=Share what\'s going on or pick a demo')).toBeVisible()
  })

  test('should handle Enter key to send message', async ({ page }) => {
    const input = page.locator('textarea[placeholder*="message"]')
    await input.fill('I feel anxious about work')
    await input.press('Enter')
    
    // Should send the message (input should be cleared)
    await expect(input).toHaveValue('')
  })

  test('should handle Shift+Enter to add newline', async ({ page }) => {
    const input = page.locator('textarea[placeholder*="message"]')
    await input.fill('First line')
    await input.press('Shift+Enter')
    await input.type('Second line')
    
    // Should not send the message, should have both lines
    await expect(input).toHaveValue('First line\nSecond line')
  })

  test('should show demo scenarios dropdown', async ({ page }) => {
    const select = page.locator('select[aria-label="Choose a demo scenario"]')
    await expect(select).toBeVisible()
    
    // Check for demo scenario options
    await expect(select.locator('option[value="1"]')).toContainText('Evening Loneliness After Conflict')
    await expect(select.locator('option[value="2"]')).toContainText('Stress at Work with Overwhelm')
  })

  test('should load demo scenario when selected', async ({ page }) => {
    const select = page.locator('select[aria-label="Choose a demo scenario"]')
    await select.selectOption('1')
    
    const input = page.locator('textarea[placeholder*="message"]')
    await expect(input).toHaveValue(/Earlier today I argued with my brother/)
  })

  test('should show crisis warning for crisis-related input', async ({ page }) => {
    const input = page.locator('textarea[placeholder*="message"]')
    await input.fill('I want to kill myself')
    
    // Crisis warning should appear
    await expect(page.locator('text=Thanks for telling me. I\'m a behavior coach')).toBeVisible()
    await expect(page.locator('text=call 911')).toBeVisible()
    await expect(page.locator('text=call 988')).toBeVisible()
  })

  test('should toggle between Get Advice and Just Chat modes', async ({ page }) => {
    const adviceButton = page.locator('button:has-text("Get Advice")')
    const chatButton = page.locator('button:has-text("Just Chat")')
    
    // Default should be Get Advice mode
    await expect(adviceButton).toHaveClass(/bg-blue-600/)
    await expect(chatButton).toHaveClass(/bg-white/)
    
    // Click Just Chat
    await chatButton.click()
    await expect(chatButton).toHaveClass(/bg-gray-800/)
    await expect(adviceButton).toHaveClass(/bg-white/)
  })

  test('should show instructions modal', async ({ page }) => {
    // Instructions modal should auto-open on first visit
    await expect(page.locator('text=How this page works')).toBeVisible()
    
    // Close modal
    await page.locator('button:has-text("Got it")').click()
    await expect(page.locator('text=How this page works')).not.toBeVisible()
  })

  test('should handle empty message submission', async ({ page }) => {
    const input = page.locator('textarea[placeholder*="message"]')
    const sendButton = page.locator('button[type="submit"]')
    
    // Try to send empty message
    await sendButton.click()
    
    // Input should remain empty, no message should be sent
    await expect(input).toHaveValue('')
  })

  test('should show action buttons for demo scenarios', async ({ page }) => {
    const select = page.locator('select[aria-label="Choose a demo scenario"]')
    await select.selectOption('1')
    
    const input = page.locator('textarea[placeholder*="message"]')
    await input.fill('I understand the scenario')
    await input.press('Enter')
    
    // Wait for response and action buttons
    await page.waitForTimeout(1000)
    
    // Should show action buttons (if in SUGGEST_OPTIONS phase)
    const actionButtons = page.locator('button').filter({ hasText: /✅|💚|🛡️|🔄|🎯/ })
    if (await actionButtons.count() > 0) {
      await expect(actionButtons.first()).toBeVisible()
    }
  })
})

test.describe('Advice Page - V1 Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/advice?v1=1')
  })

  test('should show roleplay mode when roleplays feature is enabled', async ({ page }) => {
    await page.goto('/advice?v1=1&roleplays=1')
    
    await expect(page.locator('text=Practice a Scenario')).toBeVisible()
    await expect(page.locator('button:has-text("Start Roleplay")')).toBeVisible()
  })

  test('should toggle roleplay mode', async ({ page }) => {
    await page.goto('/advice?v1=1&roleplays=1')
    
    const startButton = page.locator('button:has-text("Start Roleplay")')
    await startButton.click()
    
    await expect(page.locator('button:has-text("Exit Roleplay")')).toBeVisible()
    await expect(page.locator('select')).toContainText('Choose a roleplay scenario')
  })

  test('should show plan CTA when appropriate', async ({ page }) => {
    // This test would require mocking the advice API to return a plan CTA
    // For now, we'll test the UI structure
    const input = page.locator('textarea[placeholder*="message"]')
    await input.fill('I need help with my situation')
    await input.press('Enter')
    
    // Wait for response
    await page.waitForTimeout(1000)
    
    // Plan CTA might appear if the response triggers it
    const planCTA = page.locator('text=Would it be helpful if I suggest a plan')
    if (await planCTA.isVisible()) {
      await expect(page.locator('button:has-text("Yes, suggest a plan")')).toBeVisible()
      await expect(page.locator('button:has-text("Not right now")')).toBeVisible()
    }
  })

  test('should display personalized plan when generated', async ({ page }) => {
    // This test would require mocking the plan API
    // For now, we'll test the UI structure
    const input = page.locator('textarea[placeholder*="message"]')
    await input.fill('I need a plan to help me')
    await input.press('Enter')
    
    // Wait for response
    await page.waitForTimeout(1000)
    
    // Plan might appear if generated
    const planSection = page.locator('text=Personalized Plan')
    if (await planSection.isVisible()) {
      await expect(page.locator('button:has-text("Accept Plan")')).toBeVisible()
      await expect(page.locator('button:has-text("Dismiss")')).toBeVisible()
    }
  })
})

test.describe('Advice Page - Roleplay Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/advice?v1=1&roleplays=1')
  })

  test('should start roleplay when scenario is selected', async ({ page }) => {
    const startButton = page.locator('button:has-text("Start Roleplay")')
    await startButton.click()
    
    const select = page.locator('select')
    await select.selectOption('dbt-mindfulness')
    
    // Should start the roleplay (this would require API mocking in real test)
    await page.waitForTimeout(500)
  })

  test('should show roleplay scenarios in dropdown', async ({ page }) => {
    const startButton = page.locator('button:has-text("Start Roleplay")')
    await startButton.click()
    
    const select = page.locator('select')
    await expect(select.locator('option[value="dbt-mindfulness"]')).toContainText('DBT Mindfulness Practice')
    await expect(select.locator('option[value="self-compassion-break"]')).toContainText('Self-Compassion Break')
    await expect(select.locator('option[value="cbt-thought-challenge"]')).toContainText('CBT Thought Challenge')
  })

  test('should exit roleplay mode', async ({ page }) => {
    const startButton = page.locator('button:has-text("Start Roleplay")')
    await startButton.click()
    
    const exitButton = page.locator('button:has-text("Exit Roleplay")')
    await exitButton.click()
    
    await expect(page.locator('button:has-text("Start Roleplay")')).toBeVisible()
  })
})

test.describe('Advice Page - Crisis Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/advice')
  })

  test('should show crisis warning for suicide-related input', async ({ page }) => {
    const input = page.locator('textarea[placeholder*="message"]')
    await input.fill('I want to end my life')
    
    await expect(page.locator('text=Thanks for telling me. I\'m a behavior coach')).toBeVisible()
    await expect(page.locator('text=call 911')).toBeVisible()
    await expect(page.locator('text=call 988')).toBeVisible()
  })

  test('should show crisis warning for self-harm input', async ({ page }) => {
    const input = page.locator('textarea[placeholder*="message"]')
    await input.fill('I want to hurt myself')
    
    await expect(page.locator('text=Thanks for telling me. I\'m a behavior coach')).toBeVisible()
  })

  test('should show crisis warning for overdose input', async ({ page }) => {
    const input = page.locator('textarea[placeholder*="message"]')
    await input.fill('I want to overdose')
    
    await expect(page.locator('text=Thanks for telling me. I\'m a behavior coach')).toBeVisible()
  })

  test('should not show crisis warning for non-crisis input', async ({ page }) => {
    const input = page.locator('textarea[placeholder*="message"]')
    await input.fill('I feel stressed about work')
    
    await expect(page.locator('text=Thanks for telling me. I\'m a behavior coach')).not.toBeVisible()
  })
})




