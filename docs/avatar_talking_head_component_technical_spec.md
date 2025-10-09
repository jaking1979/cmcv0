# Avatar Talking Head Component – Technical Spec

Last updated: {{today}}

## 1) Purpose & Overview

A lightweight, dependency‑free React component that renders a stylized “talking head” avatar for the **Learn** module. It differentiates **AI narration** (avatar + animated mouth/eyes/head‑bob) from **static lesson text**. Built for Next.js/React with Tailwind.

- **Primary components**: `AvatarTalkingHead`, `LessonGuide`.
- **Usage modes**: simple looping animation while `speaking=true`; pluggable to real TTS/viseme events later.
- **Design goals**: accessibility, theming, zero external animation libs, minimal CPU.

---

## 2) File Locations & Naming

```
public/
  assets/
    josh-avatar.png          # exported cartoon avatar (512–1024 px)
src/
  components/
    lesson/
      AvatarTalkingHead.tsx  # core animated avatar (eyes+mouth+head bob)
      LessonGuide.tsx        # layout wrapper pairing avatar with AI text bubble
```

> **Note:** If you prefer image imports, you can also place the asset in `/src/assets` and use Next Image. Using `/public` keeps it framework‑agnostic and easy to swap.

---

## 3) Component API

### 3.1 `AvatarTalkingHead`

**Path**: `@/components/lesson/AvatarTalkingHead`

**Props**

| Prop          | Type      | Default                   | Description                                                         |
| ------------- | --------- | ------------------------- | ------------------------------------------------------------------- |
| `src`         | `string`  | `/assets/josh-avatar.png` | Avatar image URL served from `public`.                              |
| `alt`         | `string`  | `"Coach avatar"`          | Accessible alt text for base image.                                 |
| `size`        | `number`  | `160`                     | Render box in pixels (width = height).                              |
| `speaking`    | `boolean` | `false`                   | Toggles mouth loop + subtle head bob.                               |
| `loopBlinkMs` | `number`  | `4800`                    | Average blink interval (ms). Adds random jitter for natural effect. |
| `className`   | `string`  | `""`                      | Extra class names for the outer wrapper.                            |

**Children**: none

**Returns**: `<div>` with base `<img>` and two absolutely‑positioned SVG overlays (eyes, mouth).

### 3.2 `LessonGuide`

**Path**: `@/components/lesson/LessonGuide`

**Props**

| Prop        | Type              | Default     | Description                                                                      |
| ----------- | ----------------- | ----------- | -------------------------------------------------------------------------------- |
| `children`  | `React.ReactNode` | —           | The AI narration or lesson content to display in the bubble.                     |
| `speaking`  | `boolean`         | `true`      | Pass‑through to `AvatarTalkingHead` to animate while content is being delivered. |
| `title`     | `string`          | `undefined` | Optional heading above the avatar + bubble.                                      |
| `className` | `string`          | `""`        | Extra classes for root `<section>`.                                              |

**Children**: rich content allowed (paragraphs, lists, links, etc.)

---

## 4) Visual/Animation Behavior

- **Head bob**: when `speaking=true`, image translates up by \~2px with a short ease; returns to rest when false.
- **Blink**: a timed loop creates eyelid rectangles over the eye coordinates for \~120ms; interval uses base `loopBlinkMs` + random jitter (0–1200ms).
- **Mouth shapes**: 3 phases (closed → mid → open → mid) cycled every \~120ms when `speaking=true`. Implemented as SVG shapes positioned over the mouth region.
- **Position tuning**: If facial geometry changes (new avatar), tweak the `x/y/cx/cy/rx/ry` values in the SVG overlays.

**Performance considerations**

- Small, infrequent DOM updates (stateful timers only when `speaking=true`).
- SVG overlays avoid layout shifts and keep GPU paints cheap.
- Size bounded container prevents layout thrash.

---

## 5) Accessibility

- Base `<img>` has meaningful `alt` text.
- `LessonGuide` wraps content in a bubble with `aria-live="polite"` to announce updates (useful if narration text streams in).
- Color contrast is acceptable in light/dark via Tailwind utility classes; verify your theme tokens.

---

## 6) Theming

- Bubble background: `bg-blue-50 dark:bg-blue-950/40` with subtle border `ring-1`. Swap color tokens to distinguish **AI narration** vs **curriculum text**.
- Avatar size: controlled via `size` prop; container scales the SVG overlays accordingly.
- Shadows/borders: adjust Tailwind classes in `LessonGuide` root and bubble.

---

## 7) Example Usage

