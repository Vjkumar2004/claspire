'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Navbar from '@/components/Navbar'
import { 
  Users, MapPin, Building2, Search, 
  MessageSquare, Lock, Sparkles, CheckCircle2,
  ArrowRight, Globe, Award, Briefcase, GraduationCap
} from 'lucide-react'
import Link from 'next/link'

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
  const { user } = useAuth()
  const [seniors, setSeniors] = useState<Senior[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSenior, setSelectedSenior] = useState<Senior | null>(null)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
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

    // Gating Logic: Direct messaging always requires Premium
    setShowPremiumModal(true)
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
                    <div className={`w-14 h-14 rounded-[18px] ${senior.avatar_url ? 'bg-transparent' : 'bg-gradient-to-br from-gray-100 to-gray-50'} flex items-center justify-center text-xl font-black text-gray-400 border border-gray-200 group-hover:border-cyan-200 group-hover:text-cyan-600 transition-colors shadow-sm overflow-hidden`}>
                      {senior.avatar_url ? (
                        <img src={senior.avatar_url} alt={senior.full_name} className="w-full h-full object-cover" />
                      ) : (
                        senior.full_name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-black group-hover:text-cyan-600 transition-colors">
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
                      <Lock size={16} />
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

      {/* Message Modal */}
      {selectedSenior && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setSelectedSenior(null)}
          />
          <div className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            {messageSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-black mb-2">Message Sent!</h3>
                <p className="text-gray-500 text-sm">
                  {selectedSenior.full_name.split(' ')[0]} will receive a notification and can reply to your email.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black leading-tight">Message {selectedSenior.full_name.split(' ')[0]}</h3>
                    <p className="text-sm text-gray-500">{selectedSenior.designation} @ {selectedSenior.company}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={`Hi ${selectedSenior.full_name.split(' ')[0]}, I would love to ask you about...`}
                    className="w-full border border-gray-200 rounded-xl p-4 text-sm min-h-[120px] outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedSenior(null)}
                    disabled={messaging}
                    className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmMessage}
                    disabled={messaging || !messageText.trim()}
                    className="flex-1 bg-cyan-600 text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {messaging ? 'Sending...' : 'Send Message'}
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
                <h3 className="text-2xl font-bold text-white mb-2">Direct Mentorship</h3>
                <p className="text-white/60 text-sm max-w-[280px] mx-auto">
                  Message verified alumni working at top companies to get 1:1 guidance and referrals.
                </p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-10">
              <div className="space-y-4 mb-8">
                {[
                  'Direct messaging with 10,000+ verified experts',
                  'Request mock interviews and resume reviews',
                  'Unlimited cross-college referrals',
                  'Priority placement in senior inboxes'
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
