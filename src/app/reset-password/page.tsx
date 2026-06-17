'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react'

// Note: This is a client component, so we don't export Next.js routing config

function ResetPasswordPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  useEffect(() => {
    // Handle case where searchParams is not available (build time)
    if (typeof window === 'undefined' || !searchParams) {
      // During build time, just return without doing anything
      return
    }

    const tokenParam = searchParams.get('token')
    const emailParam = searchParams.get('email')
    
    if (!tokenParam || !emailParam) {
      setError('Invalid reset link. Please request a new password reset.')
      setTokenValid(false)
      return
    }
    
    setToken(tokenParam)
    setEmail(decodeURIComponent(emailParam))
    
    // Validate token
    validateToken(tokenParam, emailParam)
  }, [searchParams])

  const validateToken = async (resetToken: string, userEmail: string) => {
    try {
      const response = await fetch('/api/auth/validate-reset-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: resetToken, 
          email: userEmail 
        }),
      })

      const data = await response.json()
      
      if (response.ok && data.valid) {
        setTokenValid(true)
      } else {
        setError(data.error || 'Invalid or expired reset link')
        setTokenValid(false)
      }
    } catch (err) {
      setError('Failed to validate reset link')
      setTokenValid(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        if (data.requiresMigration) {
          setError('Database setup required. Please contact the administrator to complete the password reset feature setup.')
        } else {
          setError(data.error || 'Failed to reset password')
        }
      }
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-app dark:bg-[#1D2226] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-surface dark:bg-[#283036] rounded-2xl shadow-lg p-8 text-center">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-[#B0B7BE]">Validating reset link...</p>
          </div>
        </div>
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-app dark:bg-[#1D2226] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-surface dark:bg-[#283036] rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Invalid Reset Link
            </h1>
            
            <p className="text-gray-600 dark:text-[#B0B7BE] mb-8">
              {error || 'This password reset link is invalid or has expired.'}
            </p>
            
            <div className="space-y-3">
              <Link
                href="/forgot-password"
                className="block w-full bg-purple-600 text-white py-3 rounded-lg text-sm font-semibold text-center hover:bg-purple-700 transition-colors"
              >
                Request New Reset Link
              </Link>
              
              <Link
                href="/login"
                className="block w-full bg-gray-100 dark:bg-[#283036] text-gray-700 dark:text-[#B0B7BE] py-3 rounded-lg text-sm font-semibold text-center hover:bg-gray-200 dark:hover:bg-[#1D2226] transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-app dark:bg-[#1D2226] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-surface dark:bg-[#283036] rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Password Reset Successful
            </h1>
            
            <p className="text-gray-600 dark:text-[#B0B7BE] mb-8">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            
            <Link
              href="/login"
              className="block w-full bg-black text-white py-3 rounded-lg text-sm font-semibold text-center hover:bg-gray-800 transition-colors"
            >
              Continue to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-app dark:bg-[#1D2226] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex justify-center mb-8">
          <span className="font-plus-jakarta-sans font-bold text-2xl text-black dark:text-white">
            cl<span style={{ color: '#7C3AED' }}>aspire</span>
          </span>
        </Link>

        <div className="bg-surface dark:bg-[#283036] rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={24} className="text-purple-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Reset Your Password
            </h1>
            
            <p className="text-gray-600 dark:text-[#B0B7BE] text-sm">
              Enter your new password for<br />
              <span className="font-semibold text-gray-900 dark:text-white">{email}</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-[#B0B7BE] mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-[#38434F] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-[#222B31] dark:text-white dark:placeholder:text-[#8B949E] dark:focus:bg-[#283036]"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-[#B0B7BE] hover:text-gray-600 dark:hover:text-white dark:text-[#B0B7BE]"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-[#B0B7BE] mt-1">Must be at least 8 characters long</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-[#B0B7BE] mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-[#38434F] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-[#222B31] dark:text-white dark:placeholder:text-[#8B949E] dark:focus:bg-[#283036]"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-[#B0B7BE] hover:text-gray-600 dark:hover:text-white dark:text-[#B0B7BE]"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="w-full bg-black text-white py-3 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-[#B0B7BE]">
              Remember your password?{' '}
              <Link href="/login" className="text-purple-600 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-[#B0B7BE] mt-6">
          © 2024 Claspire · India's College Community
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-app dark:bg-[#1D2226] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-surface dark:bg-[#283036] rounded-2xl shadow-lg p-8 text-center">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-[#B0B7BE]">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordPageContent />
    </Suspense>
  )
}
