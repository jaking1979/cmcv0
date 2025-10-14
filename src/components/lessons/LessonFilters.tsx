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
      <input
        type="text"
        placeholder="Search lessons..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] text-base"
      />

      <select
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

