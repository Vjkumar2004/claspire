'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Briefcase, MapPin, Building2, Search, 
  ChevronRight, Filter, Globe, Sparkles,
  Zap, ArrowRight, Lock, CheckCircle2,
  Calendar, Users, Clock, ExternalLink, Star, CheckCircle, AlertCircle, TrendingUp, DollarSign
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { useAuth } from '@/hooks/useAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

interface Job {
  id: string
  company_name: string
  role: string
  location: string
  job_type: string
  salary_range: string
  description: string
  requirements: string
  posted_date: string
  created_at: string
  referral_available: boolean
  senior: {
    id: string
    full_name: string
    company: string
    designation: string
    college_id: string
  }
  community: {
    display_name: string
    slug: string
    colleges: {
      name: string
      short_name: string
      location: string
    }
  }
}

export default function JobsPage() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [referring, setReferring] = useState(false)
  const [referralSuccess, setReferralSuccess] = useState(false)
  
  // Filter states
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [selectedJobType, setSelectedJobType] = useState<string>('all')
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [selectedSalaryRange, setSelectedSalaryRange] = useState<string>('all')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const filterDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs')
      if (res.ok) {
        const data = await res.json()
        setJobs(data)
      }
    } catch (err) {
      console.error('Error fetching jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReferralClick = (job: Job) => {
    if (!user) {
      window.location.href = '/login'
      return
    }

    // Gating Logic: Same college OR Premium user
    const isSameCollege = user?.college_id === job.senior.college_id
    const isPremiumUser = (user as any)?.is_premium || (user as any)?.premium_plan === 'premium'

    if (isSameCollege || isPremiumUser) {
      setSelectedJob(job)
    } else {
      setShowPremiumModal(true)
    }
  }

  const confirmReferral = async () => {
    if (!selectedJob || !user) return
    
    setReferring(true)
    try {
      const res = await fetch('/api/jobs/request-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobId: selectedJob.id,
          seniorId: selectedJob.senior.id
        })
      })

      if (res.ok) {
        setReferralSuccess(true)
        setTimeout(() => {
          setReferralSuccess(false)
          setSelectedJob(null)
        }, 2000)
      }
    } catch (err) {
      console.error('Referral error:', err)
    } finally {
      setReferring(false)
    }
  }

  const filteredJobs = jobs.filter(job => {
    // Search query filter
    const matchesSearch = 
      job.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Job type filter
    const matchesJobType = selectedJobType === 'all' || job.job_type.toLowerCase() === selectedJobType.toLowerCase()
    
    // Location filter
    const matchesLocation = selectedLocation === 'all' || 
      job.location.toLowerCase().includes(selectedLocation.toLowerCase())
    
    // Salary range filter
    const matchesSalary = selectedSalaryRange === 'all' || 
      (selectedSalaryRange === '0-5' && job.salary_range.includes('LPA')) ||
      (selectedSalaryRange === '5-10' && (job.salary_range.includes('5') || job.salary_range.includes('6') || job.salary_range.includes('7') || job.salary_range.includes('8') || job.salary_range.includes('9'))) ||
      (selectedSalaryRange === '10+' && (job.salary_range.includes('10') || job.salary_range.includes('15') || job.salary_range.includes('20') || job.salary_range.includes('25')))
    
    // Remote only filter
    const matchesRemote = !remoteOnly || job.location.toLowerCase().includes('remote') || job.job_type.toLowerCase().includes('remote')
    
    return matchesSearch && matchesJobType && matchesLocation && matchesSalary && matchesRemote
  })

  // Get unique values for filter options
  const getJobTypes = () => {
    const types = [...new Set(jobs.map(job => job.job_type))]
    return types.filter(Boolean)
  }

  const getLocations = () => {
    const locations = [...new Set(jobs.map(job => job.location))]
    return locations.filter(Boolean).slice(0, 10) // Limit to top 10 locations
  }

  const clearFilters = () => {
    setSelectedJobType('all')
    setSelectedLocation('all')
    setSelectedSalaryRange('all')
    setRemoteOnly(false)
  }

  const hasActiveFilters = selectedJobType !== 'all' || selectedLocation !== 'all' || 
    selectedSalaryRange !== 'all' || remoteOnly

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* Hero Section */}
      <div className="relative pt-28 pb-16 overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-100/30 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-50/30 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-full border border-purple-100 mb-6">
            <Sparkles size={14} className="text-[#7C3AED]" />
            <span className="text-[12px] font-bold text-[#7C3AED] uppercase tracking-wider">Premium Opportunities</span>
          </div>
          
          <h1 className="font-extrabold text-4xl md:text-5xl text-gray-900 mb-6 leading-[1.2] tracking-tight">
            Find your next <span className="text-[#7C3AED]">career move</span><br />
            with a trusted referral.
          </h1>
          
          <p className="text-gray-500 max-w-2xl mx-auto text-base md:text-lg mb-10 font-medium">
            Skip the ATS. Connect with seniors from your college and top companies 
            who are ready to refer you directly to the hiring manager.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-0 bg-[#7C3AED]/5 rounded-xl blur-xl group-hover:bg-[#7C3AED]/10 transition-all" />
            <div className="relative bg-white border border-gray-200 rounded-lg p-2 flex items-center shadow-sm">
              <div className="pl-4 pr-2 text-gray-400">
                <Search size={20} />
              </div>
              <input 
                type="text" 
                placeholder="Search by role, company or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 py-3 text-black outline-none bg-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-32">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 tracking-tight">
              Latest Openings
              <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                {filteredJobs.length}
              </span>
            </h2>
          </div>
          
          <div className="flex gap-3">
            <div className="relative" ref={filterDropdownRef}>
              <button 
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-bold transition-colors ${
                  hasActiveFilters 
                    ? 'border-purple-300 bg-purple-50 text-purple-700' 
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Filter size={16} />
                Filters
                {hasActiveFilters && (
                  <span className="bg-purple-600 text-white text-xs rounded-full px-1.5 py-0">
                    {[selectedJobType, selectedLocation, selectedSalaryRange, remoteOnly ? 'remote' : null].filter(f => f && f !== 'all').length}
                  </span>
                )}
              </button>
              
              {/* Filter Dropdown */}
              {showFilterDropdown && (
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 bg-white border border-gray-200 rounded-md shadow-md z-50 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-black">Filter Jobs</h3>
                    {hasActiveFilters && (
                      <button 
                        onClick={clearFilters}
                        className="text-xs text-[#7C3AED] hover:text-[#6D28D9] font-medium"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  {/* Job Type Filter */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                    <select 
                      value={selectedJobType}
                      onChange={(e) => setSelectedJobType(e.target.value)}
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#7C3AED]"
                    >
                      <option value="all">All Types</option>
                      {getJobTypes().map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Location Filter */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <select 
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#7C3AED]"
                    >
                      <option value="all">All Locations</option>
                      {getLocations().map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Salary Range Filter */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
                    <select 
                      value={selectedSalaryRange}
                      onChange={(e) => setSelectedSalaryRange(e.target.value)}
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#7C3AED]"
                    >
                      <option value="all">All Salaries</option>
                      <option value="0-5">0-5 LPA</option>
                      <option value="5-10">5-10 LPA</option>
                      <option value="10+">10+ LPA</option>
                    </select>
                  </div>
                  
                  {/* Remote Only Filter */}
                  <div className="mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={remoteOnly}
                        onChange={(e) => setRemoteOnly(e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Remote jobs only</span>
                    </label>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowFilterDropdown(false)}
                      className="flex-1 bg-gray-150 text-gray-750 py-2 rounded-md font-medium text-sm hover:bg-gray-200 transition-colors border border-gray-250"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => setShowFilterDropdown(false)}
                      className="flex-1 bg-[#7C3AED] text-white py-2 rounded-md font-medium text-sm hover:bg-[#6D28D9] transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setRemoteOnly(!remoteOnly)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-bold transition-colors ${
                remoteOnly 
                  ? 'border-purple-300 bg-purple-50 text-purple-700' 
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Globe size={16} />
              Remote First
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-gray-50 rounded-md border border-gray-200 animate-pulse" />
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => {
              const date = new Date(job.created_at)
              const timeAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
              const isOwnCollege = user?.college_id === job.senior.college_id

              return (
                <div 
                  key={job.id}
                  className="group bg-white border border-gray-200 rounded-md p-6 hover:border-purple-300 hover:shadow-md transition-all duration-200 relative overflow-hidden flex flex-col justify-between h-full shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                >
                  <div>
                    {/* Company/Role Info */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-12 h-12 bg-gray-50 rounded-md flex items-center justify-center border border-gray-200 text-base font-bold text-gray-500 group-hover:bg-purple-50 group-hover:border-purple-200 transition-colors flex-shrink-0">
                        {job.company_name[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-purple-700 uppercase tracking-wider bg-purple-50 px-2.5 py-1 rounded-md mb-2 border border-purple-100">
                          {job.job_type}
                        </span>
                        <span className="text-[11px] font-bold text-gray-400">
                          {timeAgo === 0 ? 'Today' : `${timeAgo}d ago`}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-[#7C3AED] transition-colors leading-snug tracking-tight">
                      {job.role}
                    </h3>
                    <p className="text-xs font-semibold text-gray-500 mb-4">{job.company_name}</p>

                    <div className="space-y-2.5 mb-6">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin size={14} className="text-gray-400" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="text-gray-400 font-bold text-xs">₹</span>
                        {job.salary_range}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users size={14} className="text-gray-400" />
                        Posted by {job.senior.full_name}
                      </div>
                    </div>
                  </div>

                  {/* College/Community context */}
                  <div className="pt-4 border-t border-gray-150 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-sm bg-purple-100 flex items-center justify-center text-[10px] font-bold text-purple-600 flex-shrink-0">
                        {job.community.colleges.short_name[0]}
                      </div>
                      <span className="text-[12px] font-bold text-gray-600 truncate">
                        {job.community.colleges.short_name}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button 
                        onClick={() => {
                          const jobLink = job.description || '#'
                          window.open(jobLink, '_blank')
                        }}
                        className="flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-bold border border-green-600 text-green-700 hover:bg-green-50 transition-all bg-transparent"
                      >
                        <ArrowRight size={14} />
                        {user?.id === job.senior.id ? 'View Job' : 'Apply'}
                      </button>
                      
                      <button 
                        onClick={() => job.referral_available && handleReferralClick(job)}
                        disabled={!job.referral_available}
                        className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-bold transition-all relative ${
                          !job.referral_available
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-205'
                            : isOwnCollege 
                              ? 'bg-[#7C3AED] text-white hover:bg-[#6D28D9]' 
                              : 'bg-gray-900 text-white hover:bg-black'
                        }`}
                        title={!job.referral_available ? 'Referral not available for this job' : ''}
                      >
                        {job.referral_available ? (
                          isOwnCollege ? <Zap size={14} /> : ((user as any)?.is_premium || (user as any)?.premium_plan === 'premium' ? <Sparkles size={14} /> : <Lock size={14} />)
                        ) : (
                          <Lock size={14} />
                        )}
                        Get Referral
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-md">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <Briefcase size={24} className="text-gray-300" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">No jobs matched your search</h3>
            <p className="text-gray-500 text-sm">Try using different keywords or clearing filters</p>
          </div>
        )}
      </div>

      {/* Referral Confirmation Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setSelectedJob(null)}
          />
          <div className="relative bg-white w-full max-w-md rounded-md p-8 shadow-xl animate-in zoom-in-95 duration-200 border border-gray-200">
            {referralSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-black mb-2">Request Sent!</h3>
                <p className="text-gray-500 text-sm">
                  {selectedJob.senior.full_name.split(' ')[0]} has been notified. 
                  You'll hear back soon!
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-50 rounded-md flex items-center justify-center text-purple-600 border border-purple-100 flex-shrink-0">
                    <Users size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-gray-900 leading-tight truncate">Request Referral</h3>
                    <p className="text-xs text-gray-500 truncate">to {selectedJob.company_name}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-md p-4 mb-6 border border-gray-150">
                  <p className="text-sm text-gray-650 leading-relaxed italic">
                    "Hi {selectedJob.senior.full_name.split(' ')[0]}, I'm interested in the <strong>{selectedJob.role}</strong> position at <strong>{selectedJob.company_name}</strong>. Could you please refer me?"
                  </p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedJob(null)}
                    disabled={referring}
                    className="flex-1 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-md transition-colors border border-gray-200"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmReferral}
                    disabled={referring}
                    className="flex-1 bg-[#7C3AED] text-white py-2.5 rounded-md font-bold text-sm hover:bg-[#6D28D9] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {referring ? 'Sending...' : 'Confirm Request'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Premium Upgrade Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md" 
            onClick={() => setShowPremiumModal(false)}
          />
          <div className="relative bg-white w-full max-w-lg rounded-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-gray-200">
            {/* Modal Header/Banner */}
            <div className="bg-gradient-to-br from-[#1F1F2E] to-[#0F0F1A] p-10 text-center relative border-b border-gray-800">
              <div className="absolute top-4 right-4 text-white/5">
                <Globe size={120} />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20 mb-6">
                  <Sparkles size={14} className="text-cyan-400" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Premium Feature</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Unlock Global Network</h3>
                <p className="text-white/60 text-sm max-w-[280px] mx-auto leading-relaxed">
                  Get referrals from seniors across all colleges in the Claspire network.
                </p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-10">
              <div className="space-y-4 mb-8">
                {[
                  'Unlimited referrals from 10,000+ seniors',
                  'Direct messaging with verified experts',
                  'Access to exclusive premium job pool',
                  'Advanced profile boost for recruiters'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-50 rounded-full flex items-center justify-center border border-green-100 flex-shrink-0">
                      <CheckCircle size={12} className="text-green-500" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <Link href="/pricing" className="no-underline">
                  <button className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-3.5 rounded-md font-bold text-sm transition-all flex items-center justify-center gap-2 group border-none">
                    Upgrade to Premium
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <button 
                  onClick={() => setShowPremiumModal(false)}
                  className="w-full py-2.5 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors border border-transparent"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
