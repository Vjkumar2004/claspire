'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ThumbsUp, Crown, GraduationCap } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Voter {
  id: string
  full_name: string
  unique_id: string
  role: 'student' | 'senior' | 'admin'
  avatar_url: string | null
  voted_at: string
}

interface LikesModalProps {
  isOpen: boolean
  onClose: () => void
  postId: string
  totalLikes: number
  currentUser?: { id: string } | null
}

export default function LikesModal({ isOpen, onClose, postId, totalLikes, currentUser }: LikesModalProps) {
  const router = useRouter()
  const [voters, setVoters] = useState<Voter[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)

  const fetchVoters = useCallback(async (pageNum: number, isLoadMore = false) => {
    if (loadingRef.current) return
    loadingRef.current = true

    if (!isLoadMore) {
      setLoading(true)
    } else {
      setIsLoadingMore(true)
    }
    setError(null)

    try {
      const response = await fetch(
        `/api/posts/${postId}/voters?page=${pageNum}&limit=20`
      )
      
      if (!response.ok) throw new Error('Failed to fetch voters')
      
      const data = await response.json()
      
      if (data.success) {
        if (isLoadMore) {
          setVoters(prev => [...prev, ...data.voters])
        } else {
          setVoters(data.voters)
        }
        setHasMore(data.hasMore)
        setPage(pageNum)
      }
    } catch (err) {
      console.error('Failed to fetch voters:', err)
      setError('Failed to load voters. Please try again.')
    } finally {
      setLoading(false)
      setIsLoadingMore(false)
      loadingRef.current = false
    }
  }, [postId])

  useEffect(() => {
    if (isOpen && postId) {
      setVoters([])
      setPage(1)
      setHasMore(true)
      setError(null)
      fetchVoters(1, false)
    }
  }, [isOpen, postId, fetchVoters])

  // Infinite scroll using Intersection Observer
  useEffect(() => {
    if (!isOpen || !hasMore || isLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          fetchVoters(page + 1, true)
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [isOpen, hasMore, isLoadingMore, page, fetchVoters])

  const handleUserClick = (uniqueId: string) => {
    router.push(`/u/${uniqueId}`)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <ThumbsUp className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-gray-900">Found this helpful</h2>
                  <p className="text-xs text-gray-500">{totalLikes} {totalLikes === 1 ? 'person' : 'people'}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Voters List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {error && (
                <div className="text-center py-8">
                  <p className="text-sm text-red-600">{error}</p>
                  <button
                    onClick={() => fetchVoters(1, false)}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {loading && voters.length === 0 && (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                        <div className="h-2 bg-gray-200 rounded animate-pulse w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && voters.length === 0 && !error && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No voters yet</p>
                </div>
              )}

              {voters.map((voter) => (
                <button
                  key={voter.id}
                  onClick={() => handleUserClick(voter.unique_id)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
                    {voter.avatar_url ? (
                      <img
                        src={voter.avatar_url}
                        alt={voter.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-gray-600">
                        {voter.full_name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900 truncate">
                        {voter.full_name}
                      </span>
                      {voter.id === currentUser?.id && (
                        <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                          (You)
                        </span>
                      )}
                      {voter.role === 'senior' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded">
                          <Crown className="w-2.5 h-2.5" />
                          Senior
                        </span>
                      )}
                      {voter.role === 'student' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded">
                          <GraduationCap className="w-2.5 h-2.5" />
                          Student
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">@{voter.unique_id}</p>
                  </div>
                </button>
              ))}

              {isLoadingMore && (
                <div className="space-y-3 pt-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                        <div className="h-2 bg-gray-200 rounded animate-pulse w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!hasMore && voters.length > 0 && (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-400">End of list</p>
                </div>
              )}

              <div ref={loadMoreRef} className="h-4" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
