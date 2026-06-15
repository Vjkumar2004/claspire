'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Shield, ArrowLeft, Save, Loader2, Upload, X, Globe,
  Link2, Twitter, Linkedin, ExternalLink, CheckCircle,
  AlertTriangle, ImagePlus, Building2, MapPin
} from 'lucide-react'
import Link from 'next/link'

type College = {
  id: string
  name: string
  short_name: string
  slug: string
  type: string
  location: string
  state: string
  logo_url: string | null
  banner_url: string | null
  description: string | null
  website_url: string | null
  social_links: Record<string, string>
  email_domain: string | null
  is_verified: boolean
  is_active: boolean
}

type AdminEntry = {
  id: string
  role: string
  status: string
}

export default function CollegeAdminDashboard() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [college, setCollege] = useState<College | null>(null)
  const [admin, setAdmin] = useState<AdminEntry | null>(null)

  const [description, setDescription] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [avgPackage, setAvgPackage] = useState('')
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({})
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      const res = await fetch(`/api/colleges/${slug}/admin`)
      if (!res.ok) {
        if (res.status === 403) {
          router.push(`/colleges/${slug}`)
          return
        }
        if (res.status === 401) {
          router.push('/signup')
          return
        }
        setError('Failed to load admin data')
        return
      }
      const data = await res.json()
      if (data.success) {
        setCollege(data.college)
        setAdmin(data.admin)
        setDescription(data.college.description || '')
        setWebsiteUrl(data.college.website_url || '')
        setAvgPackage(data.college.avg_package ? String(data.college.avg_package) : '')
        setSocialLinks(data.college.social_links || {})
      }
    } catch (err) {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !college) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'college_logo')
    formData.append('college_id', college.id)

    setSaving(true)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) {
        setCollege({ ...college, logo_url: data.url })
        setLogoPreview(data.url)
        setSuccess('Logo updated successfully')
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch (err) {
      setError('Upload failed')
    } finally {
      setSaving(false)
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !college) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'college_banner')
    formData.append('college_id', college.id)

    setSaving(true)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) {
        setCollege({ ...college, banner_url: data.url })
        setBannerPreview(data.url)
        setSuccess('Banner updated successfully')
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch (err) {
      setError('Upload failed')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    if (!college) return
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/colleges/${slug}/admin/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          website_url: websiteUrl,
          avg_package: avgPackage ? parseFloat(avgPackage) : null,
          social_links: socialLinks
        })
      })

      const data = await res.json()
      if (data.success) {
        setSuccess('College profile updated successfully')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Update failed')
      }
    } catch (err) {
      setError('Connection error')
    } finally {
      setSaving(false)
    }
  }

  const addSocialLink = (platform: string) => {
    setSocialLinks({ ...socialLinks, [platform]: '' })
  }

  const updateSocialLink = (platform: string, value: string) => {
    setSocialLinks({ ...socialLinks, [platform]: value })
  }

  const removeSocialLink = (platform: string) => {
    const updated = { ...socialLinks }
    delete updated[platform]
    setSocialLinks(updated)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#1D2226] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-purple-600" />
      </div>
    )
  }

  if (!college || !admin) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#1D2226] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
          <p className="text-gray-900 dark:text-white font-bold text-lg">Access Denied</p>
          <p className="text-sm text-gray-500 dark:text-[#B0B7BE] mt-2">You are not authorized to manage this college.</p>
          <Link
            href={`/colleges/${slug}`}
            className="inline-flex items-center gap-2 mt-4 text-purple-600 hover:text-purple-700 font-bold text-sm"
          >
            <ArrowLeft size={16} /> Back to College
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#1D2226]">
      {/* Header */}
      <div className="bg-white dark:bg-[#283036] border-b border-gray-200 dark:border-[#38434F]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/colleges/${slug}`}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Shield size={20} className="text-purple-600" />
                  {college.name}
                </h1>
                <p className="text-xs text-gray-500 dark:text-[#B0B7BE] font-medium">
                  College Admin Dashboard
                  <span className="ml-2 text-[10px] uppercase tracking-wider font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">
                    {admin.role}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-purple-200/50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2">
            <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-emerald-600 text-sm font-medium">{success}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Banner */}
          <div className="bg-white dark:bg-[#283036] rounded-xl border border-gray-200 dark:border-[#38434F] overflow-hidden">
            <div
              className="h-48 bg-gradient-to-br from-purple-600 to-indigo-700 relative flex items-center justify-center group cursor-pointer"
              onClick={() => bannerInputRef.current?.click()}
            >
              {(college.banner_url || bannerPreview) && (
                <img
                  src={bannerPreview || college.banner_url!}
                  alt="College Banner"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1 text-white">
                  <ImagePlus size={32} />
                  <span className="text-xs font-bold">Change Banner</span>
                </div>
              </div>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                className="hidden"
              />
            </div>

            <div className="px-6 pb-6">
              {/* Logo */}
              <div className="flex items-start -mt-12 mb-6">
                <div
                  className="w-24 h-24 rounded-xl bg-white dark:bg-[#283036] border-4 border-white dark:border-[#283036] shadow-lg overflow-hidden relative group cursor-pointer flex-shrink-0"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {(college.logo_url || logoPreview) ? (
                    <img
                      src={logoPreview || college.logo_url!}
                      alt={`${college.short_name} logo`}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 group-hover:text-purple-400 transition-colors">
                      <Upload size={24} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImagePlus size={20} className="text-white" />
                    </div>
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
                <div className="ml-4 mt-12">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{college.name}</h2>
                  <p className="text-xs text-gray-500 dark:text-[#B0B7BE] flex items-center gap-1 mt-0.5">
                    <MapPin size={12} />
                    {college.location}, {college.state}
                  </p>
                </div>
              </div>

              {/* Info Alert */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                  <strong>Note:</strong> Changes to the college name, slug, type, location, and email domain require contacting support. You can edit the description, logo, banner, website, and social links here.
                </p>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-600 dark:text-[#B0B7BE] mb-2 uppercase tracking-wider">
                  College Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write a description for your college..."
                  rows={5}
                  className="w-full bg-gray-50 dark:bg-[#1D2226] border border-gray-200 dark:border-[#38434F] rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">This description will appear on the college profile page.</p>
              </div>

              {/* Website URL */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-600 dark:text-[#B0B7BE] mb-2 uppercase tracking-wider">
                  Official Website
                </label>
                <div className="relative">
                  <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://www.college.ac.in"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#1D2226] border border-gray-200 dark:border-[#38434F] rounded-lg text-sm font-medium outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Average Package */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-600 dark:text-[#B0B7BE] mb-2 uppercase tracking-wider">
                  Highest / Average Package (LPA)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={avgPackage}
                    onChange={(e) => setAvgPackage(e.target.value)}
                    placeholder="12.5"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#1D2226] border border-gray-200 dark:border-[#38434F] rounded-lg text-sm font-medium outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">The highest or average placement package for this college.</p>
              </div>

              {/* Social Links */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-600 dark:text-[#B0B7BE] uppercase tracking-wider">
                    Social Links
                  </label>
                  <div className="flex gap-1.5">
                    {['linkedin', 'twitter', 'instagram', 'facebook', 'youtube'].filter(p => !socialLinks[p]).map(platform => (
                      <button
                        key={platform}
                        onClick={() => addSocialLink(platform)}
                        className="text-[10px] font-bold text-purple-600 hover:text-purple-700 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded transition-colors"
                      >
                        +{platform}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2.5">
                  {Object.entries(socialLinks).length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No social links added yet.</p>
                  ) : (
                    Object.entries(socialLinks).map(([platform, value]) => (
                      <div key={platform} className="flex items-center gap-2">
                        <div className="relative flex-1">
                          {platform === 'linkedin' && <Linkedin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600" />}
                          {platform === 'twitter' && <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>}
                                          <input
                            type="url"
                            value={value}
                            onChange={(e) => updateSocialLink(platform, e.target.value)}
                            placeholder={`https://${platform}.com/...`}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#1D2226] border border-gray-200 dark:border-[#38434F] rounded-lg text-sm font-medium outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                        <button
                          onClick={() => removeSocialLink(platform)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Admin Info */}
          <div className="bg-white dark:bg-[#283036] rounded-xl border border-gray-200 dark:border-[#38434F] p-6">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield size={16} className="text-purple-600" />
              Admin Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Role</p>
                <p className="font-semibold text-gray-900 dark:text-white capitalize">{admin.role}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {admin.status}
                </span>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">College Domain</p>
                <p className="font-semibold text-gray-900 dark:text-white">{college.email_domain || 'Not set'}</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white dark:bg-[#283036] rounded-xl border border-gray-200 dark:border-[#38434F] p-6">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Quick Links</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Link
                href={`/colleges/${slug}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#1D2226] border border-gray-200 dark:border-[#38434F] hover:border-purple-300 transition-colors"
              >
                <Building2 size={18} className="text-purple-600" />
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">View College Page</p>
                  <p className="text-[10px] text-gray-500">See how your college looks</p>
                </div>
              </Link>
              <Link
                href={`/community/c/${slug}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#1D2226] border border-gray-200 dark:border-[#38434F] hover:border-purple-300 transition-colors"
              >
                <ExternalLink size={18} className="text-purple-600" />
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Community Hub</p>
                  <p className="text-[10px] text-gray-500">View college community</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
