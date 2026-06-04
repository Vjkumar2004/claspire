'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown, MessageSquare, Share2, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import PostImageCarousel from '@/components/PostImageCarousel'

const convertUrlsToLinks = (text: string) => {
  if (!text) return text
  const urlPattern = /(https?:\/\/[^\s\)]+)/g

  const lines = text.split('\n')

  return lines.map((line, lineIndex) => {
    const matches = line.match(urlPattern) || []

    if (matches.length === 0) {
      return (
        <span key={`line-${lineIndex}`}>
          {line}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      )
    }

    const parts: React.ReactNode[] = []
    let lastIdx = 0

    matches.forEach((match, matchIndex) => {
      const startIdx = line.indexOf(match, lastIdx)
      if (startIdx > lastIdx) {
        parts.push(line.substring(lastIdx, startIdx))
      }

      parts.push(
        <a
          key={`link-${lineIndex}-${matchIndex}`}
          href={match}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#7C3AED] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {match}
        </a>
      )

      lastIdx = startIdx + match.length
    })

    if (lastIdx < line.length) {
      parts.push(line.substring(lastIdx))
    }

    return (
      <span key={`line-${lineIndex}`}>
        {parts}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    )
  })
}

const getTypeStyle = (type: string) => {
  switch (type) {
    case 'doubt':
      return { label: 'Doubt', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', icon: '❓' }
    case 'discussion':
      return { label: 'Discussion', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', icon: '💬' }
    case 'experience':
      return { label: 'Experience', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: '⭐' }
    case 'referral_hunt':
      return { label: 'Referral', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: '🎯' }
    case 'resource':
      return { label: 'Resource', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: '📚' }
    default:
      return { label: type, color: '#6B7280', bg: '#F9FAFB', border: '#F3F4F6', icon: '📝' }
  }
}

const timeAgo = (date: string) => {
  const now = new Date()
  const past = new Date(date)
  const diff = now.getTime() - past.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return past.toLocaleDateString()
}

export interface FeedPostProps {
  post: any
  expandedContent?: boolean
  voteData?: {
    userVote?: string | null
    upvotes?: number
    error?: string | null
  }
  expandedPost: string | null
  postAnswers?: any[]
  answersLoading?: boolean
  newAnswerText?: string
  answerSubmitting?: boolean

  onToggleContent: (postId: string) => void
  onImageClick: (url: string) => void
  onVote: (postId: string, voteType: 'upvote' | 'downvote') => void
  onToggleAnswerSection: (postId: string) => void
  onSharePost: (post: any) => void
  onAnswerTextChange: (postId: string, text: string) => void
  onSubmitInlineAnswer: (postId: string) => void
}

export default function FeedPost({
  post,
  expandedContent,
  voteData,
  expandedPost,
  postAnswers,
  answersLoading,
  newAnswerText,
  answerSubmitting,
  onToggleContent,
  onImageClick,
  onVote,
  onToggleAnswerSection,
  onSharePost,
  onAnswerTextChange,
  onSubmitInlineAnswer,
}: FeedPostProps) {
  const router = useRouter()
  const ts = getTypeStyle(post.type)

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-md border border-slate-200 p-3.5 shadow-sm hover:border-slate-300 transition-colors"
    >
      {/* Feed Card Header details */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          {/* Author avatar */}
          <div
            onClick={() => router.push(`/u/${post.users?.unique_id}`)}
            className="w-9 h-9 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-800 text-xs overflow-hidden flex-shrink-0 cursor-pointer border border-slate-100"
          >
            {post.users?.avatar_url ? (
              <img src={post.users.avatar_url} alt={post.users?.full_name} className="w-full h-full object-cover" />
            ) : (
              post.users?.full_name?.[0] || 'U'
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => router.push(`/u/${post.users?.unique_id}`)}
                className="font-bold text-slate-900 hover:text-[#7C3AED] hover:underline text-xs text-left leading-none"
              >
                {post.users?.full_name}
              </button>
              <span className={`text-[7px] font-black uppercase px-1 rounded ${post.users?.role === 'senior' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                {post.users?.role === 'senior' ? 'Senior' : 'Mentee'}
              </span>
            </div>
            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
              {post.communities?.colleges?.short_name || 'Campus'} Hub • {timeAgo(post.created_at)}
            </p>
          </div>
        </div>

        {/* Post type badging */}
        <span
          style={{ background: ts.bg, color: ts.color, borderColor: ts.border }}
          className="text-[8px] font-bold uppercase px-2 py-0.5 rounded border tracking-wide whitespace-nowrap flex items-center gap-1"
        >
          <span>{ts.icon}</span>
          <span>{ts.label}</span>
        </span>
      </div>

      {/* Title click through */}
      <h4
        onClick={() => router.push(`/community/c/${post.communities?.slug}/p/${post.id}`)}
        className="font-bold text-slate-950 text-xs hover:text-[#7C3AED] transition-colors leading-snug tracking-tight mb-1.5 cursor-pointer"
      >
        {post.title}
      </h4>

      {/* Content text */}
      <div className="text-[11px] text-slate-600 leading-normal font-semibold mb-2.5">
        <p className={expandedContent ? '' : 'line-clamp-3 whitespace-pre-wrap'}>
          {convertUrlsToLinks(post.content)}
        </p>

        {post.content && post.content.length > 180 && (
          <button
            onClick={() => onToggleContent(post.id)}
            className="text-[#7C3AED] font-bold hover:underline mt-1 cursor-pointer block"
          >
            {expandedContent ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Attached media inside card via Carousel */}
      <PostImageCarousel
        imageUrls={post.image_url}
        onImageClick={onImageClick}
      />

      {/* Tags line */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {post.tags.map((t: string) => (
            <span key={t} className="text-[8px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Low Opacity action footer bar */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-[10px] font-bold text-slate-500">
        <div className="flex items-center gap-2">
          {/* Upvote & Downvote buttons */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded p-0.5">
            <button
              onClick={() => onVote(post.id, 'upvote')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all cursor-pointer ${
                voteData?.userVote === 'upvote'
                  ? 'bg-purple-100 text-[#7C3AED] shadow-sm'
                  : 'hover:bg-slate-100 text-slate-500'
              }`}
            >
              <ArrowUp className="w-3 h-3" />
              <span>{voteData?.upvotes || 0}</span>
            </button>

            <button
              onClick={() => onVote(post.id, 'downvote')}
              className={`flex items-center px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                voteData?.userVote === 'downvote'
                  ? 'bg-red-100 text-red-600 shadow-sm'
                  : 'hover:bg-slate-100 text-slate-400'
              }`}
            >
              <ArrowDown className="w-3 h-3" />
            </button>
          </div>

          {/* Answers buttons */}
          <button
            onClick={() => onToggleAnswerSection(post.id)}
            className="flex items-center gap-1.5 px-2.5 py-1 hover:bg-slate-50 text-slate-500 rounded transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3 h-3" />
            <span>{post.answer_count || 0} Answers</span>
          </button>

          <button
            onClick={() => onSharePost(post)}
            className="flex items-center gap-1.5 px-2.5 py-1 hover:bg-slate-50 text-slate-500 rounded transition-colors cursor-pointer"
          >
            <Share2 className="w-3 h-3" />
            <span>Share</span>
          </button>
        </div>

        <button
          onClick={() => router.push(`/community/c/${post.communities?.slug}/p/${post.id}`)}
          className="text-[#7C3AED] hover:underline cursor-pointer text-[10px]"
        >
          Explore Detail →
        </button>
      </div>

      {/* Errors details */}
      {voteData?.error && (
        <div className="text-[9px] text-red-600 bg-red-50 border border-red-100 rounded p-2 mt-2">
          {voteData.error}
        </div>
      )}

      {/* Inline Answers dynamic render */}
      {expandedPost === post.id && (
        <div className="border-t border-slate-100 mt-2.5 pt-2.5 space-y-2">
          <h5 className="font-bold text-[10px] text-slate-800 flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-[#7C3AED]" />
            <span>Answers ({postAnswers?.length || 0})</span>
          </h5>

          {answersLoading && (
            <div className="flex items-center justify-center gap-2 py-3">
              <div className="w-3.5 h-3.5 border-2 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
              <span className="text-[9px] text-slate-400 font-semibold">Loading answers...</span>
            </div>
          )}

          {!answersLoading && postAnswers?.length === 0 && (
            <p className="text-[9px] text-slate-400 font-semibold text-center py-1">
              No answers yet. Help this mentee by sharing your experience!
            </p>
          )}

          {/* Answers List */}
          {!answersLoading && postAnswers?.map((answer: any) => (
            <div key={answer.id} className="flex gap-2.5 py-1.5 border-b border-slate-50 last:border-b-0 items-start">
              <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-800 text-xs overflow-hidden flex-shrink-0 border border-slate-100">
                {answer.users?.avatar_url ? (
                  <img src={answer.users.avatar_url} alt="Author" className="w-full h-full object-cover" />
                ) : (
                  answer.users?.full_name?.[0] || 'U'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 text-[10px]">{answer.users?.full_name}</span>
                  {answer.users?.role === 'senior' && (
                    <span className="text-[6px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 px-0.5 rounded">
                      SENIOR
                    </span>
                  )}
                  {answer.is_accepted && (
                    <span className="text-[6px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 px-0.5 rounded flex items-center gap-0.5">
                      <CheckCircle className="w-2 h-2" /> Accepted
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-600 leading-normal font-semibold mt-0.5">{answer.content}</p>
              </div>
            </div>
          ))}

          {/* Answer submission block */}
          <div className="flex items-end gap-2 pt-1.5">
            <textarea
              value={newAnswerText || ''}
              onChange={e => onAnswerTextChange(post.id, e.target.value)}
              placeholder="Help by writing an answer..."
              rows={1}
              className="flex-1 border border-slate-200 hover:border-slate-300 rounded p-2 text-[10px] font-semibold focus:outline-none focus:border-[#7C3AED] resize-none"
            />
            <button
              onClick={() => onSubmitInlineAnswer(post.id)}
              disabled={!newAnswerText?.trim() || answerSubmitting}
              className="px-3 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-slate-200 text-white rounded font-bold text-[10px] cursor-pointer transition-colors flex-shrink-0"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </motion.article>
  )
}
