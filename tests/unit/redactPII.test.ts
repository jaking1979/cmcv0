/**
 * Unit tests for PII redaction utility
 */

import { describe, it, expect } from '@jest/globals'
import {
  redactPII,
  redactEmails,
  redactPhones,
  redactSSN,
  redactCreditCards,
  redactAddresses,
  containsPII,
  redactMessages,
} from '../../src/server/util/redactPII'

describe('PII Redaction', () => {
  describe('redactEmails', () => {
    it('should redact email addresses', () => {
      const text = 'Contact me at john.doe@example.com for more info'
      const result = redactEmails(text)
      expect(result).toBe('Contact me at [EMAIL_REDACTED] for more info')
    })

    it('should redact multiple emails', () => {
      const text = 'Email john@example.com or jane@test.org'
      const result = redactEmails(text)
      expect(result).toContain('[EMAIL_REDACTED]')
      expect(result).not.toContain('john@example.com')
      expect(result).not.toContain('jane@test.org')
    })
  })

  describe('redactPhones', () => {
    it('should redact phone numbers with dashes', () => {
      const text = 'Call me at 555-123-4567'
      const result = redactPhones(text)
      expect(result).toBe('Call me at [PHONE_REDACTED]')
    })

    it('should redact phone numbers with parentheses', () => {
      const text = 'My number is (555) 123-4567'
      const result = redactPhones(text)
      expect(result).toBe('My number is [PHONE_REDACTED]')
    })

    it('should redact 10-digit phone numbers', () => {
      const text = 'Text 5551234567'
      const result = redactPhones(text)
      expect(result).toBe('Text [PHONE_REDACTED]')
    })
  })

  describe('redactSSN', () => {
    it('should redact social security numbers', () => {
      const text = 'My SSN is 123-45-6789'
      const result = redactSSN(text)
      expect(result).toBe('My SSN is [SSN_REDACTED]')
    })
  })

  describe('redactCreditCards', () => {
    it('should redact credit card numbers', () => {
      const text = 'Card number: 1234 5678 9012 3456'
      const result = redactCreditCards(text)
      expect(result).toBe('Card number: [CC_REDACTED]')
    })

    it('should redact credit cards with dashes', () => {
      const text = 'Card: 1234-5678-9012-3456'
      const result = redactCreditCards(text)
      expect(result).toBe('Card: [CC_REDACTED]')
    })
  })

  describe('redactAddresses', () => {
    it('should redact street addresses', () => {
      const text = 'I live at 123 Main Street'
      const result = redactAddresses(text)
      expect(result).toBe('I live at [ADDRESS_REDACTED]')
    })

    it('should redact various street types', () => {
      const tests = [
        '456 Oak Avenue',
        '789 Elm Road',
        '321 Pine Boulevard',
        '654 Maple Lane',
      ]

      for (const address of tests) {
        const result = redactAddresses(`My address is ${address}`)
        expect(result).toContain('[ADDRESS_REDACTED]')
        expect(result).not.toContain(address)
      }
    })
  })

  describe('redactPII', () => {
    it('should redact all PII types in one pass', () => {
      const text = `Hi, I'm John Doe. 
        Email me at john@example.com or call 555-123-4567.
        I live at 123 Main Street.
        My SSN is 123-45-6789.`

      const result = redactPII(text)
      
      expect(result).toContain('[EMAIL_REDACTED]')
      expect(result).toContain('[PHONE_REDACTED]')
      expect(result).toContain('[ADDRESS_REDACTED]')
      expect(result).toContain('[SSN_REDACTED]')
      expect(result).not.toContain('john@example.com')
      expect(result).not.toContain('555-123-4567')
    })

    it('should handle empty or invalid input', () => {
      expect(redactPII('')).toBe('')
      expect(redactPII(null as any)).toBe(null)
      expect(redactPII(undefined as any)).toBe(undefined)
    })

    it('should preserve non-PII text', () => {
      const text = 'I feel overwhelmed and need help with my drinking'
      const result = redactPII(text)
      expect(result).toBe(text)
    })
  })

  describe('containsPII', () => {
    it('should detect emails', () => {
      expect(containsPII('Contact john@example.com')).toBe(true)
    })

    it('should detect phone numbers', () => {
      expect(containsPII('Call 555-123-4567')).toBe(true)
    })

    it('should detect addresses', () => {
      expect(containsPII('123 Main Street')).toBe(true)
    })

    it('should return false for clean text', () => {
      expect(containsPII('I need help with my drinking')).toBe(false)
    })
  })

  describe('redactMessages', () => {
    it('should redact PII from message array', () => {
      const messages = [
        { role: 'user', content: 'My email is john@example.com' },
        { role: 'assistant', content: 'Thanks for sharing' },
        { role: 'user', content: 'Call me at 555-123-4567' },
      ]

      const result = redactMessages(messages)
      
      expect(result[0].content).toContain('[EMAIL_REDACTED]')
      expect(result[0].content).not.toContain('john@example.com')
      expect(result[1].content).toBe('Thanks for sharing')
      expect(result[2].content).toContain('[PHONE_REDACTED]')
    })
  })

  describe('Edge cases', () => {
    it('should not redact partial matches', () => {
      // "good" should not match as "od" (overdose)
      const text = 'I feel good today'
      const result = redactPII(text)
      expect(result).toBe(text)
    })

    it('should handle text with multiple PII instances', () => {
      const text = 'john@example.com and jane@test.org'
      const result = redactPII(text)
      expect(result).toBe('[EMAIL_REDACTED] and [EMAIL_REDACTED]')
    })
  })
})


