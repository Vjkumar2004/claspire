'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import Navbar from '@/components/Navbar'
import { getCollegeLogo } from '@/lib/college-utils';
import { createClient } from '@supabase/supabase-js'
import { Mail, Phone, Lock, Eye, EyeOff, User, GraduationCap, MapPin, Calendar } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SignupPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  // Form state
  const [activeRole, setActiveRole] = useState<'student' | 'senior'>('student')
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Password states
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Student form
  const [studentData, setStudentData] = useState({
    full_name: '',
    college_id: null as string | null,
    college_name: '',
    branch: '',
    year: '',
    passout_year: '',
    email: ''
  })
  
  // Senior form
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
    selected_method: 'work_email' as 'work_email' | 'normal' | 'linkedin' | '',
    is_fresher: false
  })
  
  // OTP
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpSent, setOtpSent] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  
  // Colleges from database
  const [colleges, setColleges] = useState<any[]>([])
  const [collegesLoading, setCollegesLoading] = useState(false)

  // Dropdown visibility states
  const [showStudentCollegeDropdown, setShowStudentCollegeDropdown] = useState(false)
  const [showSeniorCollegeDropdown, setShowSeniorCollegeDropdown] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'senior') {
        router.push('/dashboard/senior')
      } else {
        router.push('/dashboard/junior')
      }
    }
  }, [user, authLoading, router])

  // Fetch colleges from database
  useEffect(() => {
    const fetchColleges = async () => {
      setCollegesLoading(true)
      try {
        const { data, error } = await supabase
          .from('colleges')
          .select('id, name, short_name, slug, location, state')
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

  // EARLY RETURN AFTER ALL HOOKS
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F9FAFB'
      }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid #E5E7EB',
          borderTop: '3px solid #7C3AED',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // Get email placeholder based on selected college
  const getEmailPlaceholder = () => {
    return 'yourname@gmail.com'
  }
  

  // Send OTP function
  const sendOTP = async () => {
    const emailToUse = activeRole === 'senior'
      ? seniorData.work_email
      : studentData.email

    if (!emailToUse) {
      setError(activeRole === 'senior' ? 'Work email is required' : 'Email is required')
      return
    }

    // Validate senior fields first
    if (activeRole === 'senior') {
      if (!seniorData.full_name.trim()) {
        setError('Full name is required')
        return
      }
      if (!seniorData.college_id) {
        setError('Please select your college')
        return
      }
      if (!seniorData.is_fresher && !seniorData.company.trim()) {
        setError('Company name is required')
        return
      }
      if (!seniorData.is_fresher && !seniorData.designation.trim()) {
        setError('Designation is required')
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
      // Basic work email validation
      const workEmailDomain = seniorData.work_email.split('@')[1]
      const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
      if (!seniorData.is_fresher && personalDomains.includes(workEmailDomain?.toLowerCase())) {
        setError('Please use your work/company email, not personal email')
        return
      }
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: emailToUse,
          name: activeRole === 'senior' ? seniorData.full_name : studentData.full_name
        })
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send OTP')
        return
      }

      setOtpSent(true)
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

  // Verify and Create function
  const verifyAndCreate = async () => {
    const email = activeRole === 'senior'
      ? seniorData.work_email
      : studentData.email

    const token = otp.join('')

    if (token.length !== 6) {
      setError('Enter 6 digit OTP')
      return
    }

    // Password validation
    if (!password || password.length < 6) {
      setError('Password minimum 6 characters required')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Verify OTP
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

      // Create user
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
        is_fresher: seniorData.is_fresher
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
        body: JSON.stringify({ email, role: activeRole, profileData, password })
      })

      const createData = await createRes.json()
      if (!createRes.ok) {
        setError(createData.error || 'Failed to create account')
        return
      }

      setStep('success')
      
      setTimeout(async () => {
        try {
          const res = await fetch('/api/auth/me')
          if (res.ok) {
            const data = await res.json()
            if (data.user) {
              if (activeRole === 'senior') {
                router.push('/dashboard/senior')
              } else {
                router.push('/dashboard/junior')
              }
            }
          }
        } catch (error) {
          console.error('Session check error:', error)
        }
      }, 3000)

    } catch (err) {
      console.error('Verify error:', err)
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // OTP input handlers
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

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="font-instrument-serif font-normal text-2xl text-black mb-4">Welcome to Claspire!</h1>
          <p className="text-green-600 text-sm mb-6">✅ Account created successfully! Redirecting you to your dashboard...</p>
          <button 
            onClick={() => router.push(activeRole === 'senior' ? '/dashboard/senior' : '/dashboard/junior')}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Go to Dashboard →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex pt-14" style={{ minHeight: 'calc(100vh - 56px)' }}>
        {/* Left Panel - Desktop Only */}
        <div className="hidden lg:block lg:w-2/5 bg-gradient-to-br from-purple-600 to-cyan-500 relative overflow-hidden">
          <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-white rounded-full opacity-15"></div>
          <div className="absolute bottom-[-50px] left-[-50px] w-[200px] h-[200px] bg-white rounded-full opacity-15"></div>
          <div className="relative z-10 h-full flex flex-col justify-center p-12">
            <Link href="/" className="text-white text-2xl font-bold mb-12 no-underline inline-block">Claspire</Link>
            <h2 className="font-instrument-serif font-normal text-[36px] text-white leading-tight mb-4">
              Your senior is<br />already here.<br /><em className="text-white/90">"Are you?"</em>
            </h2>
            <p className="text-white/75 text-sm leading-relaxed mb-12">
              Join 50,000+ students already connecting with verified seniors from their own college.
            </p>
            <div className="space-y-4">
              <div className="flex gap-2.5">
                <div className="w-8 h-8 bg-white/15 rounded-full flex items-center justify-center text-sm flex-shrink-0">🎓</div>
                <p className="text-white/85 text-sm leading-relaxed">Connect with verified seniors from YOUR college only</p>
              </div>
              <div className="flex gap-2.5">
                <div className="w-8 h-8 bg-white/15 rounded-full flex items-center justify-center text-sm flex-shrink-0">💼</div>
                <p className="text-white/85 text-sm leading-relaxed">Get real referrals from placed seniors — 1 click</p>
              </div>
              <div className="flex gap-2.5">
                <div className="w-8 h-8 bg-white/15 rounded-full flex items-center justify-center text-sm flex-shrink-0">🤖</div>
                <p className="text-white/85 text-sm leading-relaxed">24/7 AI mentor trained on Indian placement data</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:w-3/5 bg-white min-h-screen flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-[440px] mx-auto">
            <Link href="/" className="lg:hidden text-black text-xl font-bold mb-8 text-center block no-underline">
              Clas<span style={{ color: '#7C3AED' }}>pire</span>
            </Link>
            
            <h1 className="font-instrument-serif font-normal text-[28px] text-black mb-1.5">Create your account</h1>
            <p className="text-sm text-gray-400 mb-7">
              Already have an account? <Link href="/login" className="text-purple-600 font-semibold">Sign in</Link>
            </p>

            {/* Student/Senior Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-7 gap-1">
              <button
                onClick={() => { setActiveRole("student"); setOtpSent(false); }}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                  activeRole === "student" ? "bg-white text-black shadow-sm" : "bg-transparent text-gray-400"
                }`}
              >
                🎓 Student
              </button>
              <button
                onClick={() => { setActiveRole("senior"); setOtpSent(false); }}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                  activeRole === "senior" ? "bg-white text-black shadow-sm" : "bg-transparent text-gray-400"
                }`}
              >
                👔 Senior
              </button>
            </div>

            {/* Form Container */}
            <div>
              {activeRole === "student" ? (
                /* Student Form */
                <div>
                  {!otpSent && (
                    <>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                      <input
                        type="text"
                        placeholder="Arun Kumar"
                        value={studentData.full_name}
                        onChange={(e) => setStudentData({...studentData, full_name: e.target.value})}
                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black outline-none focus:border-purple-600 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.09)] mb-4"
                        required
                      />

                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">College</label>
                      <div className="relative mb-4">
                        <input
                          type="text"
                          placeholder="Search your college..."
                          value={studentData.college_name}
                          onChange={(e) => {
                            setStudentData({...studentData, college_name: e.target.value, college_id: null});
                            setShowStudentCollegeDropdown(true);
                          }}
                          onFocus={() => setShowStudentCollegeDropdown(true)}
                          className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black outline-none focus:border-purple-600 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.09)]"
                        />
                        {showStudentCollegeDropdown && studentData.college_name && (
                          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 max-h-48 overflow-y-auto z-10">
                            {collegesLoading ? (
                              <div className="p-3.5 text-center text-sm text-gray-400">Loading...</div>
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
                                  className="flex items-center gap-2.5 p-3.5 hover:bg-gray-50 cursor-pointer"
                                >
                                        <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                          {getCollegeLogo(college.short_name, college.slug) ? (
                                            <img 
                                              src={getCollegeLogo(college.short_name, college.slug)!} 
                                              alt={college.short_name} 
                                              className="w-full h-full object-contain"
                                            />
                                          ) : (
                                      <div className="text-[10px] font-black text-purple-600">
                                        {college.short_name.toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-[13px] font-bold text-black leading-tight">{college.name}</div>
                                    <div className="text-[11px] text-gray-400 mt-0.5">{college.location}, {college.state}</div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-3.5 text-center text-sm text-gray-400">No college found</div>
                            )}
                          </div>
                        )}
                      </div>

                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Branch</label>
                      <select
                        value={studentData.branch}
                        onChange={(e) => setStudentData({...studentData, branch: e.target.value})}
                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black outline-none focus:border-purple-600 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.09)] mb-4"
                      >
                        <option value="">Select Branch</option>
                        <option value="CSE">CSE</option>
                        <option value="IT">IT</option>
                        <option value="ECE">ECE</option>
                        <option value="EEE">EEE</option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="Civil">Civil</option>
                        <option value="AIDS">AIDS</option>
                        <option value="AIML">AIML</option>
                      </select>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Year</label>
                          <select
                            value={studentData.year}
                            onChange={(e) => setStudentData({...studentData, year: e.target.value})}
                            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black outline-none focus:border-purple-600"
                          >
                            <option value="">Select Year</option>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Passout Year</label>
                          <select
                            value={studentData.passout_year}
                            onChange={(e) => setStudentData({...studentData, passout_year: e.target.value})}
                            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black outline-none focus:border-purple-600"
                          >
                            <option value="">Year</option>
                            {[2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      </div>

                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                      <input
                        type="email"
                        placeholder="yourname@gmail.com"
                        value={studentData.email}
                        onChange={(e) => setStudentData({...studentData, email: e.target.value})}
                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black outline-none focus:border-purple-600 mb-4"
                      />

                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                      <input
                        type="password"
                        placeholder="Minimum 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black outline-none focus:border-purple-600 mb-2"
                      />
                      <input
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black outline-none focus:border-purple-600 mb-6"
                      />

                      {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

                      <button
                        type="button"
                        onClick={sendOTP}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {loading ? 'Sending...' : 'Create Student Account →'}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                /* Senior Form */
                <div>
                  {!otpSent && (
                    <>
                      {/* Verification Method Selection */}
                      <div className="mb-6">
                        <p className="text-xs font-semibold text-gray-500 mb-3">How would you like to verify?</p>
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
                                verifyMethod === method.key ? "border-purple-600 bg-purple-50" : "border-gray-100 hover:border-purple-100"
                              } ${!method.available && 'opacity-60 cursor-not-allowed'}`}
                            >
                              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-lg">{method.icon}</div>
                              <div className="flex-1">
                                <div className="text-sm font-bold text-black">{method.title}</div>
                                <div className="text-[11px] text-gray-400">{method.desc}</div>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                method.available ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                              }`}>{method.badge}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Work Email Fields */}
                      {verifyMethod === 'work_email' && (
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-1.5">
                              <label className="block text-sm font-semibold text-gray-700">{seniorData.is_fresher ? 'Email' : 'Work Email'}</label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={seniorData.is_fresher}
                                  onChange={e => setSeniorData({...seniorData, is_fresher: e.target.checked})}
                                  className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-[11px] font-medium text-gray-500">I don't have work email (Fresher)</span>
                              </label>
                            </div>
                            <input
                              type="email"
                              placeholder={seniorData.is_fresher ? "yourname@gmail.com" : "name@company.com"}
                              value={seniorData.work_email}
                              onChange={e => setSeniorData({...seniorData, work_email: e.target.value})}
                              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-purple-600"
                            />
                            {!seniorData.is_fresher && <p className="text-[10px] text-gray-400 mt-1">Use office email for instant approval</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                            <input
                              type="text"
                              placeholder="Full Name"
                              value={seniorData.full_name}
                              onChange={e => setSeniorData({...seniorData, full_name: e.target.value})}
                              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-purple-600"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">College graduated from</label>
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
                                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-purple-600"
                              />
                              {showSeniorCollegeDropdown && seniorData.college_name && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 max-h-48 overflow-y-auto z-10">
                                  {collegesLoading ? (
                                    <div className="p-3.5 text-center text-sm text-gray-400">Loading...</div>
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
                                        className="flex items-center gap-2.5 p-3.5 hover:bg-gray-50 cursor-pointer"
                                      >
                                        <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                          {getCollegeLogo(college.short_name, college.slug) ? (
                                            <img 
                                              src={getCollegeLogo(college.short_name, college.slug)!} 
                                              alt={college.short_name} 
                                              className="w-full h-full object-contain"
                                            />
                                          ) : (
                                            <div className="text-[10px] font-black text-purple-600">
                                              {college.short_name.toUpperCase()}
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          <div className="text-[13px] font-bold text-black leading-tight">{college.name}</div>
                                          <div className="text-[11px] text-gray-400 mt-0.5">{college.location}, {college.state}</div>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="p-3.5 text-center text-sm text-gray-400">No college found</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Company {seniorData.is_fresher && <span className="text-gray-400 font-normal">(Optional)</span>}
                              </label>
                              <input
                                type="text"
                                placeholder="Google, etc."
                                value={seniorData.company}
                                onChange={e => setSeniorData({...seniorData, company: e.target.value})}
                                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-purple-600"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Designation {seniorData.is_fresher && <span className="text-gray-400 font-normal">(Optional)</span>}
                              </label>
                              <input
                                type="text"
                                placeholder="Software Engineer"
                                value={seniorData.designation}
                                onChange={e => setSeniorData({...seniorData, designation: e.target.value})}
                                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-purple-600"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Branch</label>
                              <input
                                type="text"
                                placeholder="CSE, etc."
                                value={seniorData.branch}
                                onChange={e => setSeniorData({...seniorData, branch: e.target.value})}
                                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-purple-600"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Passout Year</label>
                              <select 
                                value={seniorData.passout_year}
                                onChange={e => setSeniorData({...seniorData, passout_year: e.target.value})}
                                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-purple-600"
                              >
                                <option value="">Year</option>
                                {[2024, 2023, 2022, 2021, 2020, 2019, 2018].map(y => <option key={y} value={y}>{y}</option>)}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                            <input
                              type="password"
                              placeholder="Minimum 6 characters"
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-purple-600 mb-2"
                            />
                            <input
                              type="password"
                              placeholder="Confirm password"
                              value={confirmPassword}
                              onChange={e => setConfirmPassword(e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-purple-600"
                            />
                          </div>

                          {error && <p className="text-red-500 text-xs">{error}</p>}

                          <button
                            type="button"
                            onClick={sendOTP}
                            disabled={loading || !verifyMethod}
                            className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
                          >
                            {loading ? 'Processing...' : 'Verify & Continue →'}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* OTP Verification Step */}
              {otpSent && step === 'form' && (
                <div className="text-center pt-4">
                  <h2 className="font-instrument-serif text-2xl mb-2">Check your email 📧</h2>
                  <p className="text-sm text-gray-500 mb-8">
                    Enter the code sent to <span className="font-bold text-purple-600">
                      {activeRole === 'student' ? studentData.email : seniorData.work_email}
                    </span>
                  </p>

                  <div className="flex justify-center gap-2 mb-8">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(index, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(index, e)}
                        className="w-12 h-14 border border-gray-200 rounded-xl text-center text-xl font-bold focus:border-purple-600 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.09)] outline-none"
                      />
                    ))}
                  </div>

                  {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

                  <button
                    onClick={verifyAndCreate}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 mb-6"
                  >
                    {loading ? 'Verifying...' : 'Complete Signup →'}
                  </button>

                  <div className="flex justify-between items-center px-2">
                    <button onClick={() => setOtpSent(false)} className="text-xs text-gray-400 hover:text-purple-600">← Change Email</button>
                    {resendTimer > 0 ? (
                      <span className="text-xs text-gray-400">Resend in {resendTimer}s</span>
                    ) : (
                      <button onClick={sendOTP} className="text-xs text-purple-600 font-bold underline">Resend code</button>
                    )}
                  </div>
                </div>
              )}

              {/* Terms */}
              <p className="text-[11px] text-gray-400 text-center mt-12 leading-relaxed">
                By joining Claspire, you agree to our <Link href="#" className="underline">Terms</Link> and <Link href="#" className="underline">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
