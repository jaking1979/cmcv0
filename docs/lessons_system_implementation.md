# Lessons System v0.1 - Implementation Complete

## Overview

The Learn section has been successfully refactored into a scalable, conversation-driven lesson system that dynamically loads 40+ Markdown lessons with personalized recommendations, tour overlays, and interactive learning experiences.

## What Was Implemented

### Core Infrastructure

1. **Lesson Types** (`src/lib/lessons/types.ts`)
   - Complete TypeScript interfaces for `Lesson`, `CoachStep`, `Slide`, `LessonState`, and `TourFlags`

2. **Lesson Loader** (`src/lib/lessons/loader.ts`)
   - Server-side loader using `gray-matter` to parse YAML frontmatter
   - Filters out macOS resource fork files (`.!` prefix)
   - Error handling for individual lesson parsing failures
   - Functions: `getAllLessons()`, `getLesson(slug)`, `getAllTags()`

3. **API Routes**
   - `/api/lessons` - Returns all lessons and tags
   - `/api/lessons/[slug]` - Returns individual lesson data
   - Both routes handle errors gracefully with appropriate HTTP status codes

4. **State Management**
   - `src/lib/state/userProfile.ts` - Mock user profile with skill deficits/strengths
   - `src/lib/state/lessonState.ts` - LocalStorage helpers for lesson progress, completion, and tour flags

5. **Recommender** (`src/lib/plan/recommender.ts`)
   - Generates personalized lesson plans based on mock user profile
   - Scoring algorithm: deficit coverage (x10) + strength depth + order_hint
   - Includes human-readable rationale explaining the recommendation

### UI Components

6. **TourOverlay** (`src/components/lessons/TourOverlay.tsx`)
   - 3-step guided tour for both learn index and individual lessons
   - Variant-specific content (learn vs. lesson)
   - Progress indicators and skip functionality

7. **LessonCard** (`src/components/lessons/LessonCard.tsx`)
   - Displays lesson title, description, tags, and "What you'll learn" chips
   - Shows completion status
   - Responsive design with proper text wrapping

8. **LessonFilters** (`src/components/lessons/LessonFilters.tsx`)
   - Search by text (title/description)
   - Filter by tag dropdown
   - Mobile-optimized inputs with 44px minimum tap targets

9. **Transcript** (`src/components/transcript/Transcript.tsx`)
   - Collapsible transcript panel
   - Displays coach (C) and user messages
   - Can be controlled or uncontrolled

10. **LessonPlayer** (`src/components/lessons/LessonPlayer.tsx`)
    - Full interactive lesson experience
    - Sticky avatar header with Prev/Next navigation
    - Script-based progression through coach dialogue
    - Shows composer only when `chat_mode === 'interactive'` AND `requires_input === true`
    - Off-topic detection using v1 coaches (`/api/events`)
    - 3-strike redirect system with option to switch to `/chat`
    - Crisis detection with safety messaging
    - Lesson completion tracking
    - State persistence to localStorage

### Pages

11. **Learn Index** (`src/app/learn/page.tsx`)
    - Entry screen with three views: choose, plan, all
    - "Follow the Lesson Plan" shows personalized recommendations with rationale
    - "See All Lessons" shows filterable/searchable grid
    - Tour overlay on first visit
    - Progress tracking (X / Y lessons completed)
    - Fetches data from `/api/lessons` API

12. **Lesson Player Page** (`src/app/learn/[slug]/page.tsx`)
    - Loads lesson from `/api/lessons/[slug]`
    - Shows tour overlay on first visit per lesson
    - Renders `<LessonPlayer>` component
    - 404 handling for invalid slugs

13. **Legacy Page** (`src/app/learn/relapse-justifications/page.tsx`)
    - Added deprecation comment noting replacement by dynamic system
    - Retained for backward compatibility

## Key Features

### Personalized Lesson Plan
- Analyzes mock user profile for skill deficits (scores < 0.5)
- Ranks lessons by relevance to user's needs
- Provides plain-English explanation of recommendation
- Numbered sequential presentation

### Interactive Learning
- Conversation-driven lessons with Josh's avatar
- Script-based progression through content
- Required input prompts for interactive engagement
- Prev/Next navigation to review coach dialogue
- Real-time state persistence

### Off-Topic Detection
- Integrates with v1 coach system (`/api/events`)
- Detects when user goes off-topic (all coaches < 0.3 confidence)
- Gentle redirects for counts 1-2
- Offers switch to Just Chat after 3 redirects

### Tour System
- First-visit overlay for `/learn` page
- Per-lesson tour overlays (tracked by slug)
- 3-step guided experience
- Persists completion flags in localStorage

### Progress Tracking
- Tracks completed lessons in localStorage
- Shows completion badges on lesson cards
- Displays aggregate completion count (X / Y)

### Crisis Safety
- Detects crisis terms (suicide, self-harm, overdose, etc.)
- Shows immediate safety resources (911, 988)
- Consistent with existing app safety patterns

## Technical Decisions

