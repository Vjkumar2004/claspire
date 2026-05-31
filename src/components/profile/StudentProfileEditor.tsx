'use client'

import { Plus, X, Upload, Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { CertificationItem, ProjectItem, StudentProfileExtras } from '@/lib/profile-data'

type Props = {
  formData: {
    bio: string
    branch: string
    year: string
    passout_year: string
    linkedin_url: string
  }
  extras: StudentProfileExtras
  onFormChange: (patch: Partial<Props['formData']>) => void
  onExtrasChange: (patch: Partial<StudentProfileExtras>) => void
  collegeName?: string
}

function SkillsEditor({
  skills,
  onChange,
}: {
  skills: string[]
  onChange: (skills: string[]) => void
}) {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim()
    if (!v || skills.includes(v)) return
    onChange([...skills, v])
    setInput('')
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {skills.map((s) => (
          <span key={s} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-100">
            {s}
            <button type="button" onClick={() => onChange(skills.filter((x) => x !== s))} className="text-purple-400 hover:text-purple-700">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Add skill (React, Python...)"
          className="flex-1 bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-purple-500"
        />
        <button type="button" onClick={add} className="px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold">
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}

export default function StudentProfileEditor({
  formData,
  extras,
  onFormChange,
  onExtrasChange,
  collegeName,
}: Props) {
  const [uploadingResume, setUploadingResume] = useState(false)

  const updateCert = (index: number, patch: Partial<CertificationItem>) => {
    const next = [...extras.certifications]
    next[index] = { ...next[index], ...patch }
    onExtrasChange({ certifications: next })
  }

  const removeCert = (index: number) => {
    onExtrasChange({ certifications: extras.certifications.filter((_, i) => i !== index) })
  }

  const updateProject = (index: number, patch: Partial<ProjectItem>) => {
    const next = [...extras.projects]
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

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🎓</span>
          <h2 className="text-sm font-extrabold text-[#0F172A]">Student Profile</h2>
        </div>
        <p className="text-[10px] font-semibold text-slate-400 mb-6">Goal: Internship, Placement, Guidance</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">About Me</label>
            <textarea
              value={formData.bio}
              onChange={(e) => onFormChange({ bio: e.target.value.slice(0, 400) })}
              placeholder="Tell seniors about your goals and interests..."
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium h-24 resize-none outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">College</label>
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-600">
              {collegeName || 'Not assigned'}
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Branch</label>
            <input
              value={formData.branch}
              onChange={(e) => onFormChange({ branch: e.target.value })}
              placeholder="e.g. CSE"
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Graduation Year</label>
            <select
              value={formData.passout_year}
              onChange={(e) => onFormChange({ passout_year: e.target.value })}
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-purple-500"
            >
              {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Current Year</label>
            <select
              value={formData.year}
              onChange={(e) => onFormChange({ year: e.target.value })}
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-purple-500"
            >
              {['1', '2', '3', '4'].map((y) => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
        <h3 className="text-xs font-extrabold text-[#0F172A] mb-4 uppercase tracking-wider">Skills</h3>
        <SkillsEditor skills={extras.skills} onChange={(skills) => onExtrasChange({ skills })} />
      </section>

      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider">Projects</h3>
          <button
            type="button"
            onClick={() => onExtrasChange({ projects: [...extras.projects, { title: '', description: '' }] })}
            className="text-[10px] font-bold text-purple-600 flex items-center gap-1"
          >
            <Plus size={14} /> Add
          </button>
        </div>
        {extras.projects.map((p, i) => (
          <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
            <input
              value={p.title}
              onChange={(e) => updateProject(i, { title: e.target.value })}
              placeholder="Project title"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none"
            />
            <textarea
              value={p.description || ''}
              onChange={(e) => updateProject(i, { description: e.target.value })}
              placeholder="Short description"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium h-16 resize-none outline-none"
            />
            <input
              value={p.link || ''}
              onChange={(e) => updateProject(i, { link: e.target.value })}
              placeholder="Project link (optional)"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold outline-none"
            />
          </div>
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider">Certifications</h3>
          <button
            type="button"
            onClick={() => onExtrasChange({ certifications: [...extras.certifications, { name: '' }] })}
            className="text-[10px] font-bold text-purple-600 flex items-center gap-1"
          >
            <Plus size={14} /> Add
          </button>
        </div>
        {extras.certifications.length === 0 && (
          <p className="text-xs text-slate-400 font-medium m-0">No certifications yet. Click Add to add one.</p>
        )}
        {extras.certifications.map((c, i) => (
          <div key={i} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Certificate {i + 1}</span>
              <button
                type="button"
                onClick={() => removeCert(i)}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-600"
              >
                <X size={14} /> Remove
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                value={c.name}
                onChange={(e) => updateCert(i, { name: e.target.value })}
                placeholder="Certification name"
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none"
              />
              <input
                value={c.issuer || ''}
                onChange={(e) => updateCert(i, { issuer: e.target.value })}
                placeholder="Issuer"
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold outline-none"
              />
              <input
                value={c.year || ''}
                onChange={(e) => updateCert(i, { year: e.target.value })}
                placeholder="Year"
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold outline-none"
              />
            </div>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
        <h3 className="text-xs font-extrabold text-[#0F172A] mb-4 uppercase tracking-wider">Links & Resume</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-2">LinkedIn</label>
            <input
              value={formData.linkedin_url}
              onChange={(e) => onFormChange({ linkedin_url: e.target.value })}
              placeholder="https://linkedin.com/in/..."
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-2">GitHub</label>
            <input
              value={extras.github_url || ''}
              onChange={(e) => onExtrasChange({ github_url: e.target.value })}
              placeholder="https://github.com/username"
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-purple-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-2">Resume</label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold cursor-pointer hover:bg-purple-700">
                {uploadingResume ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Upload PDF
                <input type="file" accept=".pdf" className="hidden" onChange={handleResumeUpload} />
              </label>
              {extras.resume_url && (
                <a href={extras.resume_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-purple-600 hover:underline">
                  View uploaded resume
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
        <h3 className="text-xs font-extrabold text-[#0F172A] mb-4 uppercase tracking-wider">Areas Looking For</h3>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ['internship', 'Internship'],
              ['job_referral', 'Job Referral'],
              ['mentor', 'Mentor'],
              ['startup_team', 'Startup Team'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={extras.areas_looking_for[key]}
                onChange={(e) =>
                  onExtrasChange({
                    areas_looking_for: { ...extras.areas_looking_for, [key]: e.target.checked },
                  })
                }
                className="accent-purple-600"
              />
              <span className="text-xs font-bold text-slate-700">{label}</span>
            </label>
          ))}
        </div>
      </section>
    </div>
  )
}
