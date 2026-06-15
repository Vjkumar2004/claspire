'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Zap, MessageCircle,
  CheckCircle, Clock, Eye, Send, ChevronRight,
  Share2, GraduationCap, Crown, Sparkles, Users, Building2
} from 'lucide-react'
import MediaGallery from '@/components/MediaGallery'
import LikesModal from '@/components/community/LikesModal'
import { supabase } from '@/lib/supabase'

interface RecentUpvoter {
  id: string
  full_name: string
  avatar_url: string | null
}

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
      const matchStart = line.indexOf(match, lastIdx)
      const before = line.substring(lastIdx, matchStart)
      if (before) parts.push(<span key={`t-${lineIndex}-${matchIndex}`}>{before}</span>)
      parts.push(
        <a
          key={`l-${lineIndex}-${matchIndex}`}
          href={match}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[#7C3AED] font-semibold break-all hover:underline"
        >
          {match}
        </a>
      )
      lastIdx = matchStart + match.length
    })
    const remaining = line.substring(lastIdx)
    if (remaining) parts.push(<span key={`t-${lineIndex}-end`}>{remaining}</span>)
    return (
      <span key={`line-${lineIndex}`}>
        {parts}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    )
  })
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

const formatCount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

const typeStyles: Record<string, { label: string; icon: string; classes: string }> = {
  doubt: { label: 'Doubt', icon: '❓', classes: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30' },
  discussion: { label: 'Discussion', icon: '💬', classes: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30' },
  experience: { label: 'Experience', icon: '⭐', classes: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30' },
  referral_hunt: { label: 'Referral Hunt', icon: '🎯', classes: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' },
  resource: { label: 'Resource', icon: '📚', classes: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30' },
}

const getTypeStyle = (type: string) => {
  return typeStyles[type] || { label: type, icon: '📝', classes: 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-500/30' }
}

export default function PostDetailPage({ params }: { params: Promise<{ slug: string; postId: string }> }) {
  const router = useRouter()
  const [slug, setSlug] = useState('')
  const [postId, setPostId] = useState('')
  const [post, setPost] = useState<any>(null)
  const [answers, setAnswers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newAnswer, setNewAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({})
  const [replyToAnswerId, setReplyToAnswerId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null)
  const [voteLoading, setVoteLoading] = useState(false)
  const [viewCount, setViewCount] = useState(0)
  const [recentUpvoters, setRecentUpvoters] = useState<RecentUpvoter[]>([])
  const [likesModalOpen, setLikesModalOpen] = useState(false)
  const viewRecordedRef = useRef(false)

  useEffect(() => {
    const getParams = async () => {
      const { slug: s, postId: p } = await params
      setSlug(s)
      setPostId(p)
    }
    getParams()
  }, [params])

  const recordView = useCallback(async (id: string) => {
    if (viewRecordedRef.current) return
    viewRecordedRef.current = true

    try {
      const res = await fetch(`/api/posts/${id}/view`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (typeof data.view_count === 'number') {
          setViewCount(data.view_count)
        }
      }
    } catch (err) {
      console.error('Failed to record view:', err)
    }
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const json = await res.json()
        setCurrentUser(json.user)
      }
    } catch {
      // Not logged in
    }
  }

  const fetchPost = async () => {
    setLoading(true)
    try {
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_author_id_fkey (
            id, full_name, unique_id,
            role, is_verified, avatar_url
          ),
            communities (
              slug,
              display_name,
              member_count,
              colleges ( name, short_name, logo_url )
            ),
            is_college_post
        `)
        .eq('id', postId)
        .single()

      if (postError || !postData) {
        console.error('Post fetch error:', postError)
        router.push(`/community/c/${slug}`)
        return
      }

      setPost(postData)
      setViewCount(postData.view_count || 0)
      recordView(postId)

      const { data: answersData } = await supabase
        .from('answers')
        .select(`
          *,
          users!answers_author_id_fkey (
            id, full_name, unique_id,
            role, is_verified, avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('is_accepted', { ascending: false })
        .order('upvote_count', { ascending: false })
        .order('created_at', { ascending: true })

      setAnswers(answersData || [])

      const { data: recentVotes } = await supabase
        .from('votes')
        .select('user_id, created_at, users:user_id ( id, full_name, avatar_url )')
        .eq('post_id', postId)
        .eq('vote_type', 'upvote')
        .order('created_at', { ascending: false })
        .limit(10)

      if (recentVotes) {
        const seen = new Set<string>()
        const upvoters: RecentUpvoter[] = []
        recentVotes.forEach((vote: any) => {
          if (vote.users && !seen.has(vote.users.id) && upvoters.length < 3) {
            seen.add(vote.users.id)
            upvoters.push({
              id: vote.users.id,
              full_name: vote.users.full_name,
              avatar_url: vote.users.avatar_url,
            })
          }
        })
        setRecentUpvoters(upvoters)
      }

      try {
        const authRes = await fetch('/api/auth/me')
        if (authRes.ok) {
          const authData = await authRes.json()
          if (authData.user) {
            const { data: voteData } = await supabase
              .from('votes')
              .select('vote_type')
              .eq('post_id', postId)
              .eq('user_id', authData.user.id)
              .single()
            if (voteData) {
              setUserVote(voteData.vote_type as 'upvote' | 'downvote')
            }
          }
        }
      } catch {}
    } catch (err) {
      console.error('Error:', err)
      router.push(`/community/c/${slug}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (postId) {
      window.scrollTo(0, 0)
      viewRecordedRef.current = false
      fetchPost()
      fetchCurrentUser()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (voteLoading) return

    try {
      const authRes = await fetch('/api/auth/me')
      if (!authRes.ok) {
        router.push('/login')
        return
      }
      const authData = await authRes.json()
      if (!authData.user) {
        router.push('/login')
        return
      }

      setVoteLoading(true)

      const response = await fetch('/api/posts/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, vote_type: voteType }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          const { data: updatedPost } = await supabase
            .from('posts')
            .select('upvote_count, downvote_count')
            .eq('id', postId)
            .single()

          if (updatedPost) {
            setPost((prev: any) => ({
              ...prev,
              upvote_count: updatedPost.upvote_count,
              downvote_count: updatedPost.downvote_count,
            }))
          }
          setUserVote(result.action === 'removed' ? null : voteType)

          const { data: recentVotes } = await supabase
            .from('votes')
            .select('user_id, created_at, users:user_id ( id, full_name, avatar_url )')
            .eq('post_id', postId)
            .eq('vote_type', 'upvote')
            .order('created_at', { ascending: false })
            .limit(10)

          if (recentVotes) {
            const seen = new Set<string>()
            const upvoters: RecentUpvoter[] = []
            recentVotes.forEach((vote: any) => {
              if (vote.users && !seen.has(vote.users.id) && upvoters.length < 3) {
                seen.add(vote.users.id)
                upvoters.push({
                  id: vote.users.id,
                  full_name: vote.users.full_name,
                  avatar_url: vote.users.avatar_url,
                })
              }
            })
            setRecentUpvoters(upvoters)
          }
        }
      }
    } catch (err) {
      console.error('Vote error:', err)
    } finally {
      setVoteLoading(false)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!newAnswer.trim() || submitting) return

    try {
      const authRes = await fetch('/api/auth/me')
      if (!authRes.ok) {
        router.push('/login')
        return
      }
      const authData = await authRes.json()
      if (!authData.user) {
        router.push('/login')
        return
      }

      setSubmitting(true)

      const { data, error } = await supabase
        .from('answers')
        .insert({
          post_id: postId,
          author_id: authData.user.id,
          content: newAnswer.trim(),
          parent_answer_id: replyToAnswerId || null,
        })
        .select(`
          *,
          users!answers_author_id_fkey (
            id, full_name, unique_id,
            role, is_verified, avatar_url
          )
        `)
        .single()

      if (!error && data) {
        setAnswers((prev) => [...prev, data])
        setNewAnswer('')

        if (!replyToAnswerId) {
          await supabase
            .from('posts')
            .update({ answer_count: (post.answer_count || 0) + 1 })
            .eq('id', postId)
          setPost((prev: any) => ({
            ...prev,
            answer_count: (prev.answer_count || 0) + 1,
          }))
        } else {
          setExpandedReplies((prev) => ({ ...prev, [replyToAnswerId as string]: true }))
        }

        setReplyToAnswerId(null)
      }
    } catch (err) {
      console.error('Answer error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/community/c/${slug}/p/${postId}`
    const title = post?.title || 'Claspire post'
    const text = post?.content?.slice(0, 120) || 'Check out this post on Claspire'

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url })
        return
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      alert('Link copied to clipboard')
    } catch {
      prompt('Copy this link:', url)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5F4FF] dark:from-[#1D2226] to-white dark:to-[#1D2226] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-purple-100 border-t-[#7C3AED] rounded-full animate-spin" />
          <p className="text-sm text-slate-400 dark:text-[#B0B7BE] font-semibold">Loading post...</p>
        </div>
      </div>
    )
  }

  if (!post) return null

  const ts = getTypeStyle(post.type)
  const topLevelAnswers = answers.filter((a: any) => !a.parent_answer_id)
  const replies = answers.filter((a: any) => a.parent_answer_id)
  const collegeName = post.communities?.colleges?.short_name || post.communities?.colleges?.name
  const communityName = post.communities?.display_name || collegeName || slug
  const memberCount = post.communities?.member_count

  const renderAnswer = (answer: any, isReply = false) => (
    <motion.div
      key={answer.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isReply ? 'py-3 border-b border-slate-100 dark:border-[#38434F] last:border-b-0' : 'bg-white dark:bg-[#283036] rounded-xl border border-slate-200 dark:border-[#38434F] dark:border-[#38434F] p-4 mb-3 shadow-sm'} ${
        answer.is_accepted && !isReply ? 'border-emerald-200 bg-emerald-50/30' : ''
      }`}
    >
      {answer.is_accepted && !isReply && (
        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full mb-3">
          <CheckCircle className="w-3 h-3" />
          ACCEPTED ANSWER
        </div>
      )}

      <div className={`flex items-start gap-3 ${isReply ? 'pl-2' : ''}`}>
        <button
          onClick={() => router.push(`/u/${answer.users?.unique_id}`)}
          className={`${isReply ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs'} rounded-lg bg-gradient-to-br from-[#7C3AED] to-cyan-400 flex items-center justify-center font-bold text-white overflow-hidden flex-shrink-0 hover:scale-105 transition-transform`}
        >
          {answer.users?.avatar_url ? (
            <img src={answer.users.avatar_url} alt={answer.users.full_name} className="w-full h-full object-cover" />
          ) : (
            answer.users?.full_name?.[0] || 'U'
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <button
              onClick={() => router.push(`/u/${answer.users?.unique_id}`)}
              className="text-sm font-bold text-slate-900 dark:text-white hover:text-[#7C3AED] transition-colors"
            >
              {answer.users?.full_name}
            </button>
            {answer.users?.role === 'senior' && (
              <span className="text-[8px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded">
                Senior
              </span>
            )}
            <span className="text-[10px] text-slate-400 dark:text-[#B0B7BE] font-medium">{timeAgo(answer.created_at)}</span>
          </div>

          <div className={`text-sm text-slate-600 dark:text-[#B0B7BE] leading-relaxed ${isReply ? '' : ''}`}>
            {convertUrlsToLinks(answer.content)}
          </div>

          {!isReply && (
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => {
                  setReplyToAnswerId(replyToAnswerId === answer.id ? null : answer.id)
                  if (replyToAnswerId !== answer.id) setNewAnswer('')
                }}
                className="text-xs font-bold text-slate-400 dark:text-[#B0B7BE] hover:text-[#7C3AED] transition-colors"
              >
                Reply
              </button>
              {replies.filter((r: any) => r.parent_answer_id === answer.id).length > 0 && (
                <button
                  onClick={() => setExpandedReplies((prev) => ({ ...prev, [answer.id]: !prev[answer.id] }))}
                  className="text-xs font-bold text-[#7C3AED] bg-purple-50 px-2.5 py-1 rounded-md hover:bg-purple-100 transition-colors"
                >
                  {expandedReplies[answer.id]
                    ? 'Hide Replies'
                    : `Show Replies (${replies.filter((r: any) => r.parent_answer_id === answer.id).length})`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {!isReply && expandedReplies[answer.id] && replies.filter((r: any) => r.parent_answer_id === answer.id).length > 0 && (
        <div className="mt-3 ml-4 pl-4 border-l-2 border-slate-100 dark:border-[#38434F]">
          {replies.filter((r: any) => r.parent_answer_id === answer.id).map((reply: any) => renderAnswer(reply, true))}
        </div>
      )}
    </motion.div>
  )

  const sidebarCardClass =
    'bg-white dark:bg-[#283036] rounded-2xl border border-slate-200 dark:border-[#38434F] dark:border-[#38434F] shadow-sm overflow-hidden'

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F4FF] dark:from-[#1D2226] via-white dark:via-[#283036] to-slate-50 dark:to-[#1D2226]">
      {/* Breadcrumb */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#1D2226]/80 backdrop-blur-md border-b border-purple-100/60 dark:border-[#38434F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-[#B0B7BE]">
          <button onClick={() => router.push('/community')} className="text-[#7C3AED] hover:underline">
            Community
          </button>
          <ChevronRight className="w-3 h-3 shrink-0" />
          <button onClick={() => router.push(`/community/c/${slug}`)} className="text-[#7C3AED] hover:underline">
            c/{slug}
          </button>
          <ChevronRight className="w-3 h-3 shrink-0" />
          <span className="text-slate-500 dark:text-[#B0B7BE] truncate">{post.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-28">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#7C3AED] dark:text-purple-300 bg-white dark:bg-[#283036] border border-purple-100 dark:border-[#38434F] rounded-xl px-4 py-2 mb-6 hover:bg-purple-50 dark:hover:bg-[#1D2226] transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Two-column layout: main content + sticky sidebar (desktop only) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8 items-start">
          {/* ── Main column: post + discussion ── */}
          <div className="min-w-0 space-y-6">
            <motion.article
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-[#283036] rounded-2xl border border-slate-200 dark:border-[#38434F] dark:border-[#38434F] shadow-sm overflow-hidden"
            >
              <div className="h-1.5 bg-gradient-to-r from-[#7C3AED] via-violet-400 to-cyan-400" />

              <div className="p-5 sm:p-7">
                {/* Compact author header — full context on mobile, minimal on desktop */}
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3 min-w-0">
                    {post.is_college_post ? (
                      <>
                        <button
                          onClick={() => router.push(`/colleges/${post.communities?.colleges?.slug || post.communities?.slug}`)}
                          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-100 dark:bg-[#283036] flex items-center justify-center font-bold text-slate-800 dark:text-white text-sm overflow-hidden shrink-0 hover:scale-105 transition-transform shadow-md"
                        >
                          {post.communities?.colleges?.logo_url ? (
                            <img src={post.communities.colleges.logo_url} alt={post.communities.colleges.name} className="w-full h-full object-cover" />
                          ) : (
                            post.communities?.colleges?.name?.[0] || post.communities?.colleges?.short_name?.[0] || 'C'
                          )}
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => router.push(`/colleges/${post.communities?.colleges?.slug || post.communities?.slug}`)}
                              className="font-bold text-slate-900 dark:text-white hover:text-[#7C3AED] transition-colors text-sm"
                            >
                              {post.communities?.colleges?.name || post.communities?.colleges?.short_name || 'College'}
                            </button>
                            <span className="lg:hidden inline-flex items-center gap-0.5 text-[8px] font-black uppercase bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 px-1.5 py-0.5 rounded">
                              Official
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[10px] text-slate-400 dark:text-[#B0B7BE] font-semibold">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeAgo(post.created_at)}
                            </span>
                            <span className="lg:hidden flex items-center gap-2">
                              <span className="text-slate-300 dark:text-[#B0B7BE]">•</span>
                              <button
                                onClick={() => router.push(`/community/c/${slug}`)}
                                className="text-[#7C3AED] bg-purple-50 px-2 py-0.5 rounded-full hover:bg-purple-100 transition-colors"
                              >
                                c/{slug}
                              </button>
                              {collegeName && (
                                <>
                                  <span className="text-slate-300 dark:text-[#B0B7BE]">•</span>
                                  <span className="flex items-center gap-1">
                                    <GraduationCap className="w-3 h-3" />
                                    {collegeName}
                                  </span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => router.push(`/u/${post.users?.unique_id}`)}
                          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#7C3AED] to-cyan-400 flex items-center justify-center font-bold text-white text-sm overflow-hidden shrink-0 hover:scale-105 transition-transform shadow-md"
                        >
                          {post.users?.avatar_url ? (
                            <img src={post.users.avatar_url} alt={post.users.full_name} className="w-full h-full object-cover" />
                          ) : (
                            post.users?.full_name?.[0] || 'U'
                          )}
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => router.push(`/u/${post.users?.unique_id}`)}
                              className="font-bold text-slate-900 dark:text-white hover:text-[#7C3AED] transition-colors text-sm"
                            >
                              {post.users?.full_name}
                            </button>
                            {/* Badges visible on mobile only — desktop sidebar has full author card */}
                            <span className="lg:hidden flex items-center gap-1.5 flex-wrap">
                              {post.users?.role === 'senior' && (
                                <span className="inline-flex items-center gap-0.5 text-[8px] font-black uppercase bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/30 px-1.5 py-0.5 rounded">
                                  <Crown className="w-2.5 h-2.5" />
                                  Senior
                                </span>
                              )}
                              {post.users?.is_verified && (
                                <span className="text-[8px] font-black uppercase bg-purple-50 dark:bg-purple-500/20 text-[#7C3AED] dark:text-purple-300 border border-purple-100 dark:border-purple-500/30 px-1.5 py-0.5 rounded">
                                  Verified
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[10px] text-slate-400 dark:text-[#B0B7BE] font-semibold">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeAgo(post.created_at)}
                            </span>
                            {/* Community/college on mobile only */}
                            <span className="lg:hidden flex items-center gap-2">
                              <span className="text-slate-300 dark:text-[#B0B7BE]">•</span>
                              <button
                                onClick={() => router.push(`/community/c/${slug}`)}
                                className="text-[#7C3AED] bg-purple-50 px-2 py-0.5 rounded-full hover:bg-purple-100 transition-colors"
                              >
                                c/{slug}
                              </button>
                              {collegeName && (
                                <>
                                  <span className="text-slate-300 dark:text-[#B0B7BE]">•</span>
                                  <span className="flex items-center gap-1">
                                    <GraduationCap className="w-3 h-3" />
                                    {collegeName}
                                  </span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border tracking-wide flex items-center gap-1 shrink-0 ${ts.classes}`}>
                    <span>{ts.icon}</span>
                    {ts.label}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl lg:text-[1.65rem] font-extrabold text-slate-950 dark:text-white leading-snug tracking-tight mb-4">
                  {post.title}
                </h1>

                <div className="text-sm sm:text-[15px] text-slate-600 dark:text-[#B0B7BE] leading-relaxed mb-5 whitespace-pre-wrap">
                  {convertUrlsToLinks(post.content)}
                </div>

                <MediaGallery imageUrls={post.image_url} />

                {post.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4 mb-5">
                    {post.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="text-[10px] font-bold text-[#7C3AED] dark:text-purple-300 bg-purple-50 dark:bg-purple-500/20 border border-purple-100 dark:border-purple-500/30 px-2 py-0.5 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {(post.upvote_count || 0) > 0 && recentUpvoters.length > 0 && (
                  <button
                    onClick={() => setLikesModalOpen(true)}
                    className="flex items-center gap-2 mb-5 group w-full text-left"
                  >
                    <div className="flex -space-x-2">
                      {recentUpvoters.slice(0, 3).map((upvoter, i) => (
                        <div
                          key={upvoter.id}
                          className="w-7 h-7 rounded-full border-2 border-white dark:border-[#38434F] bg-slate-100 dark:bg-[#283036] dark:bg-[#283036] flex items-center justify-center text-[9px] font-black text-slate-600 dark:text-[#B0B7BE] overflow-hidden"
                          style={{ zIndex: 3 - i }}
                        >
                          {upvoter.avatar_url ? (
                            <img src={upvoter.avatar_url} alt={upvoter.full_name} className="w-full h-full object-cover" />
                          ) : (
                            upvoter.full_name?.[0]?.toUpperCase() || 'U'
                          )}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-[#B0B7BE] font-semibold group-hover:text-[#7C3AED] transition-colors">
                      {formatCount(post.upvote_count || 0)} appreciation{(post.upvote_count || 0) !== 1 ? 's' : ''} — tap to see who
                    </span>
                  </button>
                )}

                {/* Interactive engagement row */}
                <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100 dark:border-[#38434F]">
                {/* Appreciation button */}
                <button
                  onClick={() => handleVote('upvote')}
                  disabled={voteLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    userVote === 'upvote'
                       ? 'bg-purple-100 dark:bg-purple-500/20 text-[#7C3AED] dark:text-purple-300 shadow-sm'
                      : 'hover:bg-slate-100 dark:hover:bg-[#1D2226] dark:bg-[#283036] text-slate-500 dark:text-[#B0B7BE]'
                  } ${voteLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  {formatCount(post.upvote_count || 0)} RP
                </button>

                  {/* Stats pills on mobile only — desktop sidebar shows these */}
                  <div
                    className={`lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border ${
                      post.is_answered
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-slate-50 dark:bg-[#1D2226] text-slate-500 dark:text-[#B0B7BE] border-slate-200 dark:border-[#38434F]'
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {post.answer_count || 0} {post.is_answered ? 'Solved' : 'Answers'}
                    {post.is_answered && <CheckCircle className="w-3 h-3" />}
                  </div>

                  <div className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-[#1D2226] text-slate-500 dark:text-[#B0B7BE] border border-slate-200 dark:border-[#38434F]">
                    <Eye className="w-3.5 h-3.5" />
                    {formatCount(viewCount)} {viewCount === 1 ? 'view' : 'views'}
                  </div>

                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-[#1D2226] text-slate-500 dark:text-[#B0B7BE] border border-slate-200 dark:border-[#38434F] hover:bg-purple-50 hover:text-[#7C3AED] hover:border-purple-200 transition-colors ml-auto"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>
                </div>
              </div>
            </motion.article>

            {/* Discussion */}
            <section>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <MessageCircle className="w-4 h-4 text-[#7C3AED]" />
                Discussion
                <span className="text-sm font-bold text-slate-400 dark:text-[#B0B7BE]">({answers.length})</span>
              </h2>

              {answers.length === 0 ? (
                <div className="bg-white dark:bg-[#283036] rounded-2xl border border-slate-200 dark:border-[#38434F] dark:border-[#38434F] p-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-5 h-5 text-[#7C3AED] dark:text-purple-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-600 dark:text-[#B0B7BE] mb-1">No answers yet</p>
                  <p className="text-xs text-slate-400 dark:text-[#B0B7BE]">Be the first to help — share your experience!</p>
                </div>
              ) : (
                topLevelAnswers.map((answer: any) => renderAnswer(answer, false))
              )}
            </section>

            {/* Answer composer */}
            {currentUser ? (
              <div className="bg-white dark:bg-[#283036] rounded-2xl border border-slate-200 dark:border-[#38434F] dark:border-[#38434F] p-5 shadow-sm sticky bottom-4">
                {replyToAnswerId ? (
                  <div className="flex items-center justify-between mb-3 bg-slate-50 dark:bg-[#1D2226] px-3 py-2 rounded-lg">
                    <span className="text-xs text-slate-500 dark:text-[#B0B7BE] font-medium">
                      Replying to{' '}
                      <span className="font-bold text-slate-800 dark:text-white">
                        {answers.find((a) => a.id === replyToAnswerId)?.users?.full_name}
                      </span>
                    </span>
                    <button
                      onClick={() => setReplyToAnswerId(null)}
                      className="text-xs font-bold text-slate-400 dark:text-[#B0B7BE] hover:text-slate-600 dark:text-[#B0B7BE]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-slate-800 dark:text-white mb-3">Your Answer</p>
                )}
                <textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder={replyToAnswerId ? 'Write your reply...' : 'Write your answer here...'}
                  className="w-full min-h-[80px] p-3 rounded-xl border border-slate-200 dark:border-[#38434F] bg-white dark:bg-[#283036] text-sm text-slate-700 dark:text-[#B0B7BE] outline-none resize-y focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/20 transition-all"
                />
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!newAnswer.trim() || submitting}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-[#7C3AED] to-cyan-500 rounded-xl px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-200 transition-all"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Posting...' : replyToAnswerId ? 'Post Reply' : 'Post Answer'}
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#283036] rounded-2xl border border-slate-200 dark:border-[#38434F] dark:border-[#38434F] p-8 text-center shadow-sm">
                <p className="text-sm text-slate-500 dark:text-[#B0B7BE] font-medium mb-4">Login to post your answer</p>
                <button
                  onClick={() => router.push('/login')}
                  className="text-sm font-bold text-white bg-gradient-to-r from-[#7C3AED] to-cyan-500 rounded-xl px-6 py-2.5 hover:shadow-lg hover:shadow-purple-200 transition-all"
                >
                  Login →
                </button>
              </div>
            )}
          </div>

          {/* ── Sidebar: desktop only, sticky ── */}
          <aside className="hidden lg:block sticky top-6 self-start space-y-4 w-[320px]">
            {/* About Author / College */}
            <div className={sidebarCardClass}>
              <div className="px-4 py-3 border-b border-slate-100 dark:border-[#38434F]">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">
                  {post.is_college_post ? 'Official Post' : 'About Author'}
                </h3>
              </div>
              <div className="p-4">
                {post.is_college_post ? (
                  <button
                    onClick={() => router.push(`/colleges/${post.communities?.colleges?.slug || post.communities?.slug}`)}
                    className="flex items-center gap-3 w-full text-left group mb-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#1D2226] flex items-center justify-center font-bold text-slate-800 dark:text-white text-lg overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                      {post.communities?.colleges?.logo_url ? (
                        <img src={post.communities.colleges.logo_url} alt={post.communities.colleges.name} className="w-full h-full object-cover" />
                      ) : (
                        post.communities?.colleges?.name?.[0] || post.communities?.colleges?.short_name?.[0] || 'C'
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white group-hover:text-[#7C3AED] transition-colors truncate">
                        {post.communities?.colleges?.name || post.communities?.colleges?.short_name || 'College'}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="inline-flex items-center gap-0.5 text-[8px] font-black uppercase bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 px-1.5 py-0.5 rounded">
                          Official
                        </span>
                      </div>
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={() => router.push(`/u/${post.users?.unique_id}`)}
                    className="flex items-center gap-3 w-full text-left group mb-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C3AED] to-cyan-400 flex items-center justify-center font-bold text-white text-lg overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                      {post.users?.avatar_url ? (
                        <img src={post.users.avatar_url} alt={post.users.full_name} className="w-full h-full object-cover" />
                      ) : (
                        post.users?.full_name?.[0] || 'U'
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white group-hover:text-[#7C3AED] transition-colors truncate">
                        {post.users?.full_name}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {post.users?.role === 'senior' && (
                          <span className="inline-flex items-center gap-0.5 text-[8px] font-black uppercase bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/30 px-1.5 py-0.5 rounded">
                            <Crown className="w-2.5 h-2.5" />
                            Senior
                          </span>
                        )}
                        {post.users?.is_verified && (
                          <span className="text-[8px] font-black uppercase bg-purple-50 dark:bg-purple-500/20 text-[#7C3AED] dark:text-purple-300 border border-purple-100 dark:border-purple-500/30 px-1.5 py-0.5 rounded">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )}
                <dl className="space-y-2.5 text-xs">
                  {post.is_college_post ? (
                    <div>
                      <dt className="text-slate-400 dark:text-[#B0B7BE] font-semibold mb-0.5">Type</dt>
                      <dd className="font-bold text-slate-700 dark:text-[#B0B7BE] flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-[#B0B7BE]" />
                        College Official Post
                      </dd>
                    </div>
                  ) : (
                    <div>
                      <dt className="text-slate-400 dark:text-[#B0B7BE] font-semibold mb-0.5">Role</dt>
                      <dd className="font-bold text-slate-700 dark:text-[#B0B7BE] capitalize">
                        {post.users?.role === 'senior' ? 'Senior Mentor' : 'Student / Mentee'}
                      </dd>
                    </div>
                  )}
                  {collegeName && (
                    <div>
                      <dt className="text-slate-400 dark:text-[#B0B7BE] font-semibold mb-0.5">College</dt>
                      <dd className="font-bold text-slate-700 dark:text-[#B0B7BE] flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400 dark:text-[#B0B7BE]" />
                        {collegeName}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-slate-400 dark:text-[#B0B7BE] font-semibold mb-0.5">Community</dt>
                    <dd>
                              <button
                                onClick={() => router.push(`/community/c/${slug}`)}
                                className="text-[#7C3AED] dark:text-purple-300 bg-purple-50 dark:bg-purple-500/20 px-2 py-0.5 rounded-full hover:bg-purple-100 dark:hover:bg-purple-500/30 transition-colors"
                              >
                                c/{slug}
                              </button>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Community */}
            <div className={sidebarCardClass}>
              <div className="px-4 py-3 border-b border-slate-100 dark:border-[#38434F]">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">Community</h3>
              </div>
              <div className="p-4">
                <button
                  onClick={() => router.push(`/community/c/${slug}`)}
                  className="flex items-start gap-3 w-full text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/20 border border-purple-100 dark:border-purple-500/30 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-[#7C3AED]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white group-hover:text-[#7C3AED] transition-colors truncate">
                      {communityName}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-[#B0B7BE] font-semibold mt-0.5">c/{slug}</p>
                    {collegeName && (
                      <p className="text-xs text-slate-500 dark:text-[#B0B7BE] font-medium mt-2 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400 dark:text-[#B0B7BE]" />
                        {post.communities?.colleges?.name || collegeName}
                      </p>
                    )}
                    {typeof memberCount === 'number' && (
                      <p className="text-xs text-slate-500 dark:text-[#B0B7BE] font-medium mt-2 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400 dark:text-[#B0B7BE]" />
                        {formatCount(memberCount)} members
                      </p>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Engagement stats */}
            <div className={sidebarCardClass}>
              <div className="px-4 py-3 border-b border-slate-100 dark:border-[#38434F]">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">Engagement</h3>
              </div>
              <div className="p-4 space-y-3">
                <button
                  onClick={() => (post.upvote_count || 0) > 0 && setLikesModalOpen(true)}
                  className={`flex items-center justify-between w-full text-left ${(post.upvote_count || 0) > 0 ? 'hover:bg-slate-50 dark:hover:bg-[#1D2226] -mx-2 px-2 py-1 rounded-lg transition-colors cursor-pointer' : ''}`}
                >
                  <span className="text-xs font-semibold text-slate-500 dark:text-[#B0B7BE] flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" />
                    Appreciations
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">{formatCount(post.upvote_count || 0)}</span>
                </button>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-[#B0B7BE] flex items-center gap-2">
                    <MessageCircle className="w-3.5 h-3.5" />
                    Answers
                  </span>
                  <span className={`text-sm font-extrabold ${post.is_answered ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                    {post.answer_count || 0}
                    {post.is_answered && (
                      <CheckCircle className="w-3.5 h-3.5 inline ml-1 -mt-0.5" />
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-[#B0B7BE] flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5" />
                    Views
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">{formatCount(viewCount)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <LikesModal
        isOpen={likesModalOpen}
        onClose={() => setLikesModalOpen(false)}
        postId={postId}
        totalLikes={post.upvote_count || 0}
        currentUser={currentUser}
      />
    </div>
  )
}
