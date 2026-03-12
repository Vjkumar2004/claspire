'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import Navbar from '@/components/Navbar'
import { createClient } from '@supabase/supabase-js'
import { Mail, Phone, Lock, Eye, EyeOff, User, GraduationCap, MapPin, Calendar } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SignupPage() {
  const router = useRouter()
  
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
  const [seniorData, setSeniorData] = useState({
    full_name: '',
    college_id: null as string | null,
    college_name: '',
    graduation_year: '',
    company: '',
    designation: '',
    email: '',
    selected_method: '' as 'work_email' | 'normal' | 'linkedin' | ''
  })
  
  // OTP
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpSent, setOtpSent] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  
  // Colleges from database
  const [colleges, setColleges] = useState<any[]>([])
  const [collegesLoading, setCollegesLoading] = useState(false)
  
  // Fetch colleges from database
  useEffect(() => {
    fetchColleges()
  }, [])

  const fetchColleges = async () => {
    setCollegesLoading(true)
    try {
      const { data, error } = await supabase
        .from('colleges')
        .select('id, name, short_name, slug, location, state')
        .order('name')
      
      if (error) {
        console.error('Error fetching colleges:', error)
        // Fallback to mock data if database fails
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
  
  // Dropdown visibility states
  const [showStudentCollegeDropdown, setShowStudentCollegeDropdown] = useState(false)
  const [showSeniorCollegeDropdown, setShowSeniorCollegeDropdown] = useState(false)

  // Get email placeholder based on selected college
  const getEmailPlaceholder = () => {
    // Always allow any email - no restrictions
    return 'yourname@gmail.com'
  }

  // Send OTP function
  const sendOTP = async () => {
    const email = activeRole === 'student'
      ? studentData.email
      : seniorData.email

    if (!email) {
      setError('Email is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      // Debug log
      console.log('OTP API response:', res.status, data)

      if (!res.ok) {
        setError(data.error || 'Failed to send OTP')
        return
      }

      setOtpSent(true)

      // Start 30s resend timer
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
      setLoading(false) // ← ALWAYS reset!
    }
  }

  // Verify and Create function
  const verifyAndCreate = async () => {
    const email = activeRole === 'student'
      ? studentData.email
      : seniorData.email

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
      const profileData = activeRole === 'student' ? {
        full_name: studentData.full_name,
        college_id: studentData.college_id || null,
        branch: studentData.branch || '',
        year: parseInt(studentData.year) || 1,
        passout_year: parseInt(studentData.passout_year) || 2025,
        is_verified: true,
        verification_type: 'manual',
        verification_status: 'verified',
      } : {
        full_name: seniorData.full_name,
        college_id: seniorData.college_id || null,
        graduation_year: parseInt(seniorData.graduation_year) || 2020,
        company: seniorData.company || '',
        designation: seniorData.designation || '',
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
        console.error('Create user failed:', createData.error)
        setError(createData.error || 'Failed to create account')
        return
      }

      console.log('Create user successful, setting success step')
      setStep('success')
      
      // Wait for session to be established, then verify before redirecting
      setTimeout(async () => {
        console.log('Checking session before redirect...')
        try {
          const res = await fetch('/api/auth/me')
          console.log('Session check response:', res.status)
          if (res.ok) {
            const data = await res.json()
            console.log('Session data:', data)
            if (data.user) {
              console.log('Session verified, redirecting to dashboard:', activeRole === 'senior' ? '/dashboard/senior' : '/dashboard/junior')
              // Direct redirect to specific dashboard - no more /dashboard route
              if (activeRole === 'senior') {
                router.push('/dashboard/senior')
              } else {
                router.push('/dashboard/junior')
              }
            } else {
              console.error('No user in session, not redirecting')
              setError('Session creation failed. Please try again.')
            }
          } else {
            console.error('Session check failed:', res.status)
            setError('Session creation failed. Please try again.')
          }
        } catch (error) {
          console.error('Session check error:', error)
          setError('Session creation failed. Please try again.')
        }
      }, 3000)

    } catch (err) {
      console.error('Verify error:', err)
      setError('Network error. Try again.')
    } finally {
      setLoading(false) // ← ALWAYS reset!
    }
  }

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    
    // Auto focus next
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
          <h1 className="font-instrument-serif font-normal text-2xl text-black mb-4">
            Welcome to Claspire!
          </h1>
          
          {activeRole === 'student' && (
            <p className="text-gray-600 text-sm mb-6">
              Your student account has been created successfully!
            </p>
          )}
          
          {activeRole === 'senior' && seniorData.selected_method === 'linkedin' && (
            <p className="text-green-600 text-sm mb-6">
              ✅ LinkedIn verified! Your senior account is now active.
            </p>
          )}
          
          {activeRole === 'senior' && seniorData.selected_method === 'work_email' && (
            <p className="text-green-600 text-sm mb-6">
              ✅ Work email verified! Your senior account is now active.
            </p>
          )}
          
          {activeRole === 'senior' && seniorData.selected_method === 'normal' && (
            <p className="text-orange-600 text-sm mb-6">
              ⏳ Account created! 5 juniors need to confirm your identity.
            </p>
          )}
          
          <button 
            onClick={() => router.push(activeRole === 'senior' ? '/dashboard/senior' : '/dashboard/junior')}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Go to {activeRole === 'senior' ? 'Senior' : ''} Dashboard →
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
        {/* Background Decorations */}
        <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-white rounded-full opacity-15"></div>
        <div className="absolute bottom-[-50px] left-[-50px] w-[200px] h-[200px] bg-white rounded-full opacity-15"></div>
        
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-center p-12">
          {/* Logo */}
          <Link 
            href="/" 
            className="text-white text-2xl font-bold mb-12 no-underline inline-block"
          >
            Clas<span style={{ color: 'white' }}>pire</span>
          </Link>
          
          {/* Heading */}
          <h2 className="font-instrument-serif font-normal text-[36px] text-white leading-tight mb-4">
            Your senior is<br />
            already here.<br />
            <em className="text-white/90">"Are you?"</em>
          </h2>
          
          {/* Subtext */}
          <p className="text-white/75 text-sm leading-relaxed mb-12">
            Join 50,000+ students already connecting with verified seniors from their own college.
          </p>
          
          {/* Proof Points */}
          <div className="space-y-4">
            <div className="flex gap-2.5">
              <div className="w-8 h-8 bg-white/15 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                🎓
              </div>
              <p className="text-white/85 text-sm leading-relaxed">
                Connect with verified seniors from YOUR college only
              </p>
            </div>
            
            <div className="flex gap-2.5">
              <div className="w-8 h-8 bg-white/15 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                💼
              </div>
              <p className="text-white/85 text-sm leading-relaxed">
                Get real referrals from placed seniors — 1 click
              </p>
            </div>
            
            <div className="flex gap-2.5">
              <div className="w-8 h-8 bg-white/15 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                🤖
              </div>
              <p className="text-white/85 text-sm leading-relaxed">
                24/7 AI mentor trained on Indian placement data
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="lg:w-3/5 bg-white min-h-screen flex items-center justify-center p-12 lg:p-12">
        <div className="w-full max-w-[440px] mx-auto">
          {/* Mobile Logo */}
          <Link 
            href="/" 
            className="lg:hidden text-black text-xl font-bold mb-8 text-center block no-underline"
          >
            Clas<span style={{ color: '#7C3AED' }}>pire</span>
          </Link>
          
          {/* Header */}
          <h1 className="font-instrument-serif font-normal text-[28px] text-black mb-1.5">
            Create your account
          </h1>
          <p className="text-sm text-gray-400 mb-7">
            Already have an account? <a href="/login" className="text-purple-600 font-semibold">Sign in</a>
          </p>

          {/* Student/Senior Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-7 gap-1">
            <button
              onClick={() => setActiveRole("student")}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                activeRole === "student"
                  ? "bg-white text-black shadow-sm"
                  : "bg-transparent text-gray-400"
              }`}
            >
              🎓 Student
            </button>
            <button
              onClick={() => setActiveRole("senior")}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                activeRole === "senior"
                  ? "bg-white text-black shadow-sm"
                  : "bg-transparent text-gray-400"
              }`}
            >
              👔 Senior
            </button>
          </div>

          {/* Forms */}
          <div>
            {activeRole === "student" ? (
              /* Student Form */
              <div>
                {/* Full Name */}
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="Arun Kumar"
                  value={studentData.full_name}
                  onChange={(e) => setStudentData({...studentData, full_name: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black outline-none focus:border-purple-600 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.09)] mb-4"
                  required
                />

                {/* College */}
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
                  
                  {/* College Dropdown */}
                  {showStudentCollegeDropdown && studentData.college_name && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 max-h-48 overflow-y-auto z-10">
                      {collegesLoading ? (
                        <div className="p-3.5 text-center text-sm text-gray-400">
                          Loading colleges...
                        </div>
                      ) : colleges.filter((college: any) => 
                        college.short_name.toLowerCase().includes(studentData.college_name.toLowerCase()) ||
                        college.name.toLowerCase().includes(studentData.college_name.toLowerCase())
                      ).length > 0 ? (
                        colleges.filter((college: any) => 
                          college.short_name.toLowerCase().includes(studentData.college_name.toLowerCase()) ||
                          college.name.toLowerCase().includes(studentData.college_name.toLowerCase())
                        ).map((college: any) => (
                          <div
                            key={college.id}
                            onClick={() => {
                              setStudentData({
                                ...studentData, 
                                college_id: college.id, // Use UUID from database
                                college_name: college.short_name
                              });
                              setShowStudentCollegeDropdown(false);
                            }}
                            className="flex items-center gap-2.5 p-3.5 hover:bg-gray-50 cursor-pointer"
                          >
                            <div className="w-7 h-7 rounded bg-purple-100 flex items-center justify-center text-xs font-black text-purple-600">
                              {college.short_name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-black">{college.short_name}</div>
                              <div className="text-xs text-gray-400">{college.location}, {college.state}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3.5 text-center text-sm text-gray-400">
                          No colleges found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Branch */}
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Branch</label>
                <select
                  value={studentData.branch}
                  onChange={(e) => setStudentData({...studentData, branch: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black outline-none focus:border-purple-600 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.09)] mb-4"
                  required
                >
                  <option value="">Select Branch</option>
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Civil">Civil</option>
                  <option value="Chemical">Chemical</option>
                  <option value="AIDS">AIDS</option>
                  <option value="AIML">AIML</option>
                  <option value="Cyber Security">Cyber Security</option>
                  <option value="Other">Other</option>
                </select>

                {/* Year */}
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Year</label>
                <div className="flex gap-2 mb-4">
                  {["1st", "2nd", "3rd", "Final"].map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => setStudentData({...studentData, year})}
                      className={`flex-1 py-2.5 border rounded-lg text-sm font-semibold transition-colors ${
                        studentData.year === year
                          ? "border-purple-600 text-purple-600 bg-purple-50"
                          : "border-gray-200 text-gray-500"
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>

                {/* Passout Year */}
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expected Passout Year</label>
                <select
                  value={studentData.passout_year}
                  onChange={(e) => setStudentData({...studentData, passout_year: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black outline-none focus:border-purple-600 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.09)] mb-4"
                  required
                >
                  <option value="">Select Year</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                  <option value="2029">2029</option>
                </select>

                {/* Email */}
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                  <Mail size={14} />
                  Email
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="email"
                    placeholder={getEmailPlaceholder()}
                    value={studentData.email}
                    onChange={(e) => setStudentData({...studentData, email: e.target.value})}
                    className="flex-1 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black outline-none focus:border-purple-600 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.09)]"
                    required
                  />
                  {studentData.email && (
                    <button
                      type="button"
                      onClick={sendOTP}
                      disabled={loading}
                      className="bg-purple-600 text-white rounded-lg px-3.5 py-2 text-xs font-semibold disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : 'Send OTP'}
                    </button>
                  )}
                </div>

                {/* Password Fields - Show before OTP */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: 6
                  }}>
                    Set Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{
                        width: '100%',
                        border: '1.5px solid #E5E7EB',
                        borderRadius: 8,
                        padding: '11px 40px 11px 14px',
                        fontSize: 14,
                        color: '#0A0A0A',
                        outline: 'none',
                        fontFamily: 'Plus Jakarta Sans',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: 12, top: '50%',
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

                <div style={{ marginBottom: 16 }}>
                  <label style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: 6
                  }}>
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      style={{
                        width: '100%',
                        border: `1.5px solid ${
                          confirmPassword && password !== confirmPassword 
                            ? '#EF4444' : '#E5E7EB'
                        }`,
                        borderRadius: 8,
                        padding: '11px 40px 11px 14px',
                        fontSize: 14,
                        color: '#0A0A0A',
                        outline: 'none',
                        fontFamily: 'Plus Jakarta Sans',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: 12, top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#9CA3AF',
                        fontSize: 16,
                        padding: 0
                      }}
                    >
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p style={{
                      fontSize: 11,
                      color: '#EF4444',
                      marginTop: 4
                    }}>
                      Passwords do not match ❌
                    </p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p style={{
                      fontSize: 11,
                      color: '#16A34A',
                      marginTop: 4
                    }}>
                      Passwords match ✅
                    </p>
                  )}
                </div>
                
                {/* Error Display */}
                {error && (
                  <div style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontSize: 13,
                    color: '#EF4444',
                    marginTop: 8
                  }}>
                    ⚠️ {error}
                  </div>
                )}
                
                <p className="text-xs text-gray-400 mb-4">
                  Enter your email address to receive OTP
                </p>
                
                {/* Form Step (when OTP not sent) */}
                {!otpSent && (
                  <div>
                    {/* Error Display */}
                    {error && (
                      <div style={{
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '13px',
                        color: '#EF4444',
                        marginTop: '12px',
                        marginBottom: '12px'
                      }}>
                        {error}
                      </div>
                    )}

                    {/* Password Fields - Show only after OTP sent */}
                    {otpSent && (
                      <>
                        {/* Password Field */}
                        <div style={{ marginBottom: 16 }}>
                          <label style={{
                            display: 'block',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#374151',
                            marginBottom: 6
                          }}>
                            Set Password
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Minimum 6 characters"
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              style={{
                                width: '100%',
                                border: '1.5px solid #E5E7EB',
                                borderRadius: 8,
                                padding: '11px 40px 11px 14px',
                                fontSize: 14,
                                color: '#0A0A0A',
                                outline: 'none',
                                fontFamily: 'Plus Jakarta Sans',
                                boxSizing: 'border-box'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              style={{
                                position: 'absolute',
                                right: 12, top: '50%',
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

                        {/* Confirm Password Field */}
                        <div style={{ marginBottom: 16 }}>
                          <label style={{
                            display: 'block',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#374151',
                            marginBottom: 6
                          }}>
                            Confirm Password
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Re-enter password"
                              value={confirmPassword}
                              onChange={e => setConfirmPassword(e.target.value)}
                              style={{
                                width: '100%',
                                border: `1.5px solid ${
                                  confirmPassword && password !== confirmPassword 
                                    ? '#EF4444' : '#E5E7EB'
                                }`,
                                borderRadius: 8,
                                padding: '11px 40px 11px 14px',
                                fontSize: 14,
                                color: '#0A0A0A',
                                outline: 'none',
                                fontFamily: 'Plus Jakarta Sans',
                                boxSizing: 'border-box'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              style={{
                                position: 'absolute',
                                right: 12, top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#9CA3AF',
                                fontSize: 16,
                                padding: 0
                              }}
                            >
                              {showConfirmPassword ? '🙈' : '👁️'}
                            </button>
                          </div>
                          {confirmPassword && password !== confirmPassword && (
                            <p style={{
                              fontSize: 11,
                              color: '#EF4444',
                              marginTop: 4
                            }}>
                              Passwords do not match ❌
                            </p>
                          )}
                          {confirmPassword && password === confirmPassword && (
                            <p style={{
                              fontSize: 11,
                              color: '#16A34A',
                              marginTop: 4
                            }}>
                              Passwords match ✅
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Submit Button */}
                    <button
                      type="button"
                      onClick={sendOTP}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : 'Create Student Account →'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Senior Form */
              <div>
                {/* Verification Method Selection */}
                <div className="mb-6">
                  <p className="text-xs text-gray-500 mb-4">How would you like to verify?</p>
                  
                  <div className="space-y-2.5">
                    {/* LinkedIn Option */}
                    <div
                      onClick={() => setSeniorData({...seniorData, selected_method: 'linkedin'})}
                      className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                        seniorData.selected_method === 'linkedin' 
                          ? "border-purple-600 bg-purple-50" 
                          : "border-gray-200 hover:border-purple-200"
                      }`}
                    >
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                        in
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-black">Continue with LinkedIn</div>
                        <div className="text-xs text-gray-400">Instant verification — recommended</div>
                      </div>
                      <span className="bg-green-50 text-green-600 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                        ⚡ Instant Verified
                      </span>
                    </div>

                    {/* Work Email Option */}
                    <div
                      onClick={() => setSeniorData({...seniorData, selected_method: 'work_email'})}
                      className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                        seniorData.selected_method === 'work_email' 
                          ? "border-purple-600 bg-purple-50" 
                          : "border-gray-200 hover:border-purple-200"
                      }`}
                    >
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                        ✉️
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-black">Use Work Email</div>
                        <div className="text-xs text-gray-400">Get OTP on your company email</div>
                      </div>
                      <span className="bg-green-50 text-green-600 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                        ⚡ Instant Verified
                      </span>
                    </div>

                    {/* Manual Option */}
                    <div
                      onClick={() => setSeniorData({...seniorData, selected_method: 'normal'})}
                      className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                        seniorData.selected_method === 'normal' 
                          ? "border-purple-600 bg-purple-50" 
                          : "border-gray-200 hover:border-purple-200"
                      }`}
                    >
                      <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
                        👥
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-black">Community Verification</div>
                        <div className="text-xs text-gray-400">5 juniors need to confirm your identity</div>
                      </div>
                      <span className="bg-orange-50 text-orange-600 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                        � 2-3 days
                      </span>
                    </div>
                  </div>
                </div>

                {/* LinkedIn Method */}
                {seniorData.selected_method === 'linkedin' && (
                  <div className="mb-6">
                    <button
                      type="button"
                      className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
                    >
                      Continue with LinkedIn →
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-2">
                      We'll pull your company, role, and college from LinkedIn
                    </p>
                  </div>
                )}

                {/* Work Email Method */}
                {seniorData.selected_method === 'work_email' && (
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Work Email</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="email"
                        placeholder="your.name@company.com"
                        value={seniorData.email}
                        onChange={(e) => setSeniorData({...seniorData, email: e.target.value})}
                        className="flex-1 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black outline-none focus:border-purple-600 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.09)]"
                        required
                      />
                      {seniorData.email && (
                        <button
                          type="button"
                          onClick={sendOTP}
                          disabled={loading}
                          className="bg-purple-600 text-white rounded-lg px-3.5 py-2 text-xs font-semibold disabled:opacity-50"
                        >
                          {loading ? 'Sending...' : 'Send OTP'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Manual Method */}
                {seniorData.selected_method === 'normal' && (
                  <div className="mb-6">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-orange-600">👥</div>
                        <div className="text-sm font-bold text-orange-600">Community Verification</div>
                      </div>
                      <p className="text-xs text-orange-700">
                        5 juniors from your college need to confirm you're a genuine senior. 
                        This usually takes 2-3 days.
                      </p>
                    </div>
                  </div>
                )}

                {/* Common Fields for All Methods */}
                {(seniorData.selected_method === 'linkedin' || seniorData.selected_method === 'work_email' || seniorData.selected_method === 'normal') && (
                  <div>
                    {/* Full Name */}
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      placeholder="Rahul Sharma"
                      value={seniorData.full_name}
                      onChange={(e) => setSeniorData({...seniorData, full_name: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black outline-none focus:border-purple-600 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.09)] mb-4"
                      required
                    />

                    {/* College */}
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">College</label>
                    <div className="relative mb-4">
                      <input
                        type="text"
                        placeholder="Search your college..."
                        value={seniorData.college_name}
                        onChange={(e) => {
                          setSeniorData({...seniorData, college_name: e.target.value, college_id: null});
                          setShowSeniorCollegeDropdown(true);
                        }}
                        onFocus={() => setShowSeniorCollegeDropdown(true)}
                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black outline-none focus:border-purple-600 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.09)]"
                      />
                      
                      {/* College Dropdown */}
                      {showSeniorCollegeDropdown && seniorData.college_name && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 max-h-48 overflow-y-auto z-10">
                        {collegesLoading ? (
                          <div className="p-3.5 text-center text-sm text-gray-400">
                            Loading colleges...
                          </div>
                        ) : colleges.filter((college: any) => 
                          college.short_name.toLowerCase().includes(seniorData.college_name.toLowerCase()) ||
                          college.name.toLowerCase().includes(seniorData.college_name.toLowerCase())
                        ).length > 0 ? (
                          colleges.filter((college: any) => 
                            college.short_name.toLowerCase().includes(seniorData.college_name.toLowerCase()) ||
                            college.name.toLowerCase().includes(seniorData.college_name.toLowerCase())
                          ).map((college: any) => (
                            <div
                              key={college.id}
                              onClick={() => {
                                setSeniorData({
                                  ...seniorData, 
                                  college_id: college.id, // Use UUID from database
                                  college_name: college.short_name
                                });
                                setShowSeniorCollegeDropdown(false);
                              }}
                              className="flex items-center gap-2.5 p-3.5 hover:bg-gray-50 cursor-pointer"
                            >
                              <div className="w-7 h-7 rounded bg-purple-100 flex items-center justify-center text-xs font-black text-purple-600">
                                {college.short_name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-black">{college.short_name}</div>
                                <div className="text-xs text-gray-400">{college.location}, {college.state}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3.5 text-center text-sm text-gray-400">
                            No colleges found
                          </div>
                        )}
                        </div>
                      )}
                    </div>

                    {/* Graduation Year */}
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Graduation Year</label>
                    <select
                      value={seniorData.graduation_year}
                      onChange={(e) => setSeniorData({...seniorData, graduation_year: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black outline-none focus:border-purple-600 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.09)] mb-4"
                      required
                    >
                      <option value="">Select Year</option>
                      <option value="2020">2020</option>
                      <option value="2021">2021</option>
                      <option value="2022">2022</option>
                      <option value="2023">2023</option>
                      <option value="2024">2024</option>
                    </select>

                    {/* Company & Designation (for LinkedIn/Work Email) */}
                    {(seniorData.selected_method === 'linkedin' || seniorData.selected_method === 'work_email') && (
                      <>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company</label>
                        <input
                          type="text"
                          placeholder="Swiggy"
                          value={seniorData.company}
                          onChange={(e) => setSeniorData({...seniorData, company: e.target.value})}
                          className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black outline-none focus:border-purple-600 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.09)] mb-4"
                          required
                        />

                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Designation</label>
                        <input
                          type="text"
                          placeholder="SDE-2"
                          value={seniorData.designation}
                          onChange={(e) => setSeniorData({...seniorData, designation: e.target.value})}
                          className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black outline-none focus:border-purple-600 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.09)] mb-4"
                          required
                        />
                      </>
                    )}

                    {/* Email (for manual method) */}
                    {seniorData.selected_method === 'normal' && (
                      <>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="email"
                            placeholder="your.email@gmail.com"
                            value={seniorData.email}
                            onChange={(e) => setSeniorData({...seniorData, email: e.target.value})}
                            className="flex-1 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black outline-none focus:border-purple-600 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.09)]"
                            required
                          />
                          {seniorData.email && (
                            <button
                              type="button"
                              onClick={sendOTP}
                              disabled={loading}
                              className="bg-purple-600 text-white rounded-lg px-3.5 py-2 text-xs font-semibold disabled:opacity-50"
                            >
                              {loading ? 'Sending...' : 'Send OTP'}
                            </button>
                          )}
                        </div>
                      </>
                    )}

                    {/* Error Display */}
                    {error && (
                      <div style={{
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: 8,
                        padding: '10px 14px',
                        fontSize: 13,
                        color: '#EF4444',
                        marginTop: 12,
                        marginBottom: 12
                      }}>
                        ⚠️ {error}
                      </div>
                    )}

                    {/* Password Fields - Show only after OTP sent */}
                    {otpSent && (
                      <>
                        {/* Password Field */}
                        <div style={{ marginBottom: 16 }}>
                          <label style={{
                            display: 'block',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#374151',
                            marginBottom: 6
                          }}>
                            Set Password
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Minimum 6 characters"
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              style={{
                                width: '100%',
                                border: '1.5px solid #E5E7EB',
                                borderRadius: 8,
                                padding: '11px 40px 11px 14px',
                                fontSize: 14,
                                color: '#0A0A0A',
                                outline: 'none',
                                fontFamily: 'Plus Jakarta Sans',
                                boxSizing: 'border-box'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              style={{
                                position: 'absolute',
                                right: 12, top: '50%',
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

                        {/* Confirm Password Field */}
                        <div style={{ marginBottom: 16 }}>
                          <label style={{
                            display: 'block',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#374151',
                            marginBottom: 6
                          }}>
                            Confirm Password
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Re-enter password"
                              value={confirmPassword}
                              onChange={e => setConfirmPassword(e.target.value)}
                              style={{
                                width: '100%',
                                border: `1.5px solid ${
                                  confirmPassword && password !== confirmPassword 
                                    ? '#EF4444' : '#E5E7EB'
                                }`,
                                borderRadius: 8,
                                padding: '11px 40px 11px 14px',
                                fontSize: 14,
                                color: '#0A0A0A',
                                outline: 'none',
                                fontFamily: 'Plus Jakarta Sans',
                                boxSizing: 'border-box'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              style={{
                                position: 'absolute',
                                right: 12, top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#9CA3AF',
                                fontSize: 16,
                                padding: 0
                              }}
                            >
                              {showConfirmPassword ? '🙈' : '👁️'}
                            </button>
                          </div>
                          {confirmPassword && password !== confirmPassword && (
                            <p style={{
                              fontSize: 11,
                              color: '#EF4444',
                              marginTop: 4
                            }}>
                              Passwords do not match ❌
                            </p>
                          )}
                          {confirmPassword && password === confirmPassword && (
                            <p style={{
                              fontSize: 11,
                              color: '#16A34A',
                              marginTop: 4
                            }}>
                              Passwords match ✅
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Submit Button */}
                    <button
                      type="button"
                      onClick={sendOTP}
                      disabled={loading || !seniorData.selected_method}
                      className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : 'Create Senior Account →'}
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* OTP Verification Step - Common for both Student and Senior */}
            {otpSent && step === 'form' && (
              <div className="text-center">
                <h2 className="font-instrument-serif font-normal text-2xl text-black mb-2">
                  📬 Check your email
                </h2>
                <p className="text-sm text-gray-600 mb-2">
                  We sent a 6-digit OTP to
                </p>
                <p className="text-sm font-bold text-purple-600 mb-6">
                  {activeRole === 'student' ? studentData.email : seniorData.email}
                </p>
                
                {/* OTP Input Boxes */}
                <div className="flex justify-center gap-2 mb-6">
                  {otp.map((value, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      value={value}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      inputMode="numeric"
                      maxLength={1}
                      className={`w-11 h-12 border rounded-lg text-center text-xl font-bold outline-none transition-colors ${
                        value ? "border-purple-600 bg-purple-50" : "border-gray-200"
                      } focus:border-purple-600 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.09)]`}
                    />
                  ))}
                </div>
                
                {/* Error Display */}
                {error && (
                  <div style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    color: '#EF4444',
                    marginBottom: '16px'
                  }}>
                    {error}
                  </div>
                )}
                
                {/* Verify Button */}
                <button
                  type="button"
                  onClick={verifyAndCreate}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 mb-4"
                >
                  {loading ? 'Verifying...' : 'Verify OTP →'}
                </button>
                
                {/* Resend Section */}
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-xs text-gray-400">Resend OTP in {resendTimer}s</p>
                  ) : (
                    <p className="text-xs text-gray-400">
                      Didn't receive? 
                      <button 
                        onClick={sendOTP}
                        className="text-purple-600 font-semibold ml-1"
                      >
                        Resend OTP
                      </button>
                    </p>
                  )}
                </div>
                
                {/* Back Link */}
                <div className="text-center mt-2">
                  <button 
                    onClick={() => {
                      setOtpSent(false)
                      setOtp(['', '', '', '', '', ''])
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    ← Change email
                  </button>
                </div>
              </div>
            )}

            {/* Terms */}
            <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
              By creating an account, you agree to our <a href="#" className="text-purple-600">Terms of Service</a> and <a href="#" className="text-purple-600">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
