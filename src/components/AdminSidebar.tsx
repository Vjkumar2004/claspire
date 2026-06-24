'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Shield,
  Users,
  Building2,
  MessageSquare,
  FileText,
  ChevronRight,
  LogOut,
  Menu,
  X
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/college-claims', label: 'College Claims', icon: Shield },
  { href: '/admin/users', label: 'Users', icon: Users, disabled: true },
  { href: '/admin/colleges', label: 'Colleges', icon: Building2, disabled: true },
  { href: '/admin/communities', label: 'Communities', icon: MessageSquare, disabled: true },
  { href: '/admin/reports', label: 'Reports', icon: FileText, disabled: true },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const close = useCallback(() => setIsOpen(false), [])

  // ESC key closes drawer
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [close])

  // Body scroll lock when drawer open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close drawer on navigation
  useEffect(() => {
    close()
  }, [pathname, close])

  return (
    <>
      {/* Hamburger button — mobile only, fixed top-left */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-3 left-3 z-50 lg:hidden p-2 rounded-lg bg-surface dark:bg-[#283036] border border-surface dark:border-[#38434F] shadow-md text-gray-600 dark:text-[#B0B7BE] hover:text-gray-900 dark:hover:text-white transition-colors"
        aria-label="Open admin menu"
      >
        <Menu size={20} />
      </button>

      {/* Backdrop — mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={close}
          aria-hidden
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-[min(85vw,320px)] lg:w-64
          flex flex-col bg-surface dark:bg-[#283036] border-r border-surface dark:border-[#38434F]
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:relative lg:z-auto
          min-h-screen
        `}
      >
        <div className="p-5 border-b border-surface dark:border-[#38434F] flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5 no-underline" onClick={close}>
            <div className="w-8 h-8 bg-gradient-to-br from-[#0A2540] to-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 dark:text-white leading-tight">Claspire</p>
              <p className="text-[9px] font-bold text-[#F4A01C] uppercase tracking-widest">Admin Panel</p>
            </div>
          </Link>
          <button
            onClick={close}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-surface-hover dark:hover:bg-[#1D2226] transition-colors"
            aria-label="Close admin menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return item.disabled ? (
              <div
                key={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-gray-300 dark:text-[#5A6570] cursor-not-allowed select-none"
                title="Coming soon"
              >
                <Icon size={18} className="shrink-0" />
                <span>{item.label}</span>
                <span className="ml-auto text-[8px] uppercase tracking-wider bg-gray-100 dark:bg-[#1D2226] px-1.5 py-0.5 rounded">Soon</span>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all no-underline ${
                  isActive
                    ? 'bg-[#FFF3D6] dark:bg-purple-900/20 text-[#E09410] dark:text-purple-300'
                    : 'text-gray-600 dark:text-[#B0B7BE] hover:bg-app dark:hover:bg-[#1D2226]'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span>{item.label}</span>
                {isActive && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-surface dark:border-[#38434F]">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-gray-500 dark:text-[#B0B7BE] hover:bg-app dark:hover:bg-[#1D2226] transition-all no-underline"
          >
            <LogOut size={16} className="shrink-0" />
            <span>Back to App</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