```tsx
import LessonGuide from "@/components/lesson/LessonGuide";

export default function LessonPage() {
  const speaking = true; // or derive from typewriter/TTS state
  return (
    <main className="p-6 space-y-6">
      <LessonGuide title="Today’s Skill: Urge Surfing" speaking={speaking}>
        <p className="mb-2">
          When a craving rises, imagine it like a wave. You ride it until it passes.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Notice the first sign of the urge.</li>
          <li>Slow your breath: in 4, hold 2, out 6.</li>
          <li>Name two sensations without judging them.</li>
        </ul>
      </LessonGuide>
    </main>
  );
}
```

---

## 8) State Control Patterns

- **Text typewriter**: set `speaking=true` while characters stream; `false` when complete.
- **Audio narration**: set `speaking` from `<audio>` events (`play`, `pause`, `ended`). Future upgrade: wire viseme events to mouth phases.
- **Multi‑step lessons**: maintain `speaking` per step; reset to `false` on step transition for clarity.

---

## 9) Integration with Chat/Advice Components

- Use `LessonGuide` only in **Learn** flows to visually separate AI narration from chat user bubbles.
- For chat pages, keep using the existing chat components; optionally embed a smaller `AvatarTalkingHead` (size 96–120) as an inline guide badge.

---

## 10) Testing & QA Checklist

- **Layout**: at 320px, 768px, 1024px widths the layout remains readable and the avatar doesn’t overflow.
- **Performance**: throttle CPU in DevTools; ensure smooth animation and <2% CPU in idle.
- **A11y**: screen reader announces updates in `LessonGuide` without repeating entire page; tab order sane.
- **Dark mode**: verify bubble/background contrast meets WCAG AA for text size.
- **Avatar swaps**: replace `src` with another image and re‑tune SVG overlay positions if needed.

---

## 11) Extensibility Roadmap

- **Sprite‑sheet mouths**: replace SVG shapes with PNG sprite atlas; animate via CSS `steps()` for smoother visemes.
- **Phoneme/viseme mapping**: accept `{ viseme: number }` or `{ phoneme: string }` and map to 5–8 mouth shapes.
- **Emotion states**: props like `mood="neutral|happy|concerned"` toggle eyebrow/eye shapes.
- **Lottie export**: optional Lottie JSON for teams preferring After Effects pipelines (requires lottie‑react runtime).
- **Next/Image**: swap `<img>` for `next/image` if you want built‑in optimization.

---

## 12) Known Limitations

- The overlay coordinates are tuned for the current avatar. New avatars may need manual position tweaks.
- Mouth animation is heuristic (not actual lip‑sync). For high fidelity, integrate TTS visemes.

---

## 13) Migration & Versioning

- **v0.1** (current): SVG overlay/3‑phase mouth; blink loop; head bob; Tailwind styling.
- **Changelog**: keep a `CHANGELOG.md` in `components/lesson/` when extending API.

---

## 14) Developer Tasks (One‑time Setup)

1. Place avatar at `public/assets/josh-avatar.png` (512–1024px square PNG recommended).
2. Add the two components exactly as defined in this spec.
3. Import and use `LessonGuide` in target lesson pages.
4. Wire `speaking` to your narration state (typewriter/TTS). Confirm accessibility & dark mode.

---

## 15) Snippets for Rapid Scaffolding

**Create files**

```bash
mkdir -p components/lesson
# Add AvatarTalkingHead.tsx and LessonGuide.tsx per this spec
```

**Swap avatar quickly**

```tsx
<AvatarTalkingHead src="/assets/josh-avatar-v2.png" size={180} speaking />
```

---

## 16) Ownership & Maintenance

- **Owner**: Josh / Dolores (component stewardship)
- **Consumers**: Learn module pages; optional usage in onboarding and tips panes.
- **Update policy**: non‑breaking prop additions allowed; breaking changes require minor version bump and usage audit.

---

## 17) Security & Privacy

- Static, non‑identifying cartoon avatar stored in public assets. No network requests, no PII. Replaceable at build time.

---

## 18) Appendix – Overlay Coordinates Guide

When replacing the avatar, open `AvatarTalkingHead.tsx` and adjust:

- **Eyes**: the `rect` elements inside the *Eyes overlay* group. Move `x`/`y` and tweak `width`/`height`.
- **Mouth**: the `rect`/`ellipse` elements inside the *Mouth overlay*. Tune `x`/`y` or `cx`/`cy` and `rx`/`ry`.
- Use DevTools “inspect element” to live‑edit SVG attributes and copy values back to source.

---

**End of Spec**

