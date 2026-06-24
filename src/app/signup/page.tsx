'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { getCollegeLogo } from '@/lib/college-utils';
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff } from 'lucide-react'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import AuthLayout from '@/components/auth/AuthLayout'
import { Turnstile } from '@marsidev/react-turnstile'

export default function SignupPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [activeRole, setActiveRole] = useState<'student' | 'senior'>('student')
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [googleId, setGoogleId] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState('')

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('google_signup_email')
    const storedId = sessionStorage.getItem('google_signup_id')
    if (storedEmail && storedId) {
      setStudentData(prev => ({ ...prev, email: storedEmail }))
      setSeniorData(prev => ({ ...prev, work_email: storedEmail }))
      setGoogleId(storedId)

      const urlParams = new URLSearchParams(window.location.search)
      const roleParam = urlParams.get('role')
      if (roleParam === 'senior' || roleParam === 'student') {
        setActiveRole(roleParam)
      }
    }
  }, [])

  const handleGoogleSuccess = async (credential: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/google-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Google verification failed')
        return
      }

      const checkRes = await fetch('/api/auth/check-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, role: activeRole })
      })

      if (checkRes.status === 409) {
        setError('An account with this email already exists. Please sign in instead.')
        return
      }

      setStudentData(prev => ({ ...prev, email: data.email }))
      setSeniorData(prev => ({ ...prev, work_email: data.email }))
      setGoogleId(data.google_id)
      
      sessionStorage.setItem('google_signup_email', data.email)
      sessionStorage.setItem('google_signup_id', data.google_id)

    } catch (err) {
      console.error(err)
      setError('Network error during Google authentication.')
    } finally {
      setLoading(false)
    }
  }

  const registerWithGoogle = async () => {
    const email = activeRole === 'senior'
      ? seniorData.work_email
      : studentData.email

    setLoading(true)
    setError('')

    try {
      const profileData = activeRole === 'senior' ? {
        full_name: seniorData.full_name,
        college_id: seniorData.college_id,
        company: seniorData.company.trim() || (seniorData.is_fresher ? 'Fresher' : ''),
        designation: seniorData.designation.trim() || (seniorData.is_fresher ? 'Seeking Opportunity' : ''),
        branch: seniorData.branch,
        passout_year: parseInt(seniorData.passout_year),
        graduation_year: parseInt(seniorData.passout_year),
        linkedin_url: seniorData.linkedin_url || null,
        work_email: seniorData.work_email,
        is_verified: true,
        verification_type: seniorData.is_fresher ? 'fresher' : 'work_email',
        verification_status: 'verified',
        is_fresher: seniorData.is_fresher,
        profile_data: {
          senior: {
            experience_years: seniorData.experience_years ? parseInt(seniorData.experience_years) : undefined
          }
        }
      } : {
        full_name: studentData.full_name,
        college_id: studentData.college_id || null,
        branch: studentData.branch || '',
        year: parseInt(studentData.year) || 1,
        passout_year: parseInt(studentData.passout_year) || 2025,
        is_verified: true,
        verification_type: 'manual',
        verification_status: 'verified',
      }

      const createRes = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          role: activeRole, 
          profileData, 
          password, 
          google_id: googleId,
          turnstileToken
        })
      })

      const createData = await createRes.json()
      if (!createRes.ok) {
        setError(createData.error || 'Failed to create account')
        return
      }

      sessionStorage.removeItem('google_signup_email')
      sessionStorage.removeItem('google_signup_id')

      localStorage.setItem('claspire_user', JSON.stringify(createData.user))
      window.location.href = '/onboarding'
      return

    } catch (err) {
      console.error('Verify error:', err)
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setError('')
    const emailToUse = activeRole === 'senior'
      ? seniorData.work_email
      : studentData.email

    if (!emailToUse) {
      setError(activeRole === 'senior' ? 'Work email is required' : 'Email is required')
      return
    }

    if (!agreedToTerms) {
      setError('Please agree to Terms of Service and Privacy Policy to continue')
      return
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (activeRole === 'student') {
      if (!studentData.full_name.trim()) {
        setError('Full name is required')
        return
      }
      if (!studentData.college_id) {
        setError('Please select your college')
        return
      }
      if (!studentData.branch.trim()) {
        setError('Branch is required')
        return
      }
      if (!studentData.year) {
        setError('Current year is required')
        return
      }
      if (!studentData.passout_year) {
        setError('Passout year is required')
        return
      }
    }

    if (activeRole === 'senior') {
      if (!seniorData.full_name.trim()) {
        setError('Full name is required')
        return
      }
      if (!seniorData.college_id) {
        setError('Please select your college')
        return
      }
      if (!seniorData.branch.trim()) {
        setError('Branch is required')
        return
      }
      if (!seniorData.passout_year) {
        setError('Passout year is required')
        return
      }
      if (!seniorData.work_email.trim()) {
        setError('Work email is required')
        return
      }
      const workEmailDomain = seniorData.work_email.split('@')[1]
      const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
      if (!seniorData.is_fresher && personalDomains.includes(workEmailDomain?.toLowerCase())) {
        setError('Please use your work/company email, not personal email')
        return
      }
    }

    if (googleId) {
      await registerWithGoogle()
    } else {
      await sendOTP()
    }
  }

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [studentData, setStudentData] = useState({
    full_name: '',
    college_id: null as string | null,
    college_name: '',
    branch: '',
    year: '',
    passout_year: '',
    email: ''
  })
  
  const [verifyMethod, setVerifyMethod] = useState<'work_email' | 'linkedin' | 'community'>('work_email')
  const [seniorData, setSeniorData] = useState({
    full_name: '',
    college_id: '',
    college_name: '',
    work_email: '',
    company: '',
    designation: '',
    graduation_year: '',
    linkedin_url: '',
    branch: '',
    passout_year: '',
    experience_years: '',
    selected_method: 'work_email' as 'work_email' | 'normal' | 'linkedin' | '',
    is_fresher: false
  })
  
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpSent, setOtpSent] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  
  const [colleges, setColleges] = useState<any[]>([])
  const [collegesLoading, setCollegesLoading] = useState(false)
  
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const [showStudentCollegeDropdown, setShowStudentCollegeDropdown] = useState(false)
  const [showSeniorCollegeDropdown, setShowSeniorCollegeDropdown] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      if (user.onboarding_completed === false) {
        router.push('/onboarding')
      } else if (user.role === 'senior') {
        router.push('/dashboard/senior')
      } else {
        router.push('/dashboard/junior')
      }
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchColleges = async () => {
      setCollegesLoading(true)
      try {
        const { data, error } = await supabase
          .from('colleges')
          .select('id, name, short_name, slug, location, state, logo_url')
          .order('name')
        
        if (error) {
          console.error('Error fetching colleges:', error)
          setColleges([])
        } else {
          setColleges(data || [])
        }
      } catch (err) {
        console.error('Error fetching colleges:', err)
        setColleges([])
      } finally {
        setCollegesLoading(false)
      }
    }
    fetchColleges()
  }, [])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#1D2226]">
        <div className="w-10 h-10 border-3 border-surface dark:border-[#38434F] border-t-[#0A66C2] rounded-full animate-spin" />
      </div>
    )
  }

  const sendOTP = async () => {
    const emailToUse = activeRole === 'senior'
      ? seniorData.work_email
      : studentData.email

    if (!emailToUse) {
      setError(activeRole === 'senior' ? 'Work email is required' : 'Email is required')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const checkRes = await fetch('/api/auth/check-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: emailToUse,
          role: activeRole 
        })
      })

      const checkData = await checkRes.json()
      
      if (checkRes.status === 409) {
        setError(checkData.message || 'An account with this email already exists. Please login instead.')
        setLoading(false)
        return
      }
      
      if (!checkRes.ok) {
        setError(checkData.error || 'Failed to check account. Please try again.')
        setLoading(false)
        return
      }
      
    } catch (error) {
      setError('Network error. Please check your connection and try again.')
      setLoading(false)
      return
    }

    if (!agreedToTerms) {
      setError('Please agree to Terms of Service and Privacy Policy to continue')
      setLoading(false)
      return
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (activeRole === 'student') {
      if (!studentData.full_name.trim()) {
        setError('Full name is required')
        setLoading(false)
        return
      }
      if (!studentData.college_id) {
        setError('Please select your college')
        setLoading(false)
        return
      }
      if (!studentData.branch.trim()) {
        setError('Branch is required')
        setLoading(false)
        return
      }
      if (!studentData.year) {
        setError('Current year is required')
        setLoading(false)
        return
      }
      if (!studentData.passout_year) {
        setError('Passout year is required')
        setLoading(false)
        return
      }
    }

    if (activeRole === 'senior') {
      if (!seniorData.full_name.trim()) {
        setError('Full name is required')
        setLoading(false)
        return
      }
      if (!seniorData.college_id) {
        setError('Please select your college')
        setLoading(false)
        return
      }
      if (!seniorData.branch.trim()) {
        setError('Branch is required')
        setLoading(false)
        return
      }
      if (!seniorData.passout_year) {
        setError('Passout year is required')
        setLoading(false)
        return
      }
      if (!seniorData.work_email.trim()) {
        setError('Work email is required')
        setLoading(false)
        return
      }
      const workEmailDomain = seniorData.work_email.split('@')[1]
      const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
      if (!seniorData.is_fresher && personalDomains.includes(workEmailDomain?.toLowerCase())) {
        setError('Please use your work/company email, not personal email')
        setLoading(false)
        return
      }
    }

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: emailToUse,
          name: activeRole === 'senior' ? seniorData.full_name : studentData.full_name,
          turnstileToken
        })
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send OTP')
        return
      }

      setOtpSent(true)
      setTurnstileToken('') // Reset token for OTP step
      setResendTimer(30)
      const interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

    } catch (err) {
      console.error('Send OTP error:', err)
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const verifyAndCreate = async () => {
    const email = activeRole === 'senior'
      ? seniorData.work_email
      : studentData.email

    const token = otp.join('')

    if (token.length !== 6) {
      setError('Enter 6 digit OTP')
      return
    }

    setLoading(true)
    setError('')

    try {
      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: token })
      })

      const verifyData = await verifyRes.json()
      if (!verifyRes.ok) {
        setError(verifyData.error || 'Invalid OTP')
        return
      }

      const profileData = activeRole === 'senior' ? {
        full_name: seniorData.full_name,
        college_id: seniorData.college_id,
        company: seniorData.company.trim() || (seniorData.is_fresher ? 'Fresher' : ''),
        designation: seniorData.designation.trim() || (seniorData.is_fresher ? 'Seeking Opportunity' : ''),
        branch: seniorData.branch,
        passout_year: parseInt(seniorData.passout_year),
        graduation_year: parseInt(seniorData.passout_year),
        linkedin_url: seniorData.linkedin_url || null,
        work_email: seniorData.work_email,
        is_verified: true,
        verification_type: seniorData.is_fresher ? 'fresher' : 'work_email',
        verification_status: 'verified',
        is_fresher: seniorData.is_fresher,
        profile_data: {
          senior: {
            experience_years: seniorData.experience_years ? parseInt(seniorData.experience_years) : undefined
          }
        }
      } : {
        full_name: studentData.full_name,
        college_id: studentData.college_id || null,
        branch: studentData.branch || '',
        year: parseInt(studentData.year) || 1,
        passout_year: parseInt(studentData.passout_year) || 2025,
        is_verified: true,
        verification_type: 'manual',
        verification_status: 'verified',
      }

      const createRes = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: activeRole, profileData, password, turnstileToken })
      })

      const createData = await createRes.json()
      if (!createRes.ok) {
        setError(createData.error || 'Failed to create account')
        return
      }

      localStorage.setItem('claspire_user', JSON.stringify(createData.user))
      window.location.href = '/onboarding'
      return

    } catch (err) {
      console.error('Verify error:', err)
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-[28px] font-bold text-gray-900 dark:text-white font-plus-jakarta-sans">
            Join Claspire
          </h1>
          <p className="text-[15px] text-gray-400 dark:text-[#B0B7BE] font-plus-jakarta-sans">
            Build your college network
          </p>
          <p className="text-sm text-gray-400 dark:text-[#B0B7BE] font-plus-jakarta-sans pt-1">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[#0A66C2] hover:text-[#004182] no-underline">
              Sign in
            </Link>
          </p>
        </div>

          <button 
            onClick={() => router.push('/colleges')}
            className="w-full bg-app dark:bg-[#1D2226] text-gray-600 dark:text-[#B0B7BE] h-10 rounded-xl text-sm font-medium hover:bg-surface-hover dark:hover:bg-[#283036] transition-colors border border-surface dark:border-[#38434F] cursor-pointer"
        >
          🏫 Browse Colleges First
        </button>

        <div className="flex bg-gray-100 dark:bg-[#1D2226] rounded-xl p-1 gap-1">
          <button
            onClick={() => { setActiveRole("student"); setOtpSent(false); setAgreedToTerms(false); }}
            className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-all cursor-pointer border-none ${
              activeRole === "student" ? "bg-surface dark:bg-[#283036] text-gray-900 dark:text-white shadow-sm" : "bg-transparent text-gray-400 dark:text-[#B0B7BE]"
            }`}
          >
            🎓 Student
          </button>
          <button
            onClick={() => { setActiveRole("senior"); setOtpSent(false); setAgreedToTerms(false); }}
            className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-all cursor-pointer border-none ${
              activeRole === "senior" ? "bg-surface dark:bg-[#283036] text-gray-900 dark:text-white shadow-sm" : "bg-transparent text-gray-400 dark:text-[#B0B7BE]"
            }`}
          >
            👔 Senior
          </button>
        </div>

        {!otpSent && (
          <div>
            {googleId ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-xs rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-bold">✓ Google Connected</span>
                  <p className="text-[10px] text-green-600 dark:text-green-400 mt-0.5">We pre-verified your email. Complete fields below.</p>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setGoogleId(null);
                    setStudentData(prev => ({ ...prev, email: '' }));
                    setSeniorData(prev => ({ ...prev, work_email: '' }));
                    sessionStorage.removeItem('google_signup_email');
                    sessionStorage.removeItem('google_signup_id');
                  }}
                  className="text-green-700 dark:text-green-400 font-bold hover:underline text-[10px] ml-2 bg-transparent border-none cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <>
                <GoogleSignInButton
                  buttonId="google-signup-btn"
                  onSuccess={handleGoogleSuccess}
                  onError={(err) => setError(err)}
                />
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-surface dark:border-[#38434F]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#FAFAFA] dark:bg-[#1D2226] px-3 text-gray-400 dark:text-[#B0B7BE] font-medium">or sign up with email</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div>
          {activeRole === "student" ? (
            <div>
              {!otpSent && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-[#B0B7BE] mb-1.5">Full Name</label>
                    <input
                      type="text"
                      placeholder="Arun Kumar"
                      value={studentData.full_name}
                      onChange={(e) => setStudentData({...studentData, full_name: e.target.value})}
                      className="w-full h-11 px-3.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-[#B0B7BE] border border-surface dark:border-[#38434F] rounded-xl outline-none transition-all duration-150 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/10 bg-surface dark:bg-[#283036]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-[#B0B7BE] mb-1.5">College</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search your college..."
                        value={studentData.college_name}
                        onChange={(e) => {
                          setStudentData({...studentData, college_name: e.target.value, college_id: null});
                          setShowStudentCollegeDropdown(true);
                        }}
                        onFocus={() => setShowStudentCollegeDropdown(true)}
                        className="w-full h-11 px-3.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-[#B0B7BE] border border-surface dark:border-[#38434F] rounded-xl outline-none transition-all duration-150 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/10 bg-surface dark:bg-[#283036]"
                      />
                      {showStudentCollegeDropdown && studentData.college_name && (
                        <div className="absolute top-full left-0 right-0 bg-surface dark:bg-[#283036] border border-surface dark:border-[#38434F] rounded-xl mt-1.5 max-h-48 overflow-y-auto z-10 shadow-sm">
                          {collegesLoading ? (
                            <div className="p-3.5 text-center text-sm text-gray-400 dark:text-[#B0B7BE]">Loading...</div>
                          ) : colleges.filter(c => 
                            c.short_name.toLowerCase().includes(studentData.college_name.toLowerCase()) ||
                            c.name.toLowerCase().includes(studentData.college_name.toLowerCase())
                          ).length > 0 ? (
                            colleges.filter(c => 
                              c.short_name.toLowerCase().includes(studentData.college_name.toLowerCase()) ||
                              c.name.toLowerCase().includes(studentData.college_name.toLowerCase())
                            ).map(college => (
                              <div
                                key={college.id}
                                onClick={() => {
                                  setStudentData({...studentData, college_id: college.id, college_name: college.name});
                                  setShowStudentCollegeDropdown(false);
                                }}
                                className="flex items-center gap-2.5 p-3 hover:bg-app dark:hover:bg-[#1D2226] dark:bg-[#1D2226] cursor-pointer border-b border-surface dark:border-[#38434F] last:border-none"
                              >
                                <div className="w-8 h-8 rounded-lg bg-app dark:bg-[#1D2226] border border-surface dark:border-[#38434F] flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {getCollegeLogo(college) ? (
                                    <img 
                                      src={getCollegeLogo(college)!} 
                                      alt={college.short_name} 
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <div className="text-[10px] font-black text-[#0A66C2]">
                                      {college.short_name.toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight">{college.name}</div>
                                  <div className="text-[11px] text-gray-400 dark:text-[#B0B7BE] mt-0.5">{college.location}, {college.state}</div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-3.5 text-center text-sm text-gray-400 dark:text-[#B0B7BE]">No college found</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-[#B0B7BE] mb-1.5">Branch</label>
                    <select
                      value={studentData.branch}
                      onChange={(e) => setStudentData({...studentData, branch: e.target.value})}
                      className="w-full h-11 px-3.5 text-sm text-gray-900 dark:text-white border border-surface dark:border-[#38434F] rounded-xl outline-none transition-all duration-150 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/10 bg-surface dark:bg-[#283036]"
                    >
                      <option value="">Select Branch</option>
                      <optgroup label="Engineering & Technology">
                        <option value="CSE">CSE - Computer Science Engineering</option>
                        <option value="IT">IT - Information Technology</option>
                        <option value="ECE">ECE - Electronics & Communication</option>
                        <option value="EEE">EEE - Electrical & Electronics</option>
                        <option value="Mechanical">Mechanical Engineering</option>
                        <option value="Civil">Civil Engineering</option>
                        <option value="AIDS">AIDS - Artificial Intelligence & Data Science</option>
                        <option value="AIML">AIML - Artificial Intelligence & Machine Learning</option>
                        <option value="Chemical">Chemical Engineering</option>
                        <option value="Biotechnology">Biotechnology Engineering</option>
                        <option value="Aeronautical">Aeronautical Engineering</option>
                        <option value="Automobile">Automobile Engineering</option>
                        <option value="Marine">Marine Engineering</option>
                        <option value="Petroleum">Petroleum Engineering</option>
                        <option value="Mining">Mining Engineering</option>
                        <option value="Textile">Textile Engineering</option>
                        <option value="Production">Production Engineering</option>
                        <option value="Industrial">Industrial Engineering</option>
                        <option value="Instrumentation">Instrumentation Engineering</option>
                        <option value="Food Technology">Food Technology</option>
                      </optgroup>
                      <optgroup label="Science & Mathematics">
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Statistics">Statistics</option>
                        <option value="Botany">Botany</option>
                        <option value="Zoology">Zoology</option>
                        <option value="Geology">Geology</option>
                        <option value="Environmental Science">Environmental Science</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Biochemistry">Biochemistry</option>
                        <option value="Microbiology">Microbiology</option>
                        <option value="Forensic Science">Forensic Science</option>
                      </optgroup>
                      <optgroup label="Arts & Humanities">
                        <option value="English">English Literature</option>
                        <option value="History">History</option>
                        <option value="Economics">Economics</option>
                        <option value="Political Science">Political Science</option>
                        <option value="Sociology">Sociology</option>
                        <option value="Psychology">Psychology</option>
                        <option value="Philosophy">Philosophy</option>
                        <option value="Geography">Geography</option>
                        <option value="Anthropology">Anthropology</option>
                        <option value="Archaeology">Archaeology</option>
                        <option value="Linguistics">Linguistics</option>
                        <option value="Music">Music</option>
                        <option value="Fine Arts">Fine Arts</option>
                        <option value="Performing Arts">Performing Arts</option>
                      </optgroup>
                      <optgroup label="Commerce & Management">
                        <option value="B.Com">B.Com - Bachelor of Commerce</option>
                        <option value="BBA">BBA - Bachelor of Business Administration</option>
                        <option value="BCA">BCA - Bachelor of Computer Applications</option>
                        <option value="BHM">BHM - Bachelor of Hotel Management</option>
                        <option value="Accounting">Accounting & Finance</option>
                        <option value="Banking">Banking & Insurance</option>
                        <option value="Marketing">Marketing Management</option>
                        <option value="HR">Human Resource Management</option>
                        <option value="International Business">International Business</option>
                        <option value="Supply Chain">Supply Chain Management</option>
                        <option value="Retail Management">Retail Management</option>
                        <option value="Event Management">Event Management</option>
                      </optgroup>
                      <optgroup label="Medical & Healthcare">
                        <option value="MBBS">MBBS - Bachelor of Medicine</option>
                        <option value="BDS">BDS - Bachelor of Dental Surgery</option>
                        <option value="BAMS">BAMS - Ayurvedic Medicine</option>
                        <option value="BHMS">BHMS - Homeopathic Medicine</option>
                        <option value="Nursing">Nursing</option>
                        <option value="Pharmacy">Pharmacy</option>
                        <option value="Physiotherapy">Physiotherapy</option>
                        <option value="Occupational Therapy">Occupational Therapy</option>
                        <option value="Medical Lab Technology">Medical Lab Technology</option>
                        <option value="Radiology">Radiology</option>
                        <option value="Optometry">Optometry</option>
                        <option value="Public Health">Public Health</option>
                        <option value="Nutrition">Nutrition & Dietetics</option>
                      </optgroup>
                      <optgroup label="Law & Legal Studies">
                        <option value="LLB">LLB - Bachelor of Law</option>
                        <option value="BA LLB">BA LLB - Integrated Law</option>
                        <option value="BBA LLB">BBA LLB - Integrated Law</option>
                        <option value="Corporate Law">Corporate Law</option>
                        <option value="Criminal Law">Criminal Law</option>
                        <option value="International Law">International Law</option>
                        <option value="Constitutional Law">Constitutional Law</option>
                      </optgroup>
                      <optgroup label="Education & Teaching">
                        <option value="B.Ed">B.Ed - Bachelor of Education</option>
                        <option value="D.El.Ed">D.El.Ed - Diploma in Elementary Education</option>
                        <option value="Early Childhood">Early Childhood Education</option>
                        <option value="Special Education">Special Education</option>
                        <option value="Educational Technology">Educational Technology</option>
                        <option value="Educational Psychology">Educational Psychology</option>
                      </optgroup>
                      <optgroup label="Agriculture & Forestry">
                        <option value="Agriculture">Agriculture</option>
                        <option value="Horticulture">Horticulture</option>
                        <option value="Forestry">Forestry</option>
                        <option value="Fisheries">Fisheries</option>
                        <option value="Dairy Technology">Dairy Technology</option>
                        <option value="Food Processing">Food Processing</option>
                        <option value="Agricultural Engineering">Agricultural Engineering</option>
                      </optgroup>
                      <optgroup label="Design & Architecture">
                        <option value="BFA">BFA - Bachelor of Fine Arts</option>
                        <option value="B.Des">B.Des - Bachelor of Design</option>
                        <option value="Architecture">Architecture</option>
                        <option value="Interior Design">Interior Design</option>
                        <option value="Fashion Design">Fashion Design</option>
                        <option value="Graphic Design">Graphic Design</option>
                        <option value="Industrial Design">Industrial Design</option>
                        <option value="Product Design">Product Design</option>
                        <option value="Urban Planning">Urban Planning</option>
                      </optgroup>
                      <optgroup label="Mass Communication & Media">
                        <option value="Journalism">Journalism</option>
                        <option value="Mass Communication">Mass Communication</option>
                        <option value="Advertising">Advertising</option>
                        <option value="Public Relations">Public Relations</option>
                        <option value="Film Making">Film Making</option>
                        <option value="Photography">Photography</option>
                        <option value="Digital Media">Digital Media</option>
                      </optgroup>
                      <optgroup label="Social Work & Community Service">
                        <option value="BSW">BSW - Bachelor of Social Work</option>
                        <option value="Community Development">Community Development</option>
                        <option value="Rural Development">Rural Development</option>
                        <option value="Social Policy">Social Policy</option>
                      </optgroup>
                      <optgroup label="Vocational & Professional">
                        <option value="Hotel Management">Hotel Management</option>
                        <option value="Tourism">Tourism Management</option>
                        <option value="Aviation">Aviation Management</option>
                        <option value="Logistics">Logistics Management</option>
                        <option value="Entrepreneurship">Entrepreneurship Development</option>
                      </optgroup>
                      <optgroup label="Masters Programs">
                        <option value="M.Tech">M.Tech - Master of Technology</option>
                        <option value="M.E">M.E - Master of Engineering</option>
                        <option value="MCA">MCA - Master of Computer Applications</option>
                        <option value="MBA">MBA - Master of Business Administration</option>
                        <option value="M.Com">M.Com - Master of Commerce</option>
                        <option value="M.Sc">M.Sc - Master of Science</option>
                        <option value="MA">MA - Master of Arts</option>
                        <option value="MSW">MSW - Master of Social Work</option>
                        <option value="M.Ed">M.Ed - Master of Education</option>
                        <option value="LLM">LLM - Master of Law</option>
                        <option value="M.Arch">M.Arch - Master of Architecture</option>
                        <option value="M.Des">M.Des - Master of Design</option>
                        <option value="M.Plan">M.Plan - Master of Planning</option>
                        <option value="M.Pharm">M.Pharm - Master of Pharmacy</option>
                        <option value="MPT">MPT - Master of Physiotherapy</option>
                      </optgroup>
                      <optgroup label="PhD Programs">
                        <option value="PhD Engineering">PhD - Engineering</option>
                        <option value="PhD Computer Science">PhD - Computer Science</option>
                        <option value="PhD Management">PhD - Management</option>
                        <option value="PhD Commerce">PhD - Commerce</option>
                        <option value="PhD Science">PhD - Science</option>
                        <option value="PhD Arts">PhD - Arts</option>
                        <option value="PhD Education">PhD - Education</option>
                        <option value="PhD Law">PhD - Law</option>
                        <option value="PhD Social Work">PhD - Social Work</option>
                        <option value="PhD Medicine">PhD - Medicine</option>
                        <option value="PhD Agriculture">PhD - Agriculture</option>
                        <option value="PhD Architecture">PhD - Architecture</option>
                        <option value="PhD Design">PhD - Design</option>
                      </optgroup>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-[#B0B7BE] mb-1.5">Current Year</label>
                      <select
                        value={studentData.year}
                        onChange={(e) => setStudentData({...studentData, year: e.target.value})}
                        className="w-full h-11 px-3.5 text-sm text-gray-900 dark:text-white border border-surface dark:border-[#38434F] rounded-xl outline-none transition-all duration-150 focus:border-[#0A66C2] bg-surface dark:bg-[#283036]"
                      >
                        <option value="">Select Year</option>
                        <optgroup label="Bachelor's">
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year</option>
                          <option value="5">5th Year</option>
                        </optgroup>
                        <optgroup label="Master's">
                          <option value="M1">1st Year Masters</option>
                          <option value="M2">2nd Year Masters</option>
                          <option value="M3">3rd Year Masters</option>
                        </optgroup>
                        <optgroup label="PhD">
                          <option value="PhD1">1st Year PhD</option>
                          <option value="PhD2">2nd Year PhD</option>
                          <option value="PhD3">3rd Year PhD</option>
                          <option value="PhD4">4th Year PhD</option>
                          <option value="PhD5">5th Year PhD</option>
                          <option value="PhD6">6th Year PhD</option>
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-[#B0B7BE] mb-1.5">Passout Year</label>
                      <select
                        value={studentData.passout_year}
                        onChange={(e) => setStudentData({...studentData, passout_year: e.target.value})}
                        className="w-full h-11 px-3.5 text-sm text-gray-900 dark:text-white border border-surface dark:border-[#38434F] rounded-xl outline-none transition-all duration-150 focus:border-[#0A66C2] bg-surface dark:bg-[#283036]"
                      >
                        <option value="">Year</option>
                        {[2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-[#B0B7BE] mb-1.5">Email Address</label>
                    <input
                      type="email"
                      placeholder="yourname@gmail.com"
                      value={studentData.email}
                      onChange={(e) => setStudentData({...studentData, email: e.target.value})}
                      className={`w-full h-11 px-3.5 text-sm border border-surface dark:border-[#38434F] rounded-xl outline-none transition-all duration-150 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/10 bg-surface dark:bg-[#283036] placeholder:text-gray-400 dark:text-[#B0B7BE] ${googleId ? 'bg-gray-100 text-gray-400 dark:text-[#B0B7BE] cursor-not-allowed' : 'text-gray-900 dark:text-white'}`}
                      readOnly={!!googleId}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-[#B0B7BE] mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Minimum 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-11 px-3.5 pr-11 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-[#B0B7BE] border border-surface dark:border-[#38434F] rounded-xl outline-none transition-all duration-150 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/10 bg-surface dark:bg-[#283036]"
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

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-[#B0B7BE] mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-11 px-3.5 pr-11 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-[#B0B7BE] border border-surface dark:border-[#38434F] rounded-xl outline-none transition-all duration-150 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/10 bg-surface dark:bg-[#283036]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#B0B7BE] hover:text-gray-600 dark:hover:text-[#B0B7BE] bg-transparent border-none cursor-pointer p-0"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="terms-student"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#0A66C2] focus:ring-[#0A66C2] accent-[#0A66C2] flex-shrink-0 cursor-pointer"
                    />
                    <label 
                      htmlFor="terms-student" 
                      className="text-xs text-gray-500 dark:text-[#B0B7BE] leading-relaxed cursor-pointer"
                    >
                      I agree to Claspire's{' '}
                      <Link 
                        href="/terms" 
                        className="text-[#0A66C2] font-semibold hover:underline"
                        target="_blank"
                      >
                        Terms of Service
                      </Link>
                      {' '}and{' '}
                      <Link 
                        href="/privacy-policy" 
                        className="text-[#0A66C2] font-semibold hover:underline"
                        target="_blank"
                      >
                        Privacy Policy
                      </Link>
                      . I confirm that I am a college student.
                    </label>
                  </div>

                  <div className="flex justify-center my-4">
                    <Turnstile
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                      onSuccess={(token) => setTurnstileToken(token)}
                      onError={() => setError('Security check failed. Please refresh.')}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !agreedToTerms || !turnstileToken}
                    className="w-full h-11 bg-[#0A66C2] hover:bg-[#004182] disabled:bg-blue-300 text-white text-sm font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 border-none cursor-pointer disabled:cursor-not-allowed shadow-sm"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : googleId ? (
                      'Complete Signup 🚀'
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              {!otpSent && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-[#B0B7BE] mb-3">How would you like to verify?</p>
                    <div className="space-y-2.5">
                      {[
                        { key: 'work_email', icon: '✉️', title: 'Work Email', desc: 'Instant verification via company email', badge: 'Instant', available: true },
                        { key: 'linkedin', icon: '💼', title: 'LinkedIn', desc: 'Verify via professional profile', badge: 'Coming Soon', available: false },
                        { key: 'community', icon: '👥', title: 'Community', desc: 'Verify via alumni network', badge: 'Coming Soon', available: false }
                      ].map(method => (
                        <div
                          key={method.key}
                          onClick={() => method.available && setVerifyMethod(method.key as any)}
                          className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${
                            verifyMethod === method.key ? "border-[#0A66C2] bg-[#EAF4FF]/50 dark:bg-blue-900/20" : "border-surface dark:border-[#38434F] hover:border-[#0A66C2]/30 dark:hover:border-blue-700"
                          } ${!method.available && 'opacity-60 cursor-not-allowed'}`}
                        >
                          <div className="w-9 h-9 bg-surface dark:bg-[#283036] rounded-lg flex items-center justify-center text-base border border-surface dark:border-[#38434F]">{method.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-gray-900 dark:text-white">{method.title}</div>
                            <div className="text-[11px] text-gray-400 dark:text-[#B0B7BE]">{method.desc}</div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                            method.available ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                          }`}>{method.badge}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {verifyMethod === 'work_email' && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-[#B0B7BE]">{seniorData.is_fresher ? 'Email' : 'Work Email'}</label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={seniorData.is_fresher}
                              onChange={e => setSeniorData({...seniorData, is_fresher: e.target.checked})}
                              className="w-3.5 h-3.5 rounded border-gray-300 text-[#0A66C2] focus:ring-[#0A66C2]"
                            />
                            <span className="text-[11px] font-medium text-gray-500 dark:text-[#B0B7BE]">I don't have work email (Fresher)</span>
                          </label>
                        </div>
                        <input
                          type="email"
                          placeholder={seniorData.is_fresher ? "yourname@gmail.com" : "name@company.com"}
                          value={seniorData.work_email}
                          onChange={e => setSeniorData({...seniorData, work_email: e.target.value})}
                          className={`w-full h-11 px-3.5 text-sm border border-surface dark:border-[#38434F] rounded-xl outline-none transition-all duration-150 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/10 bg-surface dark:bg-[#283036] placeholder:text-gray-400 dark:text-[#B0B7BE] ${googleId ? 'bg-gray-100 text-gray-400 dark:text-[#B0B7BE] cursor-not-allowed' : 'text-gray-900 dark:text-white'}`}
                          readOnly={!!googleId}
                        />
                        {!seniorData.is_fresher && !googleId && <p className="text-[10px] text-gray-400 dark:text-[#B0B7BE] mt-0.5">Use office email for instant approval</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-[#B0B7BE] mb-1.5">Full Name</label>
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={seniorData.full_name}
                          onChange={e => setSeniorData({...seniorData, full_name: e.target.value})}
                          className="w-full h-11 px-3.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-[#B0B7BE] border border-surface dark:border-[#38434F] rounded-xl outline-none transition-all duration-150 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/10 bg-surface dark:bg-[#283036]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-[#B0B7BE] mb-1.5">College graduated from</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search your college..."
                            value={seniorData.college_name}
                            onChange={(e) => {
                              setSeniorData({...seniorData, college_name: e.target.value, college_id: ''});
                              setShowSeniorCollegeDropdown(true);
                            }}
                            onFocus={() => setShowSeniorCollegeDropdown(true)}
                            className="w-full h-11 px-3.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-[#B0B7BE] border border-surface dark:border-[#38434F] rounded-xl outline-none transition-all duration-150 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/10 bg-surface dark:bg-[#283036]"
                          />
                          {showSeniorCollegeDropdown && seniorData.college_name && (
                            <div className="absolute top-full left-0 right-0 bg-surface dark:bg-[#283036] border border-surface dark:border-[#38434F] rounded-xl mt-1.5 max-h-48 overflow-y-auto z-10 shadow-sm">
                              {collegesLoading ? (
                                <div className="p-3.5 text-center text-sm text-gray-400 dark:text-[#B0B7BE]">Loading...</div>
                              ) : colleges.filter(c => 
                                c.short_name.toLowerCase().includes(seniorData.college_name.toLowerCase()) ||
                                c.name.toLowerCase().includes(seniorData.college_name.toLowerCase())
                              ).length > 0 ? (
                                colleges.filter(c => 
                                  c.short_name.toLowerCase().includes(seniorData.college_name.toLowerCase()) ||
                                  c.name.toLowerCase().includes(seniorData.college_name.toLowerCase())
                                ).map(college => (
                                  <div
                                    key={college.id}
                                    onClick={() => {
                                      setSeniorData({...seniorData, college_id: college.id, college_name: college.name});
                                      setShowSeniorCollegeDropdown(false);
                                    }}
                                    className="flex items-center gap-2.5 p-3 hover:bg-app dark:hover:bg-[#1D2226] dark:bg-[#1D2226] cursor-pointer border-b border-surface dark:border-[#38434F] last:border-none"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-app dark:bg-[#1D2226] border border-surface dark:border-[#38434F] flex items-center justify-center overflow-hidden flex-shrink-0">
                                      {getCollegeLogo(college) ? (
                                        <img 
                                          src={getCollegeLogo(college)!} 
                                          alt={college.short_name} 
                                          className="w-full h-full object-contain"
                                        />
                                      ) : (
                                        <div className="text-[10px] font-black text-[#0A66C2]">
                                          {college.short_name.toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <div className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight">{college.name}</div>
                                      <div className="text-[11px] text-gray-400 dark:text-[#B0B7BE] mt-0.5">{college.location}, {college.state}</div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-3.5 text-center text-sm text-gray-400 dark:text-[#B0B7BE]">No college found</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-[#B0B7BE] mb-1.5">
                            Company {seniorData.is_fresher && <span className="text-gray-400 dark:text-[#B0B7BE] font-normal">(Optional)</span>}
                          </label>
                          <input
                            type="text"
                            placeholder="Google, etc."
                            value={seniorData.company}
                            onChange={e => setSeniorData({...seniorData, company: e.target.value})}
                            className="w-full h-11 px-3.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-[#B0B7BE] border border-surface dark:border-[#38434F] rounded-xl outline-none transition-all duration-150 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/10 bg-surface dark:bg-[#283036]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-[#B0B7BE] mb-1.5">
                            Designation {seniorData.is_fresher && <span className="text-gray-400 dark:text-[#B0B7BE] font-normal">(Optional)</span>}
                          </label>
                          <input
                            type="text"
                            placeholder="Software Engineer"
                            value={seniorData.designation}
                            onChange={e => setSeniorData({...seniorData, designation: e.target.value})}
                            className="w-full h-11 px-3.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-[#B0B7BE] border border-surface dark:border-[#38434F] rounded-xl outline-none transition-all duration-150 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/10 bg-surface dark:bg-[#283036]"
                          />
                        </div>
                      </div>

                      {!seniorData.is_fresher && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-[#B0B7BE] mb-1.5">Years of Experience <span className="text-gray-400 dark:text-[#B0B7BE] font-normal">(Optional)</span></label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            placeholder="e.g. 5"
                            value={seniorData.experience_years}
                            onChange={e => setSeniorData({...seniorData, experience_years: e.target.value})}
                            className="w-full h-11 px-3.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-[#B0B7BE] border border-surface dark:border-[#38434F] rounded-xl outline-none transition-all duration-150 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/10 bg-surface dark:bg-[#283036]"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-[#B0B7BE] mb-1.5">Branch</label>
                          <input
                            type="text"
                            placeholder="CSE, BA, B.Com, B.Sc, etc."
                            value={seniorData.branch}
                            onChange={e => setSeniorData({...seniorData, branch: e.target.value})}
                            className="w-full h-11 px-3.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-[#B0B7BE] border border-surface dark:border-[#38434F] rounded-xl outline-none transition-all duration-150 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/10 bg-surface dark:bg-[#283036]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-[#B0B7BE] mb-1.5">Passout Year</label>
                          <select 
                            value={seniorData.passout_year}
                            onChange={e => setSeniorData({...seniorData, passout_year: e.target.value})}
                            className="w-full h-11 px-3.5 text-sm text-gray-900 dark:text-white border border-surface dark:border-[#38434F] rounded-xl outline-none transition-all duration-150 focus:border-[#0A66C2] bg-surface dark:bg-[#283036]"
                          >
                            <option value="">Year</option>
                            {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-[#B0B7BE] mb-1.5">Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Minimum 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-11 px-3.5 pr-11 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-[#B0B7BE] border border-surface dark:border-[#38434F] rounded-xl outline-none transition-all duration-150 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/10 bg-surface dark:bg-[#283036]"
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

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-[#B0B7BE] mb-1.5">Confirm Password</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full h-11 px-3.5 pr-11 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-[#B0B7BE] border border-surface dark:border-[#38434F] rounded-xl outline-none transition-all duration-150 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/10 bg-surface dark:bg-[#283036]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#B0B7BE] hover:text-gray-600 dark:hover:text-[#B0B7BE] bg-transparent border-none cursor-pointer p-0"
                          >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                          <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="terms-senior"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#0A66C2] focus:ring-[#0A66C2] accent-[#0A66C2] flex-shrink-0 cursor-pointer"
                        />
                        <label 
                          htmlFor="terms-senior" 
                          className="text-xs text-gray-500 dark:text-[#B0B7BE] leading-relaxed cursor-pointer"
                        >
                          I agree to Claspire's{' '}
                          <Link 
                            href="/terms" 
                            className="text-[#0A66C2] font-semibold hover:underline"
                            target="_blank"
                          >
                            Terms of Service
                          </Link>
                          {' '}and{' '}
                          <Link 
                            href="/privacy-policy" 
                            className="text-[#0A66C2] font-semibold hover:underline"
                            target="_blank"
                          >
                            Privacy Policy
                          </Link>
                          . I confirm that I am a verified senior/alumni.
                        </label>
                      </div>

                      <div className="flex justify-center my-4">
                        <Turnstile
                          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                          onSuccess={(token) => setTurnstileToken(token)}
                          onError={() => setError('Security check failed. Please refresh.')}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || !verifyMethod || !agreedToTerms || !turnstileToken}
                        className="w-full h-11 bg-[#0A66C2] hover:bg-[#004182] disabled:bg-blue-300 text-white text-sm font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 border-none cursor-pointer disabled:cursor-not-allowed shadow-sm"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : googleId ? (
                          'Complete Signup 🚀'
                        ) : (
                          'Verify & Continue'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {otpSent && step === 'form' && (
            <div className="text-center pt-4 space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white font-plus-jakarta-sans">Check your email 📧</h2>
                <p className="text-sm text-gray-500 dark:text-[#B0B7BE]">
                  Enter the code sent to{' '}
                  <span className="font-bold text-[#0A66C2]">
                    {activeRole === 'student' ? studentData.email : seniorData.work_email}
                  </span>
                </p>
              </div>

              <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5 inline-block">
                ⚠️ Don't forget to check your spam folder too!
              </p>

              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(index, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(index, e)}
                    className="w-11 h-13 border border-surface dark:border-[#38434F] rounded-xl text-center text-lg font-bold focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/10 outline-none bg-surface dark:bg-[#283036] text-gray-900 dark:text-white"
                  />
                ))}
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex justify-center my-4">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setError('Security check failed. Please refresh.')}
                />
              </div>

              <button
                onClick={verifyAndCreate}
                disabled={loading || !turnstileToken}
                className="w-full h-11 bg-[#0A66C2] hover:bg-[#004182] disabled:bg-blue-300 text-white text-sm font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 border-none cursor-pointer disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  'Complete Signup'
                )}
              </button>

              <div className="flex justify-between items-center">
                <button onClick={() => setOtpSent(false)} className="text-xs text-gray-400 dark:text-[#B0B7BE] hover:text-[#0A66C2] bg-transparent border-none cursor-pointer">← Change Email</button>
                {resendTimer > 0 ? (
                  <span className="text-xs text-gray-400 dark:text-[#B0B7BE]">Resend in {resendTimer}s</span>
                ) : (
                  <button onClick={sendOTP} className="text-xs text-[#0A66C2] font-bold hover:underline bg-transparent border-none cursor-pointer">Resend code</button>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-300 dark:text-[#B0B7BE] font-medium pt-2">
          © 2026 Claspire · India's College Community
        </p>
      </div>
    </AuthLayout>
  );
}
