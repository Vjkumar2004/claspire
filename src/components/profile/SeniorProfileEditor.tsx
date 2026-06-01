'use client'

import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { DEFAULT_MENTORSHIP } from '@/lib/profile-data'
import type { CertificationItem, SeniorProfileExtras } from '@/lib/profile-data'

type Props = {
  formData: {
    bio: string
    company: string
    designation: string
    graduation_year: string
    linkedin_url: string
  }
  extras: SeniorProfileExtras
  onFormChange: (patch: Partial<Props['formData']>) => void
  onExtrasChange: (patch: Partial<SeniorProfileExtras>) => void
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
          <span key={s} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-50 text-cyan-700 text-[10px] font-bold border border-cyan-100">
            {s}
            <button type="button" onClick={() => onChange(skills.filter((x) => x !== s))} className="text-cyan-400 hover:text-cyan-700">
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
          placeholder="Add skill"
          className="flex-1 bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-cyan-500"
        />
        <button type="button" onClick={add} className="px-3 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold">
          <Plus size={14} />
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
  const mentorship = { ...DEFAULT_MENTORSHIP, ...(extras.mentorship || {}) }

  const updateCert = (index: number, patch: Partial<CertificationItem>) => {
    const next = [...certifications]
    next[index] = { ...next[index], ...patch }
    onExtrasChange({ certifications: next })
  }

  const removeCert = (index: number) => {
    onExtrasChange({ certifications: certifications.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">💼</span>
          <h2 className="text-sm font-extrabold text-[#0F172A]">Professional Profile</h2>
        </div>
        <p className="text-[10px] font-semibold text-slate-400 mb-6">Goal: Mentoring, Hiring, Networking</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">About Me</label>
            <textarea
              value={formData.bio}
              onChange={(e) => onFormChange({ bio: e.target.value.slice(0, 400) })}
              placeholder="Share your professional journey and how you help juniors..."
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium h-24 resize-none outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Current Company</label>
            <input
              value={formData.company}
              onChange={(e) => onFormChange({ company: e.target.value })}
              placeholder="Company name"
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Designation</label>
            <input
              value={formData.designation}
              onChange={(e) => onFormChange({ designation: e.target.value })}
              placeholder="Your role"
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Experience (Years)</label>
            <input
              type="number"
              min={0}
              max={50}
              value={extras.experience_years ?? ''}
              onChange={(e) => onExtrasChange({ experience_years: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="e.g. 3"
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Industry</label>
            <input
              value={extras.industry || ''}
              onChange={(e) => onExtrasChange({ industry: e.target.value })}
              placeholder="e.g. IT / SaaS"
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Alumni College</label>
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-600">
              {collegeName || 'Not assigned'}
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Graduation Year</label>
            <select
              value={formData.graduation_year}
              onChange={(e) => onFormChange({ graduation_year: e.target.value })}
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-cyan-500"
            >
              {[2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
        <h3 className="text-xs font-extrabold text-[#0F172A] mb-4 uppercase tracking-wider">Skills</h3>
        <SkillsEditor skills={skills} onChange={(nextSkills) => onExtrasChange({ skills: nextSkills })} />
      </section>

      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider">Certifications</h3>
          <button
            type="button"
            onClick={() => onExtrasChange({ certifications: [...certifications, { name: '' }] })}
            className="text-[10px] font-bold text-cyan-600 flex items-center gap-1"
          >
            <Plus size={14} /> Add
          </button>
        </div>
        {certifications.length === 0 && (
          <p className="text-xs text-slate-400 font-medium m-0">No certifications yet. Click Add to add one.</p>
        )}
        {certifications.map((c, i) => (
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
        <h3 className="text-xs font-extrabold text-[#0F172A] mb-4 uppercase tracking-wider">Professional Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-2">LinkedIn</label>
            <input
              value={formData.linkedin_url}
              onChange={(e) => onFormChange({ linkedin_url: e.target.value })}
              placeholder="https://linkedin.com/in/..."
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-2">Portfolio</label>
            <input
              value={extras.portfolio_url || ''}
              onChange={(e) => onExtrasChange({ portfolio_url: e.target.value })}
              placeholder="https://yourportfolio.com"
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-2">GitHub (optional)</label>
            <input
              value={extras.github_url || ''}
              onChange={(e) => onExtrasChange({ github_url: e.target.value })}
              placeholder="https://github.com/username"
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
        <h3 className="text-xs font-extrabold text-[#0F172A] mb-4 uppercase tracking-wider">Mentorship Details</h3>
        <div className="grid grid-cols-1 gap-3">
          {(
            [
              ['available_for_mentorship', 'Available for Mentorship'],
              ['available_for_referrals', 'Available for Referrals'],
              ['available_for_mock_interviews', 'Available for Mock Interviews'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={mentorship[key]}
                onChange={(e) =>
                  onExtrasChange({
                    mentorship: { ...mentorship, [key]: e.target.checked },
                  })
                }
                className="accent-cyan-600"
              />
              <span className="text-xs font-bold text-slate-700">{label}</span>
            </label>
          ))}
        </div>
      </section>
    </div>
  )
}
