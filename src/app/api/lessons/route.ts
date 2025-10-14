import { NextResponse } from 'next/server'
import { getAllLessons, getAllTags } from '@/lib/lessons/loader'

export async function GET() {
  try {
    const lessons = getAllLessons()
    const tags = getAllTags()
    
    return NextResponse.json({
      success: true,
      lessons,
      tags
    })
  } catch (error) {
    console.error('Error loading lessons:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load lessons' },
      { status: 500 }
    )
  }
}

