import { useState, KeyboardEvent } from 'react'
import { X, Hash } from 'lucide-react'

interface SmartTagsProps {
  tags: string[]
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
}

const SUGGESTED_TAGS = ['placement', 'interview', 'java', 'react', '2026batch', 'internship', 'resume']

export default function SmartTags({ tags, onAddTag, onRemoveTag }: SmartTagsProps) {
  const [input, setInput] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const newTag = input.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
      if (newTag && !tags.includes(newTag) && tags.length < 5) {
        onAddTag(newTag)
        setInput('')
      }
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      onRemoveTag(tags[tags.length - 1])
    }
  }

  const availableSuggestions = SUGGESTED_TAGS.filter(tag => !tags.includes(tag)).slice(0, 5)

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-white/80">
        <Hash size={16} className="text-[#F4A01C] dark:text-purple-400" />
        Tags
        <span className="text-slate-400 dark:text-white/40 text-xs font-normal">({tags.length}/5)</span>
      </label>

      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F4A01C]/20 to-cyan-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
        <div className="relative flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl backdrop-blur-xl transition-colors group-focus-within:border-[#F4A01C]/50">
          {tags.map(tag => (
            <span
              key={tag}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF3D6] dark:bg-purple-500/20 text-[#E09410] dark:text-purple-200 text-sm font-medium rounded-lg border border-[#F4A01C]/30 dark:border-purple-500/30"
            >
              #{tag}
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="hover:bg-[#F4A01C]/30 p-0.5 rounded-md transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length < 5 ? (tags.length === 0 ? "Add tags... (press Enter)" : "Add more tags...") : ""}
            disabled={tags.length >= 5}
            className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 text-sm disabled:opacity-50"
          />
        </div>
      </div>

      {availableSuggestions.length > 0 && tags.length < 5 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-white/50">Suggested:</span>
          {availableSuggestions.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => onAddTag(tag)}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-white/5"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
