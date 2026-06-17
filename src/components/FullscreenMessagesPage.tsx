'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import DashboardMessages from '@/components/DashboardMessages'

interface FullscreenMessagesPageProps {
  role: 'senior' | 'junior'
}

export default function FullscreenMessagesPage({ role }: FullscreenMessagesPageProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialUserId = searchParams.get('user') || undefined
  const backHref = role === 'senior' ? '/dashboard/senior' : '/dashboard/junior'

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
      return
    }
    const qs = searchParams.toString()
    const preserve = qs ? `?${qs}` : ''
    if (!loading && user && role === 'senior' && user.role !== 'senior') {
      router.replace(`/dashboard/junior/messages${preserve}`)
    }
    if (!loading && user && role === 'junior' && user.role === 'senior') {
      router.replace(`/dashboard/senior/messages${preserve}`)
    }
  }, [loading, user, router, role, searchParams])

  if (loading) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-surface dark:bg-[#283036]">
        <Loader2 className="animate-spin text-purple-600" size={28} />
      </div>
    )
  }

  if (!user) return null

  return (
    <DashboardMessages
      currentUserId={user.id}
      role={role}
      initialUserId={initialUserId}
      fullscreen
      backHref={backHref}
    />
  )
}
