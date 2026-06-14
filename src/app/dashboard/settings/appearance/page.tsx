'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Sun, Moon, Monitor } from 'lucide-react'

const options = [
  {
    value: 'light' as const,
    label: 'Light',
    description: 'Always use light mode',
    icon: Sun,
    preview: 'bg-white border-gray-200',
  },
  {
    value: 'dark' as const,
    label: 'Dark',
    description: 'Always use dark mode',
    icon: Moon,
    preview: 'bg-[#1D2226] border-[#38434F]',
  },
  {
    value: 'system' as const,
    label: 'System',
    description: 'Follow your operating system',
    icon: Monitor,
    preview: 'bg-gradient-to-r from-white to-[#1D2226] border-gray-200 dark:border-[#38434F]',
  },
]

export default function AppearancePage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Appearance</h1>
        <p className="text-sm text-slate-500 dark:text-[#B0B7BE] mt-1">
          Customize how Claspire looks on your device.
        </p>
      </div>

      <div className="grid gap-4">
        {options.map((option) => {
          const Icon = option.icon
          const isActive = theme === option.value
          return (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={`relative flex items-start gap-4 p-5 rounded-xl border-2 text-left w-full transition-all ${
                isActive
                  ? 'border-[#7C3AED] dark:border-[#0A66C2] bg-purple-50 dark:bg-[#0A66C2]/10'
                  : 'border-gray-200 dark:border-[#38434F] bg-white dark:bg-[#283036] hover:border-gray-300 dark:hover:border-[#4A5568]'
              }`}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                isActive
                  ? 'bg-[#7C3AED] dark:bg-[#0A66C2] text-white'
                  : 'bg-gray-100 dark:bg-[#1D2226] text-gray-500 dark:text-[#B0B7BE]'
              }`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 dark:text-white">
                  {option.label}
                </div>
                <div className="text-sm text-slate-500 dark:text-[#B0B7BE] mt-0.5">
                  {option.description}
                </div>
                {/* Preview indicator */}
                <div className={`mt-3 h-8 rounded-lg border ${option.preview} flex items-center px-3 gap-2`}>
                  <div className={`w-2 h-2 rounded-full ${
                    option.value === 'dark' ? 'bg-white' : 'bg-gray-400'
                  }`} />
                  <div className={`h-1.5 rounded-full w-16 ${
                    option.value === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                  }`} />
                  <div className={`h-1.5 rounded-full w-10 ${
                    option.value === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                  }`} />
                </div>
              </div>
              {isActive && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#7C3AED] dark:bg-[#0A66C2] flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <p className="text-xs text-slate-400 dark:text-[#B0B7BE] mt-6 text-center">
        Your preference is saved locally and syncs across devices.
      </p>
    </div>
  )
}
