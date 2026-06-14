'use client'
import { useState, useEffect, useRef } from 'react'
import { Bell, Check, ExternalLink, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createPortal } from 'react-dom'
import { useNotifications } from '@/contexts/NotificationsContext'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  link?: string
  is_read: boolean
  sender_id?: string
  receiver_id?: string
  created_at: string
}

interface NotificationBellProps {
  align?: 'left' | 'right'
  dark?: boolean // If true, use dark text (for light backgrounds)
}

export default function NotificationBell({ align = 'right', dark = false }: NotificationBellProps) {
  const { user } = useAuth()
  const { notifications, unreadCount, loadMore, hasMore, loading } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, right: 0, isMobile: false })
  const [isClearing, setIsClearing] = useState(false)
  const [confirmingClear, setConfirmingClear] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updateCoords = () => {
        const rect = buttonRef.current!.getBoundingClientRect()
        setCoords({
          top: rect.bottom + 8,
          left: rect.left,
          right: window.innerWidth - rect.right,
          isMobile: window.innerWidth < 640
        })
      }
      updateCoords()
      window.addEventListener('scroll', updateCoords)
      window.addEventListener('resize', updateCoords)
      return () => {
        window.removeEventListener('scroll', updateCoords)
        window.removeEventListener('resize', updateCoords)
      }
    }
  }, [isOpen])



  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && 
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Infinite scroll: load more when sentinel enters viewport
  useEffect(() => {
    if (!isOpen || !hasMore || !sentinelRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [isOpen, hasMore, loading, loadMore])

  const markAsRead = async (id?: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ notificationIds: id ? [id] : undefined })
      })
      // The NotificationsContext will receive Realtime UPDATE events and update state automatically.
    } catch (err) {
      console.error('Failed to mark read:', err)
    }
  }

  const clearAllNotifications = async () => {
    setIsClearing(true)
    setConfirmingClear(false)
    try {
      await fetch('/api/notifications/clear', {
        method: 'DELETE'
      })
    } catch (err) {
      console.error('Failed to clear notifications:', err)
    } finally {
      setIsClearing(false)
    }
  }

  const handleConfirmClear = async () => {
    await clearAllNotifications()
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const handleBellClick = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleBellClick}
        className={`relative p-2 rounded-full transition-colors focus:outline-none ${
          dark 
            ? 'text-gray-600 dark:text-[#B0B7BE] hover:bg-gray-100 dark:hover:bg-[#1D2226]' 
            : 'text-white hover:bg-white/10'
        }`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={`absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ${
            dark ? 'ring-white dark:ring-[#1D2226]' : 'ring-indigo-900'
          }`}>
            {unreadCount}
          </span>
        )}
      </button>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: coords.top,
                width: coords.isMobile ? 'calc(100vw - 32px)' : 'min(calc(100vw - 32px), 20rem)',
                ...(coords.isMobile
                  ? { left: 16, right: 16 }
                  : align === 'left'
                    ? { left: Math.max(16, Math.min(coords.left, window.innerWidth - 336)) }
                    : { right: Math.max(16, coords.right) }),
              } as React.CSSProperties}
              className={`
                max-h-[calc(100vh-100px)] md:max-h-[480px] 
                bg-white dark:bg-[#283036] rounded-2xl border border-gray-200 dark:border-[#38434F] shadow-2xl z-[9999] 
                overflow-hidden flex flex-col
              `}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100 dark:border-[#38434F] flex items-center justify-between bg-white/50 dark:bg-[#283036]/50 backdrop-blur-sm sticky top-0 z-10">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAsRead()}
                      className="text-[11px] font-bold text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1"
                    >
                      <Check size={12} />
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={() => setConfirmingClear(true)}
                      disabled={isClearing}
                      className="text-[11px] font-bold text-red-400 hover:text-red-500 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {isClearing ? (
                        <div className="h-3 w-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                        </svg>
                      )}
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="overflow-y-auto flex-1 custom-scrollbar relative">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 bg-gray-50 dark:bg-[#1D2226] rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell size={24} className="text-gray-300 dark:text-[#B0B7BE]" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 dark:text-[#B0B7BE]">No notifications yet</p>
                    <p className="text-xs text-gray-400 dark:text-[#B0B7BE] mt-1">We'll let you know when something happens</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-[#38434F]">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => !notif.is_read && markAsRead(notif.id)}
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-[#1D2226] transition-all cursor-pointer group relative ${!notif.is_read ? 'bg-purple-50/30' : ''}`}
                      >
                        {!notif.is_read && (
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-purple-500" />
                        )}
                        
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                               <p className={`text-[13px] leading-tight mb-1 ${!notif.is_read ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-700 dark:text-[#B0B7BE]'}`}>
                                  {notif.title}
                                </p>
                               <span className="text-[10px] text-gray-400 dark:text-[#B0B7BE] whitespace-nowrap flex items-center gap-1 mt-0.5">
                                 <Clock size={10} />
                                 {getTimeAgo(notif.created_at)}
                               </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-[#B0B7BE] leading-normal line-clamp-2">
                              {notif.message}
                            </p>
                            
                            {notif.link && (
                              <Link 
                                href={notif.link}
                                onClick={() => setIsOpen(false)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 mt-2 hover:underline"
                              >
                                View Details
                                <ExternalLink size={10} />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Sentinel for infinite scroll */}
                    <div ref={sentinelRef} className="py-4 flex items-center justify-center">
                      {loading && (
                        <div className="h-5 w-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                      )}
                      {!hasMore && notifications.length >= 50 && (
                        <p className="text-[10px] text-gray-400 dark:text-[#B0B7BE]">All caught up</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Confirmation overlay */}
                {confirmingClear && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/95 dark:bg-[#283036]/95 backdrop-blur-sm z-20 flex items-center justify-center p-6"
                    style={{ borderRadius: 'inherit' }}
                  >
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Clear all notifications?</p>
                      <p className="text-xs text-gray-500 dark:text-[#B0B7BE] mb-4">This action cannot be undone.</p>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={handleConfirmClear}
                          disabled={isClearing}
                          className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                        >
                          {isClearing ? 'Clearing...' : 'Clear all'}
                        </button>
                        <button
                          onClick={() => setConfirmingClear(false)}
                          className="px-4 py-2 bg-gray-100 dark:bg-[#1D2226] text-gray-700 dark:text-[#B0B7BE] text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-[#1D2226] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-gray-100 dark:border-[#38434F] bg-gray-50/50 dark:bg-[#1D2226]/50 text-center">
                  <Link 
                     href={user?.role === 'senior' ? '/dashboard/senior' : '/dashboard/junior'}
                     onClick={() => setIsOpen(false)}
                     className="text-[11px] font-bold text-gray-400 dark:text-[#B0B7BE] uppercase tracking-wider hover:text-purple-600 transition-colors no-underline block"
                  >
                     View All Activity
                  </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
