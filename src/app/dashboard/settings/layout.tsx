'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Palette, User, Shield, ChevronRight } from 'lucide-react'

const settingsNav = [
  { label: 'Appearance', href: '/dashboard/settings/appearance', icon: Palette },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1D2226]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-sm text-slate-500 dark:text-[#B0B7BE] mt-1">
            Manage your account and preferences
          </p>
        </div>

        <div className="flex gap-8 flex-col md:flex-row">
          {/* Sidebar */}
          <nav className="w-full md:w-56 flex-shrink-0">
            <div className="space-y-1">
              {settingsNav.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-purple-50 dark:bg-[#0A66C2]/15 text-[#7C3AED] dark:text-white'
                        : 'text-gray-600 dark:text-[#B0B7BE] hover:bg-gray-100 dark:hover:bg-[#283036]'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
