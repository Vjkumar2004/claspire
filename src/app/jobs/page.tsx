'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Briefcase, MapPin, Search, Building2, Eye,
  ArrowRight, Zap, Lock, CheckCircle, Clock, Sparkles,
  ExternalLink, ChevronDown, Loader2,
  DollarSign, UserCheck, Globe, Filter, Award
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface JobSenior {
  id: string
  full_name: string
  company: string
  designation: string
  college_id: string
  avatar_url?: string
  is_verified?: boolean
}

interface JobCommunityCollege {
  name: string
  short_name: string
  location: string
}

interface JobCommunity {
  display_name: string
  slug: string
  colleges: JobCommunityCollege
}

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
  skills: string[]
  referral_count: number
  senior: JobSenior
  community: JobCommunity
}

interface Stats {
  totalJobs: number
  totalReferrals: number
  totalCompanies: number
  totalApplications: number
}

interface TopReferrer {
  id: string
  full_name: string
  company: string
  designation: string
  avatar_url?: string
  referral_count: number
}

const avatarGradients = [
  'from-[#F4A01C] to-[#4F46E5]',
  'from-[#E09410] to-[#4338CA]',
  'from-[#F4A01C] to-[#F4A01C]',
  'from-white/30 to-white/10',
  'from-[#F4A01C] to-[#E09410]',
  'from-[#9333EA] to-[#F4A01C]',
]

const jobTypeLabels: Record<string, string> = {
  internship: 'Internship',
  'full-time': 'Full Time',
  'part-time': 'Part Time',
  remote: 'Remote',
  contract: 'Contract',
}

