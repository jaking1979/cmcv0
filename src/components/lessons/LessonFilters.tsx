'use client'

interface LessonFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedTag: string
  onTagChange: (tag: string) => void
  tags: string[]
}

export default function LessonFilters({
  searchQuery,
  onSearchChange,
  selectedTag,
  onTagChange,
  tags
}: LessonFiltersProps) {
  return (
    <div className="space-y-3 mb-4">
      <label htmlFor="lesson-search" className="sr-only">Search lessons</label>
      <input
        id="lesson-search"
        type="text"
        placeholder="Search lessons..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] text-base"
        aria-label="Search lessons by title or description"
      />

      <label htmlFor="tag-filter" className="sr-only">Filter by tag</label>
      <select
        id="tag-filter"
        value={selectedTag}
        onChange={(e) => onTagChange(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] text-base bg-white"
        aria-label="Filter lessons by tag"
      >
        {tags.map(tag => (
          <option key={tag} value={tag}>{tag}</option>
        ))}
      </select>
    </div>
  )
}

