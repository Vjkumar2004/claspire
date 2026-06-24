'use client'

import { useState, useEffect } from 'react'
import { Shield, CheckCircle, XCircle, Loader2, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'

type Props = {
  collegeId: string
  collegeSlug: string
  collegeName: string
  collegeDomain?: string | null
  isVerified: boolean
}

export default function CollegeClaimButton({ collegeId, collegeSlug, collegeName, collegeDomain, isVerified }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [checking, setChecking] = useState(true)
  const [existingClaim, setExistingClaim] = useState<any>(null)

  const [formData, setFormData] = useState({
    official_email: '',
    official_website: '',
    designation: '',
    contact_person: '',
    verification_msg: ''
  })

  useEffect(() => {
    checkClaimStatus()
  }, [])

  const checkClaimStatus = async () => {
    try {
      const meRes = await fetch('/api/auth/me')
      if (!meRes.ok) {
        setChecking(false)
        return
      }
      const meData = await meRes.json()
      if (!meData.user) {
        setChecking(false)
        return
      }
      setUser(meData.user)

      const [adminRes, claimsRes] = await Promise.all([
        fetch(`/api/colleges/${collegeSlug}/admin`),
        fetch('/api/colleges/claim?college_id=' + collegeId)
      ])

      if (adminRes.ok) {
        const data = await adminRes.json()
        if (data.success) {
          setExistingClaim({ status: 'approved', admin: data.admin })
        }
      }

      if (claimsRes.ok) {
        const claimsData = await claimsRes.json()
        if (claimsData.claim) {
          setExistingClaim({ status: claimsData.claim.status })
        }
      }
    } catch (err) {
      console.error('Claim status check error:', err)
    } finally {
      setChecking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/colleges/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          college_id: collegeId,
          ...formData
        })
      })

      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
      } else {
        setError(data.error || 'Failed to submit claim')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) return null

  if (existingClaim?.status === 'approved') {
    return (
      <Link
        href={`/colleges/${collegeSlug}/admin`}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-200/50"
      >
        <Shield size={16} />
        Admin Dashboard
        <ArrowRight size={14} />
      </Link>
    )
  }

  if (existingClaim?.status === 'pending') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-1">
          <Clock size={16} />
          Claim Pending Review
        </div>
        <p className="text-amber-600 text-xs">
          Your request to manage {collegeName} is under review. We will notify you once approved.
        </p>
      </div>
    )
  }

  if (existingClaim?.status === 'rejected') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-700 font-bold text-sm mb-1">
          <XCircle size={16} />
          Claim Rejected
        </div>
        <p className="text-red-600 text-xs">
          Your request to manage {collegeName} was not approved. You can submit a new claim with updated information.
        </p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-1">
          <CheckCircle size={16} />
          Claim Submitted!
        </div>
        <p className="text-emerald-600 text-xs">
          Your request to manage {collegeName} has been received. We will notify you once reviewed.
        </p>
      </div>
    )
  }

  if (isVerified && !existingClaim) {
    return (
      <div className="flex items-center gap-2 text-gray-500 dark:text-[#B0B7BE]">
        <Shield size={16} className="text-emerald-500" />
        <span className="text-xs font-semibold">This college has been claimed by an official representative.</span>
      </div>
    )
  }

  return (
    <div>
      {!isVerified && !user && (
        <div>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0A2540] to-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-[#F4A01C]/20/50"
          >
            <Shield size={16} />
            Sign Up to Claim This College
            <ArrowRight size={14} />
          </Link>

          <div className="mt-3 space-y-2">
            <p className="text-[11px] font-bold text-gray-500 dark:text-[#B0B7BE] uppercase tracking-wider">What you get</p>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <CheckCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-[11px] text-gray-600 dark:text-[#B0B7BE]">Verified College badge on profile</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-[11px] text-gray-600 dark:text-[#B0B7BE]">Edit college banner & logo</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-[11px] text-gray-600 dark:text-[#B0B7BE]">Add description, website & social links</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-[11px] text-gray-600 dark:text-[#B0B7BE]">Post college announcements & updates</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-[11px] text-gray-600 dark:text-[#B0B7BE]">Official representative recognition</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isVerified && user && (
        <div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0A2540] to-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-[#F4A01C]/20/50"
          >
            <Shield size={16} />
            {isOpen ? 'Cancel' : 'Claim This College'}
          </button>

          <div className="mt-3 space-y-2">
            <p className="text-[11px] font-bold text-gray-500 dark:text-[#B0B7BE] uppercase tracking-wider">What you get</p>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <CheckCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-[11px] text-gray-600 dark:text-[#B0B7BE]">Verified College badge on profile</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-[11px] text-gray-600 dark:text-[#B0B7BE]">Edit college banner & logo</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-[11px] text-gray-600 dark:text-[#B0B7BE]">Add description, website & social links</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-[11px] text-gray-600 dark:text-[#B0B7BE]">Post college announcements & updates</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-[11px] text-gray-600 dark:text-[#B0B7BE]">Official representative recognition</span>
              </div>
            </div>
          </div>

          {isOpen && (
            <div className="mt-4 bg-surface dark:bg-[#283036] border border-surface dark:border-[#38434F] rounded-xl p-6 shadow-lg max-w-md">
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Claim {collegeName}</h3>
              <p className="text-xs text-gray-500 dark:text-[#B0B7BE] mb-5">
                Prove you are an official representative to manage this college page.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-[#B0B7BE] mb-1.5 uppercase tracking-wider">
                    Your Official Email *
                  </label>
                  <input
                    required
                    type="email"
                    value={formData.official_email}
                    onChange={(e) => setFormData({ ...formData, official_email: e.target.value })}
                    placeholder={collegeDomain ? `you@${collegeDomain}` : 'you@college.edu'}
                    className="w-full bg-app dark:bg-[#1D2226] border border-surface dark:border-[#38434F] rounded-lg px-4 py-2.5 text-sm font-medium outline-none focus:border-[#F4A01C] focus:ring-1 focus:ring-[#F4A01C]"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Your personal email issued by the college {collegeDomain ? `(@${collegeDomain})` : ''}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-[#B0B7BE] mb-1.5 uppercase tracking-wider">
                    Official Website *
                  </label>
                  <input
                    required
                    type="url"
                    value={formData.official_website}
                    onChange={(e) => setFormData({ ...formData, official_website: e.target.value })}
                    placeholder="https://www.college.ac.in"
                    className="w-full bg-app dark:bg-[#1D2226] border border-surface dark:border-[#38434F] rounded-lg px-4 py-2.5 text-sm font-medium outline-none focus:border-[#F4A01C] focus:ring-1 focus:ring-[#F4A01C]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-[#B0B7BE] mb-1.5 uppercase tracking-wider">
                      Designation *
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="Placement Officer"
                      className="w-full bg-app dark:bg-[#1D2226] border border-surface dark:border-[#38434F] rounded-lg px-4 py-2.5 text-sm font-medium outline-none focus:border-[#F4A01C] focus:ring-1 focus:ring-[#F4A01C]"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Your role at the college</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-[#B0B7BE] mb-1.5 uppercase tracking-wider">
                      Your Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="Dr. S. Kumar"
                      className="w-full bg-app dark:bg-[#1D2226] border border-surface dark:border-[#38434F] rounded-lg px-4 py-2.5 text-sm font-medium outline-none focus:border-[#F4A01C] focus:ring-1 focus:ring-[#F4A01C]"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Your name as the claiming representative</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-[#B0B7BE] mb-1.5 uppercase tracking-wider">
                    Verification Message (Optional)
                  </label>
                  <textarea
                    value={formData.verification_msg}
                    onChange={(e) => setFormData({ ...formData, verification_msg: e.target.value })}
                    placeholder="Any additional information to verify your association..."
                    rows={3}
                    className="w-full bg-app dark:bg-[#1D2226] border border-surface dark:border-[#38434F] rounded-lg px-4 py-2.5 text-sm font-medium outline-none focus:border-[#F4A01C] focus:ring-1 focus:ring-[#F4A01C] resize-none"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-xs font-bold flex items-start gap-1.5">
                      <XCircle size={14} className="shrink-0 mt-0.5" />
                      {error}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#0A2540] to-indigo-600 text-white font-bold py-3 rounded-lg text-sm hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><Shield size={16} /> Submit Claim</>}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
