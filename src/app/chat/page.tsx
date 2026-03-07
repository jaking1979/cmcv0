import { redirect } from 'next/navigation'

/** /chat now redirects to the main advice/chat screen */
export default function ChatPage() {
  redirect('/advice')
}
