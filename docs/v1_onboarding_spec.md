Build a v1 AI onboarding flow for a substance use / behavior change coaching app.

Context: This is not therapy and not a generic chatbot. The onboarding should feel conversational, warm, nonjudgmental, motivational, and efficient. The goal is for the AI to chat with the user for about 15–20 minutes and gather enough information to create a strong first-pass formulation of the user, while clearly treating it as provisional and refinable over time.

The onboarding must help the system reasonably assess:

1. What the user’s current substance use looks like  
2. What their ideal substance use would look like  
3. Triggers, cravings, emotions, and high-risk times/situations that make it hard to meet goals  
4. Safety/protective people, places, emotions, routines, and situations that help  
5. What skills they currently have, and what skills they want to build, across different coaching lenses  
6. The user’s communication/personality style so coaches know how best to talk to them

Important product stance:

- One onboarding chat should produce a usable initial formulation, not a definitive diagnosis or perfect behavioral map  
- The system should assign confidence levels to its inferences  
- The system should refine the user profile over time through later chats, check-ins, and behavior logs  
- Do not present fake psychometric precision  
- Prefer profile bands such as Low / Emerging / Moderate / Strong, plus Low / Medium / High confidence  
- If numeric scoring is used at all, it should be simple, internal, and clearly heuristic

What I want you to produce: Create a developer-ready onboarding specification and implementation plan for this v1 flow.

Please include all of the following sections:

SECTION 1: PRODUCT GOAL Write a concise explanation of what this onboarding is for, what it should accomplish in 15–20 minutes, and what it should explicitly not claim to do.

SECTION 2: CONVERSATIONAL DESIGN PRINCIPLES Define the tone and interaction style. The onboarding should be:

- conversational, not survey-like  
- warm, respectful, validating, and direct  
- motivational interviewing informed  
- able to tolerate ambivalence  
- structured enough to gather data efficiently  
- non-punitive and non-shaming  
- adaptive to user style Also specify what the AI should avoid, such as interrogation, overlong disclaimers, robotic transitions, excessive reassurance, or overly clinical language.

SECTION 3: ONBOARDING FLOW Design the flow as a sequence of conversational segments, approximately: 0\. Opening/frame

1. Why now \+ user agenda  
2. Current use pattern  
3. Ideal future / goals / ambivalence  
4. Risk map  
5. Protection / safety map  
6. Skills map by coach lens  
7. Communication style  
8. Safety screen  
9. Wrap-up and summary

For each segment, provide:

- purpose  
- primary questions  
- optional follow-ups  
- what internal fields are being filled  
- what conditions should trigger branching or deeper probing  
- what conditions should allow the system to move on

SECTION 4: BRANCHING LOGIC Create explicit branching logic for common user presentations, including:

- user is highly ambivalent  
- user is unsure whether there is a problem  
- user wants abstinence  
- user wants moderation  
- user is undecided  
- user gives vague answers  
- user minimizes use  
- user seems ashamed or guarded  
- user reports recent slip or relapse  
- user says “nothing helps”  
- user wants very practical help  
- user prefers reflective / insight-oriented help  
- user appears intoxicated, in withdrawal, medically unwell, suicidal, or otherwise high-risk

Make the logic concrete. Use if/then style where helpful.

SECTION 5: DATA MODEL / OUTPUT SCHEMA Design a structured internal schema that the AI fills out during onboarding.

Include top-level sections for:

- current\_use  
- ideal\_goal  
- risk\_map  
- protection\_map  
- coach\_profiles  
- communication\_profile  
- safety\_flags  
- confidence\_summary

For each section, define:

- required fields  
- optional fields  
- expected data types  
- example values

Also provide one realistic example JSON object showing what a completed onboarding output might look like.

SECTION 6: COACH LENS SKILL MAP Define how onboarding should estimate current strengths and growth areas across these coach lenses:

- Motivational / MI  
- ACT / values  
- DBT / distress tolerance and emotion regulation  
- Mindfulness  
- Self-compassion  
- Executive support / planning / follow-through

For each lens, include:

- what signals the AI should listen for  
- example questions  
- how to infer likely strengths  
- how to infer likely gaps  
- what kind of user-stated goals might indicate interest in that coach/lens

SECTION 7: PROFILE BANDS / HEURISTIC SCORING Create a simple heuristic scoring model for these domains:

- mindfulness / awareness  
- self-compassion / reset capacity  
- skills breadth  
- values clarity  
- motivation / readiness  
- executive support need

For each domain, define:

- Low / Emerging / Moderate / Strong criteria  
- what evidence would increase confidence  
- what evidence would lower confidence  
- how the system should store both level and confidence

Do not make this look like a validated clinical instrument unless actual scale items are being used.

SECTION 8: BEHAVIORAL PROCESS DIMENSIONS Define a small set of cross-cutting behavioral dimensions the system should tag during onboarding and refine over time, such as:

- impulse ↔ reflection  
- solo ↔ social coping  
- avoidance ↔ approach  
- planned ↔ in-the-moment  
- relief-seeking ↔ values-guided  
- lapse → learn ↔ lapse → collapse  
- prefers direct feedback ↔ prefers gentle support

Explain:

- why each dimension matters  
- what conversational evidence supports each side  
- how the system should store these tags provisionally

SECTION 9: STOPPING RULES / EFFICIENCY LOGIC Design logic so the AI does not ask every possible question. It should ask until each major domain has enough signal.

Define:

- what counts as “enough signal”  
- a stopping rule for moving on from a segment  
- when to defer a low-confidence domain to later check-ins  
- how to keep the full onboarding around 15–20 minutes

SECTION 10: END-OF-ONBOARDING USER SUMMARY Write a template for how the AI should summarize what it learned back to the user at the end. This should:

- sound human and accurate  
- reflect both risk and strengths  
- avoid overclaiming certainty  
- identify 1–2 likely starting points for coaching  
- make clear this is a first draft that will get refined

SECTION 11: SAFETY LAYER Specify how the onboarding should handle safety-related issues, including:

- suicidal ideation / self-harm risk  
- overdose risk  
- dangerous withdrawal risk  
- blackouts  
- using alone  
- dangerous mixing / polysubstance use  
- domestic violence / coercive environments if disclosed

The safety layer should:

- interrupt normal flow when needed  
- prioritize immediate safety guidance  
- collect only necessary information in acute moments  
- route back to onboarding only if appropriate

SECTION 12: UX / ENGINEERING RECOMMENDATIONS Provide implementation recommendations for the engineering team, including:

- how to track which fields are already confidently filled  
- how to avoid repetitive questioning  
- how to dynamically choose the next best question  
- how to support partial completion  
- how to mark inferences as provisional  
- how later conversations should refine onboarding conclusions

SECTION 13: V1 vs LATER PHASES Separate what should be included in v1 versus later iterations. For v1, prioritize simplicity, usability, and strong signal collection. For later phases, note optional additions such as:

- embedded micro-items for stronger internal scoring  
- progressive onboarding  
- passive pattern refinement through logs/check-ins  
- better personalization models  
- stronger coach handoff logic

Output format requirements:

- Write this as a polished product \+ conversation design spec  
- Use clear headings and subheadings  
- Be concrete and implementation-friendly  
- Include examples throughout  
- Avoid fluff  
- Assume the audience is founders, product, and engineering  
- Make the result detailed enough that a team could start building from it immediately

Additional instruction: Where helpful, include sample wording the AI can actually say to users during onboarding.  
