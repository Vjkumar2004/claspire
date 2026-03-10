'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [activeRole, setActiveRole] = useState<'student' | 'senior'>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

      // Save to localStorage
      localStorage.setItem(
        'claspire_user',
        JSON.stringify(data.user)
      )

      // Full reload for cookie
      if (data.user.role === 'senior') {
        window.location.href = '/dashboard/senior'
      } else {
        window.location.href = '/dashboard/junior'
      }

    } catch {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: '#F9FAFB',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Plus Jakarta Sans, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        border: '1px solid #E5E7EB'
      }}>

        {/* Logo */}
        <div style={{
          textAlign: 'center',
          marginBottom: 28
        }}>
          <div style={{
            fontSize: 28,
            marginBottom: 8
          }}>🎓</div>
          <h1 style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#0A0A0A',
            margin: 0
          }}>
            Clas<span style={{
              color: '#7C3AED'
            }}>pire</span>
          </h1>
        </div>

        {/* Heading */}
        <h2 style={{
          fontFamily: 'Instrument Serif, serif',
          fontSize: 26,
          fontWeight: 400,
          color: '#0A0A0A',
          margin: '0 0 6px'
        }}>
          Welcome back 👋
        </h2>
        <p style={{
          fontSize: 14,
          color: '#9CA3AF',
          margin: '0 0 24px'
        }}>
          Don't have an account?{' '}
          <Link href="/signup" style={{
            color: '#7C3AED',
            fontWeight: 600,
            textDecoration: 'none'
          }}>
            Sign up free
          </Link>
        </p>

        {/* Student / Senior Toggle */}
        <div style={{
          display: 'flex',
          background: '#F3F4F6',
          borderRadius: 10,
          padding: 4,
          marginBottom: 24,
          gap: 4
        }}>
          {(['student', 'senior'] as const).map(role => (
            <button
              key={role}
              onClick={() => {
                setActiveRole(role)
                setError('')
              }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'Plus Jakarta Sans',
                transition: 'all 0.2s',
                background: activeRole === role
                  ? 'white' : 'transparent',
                color: activeRole === role
                  ? '#0A0A0A' : '#9CA3AF',
                boxShadow: activeRole === role
                  ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {role === 'student' ? '🎓 Student' : '👔 Senior'}
            </button>
          ))}
        </div>

        {/* Email */}
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: '#374151',
            marginBottom: 6
          }}>
            Email Address
          </label>
          <input
            type="email"
            placeholder={
              activeRole === 'student'
                ? 'yourname@gmail.com'
                : 'yourname@company.com'
            }
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%',
              border: '1.5px solid #E5E7EB',
              borderRadius: 8,
              padding: '11px 14px',
              fontSize: 14,
              color: '#0A0A0A',
              outline: 'none',
              fontFamily: 'Plus Jakarta Sans',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s'
            }}
            onFocus={e => {
              e.target.style.borderColor = '#7C3AED'
              e.target.style.boxShadow = 
                '0 0 0 3px #7C3AED18'
            }}
            onBlur={e => {
              e.target.style.borderColor = '#E5E7EB'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 8 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6
          }}>
            <label style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#374151'
            }}>
              Password
            </label>
            <Link
              href="/forgot-password"
              style={{
                fontSize: 12,
                color: '#7C3AED',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              Forgot password?
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{
                width: '100%',
                border: '1.5px solid #E5E7EB',
                borderRadius: 8,
                padding: '11px 40px 11px 14px',
                fontSize: 14,
                color: '#0A0A0A',
                outline: 'none',
                fontFamily: 'Plus Jakarta Sans',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s'
              }}
              onFocus={e => {
                e.target.style.borderColor = '#7C3AED'
                e.target.style.boxShadow = 
                  '0 0 0 3px #7C3AED18'
              }}
              onBlur={e => {
                e.target.style.borderColor = '#E5E7EB'
                e.target.style.boxShadow = 'none'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#9CA3AF',
                fontSize: 16,
                padding: 0
              }}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            color: '#EF4444',
            marginBottom: 16,
            marginTop: 8
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            background: loading
              ? '#E5E7EB'
              : 'linear-gradient(135deg, #7C3AED, #06B6D4)',
            color: loading ? '#9CA3AF' : 'white',
            border: 'none',
            borderRadius: 10,
            padding: '14px',
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Plus Jakarta Sans',
            marginTop: error ? 0 : 16,
            transition: 'opacity 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: 16, height: 16,
                border: '2px solid #9CA3AF',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              Signing in...
            </>
          ) : (
            `Sign in as ${
              activeRole === 'student' ? 'Student 🎓' : 'Senior 👔'
            } →`
          )}
        </button>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg) }
          }
        `}</style>

        {/* Divider */}
        <div style={{
          textAlign: 'center',
          marginTop: 20,
          paddingTop: 20,
          borderTop: '1px solid #F3F4F6'
        }}>
          <p style={{
            fontSize: 12,
            color: '#D1D5DB',
            margin: 0
          }}>
            © 2024 Claspire · India's College Community
          </p>
        </div>
      </div>
    </div>
  )
}
