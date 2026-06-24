'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { ArrowBigUp, MessageSquare, Share2, CheckCircle, ArrowRight, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import MediaGallery from '@/components/MediaGallery'
import PostContentRenderer from '@/components/PostContentRenderer'

const getTypeStyle = (type: string) => {
  switch (type) {
    case 'doubt':
      return { label: 'Doubt', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', icon: '❓' }
    case 'discussion':
      return { label: 'Discussion', color: '#F4A01C', bg: '#F5F3FF', border: '#DDD6FE', icon: '💬' }
    case 'experience':
      return { label: 'Experience', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: '⭐' }
    case 'referral_hunt':
      return { label: 'Referral', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: '🎯' }
    case 'resource':
      return { label: 'Resource', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: '📚' }
    case 'general':
      return { label: 'General', color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', icon: '📄' }
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
  onVote: (postId: string, voteType: 'upvote' | 'downvote') => void
  onToggleAnswerSection: (postId: string) => void
  onSharePost: (post: any) => void
  onSubmitInlineAnswer: (postId: string, text: string, parentAnswerId?: string) => Promise<boolean> | void
  onDeleteInlineAnswer?: (postId: string, answerId: string, parentAnswerId?: string) => Promise<boolean> | void
  onUpvotersClick?: (postId: string) => void
  currentUserId?: string | null
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
  onVote,
  onToggleAnswerSection,
  onSharePost,
  onSubmitInlineAnswer,
  onDeleteInlineAnswer,
  onUpvotersClick,
  currentUserId,
}: FeedPostProps) {
  const router = useRouter()
  const ts = getTypeStyle(post.type)
  const [expandedReplies, setExpandedReplies] = React.useState<Record<string, boolean>>({})
  const [answerText, setAnswerText] = React.useState('')
  const [isSubmittingAnswer, setIsSubmittingAnswer] = React.useState(false)
  const [replyToAnswerId, setReplyToAnswerId] = React.useState<string | null>(null)

  const plainText = post.content ? post.content.replace(/<img[^>]*>/gi, '').replace(/<[^>]*>/g, '') : ''
  const isLongContent = plainText.length > 50

  console.log('[FeedPost DEBUG]', {
    postId: post.id,
    rawContent: post.content,
    plainText,
    plainTextLength: plainText.length,
    isLongContent,
    expanded: expandedContent,
  })

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
      <div className={`flex flex-col gap-2 ${isTopLevel ? 'pt-1.5 mt-2 border-t border-surface dark:border-[#38434F]' : 'mt-2 mb-2 pl-2'}`}>
        {!isTopLevel && (
          <div className="flex items-center justify-between bg-app dark:bg-[#1D2226] p-2 rounded-md">
            <span className="text-[10px] text-slate-600 dark:text-[#B0B7BE] font-medium">
              Replying to <span className="font-bold text-slate-800 dark:text-white">{topLevelAnswers.find((a: any) => a.id === targetAnswerId)?.users?.full_name}</span>
            </span>
            <button 
              onClick={() => setReplyToAnswerId(null)}
              className="text-[10px] text-slate-400 dark:text-[#B0B7BE] hover:text-slate-600 dark:text-[#B0B7BE] font-bold px-2 py-0.5"
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
            className="flex-1 border border-surface dark:border-[#38434F] hover:border-slate-300 dark:hover:border-[#38434F] rounded p-2 text-[10px] font-semibold focus:outline-none focus:border-[#F4A01C] resize-none"
          />
          <button
            onClick={handleSubmitAnswer}
            disabled={!answerText.trim() || isSubmittingAnswer}
            className="px-3 py-1.5 bg-[#F4A01C] hover:bg-[#E09410] disabled:bg-slate-200 dark:disabled:bg-[#283036] text-white rounded font-bold text-[10px] cursor-pointer transition-colors flex-shrink-0"
          >
            {!isTopLevel ? 'Reply' : 'Send'}
          </button>
        </div>
      </div>
    )
  }

  const renderAnswerContent = (answer: any, isReply: boolean = false) => (
    <div key={answer.id} className={`flex gap-2.5 py-1.5 items-start ${isReply ? 'mt-1 mb-1' : 'border-b border-slate-50 last:border-b-0'}`}>
      <div className="w-7 h-7 rounded bg-slate-100 dark:bg-[#283036] flex items-center justify-center font-bold text-slate-800 dark:text-white text-xs overflow-hidden flex-shrink-0 border border-surface dark:border-[#38434F] mt-0.5">
        {answer.users?.avatar_url ? (
          <img src={answer.users.avatar_url} alt="Author" className="w-full h-full object-cover" />
        ) : (
          answer.users?.full_name?.[0] || 'U'
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-900 dark:text-white text-[10px]">{answer.users?.full_name}</span>
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
              <span className="text-[9px] text-slate-400 dark:text-[#B0B7BE] font-medium ml-1">
                {timeAgo(answer.created_at)}
              </span>
            )}
          </div>
          {currentUserId === answer.author_id && (
            <button 
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this answer?')) {
                  onDeleteInlineAnswer?.(post.id, answer.id, answer.parent_answer_id)
                }
              }}
              className="text-slate-400 hover:text-red-500 transition-colors p-1 flex-shrink-0"
              title="Delete answer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        <p className="text-[10px] text-slate-600 dark:text-[#B0B7BE] leading-normal font-semibold mt-0.5">{answer.content}</p>
        
        {!isReply && (
          <div className="mt-1 flex items-center gap-3">
            <button 
              onClick={() => {
                setReplyToAnswerId(replyToAnswerId === answer.id ? null : answer.id)
                if (replyToAnswerId !== answer.id) setAnswerText('')
              }}
              className="text-[9px] text-slate-400 dark:text-[#B0B7BE] hover:text-[#F4A01C] font-bold transition-colors"
            >
              Reply
            </button>
            
            {replies.filter((r: any) => r.parent_answer_id === answer.id).length > 0 && (
              <button 
                onClick={() => toggleReplies(answer.id)}
                className="text-[9px] text-[#F4A01C] font-bold transition-colors flex items-center gap-1 bg-[#FFF3D6] px-1.5 py-0.5 rounded"
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
          <div className="pl-4 ml-2 border-l-2 border-surface dark:border-[#38434F] mb-2 mt-2">
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-[#283036] rounded-xl border border-slate-100 dark:border-[#38434F]/80 p-3.5 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:shadow-sm"
    >
      {/* Feed Card Header details */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {post.is_college_post ? (
            <>
              <div
                onClick={() => router.push(`/colleges/${post.communities?.colleges?.slug || post.communities?.slug}`)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-[#283036] flex items-center justify-center font-bold text-slate-800 dark:text-white text-sm overflow-hidden flex-shrink-0 cursor-pointer border border-surface dark:border-[#38434F] ring-2 ring-purple-100 dark:ring-purple-900/40"
              >
                {post.communities?.colleges?.logo_url ? (
                  <img src={post.communities.colleges.logo_url} alt={post.communities.colleges.name} className="w-full h-full object-cover" />
                ) : (
                  post.communities?.colleges?.name?.[0] || post.communities?.colleges?.short_name?.[0] || 'C'
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => router.push(`/colleges/${post.communities?.colleges?.slug || post.communities?.slug}`)}
                    className="font-bold text-slate-900 dark:text-white hover:text-[#F4A01C] text-sm text-left leading-none truncate"
                  >
                    {post.communities?.colleges?.name || post.communities?.colleges?.short_name || 'College'}
                  </button>
                  <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full border bg-[#FFF3D6] text-[#E09410] border-[#F4A01C]/30 shrink-0">
                    Official
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-[#B0B7BE] font-medium mt-0.5 truncate">
                  {post.communities?.colleges?.short_name || 'Campus'} Hub • {timeAgo(post.created_at)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div
                onClick={() => router.push(`/u/${post.users?.unique_id}`)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-[#283036] flex items-center justify-center font-bold text-slate-800 dark:text-white text-sm overflow-hidden flex-shrink-0 cursor-pointer border border-surface dark:border-[#38434F]"
              >
                {post.users?.avatar_url ? (
                  <img src={post.users.avatar_url} alt={post.users?.full_name} className="w-full h-full object-cover" />
                ) : (
                  post.users?.full_name?.[0] || 'U'
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => router.push(`/u/${post.users?.unique_id}`)}
                    className="font-bold text-slate-900 dark:text-white hover:text-[#F4A01C] text-sm text-left leading-none truncate"
                  >
                    {post.users?.full_name}
                  </button>
                  <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full border shrink-0 ${post.users?.role === 'senior' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-app dark:bg-[#1D2226] text-slate-600 dark:text-[#B0B7BE] border border-surface dark:border-[#38434F]'}`}>
                    {post.users?.role === 'senior' ? 'Senior' : 'Mentee'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-[#B0B7BE] font-medium mt-0.5 truncate">
                  {post.communities?.colleges?.short_name || 'Campus'} Hub • {timeAgo(post.created_at)}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Post type badging */}
        <span
          style={{ background: ts.bg, color: ts.color, borderColor: ts.border }}
          className="text-[7px] sm:text-[8px] font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded border tracking-wide whitespace-nowrap flex items-center gap-0.5 sm:gap-1 shrink-0"
        >
          <span className="text-[10px] sm:text-[12px]">{ts.icon}</span>
          <span className="hidden sm:inline">{ts.label}</span>
        </span>
      </div>

      {/* Title click through */}
      {post.title && (
        <h4
          onClick={() => router.push(`/community/c/${post.communities?.slug}/p/${post.id}`)}
          className="font-extrabold text-slate-950 dark:text-white text-sm sm:text-base hover:text-[#F4A01C] transition-colors leading-snug tracking-tight mb-1.5 cursor-pointer line-clamp-2"
        >
          {post.title}
        </h4>
      )}

      {/* Content text */}
      <div className="mb-2.5">
        <PostContentRenderer content={post.content} clamp={expandedContent ? undefined : 3} />

        {(() => {
          const show = isLongContent
          console.log('[FeedPost RENDER] Read More button:', { postId: post.id, isLongContent: show, expanded: expandedContent })
          return show && (
            <button
              onClick={() => onToggleContent(post.id)}
              className="text-[#F4A01C] font-bold hover:underline mt-1 cursor-pointer block text-[11px]"
            >
              {expandedContent ? 'Show less' : 'Read more'}
            </button>
          )
        })()}
      </div>

      {/* Attached media inside card via MediaGallery */}
      {post.image_url && post.image_url.length > 0 && (
        <div className="-mx-3.5 sm:-mx-5 mb-2.5">
          <MediaGallery imageUrls={post.image_url} />
        </div>
      )}

      {/* Tags line */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {post.tags.map((t: string) => (
            <span key={t} className="text-[9px] sm:text-[10px] font-semibold text-slate-500 dark:text-[#B0B7BE] bg-app dark:bg-[#1D2226] border border-surface dark:border-[#38434F] px-2 sm:px-2.5 py-0.5 rounded-full">
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
                className="w-5 h-5 rounded-full border-[1.5px] border-white bg-slate-100 dark:bg-[#283036] flex items-center justify-center text-[7px] font-black text-slate-600 dark:text-[#B0B7BE] overflow-hidden flex-shrink-0"
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
          <span className="text-[11px] text-slate-500 dark:text-[#B0B7BE] font-medium leading-tight group-hover:text-[#F4A01C] transition-colors">
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

      {/* Action footer bar */}
      <div className="flex items-center justify-between gap-1 border-t border-surface dark:border-[#38434F] pt-2.5 mt-1 w-full text-slate-500 dark:text-[#B0B7BE]">
        {/* Appreciation button */}
        <button
          onClick={() => onVote(post.id, 'upvote')}
          className={`group flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-extrabold transition-all duration-200 cursor-pointer border ${
            voteData?.userVote === 'upvote'
              ? 'bg-gradient-to-br from-purple-100 to-indigo-50 border-[#F4A01C]/30 text-[#F4A01C] shadow-[0_2px_8px_-2px_rgba(124,58,237,0.3)]'
              : 'bg-transparent border-transparent hover:border-[#F4A01C]/30 hover:bg-[#FFF3D6] dark:hover:bg-purple-900/20 text-slate-500 dark:text-[#B0B7BE] hover:text-[#F4A01C]'
          }`}
        >
          <ArrowBigUp 
            className={`w-[18px] h-[18px] sm:w-4 sm:h-4 transition-all duration-200 ${
              voteData?.userVote === 'upvote' 
                ? 'fill-[#F4A01C] text-[#F4A01C] scale-110' 
                : 'text-slate-400 dark:text-[#B0B7BE] group-hover:scale-110 group-hover:text-[#F4A01C]'
            }`} 
          />
          <span>{voteData?.upvotes || 0}</span>
        </button>

        {/* Answers button */}
        <button
          onClick={() => onToggleAnswerSection(post.id)}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold hover:bg-app dark:hover:bg-[#1D2226] hover:text-slate-700 dark:hover:text-white transition-all duration-200 cursor-pointer"
        >
          <MessageSquare className="w-[16px] h-[16px] sm:w-3.5 sm:h-3.5" />
          <span>{post.answer_count || 0}</span>
        </button>

        {/* Share button */}
        <button
          onClick={() => onSharePost(post)}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold hover:bg-app dark:hover:bg-[#1D2226] hover:text-slate-700 dark:hover:text-white transition-all duration-200 cursor-pointer"
        >
          <Share2 className="w-[16px] h-[16px] sm:w-3.5 sm:h-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Detail button */}
        <button
          onClick={() => router.push(`/community/c/${post.communities?.slug}/p/${post.id}`)}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold text-[#F4A01C] hover:bg-[#FFF3D6] dark:hover:bg-purple-900/20 transition-all duration-200 cursor-pointer"
        >
          <span className="hidden sm:inline">Detail</span>
          <ArrowRight className="w-[16px] h-[16px] sm:w-3.5 sm:h-3.5" />
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
        <div className="border-t border-surface dark:border-[#38434F] mt-2.5 pt-2.5 space-y-2">
          <h5 className="font-bold text-[10px] text-slate-800 dark:text-white flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-[#F4A01C]" />
            <span>Answers ({postAnswers?.length || 0})</span>
          </h5>

          {answersLoading && (
            <div className="flex items-center justify-center gap-2 py-3">
              <div className="w-3.5 h-3.5 border-2 border-[#F4A01C]/20 border-t-purple-600 rounded-full animate-spin" />
              <span className="text-[9px] text-slate-400 dark:text-[#B0B7BE] font-semibold">Loading answers...</span>
            </div>
          )}

          {!answersLoading && postAnswers?.length === 0 && (
            <p className="text-[9px] text-slate-400 dark:text-[#B0B7BE] font-semibold text-center py-1">
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
