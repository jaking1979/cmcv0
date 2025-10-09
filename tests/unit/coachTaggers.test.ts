// Unit tests for coach taggers

import { extractDBTTags } from '@/server/ai/coaches/dbtCoach'
import { extractSelfCompassionTags } from '@/server/ai/coaches/selfCompassionCoach'
import { extractCBTTags } from '@/server/ai/coaches/cbtCoach'

describe('DBT Coach Taggers', () => {
  test('should detect emotional dysregulation', () => {
    const message = "I feel so overwhelmed and out of control right now"
    const tags = extractDBTTags(message, 'user')
    
    expect(tags).toHaveLength(1)
    expect(tags[0].type).toBe('emotion')
    expect(tags[0].value).toBe('emotional-dysregulation')
    expect(tags[0].confidence).toBeGreaterThan(0.7)
  })

  test('should detect distress tolerance needs', () => {
    const message = "I'm in crisis and need relief now"
    const tags = extractDBTTags(message, 'user')
    
    expect(tags).toHaveLength(1)
    expect(tags[0].type).toBe('coping-strategy')
    expect(tags[0].value).toBe('distress-tolerance-needed')
    expect(tags[0].confidence).toBeGreaterThan(0.8)
  })

  test('should detect interpersonal effectiveness opportunities', () => {
    const message = "I had a fight with my partner and don't know how to set boundaries"
    const tags = extractDBTTags(message, 'user')
    
    expect(tags).toHaveLength(1)
    expect(tags[0].type).toBe('behavior')
    expect(tags[0].value).toBe('interpersonal-skills')
    expect(tags[0].confidence).toBeGreaterThan(0.6)
  })

  test('should detect mindfulness opportunities', () => {
    const message = "My mind is racing and I can't stop overthinking"
    const tags = extractDBTTags(message, 'user')
    
    expect(tags).toHaveLength(1)
    expect(tags[0].type).toBe('behavior')
    expect(tags[0].value).toBe('mindfulness-needed')
    expect(tags[0].confidence).toBeGreaterThan(0.7)
  })

  test('should return empty array for irrelevant messages', () => {
    const message = "The weather is nice today"
    const tags = extractDBTTags(message, 'user')
    
    expect(tags).toHaveLength(0)
  })
})

describe('Self-Compassion Coach Taggers', () => {
  test('should detect self-criticism', () => {
    const message = "I'm such a failure and worthless"
    const tags = extractSelfCompassionTags(message, 'user')
    
    expect(tags).toHaveLength(1)
    expect(tags[0].type).toBe('emotion')
    expect(tags[0].value).toBe('self-criticism')
    expect(tags[0].confidence).toBeGreaterThan(0.8)
  })

  test('should detect perfectionism', () => {
    const message = "I need to be perfect or it's all or nothing"
    const tags = extractSelfCompassionTags(message, 'user')
    
    expect(tags).toHaveLength(1)
    expect(tags[0].type).toBe('behavior')
    expect(tags[0].value).toBe('perfectionism')
    expect(tags[0].confidence).toBeGreaterThan(0.7)
  })

  test('should detect isolation thinking', () => {
    const message = "I'm the only one who struggles with this"
    const tags = extractSelfCompassionTags(message, 'user')
    
    expect(tags).toHaveLength(1)
    expect(tags[0].type).toBe('emotion')
    expect(tags[0].value).toBe('isolation-thinking')
    expect(tags[0].confidence).toBeGreaterThan(0.7)
  })

  test('should detect shame', () => {
    const message = "I feel so ashamed and disgusted with myself"
    const tags = extractSelfCompassionTags(message, 'user')
    
    expect(tags).toHaveLength(1)
    expect(tags[0].type).toBe('emotion')
    expect(tags[0].value).toBe('shame')
    expect(tags[0].confidence).toBeGreaterThan(0.8)
  })

  test('should detect self-compassionate language', () => {
    const message = "I'm trying to be kind to myself and treat myself gently"
    const tags = extractSelfCompassionTags(message, 'user')
    
    expect(tags).toHaveLength(1)
    expect(tags[0].type).toBe('strengths')
    expect(tags[0].value).toBe('self-compassion-practice')
    expect(tags[0].confidence).toBeGreaterThan(0.8)
  })
})

describe('CBT Coach Taggers', () => {
  test('should detect cognitive distortions', () => {
    const message = "I always mess up and never get anything right"
    const tags = extractCBTTags(message, 'user')
    
    expect(tags).toHaveLength(1)
    expect(tags[0].type).toBe('behavior')
    expect(tags[0].value).toBe('cognitive-distortion')
    expect(tags[0].confidence).toBeGreaterThan(0.7)
  })

  test('should detect avoidance behaviors', () => {
    const message = "I avoid social situations and put off difficult tasks"
    const tags = extractCBTTags(message, 'user')
    
    expect(tags).toHaveLength(1)
    expect(tags[0].type).toBe('behavior')
    expect(tags[0].value).toBe('avoidance')
    expect(tags[0].confidence).toBeGreaterThan(0.7)
  })

  test('should detect anxiety thoughts', () => {
    const message = "I'm worried about what if something goes wrong"
    const tags = extractCBTTags(message, 'user')
    
    expect(tags).toHaveLength(1)
    expect(tags[0].type).toBe('emotion')
    expect(tags[0].value).toBe('anxiety-thoughts')
    expect(tags[0].confidence).toBeGreaterThan(0.6)
  })

  test('should detect behavioral activation needs', () => {
    const message = "I don't feel like doing anything and can't get started"
    const tags = extractCBTTags(message, 'user')
    
    expect(tags).toHaveLength(1)
    expect(tags[0].type).toBe('behavior')
    expect(tags[0].value).toBe('behavioral-activation-needed')
    expect(tags[0].confidence).toBeGreaterThan(0.7)
  })

  test('should detect problem-solving needs', () => {
    const message = "I don't know what to do and can't figure out a solution"
    const tags = extractCBTTags(message, 'user')
    
    expect(tags).toHaveLength(1)
    expect(tags[0].type).toBe('behavior')
    expect(tags[0].value).toBe('problem-solving-needed')
    expect(tags[0].confidence).toBeGreaterThan(0.7)
  })

  test('should detect evidence-based thinking', () => {
    const message = "Let me look at the evidence and test this thought"
    const tags = extractCBTTags(message, 'user')
    
    expect(tags).toHaveLength(1)
    expect(tags[0].type).toBe('strengths')
    expect(tags[0].value).toBe('evidence-based-thinking')
    expect(tags[0].confidence).toBeGreaterThan(0.6)
  })
})

