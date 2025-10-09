// Unit tests for roleplay loader

import { validateRoleplay, clearRoleplayCache } from '@/server/roleplays/loader'

describe('Roleplay Loader', () => {
  beforeEach(() => {
    clearRoleplayCache()
  })

  test('should validate valid roleplay structure', () => {
    const validRoleplay = {
      id: 'test-roleplay',
      title: 'Test Roleplay',
      tags: ['test', 'example'],
      steps: [
        {
          role: 'assistant',
          kind: 'reflection',
          text: 'Welcome to this practice scenario.'
        },
        {
          role: 'user',
          kind: 'assistantPlain',
          text: 'I understand.'
        },
        {
          role: 'assistant',
          kind: 'actionMenu',
          text: {
            options: [
              { label: 'Option 1', value: 'option1' },
              { label: 'Option 2', value: 'option2' }
            ]
          }
        }
      ]
    }

    expect(() => validateRoleplay(validRoleplay)).not.toThrow()
    const validated = validateRoleplay(validRoleplay)
    expect(validated.id).toBe('test-roleplay')
    expect(validated.title).toBe('Test Roleplay')
    expect(validated.steps).toHaveLength(3)
  })

  test('should reject roleplay with invalid role', () => {
    const invalidRoleplay = {
      id: 'test-roleplay',
      title: 'Test Roleplay',
      steps: [
        {
          role: 'invalid-role',
          kind: 'reflection',
          text: 'Welcome to this practice scenario.'
        }
      ]
    }

    expect(() => validateRoleplay(invalidRoleplay)).toThrow()
  })

  test('should reject roleplay with invalid kind', () => {
    const invalidRoleplay = {
      id: 'test-roleplay',
      title: 'Test Roleplay',
      steps: [
        {
          role: 'assistant',
          kind: 'invalid-kind',
          text: 'Welcome to this practice scenario.'
        }
      ]
    }

    expect(() => validateRoleplay(invalidRoleplay)).toThrow()
  })

  test('should reject roleplay with invalid action menu structure', () => {
    const invalidRoleplay = {
      id: 'test-roleplay',
      title: 'Test Roleplay',
      steps: [
        {
          role: 'assistant',
          kind: 'actionMenu',
          text: {
            options: [
              { label: 'Option 1' } // Missing 'value' field
            ]
          }
        }
      ]
    }

    expect(() => validateRoleplay(invalidRoleplay)).toThrow()
  })

  test('should reject roleplay without required fields', () => {
    const invalidRoleplay = {
      title: 'Test Roleplay',
      steps: []
      // Missing 'id' field
    }

    expect(() => validateRoleplay(invalidRoleplay)).toThrow()
  })

  test('should accept roleplay with optional tags', () => {
    const roleplayWithoutTags = {
      id: 'test-roleplay',
      title: 'Test Roleplay',
      steps: [
        {
          role: 'assistant',
          kind: 'reflection',
          text: 'Welcome to this practice scenario.'
        }
      ]
    }

    expect(() => validateRoleplay(roleplayWithoutTags)).not.toThrow()
    const validated = validateRoleplay(roleplayWithoutTags)
    expect(validated.tags).toBeUndefined()
  })

  test('should accept roleplay with empty steps array', () => {
    const roleplayWithEmptySteps = {
      id: 'test-roleplay',
      title: 'Test Roleplay',
      steps: []
    }

    expect(() => validateRoleplay(roleplayWithEmptySteps)).not.toThrow()
    const validated = validateRoleplay(roleplayWithEmptySteps)
    expect(validated.steps).toHaveLength(0)
  })

  test('should handle mixed text types in steps', () => {
    const mixedRoleplay = {
      id: 'test-roleplay',
      title: 'Test Roleplay',
      steps: [
        {
          role: 'assistant',
          kind: 'reflection',
          text: 'This is a string text.'
        },
        {
          role: 'assistant',
          kind: 'actionMenu',
          text: {
            options: [
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' }
            ]
          }
        }
      ]
    }

    expect(() => validateRoleplay(mixedRoleplay)).not.toThrow()
    const validated = validateRoleplay(mixedRoleplay)
    expect(typeof validated.steps[0].text).toBe('string')
    expect(typeof validated.steps[1].text).toBe('object')
  })

  test('should validate action menu options structure', () => {
    const roleplayWithActionMenu = {
      id: 'test-roleplay',
      title: 'Test Roleplay',
      steps: [
        {
          role: 'assistant',
          kind: 'actionMenu',
          text: {
            options: [
              { label: 'Continue', value: 'continue' },
              { label: 'Skip', value: 'skip' },
              { label: 'Help', value: 'help' }
            ]
          }
        }
      ]
    }

    expect(() => validateRoleplay(roleplayWithActionMenu)).not.toThrow()
    const validated = validateRoleplay(roleplayWithActionMenu)
    const actionMenu = validated.steps[0].text as any
    expect(actionMenu.options).toHaveLength(3)
    expect(actionMenu.options[0]).toEqual({ label: 'Continue', value: 'continue' })
  })

  test('should reject action menu with empty options', () => {
    const invalidRoleplay = {
      id: 'test-roleplay',
      title: 'Test Roleplay',
      steps: [
        {
          role: 'assistant',
          kind: 'actionMenu',
          text: {
            options: []
          }
        }
      ]
    }

    expect(() => validateRoleplay(invalidRoleplay)).toThrow()
  })

  test('should handle all valid step kinds', () => {
    const allKindsRoleplay = {
      id: 'test-roleplay',
      title: 'Test Roleplay',
      steps: [
        { role: 'assistant', kind: 'reflection', text: 'Reflection step' },
        { role: 'assistant', kind: 'validation', text: 'Validation step' },
        { role: 'assistant', kind: 'followup', text: 'Follow-up step' },
        { role: 'assistant', kind: 'assistantPlain', text: 'Plain assistant step' },
        { role: 'user', kind: 'assistantPlain', text: 'User step' }
      ]
    }

    expect(() => validateRoleplay(allKindsRoleplay)).not.toThrow()
    const validated = validateRoleplay(allKindsRoleplay)
    expect(validated.steps).toHaveLength(5)
  })
})




