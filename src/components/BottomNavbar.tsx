'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Search, Plus, User, Users as Groups, GraduationCap, LayoutDashboard, Building2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/contexts/NotificationsContext'

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
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollY = React.useRef(0)

  // Auto-hide navbar on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY.current) {
        setIsVisible(true)
      }

      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { pendingNetworkRequestsCount } = useNotifications()

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
      label: 'Network',
      icon: GraduationCap,
      href: '/network',
      badge: pendingNetworkRequestsCount,
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
      className="md:hidden fixed bottom-0 left-0 w-full z-[999] bottom-navbar"
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(150%)',
        transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
      }}
    >
      <div className="bg-surface/95 dark:bg-[#1D2226]/95 backdrop-blur-xl border-t border-surface/60 dark:border-[#38434F]/60 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] px-2 pt-1.5 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
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
                  className="relative flex flex-col items-center group no-underline justify-center flex-1"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md transition-transform group-hover:scale-110 active:scale-95">
                    <Icon size={20} className="text-white" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-3">
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
                  onClick={(e) => {
                    if (item.href === '/community' && pathname === '/community') {
                      e.preventDefault()
                      window.dispatchEvent(new CustomEvent('REFRESH_COMMUNITY_FEED'))
                    }
                  }}
                  className="flex-1 flex flex-col items-center py-1 no-underline group relative"
                >
                  <div className={`transition-all duration-200 flex flex-col items-center justify-center h-7 ${isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-600 dark:text-[#6B7B8B] dark:group-hover:text-[#B0B7BE]'}`}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'scale-110' : ''} />

                    {/* Notification Badge */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute top-0 right-2 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white px-0.5">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] mt-0.5 font-bold tracking-tight transition-colors duration-200 ${isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-600 dark:text-[#6B7B8B] dark:group-hover:text-[#B0B7BE]'}`}>
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
