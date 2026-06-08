'use client'

import { useGroups, type GroupListItem } from '@/contexts/GroupsContext'
import { ChevronLeft, MessageSquare, Loader2, Search, X } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

function formatGroupTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function GroupItem({ group, isActive, onClick }: { group: GroupListItem; isActive: boolean; onClick: () => void }) {
  const hasUnread = group.unread_count > 0
  const badge = group.unread_count > 99 ? '99+' : group.unread_count > 0 ? String(group.unread_count) : null

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors hover:bg-gray-100 active:bg-gray-200 ${
        isActive ? 'bg-gray-100' : ''
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-white flex items-center justify-center text-sm font-bold shadow-sm">
          {group.name[0]?.toUpperCase()}
        </div>
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
            {group.name}
          </span>
          {group.last_message && (
            <span className="text-[10px] text-gray-400 flex-shrink-0">
              {formatGroupTime(group.last_message.created_at)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className={`text-xs truncate ${hasUnread ? 'font-semibold text-gray-600' : 'text-gray-500'}`}>
            {group.last_message
              ? group.last_message.content.length > 45
                ? group.last_message.content.slice(0, 45) + '...'
                : group.last_message.content
              : 'No messages yet'}
          </span>
          {badge && (
            <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center px-1">
              {badge}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

interface GroupsSidebarProps {
  currentGroupSlug: string
  onClose?: () => void
}

export default function GroupsSidebar({ currentGroupSlug, onClose }: GroupsSidebarProps) {
  const { groups, loading } = useGroups()
  const router = useRouter()
  const [search, setSearch] = useState('')

  const filtered = search
    ? groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
    : groups

  const handleSelect = (group: GroupListItem) => {
    const path = `/community/c/${group.college_slug}/group/${group.slug}`
    router.push(path)
    onClose?.()
  }

  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-gray-200">
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-gray-900">Groups</h1>
          <div className="flex items-center gap-2">
            {onClose && (
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full lg:hidden">
                <X size={18} className="text-gray-400" />
              </button>
            )}
            <ChevronLeft size={20} className="text-gray-400" />
          </div>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search groups..."
            className="w-full bg-gray-100 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-colors placeholder:text-gray-400"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-purple-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <MessageSquare size={22} className="text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-500">
              {search ? 'No groups match your search' : 'No groups yet'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {search ? 'Try a different name' : 'Join a group to get started'}
            </p>
          </div>
        ) : (
          filtered.map(group => (
            <GroupItem
              key={group.id}
              group={group}
              isActive={group.slug === currentGroupSlug}
              onClick={() => handleSelect(group)}
            />
          ))
        )}
      </div>
    </div>
  )
}
