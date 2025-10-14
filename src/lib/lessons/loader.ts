import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { Lesson } from './types'

const lessonsDir = path.join(process.cwd(), 'src/content/lessons')

export function getAllLessons(): Lesson[] {
  try {
    const files = fs.readdirSync(lessonsDir)
      .filter(f => f.endsWith('.md'))
      .filter(f => !f.includes('.!')) // Filter out macOS resource fork files
    
    const lessons: Lesson[] = []
    files.forEach(file => {
      try {
        const filePath = path.join(lessonsDir, file)
        const content = fs.readFileSync(filePath, 'utf8')
        const { data } = matter(content)
        lessons.push(data as Lesson)
      } catch (error) {
        console.error(`Error parsing lesson ${file}:`, error instanceof Error ? error.message : error)
      }
    })
    
    return lessons
  } catch (error) {
    console.error('Error loading lessons:', error)
    return []
  }
}

export function getLesson(slug: string): Lesson | null {
  try {
    const allLessons = getAllLessons()
    return allLessons.find(l => l.slug === slug) || null
  } catch (error) {
    console.error(`Error loading lesson ${slug}:`, error)
    return null
  }
}

export function getAllTags(): string[] {
  const lessons = getAllLessons()
  const tagSet = new Set<string>()
  lessons.forEach(lesson => {
    if (lesson && Array.isArray(lesson.tags)) {
      lesson.tags.forEach(tag => tagSet.add(tag))
    }
  })
  return ['All', ...Array.from(tagSet).sort()]
}

