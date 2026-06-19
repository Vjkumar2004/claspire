'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import AuthLayout from '@/components/auth/AuthLayout'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleSuccess = async (credential: string) => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 404 && data.isNewUser) {
          sessionStorage.setItem('google_signup_email', data.email)
          sessionStorage.setItem('google_signup_id', data.google_id)
          router.push(`/signup?email=${encodeURIComponent(data.email)}`)
          return
        }
        setError(data.error || 'Google login failed')
        return
      }

      localStorage.setItem(
        'claspire_user',
        JSON.stringify(data.user)
      )

      sessionStorage.setItem('claspire_notif_trigger', 'login')
      window.location.href = data.user.onboarding_completed === false ? '/onboarding' : '/community'

    } catch (err) {
      console.error(err)
      setError('Network error during Google authentication. Try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      if (user.onboarding_completed === false) {
        router.push('/onboarding')
      } else {
        router.push('/community')
      }
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#1D2226]">
        <div className="w-10 h-10 border-3 border-surface dark:border-[#38434F] border-t-purple-600 rounded-full animate-spin" />
      </div>
    )
  }

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email and password required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      localStorage.setItem(
        'claspire_user',
        JSON.stringify(data.user)
      )

      sessionStorage.setItem('claspire_notif_trigger', 'login')
      window.location.href = data.user.onboarding_completed === false ? '/onboarding' : '/community'

    } catch {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-[28px] font-bold text-gray-900 dark:text-white font-plus-jakarta-sans">
            Welcome back <span className="inline-block">👋</span>
          </h1>
          <p className="text-[15px] text-gray-400 dark:text-[#B0B7BE] font-plus-jakarta-sans">
            Continue your journey on{' '}
            <span className="font-semibold text-gray-600 dark:text-[#B0B7BE]">Claspire</span>
          </p>
        </div>

        <div className="space-y-6">
          <GoogleSignInButton
            buttonId="google-login-btn"
            onSuccess={handleGoogleSuccess}
            onError={(err) => setError(err)}
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface dark:border-[#38434F]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#FAFAFA] dark:bg-[#1D2226] px-3 text-gray-400 dark:text-[#B0B7BE] font-medium">or sign in with email</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-[#B0B7BE] mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full h-11 px-3.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-[#B0B7BE] border border-surface dark:border-[#38434F] rounded-xl outline-none transition-all duration-150 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 bg-surface dark:bg-[#283036]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-[#B0B7BE]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700 no-underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="w-full h-11 px-3.5 pr-11 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-[#B0B7BE] border border-surface dark:border-[#38434F] rounded-xl outline-none transition-all duration-150 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 bg-surface dark:bg-[#283036]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#B0B7BE] hover:text-gray-600 dark:hover:text-[#B0B7BE] bg-transparent border-none cursor-pointer p-0"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-11 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-sm font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 border-none cursor-pointer disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign in'
            )}
          </button>

          <p className="text-center text-sm text-gray-400 dark:text-[#B0B7BE]">
            Don't have an account?{' '}
            <Link href="/signup" className="font-semibold text-purple-600 hover:text-purple-700 no-underline">
              Sign up free
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-300 dark:text-[#B0B7BE] font-medium">
          © 2026 Claspire · India's College Community
        </p>
      </div>
    </AuthLayout>
  )
}
