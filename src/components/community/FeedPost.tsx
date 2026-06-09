'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { Zap, MessageSquare, Share2, CheckCircle, ArrowRight } from 'lucide-react'
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

export interface RecentUpvoter {
  id: string
  full_name: string
  avatar_url: string | null
}

export interface FeedPostProps {
  post: any
  expandedContent?: boolean
  voteData?: {
    userVote?: string | null
    upvotes?: number
    error?: string | null
  }
  recentUpvoters?: RecentUpvoter[]
  expandedPost: string | null
  postAnswers?: any[]
  answersLoading?: boolean
  onToggleContent: (postId: string) => void
  onImageClick: (url: string) => void
  onVote: (postId: string, voteType: 'upvote' | 'downvote') => void
  onToggleAnswerSection: (postId: string) => void
  onSharePost: (post: any) => void
  onSubmitInlineAnswer: (postId: string, text: string, parentAnswerId?: string) => Promise<boolean> | void
  onUpvotersClick?: (postId: string) => void
}

export default function FeedPost({
  post,
  expandedContent,
  voteData,
  recentUpvoters,
  expandedPost,
  postAnswers,
  answersLoading,
  onToggleContent,
  onImageClick,
  onVote,
  onToggleAnswerSection,
  onSharePost,
  onSubmitInlineAnswer,
  onUpvotersClick,
}: FeedPostProps) {
  const router = useRouter()
  const ts = getTypeStyle(post.type)
  const [expandedReplies, setExpandedReplies] = React.useState<Record<string, boolean>>({})
  const [answerText, setAnswerText] = React.useState('')
  const [isSubmittingAnswer, setIsSubmittingAnswer] = React.useState(false)
  const [replyToAnswerId, setReplyToAnswerId] = React.useState<string | null>(null)

  const toggleReplies = (answerId: string) => {
    setExpandedReplies(prev => ({ ...prev, [answerId]: !prev[answerId] }))
  }

  const handleSubmitAnswer = async () => {
    const trimmed = answerText.trim()
    if (!trimmed || isSubmittingAnswer) return
    
    setIsSubmittingAnswer(true)
    try {
      const success = await onSubmitInlineAnswer(post.id, trimmed, replyToAnswerId || undefined)
      if (success !== false) {
        setAnswerText('') // clear only on success
        if (replyToAnswerId) {
          setExpandedReplies(prev => ({ ...prev, [replyToAnswerId as string]: true }))
        }
        setReplyToAnswerId(null)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmittingAnswer(false)
    }
  }

  const topLevelAnswers = postAnswers?.filter((a: any) => !a.parent_answer_id) || []
  const replies = postAnswers?.filter((a: any) => a.parent_answer_id) || []

  const renderComposer = (isTopLevel: boolean, targetAnswerId?: string) => {
    if (isTopLevel && replyToAnswerId) return null; // Don't show global composer if replying inline
    if (!isTopLevel && replyToAnswerId !== targetAnswerId) return null;

    return (
      <div className={`flex flex-col gap-2 ${isTopLevel ? 'pt-1.5 mt-2 border-t border-slate-100' : 'mt-2 mb-2 pl-2'}`}>
        {!isTopLevel && (
          <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
            <span className="text-[10px] text-slate-600 font-medium">
              Replying to <span className="font-bold text-slate-800">{topLevelAnswers.find((a: any) => a.id === targetAnswerId)?.users?.full_name}</span>
            </span>
            <button 
              onClick={() => setReplyToAnswerId(null)}
              className="text-[10px] text-slate-400 hover:text-slate-600 font-bold px-2 py-0.5"
            >
              Cancel
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={answerText}
            onChange={e => setAnswerText(e.target.value)}
            placeholder={!isTopLevel ? "Write a reply..." : "Help by writing an answer..."}
            rows={1}
            className="flex-1 border border-slate-200 hover:border-slate-300 rounded p-2 text-[10px] font-semibold focus:outline-none focus:border-[#7C3AED] resize-none"
          />
          <button
            onClick={handleSubmitAnswer}
            disabled={!answerText.trim() || isSubmittingAnswer}
            className="px-3 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-slate-200 text-white rounded font-bold text-[10px] cursor-pointer transition-colors flex-shrink-0"
          >
            {!isTopLevel ? 'Reply' : 'Send'}
          </button>
        </div>
      </div>
    )
  }

  const renderAnswerContent = (answer: any, isReply: boolean = false) => (
    <div key={answer.id} className={`flex gap-2.5 py-1.5 items-start ${isReply ? 'mt-1 mb-1' : 'border-b border-slate-50 last:border-b-0'}`}>
      <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-800 text-xs overflow-hidden flex-shrink-0 border border-slate-100 mt-0.5">
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
          {answer.created_at && (
            <span className="text-[9px] text-slate-400 font-medium ml-1">
              {timeAgo(answer.created_at)}
            </span>
          )}
        </div>
        <p className="text-[10px] text-slate-600 leading-normal font-semibold mt-0.5">{answer.content}</p>
        
        {!isReply && (
          <div className="mt-1 flex items-center gap-3">
            <button 
              onClick={() => {
                setReplyToAnswerId(replyToAnswerId === answer.id ? null : answer.id)
                if (replyToAnswerId !== answer.id) setAnswerText('')
              }}
              className="text-[9px] text-slate-400 hover:text-[#7C3AED] font-bold transition-colors"
            >
              Reply
            </button>
            
            {replies.filter((r: any) => r.parent_answer_id === answer.id).length > 0 && (
              <button 
                onClick={() => toggleReplies(answer.id)}
                className="text-[9px] text-[#7C3AED] font-bold transition-colors flex items-center gap-1 bg-purple-50 px-1.5 py-0.5 rounded"
              >
                {expandedReplies[answer.id] ? 'Hide Replies' : `Show Replies (${replies.filter((r: any) => r.parent_answer_id === answer.id).length})`}
              </button>
            )}
          </div>
        )}

        {/* Render inline composer below this answer if replying */}
        {!isReply && renderComposer(false, answer.id)}

        {/* Nested Replies */}
        {!isReply && expandedReplies[answer.id] && replies.filter((r: any) => r.parent_answer_id === answer.id).length > 0 && (
          <div className="pl-4 ml-2 border-l-2 border-slate-100 mb-2 mt-2">
            {replies.filter((r: any) => r.parent_answer_id === answer.id).map((reply: any) => 
              renderAnswerContent(reply, true)
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-none sm:rounded-xl border-y border-x-0 sm:border border-slate-200 p-4 sm:p-5 shadow-none sm:shadow-sm hover:border-slate-300 transition-colors"
    >
      {/* Feed Card Header details */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {/* Author avatar */}
          <div
            onClick={() => router.push(`/u/${post.users?.unique_id}`)}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-800 text-sm overflow-hidden flex-shrink-0 cursor-pointer border border-slate-100"
          >
            {post.users?.avatar_url ? (
              <img src={post.users.avatar_url} alt={post.users?.full_name} className="w-full h-full object-cover" />
            ) : (
              post.users?.full_name?.[0] || 'U'
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/u/${post.users?.unique_id}`)}
                className="font-bold text-slate-900 hover:text-[#7C3AED] hover:underline text-sm text-left leading-none"
              >
                {post.users?.full_name}
              </button>
              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${post.users?.role === 'senior' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                {post.users?.role === 'senior' ? 'Senior' : 'Mentee'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
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
      {post.title && (
        <h4
          onClick={() => router.push(`/community/c/${post.communities?.slug}/p/${post.id}`)}
          className="font-bold text-slate-950 text-sm sm:text-base hover:text-[#7C3AED] transition-colors leading-snug tracking-tight mb-2 cursor-pointer"
        >
          {post.title}
        </h4>
      )}

      {/* Content text */}
      <div className="text-sm text-slate-800 leading-relaxed font-normal mb-3">
        <p className={expandedContent ? '' : 'line-clamp-3 whitespace-pre-wrap'}>
          {convertUrlsToLinks(post.content)}
        </p>

        {post.content && post.content.length > 180 && (
          <button
            onClick={() => onToggleContent(post.id)}
            className="text-[#7C3AED] font-bold hover:underline mt-1.5 cursor-pointer block text-xs"
          >
            {expandedContent ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Attached media inside card via Carousel */}
      {post.image_url && post.image_url.length > 0 && (
        <div className="mb-3">
          <PostImageCarousel
            imageUrls={post.image_url}
            onImageClick={onImageClick}
          />
        </div>
      )}

      {/* Tags line */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.map((t: string) => (
            <span key={t} className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* LinkedIn-style Upvoter Avatars */}
      {(voteData?.upvotes || 0) > 0 && recentUpvoters && recentUpvoters.length > 0 && (
        <div
          className="flex items-center gap-2 pb-3 cursor-pointer group"
          onClick={() => onUpvotersClick?.(post.id)}
        >
          {/* Overlapping avatar stack */}
          <div className="flex items-center -space-x-1.5 flex-shrink-0">
            {recentUpvoters.slice(0, 3).map((upvoter, i) => (
              <div
                key={upvoter.id}
                className="w-5 h-5 rounded-full border-[1.5px] border-white bg-slate-100 flex items-center justify-center text-[7px] font-black text-slate-600 overflow-hidden flex-shrink-0"
                style={{ zIndex: 3 - i }}
                title={upvoter.full_name}
              >
                {upvoter.avatar_url ? (
                  <img src={upvoter.avatar_url} alt={upvoter.full_name} className="w-full h-full object-cover" />
                ) : (
                  upvoter.full_name?.[0]?.toUpperCase() || 'U'
                )}
              </div>
            ))}
          </div>
          {/* Text */}
          <span className="text-[11px] text-slate-500 font-medium leading-tight group-hover:text-[#7C3AED] transition-colors">
            {(() => {
               const total = voteData?.upvotes || 0
               const names = recentUpvoters.slice(0, 3).map(u => u.full_name?.split(' ')[0] || 'Someone')
                if (total === 1) return `${names[0]} appreciated this`
                if (total === 2) return `${names[0]} and ${names[1] || 'someone'} appreciated this`
                const othersCount = total - names.length
                if (othersCount <= 0) return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} appreciated this`
                return `${names.slice(0, 2).join(', ')} and ${othersCount + (names.length > 2 ? 1 : 0)} others appreciated this`
            })()}
          </span>
        </div>
      )}

      {/* Low Opacity action footer bar */}
      <div className="grid grid-cols-4 items-center border-t border-slate-100 pt-2 mt-2 w-full text-slate-600">
        {/* Appreciation button */}
        <div className="flex justify-center w-full">
          <button
            onClick={() => onVote(post.id, 'upvote')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              voteData?.userVote === 'upvote'
                ? 'bg-purple-100 text-[#7C3AED] shadow-sm'
                : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{voteData?.upvotes || 0} RP</span>
          </button>
        </div>

        {/* Answers buttons */}
        <button
          onClick={() => onToggleAnswerSection(post.id)}
          className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-2 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer w-full text-center"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="text-[10px] sm:text-xs">{post.answer_count || 0} Answers</span>
        </button>

        {/* Share buttons */}
        <button
          onClick={() => onSharePost(post)}
          className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-2 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer w-full text-center"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="text-[10px] sm:text-xs">Share</span>
        </button>

        {/* Explore Detail buttons */}
        <button
          onClick={() => router.push(`/community/c/${post.communities?.slug}/p/${post.id}`)}
          className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-2 hover:bg-slate-50 text-[#7C3AED] hover:text-[#6D28D9] rounded-lg transition-colors cursor-pointer w-full text-center"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span className="font-bold text-[10px] sm:text-xs whitespace-nowrap">Detail</span>
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
          {!answersLoading && topLevelAnswers.map((answer: any) => (
            <div key={answer.id} className="flex flex-col">
              {renderAnswerContent(answer, false)}
            </div>
          ))}

          {/* Answer submission block */}
          {renderComposer(true)}
        </div>
      )}
    </motion.article>
  )
}
