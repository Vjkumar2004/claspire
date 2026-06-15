'use client'

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
  LogOut
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

  return (
    <aside className="w-64 bg-white dark:bg-[#283036] border-r border-gray-200 dark:border-[#38434F] min-h-screen flex flex-col">
      <div className="p-5 border-b border-gray-200 dark:border-[#38434F]">
        <Link href="/admin" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-gray-900 dark:text-white leading-tight">Claspire</p>
            <p className="text-[9px] font-bold text-purple-600 uppercase tracking-widest">Admin Panel</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
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
                  ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                  : 'text-gray-600 dark:text-[#B0B7BE] hover:bg-gray-50 dark:hover:bg-[#1D2226]'
              }`}
            >
              <Icon size={18} className="shrink-0" />
              <span>{item.label}</span>
              {isActive && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-gray-200 dark:border-[#38434F]">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-gray-500 dark:text-[#B0B7BE] hover:bg-gray-50 dark:hover:bg-[#1D2226] transition-all no-underline"
        >
          <LogOut size={16} className="shrink-0" />
          <span>Back to App</span>
        </Link>
      </div>
    </aside>
  )
}
