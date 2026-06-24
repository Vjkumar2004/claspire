'use client'

import { Plus, X, Upload, Loader2, ExternalLink, Linkedin, Globe, Github, BookOpen, Briefcase, GraduationCap, Calendar, Building2, Pencil, Check, FileText, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { DEFAULT_MENTORSHIP } from '@/lib/profile-data'
import type { CertificationItem, ProjectItem, SeniorProfileExtras, SocialLinks } from '@/lib/profile-data'

type Props = {
  formData: {
    bio: string
    company: string
    designation: string
    graduation_year: string
  }
  extras: SeniorProfileExtras
  onFormChange: (patch: Partial<Props['formData']>) => void
  onExtrasChange: (patch: Partial<SeniorProfileExtras>) => void
  collegeName?: string
}

function SkillsEditor({ skills, onChange }: { skills: string[]; onChange: (skills: string[]) => void }) {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim()
    if (!v || skills.includes(v)) return
    onChange([...skills, v])
    setInput('')
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {skills.map((s) => (
          <span key={s} className="skill-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EAF4FF] text-[#0A66C2] text-[11px] font-bold border border-[#D9E2EC]/60 shadow-sm dark:shadow-[#1D2226]/50">
            {s}
            <button type="button" onClick={() => onChange(skills.filter((x) => x !== s))} className="text-cyan-400 hover:text-[#0A66C2] transition-colors">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
            placeholder="Add a skill (e.g. Java, AWS, System Design...)"
            className="w-full bg-surface dark:bg-[#222B31] border border-surface dark:border-[#38434F] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all placeholder:text-slate-300 dark:placeholder:text-[#8B949E] dark:text-white"
          />
        </div>
        <button
          type="button"
          onClick={add}
          className="px-4 py-2.5 rounded-xl bg-[#0A66C2] text-white text-xs font-bold hover:shadow-lg hover:shadow-[#0A66C2]/25 transition-all flex items-center gap-1.5"
        >
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  )
}

export default function SeniorProfileEditor({
  formData,
  extras,
  onFormChange,
  onExtrasChange,
  collegeName,
}: Props) {
  const skills = extras.skills || []
  const certifications = extras.certifications || []
  const projects = extras.projects || []
  const mentorship = { ...DEFAULT_MENTORSHIP, ...(extras.mentorship || {}) }
  const [uploadingResume, setUploadingResume] = useState(false)

  const updateCert = (index: number, patch: Partial<CertificationItem>) => {
    const next = [...certifications]
    next[index] = { ...next[index], ...patch }
    onExtrasChange({ certifications: next })
  }

  const removeCert = (index: number) => {
    onExtrasChange({ certifications: certifications.filter((_, i) => i !== index) })
  }

  const updateProject = (index: number, patch: Partial<ProjectItem>) => {
    const next = [...projects]
    next[index] = { ...next[index], ...patch }
    onExtrasChange({ projects: next })
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingResume(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', 'resume')
      const res = await fetch('/api/upload/resume', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok && data.url) {
        onExtrasChange({ resume_url: data.url })
      } else {
        alert(data.error || 'Upload failed')
      }
    } catch {
      alert('Upload failed')
    } finally {
      setUploadingResume(false)
    }
  }

  const projectColors = ['from-blue-500 to-blue-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600', 'from-[#0A66C2] to-pink-600', 'from-cyan-500 to-blue-600', 'from-rose-500 to-red-600']

  function TechStackInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
    const [input, setInput] = useState('')
    const add = () => {
      const v = input.trim()
      if (!v || tags.includes(v)) return
      onChange([...tags, v])
      setInput('')
    }
    return (
      <div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-[#283036] text-slate-600 dark:text-[#B0B7BE] text-[10px] font-bold border border-surface dark:border-[#38434F]">
                {t}
                <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="text-slate-400 dark:text-[#B0B7BE] hover:text-red-500">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
            placeholder="Tech stack (e.g. React, Node.js...)"
            className="flex-1 bg-surface dark:bg-[#222B31] border border-surface dark:border-[#38434F] rounded-lg px-3 py-1.5 text-[10px] font-semibold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all placeholder:text-slate-300 dark:placeholder:text-[#8B949E] dark:text-white"
          />
          <button
            type="button"
            onClick={add}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#283036] text-slate-600 dark:text-[#B0B7BE] text-[10px] font-bold hover:bg-slate-200 dark:hover:bg-[#1D2226] transition-all"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ===== ABOUT ME ===== */}
      <section id="about-me" className="bg-surface dark:bg-[#283036] rounded-3xl border border-surface/80 dark:border-[#38434F] shadow-sm dark:shadow-[#1D2226]/50 overflow-hidden scroll-mt-20">
        <div className="px-6 pt-6 pb-4 border-b border-surface dark:border-[#38434F]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] flex items-center justify-center">
              <BookOpen size={15} className="text-cyan-600" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#0F172A] dark:text-white m-0">About Me</h2>
              <p className="text-[10px] font-medium text-slate-400 dark:text-[#B0B7BE] m-0">Share your professional journey</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <textarea
            value={formData.bio}
            onChange={(e) => onFormChange({ bio: e.target.value.slice(0, 400) })}
            placeholder="Share your professional experience and how you can help juniors..."
            className="w-full bg-[#F8FAFC] dark:bg-[#222B31] border border-surface dark:border-[#38434F] rounded-xl px-4 py-3.5 text-xs font-medium h-28 resize-none outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all placeholder:text-slate-300 dark:placeholder:text-[#8B949E] dark:text-white"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-[10px] text-slate-400 dark:text-[#B0B7BE] font-medium m-0">Tell juniors about your background</p>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-[#B0B7BE]">{formData.bio.length}/400</span>
          </div>
        </div>
      </section>

      {/* ===== PROFESSIONAL INFORMATION ===== */}
      <section id="professional-info" className="bg-surface dark:bg-[#283036] rounded-3xl border border-surface/80 dark:border-[#38434F] shadow-sm dark:shadow-[#1D2226]/50 overflow-hidden scroll-mt-20">
        <div className="px-6 pt-6 pb-4 border-b border-surface dark:border-[#38434F]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] flex items-center justify-center">
              <Briefcase size={15} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#0F172A] dark:text-white m-0">Professional Information</h2>
              <p className="text-[10px] font-medium text-slate-400 dark:text-[#B0B7BE] m-0">Your current role and background</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <p className="text-[9px] font-bold text-slate-400 dark:text-[#B0B7BE] uppercase tracking-widest mb-1.5">Current Company</p>
              <div className="relative">
                <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#B0B7BE]" />
                <input
                  value={formData.company}
                  onChange={(e) => onFormChange({ company: e.target.value })}
                  placeholder="Company name"
                  className="w-full bg-surface dark:bg-[#222B31] border border-surface dark:border-[#38434F] rounded-xl pl-10 pr-4 py-3 text-xs font-bold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all placeholder:text-slate-300 dark:placeholder:text-[#8B949E] dark:text-white"
                />
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 dark:text-[#B0B7BE] uppercase tracking-widest mb-1.5">Designation</p>
              <div className="relative">
                <Briefcase size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#B0B7BE]" />
                <input
                  value={formData.designation}
                  onChange={(e) => onFormChange({ designation: e.target.value })}
                  placeholder="Your role"
                  className="w-full bg-surface dark:bg-[#222B31] border border-surface dark:border-[#38434F] rounded-xl pl-10 pr-4 py-3 text-xs font-bold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all placeholder:text-slate-300 dark:placeholder:text-[#8B949E] dark:text-white"
                />
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 dark:text-[#B0B7BE] uppercase tracking-widest mb-1.5">Experience (Years)</p>
              <input
                type="number"
                min={0}
                max={50}
                value={extras.experience_years ?? ''}
                onChange={(e) => onExtrasChange({ experience_years: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Years of exp"
                className="w-full bg-surface dark:bg-[#222B31] border border-surface dark:border-[#38434F] rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all placeholder:text-slate-300 dark:placeholder:text-[#8B949E] dark:text-white"
              />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 dark:text-[#B0B7BE] uppercase tracking-widest mb-1.5">Industry</p>
              <input
                value={extras.industry || ''}
                onChange={(e) => onExtrasChange({ industry: e.target.value })}
                placeholder="e.g. IT / SaaS"
                className="w-full bg-surface dark:bg-[#222B31] border border-surface dark:border-[#38434F] rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all placeholder:text-slate-300 dark:placeholder:text-[#8B949E] dark:text-white"
              />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 dark:text-[#B0B7BE] uppercase tracking-widest mb-1.5">Alumni College</p>
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-[#283036] rounded-xl border border-surface dark:border-[#38434F]">
                <GraduationCap size={14} className="text-slate-400 dark:text-[#B0B7BE] flex-shrink-0" />
                <p className="text-xs font-bold text-slate-700 dark:text-[#B0B7BE] m-0">{collegeName || 'Not assigned'}</p>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 dark:text-[#B0B7BE] uppercase tracking-widest mb-1.5">Graduation Year</p>
              <div className="relative">
                <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#B0B7BE]" />
                <select
                  value={formData.graduation_year}
                  onChange={(e) => onFormChange({ graduation_year: e.target.value })}
                  className="w-full bg-surface dark:bg-[#222B31] border border-surface dark:border-[#38434F] rounded-xl pl-9 pr-4 py-3 text-xs font-bold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all appearance-none dark:text-white"
                >
                  {[2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SKILLS ===== */}
      <section id="skills" className="bg-surface dark:bg-[#283036] rounded-3xl border border-surface/80 dark:border-[#38434F] shadow-sm dark:shadow-[#1D2226]/50 overflow-hidden scroll-mt-20">
        <div className="px-6 pt-6 pb-4 border-b border-surface dark:border-[#38434F]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] flex items-center justify-center">
              <Plus size={15} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#0F172A] dark:text-white m-0">Skills</h2>
              <p className="text-[10px] font-medium text-slate-400 dark:text-[#B0B7BE] m-0">{skills.length} skill{skills.length !== 1 ? 's' : ''} added</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <SkillsEditor skills={skills} onChange={(nextSkills) => onExtrasChange({ skills: nextSkills })} />
        </div>
      </section>

      {/* ===== PROJECTS ===== */}
      <section id="projects" className="bg-surface dark:bg-[#283036] rounded-3xl border border-surface/80 dark:border-[#38434F] shadow-sm dark:shadow-[#1D2226]/50 overflow-hidden scroll-mt-20">
        <div className="px-6 pt-6 pb-4 border-b border-surface dark:border-[#38434F]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] flex items-center justify-center">
                <ExternalLink size={15} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-[#0F172A] dark:text-white m-0">Projects</h2>
                <p className="text-[10px] font-medium text-slate-400 dark:text-[#B0B7BE] m-0">Showcase your work</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onExtrasChange({ projects: [...projects, { title: '', description: '', tech_stack: [] }] })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A66C2] text-white text-[10px] font-bold hover:shadow-lg hover:shadow-[#0A66C2]/25 transition-all"
            >
              <Plus size={13} /> Add Project
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {projects.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#283036] flex items-center justify-center mx-auto mb-3">
                <ExternalLink size={20} className="text-slate-400 dark:text-[#B0B7BE]" />
              </div>
              <p className="text-xs font-semibold text-slate-400 dark:text-[#B0B7BE] m-0">No projects yet. Add your first project to showcase your work.</p>
            </div>
          )}
          {projects.map((p, i) => (
            <div key={i} className="group relative bg-white dark:bg-[#283036] rounded-xl border border-surface dark:border-[#38434F] p-5 hover:border-[#D9E2EC] hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl ${projectColors[i % projectColors.length]} flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0 shadow-sm dark:shadow-[#1D2226]/50`}>
                  {p.title?.charAt(0)?.toUpperCase() || 'P'}
                </div>
                <div className="flex-1 min-w-0 space-y-2.5">
                  <input
                    value={p.title}
                    onChange={(e) => updateProject(i, { title: e.target.value })}
                    placeholder="Project title"
                    className="w-full bg-surface dark:bg-[#222B31] border border-surface dark:border-[#38434F] rounded-lg px-3.5 py-2 text-xs font-bold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all placeholder:text-slate-300 dark:placeholder:text-[#8B949E] dark:text-white"
                  />
                  <textarea
                    value={p.description || ''}
                    onChange={(e) => updateProject(i, { description: e.target.value })}
                    placeholder="Brief description of your project..."
                    className="w-full bg-surface dark:bg-[#222B31] border border-surface dark:border-[#38434F] rounded-lg px-3.5 py-2.5 text-xs font-medium h-16 resize-none outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all placeholder:text-slate-300 dark:placeholder:text-[#8B949E] dark:text-white"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="relative">
                      <Github size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#B0B7BE]" />
                      <input
                        value={p.github_url || ''}
                        onChange={(e) => updateProject(i, { github_url: e.target.value })}
                        placeholder="GitHub URL"
                        className="w-full bg-surface dark:bg-[#222B31] border border-surface dark:border-[#38434F] rounded-lg pl-8 pr-3 py-2 text-xs font-semibold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all placeholder:text-slate-300 dark:placeholder:text-[#8B949E] dark:text-white"
                      />
                    </div>
                    <div className="relative">
                      <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#B0B7BE]" />
                      <input
                        value={p.live_url || ''}
                        onChange={(e) => updateProject(i, { live_url: e.target.value })}
                        placeholder="Live demo URL"
                        className="w-full bg-surface dark:bg-[#222B31] border border-surface dark:border-[#38434F] rounded-lg pl-8 pr-3 py-2 text-xs font-semibold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all placeholder:text-slate-300 dark:placeholder:text-[#8B949E] dark:text-white"
                      />
                    </div>
                  </div>
                  <TechStackInput
                    tags={p.tech_stack || []}
                    onChange={(tags) => updateProject(i, { tech_stack: tags })}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = projects.filter((_, idx) => idx !== i)
                  onExtrasChange({ projects: next })
                }}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-surface dark:bg-[#283036] border border-surface dark:border-[#38434F] text-slate-400 dark:text-[#B0B7BE] hover:text-red-500 hover:border-red-200 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CERTIFICATIONS ===== */}
      <section id="certifications" className="bg-surface dark:bg-[#283036] rounded-3xl border border-surface/80 dark:border-[#38434F] shadow-sm dark:shadow-[#1D2226]/50 overflow-hidden scroll-mt-20">
        <div className="px-6 pt-6 pb-4 border-b border-surface dark:border-[#38434F]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] flex items-center justify-center">
                <Pencil size={15} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-[#0F172A] dark:text-white m-0">Certifications</h2>
                <p className="text-[10px] font-medium text-slate-400 dark:text-[#B0B7BE] m-0">{certifications.length} certificat{certifications.length === 1 ? 'ion' : 'ions'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onExtrasChange({ certifications: [...certifications, { name: '' }] })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A66C2] text-white text-[10px] font-bold hover:shadow-lg hover:shadow-[#0A66C2]/25 transition-all"
            >
              <Plus size={13} /> Add
            </button>
          </div>
        </div>
        <div className="p-6 space-y-3">
          {certifications.length === 0 && (
            <p className="text-xs font-medium text-slate-400 dark:text-[#B0B7BE] text-center py-4 m-0">No certifications yet. Click Add to add your certifications.</p>
          )}
          {certifications.map((c, i) => (
            <div key={i} className="group relative bg-white dark:bg-[#283036] rounded-xl border border-surface dark:border-[#38434F] p-4 hover:border-amber-200 hover:shadow-sm transition-all">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] flex items-center justify-center flex-shrink-0">
                  <Pencil size={13} className="text-amber-600" />
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    value={c.name}
                    onChange={(e) => updateCert(i, { name: e.target.value })}
                    placeholder="Certification name"
                    className="bg-surface dark:bg-[#222B31] border border-surface dark:border-[#38434F] rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all placeholder:text-slate-300 dark:placeholder:text-[#8B949E] dark:text-white"
                  />
                  <input
                    value={c.issuer || ''}
                    onChange={(e) => updateCert(i, { issuer: e.target.value })}
                    placeholder="Issuer"
                    className="bg-surface dark:bg-[#222B31] border border-surface dark:border-[#38434F] rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all placeholder:text-slate-300 dark:placeholder:text-[#8B949E] dark:text-white"
                  />
                  <input
                    value={c.year || ''}
                    onChange={(e) => updateCert(i, { year: e.target.value })}
                    placeholder="Year"
                    className="bg-surface dark:bg-[#222B31] border border-surface dark:border-[#38434F] rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all placeholder:text-slate-300 dark:placeholder:text-[#8B949E] dark:text-white"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeCert(i)}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-surface dark:bg-[#283036] border border-surface dark:border-[#38434F] text-slate-400 dark:text-[#B0B7BE] hover:text-red-500 hover:border-red-200 opacity-0 group-hover:opacity-100 transition-all"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PROFESSIONAL LINKS ===== */}
      <section id="links" className="bg-surface dark:bg-[#283036] rounded-3xl border border-surface/80 dark:border-[#38434F] shadow-sm dark:shadow-[#1D2226]/50 overflow-hidden scroll-mt-20">
        <div className="px-6 pt-6 pb-4 border-b border-surface dark:border-[#38434F]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] flex items-center justify-center">
              <ExternalLink size={15} className="text-[#0A66C2]" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#0F172A] dark:text-white m-0">Professional Links</h2>
              <p className="text-[10px] font-medium text-slate-400 dark:text-[#B0B7BE] m-0">Connect your profiles</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] font-bold text-slate-400 dark:text-[#B0B7BE] uppercase tracking-widest mb-1.5">LinkedIn</p>
              <div className="relative">
                <Linkedin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0A66C2]" />
                <input
                  value={extras.social_links?.linkedin || ''}
                  onChange={(e) => onExtrasChange({ social_links: { ...extras.social_links, linkedin: e.target.value } as SocialLinks })}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full bg-surface dark:bg-[#222B31] border border-surface dark:border-[#38434F] rounded-xl pl-10 pr-4 py-3 text-xs font-semibold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all placeholder:text-slate-300 dark:placeholder:text-[#8B949E] dark:text-white"
                />
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 dark:text-[#B0B7BE] uppercase tracking-widest mb-1.5">Portfolio</p>
              <div className="relative">
                <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={extras.social_links?.portfolio || ''}
                  onChange={(e) => onExtrasChange({ social_links: { ...extras.social_links, portfolio: e.target.value } as SocialLinks })}
                  placeholder="https://yourportfolio.com"
                  className="w-full bg-surface dark:bg-[#222B31] border border-surface dark:border-[#38434F] rounded-xl pl-10 pr-4 py-3 text-xs font-semibold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all placeholder:text-slate-300 dark:placeholder:text-[#8B949E] dark:text-white"
                />
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 dark:text-[#B0B7BE] uppercase tracking-widest mb-1.5">GitHub</p>
              <div className="relative">
                <Github size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-700 dark:text-[#B0B7BE]" />
                <input
                  value={extras.social_links?.github || ''}
                  onChange={(e) => onExtrasChange({ social_links: { ...extras.social_links, github: e.target.value } as SocialLinks })}
                  placeholder="https://github.com/username"
                  className="w-full bg-surface dark:bg-[#222B31] border border-surface dark:border-[#38434F] rounded-xl pl-10 pr-4 py-3 text-xs font-semibold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all placeholder:text-slate-300 dark:placeholder:text-[#8B949E] dark:text-white"
                />
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 dark:text-[#B0B7BE] uppercase tracking-widest mb-1.5">Website</p>
              <div className="relative">
                <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={extras.social_links?.website || ''}
                  onChange={(e) => onExtrasChange({ social_links: { ...extras.social_links, website: e.target.value } as SocialLinks })}
                  placeholder="https://yourwebsite.com"
                  className="w-full bg-surface dark:bg-[#222B31] border border-surface dark:border-[#38434F] rounded-xl pl-10 pr-4 py-3 text-xs font-semibold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all placeholder:text-slate-300 dark:placeholder:text-[#8B949E] dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== RESUME ===== */}
      <section id="resume" className="bg-surface dark:bg-[#283036] rounded-3xl border border-surface/80 dark:border-[#38434F] shadow-sm dark:shadow-[#1D2226]/50 overflow-hidden scroll-mt-20">
        <div className="px-6 pt-6 pb-4 border-b border-surface dark:border-[#38434F]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] flex items-center justify-center">
              <FileText size={15} className="text-[#0A66C2]" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#0F172A] dark:text-white m-0">Resume</h2>
              <p className="text-[10px] font-medium text-slate-400 dark:text-[#B0B7BE] m-0">Share your professional background</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-[#283036] border border-surface dark:border-[#38434F]">
            <FileText size={20} className="text-slate-400 dark:text-[#B0B7BE]" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-700 dark:text-[#B0B7BE] m-0">{extras.resume_url ? 'Resume uploaded' : 'No resume uploaded'}</p>
              <p className="text-[10px] text-slate-400 dark:text-[#B0B7BE] m-0">PDF format, max 5MB</p>
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A66C2] text-white text-xs font-bold cursor-pointer hover:shadow-lg hover:shadow-[#0A66C2]/25 transition-all">
              {uploadingResume ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {extras.resume_url ? 'Replace' : 'Upload'}
              <input type="file" accept=".pdf" className="hidden" onChange={handleResumeUpload} />
            </label>
            {extras.resume_url && (
              <a
                href={extras.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 hover:text-[#0A66C2] hover:underline"
              >
                <ExternalLink size={12} /> View
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ===== MENTORSHIP DETAILS ===== */}
      <section id="mentorship" className="bg-surface dark:bg-[#283036] rounded-3xl border border-surface/80 dark:border-[#38434F] shadow-sm dark:shadow-[#1D2226]/50 overflow-hidden scroll-mt-20">
        <div className="px-6 pt-6 pb-4 border-b border-surface dark:border-[#38434F]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] flex items-center justify-center">
              <ExternalLink size={15} className="text-rose-600" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#0F172A] dark:text-white m-0">Mentorship Details</h2>
              <p className="text-[10px] font-medium text-slate-400 dark:text-[#B0B7BE] m-0">How you can help juniors</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-3">
            {(
              [
                ['available_for_mentorship', 'Available for Mentorship', '🎯', 'Guide juniors with career advice and industry insights'],
                ['available_for_referrals', 'Available for Referrals', '🤝', 'Provide job referrals to qualified juniors'],
                ['available_for_mock_interviews', 'Available for Mock Interviews', '🎤', 'Conduct mock interviews to help prepare'],
              ] as const
            ).map(([key, label, emoji, desc]) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  onExtrasChange({
                    mentorship: { ...mentorship, [key]: !mentorship[key] },
                  })
                }
                className={`toggle-card text-left p-4 rounded-xl border-2 ${
                  mentorship[key]
                    ? 'active border-[#D9E2EC] bg-[#EAF4FF]/50'
                    : 'border-surface dark:border-[#38434F] bg-surface dark:bg-[#283036] hover:bg-app dark:hover:bg-[#1D2226]'
                } transition-all`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">{emoji}</span>
                  <span className={`text-xs font-extrabold ${mentorship[key] ? 'text-[#0A66C2]' : 'text-slate-700 dark:text-[#B0B7BE]'}`}>
                    {label}
                  </span>
                  {mentorship[key] && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-[#0A66C2] flex items-center justify-center">
                      <Check size={11} className="text-white" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-medium text-slate-400 dark:text-[#B0B7BE] m-0 leading-tight">{desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
