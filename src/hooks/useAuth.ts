'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePoints } from '@/contexts/PointsContext'

interface User {
  id: string
  email: string
  role: 'student' | 'senior' | 'admin'
  unique_id: string
  full_name: string
  college_id: string | null
  avatar_url?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { showAward } = usePoints()

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async (retryCount = 0) => {
    try {
      const res = await fetch('/api/auth/me')
      
      if (res.ok) {
        const data = await res.json()
        setUser(data.user || null)
        
        // Show daily RP award if earned today
        if (data.dailyRPEarned) {
          showAward(1, "Daily visit bonus 🌅")
        }
      } else if (res.status === 401) {
        // 401 = not logged in, that's ok
        setUser(null)
      } else {
        // Other errors - retry once
        if (retryCount < 1) {
          setTimeout(() => fetchUser(retryCount + 1), 500)
        } else {
          setUser(null)
        }
      }
    } catch (error) {
      console.error('useAuth - fetch error:', error)
      if (retryCount < 1) {
        setTimeout(() => fetchUser(retryCount + 1), 500)
      } else {
        setUser(null)
      }
    } finally {
      if (retryCount === 0) {
        setLoading(false)
      }
    }
  }

  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
    } catch {}
    setUser(null)
    router.push('/')
  }

  return { user, loading, signOut, refetch: fetchUser }
}
