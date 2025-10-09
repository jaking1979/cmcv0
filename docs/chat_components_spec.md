# Technical Spec Sheet — Chat Components (CMC Sober Coach)

This document provides a full reference for the **chat components** that were recently built and integrated into the onboarding and advice flows. It explains what each component does, how it was structured, and the rationale for future maintainers.

---

## 1. Overview

We extracted a **reusable chat system** from the onboarding page and refactored the advice page to also use it. The goal was **consistency across the app** — one unified chat UI, not separate implementations with slightly different styling and behavior.

Core components:

- **ChatPane** — the high-level container.
- **MessageList** — renders the conversation history.
- **MessageComposer** — handles input + send actions.
- **useChat hook (optional)** — provides state management convenience.

---

## 2. File Structure

```
src/components/chat/
  ChatPane.tsx         // Main orchestrator
  MessageList.tsx      // Messages rendering
  MessageComposer.tsx  // Text input + send button
  types.ts             // Shared type definitions
  useChat.ts           // Optional state hook
  index.ts             // Barrel export
```

---

## 3. Component Details

### 3.1 ChatPane

**Purpose:** The top-level chat layout that ties everything together.

**Props:**

- `messages: ChatMessage[]` — history of messages.
- `onSend: (text: string) => void` — handler when user submits.
- `isSending?: boolean` — disables input while sending.
- `inputValue?: string` — controlled input value.
- `onInputChange?: (text: string) => void` — handler for text change.
- `footer?: React.ReactNode` — optional disclaimer/extra info.
- `actionsLeft?: React.ReactNode` / `actionsRight?: React.ReactNode` — optional extra buttons.
- `variant?: 'default'|'compact'|'dense'` — spacing presets.
- `maxLength?: number` — character cap.
- `sendOnEnter?: boolean` — default true.
- `disabled?: boolean` — disables whole pane.
- `className?: string` — style overrides.
- `renderHTML?: boolean` — render messages as HTML (e.g. markdown rendering).

**Responsibilities:**

- Renders `MessageList` with the `messages` prop.
- Renders `MessageComposer` with input + send handling.
- Ensures consistent container styling across pages.
- Optionally renders a footer disclaimer.

---

### 3.2 MessageList

**Purpose:** Displays the message bubbles.

**Props:**

- `messages: ChatMessage[]` — array of `{ id, role, content }`.
- `showAvatars?: boolean` — show avatar placeholders.
- `systemStyle?: 'muted'|'hidden'` — control system messages.
- `className?: string` — style overrides.
- `renderHTML?: boolean` — if true, use `dangerouslySetInnerHTML` for content.

**Behavior:**

- Aligns messages left (assistant) or right (user).
- Bubbles styled differently:
  - **User:** blue background, white text.
  - **Assistant:** gray/white bubble with border.
- Handles streaming state gracefully (supports `Thinking…` or `▌` cursor messages).

---

### 3.3 MessageComposer

**Purpose:** Input area for typing + sending.

**Props:**

- `value?: string` — controlled text.
- `onChange?: (text: string) => void` — update handler.
- `onSend: (text: string) => void` — submit handler.
- `placeholder?: string` — input placeholder.
- `disabled?: boolean` — disable state.
- `isSending?: boolean` — shows sending state.
- `maxLength?: number` — limit characters.
- `sendOnEnter?: boolean` — press Enter to send (Shift+Enter for newline).
- `leftSlot?: React.ReactNode` — optional icon/button on left.
- `rightSlot?: React.ReactNode` — optional icon/button on right.
- `rows?: number` — default height.
- `className?: string` — styling override.

**Behavior:**

- Uses `<textarea>` to allow multi-line.
- Sends on Enter unless Shift+Enter.
- Can disable while message is sending.
- Extensible with slots for custom buttons (e.g., mic input, stop button).

---

### 3.4 useChat Hook (Optional)

**Purpose:** Provide a ready-to-use chat state manager.

**API:**

```ts
const { messages, input, setInput, send, isSending, clear } = useChat({ seed?: ChatMessage[] })
```

**Responsibilities:**

- Stores messages array.
- Tracks input state.
- Handles send events.
- Provides `isSending` flag for UI.

---

## 4. Integration Notes

### 4.1 Onboarding Page

- Previously had custom transcript + textarea.
- Replaced with `ChatPane` directly.
- Passed `renderHTML` so assistant replies could display markdown/HTML.
- Added footer disclaimer about behavior coaching.

### 4.2 Advice Page

- Previously had custom transcript + textarea + buttons.
- Refactored to use `ChatPane` while preserving streaming behavior:
  - Used a `paneMessages` mapping that augments `messages` with live `Thinking…` or streaming text + cursor.
- Kept demo scenario dropdown, action menu, and plan card intact.
- Mode toggle buttons (`Get Advice` vs `Just Chat`) remain outside ChatPane.

---

## 5. Styling Decisions

- **TailwindCSS + shadcn/ui** primitives.
- Consistent bubble styles across all pages.
- Responsive height: message area scrolls (min-h \~280px, max-h \~65vh).
- Accessible:
  - `aria-live="polite"` on message list for screen readers.
  - Focus + keyboard controls in composer.

---

## 6. Why This Matters

- **Consistency:** One source of truth for chat UI across onboarding, advice, and future modules.
- **Maintainability:** Fix once, propagate everywhere.
- **Extensibility:** Easy to add avatars, tooltips, timestamps, or reactions.
- **Accessibility:** Built-in screen reader + keyboard support.

---

## 7. Future Enhancements

- **Markdown rendering:** Swap raw HTML for a markdown-to-HTML parser.
- **Message metadata:** Add timestamps, tags (FOLLOWUP, ADVICE, etc.).
- **Animation:** Smooth fade/slide-in for new messages.
- **Suggestion chips:** Above composer for quick replies.
- **Theming:** Variants for light/dark, compact/dense.
- **Voice input:** Slot-in a mic button for speech-to-text.
- **Multi-role support:** Allow system or moderator roles.

---

## 8. Developer Notes & Memory Triggers

- **Streaming Support:** Advice page uses `paneMessages` to append `Thinking…` or partial text. If you see weird duplication, check `status` and `responseText` logic.
- **Crisis Banner:** Advice page keeps a crisis message separate from chat. Don’t try to bake it into ChatPane.
- **renderHTML:** Only turn on when messages come from a trusted markdown-to-HTML sanitizer, otherwise XSS risk.
- **Consistency with Nav:** This mirrors what we did earlier with extracting the TopNav component.
- **Known Pitfall:** When refactoring, we accidentally left duplicated components inside `onboarding/page.tsx`. Keep components isolated in `src/components/chat` only.
- **Pattern:** Keep business logic (phases, scenarios, crisis detection) outside ChatPane. Pass only the messages + send logic down.
- **Test Pages:** `/example-chat` is a safe playground to verify changes before touching onboarding/advice flows.
- **Keyboard UX:** Send = Enter, newline = Shift+Enter. This is consistent across pages.
- **Disclaimers:** Use the `footer` slot to inject contextual disclaimers (e.g., “Not therapy…”).

---

## 9. Summary

We now have a **modular, reusable chat system** that:

- Encapsulates all common chat functionality.
- Standardizes look + feel across pages.
- Supports streaming states and flexible behaviors.
- Provides a foundation for future expansion.

This spec should be used by future developers when making changes or extending chat functionality.

