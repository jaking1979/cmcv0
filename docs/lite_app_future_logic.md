# CMC Sober Coach — Lite Version Prompt & Logic Spec (Part 3: Structuring Future Decision Logic)

This is Part 3 of 3. It provides guidance on how to design, evaluate, and propose changes to decision logic as the app evolves.

---

## 1) Version 0 and Core Flow

Everything described so far is **Version 0 (v0)** of the Lite app. It’s the starting point — not the final word. The current universal flow is:

**Reflect → Validate → Ask → Suggest**

### Why this order now (v0)
- **Reflect first**: ensures the user feels seen and understood.
- **Validate second**: normalizes their experience and builds safety.
- **Ask third**: invites engagement and autonomy.
- **Suggest last**: gives actionable options only after trust and context are set.

This sequence reflects the values of warmth, coaching, and user empowerment.

### What “core invariant” means here
- The **flow order** is the *backbone* of every module. If we change it, we change the app’s personality and how it feels to the user.
- **Consistency is critical**: whatever sequence we use, it has to apply everywhere — Onboarding, Daily Check-In, Advice, Post-Lapse, Lessons, Crisis handling.
- Changing it is possible, but it’s not a local tweak; it requires rethinking the entire coaching structure.

### If we want to change the flow
- **We can.** This is v0, and nothing is sacred.
- But if we change the sequence, we must commit to it **across the whole app** so the experience stays coherent.
- We must weigh **pros and cons** of any new sequence:
  - Does it feel warmer, more efficient, or more empowering?
  - Does it risk feeling prescriptive, cold, or disorganized?
- Prototype in one module (e.g., Daily Check-In) → test → decide → roll out consistently.

---

## 2) Other Invariants (Do Not Break)

- Action menus must offer a clear range of options (covering quick wins, values alignment, and preventive strategies), but the exact tags or labels we use can evolve as we refine the framework.
- Always provide a menu of options for the user to choose from, keeping menus ≤5 items; extras are optional.
- Onboarding must remain ≤5 questions.
- Daily Check-In must remain ≤3 main prompts.
- Crisis override must function in **all modules**.

---

## 3) Change Request Template

Every proposed logic change should answer the following. These are **guidelines**, not verbatim text to drop into the app. For example, a "User moment" should describe the type of situation (it does not need to match word-for-word what a user writes), and "Proposed text" should serve as example copy to illustrate tone and structure — the AI will adapt wording dynamically when talking to the user.

- **Title**: (e.g., "New Stress Branch for Advice Engine"). Used internally for clarity.
- **User moment**: The general scenario this branch is designed for (captures anything similar, not only the exact wording here).
- **Trigger/detection**: What kinds of words, ratings, or conditions activate this branch. Think in terms of patterns, not single exact phrases.
- **Proposed text**: Example reflection, validation, follow-up, and action menu items. These illustrate the intended structure and tone, but the AI may paraphrase rather than copy verbatim.
- **Routing/thresholds**: Where this branch fits in the logic (does it replace, add, or refine?).
- **Expected outcome**: The result we want (e.g., user commits to one coping skill).
- **Impacted modules**: Which other flows might be affected if this is added or changed.

---

## 4) Lightweight Testing Checklist

Before approving any change:
- **Clarity**: Can a teammate understand it without explanation?
- **Brevity**: Can the user act within 60–90 seconds?
- **Coverage**: Avoid duplicates or gaps.
- **Tone**: Warm, validating, coach-like.
- **Safety**: Crisis handling intact.

---

## 5) Examples of Future Logic Changes

### Example A: Adding a New Context Branch
- **Situation**: User mentions financial stress.
- **Trigger**: Mentions “money,” “bills,” “can’t afford.”
- **Flow (using v0 order)**:
  - Reflect: *“Financial stress can feel overwhelming.”*
  - Validate: *“It makes sense you’d want to escape those feelings.”*
  - Ask: *“What’s one small thing you can do today to feel more in control?”*
  - Suggest (menu with ✅/💚/🛡/🔄/🎯).
- **Routing**: Added as Advice Engine context.

### Example B: Adjusting Craving Thresholds
- **Situation**: Team decides 7–10 should be “high,” not 8–10.
- **Change**: Update Daily Check-In logic.
- **Outcome**: Users at level 7 get urgent support.

---

## 6) Guidance for Cofounders

When thinking about changes:
- **Start with the user’s lived moment**: What are they feeling/saying?
- **Anchor in the structure**: Which module does it belong to?
- **Map to interventions**: Always include ✅, 💚, and 🛡.
- **Protect flow length**: Short, usable interactions.
- **Commit to coherence**: If you change the core flow order, it must be applied everywhere.

---

✅ This guide clarifies that the current flow (Reflect → Validate → Ask → Suggest) is **v0**, explains why it exists, and what it would mean to change it. Cofounders can innovate, but must weigh pros/cons and ensure consistency across the whole app.

