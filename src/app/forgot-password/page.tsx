'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, ArrowLeft, CheckCircle, Key } from 'lucide-react'

// Note: This is a client component, so we don't export Next.js routing config

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [resetToken, setResetToken] = useState('')

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStep('otp')
      } else {
        const errorData = await response.json()
        if (errorData.requiresMigration) {
          setError('Database setup required. Please contact the administrator to complete the password reset feature setup.')
        } else {
          setError(errorData.error || 'Failed to send OTP')
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      })

      const data = await response.json()

      if (response.ok) {
        setResetToken(data.resetToken)
        setSuccess(true)
      } else {
        setError(data.error || 'Invalid OTP')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              OTP Verified Successfully
            </h1>
            
            <p className="text-gray-600 mb-6">
              Your OTP has been verified. You can now reset your password.
            </p>
            
            <Link
              href={`/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`}
              className="block w-full bg-black text-white py-3 rounded-lg text-sm font-semibold text-center hover:bg-gray-800 transition-colors"
            >
              Continue to Reset Password
            </Link>
          </div>
          
          <p className="text-center text-xs text-gray-400 mt-6">
            © 2024 Claspire · India's College Community
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex justify-center mb-8">
          <span className="font-plus-jakarta-sans font-bold text-2xl text-black">
            cl<span style={{ color: '#7C3AED' }}>aspire</span>
          </span>
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Back Button */}
          <Link 
            href="/login"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            Back to login
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {step === 'email' ? (
                <Mail size={24} className="text-purple-600" />
              ) : (
                <Key size={24} className="text-purple-600" />
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {step === 'email' ? 'Forgot your password?' : 'Enter OTP'}
            </h1>
            
            <p className="text-gray-600 text-sm">
              {step === 'email' 
                ? 'Enter your email address and we\'ll send you an OTP to reset your password.'
                : `We've sent a 6-digit OTP to ${email}`
              }
            </p>
          </div>

          {/* Forms */}
          {step === 'email' ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your email address"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-black text-white py-3 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-xl font-semibold tracking-widest"
                  placeholder="000000"
                />
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-black text-white py-3 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Verifying...
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('email')
                    setOtp('')
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  Back to Email
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link href="/login" className="text-purple-600 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2024 Claspire · India's College Community
        </p>
      </div>
    </div>
  )
}
