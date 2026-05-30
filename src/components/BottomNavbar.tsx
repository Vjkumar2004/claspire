'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Search, Plus, User, Users as Groups, GraduationCap, LayoutDashboard, Building2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

// Type definitions for navigation items
type RegularNavItem = {
  label: string
  icon: React.ComponentType<any>
  href: string
  badge?: number
}

type CenterNavItem = {
  label: string
  icon: React.ComponentType<any>
  href: string
  isCenter: true
}

type NavItem = RegularNavItem | CenterNavItem

const BottomNavbar = () => {
  const pathname = usePathname()
  const { user } = useAuth()
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    if (!user?.id) return

    // Fetch initial unread count
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/messages/unread-count')
        const data = await res.json()
        setUnreadMessageCount(data.count || 0)
      } catch (err) {
        console.error('Failed to fetch unread count:', err)
      }
    }

    fetchUnreadCount()

    // Subscribe to real-time messages
    const channel = supabase
      .channel(`unread-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          setUnreadMessageCount(prev => prev + 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload: any) => {
          if (payload.new.is_read && !payload.old.is_read) {
            setUnreadMessageCount(prev => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  // Auto-hide navbar on scroll
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
      scrollTimeout = setTimeout(() => { }, 150)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
    }
  }, [lastScrollY])

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleToggle = (e: any) => {
      setIsMobileMenuOpen(e.detail.open)
    }

    window.addEventListener('claspire:mobileMenuToggle', handleToggle)
    return () => window.removeEventListener('claspire:mobileMenuToggle', handleToggle)
  }, [])

  // Base navigation items
  const navItems: NavItem[] = [
    {
      label: 'Community',
      icon: Building2,
      href: '/community',
    },
    {
      label: 'Colleges',
      icon: Search,
      href: '/colleges',
    },
    {
      label: 'Groups',
      icon: Users,
      href: '/groups',
    },
    {
      label: 'Ask',
      icon: Plus,
      href: '/community?create=true', // Center button
      isCenter: true,
    },
    {
      label: 'Seniors',
      icon: GraduationCap,
      href: '/seniors',
    },
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: user?.role === 'senior' ? '/dashboard/senior' : '/dashboard/junior',
    },
    {
      label: 'Profile',
      icon: User,
      href: '/profile',
    },
  ]

  if (pathname === '/' || pathname === '/login' || pathname === '/signup' || pathname === '/dashboard/senior/messages' || pathname === '/dashboard/junior/messages' || pathname.includes('/community/c/') && pathname.includes('/group/') || isMobileMenuOpen) return null

  return (
    <div
      className={`md:hidden fixed bottom-0 left-0 w-full z-[999] bottom-navbar transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
    >
      <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] px-2 py-2">
        <div className="flex items-center justify-between gap-1">
          {navItems.map((item, index) => {
            // Type guard functions
            const isCenterItem = (navItem: NavItem): navItem is CenterNavItem =>
              'isCenter' in navItem && navItem.isCenter === true

            const isRegularItem = (navItem: NavItem): navItem is RegularNavItem =>
              !('isCenter' in navItem)

            // Handle center button (Ask)
            if (isCenterItem(item)) {
              const Icon = item.icon
              return (
                <Link
                  key={index}
                  href={item.href}
                  className="relative -top-3 flex flex-col items-center group no-underline"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(124,58,237,0.4)] transition-transform group-hover:scale-110 active:scale-95">
                    <Icon size={28} className="text-white" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Ask
                  </span>
                </Link>
              )
            }

            // Handle regular navigation items
            if (isRegularItem(item)) {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={index}
                  href={item.href}
                  className="flex-1 flex flex-col items-center py-2 no-underline group relative"
                >
                  <div className={`transition-all duration-200 ${isActive ? 'text-purple-600 scale-110' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />

                    {/* Notification Badge */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] mt-1 font-bold tracking-tight transition-colors duration-200 ${isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    {item.label}
                  </span>
                </Link>
              )
            }

            return null
          })}
        </div>
      </div>
    </div>
  )
}

export default BottomNavbar
