// Roleplay loader: loads and validates roleplay JSON files

import { z } from 'zod'

// Zod schemas for validation
const ActionMenuSchema = z.object({
  options: z.array(z.object({
    label: z.string(),
    value: z.string()
  }))
})

const RoleplayStepSchema = z.object({
  role: z.enum(['assistant', 'user']),
  kind: z.enum(['reflection', 'validation', 'followup', 'actionMenu', 'assistantPlain']),
  text: z.union([z.string(), ActionMenuSchema])
})

const RoleplayMetaSchema = z.object({
  id: z.string(),
  title: z.string(),
  tags: z.array(z.string()).optional(),
  steps: z.array(RoleplayStepSchema)
})

// TypeScript types
export interface ActionMenu {
  options: Array<{
    label: string
    value: string
  }>
}

export interface RoleplayStep {
  role: 'assistant' | 'user'
  kind: 'reflection' | 'validation' | 'followup' | 'actionMenu' | 'assistantPlain'
  text: string | ActionMenu
}

export interface RoleplayMeta {
  id: string
  title: string
  tags?: string[]
  steps: RoleplayStep[]
}

// Cache for loaded roleplays
let roleplayCache: RoleplayMeta[] | null = null

export async function loadRoleplays(): Promise<RoleplayMeta[]> {
  // Return cached result if available
  if (roleplayCache) {
    return roleplayCache
  }

  try {
    // Load the index file
    const indexResponse = await fetch('/roleplays/index.json', { cache: 'no-store' })
    if (!indexResponse.ok) {
      throw new Error(`Failed to load roleplay index: ${indexResponse.status}`)
    }

    const indexData = await indexResponse.json()
    if (!Array.isArray(indexData)) {
      throw new Error('Roleplay index must be an array')
    }

    const roleplays: RoleplayMeta[] = []

    // Load each roleplay file
    for (const item of indexData) {
      if (!item.id || !item.path) {
        console.warn('Skipping roleplay item without id or path:', item)
        continue
      }

      try {
        const roleplayResponse = await fetch(item.path, { cache: 'no-store' })
        if (!roleplayResponse.ok) {
          console.warn(`Failed to load roleplay ${item.id}: ${roleplayResponse.status}`)
          continue
        }

        const roleplayData = await roleplayResponse.json()
        
        // Validate with Zod schema
        const validatedRoleplay = RoleplayMetaSchema.parse({
          id: item.id,
          title: item.title || `Roleplay ${item.id}`,
          tags: item.tags || [],
          ...roleplayData
        })

        roleplays.push(validatedRoleplay)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`Validation error for roleplay ${item.id}:`, error)
        }
        console.warn(`Skipping invalid roleplay ${item.id}`)
      }
    }

    // Cache the result
    roleplayCache = roleplays
    return roleplays

  } catch (error) {
    console.error('Failed to load roleplays:', error)
    return []
  }
}

// Clear cache (useful for testing)
export function clearRoleplayCache(): void {
  roleplayCache = null
}

// Get roleplay by ID
export async function getRoleplayById(id: string): Promise<RoleplayMeta | null> {
  const roleplays = await loadRoleplays()
  return roleplays.find(rp => rp.id === id) || null
}

// Get roleplays by tags
export async function getRoleplaysByTags(tags: string[]): Promise<RoleplayMeta[]> {
  const roleplays = await loadRoleplays()
  return roleplays.filter(rp => 
    rp.tags && tags.some(tag => rp.tags!.includes(tag))
  )
}

// Validate a single roleplay object
export function validateRoleplay(data: any): RoleplayMeta {
  return RoleplayMetaSchema.parse(data)
}




