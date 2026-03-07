'use client'

import { useEffect, useState } from 'react'

/**
 * Detects whether the iOS soft keyboard is open.
 *
 * Strategy: `focusin` / `focusout` events on textarea / input elements.
 *
 * Why not `visualViewport.resize`?
 * On iOS PWA (home-screen apps), `visualViewport.resize` does not fire
 * reliably when the soft keyboard opens — the event is simply never dispatched.
 * Focus events are synchronous, always fired, and accurate enough for our
 * single-composer UI.
 *
 * The primary layout fix (root div fills only the visible area above the
 * keyboard) is handled via CSS `position: fixed; inset: 0` — no JS needed
 * for that part. This hook's sole job is to hide the bottom nav so the
 * keyboard doesn't overlap it.
 */
export function useVisualViewport() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as Element
      if (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT') {
        setIsKeyboardOpen(true)
        // #region agent log
        console.log(
          '[DEBUG useVisualViewport] KEYBOARD OPEN via focusin',
          'tag=', t.tagName,
          'vv.height=', window.visualViewport?.height,
          'window.innerHeight=', window.innerHeight,
        )
        // #endregion
      }
    }

    const onFocusOut = (e: FocusEvent) => {
      const t = e.target as Element
      if (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT') {
        // Slight delay avoids a flicker if focus moves between inputs
        setTimeout(() => setIsKeyboardOpen(false), 150)
        // #region agent log
        console.log(
          '[DEBUG useVisualViewport] KEYBOARD CLOSE via focusout',
          'tag=', t.tagName,
          'vv.height=', window.visualViewport?.height,
          'window.innerHeight=', window.innerHeight,
        )
        // #endregion
      }
    }

    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  return { isKeyboardOpen }
}
