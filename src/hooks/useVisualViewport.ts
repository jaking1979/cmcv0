'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Tracks the visual viewport height to handle iOS PWA soft-keyboard layout.
 *
 * Problem: On iOS PWA, when the soft keyboard opens, the layout viewport
 * (100dvh) does NOT shrink. Instead, iOS scrolls the document body upward to
 * keep the focused element visible — sending the entire chat UI off the top of
 * the screen. `visualViewport.height` correctly reports only the visible area
 * above the keyboard, so we use it to size the root container explicitly.
 */
export function useVisualViewport() {
  const [height, setHeight] = useState<number | null>(null)
  const initialHeightRef = useRef<number | null>(null)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const update = () => {
      const h = vv.height
      // Capture baseline on first call (before keyboard ever opens)
      if (initialHeightRef.current === null) {
        initialHeightRef.current = h
      }
      setHeight(h)

      // #region agent log
      console.log(
        '[DEBUG useVisualViewport] vv.height=', h,
        'baseline=', initialHeightRef.current,
        'diff=', initialHeightRef.current != null ? Math.round(initialHeightRef.current - h) : 0,
        'window.innerHeight=', window.innerHeight,
        'window.scrollY=', Math.round(window.scrollY),
      )
      // #endregion
    }

    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    update()

    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  // Keyboard is considered open when height has shrunk >100px from baseline
  const isKeyboardOpen =
    initialHeightRef.current !== null &&
    height !== null &&
    height < initialHeightRef.current - 100

  return { height, isKeyboardOpen }
}
