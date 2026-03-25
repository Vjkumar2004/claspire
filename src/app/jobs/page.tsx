'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Navbar from '@/components/Navbar'
import { 
  Briefcase, MapPin, Building2, Search, 
  ChevronRight, Filter, Globe, Sparkles,
  Zap, ArrowRight, Lock, CheckCircle2,
  Calendar, Users
} from 'lucide-react'
import Link from 'next/link'

interface Job {
  id: string
  company_name: string
  role: string
  salary_range: string
  location: string
  job_type: string
  description: string
  requirements: string
  deadline: string
  referral_available: boolean
  created_at: string
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
    <div className="min-h-screen bg-[#FDFDFF]">
      <Navbar />

      {/* Hero Section */}
      <div className="relative pt-28 pb-20 overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-100/40 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-50/40 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-full border border-purple-100 mb-6">
            <Sparkles size={14} className="text-purple-600" />
            <span className="text-[12px] font-bold text-purple-600 uppercase tracking-wider">Premium Opportunities</span>
          </div>
          
          <h1 className="font-instrument-serif text-5xl md:text-6xl text-black mb-6 leading-[1.1]">
            Find your next <em className="text-purple-600">career move</em><br />
            with a trusted referral.
          </h1>
          
          <p className="text-gray-500 max-w-2xl mx-auto text-lg mb-10">
            Skip the ATS. Connect with seniors from your college and top companies 
            who are ready to refer you directly to the hiring manager.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-0 bg-purple-600/5 rounded-2xl blur-xl group-hover:bg-purple-600/10 transition-all" />
            <div className="relative bg-white border border-gray-200 rounded-2xl p-2 flex items-center shadow-sm">
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
            <h2 className="text-xl font-bold text-black flex items-center gap-2">
              Latest Openings
              <span className="text-sm font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {filteredJobs.length}
              </span>
            </h2>
          </div>
          
          <div className="flex gap-3">
            <div className="relative" ref={filterDropdownRef}>
              <button 
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold transition-colors ${
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
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-black">Filter Jobs</h3>
                    {hasActiveFilters && (
                      <button 
                        onClick={clearFilters}
                        className="text-xs text-purple-600 hover:text-purple-700 font-medium"
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
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-600"
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
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-600"
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
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-600"
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
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium text-sm hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => setShowFilterDropdown(false)}
                      className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setRemoteOnly(!remoteOnly)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold transition-colors ${
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
              <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
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
                  className="group bg-white border border-gray-100 rounded-3xl p-6 hover:border-purple-200 hover:shadow-[0_20px_40px_-12px_rgba(124,58,237,0.08)] transition-all duration-300 relative overflow-hidden"
                >
                  {/* Company/Role Info */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 text-xl group-hover:bg-purple-50 group-hover:border-purple-100 transition-colors">
                      {job.company_name[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[11px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 px-2 py-1 rounded-md mb-2">
                        {job.job_type}
                      </span>
                      <span className="text-[11px] font-bold text-gray-400">
                        {timeAgo === 0 ? 'Today' : `${timeAgo}d ago`}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-black mb-1 group-hover:text-purple-600 transition-colors leading-tight">
                    {job.role}
                  </h3>
                  <p className="text-sm font-bold text-gray-500 mb-4">{job.company_name}</p>

                  <div className="space-y-2.5 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin size={14} className="text-gray-400" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="text-gray-400 font-bold">₹</span>
                      {job.salary_range}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users size={14} className="text-gray-400" />
                      Posted by {job.senior.full_name}
                    </div>
                  </div>

                  {/* College/Community context */}
                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center text-[10px] font-bold text-purple-600">
                        {job.community.colleges.short_name[0]}
                      </div>
                      <span className="text-[12px] font-bold text-gray-600">
                        {job.community.colleges.short_name}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          // Use description field as the job application link
                          const jobLink = job.description || '#'
                          if (user?.id === job.senior.id) {
                            // Senior who posted the job - redirect to job link
                            window.open(jobLink, '_blank')
                          } else {
                            // Regular user - apply to job
                            window.open(jobLink, '_blank')
                          }
                        }}
                        className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-[12px] font-bold bg-green-600 text-white hover:bg-green-700 transition-all"
                      >
                        <ArrowRight size={14} />
                        {user?.id === job.senior.id ? 'View Job' : 'Apply'}
                      </button>
                      
                      <button 
                        onClick={() => job.referral_available && handleReferralClick(job)}
                        disabled={!job.referral_available}
                        className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-[12px] font-bold transition-all relative ${
                          !job.referral_available
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : isOwnCollege 
                              ? 'bg-purple-600 text-white hover:opacity-90' 
                              : 'bg-black text-white hover:bg-gray-800'
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

                  {/* Hover Accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-3xl">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase size={24} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-black mb-2">No jobs matched your search</h3>
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
          <div className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            {referralSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-500" />
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
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-xl">
                    🤝
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black leading-tight">Request Referral</h3>
                    <p className="text-sm text-gray-500">to {selectedJob.company_name}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <p className="text-sm text-gray-600 leading-relaxed italic">
                    "Hi {selectedJob.senior.full_name.split(' ')[0]}, I'm interested in the <strong>{selectedJob.role}</strong> position at <strong>{selectedJob.company_name}</strong>. Could you please refer me?"
                  </p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedJob(null)}
                    disabled={referring}
                    className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmReferral}
                    disabled={referring}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
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
          <div className="relative bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header/Banner */}
            <div className="bg-gradient-to-br from-[#1A1A1A] to-[#333333] p-10 text-center relative">
              <div className="absolute top-4 right-4 text-white/20">
                <Globe size={120} />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20 mb-6">
                  <Sparkles size={14} className="text-cyan-400" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Premium Feature</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Unlock Global Network</h3>
                <p className="text-white/60 text-sm max-w-[280px] mx-auto">
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
                    <div className="w-5 h-5 bg-green-50 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={12} className="text-green-500" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <Link href="/pricing" className="no-underline">
                  <button className="w-full bg-black text-white py-4 rounded-2xl font-bold text-sm hover:bg-gray-900 transition-all flex items-center justify-center gap-2 group">
                    Upgrade to Premium
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <button 
                  onClick={() => setShowPremiumModal(false)}
                  className="w-full py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
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
