# CMC Sober Coach — Docs Index

This folder contains all documentation for the CMC Sober Coach app. Outdated documents have been moved to `docs/archive/` with clear deprecation notices. If you are doing new development, **only use the documents in this top-level folder**.

---

## ✅ Current / Active Documents

| Document | What It Covers |
|---|---|
| [`ITC_master_rules.md`](./ITC_master_rules.md) | **Highest-priority.** Governing behavioral rules for all AI prompts, coach logic, and copy in this codebase. Read this first. |
| [`v1_onboarding_spec.md`](./v1_onboarding_spec.md) | Full product + conversation design spec for the V1 AI onboarding flow. 10-segment ITC/MI intake, assessment mapping, formulation summary. Governs `src/app/api/onboarding/`. |
| [`v1_multi_agent_system.md`](./v1_multi_agent_system.md) | Architecture, API reference, feature flags, and testing scenarios for the three-coach (DBT, Self-Compassion, CBT) + Manager AI system. |
| [`v1_plan.md`](./v1_plan.md) | V1 implementation roadmap with step-by-step build plan. Steps 1–6 are ✅ complete; steps 7–11 are 🔄 partial or ⏳ pending. |
| [`lessons_system_implementation.md`](./lessons_system_implementation.md) | Implementation record for the Learn/Lessons system (40+ Markdown lessons, LessonPlayer, recommender, tour overlays, progress tracking). |
| [`step6_plan_builder_implementation.md`](./step6_plan_builder_implementation.md) | Implementation record for the `/plan` page, plan pinning, PlanCard/PlanList components, and plan persistence. |
| [`step4_implementation_summary.md`](./step4_implementation_summary.md) | Implementation record for Step 4: multi-coach advice integration, plan CTA flow, debug panel, and coach tag injection into advice prompts. |
| [`step4_testing_guide.md`](./step4_testing_guide.md) | Manual testing guide for the multi-agent advice system (URL params, API curl tests, expected outputs, troubleshooting). |
| [`url_parameters.md`](./url_parameters.md) | Quick reference for all URL parameters (`v1=1`, `debug=1`, `roleplays=1`) and which feature flags they require. |
| [`chat_components_spec.md`](./chat_components_spec.md) | Technical reference for the shared chat UI components (`ChatPane`, `MessageList`, `MessageComposer`, `useChat`). File paths are accurate. |
| [`avatar_talking_head_component_technical_spec.md`](./avatar_talking_head_component_technical_spec.md) | Technical spec for `AvatarTalkingHead`. **Note:** file paths were updated 2026-03-07 — `LessonGuide.tsx` was never implemented; use `LessonPlayer.tsx` instead. |

---

## ⚠️ Archived / Outdated Documents

The following documents are in [`docs/archive/`](./archive/) and should **not** be used for new development. Each file has a deprecation notice at the top explaining what superseded it.

| Document | Why It's Archived |
|---|---|
| [`archive/lite_app_onboarding_logic.md`](./archive/lite_app_onboarding_logic.md) | v0 Lite onboarding spec (4–5 intake questions, daily check-in flow). Superseded by `v1_onboarding_spec.md`. |
| [`archive/lite_app_support_safety.md`](./archive/lite_app_support_safety.md) | v0 Lite Advice Engine, Post-Lapse, and Crisis module spec. Superseded by `v1_multi_agent_system.md` and `ITC_master_rules.md`. |
| [`archive/lite_app_future_logic.md`](./archive/lite_app_future_logic.md) | v0 "Reflect → Validate → Ask → Suggest" decision logic guide. Superseded by ITC/MI stance in `ITC_master_rules.md`. |
| [`archive/onboarding_style_guide.md`](./archive/onboarding_style_guide.md) | Intermediate "coach intake" style guide written between v0 and v1. Superseded by `v1_onboarding_spec.md`. |
| [`archive/v_0_to_v_1_scope.md`](./archive/v_0_to_v_1_scope.md) | Historical planning doc for the v0 → v1 transition. All described features have now been built. |

---

## Quick Reference — Which Doc Do I Need?

| Question | Go To |
|---|---|
| What can/can't the AI say or do? | `ITC_master_rules.md` |
| How does onboarding work? | `v1_onboarding_spec.md` |
| How do the three coaches and Manager AI work? | `v1_multi_agent_system.md` |
| What has been built vs. what's still pending? | `v1_plan.md` |
| How does the `/learn` system work? | `lessons_system_implementation.md` |
| How does the `/plan` page work? | `step6_plan_builder_implementation.md` |
| How do I test the advice/coach system? | `step4_testing_guide.md` |
| What URL params enable V1 features? | `url_parameters.md` |
| How do I use or extend the chat components? | `chat_components_spec.md` |
| How do I use the avatar component? | `avatar_talking_head_component_technical_spec.md` |
