'use client'

import { useState, useEffect } from 'react'
import { Shield, CheckCircle, XCircle, Loader2, Clock, Search, Mail, Globe, Building2, User, ExternalLink } from 'lucide-react'
import Link from 'next/link'

type Claim = {
  id: string
  college_id: string
  user_id: string
  official_email: string
  official_website: string
  designation: string
  contact_person: string
  verification_msg: string | null
  status: string
  created_at: string
  reviewed_at: string | null
  colleges: {
    id: string
    name: string
    short_name: string
    slug: string
    type: string
    location: string
    state: string
    email_domain?: string | null
    website_url?: string | null
  }
  users: {
    id: string
    full_name: string
    email: string
    role: string
    avatar_url: string | null
  }
}

export default function CollegeClaimsAdminPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchClaims()
  }, [])

  const fetchClaims = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/college-claims')
      if (!res.ok) {
        if (res.status === 403) {
          setError('Unauthorized. Only global admins can review claims.')
        } else {
          setError('Failed to fetch claims')
        }
        return
      }
      const data = await res.json()
      if (data.success) setClaims(data.claims)
    } catch (err) {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/college-claims/${id}/approve`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        await fetchClaims()
      } else {
        alert(data.error || 'Failed to approve')
      }
    } catch (err) {
      alert('Connection error')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (id: string) => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/college-claims/${id}/reject`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        await fetchClaims()
      } else {
        alert(data.error || 'Failed to reject')
      }
    } catch (err) {
      alert('Connection error')
    } finally {
      setProcessing(null)
    }
  }

  const filtered = claims.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        c.colleges?.name?.toLowerCase().includes(q) ||
        c.colleges?.short_name?.toLowerCase().includes(q) ||
        c.users?.full_name?.toLowerCase().includes(q) ||
        c.official_email?.toLowerCase().includes(q)
      )
    }
    return true
  })

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#1D2226] flex items-center justify-center">
        <div className="text-center">
          <Shield size={48} className="mx-auto text-red-400 mb-4" />
          <p className="text-gray-900 dark:text-white font-bold text-lg">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <Shield className="text-purple-600" size={28} />
              College Claims
            </h1>
            <p className="text-sm text-gray-500 dark:text-[#B0B7BE] mt-1">
              Review and manage college ownership requests
            </p>
          </div>
          <div className="flex items-center gap-2">
            {['pending', 'all', 'approved', 'rejected'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === f
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-white dark:bg-[#283036] text-gray-600 dark:text-[#B0B7BE] border border-gray-200 dark:border-[#38434F] hover:border-purple-300'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mb-6">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by college name, applicant, or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#283036] border border-gray-200 dark:border-[#38434F] rounded-lg text-sm font-medium outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-[#283036] rounded-lg border border-gray-200 dark:border-[#38434F] p-6 animate-pulse">
                <div className="h-5 bg-gray-200 dark:bg-[#38434F] rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-[#38434F] rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-[#38434F] rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#283036] rounded-lg border border-gray-200 dark:border-[#38434F]">
            <Shield size={40} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 dark:text-[#B0B7BE] font-bold">No {filter !== 'all' ? filter : ''} claims found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((claim) => (
              <div
                key={claim.id}
                className="bg-white dark:bg-[#283036] rounded-lg border border-gray-200 dark:border-[#38434F] p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                        {claim.colleges?.name || 'Unknown College'}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        claim.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : claim.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {claim.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Applicant</p>
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400 shrink-0" />
                          <span className="font-semibold text-gray-900 dark:text-white truncate">{claim.users?.full_name || 'Unknown'}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-[#B0B7BE] truncate">{claim.users?.email}</p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email</p>
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-gray-400 shrink-0" />
                          <span className="font-medium text-gray-700 dark:text-[#B0B7BE] truncate">{claim.official_email}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Designation</p>
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-gray-400 shrink-0" />
                          <span className="font-medium text-gray-700 dark:text-[#B0B7BE]">{claim.designation}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-[#B0B7BE]">Contact: {claim.contact_person}</p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Submitted</p>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-400 shrink-0" />
                          <span className="font-medium text-gray-700 dark:text-[#B0B7BE]">{new Date(claim.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {claim.verification_msg && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-[#1D2226] rounded-lg">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Verification Message</p>
                        <p className="text-xs text-gray-700 dark:text-[#B0B7BE]">{claim.verification_msg}</p>
                      </div>
                    )}

                    {/* Domain Match */}
                    {(() => {
                      const detectedDomain = claim.official_email?.split('@')[1]?.toLowerCase()
                      const expectedDomain = claim.colleges?.email_domain?.toLowerCase()
                      const websiteUrl = claim.colleges?.website_url
                      let fallbackDomain = ''
                      if (!expectedDomain && websiteUrl) {
                        try {
                          const hostname = new URL(websiteUrl).hostname.replace('www.', '')
                          const parts = hostname.split('.')
                          fallbackDomain = parts.slice(-2).join('.').toLowerCase()
                        } catch {}
                      }
                      const displayDomain = expectedDomain || fallbackDomain
                      const isMatch = detectedDomain && displayDomain && (
                        detectedDomain === displayDomain || detectedDomain.endsWith('.' + displayDomain)
                      )
                      return (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-[#1D2226] rounded-lg border border-gray-200 dark:border-[#38434F]">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Domain Verification</p>
                          <div className="grid grid-cols-3 gap-4 text-xs">
                            <div>
                              <p className="text-gray-400 font-semibold mb-0.5">Detected</p>
                              <p className="font-bold text-gray-900 dark:text-white">{detectedDomain || '—'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 font-semibold mb-0.5">Expected</p>
                              <p className="font-bold text-gray-900 dark:text-white">{displayDomain || '—'}</p>
                              {!expectedDomain && websiteUrl && (
                                <p className="text-[9px] text-amber-600 mt-0.5">Extracted from website URL</p>
                              )}
                            </div>
                            <div className="flex items-center justify-end">
                              {isMatch ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                                  <CheckCircle size={10} /> Match
                                </span>
                              ) : displayDomain ? (
                                <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-red-200">
                                  <XCircle size={10} /> Mismatch
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400 italic">No domain on file</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    <div className="mt-3 flex items-center gap-3 text-xs">
                      <Link
                        href={`/colleges/${claim.colleges?.slug}`}
                        target="_blank"
                        className="text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1"
                      >
                        View College <ExternalLink size={12} />
                      </Link>
                      <a
                        href={claim.official_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1"
                      >
                        Website <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>

                  {claim.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApprove(claim.id)}
                        disabled={processing === claim.id}
                        className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-xs transition-all disabled:opacity-50"
                      >
                        {processing === claim.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(claim.id)}
                        disabled={processing === claim.id}
                        className="inline-flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-xs transition-all disabled:opacity-50"
                      >
                        {processing === claim.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
