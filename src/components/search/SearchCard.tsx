'use client'
import React from 'react'
import Link from 'next/link'
import { Users, Award, Briefcase, GraduationCap, Building2, MessageSquare, FileText, CheckCircle } from 'lucide-react'

// Helper component to highlight query matches safely
export function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || !text) return <>{text}</>
  const parts = text.split(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-[#FFF3D6] text-[#F4A01C] font-semibold px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

export interface SearchCardProps {
  id: string
  type: 'senior' | 'student' | 'job' | 'community' | 'college' | 'group' | 'post'
  title: string
  subtitle: string
  metadata: {
    location?: string
    salary_range?: string
    member_count?: number
    graduation_year?: string
    company?: string
    designation?: string
    posted_date?: string
    views?: number
  }
  description: string
  imageUrl: string | null
  href: string
  query: string
  is_joined?: boolean
}

export default function SearchCard({ card, query }: { card: SearchCardProps; query: string }) {
  const getBadgeStyle = () => {
    switch (card.type) {
      case 'senior':
        return { bg: 'bg-emerald-50 border-emerald-100 text-emerald-700', label: 'Verified Senior' }
      case 'student':
        return { bg: 'bg-blue-50 border-blue-100 text-blue-700', label: 'Student' }
      case 'job':
        return { bg: 'bg-amber-50 border-amber-100 text-amber-700', label: 'Job Opening' }
      case 'community':
        return { bg: 'bg-[#FFF3D6] border-[#F4A01C]/20 text-[#F4A01C]', label: 'Community Hub' }
      case 'college':
        return { bg: 'bg-indigo-50 border-indigo-100 text-indigo-700', label: 'College' }
      case 'group':
        return { bg: 'bg-cyan-50 border-cyan-100 text-cyan-700', label: 'Public Group' }
      case 'post':
        const postType = card.subtitle.split(' • ')[1] || 'Post'
        const capitalizedType = postType.charAt(0).toUpperCase() + postType.slice(1)
        return {
          bg: capitalizedType === 'Doubt'
            ? 'bg-red-50 border-red-100 text-red-700'
            : capitalizedType === 'Experience'
              ? 'bg-amber-50 border-amber-100 text-amber-700'
              : capitalizedType === 'Note'
                ? 'bg-blue-50 border-blue-100 text-blue-700'
                : 'bg-app border-surface dark:border-[#38434F] text-gray-700',
          label: capitalizedType
        }
      default:
        return { bg: 'bg-app border-surface dark:border-[#38434F] text-gray-700', label: 'General' }
    }
  }

  const getIcon = () => {
    const iconClass = "w-5 h-5 text-gray-400 dark:text-[#B0B7BE]"
    switch (card.type) {
      case 'senior':
        return <Award className="w-5 h-5 text-emerald-600" />
      case 'student':
        return <Users className="w-5 h-5 text-blue-600" />
      case 'job':
        return <Briefcase className="w-5 h-5 text-amber-600" />
      case 'community':
        return <Building2 className="w-5 h-5 text-[#F4A01C]" />
      case 'college':
        return <GraduationCap className="w-5 h-5 text-indigo-600" />
      case 'group':
        return <Users className="w-5 h-5 text-cyan-600" />
      case 'post':
        return <MessageSquare className="w-5 h-5 text-gray-600 dark:text-[#B0B7BE]" />
      default:
        return <FileText className={iconClass} />
    }
  }

  const getActionButton = () => {
    switch (card.type) {
      case 'senior':
        return { text: 'View Profile', primary: true }
      case 'student':
        return { text: 'View Profile', primary: false }
      case 'job':
        return { text: 'Apply Now', primary: true }
      case 'community':
        return { text: 'Enter Hub', primary: true }
      case 'college':
        return { text: 'Visit Page', primary: false }
      case 'group':
        return card.is_joined ? { text: 'Visit Group', primary: true } : { text: 'Join Group', primary: true }
      case 'post':
        return { text: 'Read Post', primary: false }
      default:
        return { text: 'View Details', primary: false }
    }
  }

  const badge = getBadgeStyle()
  const action = getActionButton()

  const handleCardClick = () => {
    try {
      const saved = localStorage.getItem('claspire_recent_searches')
      const currentList: any[] = saved ? JSON.parse(saved) : []

      const newItem = {
        id: `${card.type}-${card.id}`,
        type: card.type,
        title: card.title,
        subtitle: card.subtitle,
        imageUrl: card.imageUrl,
        href: card.href
      }

      // Filter out duplicate entries and prepend the clicked item
      const updated = [newItem, ...currentList.filter((item: any) => item.id !== newItem.id)].slice(0, 5)
      localStorage.setItem('claspire_recent_searches', JSON.stringify(updated))
    } catch (e) {
      console.error('Failed to save recent search item:', e)
    }
  }

  return (
    <div className="bg-surface dark:bg-[#283036] border border-surface dark:border-[#38434F] rounded-md p-3.5 sm:p-5 hover:shadow-sm dark:shadow-[#1D2226]/50 transition-all duration-200 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-start font-plus-jakarta-sans text-xs">
      <div className="flex gap-3 sm:gap-4 items-start min-w-0 flex-1 w-full">
        {/* Avatar/Initial Icon Container with perfect alignment, object-fit containment for college logos */}
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-surface dark:bg-[#283036] border border-surface dark:border-[#38434F]/80 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt={card.title}
              className={`w-full h-full ${card.type === 'college' || card.type === 'community' ? 'object-contain p-1' : 'object-cover'
                }`}
            />
          ) : (
            getIcon()
          )}
        </div>

        {/* Content details */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded border uppercase tracking-wider ${badge.bg}`}>
              {badge.label}
            </span>
            {card.type === 'senior' && (
              <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 uppercase">
                <CheckCircle size={9} className="fill-emerald-700 text-white sm:w-2.5 sm:h-2.5" />
                Verified
              </span>
            )}
          </div>

          <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-snug tracking-tight hover:text-[#F4A01C] transition-colors">
            <Link href={card.href} onClick={handleCardClick} className="no-underline text-inherit">
              <HighlightText text={card.title} query={query} />
            </Link>
          </h3>

          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-[#B0B7BE] font-semibold mt-0.5">
            <HighlightText text={card.subtitle} query={query} />
          </p>

          <p className="text-gray-600 dark:text-[#B0B7BE] text-[11px] sm:text-xs leading-relaxed mt-1.5 sm:mt-2.5 max-w-2xl font-medium">
            <HighlightText text={card.description} query={query} />
          </p>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 mt-2.5 sm:mt-3.5 pt-2.5 sm:pt-3 border-t border-surface dark:border-[#38434F]">
            {card.metadata.location && (
              <span className="text-[10px] sm:text-[11px] text-gray-500 dark:text-[#B0B7BE] font-bold flex items-center gap-1 bg-app px-1.5 sm:px-2 py-0.5 rounded border border-gray-150">
                📍 {card.metadata.location}
              </span>
            )}
            {card.metadata.salary_range && (
              <span className="text-[10px] sm:text-[11px] text-gray-500 dark:text-[#B0B7BE] font-bold flex items-center gap-1 bg-app px-1.5 sm:px-2 py-0.5 rounded border border-gray-150">
                💰 {card.metadata.salary_range}
              </span>
            )}
            {card.metadata.member_count !== undefined && (
              <span className="text-[10px] sm:text-[11px] text-gray-500 dark:text-[#B0B7BE] font-bold flex items-center gap-1 bg-app px-1.5 sm:px-2 py-0.5 rounded border border-gray-150">
                👥 {card.metadata.member_count} Members
              </span>
            )}
            {card.metadata.views !== undefined && card.metadata.views > 0 && (
              <span className="text-[10px] sm:text-[11px] text-gray-500 dark:text-[#B0B7BE] font-bold flex items-center gap-1 bg-app px-1.5 sm:px-2 py-0.5 rounded border border-gray-150">
                👁️ {card.metadata.views} Views
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="w-full sm:w-auto flex justify-end flex-shrink-0 mt-2.5 sm:mt-0">
        <Link href={card.href} onClick={handleCardClick} className="w-full sm:w-auto no-underline">
          <button
            className={`w-full sm:w-auto px-3.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-md transition-all duration-150 cursor-pointer ${action.primary
              ? 'bg-[#F4A01C] hover:bg-[#E09410] text-white shadow-sm dark:shadow-[#1D2226]/50 border border-transparent'
              : 'bg-surface dark:bg-[#283036] hover:bg-app dark:hover:bg-[#1D2226] text-gray-700 border border-gray-300 hover:border-gray-400 shadow-sm dark:shadow-[#1D2226]/50'
              }`}
          >
            {action.text}
          </button>
        </Link>
      </div>
    </div>
  )
}
