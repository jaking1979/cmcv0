// src/app/page.tsx
import { redirect } from 'next/navigation'

/**
 * The root route redirects directly to the Chat (advice) screen,
 * which is the app's primary experience.
 */
export default function Home() {
  redirect('/advice')
}
