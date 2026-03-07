#!/usr/bin/env node
/**
 * validatePrompt.mjs
 *
 * Verifies that src/server/ai/generated/itcMasterRules.ts is up-to-date with
 * docs/ITC_master_rules.md and has not been hand-edited.
 *
 * Run via: npm run validate:prompt
 *
 * Exits 0 on success, 1 on failure with a descriptive message.
 *
 * How it works:
 *   1. Reads docs/ITC_master_rules.md and generates the expected TS output
 *      using the same logic as generateMasterPrompt.mjs.
 *   2. Reads the existing generated file.
 *   3. Compares them — any mismatch means the file is stale or was hand-edited.
 *   4. Additionally checks that key sentinel phrases from the master rules doc
 *      appear verbatim in the generated file (belt-and-suspenders guard against
 *      a generator bug silently stripping critical rule content).
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const SRC = resolve(root, 'docs/ITC_master_rules.md')
const DEST = resolve(root, 'src/server/ai/generated/itcMasterRules.ts')

// ── These phrases MUST appear in the generated file ──────────────────────────
// Drawn from high-priority sections across docs/ITC_master_rules.md.
// If any are missing, the generator has silently dropped critical rule content.

// Phrases are matched against the generated file after markdown is stripped and
// headings are uppercased by the generator. Verify actual output with:
//   grep -n "DIAGNOSE\|AMBIVALENCE" src/server/ai/generated/itcMasterRules.ts

const SENTINEL_PHRASES = [
  // Section 1 — Foundational Rules (headings become ALL-CAPS in generated file)
  'THE AI DOES NOT DIAGNOSE OR LABEL',
  'BEHAVIOR ALWAYS MAKES SENSE IN CONTEXT',
  'CHOICE AND DIGNITY ARE ALWAYS PRESERVED',
  // Section 3 — Stance
  'AMBIVALENCE IS A STABLE STATE, NOT A PROBLEM',
  'DISCOMFORT IS MEANINGFUL INFORMATION',
  'WILLINGNESS IS AN INVITATION, NOT A REQUIREMENT',
  'SELF-COMPASSION SUPPORTS LEARNING',
  // Section 5 — Righting Reflex
  'THE RIGHTING REFLEX (FOUNDATIONAL ANTI-PATTERN)',
  'TONE REGULATION RULE',
  // Section 12 — Reinforcement
  'ATTENTION SHAPES LEARNING',
  // Section 13 — Safety
  'RESPONDING TO ACUTE SAFETY RISK',
  // Section 14 — Skills
  'CRITERIA FOR OFFERING SKILLS',
  // Section 15 — Self-Check
  'BEFORE EVERY RESPONSE, THE AI ASKS:',
  // Section 17 — Failure modes
  'SECTION 17: COMMON AI FAILURE MODES TO AVOID',
  // Core ITC language (body text — case-sensitive, must survive stripping)
  'Invitation to Change',
  'Success is continued engagement',
  'not designed to give good advice',
]

// ── Replicate the markdown stripping logic from generateMasterPrompt.mjs ─────

function stripMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(\d+)\\\./g, '$1.')
    .replace(/^#{1,6}\s+(.+)$/gm, (_, heading) => heading.toUpperCase())
    .replace(/^\* /gm, '- ')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function buildExpectedOutput(rawDoc) {
  const normalized = stripMarkdown(rawDoc)
  const escaped = normalized
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${')
  return `// AUTO-GENERATED from docs/ITC_master_rules.md — do not edit manually.\n// To regenerate: npm run generate:prompt\n// This file is committed to source control so the Edge runtime always has it.\n\nexport const ITC_MASTER_RULES = \`\n${escaped}\n\`.trim()\n`
}

// ── Main ──────────────────────────────────────────────────────────────────────

let ok = true
const errors = []

// 1. Check the generated file exists
if (!existsSync(DEST)) {
  console.error('[validate:prompt] FAIL: Generated file does not exist:', DEST.replace(root + '/', ''))
  console.error('  Run: npm run generate:prompt')
  process.exit(1)
}

const rawDoc = readFileSync(SRC, 'utf8')
const generatedFile = readFileSync(DEST, 'utf8')
const expectedFile = buildExpectedOutput(rawDoc)

// 2. Check the generated file matches what the generator would produce today
if (generatedFile !== expectedFile) {
  ok = false
  errors.push(
    'Generated file is stale or was hand-edited.',
    'It no longer matches what `npm run generate:prompt` would produce from the current docs/ITC_master_rules.md.',
    'Fix: run `npm run generate:prompt` to regenerate.',
  )
}

// 3. Check sentinel phrases appear in the generated file
const missingPhrases = SENTINEL_PHRASES.filter(phrase => !generatedFile.includes(phrase))
if (missingPhrases.length > 0) {
  ok = false
  errors.push(
    'The following required phrases from docs/ITC_master_rules.md are missing from the generated file:',
    ...missingPhrases.map(p => `  - "${p}"`),
    'This may indicate a generator bug. Check scripts/generateMasterPrompt.mjs.',
  )
}

// ── Report ────────────────────────────────────────────────────────────────────

if (ok) {
  console.log('[validate:prompt] OK — generated file is current and contains all required content.')
  process.exit(0)
} else {
  console.error('[validate:prompt] FAIL:')
  errors.forEach(e => console.error(' ', e))
  process.exit(1)
}