export default function JobsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('most_recent')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [activeJobTypes, setActiveJobTypes] = useState<Set<string>>(new Set())
  const [remoteFilter, setRemoteFilter] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  const [referring, setReferring] = useState(false)
  const [referralSuccess, setReferralSuccess] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([])
  const [howOpen, setHowOpen] = useState(false)
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const sortRef = useRef<HTMLDivElement>(null)
  const moreFiltersRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortDropdown(false)
      if (moreFiltersRef.current && !moreFiltersRef.current.contains(e.target as Node)) setShowMoreFilters(false)
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
        setJobs(data.jobs || [])
        setStats(data.stats || null)
        setTopReferrers(data.topReferrers || [])
      }
    } catch (err) {
      console.error('Error fetching jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleJobType = (type: string) => {
    const next = new Set(activeJobTypes)
    if (next.has(type)) next.delete(type)
    else next.add(type)
    setActiveJobTypes(next)
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchQuery ||
      job.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = activeJobTypes.size === 0 ||
      activeJobTypes.has(job.job_type.toLowerCase())

    const matchesRemote = !remoteFilter ||
      job.location.toLowerCase().includes('remote') ||
      job.job_type.toLowerCase().includes('remote')

    return matchesSearch && matchesType && matchesRemote
  })

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'most_recent') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sortBy === 'salary_high') {
      const aNum = parseInt(a.salary_range.replace(/[^0-9]/g, '')) || 0
      const bNum = parseInt(b.salary_range.replace(/[^0-9]/g, '')) || 0
      return bNum - aNum
    }
    if (sortBy === 'most_referrals') return b.referral_count - a.referral_count
    return 0
  })

  const handleReferralClick = (job: Job) => {
    if (!user) { router.push('/login'); return }
    setSelectedJob(job)
  }

  const confirmReferral = async () => {
    if (!selectedJob || !user) return
    setReferring(true)
    try {
      const res = await fetch('/api/jobs/request-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: selectedJob.id, seniorId: selectedJob.senior.id })
      })
      if (res.ok) {
        setReferralSuccess(true)
        setJobs(prev => prev.map(j =>
          j.id === selectedJob.id ? { ...j, referral_count: j.referral_count + 1 } : j
        ))
        setTimeout(() => { setReferralSuccess(false); setSelectedJob(null) }, 2000)
      }
    } catch (err) {
      console.error('Referral error:', err)
    } finally {
      setReferring(false)
    }
  }

  const timeAgo = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return '1d ago'
    return `${days}d ago`
  }

  const hasActiveFilters = activeJobTypes.size > 0 || remoteFilter

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#1D2226]">
      {/* ─── MOBILE LAYOUT (lg:hidden) ─── */}
      <div className="lg:hidden min-h-screen bg-surface dark:bg-[#1D2226] pb-20">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-surface/90 dark:bg-[#1D2226]/90 backdrop-blur-lg border-b border-surface dark:border-[#38434F]">
          <div className="flex items-start justify-between px-4 py-3 gap-3">
            <div className="min-w-0 flex-1">
<h1 className="text-[17px] font-extrabold text-[#0F172A] dark:text-white tracking-tight leading-tight m-0">
                Get Referred &{' '}
                <span className="bg-gradient-to-r from-[#F4A01C] to-[#A78BFA] bg-clip-text text-transparent">Get Hired</span>
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-[#B0B7BE] font-medium mt-0.5 m-0">
                {stats?.totalJobs || 0} open job{stats?.totalJobs !== 1 ? 's' : ''} &bull; {stats?.totalReferrals || 0} referral{stats?.totalReferrals !== 1 ? 's' : ''} available
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 pt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-slate-200 dark:ring-[#38434F]" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#F4A01C] to-[#4F46E5] flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-slate-200 dark:ring-[#38434F]">
                  {user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="sticky top-14 z-30 bg-surface dark:bg-[#1D2226] border-b border-surface dark:border-[#38434F] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#B0B7BE]" />
              <input
                type="text"
                placeholder="Search jobs, skills, roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-surface dark:border-[#38434F] bg-[#F8FAFC] dark:bg-[#1D2226] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#B0B7BE] dark:text-[#B0B7BE] outline-none focus:border-[#F4A01C] focus:ring-1 focus:ring-[#F4A01C]/20 transition-all"
              />
            </div>
            <button
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className="h-10 w-10 rounded-xl bg-[#F8FAFC] dark:bg-[#1D2226] border border-surface dark:border-[#38434F] flex items-center justify-center cursor-pointer hover:bg-surface-hover dark:hover:bg-[#1D2226] dark:bg-[#283036] transition-all shrink-0"
            >
              <Filter size={15} className="text-[#F4A01C]" />
            </button>
          </div>
          {/* Mobile filter dropdown */}
          {showMoreFilters && (
            <div className="mt-2 bg-surface dark:bg-[#1D2226] rounded-xl border border-surface dark:border-[#38434F] shadow-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-[#0F172A] dark:text-white m-0">Filters</h4>
                <button
                  onClick={() => { setActiveJobTypes(new Set()); setRemoteFilter(false); setShowMoreFilters(false) }}
                  className="text-[10px] text-[#F4A01C] font-semibold cursor-pointer bg-transparent border-none hover:text-[#E09410]"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 dark:text-[#B0B7BE] uppercase tracking-wider mb-2 m-0">Job Type</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(jobTypeLabels).map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() => toggleJobType(value)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-all cursor-pointer ${
                          activeJobTypes.has(value)
                            ? 'bg-[#F4A01C]/5 border-[#F4A01C]/20 text-[#F4A01C]'
                            : 'bg-surface dark:bg-[#1D2226] border-surface dark:border-[#38434F] text-slate-500 dark:text-[#B0B7BE] hover:border-slate-300 dark:border-[#38434F] dark:hover:border-[#38434F]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 dark:text-[#B0B7BE] uppercase tracking-wider mb-2 m-0">Location</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="filter-remote-mobile"
                      checked={remoteFilter}
                      onChange={(e) => setRemoteFilter(e.target.checked)}
                      className="rounded border-slate-300 dark:border-[#38434F] text-[#F4A01C] focus:ring-[#F4A01C]/30 w-3.5 h-3.5"
                    />
                    <label htmlFor="filter-remote-mobile" className="text-xs font-medium text-slate-600 dark:text-[#B0B7BE] cursor-pointer">Remote Only</label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filter Chips */}
        <div className="overflow-x-auto scrollbar-hide border-b border-slate-50 dark:border-[#38434F] px-4 py-2.5">
          <div className="flex items-center gap-2 min-w-max">
            <button
              onClick={() => setRemoteFilter(!remoteFilter)}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                remoteFilter
                  ? 'bg-[#F4A01C] border-[#F4A01C] text-white'
                  : 'bg-surface dark:bg-[#1D2226] border-surface dark:border-[#38434F] text-slate-500 dark:text-[#B0B7BE] hover:border-slate-300 dark:border-[#38434F] dark:hover:border-[#38434F]'
              }`}
            >
              <Globe size={11} className="inline mr-1 -mt-0.5" /> Remote
            </button>
            {['internship', 'full-time', 'part-time'].map((type) => (
              <button
                key={type}
                onClick={() => toggleJobType(type)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                  activeJobTypes.has(type)
                    ? 'bg-[#F4A01C] border-[#F4A01C] text-white'
                    : 'bg-surface dark:bg-[#1D2226] border-surface dark:border-[#38434F] text-slate-500 dark:text-[#B0B7BE] hover:border-slate-300 dark:border-[#38434F] dark:hover:border-[#38434F]'
                }`}
              >
                {jobTypeLabels[type] || type}
              </button>
            ))}
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <button
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className="px-3.5 py-1.5 rounded-full text-[11px] font-semibold border border-surface dark:border-[#38434F] text-slate-500 dark:text-[#B0B7BE] hover:border-slate-300 dark:border-[#38434F] dark:hover:border-[#38434F] bg-surface dark:bg-[#1D2226] hover:bg-app dark:hover:bg-[#1D2226] dark:bg-[#283036] transition-all cursor-pointer whitespace-nowrap flex items-center gap-1"
            >
              <Filter size={11} /> Filters
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 px-4 py-3">
          {[
            { label: 'Open Jobs', value: stats?.totalJobs || 0, icon: Briefcase },
            { label: 'Referrals', value: stats?.totalReferrals || 0, icon: UserCheck },
            { label: 'Companies', value: stats?.totalCompanies || 0, icon: Building2 },
            { label: 'Applications', value: stats?.totalApplications || 0, icon: Eye },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface dark:bg-[#1D2226] rounded-xl border border-surface dark:border-[#38434F] p-2.5 text-center shadow-sm">
              <div className="w-7 h-7 rounded-lg bg-[#F4A01C]/5 flex items-center justify-center mx-auto mb-1">
                <stat.icon size={13} className="text-[#F4A01C]" />
              </div>
              <p className="text-base font-extrabold text-[#0F172A] dark:text-white m-0 leading-none">
                {stat.value.toLocaleString()}
              </p>
              <p className="text-[8px] font-medium text-slate-400 dark:text-[#B0B7BE] m-0 mt-0.5 truncate">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="text-[#F4A01C] animate-spin" />
          </div>
        ) : (
          <>
            {/* Latest Jobs Section */}
            <div className="px-4 pt-1 pb-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-[#0F172A] dark:text-white m-0">Latest Jobs</h2>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-[#B0B7BE] bg-slate-100 dark:bg-[#283036] px-2 py-0.5 rounded-full">
                    {sortedJobs.length}
                  </span>
                </div>
                <div className="relative" ref={sortRef}>
                  <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-surface dark:border-[#38434F] text-[10px] font-semibold text-slate-500 dark:text-[#B0B7BE] bg-surface dark:bg-[#1D2226] hover:border-slate-300 dark:border-[#38434F] dark:hover:border-[#38434F] transition-all cursor-pointer"
                  >
                    {sortBy === 'most_recent' ? 'Most Recent' : sortBy === 'salary_high' ? 'Highest Salary' : 'Most Referrals'}
                    <ChevronDown size={11} />
                  </button>
                  {showSortDropdown && (
                    <div className="absolute top-full mt-1 right-0 w-36 bg-surface dark:bg-[#1D2226] rounded-xl border border-surface dark:border-[#38434F] shadow-lg py-1 z-20">
                      {[
                        { value: 'most_recent', label: 'Most Recent' },
                        { value: 'salary_high', label: 'Highest Salary' },
                        { value: 'most_referrals', label: 'Most Referrals' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setSortBy(opt.value); setShowSortDropdown(false) }}
                          className={`w-full text-left px-3 py-2 text-[10px] font-semibold transition-colors cursor-pointer border-none ${
                            sortBy === opt.value ? 'text-[#F4A01C] bg-[#F4A01C]/5' : 'text-slate-500 dark:text-[#B0B7BE] hover:bg-app dark:hover:bg-[#1D2226] dark:bg-[#283036]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {sortedJobs.length > 0 ? (
                <div className="space-y-3">
                  {sortedJobs.map((job, index) => {
                    const isOwnJob = user?.id === job.senior.id
                    const canRefer = true

                    return (
                      <div
                        key={job.id}
                        className="bg-surface dark:bg-[#1D2226] rounded-2xl border border-surface dark:border-[#38434F]/80 p-4 shadow-sm"
                      >
                        {/* Top: Avatar + Title + Company */}
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarGradients[index % avatarGradients.length]} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                            {job.company_name[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-[#0F172A] dark:text-white m-0 leading-snug">{job.role}</h3>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-[#B0B7BE] mt-0.5 m-0">{job.company_name}</p>
                          </div>
                          {/* Referral badge */}
                          {job.referral_available ? (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200/60 shrink-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="text-[10px] font-bold text-emerald-700">{job.referral_count}</span>
                            </div>
                          ) : (
                            <span className="text-[9px] font-medium text-slate-300 dark:text-[#B0B7BE] shrink-0">Unavailable</span>
                          )}
                        </div>

                        {/* Middle: Location, Salary, Date, Type */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2.5 text-[10px] text-slate-400 dark:text-[#B0B7BE]">
                          <span className="inline-flex items-center gap-1 bg-app dark:bg-[#283036] px-2 py-0.5 rounded-md"><MapPin size={10} /> {job.location}</span>
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md"><DollarSign size={10} /> {job.salary_range}</span>
                          <span className="inline-flex items-center gap-1"><Clock size={10} /> {timeAgo(job.created_at)}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#283036] text-slate-500 dark:text-[#B0B7BE] text-[9px] font-semibold">
                            {jobTypeLabels[job.job_type.toLowerCase()] || job.job_type}
                          </span>
                        </div>

                        {/* Skills */}
                        {job.skills && job.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2.5">
                            {job.skills.slice(0, 3).map((skill) => (
                              <span key={skill} className="px-2 py-0.5 rounded-full bg-[#F8FAFC] dark:bg-[#1D2226] border border-surface dark:border-[#38434F] text-slate-500 dark:text-[#B0B7BE] text-[9px] font-medium">
                                {skill}
                              </span>
                            ))}
                            {job.skills.length > 3 && (
                              <span className="px-2 py-0.5 text-[9px] font-medium text-slate-400 dark:text-[#B0B7BE]">+{job.skills.length - 3}</span>
                            )}
                          </div>
                        )}

                        {/* Referrer Section */}
                        <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-surface dark:border-[#38434F]">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ring-2 ring-white dark:ring-[#38434F] ${
                            job.senior.avatar_url ? '' : 'bg-gradient-to-br from-[#F4A01C] to-[#4F46E5]'
                          }`}>
                            {job.senior.avatar_url ? (
                              <img src={job.senior.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              getInitials(job.senior.full_name || '')
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-slate-800 dark:text-white m-0 truncate">{job.senior.full_name}</p>
                              {(job.senior as any).is_verified && (
                                <CheckCircle size={11} className="text-emerald-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-[10px] font-medium text-slate-400 dark:text-[#B0B7BE] m-0 truncate">
                              {job.senior.designation} &middot; {job.community?.colleges?.name || job.community?.display_name || ''}
                            </p>
                          </div>
                        </div>

                        {/* Bottom: Action Buttons */}
                        <div className="flex items-center gap-2 mt-3">
                          {job.description && job.description.startsWith('http') && (
                            <a
                              href={job.description}
                              onClick={(e) => {
                                if (!user) {
                                  e.preventDefault()
                                  router.push('/login')
                                }
                              }}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-surface dark:border-[#38434F] text-slate-600 dark:text-[#B0B7BE] text-xs font-semibold no-underline hover:bg-app dark:hover:bg-[#1D2226] dark:bg-[#283036] hover:border-slate-300 dark:border-[#38434F] dark:hover:border-[#38434F] transition-all"
                            >
                              <ExternalLink size={13} /> View Job
                            </a>
                          )}
                          {!isOwnJob && (
                            <button
                              onClick={() => handleReferralClick(job)}
                              disabled={!job.referral_available}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border-none cursor-pointer transition-all ${
                                !job.referral_available
                                  ? 'bg-slate-100 dark:bg-[#283036] text-slate-400 dark:text-[#B0B7BE] cursor-not-allowed'
                                  : canRefer
                                    ? 'bg-gradient-to-r from-[#F4A01C] to-[#E09410] text-white shadow-sm'
                                    : 'bg-[#0F172A] text-white'
                              }`}
                            >
                              {!job.referral_available ? (
                                <Lock size={13} />
                              ) : canRefer ? (
                                <Zap size={13} />
                              ) : (
                                <Lock size={13} />
                              )}
                              {canRefer ? 'Request Referral' : 'Unlock Referral'}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-surface dark:bg-[#1D2226] rounded-2xl border border-dashed border-surface dark:border-[#38434F]">
                  <Search size={24} className="text-slate-300 dark:text-[#B0B7BE] mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-700 dark:text-white m-0">No jobs match your filters</h3>
                  <p className="text-xs text-slate-400 dark:text-[#B0B7BE] mt-1 mb-4 m-0">Try different keywords or browse available jobs</p>
                  {hasActiveFilters && (
                    <button
                      onClick={() => { setActiveJobTypes(new Set()); setRemoteFilter(false); setSearchQuery('') }}
                      className="px-4 py-2 rounded-lg bg-[#F4A01C]/5 text-[#F4A01C] text-xs font-semibold border border-[#F4A01C]/20 cursor-pointer hover:bg-[#F4A01C]/10 transition-all"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Referral Benefit */}
            <div className="px-4 py-2">
              <div className="bg-gradient-to-r from-[#F4A01C]/5 via-[#F4A01C]/[0.02] to-transparent rounded-2xl border border-[#F4A01C]/10 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F4A01C]/10 flex items-center justify-center shrink-0">
                    <Zap size={15} className="text-[#F4A01C]" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-700 dark:text-white m-0 leading-relaxed">
                      <span className="font-bold text-[#F4A01C]">Referrals</span> are <span className="font-bold">5x more likely</span> to land interviews than cold applications.
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-[#B0B7BE] mt-1 m-0">Every job here comes with a direct connection to a verified senior.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Referrers */}
            <div className="px-4 py-2">
              <h3 className="text-xs font-bold text-[#0F172A] dark:text-white mb-3 m-0">Top Referrers</h3>
              {topReferrers.length > 0 ? (
                <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                  <div className="flex gap-3 min-w-max pb-1">
                    {topReferrers.map((referrer) => (
                      <div key={referrer.id} className="bg-surface dark:bg-[#1D2226] rounded-2xl border border-surface dark:border-[#38434F] p-3.5 w-[130px] shadow-sm text-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold mx-auto mb-2 ${
                          referrer.avatar_url ? '' : 'bg-gradient-to-br from-[#F4A01C] to-[#4F46E5]'
                        }`}>
                          {referrer.avatar_url ? (
                            <img src={referrer.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            getInitials(referrer.full_name || '')
                          )}
                        </div>
                        <p className="text-[11px] font-semibold text-slate-700 dark:text-white m-0 truncate">{referrer.full_name}</p>
                        <p className="text-[9px] font-medium text-slate-400 dark:text-[#B0B7BE] m-0 truncate">{referrer.designation}</p>
                        <div className="mt-1.5 inline-flex items-center gap-1 bg-emerald-50 rounded-lg px-2 py-0.5 border border-emerald-200/60">
                          <span className="text-xs font-extrabold text-emerald-700">{referrer.referral_count}</span>
                          <span className="text-[8px] font-medium text-emerald-500">referrals</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-surface dark:bg-[#1D2226] rounded-2xl border border-surface dark:border-[#38434F] p-4 text-center shadow-sm">
                  <Award size={22} className="text-slate-300 dark:text-[#B0B7BE] mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-[#B0B7BE] m-0">Be the first to get referred!</p>
                  <p className="text-[10px] text-slate-400 dark:text-[#B0B7BE] mt-1 m-0">Request a referral from any job below.</p>
                </div>
              )}
            </div>

            {/* Job Alerts */}
            <div className="px-4 py-2">
              <div className="bg-surface dark:bg-[#1D2226] rounded-2xl border border-surface dark:border-[#38434F] p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F4A01C]/5 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F4A01C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-[#0F172A] dark:text-white m-0">Job Alerts</h3>
                    <p className="text-[10px] text-slate-500 dark:text-[#B0B7BE] mt-0.5 mb-2 m-0 leading-relaxed">
                      Get notified when jobs matching your skills are posted.
                    </p>
                    <button className="w-full py-2 rounded-xl bg-[#F4A01C] text-white text-[11px] font-semibold border-none cursor-pointer hover:bg-[#E09410] transition-all flex items-center justify-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> Create Job Alert
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* How Referrals Work (Accordion) */}
            <div className="px-4 py-2">
              <div className="bg-surface dark:bg-[#1D2226] rounded-2xl border border-surface dark:border-[#38434F] shadow-sm overflow-hidden">
                <button
                  onClick={() => setHowOpen(!howOpen)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-transparent border-none cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#F4A01C]/5 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F4A01C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                    </div>
                    <span className="text-xs font-bold text-[#0F172A] dark:text-white">How Referrals Work</span>
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 dark:text-[#B0B7BE] transition-transform duration-200 ${howOpen ? 'rotate-180' : ''}`} />
                </button>
                {howOpen && (
                  <div className="px-4 pb-4 space-y-2.5">
                    {[
                      { step: '1', text: 'Find a job that matches your skills' },
                      { step: '2', text: 'Request a referral from a verified senior' },
                      { step: '3', text: 'Get referred directly to the hiring team' },
                      { step: '4', text: 'Connect and land your dream role' },
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-[#F4A01C]/5 border border-[#F4A01C]/10 flex items-center justify-center text-[9px] font-bold text-[#F4A01C] shrink-0 mt-0.5">
                          {item.step}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-[#B0B7BE] m-0 leading-snug">{item.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── HERO ─── */}
      <section className="hidden lg:block relative bg-slate-900 border-b border-surface dark:border-[#38434F]/60 overflow-hidden">
        {/* Full background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/jobs-banner.png)' }}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-900/70 to-slate-900/60" />

        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-6 z-10">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Text + Search */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface/10 border border-white/15">
                <Sparkles size={11} className="text-white/60" />
                <span className="text-[9px] font-bold text-white/60 uppercase tracking-[0.12em]">Opportunities</span>
              </div>
              </div>

              <h1 className="text-[28px] md:text-[34px] font-extrabold text-white leading-[1.15] tracking-tight mb-2 m-0">
                Get referred & get hired.
              </h1>

              <p className="text-sm text-white/70 leading-relaxed mb-4 m-0 max-w-xl">
                Skip the ATS queue. Connect with verified seniors who can refer you directly to the hiring team.
              </p>

              {/* Search + CTA row */}
              <div className="flex items-center gap-2 max-w-lg">
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#B0B7BE]" />
                  <input
                    type="text"
                    placeholder="Search jobs, skills, roles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-white/10 bg-surface/10 text-xs text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all "
                  />
                </div>
                <button className="h-9 px-4 rounded-lg bg-surface/20 text-white text-xs font-bold border-none cursor-pointer hover:bg-surface/30 transition-colors whitespace-nowrap flex items-center gap-1.5">
                  <Search size={13} /> Search
                </button>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                <button
                  onClick={() => setRemoteFilter(!remoteFilter)}
                  className={`px-3 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer ${
                    remoteFilter
                      ? 'bg-surface/20 border-white/30 text-white'
                      : 'bg-surface/10 border-white/15 text-white/70 hover:bg-surface/20'
                  }`}
                >
                  <Globe size={10} className="inline mr-1 -mt-0.5" /> Remote
                </button>
                {['internship', 'full-time', 'part-time'].map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleJobType(type)}
                    className={`px-3 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer ${
                      activeJobTypes.has(type)
                        ? 'bg-surface/20 border-white/30 text-white'
                        : 'bg-surface/10 border-white/15 text-white/70 hover:bg-surface/20'
                    }`}
                  >
                    {jobTypeLabels[type] || type}
                  </button>
                ))}
                <div className="relative" ref={moreFiltersRef}>
                  <button
                    onClick={() => setShowMoreFilters(!showMoreFilters)}
                    className="px-3 py-1 rounded-full text-[10px] font-semibold border border-white/15 text-white/70 hover:bg-surface/20 bg-surface/10 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Filter size={10} /> More
                  </button>
                  {showMoreFilters && (
                    <div className="absolute top-full mt-2 left-0 w-60 bg-slate-800 rounded-xl border border-white/10 shadow-lg p-4 z-20">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-white m-0">Filters</h4>
                        <button
                          onClick={() => { setActiveJobTypes(new Set()); setRemoteFilter(false); setShowMoreFilters(false) }}
                          className="text-[10px] text-white/70 font-semibold cursor-pointer bg-transparent border-none hover:text-white"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider mb-2 m-0">Job Type</p>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(jobTypeLabels).map(([value, label]) => (
                              <button
                                key={value}
                                onClick={() => toggleJobType(value)}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-all cursor-pointer ${
                                  activeJobTypes.has(value)
                                    ? 'bg-surface/20 border-white/30 text-white'
                                    : 'bg-surface/5 border-white/10 text-white/70 hover:bg-surface/10'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider mb-2 m-0">Location</p>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="filter-remote"
                              checked={remoteFilter}
                              onChange={(e) => setRemoteFilter(e.target.checked)}
                              className="rounded border-white/20 text-white focus:ring-white/30 w-3.5 h-3.5 bg-surface/10"
                            />
                            <label htmlFor="filter-remote" className="text-xs font-medium text-white/70 cursor-pointer">Remote Only</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Stats */}
            <div className="flex items-start shrink-0">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Open Jobs', value: stats?.totalJobs || 0, icon: Briefcase, compact: (stats?.totalJobs || 0) < 10 },
                  { label: 'Referrals', value: stats?.totalReferrals || 0, icon: UserCheck, compact: (stats?.totalReferrals || 0) < 10 },
                  { label: 'Companies', value: stats?.totalCompanies || 0, icon: Building2, compact: (stats?.totalCompanies || 0) < 10 },
                  { label: 'Applications', value: stats?.totalApplications || 0, icon: Eye, compact: (stats?.totalApplications || 0) < 10 },
                ].map((stat) => (
                  <div key={stat.label} className="bg-surface/10 rounded-xl border border-white/10 p-3 min-w-[95px]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-5 h-5 rounded-md bg-surface/20 flex items-center justify-center">
                        <stat.icon size={10} className="text-white" />
                      </div>
                    </div>
                    <p className={`font-extrabold text-white m-0 leading-none ${stat.compact ? 'text-base' : 'text-xl'}`}>
                      {stat.value.toLocaleString()}
                    </p>
                    <p className="text-[9px] font-medium text-white/50 m-0 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MAIN CONTENT ─── */}
      <section className="hidden lg:block max-w-7xl mx-auto px-6 py-6 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="text-[#F4A01C] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT: Job Listings */}
            <div className="lg:col-span-8 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-[#0F172A] dark:text-white m-0">Latest Openings</h2>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-[#B0B7BE] bg-slate-100 dark:bg-[#283036] px-2 py-0.5 rounded-full">
                    {sortedJobs.length}
                  </span>
                </div>
                <div className="relative" ref={sortRef}>
                  <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-surface dark:border-[#38434F] text-[11px] font-semibold text-slate-500 dark:text-[#B0B7BE] bg-surface dark:bg-[#1D2226] hover:border-slate-300 dark:border-[#38434F] dark:hover:border-[#38434F] transition-all cursor-pointer"
                  >
                    {sortBy === 'most_recent' ? 'Most Recent' : sortBy === 'salary_high' ? 'Highest Salary' : 'Most Referrals'}
                    <ChevronDown size={12} />
                  </button>
                  {showSortDropdown && (
                    <div className="absolute top-full mt-1 right-0 w-40 bg-surface dark:bg-[#1D2226] rounded-xl border border-surface dark:border-[#38434F] shadow-lg py-1 z-20">
                      {[
                        { value: 'most_recent', label: 'Most Recent' },
                        { value: 'salary_high', label: 'Highest Salary' },
                        { value: 'most_referrals', label: 'Most Referrals' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setSortBy(opt.value); setShowSortDropdown(false) }}
                          className={`w-full text-left px-3.5 py-2 text-[11px] font-semibold transition-colors cursor-pointer border-none ${
                            sortBy === opt.value ? 'text-[#F4A01C] bg-[#F4A01C]/5' : 'text-slate-500 dark:text-[#B0B7BE] hover:bg-app dark:hover:bg-[#1D2226] dark:bg-[#283036]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Job Cards */}
              {sortedJobs.length > 0 ? (
                <div className="space-y-2.5">
                  {sortedJobs.map((job, index) => {
                    const isOwnJob = user?.id === job.senior.id
                    const canRefer = true

                    return (
                      <div
                        key={job.id}
                        className="bg-surface dark:bg-[#1D2226] rounded-2xl border border-surface dark:border-[#38434F]/80 px-5 py-4 hover:shadow-md hover:border-surface dark:border-[#38434F] dark:hover:border-[#38434F] transition-all duration-200"
                      >
                        {/* Row: Avatar | Content | Referral Count */}
                        <div className="flex items-start gap-3.5">
                          {/* Company Avatar */}
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarGradients[index % avatarGradients.length]} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                            {job.company_name[0]?.toUpperCase() || '?'}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Title + Company */}
                            <h3 className="text-base font-bold text-[#0F172A] dark:text-white m-0 leading-snug">{job.role}</h3>
                            <p className="text-xs font-medium text-slate-500 dark:text-[#B0B7BE] mt-0.5 m-0">{job.company_name}</p>

                            {/* Meta row — salary highlighted */}
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5 text-[11px] text-slate-400 dark:text-[#B0B7BE]">
                              <span className="inline-flex items-center gap-1"><MapPin size={11} /> {job.location}</span>
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-600"><DollarSign size={11} /> {job.salary_range}</span>
                              <span className="inline-flex items-center gap-1"><Clock size={11} /> {timeAgo(job.created_at)}</span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#283036] text-slate-500 dark:text-[#B0B7BE] text-[9px] font-semibold">
                                {jobTypeLabels[job.job_type.toLowerCase()] || job.job_type}
                              </span>
                            </div>

                            {/* Skills */}
                            {job.skills && job.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2.5">
                                {job.skills.map((skill) => (
                                  <span key={skill} className="px-2.5 py-0.5 rounded-full bg-[#F8FAFC] dark:bg-[#1D2226] border border-surface dark:border-[#38434F] text-slate-500 dark:text-[#B0B7BE] text-[10px] font-medium">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Right: Referral Availability */}
                          <div className="shrink-0 text-right pt-1">
                            {job.referral_available ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/60">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-[11px] font-bold text-emerald-700">{job.referral_count}</span>
                                <span className="text-[9px] font-medium text-emerald-500">open</span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-300 dark:text-[#B0B7BE]">Referral unavailable</span>
                            )}
                          </div>
                        </div>

                        {/* Bottom: Referrer Section + Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mt-3.5 pt-3 border-t border-surface dark:border-[#38434F]">
                          {/* Referrer — prominent */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-white dark:ring-[#38434F] ${
                              job.senior.avatar_url ? '' : 'bg-gradient-to-br from-[#F4A01C] to-[#4F46E5]'
                            }`}>
                              {job.senior.avatar_url ? (
                                <img src={job.senior.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                getInitials(job.senior.full_name || '')
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold text-slate-800 dark:text-white m-0 truncate">{job.senior.full_name}</p>
                                {(job.senior as any).is_verified && (
                                  <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                    <CheckCircle size={8} /> Verified
                                  </span>
                                )}
                                {!isOwnJob && (
                                  <span className="text-[9px] font-medium text-[#F4A01C] bg-[#F4A01C]/5 px-1.5 py-0.5 rounded">Referrer</span>
                                )}
                              </div>
                              <p className="text-[10px] font-medium text-slate-400 dark:text-[#B0B7BE] m-0 truncate">
                                {job.senior.designation} · {job.community?.colleges?.name || job.community?.display_name || ''}
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {job.description && job.description.startsWith('http') && (
                              <a
                                href={job.description}
                                onClick={(e) => {
                                  if (!user) {
                                    e.preventDefault()
                                    router.push('/login')
                                  }
                                }}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-surface dark:border-[#38434F] text-slate-500 dark:text-[#B0B7BE] text-[11px] font-medium no-underline hover:bg-app dark:hover:bg-[#1D2226] dark:bg-[#283036] hover:border-slate-300 dark:border-[#38434F] dark:hover:border-[#38434F] transition-all"
                              >
                                <ExternalLink size={12} /> View
                              </a>
                            )}
                            {!isOwnJob && (
                              <button
                                onClick={() => handleReferralClick(job)}
                                disabled={!job.referral_available}
                                className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-[11px] font-bold border-none cursor-pointer transition-all ${
                                  !job.referral_available
                                    ? 'bg-slate-100 dark:bg-[#283036] text-slate-400 dark:text-[#B0B7BE] cursor-not-allowed'
                                    : canRefer
                                      ? 'bg-[#F4A01C] text-white hover:bg-[#E09410] shadow-sm'
                                      : 'bg-[#0F172A] text-white hover:bg-slate-800'
                                }`}
                              >
                                {!job.referral_available ? (
                                  <Lock size={12} />
                                ) : canRefer ? (
                                  <Zap size={12} />
                                ) : (
                                  <Lock size={12} />
                                )}
                                {canRefer ? 'Get Referral' : 'Unlock Referral'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-surface dark:bg-[#1D2226] rounded-2xl border border-dashed border-surface dark:border-[#38434F]">
                  <Search size={24} className="text-slate-300 dark:text-[#B0B7BE] mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-700 dark:text-white m-0">No openings match your filters</h3>
                  <p className="text-xs text-slate-400 dark:text-[#B0B7BE] mt-1 mb-4 m-0">Try different keywords or browse available jobs</p>
                  {hasActiveFilters && (
                    <button
                      onClick={() => { setActiveJobTypes(new Set()); setRemoteFilter(false); setSearchQuery('') }}
                      className="px-4 py-2 rounded-lg bg-[#F4A01C]/5 text-[#F4A01C] text-xs font-semibold border border-[#F4A01C]/20 cursor-pointer hover:bg-[#F4A01C]/10 transition-all"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              )}

              {/* Social proof: Why use referrals */}
              <div className="bg-gradient-to-r from-[#F4A01C]/5 via-transparent to-[#10B981]/5 rounded-2xl border border-surface dark:border-[#38434F]/60 p-4">
                <p className="text-[11px] text-slate-600 dark:text-[#B0B7BE] m-0 leading-relaxed text-center">
                  <span className="font-bold text-[#F4A01C]">Referrals</span> are <span className="font-bold">5x more likely</span> to land an interview than cold applications. 
                  Every job here comes with a direct connection to a verified senior.
                </p>
              </div>
            </div>

            {/* RIGHT: Sidebar */}
            <div className="lg:col-span-4 space-y-4">
              {/* Top Referrers — always shows meaningful content */}
              <div className="bg-surface dark:bg-[#1D2226] rounded-2xl border border-surface dark:border-[#38434F]/80 p-4">
                <h3 className="text-xs font-bold text-[#0F172A] dark:text-white mb-3 m-0">Top Referrers</h3>
                {topReferrers.length > 0 ? (
                  <div className="space-y-2.5">
                    {topReferrers.map((referrer) => (
                      <div key={referrer.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${
                            referrer.avatar_url ? '' : 'bg-gradient-to-br from-[#F4A01C] to-[#4F46E5]'
                          }`}>
                            {referrer.avatar_url ? (
                              <img src={referrer.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              getInitials(referrer.full_name || '')
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-700 dark:text-white m-0 truncate">{referrer.full_name}</p>
                            <p className="text-[10px] font-medium text-slate-400 dark:text-[#B0B7BE] m-0 truncate">{referrer.designation}{referrer.company ? ` at ${referrer.company}` : ''}</p>
                          </div>
                        </div>
                        <div className="shrink-0 bg-emerald-50 rounded-lg px-2 py-1 border border-emerald-200/60">
                          <p className="text-xs font-extrabold text-emerald-700 m-0 text-center">{referrer.referral_count}</p>
                          <p className="text-[8px] font-medium text-emerald-500 m-0 leading-none">referrals</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Award size={24} className="text-slate-300 dark:text-[#B0B7BE] mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-[#B0B7BE] m-0">Be the first to get referred!</p>
                    <p className="text-[10px] text-slate-400 dark:text-[#B0B7BE] mt-1 m-0">Request a referral from any job below to start building your network.</p>
                  </div>
                )}
              </div>

              {/* Job Alerts */}
              <div className="bg-surface dark:bg-[#1D2226] rounded-2xl border border-surface dark:border-[#38434F]/80 p-4">
                <h3 className="text-xs font-bold text-[#0F172A] dark:text-white mb-1 m-0">Job Alerts</h3>
                <p className="text-[10px] text-slate-500 dark:text-[#B0B7BE] mb-3 m-0 leading-relaxed">
                  Get notified when new jobs matching your skills are posted.
                </p>
                <button className="w-full py-2 rounded-lg border border-[#F4A01C]/20 text-[#F4A01C] text-xs font-semibold bg-[#F4A01C]/5 hover:bg-[#F4A01C]/10 transition-all cursor-pointer border-none flex items-center justify-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> Create Job Alert
                </button>
              </div>

              {/* How Referrals Work */}
              <div className="bg-surface dark:bg-[#1D2226] rounded-2xl border border-surface dark:border-[#38434F]/80 p-4">
                <h3 className="text-xs font-bold text-[#0F172A] dark:text-white mb-2 m-0">How Referrals Work</h3>
                <div className="space-y-2">
                  {[
                    { step: '1', text: 'Find a job that matches your skills' },
                    { step: '2', text: 'Request a referral from a verified senior' },
                    { step: '3', text: 'Get referred directly to the hiring team' },
                    { step: '4', text: 'Connect and land your dream role' },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#F4A01C]/5 border border-[#F4A01C]/10 flex items-center justify-center text-[9px] font-bold text-[#F4A01C] shrink-0 mt-0.5">
                        {item.step}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-[#B0B7BE] m-0 leading-snug">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ─── REFERRAL CONFIRMATION MODAL ─── */}
      {selectedJob && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !referring && setSelectedJob(null)} />
          <div className="relative bg-surface dark:bg-[#1D2226] w-full max-w-sm rounded-2xl p-6 shadow-xl border border-surface dark:border-[#38434F]">
            {referralSuccess ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                  <CheckCircle size={24} className="text-emerald-500" />
                </div>
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-1 m-0">Request Sent!</h3>
                <p className="text-xs text-slate-500 dark:text-[#B0B7BE] m-0">
                  {selectedJob.senior.full_name.split(' ')[0]} has been notified.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F4A01C] to-[#4F46E5] flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {selectedJob.company_name[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#0F172A] dark:text-white m-0 leading-tight">Request Referral</h3>
                    <p className="text-[11px] text-slate-500 dark:text-[#B0B7BE] m-0 truncate">{selectedJob.role} at {selectedJob.company_name}</p>
                  </div>
                </div>

                <div className="bg-[#F8FAFC] dark:bg-[#1D2226] rounded-xl p-3.5 mb-5 border border-surface dark:border-[#38434F]">
                  <p className="text-xs text-slate-600 dark:text-[#B0B7BE] leading-relaxed m-0">
                    Hi {selectedJob.senior.full_name.split(' ')[0]}, I am interested in the <strong>{selectedJob.role}</strong> position at <strong>{selectedJob.company_name}</strong>. Could you please refer me?
                  </p>
                </div>

                <div className="flex gap-2.5">
                  <button
                    onClick={() => setSelectedJob(null)}
                    disabled={referring}
                    className="flex-1 py-2 rounded-lg border border-surface dark:border-[#38434F] text-slate-500 dark:text-[#B0B7BE] text-xs font-semibold bg-surface dark:bg-[#1D2226] hover:bg-app dark:hover:bg-[#1D2226] dark:bg-[#283036] transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmReferral}
                    disabled={referring}
                    className="flex-1 py-2 rounded-lg bg-[#F4A01C] text-white text-xs font-bold border-none cursor-pointer hover:bg-[#E09410] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {referring ? <Loader2 size={13} className="animate-spin" /> : null}
                    {referring ? 'Sending...' : 'Confirm Request'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      
    </div>
  )
}
