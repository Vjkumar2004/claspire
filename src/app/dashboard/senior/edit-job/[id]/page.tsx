'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react'


const JOB_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'internship', label: 'Internship' },
  { value: 'contract', label: 'Contract' },
]

export default function EditJobPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string


  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [companyName, setCompanyName] = useState('')
  const [role, setRole] = useState('')
  const [location, setLocation] = useState('')
  const [salaryRange, setSalaryRange] = useState('')
  const [jobType, setJobType] = useState('full_time')
  const [description, setDescription] = useState('')
  const [referralAvailable, setReferralAvailable] = useState(false)

  useEffect(() => {
    if (!jobId) return
    const fetchJob = async () => {
      try {
        const res = await fetch('/api/jobs')
        if (res.ok) {
          const data = await res.json()
          const job = (data.jobs || []).find((j: any) => j.id === jobId)
          if (job) {
            setCompanyName(job.company_name || '')
            setRole(job.role || '')
            setLocation(job.location || '')
            setSalaryRange(job.salary_range || '')
            setJobType(job.job_type || 'full_time')
            setDescription(job.description || '')
            setReferralAvailable(job.referral_available || false)
          } else {
            setError('Job not found')
          }
        }
      } catch {
        setError('Failed to load job')
      } finally {
        setLoading(false)
      }
    }
    fetchJob()
  }, [jobId])

  const handleSave = async () => {
    if (!companyName.trim()) { setError('Company name is required'); return }
    if (!role.trim()) { setError('Role is required'); return }
    if (!location.trim()) { setError('Location is required'); return }

    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName.trim(),
          role: role.trim(),
          location: location.trim(),
          salary_range: salaryRange.trim(),
          job_type: jobType,
          description: description.trim(),
          referral_available: referralAvailable,
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to update job')
        return
      }

      setSuccess('Job updated successfully!')

      setTimeout(() => {
        router.push('/dashboard/senior?activeTab=jobs')
      }, 1000)
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-purple-600" />
          <p className="text-sm font-semibold text-gray-500">Loading job...</p>
        </div>
      </div>
    )
  }

  if (error && !companyName) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="bg-surface p-8 rounded-2xl shadow-sm border border-red-200 max-w-md text-center">
          <AlertCircle size={40} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Cannot Load Job</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-5 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-surface">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Back to My Jobs</span>
          </button>
          <div className="flex items-center gap-3">
            {success && (
              <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                {success}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-xl text-sm font-black hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <><Loader2 size={16} className="animate-spin" /> Saving...</>
              ) : (
                <><Save size={16} /> Save Changes</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="bg-surface rounded-2xl border border-surface p-5 mb-5">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Company Name</label>
          <input
            type="text"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder="e.g. Google"
            className="w-full border border-surface rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all placeholder:text-gray-300"
          />
        </div>

        <div className="bg-surface rounded-2xl border border-surface p-5 mb-5">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Role</label>
          <input
            type="text"
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder="e.g. Software Engineer"
            className="w-full border border-surface rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all placeholder:text-gray-300"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
          <div className="bg-surface rounded-2xl border border-surface p-5">
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Location</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Bangalore, Remote"
              className="w-full border border-surface rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all placeholder:text-gray-300"
            />
          </div>
          <div className="bg-surface rounded-2xl border border-surface p-5">
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Salary Range</label>
            <input
              type="text"
              value={salaryRange}
              onChange={e => setSalaryRange(e.target.value)}
              placeholder="e.g. 12-20 LPA"
              className="w-full border border-surface rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all placeholder:text-gray-300"
            />
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-surface p-5 mb-5">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Job Type</label>
          <div className="flex flex-wrap gap-2">
            {JOB_TYPES.map(jt => (
              <button
                key={jt.value}
                onClick={() => setJobType(jt.value)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  jobType === jt.value
                    ? 'bg-purple-50 border-purple-300 text-purple-700'
                    : 'bg-surface border-surface text-gray-600 hover:border-gray-300'
                }`}
              >
                {jt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-surface p-5 mb-5">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Job Link / Description</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Paste job posting URL or description"
            className="w-full border border-surface rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all placeholder:text-gray-300"
          />
        </div>

        <div className="bg-surface rounded-2xl border border-surface p-5 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-0.5">Referral Available</label>
              <p className="text-[11px] text-gray-400 font-medium">Allow students to request a referral for this job</p>
            </div>
            <button
              onClick={() => setReferralAvailable(!referralAvailable)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                referralAvailable ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-surface rounded-full shadow transition-transform ${
                referralAvailable ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>

        <div className="pt-4 pb-12">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-2xl text-sm font-black hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <><Loader2 size={18} className="animate-spin" /> Updating Job...</>
            ) : (
              <><Save size={18} /> Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
