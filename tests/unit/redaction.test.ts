// Unit tests for PII redaction

import { redactPII, containsPII, getPIISummary } from '@/server/util/redactPII'

describe('PII Redaction', () => {
  test('should redact email addresses', () => {
    const text = "Contact me at john.doe@example.com for more info"
    const result = redactPII(text)
    
    expect(result.redactedText).toBe("Contact me at [EMAIL_REDACTED] for more info")
    expect(result.redactedItems).toContain('john.doe@example.com')
  })

  test('should redact phone numbers', () => {
    const text = "Call me at 555-123-4567 or (555) 987-6543"
    const result = redactPII(text)
    
    expect(result.redactedText).toContain('[PHONE_REDACTED]')
    expect(result.redactedItems.length).toBeGreaterThanOrEqual(2)
  })

  test('should redact names', () => {
    const text = "John Smith and Jane Doe went to the store"
    const result = redactPII(text)
    
    expect(result.redactedText).toContain('[NAME_REDACTED]')
    expect(result.redactedItems.length).toBeGreaterThanOrEqual(1)
  })

  test('should not redact common false positives', () => {
    const text = "I went to New York High School"
    const result = redactPII(text)
    
    expect(result.redactedText).toBe(text) // Should not be redacted
    expect(result.redactedItems).toHaveLength(0)
  })

  test('should handle multiple types of PII', () => {
    const text = "John Smith can be reached at john@example.com or 555-123-4567"
    const result = redactPII(text)
    
    expect(result.redactedText).toContain('[NAME_REDACTED]')
    expect(result.redactedText).toContain('[EMAIL_REDACTED]')
    expect(result.redactedText).toContain('[PHONE_REDACTED]')
    expect(result.redactedItems.length).toBeGreaterThanOrEqual(3)
  })

  test('should respect custom options', () => {
    const text = "John Smith at john@example.com"
    const result = redactPII(text, { redactNames: false, redactEmails: true })
    
    expect(result.redactedText).toContain('John Smith') // Name not redacted
    expect(result.redactedText).toContain('[EMAIL_REDACTED]') // Email redacted
  })
})

describe('PII Detection', () => {
  test('should detect PII presence', () => {
    expect(containsPII("Contact john@example.com")).toBe(true)
    expect(containsPII("Call 555-123-4567")).toBe(true)
    expect(containsPII("John Smith said hello")).toBe(true)
    expect(containsPII("Just a regular message")).toBe(false)
  })

  test('should provide PII summary', () => {
    const text = "John Smith at john@example.com, call 555-123-4567"
    const summary = getPIISummary(text)
    
    expect(summary.hasEmails).toBe(true)
    expect(summary.hasPhones).toBe(true)
    expect(summary.hasNames).toBe(true)
    expect(summary.count).toBeGreaterThanOrEqual(3)
  })

  test('should handle empty text', () => {
    const result = redactPII("")
    
    expect(result.redactedText).toBe("")
    expect(result.redactedItems).toHaveLength(0)
  })

  test('should handle text with no PII', () => {
    const text = "This is just a regular message with no personal information"
    const result = redactPII(text)
    
    expect(result.redactedText).toBe(text)
    expect(result.redactedItems).toHaveLength(0)
  })
})




