# CMC Sober Coach – Scope Definition (v0 → v1)

## 1. What We’ve Built (v0 – Lite Version)
- **Core Chat Flow**
  - Shared Chat components (ChatPane, MessageList, Composer).
  - Streaming assistant messages with crisis safety banner.
  - Scenario-based dialogues (Reflection, Validation, Follow-up, Action Menu).
- **Content Seeds**
  - 8 demo scenarios (PDF → structured prompts).
  - 8 demo lessons (LessonGuide with practice + reflection).
- **Lesson Presentation**
  - `LessonGuide` component.
  - `AvatarTalkingHead` spec with animated avatar, speaking state, a11y notes.
- **Behavioral Playbook**
  - High-level design for tracking decision dimensions (impulse ↔ reflection, values vs. relief, etc.).
  - Crisis messaging protocol.

➡️ **In short:** v0 is a proof-of-concept. It shows a chat loop, example lessons, and seed content in a working Next.js app.

---

## 2. What We Want to Build (v1 – Comprehensive MVP)
- **Multi-Agent Architecture**
  - Several specialized AI “sub-coaches”:
    - *DBT Coach*: helps clients learn dialectical behavior therapy skills (mindfulness, distress tolerance, emotion regulation, interpersonal effectiveness).
    - *Self-Compassion Coach*: supports clients in building self-kindness and reducing self-criticism.
    - *CBT/Behavioral Skills Coach*: teaches cognitive and behavioral strategies for coping and change.
    - (Future coaches may be added, such as trauma-focused or motivational interviewing specialists).
  - **Manager AI**: synthesizes outputs from all specialists into a clear **personalized plan** for the client.

- **Expanded Feature Set**
  - **Onboarding:** Conversational protocol based on practical curiosity, designed to naturally elicit the information needed to populate standardized assessments (Self-Compassion Scale, URICA, Kessler 10, WHO-5, DBT-WCCL, Coping Self-Efficacy Scale, ASSIST, and ASI) without directly asking test items.
  - **Advice Loop:** Richer coaching that references input from multiple AI listeners (without long-term memory in v1).
  - **Learning Hub:** Multi-lesson modules with progress tracking, avatars, and practice steps.
  - **Insights Dashboard (v2):** Deferred to version 2. In future, this will provide user-facing reflection on patterns (e.g., \"You tend to choose relief strategies when stressed late at night\").
  - **Metrics Logging:** Behavioral dimensions auto-tagged during sessions; stored via API for review.
  - **Plan Builder:** Actionable, ongoing recovery plan synthesized by Manager AI.

- **Delivery as PWA (installable app)**
  - Mobile-first responsive UI.
  - Offline caching + install prompt.
  - Push notification support.

---

## 3. How v0 Differs from v1
- **v0**: one-size-fits-all chatbot with demo lessons + scenarios.
- **v1**: orchestrated system of specialist AI listeners managed by a synthesizer AI, producing personalized plans, tracking progress, and offering structured lessons.
- **v0**: seed content, static lessons, manual reflection.
- **v1**: dynamic content, evolving insights, structured onboarding, behavioral metrics.

---

## 4. Instructions for Building v1
1. **Keep v0 foundation** (Next.js app, Chat/lesson components, scenarios, lessons).
2. **Expand architecture:**
   - Add specialist coach modules (DBT Coach, Self-Compassion Coach, CBT/Behavioral Skills Coach) as listeners that tag conversation signals.
   - Create Manager AI orchestrator that consumes coach outputs and synthesizes a plan.
   - Store listener events via API + DB (begin with lightweight store).
3. **Upgrade UX:**
   - **Onboarding:** Use the practical-curiosity conversational protocol to elicit data needed to populate the Self‑Compassion Scale, URICA, Kessler‑10, WHO‑5, DBT‑WCCL, Coping Self‑Efficacy (CSE), ASSIST, and ASI—without asking test items verbatim.
   - **Plan Dashboard:** Show the synthesized guidance produced by the Manager AI.
   - **Lessons Hub:** Multi-lesson modules with progress tracking.
4. **Ship as PWA:**
   - Add manifest, service worker, offline caching.
   - Enable push notifications for nudges/reminders.
5. **Testing + Safety:**
   - Crisis messaging always available.
   - a11y compliance baked into all flows.
   - Automated unit + e2e tests.
   - Mapping tests that verify onboarding conversations correctly populate assessment fields.

---

## 5. Guiding Vision
**CMC Sober Coach v1** = an installable app where multiple AI “ears” listen for behavioral cues, a Manager AI turns them into insight + plans, and the client interacts through lessons, coaching, and a dashboard that makes progress visible.

