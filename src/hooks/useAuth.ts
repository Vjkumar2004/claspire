'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  role: 'student' | 'senior' | 'admin'
  unique_id: string
  full_name: string
  college_id: string | null
  avatar_url?: string
  is_premium?: boolean
  premium_plan?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async (retryCount = 0) => {
    try {
      console.log('useAuth - fetching user...', retryCount > 0 ? `(retry ${retryCount})` : '')
      const res = await fetch('/api/auth/me')
      console.log('useAuth - response status:', res.status)
      
      if (res.ok) {
        const data = await res.json()
        console.log('useAuth - response data:', data)
        setUser(data.user || null)
      } else if (res.status === 401) {
        // 401 = not logged in, that's ok
        console.log('useAuth - not logged in (401)')
        setUser(null)
      } else {
        // Other errors - retry once
        if (retryCount < 1) {
          console.log('useAuth - retrying fetch...')
          setTimeout(() => fetchUser(retryCount + 1), 500)
        } else {
          console.error('useAuth - unexpected status after retry:', res.status)
          setUser(null)
        }
      }
    } catch (error) {
      console.error('useAuth - fetch error:', error)
      if (retryCount < 1) {
        console.log('useAuth - retrying fetch after error...')
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
