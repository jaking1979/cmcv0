import { NextResponse } from 'next/server'
import { getLesson } from '@/lib/lessons/loader'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const lesson = getLesson(slug)
    
    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      lesson
    })
  } catch (error) {
    console.error('Error loading lesson:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load lesson' },
      { status: 500 }
    )
  }
}

