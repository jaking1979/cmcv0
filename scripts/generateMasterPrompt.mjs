#!/usr/bin/env node
/**
 * generateMasterPrompt.mjs
 *
 * Build-time script that reads docs/ITC_master_rules.md and writes it as a
 * TypeScript string constant to src/server/ai/generated/itcMasterRules.ts.
 *
 * Run via: npm run generate:prompt
 * Automatically runs before `next build` and `next dev`.
 *
 * Markdown formatting (bold markers, escaped list dots, heading hashes) is
 * stripped so the model receives clean plain-text rules.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const SRC = resolve(root, 'docs/ITC_master_rules.md')
const DEST_DIR = resolve(root, 'src/server/ai/generated')
const DEST = resolve(DEST_DIR, 'itcMasterRules.ts')

// ── Read source ───────────────────────────────────────────────────────────────

const raw = readFileSync(SRC, 'utf8')

// ── Strip markdown formatting ─────────────────────────────────────────────────
//
// Rules:
//   1. Remove bold markers (**text** → text)
//   2. Remove escaped list markers (1\. → 1.)
//   3. Convert markdown headings (### Heading → HEADING) — all-caps for clarity
//   4. Convert markdown bullet asterisks at line start (* text → - text)
//   5. Remove stray trailing spaces (markdown's forced line-break syntax)
//   6. Collapse 3+ consecutive blank lines to 2

function stripMarkdown(text) {
  return text
    // Bold: **text** → text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    // Escaped list markers: 1\. → 1.
    .replace(/(\d+)\\\./g, '$1.')
    // Markdown headings: ## Heading → HEADING (section dividers)
    .replace(/^#{1,6}\s+(.+)$/gm, (_, heading) => heading.toUpperCase())
    // Bullet asterisks at line start (* item → - item)
    .replace(/^\* /gm, '- ')
    // Trailing spaces (markdown line-break syntax)
    .replace(/[ \t]+$/gm, '')
    // Collapse 3+ blank lines to 2
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const normalized = stripMarkdown(raw)

// ── Escape for template literal ───────────────────────────────────────────────

const escaped = normalized
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$\{/g, '\\${')

// ── Write output ──────────────────────────────────────────────────────────────

const output = `// AUTO-GENERATED from docs/ITC_master_rules.md — do not edit manually.
// To regenerate: npm run generate:prompt
// This file is committed to source control so the Edge runtime always has it.

export const ITC_MASTER_RULES = \`
${escaped}
\`.trim()
`

mkdirSync(DEST_DIR, { recursive: true })
writeFileSync(DEST, output, 'utf8')

console.log(`[generate:prompt] Written ${normalized.length} chars to ${DEST.replace(root + '/', '')}`)
