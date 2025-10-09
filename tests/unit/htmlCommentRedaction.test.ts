// Unit tests for HTML comment redaction

// Mock the stripHtmlComments function from onboarding route
function stripHtmlComments(text: string): string {
  return text.replace(/<!--[^>]*-->/g, '').trim()
}

describe('HTML Comment Redaction', () => {
  test('should strip OFFER_SUMMARY comments', () => {
    const text = "I can draft a brief intake summary from what we've discussed. Would you like to see it now? <!--OFFER_SUMMARY-->"
    const cleaned = stripHtmlComments(text)
    
    expect(cleaned).toBe("I can draft a brief intake summary from what we've discussed. Would you like to see it now?")
    expect(cleaned).not.toContain('<!--OFFER_SUMMARY-->')
  })

  test('should strip SUMMARY_DONE comments', () => {
    const text = "Here is your intake summary...\n\n<!--SUMMARY_DONE-->"
    const cleaned = stripHtmlComments(text)
    
    expect(cleaned).toBe("Here is your intake summary...")
    expect(cleaned).not.toContain('<!--SUMMARY_DONE-->')
  })

  test('should strip multiple HTML comments', () => {
    const text = "Some text <!--COMMENT1--> more text <!--COMMENT2--> end text"
    const cleaned = stripHtmlComments(text)
    
    expect(cleaned).toBe("Some text  more text  end text")
    expect(cleaned).not.toContain('<!--')
    expect(cleaned).not.toContain('-->')
  })

  test('should handle nested comments', () => {
    const text = "Text <!--outer <!--inner--> comment--> more text"
    const cleaned = stripHtmlComments(text)
    
    expect(cleaned).toBe("Text  more text")
    expect(cleaned).not.toContain('<!--')
    expect(cleaned).not.toContain('-->')
  })

  test('should handle empty comments', () => {
    const text = "Text <!----> more text"
    const cleaned = stripHtmlComments(text)
    
    expect(cleaned).toBe("Text  more text")
  })

  test('should handle comments with special characters', () => {
    const text = "Text <!--comment with <>&\"'--> more text"
    const cleaned = stripHtmlComments(text)
    
    expect(cleaned).toBe("Text  more text")
  })

  test('should preserve text without comments', () => {
    const text = "This is just regular text with no comments"
    const cleaned = stripHtmlComments(text)
    
    expect(cleaned).toBe(text)
  })

  test('should handle empty string', () => {
    const cleaned = stripHtmlComments('')
    expect(cleaned).toBe('')
  })

  test('should handle only comments', () => {
    const text = "<!--ONLY_COMMENT-->"
    const cleaned = stripHtmlComments(text)
    
    expect(cleaned).toBe('')
  })

  test('should handle malformed comments', () => {
    const text = "Text <!--unclosed comment"
    const cleaned = stripHtmlComments(text)
    
    // Should not remove malformed comments
    expect(cleaned).toBe(text)
  })

  test('should handle comments at start and end', () => {
    const text = "<!--START-->Middle text<!--END-->"
    const cleaned = stripHtmlComments(text)
    
    expect(cleaned).toBe("Middle text")
  })

  test('should preserve legitimate angle brackets', () => {
    const text = "Use < and > symbols in your text"
    const cleaned = stripHtmlComments(text)
    
    expect(cleaned).toBe(text)
  })

  test('should handle real-world onboarding scenarios', () => {
    const scenarios = [
      {
        input: "I can draft a brief intake summary from what we've discussed. Would you like to see it now? <!--OFFER_SUMMARY-->",
        expected: "I can draft a brief intake summary from what we've discussed. Would you like to see it now?"
      },
      {
        input: "# Intake Summary\n\nThis is your summary...\n\n<!--SUMMARY_DONE-->",
        expected: "# Intake Summary\n\nThis is your summary..."
      },
      {
        input: "Thanks for sharing. <!--INTERNAL_NOTE: user seems engaged--> What would you like to focus on?",
        expected: "Thanks for sharing.  What would you like to focus on?"
      }
    ]

    scenarios.forEach(({ input, expected }) => {
      const cleaned = stripHtmlComments(input)
      expect(cleaned).toBe(expected)
    })
  })
})




