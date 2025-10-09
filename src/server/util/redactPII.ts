/**
 * PII Redaction Utility
 * Redacts personally identifiable information from text to protect user privacy
 */

// Email pattern
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g

// Phone number patterns (US formats)
const PHONE_PATTERNS = [
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,           // 123-456-7890, 123.456.7890, 123 456 7890
  /\b\(\d{3}\)\s?\d{3}[-.\s]?\d{4}\b/g,           // (123) 456-7890
  /\b\d{10}\b/g,                                    // 1234567890
]

// SSN pattern
const SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b/g

// Credit card pattern (basic)
const CC_PATTERN = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g

// Address patterns (street numbers + street names)
const ADDRESS_PATTERN = /\b\d{1,5}\s+[\w\s]{3,30}(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct|circle|cir|way)\b/gi

// Name patterns (common patterns like "my name is X" or "I'm X")
const NAME_INTRO_PATTERNS = [
  /(?:my name is|i'm|i am|call me|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:^|\s)([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s+here|\s+speaking|$)/g,
]

/**
 * Redact email addresses from text
 */
export function redactEmails(text: string): string {
  return text.replace(EMAIL_PATTERN, '[EMAIL_REDACTED]')
}

/**
 * Redact phone numbers from text
 */
export function redactPhones(text: string): string {
  let result = text
  for (const pattern of PHONE_PATTERNS) {
    result = result.replace(pattern, '[PHONE_REDACTED]')
  }
  return result
}

/**
 * Redact SSNs from text
 */
export function redactSSN(text: string): string {
  return text.replace(SSN_PATTERN, '[SSN_REDACTED]')
}

/**
 * Redact credit card numbers from text
 */
export function redactCreditCards(text: string): string {
  return text.replace(CC_PATTERN, '[CC_REDACTED]')
}

/**
 * Redact street addresses from text
 */
export function redactAddresses(text: string): string {
  return text.replace(ADDRESS_PATTERN, '[ADDRESS_REDACTED]')
}

/**
 * Redact names introduced in common patterns
 */
export function redactNameIntros(text: string): string {
  let result = text
  for (const pattern of NAME_INTRO_PATTERNS) {
    result = result.replace(pattern, (match, name) => {
      return match.replace(name, '[NAME_REDACTED]')
    })
  }
  return result
}

/**
 * Comprehensive PII redaction
 * Redacts emails, phones, SSNs, credit cards, addresses, and name introductions
 */
export function redactPII(text: string): string {
  if (!text || typeof text !== 'string') {
    return text
  }

  let result = text
  
  // Apply all redaction patterns
  result = redactEmails(result)
  result = redactPhones(result)
  result = redactSSN(result)
  result = redactCreditCards(result)
  result = redactAddresses(result)
  result = redactNameIntros(result)
  
  return result
}

/**
 * Check if text contains potential PII
 * Returns true if any PII patterns are detected
 */
export function containsPII(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false
  }

  // Check for emails
  if (EMAIL_PATTERN.test(text)) return true
  
  // Check for phones
  for (const pattern of PHONE_PATTERNS) {
    if (pattern.test(text)) return true
  }
  
  // Check for SSN
  if (SSN_PATTERN.test(text)) return true
  
  // Check for credit cards
  if (CC_PATTERN.test(text)) return true
  
  // Check for addresses
  if (ADDRESS_PATTERN.test(text)) return true
  
  return false
}

/**
 * Redact PII from an array of messages
 */
export function redactMessages<T extends { role: string; content: string }>(messages: T[]): T[] {
  return messages.map(msg => ({
    ...msg,
    content: redactPII(msg.content)
  })) as T[]
}

/**
 * Redact PII from a conversation transcript
 */
export function redactTranscript(transcript: string): string {
  return redactPII(transcript)
}
