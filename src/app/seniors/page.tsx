'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Navbar from '@/components/Navbar'
import { 
  Users, MapPin, Building2, Search, 
  MessageSquare, Award, Briefcase, GraduationCap
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Senior {
  id: string
  full_name: string
  unique_id: string
  company: string
  designation: string
  college_id: string
  graduation_year: number
  rise_points: number
  avatar_url?: string
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
  const [selectedSenior, setSelectedSenior] = useState<Senior | null>(null)
  const [messaging, setMessaging] = useState(false)
  const [messageSuccess, setMessageSuccess] = useState(false)
  const [messageText, setMessageText] = useState('')

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

  const handleMessageClick = (senior: Senior) => {
    if (!user) {
      window.location.href = '/login'
      return
    }

    // Direct messaging is now free for everyone - redirect to messages page
    router.push(`/messages?user=${senior.id}`)
  }

  const confirmMessage = async () => {
    if (!selectedSenior || !user || !messageText.trim()) return
    
    setMessaging(true)
    try {
      // In a real app, this would hit an API endpoint to send a message
      // For now, we simulate a successful send
      await new Promise(resolve => setTimeout(resolve, 1000))

      setMessageSuccess(true)
      setTimeout(() => {
        setMessageSuccess(false)
        setSelectedSenior(null)
      }, 2000)
    } catch (err) {
      console.error('Messaging error:', err)
    } finally {
      setMessaging(false)
    }
  }

  const filteredSeniors = seniors.filter(senior => 
    senior.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    senior.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    senior.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    senior.college.short_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#FDFDFF]">
      <Navbar />

      {/* Hero Section */}
      <div className="relative pt-28 pb-20 overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-cyan-100/40 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-50/40 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-50 rounded-full border border-cyan-100 mb-6">
            <Award size={14} className="text-cyan-600" />
            <span className="text-[12px] font-bold text-cyan-600 uppercase tracking-wider">Verified Experts</span>
          </div>
          
          <h1 className="font-instrument-serif text-5xl md:text-6xl text-black mb-6 leading-[1.1]">
            Connect with seniors who<br />
            have <em className="text-cyan-600">walked the path</em>.
          </h1>
          
          <p className="text-gray-500 max-w-2xl mx-auto text-lg mb-10">
            Get 1:1 mentorship, career advice, and industry insights from 
            verified alumni working at top companies worldwide.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-0 bg-cyan-600/5 rounded-2xl blur-xl group-hover:bg-cyan-600/10 transition-all" />
            <div className="relative bg-white border border-gray-200 rounded-2xl p-2 flex items-center shadow-sm">
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
              <button className="bg-black text-white px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Seniors Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-32">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-black flex items-center gap-2">
              Platform Mentors
              <span className="text-sm font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {filteredSeniors.length}
              </span>
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[280px] bg-gray-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredSeniors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSeniors.map((senior) => {
              const isOwnCollege = user?.college_id === senior.college_id

              return (
                <div 
                  key={senior.id}
                  className="group bg-white border border-gray-100 rounded-3xl p-6 hover:border-cyan-200 hover:shadow-[0_20px_40px_-12px_rgba(6,182,212,0.08)] transition-all duration-300 relative overflow-hidden flex flex-col h-full"
                >
                  <div className="flex items-start gap-4 mb-6">
                    {/* Avatar */}
                    <div 
                      onClick={() => router.push(`/u/${senior.unique_id}`)}
                      className={`w-14 h-14 rounded-[18px] ${senior.avatar_url ? 'bg-transparent' : 'bg-gradient-to-br from-gray-100 to-gray-50'} flex items-center justify-center text-xl font-black text-gray-400 border border-gray-200 group-hover:border-cyan-200 group-hover:text-cyan-600 transition-all shadow-sm overflow-hidden cursor-pointer hover:scale-105 active:scale-95`}
                    >
                      {senior.avatar_url ? (
                        <img src={senior.avatar_url} alt={senior.full_name} className="w-full h-full object-cover" />
                      ) : (
                        senior.full_name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 
                          onClick={() => router.push(`/u/${senior.unique_id}`)}
                          className="text-lg font-bold text-black group-hover:text-cyan-600 transition-colors cursor-pointer"
                        >
                          {senior.full_name}
                        </h3>
                        {senior.rise_points > 50 && (
                          <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md text-xs font-bold border border-amber-100" title="Top Contributor">
                            <Award size={12} />
                            Top
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 font-medium">@{senior.unique_id}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 flex-1">
                    <div className="flex items-start gap-3">
                      <Briefcase size={16} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-gray-800">{senior.designation}</p>
                        <p className="text-sm text-gray-500">{senior.company}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <GraduationCap size={16} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-gray-800">Class of {senior.graduation_year}</p>
                        <p className="text-sm text-gray-500">{senior.college.name}</p>
                      </div>
                    </div>
                  </div>

                  {/* College/Community context & Action */}
                  <div className="pt-4 border-t border-gray-50 mt-auto">
                    <button 
                      onClick={() => handleMessageClick(senior)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all bg-black text-white hover:bg-gray-800"
                    >
                      <MessageSquare size={16} />
                      Message {senior.full_name.split(' ')[0]}
                    </button>
                  </div>

                  {/* Hover Accent */}
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-3xl">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-black mb-2">No seniors matched your search</h3>
            <p className="text-gray-500 text-sm">Try exploring other colleges or roles</p>
          </div>
        )}
      </div>
    </div>
  )
}
