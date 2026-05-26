'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, Briefcase, Building2, MapPin, Star, MessageCircle, ChevronRight, Filter, GraduationCap, Award, CheckCircle, Clock } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { useAuth } from '@/hooks/useAuth'
import MessageRequestButton from '@/components/MessageRequestButton'
import SeniorMessageRequestButton from '@/components/SeniorMessageRequestButton'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

interface Senior {
  id: string
  full_name: string
  unique_id: string
  designation: string
  company: string
  graduation_year: number
  avatar_url?: string
  rise_points: number
  college_id: string
  college: {
    name: string
    short_name: string
    location: string
  }
}

export default function SeniorsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [seniors, setSeniors] = useState<Senior[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchSeniors()
  }, [])

  const fetchSeniors = async () => {
    try {
      const res = await fetch('/api/seniors')
      if (res.ok) {
        const data = await res.json()
        setSeniors(data)
      }
    } catch (err) {
      console.error('Error fetching seniors:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredSeniors = seniors.filter(senior => 
    senior.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    senior.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    senior.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (senior.college?.short_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* Hero Section */}
      <div className="relative pt-28 pb-16 overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-purple-100/30 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-50/30 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-full border border-purple-100 mb-6">
            <Award size={14} className="text-[#7C3AED]" />
            <span className="text-[12px] font-bold text-[#7C3AED] uppercase tracking-wider">Verified Experts</span>
          </div>
          
          <h1 className="font-extrabold text-4xl md:text-5xl text-gray-900 mb-6 leading-[1.2] tracking-tight">
            Connect with seniors who<br />
            have <span className="text-[#7C3AED]">walked the path</span>.
          </h1>
          
          <p className="text-gray-500 max-w-2xl mx-auto text-base md:text-lg mb-10 font-medium">
            Get 1:1 mentorship, career advice, and industry insights from 
            verified alumni working at top companies worldwide.
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
                placeholder="Search by name, company, or college..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 py-3 text-black outline-none bg-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seniors Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-32">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 tracking-tight">
              Platform Mentors
              <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                {filteredSeniors.length}
              </span>
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[280px] bg-gray-100 rounded-md border border-gray-200 animate-pulse" />
            ))}
          </div>
        ) : filteredSeniors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSeniors.map((senior) => {
              const isOwnCollege = user?.college_id === senior.college_id

              return (
                <div 
                  key={senior.id}
                  className="group bg-white border border-gray-200 rounded-md p-6 hover:border-purple-300 hover:shadow-md transition-all duration-200 relative overflow-hidden flex flex-col h-full shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-start gap-4 mb-6">
                    {/* Avatar */}
                    <div 
                      onClick={() => router.push(`/u/${senior.unique_id}`)}
                      className={`w-12 h-12 rounded-md ${senior.avatar_url ? 'bg-transparent' : 'bg-gray-100'} flex items-center justify-center text-sm font-black text-gray-500 border border-gray-200 group-hover:border-purple-300 group-hover:text-[#7C3AED] transition-all shadow-sm overflow-hidden cursor-pointer flex-shrink-0`}
                    >
                      {senior.avatar_url ? (
                        <img src={senior.avatar_url} alt={senior.full_name} className="w-full h-full object-cover" />
                      ) : (
                        senior.full_name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 
                          onClick={() => router.push(`/u/${senior.unique_id}`)}
                          className="text-base font-bold text-gray-900 group-hover:text-[#7C3AED] transition-colors cursor-pointer truncate tracking-tight"
                        >
                          {senior.full_name}
                        </h3>
                        {senior.rise_points > 50 && (
                          <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded border border-amber-100 text-[10px] font-bold flex-shrink-0" title="Top Contributor">
                            <Award size={10} />
                            Verified
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-medium truncate">@{senior.unique_id}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 flex-1">
                    <div className="flex items-start gap-3">
                      <Briefcase size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate leading-snug">{senior.designation}</p>
                        <p className="text-xs text-gray-500 truncate leading-snug">{senior.company}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <GraduationCap size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 leading-snug">Class of {senior.graduation_year}</p>
                        <p className="text-xs text-gray-500 truncate leading-snug">
                          {senior.college?.name || 'College not specified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* College/Community context & Action */}
                  <div className="pt-4 border-t border-gray-100 mt-auto">
                    {user?.role === 'senior' ? (
                      <SeniorMessageRequestButton 
                        targetSeniorId={senior.id} 
                        targetSeniorName={senior.full_name} 
                      />
                    ) : (
                      <MessageRequestButton 
                        seniorId={senior.id} 
                        seniorName={senior.full_name} 
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-md">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <Users size={24} className="text-gray-300" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">No seniors matched your search</h3>
            <p className="text-gray-500 text-sm">Try exploring other colleges or roles</p>
          </div>
        )}
      </div>
    </div>
  )
}