### Server-Side Lesson Loading
- Lessons loaded server-side to avoid `fs` module issues in client components
- API routes (`/api/lessons`, `/api/lessons/[slug]`) serve lesson data
- Client pages fetch from API endpoints

### Error Handling
- Per-lesson try-catch in loader prevents single bad file from breaking all lessons
- Filters out macOS resource fork files (`.!` prefix)
- Graceful degradation with empty arrays/null returns

### Mock User Profile
- Hardcoded profile with skill deficit data
- Includes disclaimer: "Note: This lesson plan is based on demo data. In the future, it will be personalized from your onboarding assessment."
- Ready to swap with real onboarding data when available

### LocalStorage State
- Lesson state per slug: `lessonState:<slug>`
- Completed lessons: `cmc_completed_lessons`
- Tour flags: `cmc_first_visit_learn_seen`, `cmc_first_visit_lesson_seen:<slug>`
- Future: migrate to cookies for cross-device persistence

## Files Created/Modified

### Created (15 files)
- `src/lib/lessons/types.ts`
- `src/lib/lessons/loader.ts`
- `src/lib/state/userProfile.ts`
- `src/lib/state/lessonState.ts`
- `src/lib/plan/recommender.ts`
- `src/components/lessons/TourOverlay.tsx`
- `src/components/lessons/LessonCard.tsx`
- `src/components/lessons/LessonFilters.tsx`
- `src/components/lessons/LessonPlayer.tsx`
- `src/components/transcript/Transcript.tsx`
- `src/app/api/lessons/route.ts`
- `src/app/api/lessons/[slug]/route.ts`
- `docs/lessons_system_implementation.md`

### Modified (4 files)
- `src/app/learn/page.tsx` - Complete refactor to use new system
- `src/app/learn/[slug]/page.tsx` - Dynamic lesson player
- `src/app/learn/relapse-justifications/page.tsx` - Added deprecation comment
- `package.json` - Added `gray-matter` dependency

## Testing Results

### API Endpoints
- ✅ `/api/lessons` returns 40 lessons and 9 tags
- ✅ `/api/lessons/[slug]` returns individual lesson data
- ✅ Error handling for invalid slugs (404)
- ✅ Graceful handling of malformed lesson files

### Lesson Loading
- ✅ Successfully loads 40 lessons from `src/content/lessons/`
- ✅ Filters out macOS resource fork files
- ✅ Handles YAML parsing errors gracefully

### UI Components
- ✅ Learn index loads and displays lessons
- ✅ Tour overlay appears on first visit
- ✅ Lesson cards show correct data
- ✅ Search and tag filters work
- ✅ Individual lesson pages load correctly

## Dependencies Added

```json
{
  "gray-matter": "^4.0.3"
}
```

## Next Steps (Future Enhancements)

1. **Connect to Real Onboarding Data**
   - Replace `getMockUserProfile()` with actual assessment data
   - Update recommender to use real skill scores
   - Remove mock data disclaimer

2. **Enhanced Off-Topic Detection**
   - Tune coach confidence thresholds
   - Add lesson-specific keyword lists
   - Implement semantic similarity checks

3. **State Persistence**
   - Migrate from localStorage to cookies for cross-device sync
   - Add server-side state storage
   - Implement user accounts/profiles

4. **Additional Features**
   - Lesson completion certificates
   - Progress streaks and achievements
   - Spaced repetition recommendations
   - Lesson bookmarking
   - Notes/journaling per lesson

5. **Content Enhancements**
   - Add lesson preview/overview
   - Support for media (images, videos)
   - Interactive exercises
   - Knowledge checks/quizzes

## Known Limitations

1. **Mock Profile**: Currently using hardcoded skill data
2. **LocalStorage Only**: Progress doesn't sync across devices
3. **No User Accounts**: Anonymous state only
4. **Basic Off-Topic Detection**: Relies on v1 coaches without lesson-specific tuning
5. **Limited Lesson Metadata**: Some lessons have minimal frontmatter

## Acceptance Criteria Status

- ✅ `/learn` shows tour overlay on first visit
- ✅ "Follow the Lesson Plan" displays mock profile rationale + ordered lessons
- ✅ "See All Lessons" shows filterable grid with search/tags
- ✅ Lesson cards show title, description, outcomes chips, and completion status
- ✅ `/learn/[slug]` shows lesson tour overlay on first visit per slug
- ✅ Lesson player has sticky avatar header, synced slide content, collapsible transcript
- ✅ Composer appears only when `chat_mode === 'interactive'` AND `requires_input === true`
- ✅ Off-topic detection uses v1 coaches and triggers gentle redirects (3-strike rule)
- ✅ Prev/Next navigation works through coach script
- ✅ State persists across page refreshes
- ✅ Completed lessons marked in localStorage and displayed in UI

## Conclusion

The Lessons System v0.1 has been successfully implemented with all planned features. The system is scalable, mobile-optimized, and integrates seamlessly with the existing v1 coach system. It provides a solid foundation for personalized learning experiences while maintaining the warm, conversational tone of Josh, the AI sober coach.

