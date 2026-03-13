'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, MapPin, Globe, Mail, 
  Send, Clock, CheckCircle2, XCircle, 
  Plus, Search, Building, GraduationCap,
  Sparkles, Check, Info, Camera, Upload, ArrowRight
} from 'lucide-react'
import Navbar from '@/components/Navbar'

export default function CollegeRequestPage() {
  const [loading, setLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    college_name: '',
    short_name: '',
    location: '',
    state: '',
    college_type: 'Private',
    email_domain: '',
    website_url: '',
    additional_info: ''
  })

  const states = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Delhi", "Puducherry", "Chandigarh", "Other"
  ]

  const collegeTypes = [
    "Private", "Government", "Autonomous", "Deemed", 
    "IIT", "NIT", "Polytechnic", "Central"
  ]

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/colleges/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (res.ok) {
        setIsSubmitted(true)
      } else {
        setError(data.error || 'Failed to submit request')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#F5F4FF] font-plus-jakarta-sans">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh] px-4">
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl p-10 md:p-16 text-center border border-[#EEEBFF]"
           >
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                 <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-200">
                    <Check size={32} strokeWidth={3} />
                 </div>
              </div>
              <h2 className="text-3xl font-black text-[#0F172A] mb-4 font-instrument-serif">Request Submitted Successfully!</h2>
              <p className="text-gray-500 font-medium leading-relaxed mb-10">
                Your request to add <span className="text-[#0F172A] font-black">{formData.college_name}</span> has been sent to our campus verification team.
              </p>
              
              <h2 className="text-3xl font-black text-[#0F172A] mb-4 font-instrument-serif">Request Recorded!</h2>
              <p className="text-gray-500 font-medium leading-relaxed mb-10">
                Your request to add <span className="text-[#0F172A] font-black">{formData.college_name}</span> has been received.
              </p>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden mb-10"
              >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
                  <h3 className="text-xl font-black mb-2 flex items-center justify-center gap-2">
                    <Sparkles size={20} className="text-yellow-300 animate-pulse" /> Coming Soon!
                  </h3>
                  <p className="text-sm font-medium opacity-90">
                    We're currently scaling our campus verification system. Your college hub will be live shortly!
                  </p>
              </motion.div>

              <div className="flex items-center justify-center gap-2 text-orange-500 font-black text-xs uppercase tracking-widest animate-pulse">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                Waiting for Admin Approval
              </div>

              <button 
                onClick={() => window.location.href = '/colleges'}
                className="mt-12 w-full py-4 rounded-2xl bg-[#0F172A] text-white font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-gray-200"
              >
                Back to Colleges <ArrowRight size={16} />
              </button>
           </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F4FF] font-plus-jakarta-sans pb-20">
      <Navbar />

      {/* ── Hero ── */}
      <div className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] -mr-64 -mt-64" />
         <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[80px] -ml-48 -mb-48" />

         <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
            >
               <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-[10px] font-black text-purple-400 tracking-[0.2em] uppercase mb-6">
                  <Sparkles size={14} /> Can't find your college?
               </div>
               <h1 className="text-4xl md:text-6xl font-black text-white mb-6 font-instrument-serif leading-tight">Request Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-300">College Hub</span></h1>
               <p className="text-white/60 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-10">Submit details and we'll add your college within 24 hours.</p>
            </motion.div>
         </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[40px] border border-[#EEEBFF] shadow-2xl p-8 md:p-12"
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Column: Form */}
            <div className="lg:col-span-8">
                <h2 className="text-2xl font-black text-[#0F172A] font-instrument-serif m-0 mb-2">College Details</h2>
                <p className="text-sm text-gray-500 mb-8">Fill in the information accurately to help us setup the community faster.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-[#64748B] mb-2 px-1 uppercase tracking-widest text-[10px]">Full College Name *</label>
                        <input 
                            required type="text"
                            value={formData.college_name}
                            onChange={(e) => setFormData({...formData, college_name: e.target.value})}
                            placeholder="e.g. SRM Institute of Science and Technology"
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm text-[#0F172A] outline-none focus:bg-white focus:border-purple-600 focus:shadow-[0_0_0_4px_rgba(124,58,237,0.05)] transition-all font-bold"
                        />
                        </div>
                        <div>
                        <label className="block text-sm font-bold text-[#64748B] mb-2 px-1 uppercase tracking-widest text-[10px]">Short Name *</label>
                        <input 
                            required type="text"
                            value={formData.short_name}
                            onChange={(e) => setFormData({...formData, short_name: e.target.value})}
                            placeholder="e.g. SRM"
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm text-[#0F172A] outline-none focus:bg-white focus:border-purple-600 focus:shadow-[0_0_0_4px_rgba(124,58,237,0.05)] transition-all font-bold"
                        />
                        </div>
                        <div>
                        <label className="block text-sm font-bold text-[#64748B] mb-2 px-1 uppercase tracking-widest text-[10px]">College Type *</label>
                        <select 
                            value={formData.college_type}
                            onChange={(e) => setFormData({...formData, college_type: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm text-[#0F172A] outline-none focus:bg-white focus:border-purple-600 focus:shadow-[0_0_0_4px_rgba(124,58,237,0.05)] transition-all appearance-none cursor-pointer font-bold"
                        >
                            {collegeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        </div>
                        <div>
                        <label className="block text-sm font-bold text-[#64748B] mb-2 px-1 uppercase tracking-widest text-[10px]">City / Location *</label>
                        <input 
                            required type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({...formData, location: e.target.value})}
                            placeholder="e.g. Chennai"
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm text-[#0F172A] outline-none focus:bg-white focus:border-purple-600 focus:shadow-[0_0_0_4px_rgba(124,58,237,0.05)] transition-all font-bold"
                        />
                        </div>
                        <div>
                        <label className="block text-sm font-bold text-[#64748B] mb-2 px-1 uppercase tracking-widest text-[10px]">State *</label>
                        <select 
                            required value={formData.state}
                            onChange={(e) => setFormData({...formData, state: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm text-[#0F172A] outline-none focus:bg-white focus:border-purple-600 focus:shadow-[0_0_0_4px_rgba(124,58,237,0.05)] transition-all appearance-none cursor-pointer font-bold"
                        >
                            <option value="">Select State</option>
                            {states.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        </div>
                        <div>
                        <label className="block text-sm font-bold text-[#64748B] mb-2 px-1 uppercase tracking-widest text-[10px]">Email Domain *</label>
                        <input 
                            required type="text"
                            value={formData.email_domain}
                            onChange={(e) => setFormData({...formData, email_domain: e.target.value})}
                            placeholder="e.g. srmist.edu.in"
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm text-[#0F172A] outline-none focus:bg-white focus:border-purple-600 focus:shadow-[0_0_0_4px_rgba(124,58,237,0.05)] transition-all font-bold"
                        />
                        </div>
                        <div>
                        <label className="block text-sm font-bold text-[#64748B] mb-2 px-1 uppercase tracking-widest text-[10px]">Website (Optional)</label>
                        <input 
                            type="text"
                            value={formData.website_url}
                            onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                            placeholder="https://www.college.ac.in"
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm text-[#0F172A] outline-none focus:bg-white focus:border-purple-600 focus:shadow-[0_0_0_4px_rgba(124,58,237,0.05)] transition-all font-bold"
                        />
                        </div>
                        <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-[#64748B] mb-2 px-1 uppercase tracking-widest text-[10px]">Additional Info (Optional)</label>
                        <textarea 
                            value={formData.additional_info}
                            onChange={(e) => setFormData({...formData, additional_info: e.target.value})}
                            placeholder="Anything else we should know?"
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm text-[#0F172A] outline-none focus:bg-white focus:border-purple-600 transition-all h-24 resize-none font-medium"
                        />
                        </div>
                    </div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-4 rounded-2xl bg-red-50 text-red-500 text-xs font-bold border border-red-100"
                        >
                            ⚠️ {error}
                        </motion.div>
                    )}

                    <button 
                        type="submit" disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-black py-5 rounded-3xl shadow-xl shadow-purple-200/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {loading ? 'Submitting Request...' : <><Send size={18} /> Send Request for Approval</>}
                    </button>
                    <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">Administrator review is required for all new campus hubs</p>
                </form>
            </div>

            {/* Right Column: Logo Upload */}
            <div className="lg:col-span-4">
                <div className="sticky top-24 space-y-8">
                    <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-100 text-center">
                        <h3 className="text-lg font-black text-[#0F172A] font-instrument-serif mb-2">College Logo</h3>
                        <p className="text-xs text-gray-500 mb-8 font-medium">Upload a clear logo for your college community.</p>
                        
                        <div className="relative group mx-auto mb-8">
                            <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-[32px] border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-purple-400">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-4" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-gray-300 group-hover:text-purple-400">
                                        <Upload size={32} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">PNG / JPG</span>
                                    </div>
                                )}
                                
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleLogoChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-200 pointer-events-none group-hover:scale-110 transition-transform">
                                <Plus size={20} />
                            </div>
                        </div>

                        <div className="text-xs font-bold text-[#64748B] leading-relaxed">
                            A high-quality logo helps students identify the correct campus community.
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[40px] -mr-16 -mt-16" />
                        <h4 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                           <Info size={16} /> Admin Policy
                        </h4>
                        <p className="text-sm font-medium leading-relaxed opacity-80">
                           Once submitted, your request will be reviewed by multiple administrators. We verify the college existence and domain details before activation.
                        </p>
                    </div>
                </div>
            </div>

            </div>
        </motion.div>
      </div>
    </div>
  )
}
