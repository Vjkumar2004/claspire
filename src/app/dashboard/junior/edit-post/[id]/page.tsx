'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft, Save, Loader2, X, ImagePlus, Tag,
  Globe, Lock, AlertCircle
} from 'lucide-react'

const POST_TYPES = [
  { key: 'doubt', icon: '❓', label: 'Doubt', desc: 'Ask a question', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  { key: 'discussion', icon: '💬', label: 'Discussion', desc: 'Start a conversation', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  { key: 'experience', icon: '🏆', label: 'Experience', desc: 'Share your story', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  { key: 'referral_hunt', icon: '🎯', label: 'Referral Hunt', desc: 'Find a referral', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  { key: 'resource', icon: '📚', label: 'Resource', desc: 'Share study material', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
]

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState('doubt')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  // Image state
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([])
  const [imageUploading, setImageUploading] = useState(false)
  const [newUploadedUrls, setNewUploadedUrls] = useState<string[]>([])
  const imageRef = useRef<HTMLInputElement>(null)

  const [communitySlug, setCommunitySlug] = useState('')

  // Fetch post data
  useEffect(() => {
    if (!postId) return
    const fetchPost = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/posts/${postId}`)
        if (!res.ok) {
          const errData = await res.json()
          setError(errData.error || 'Failed to load post')
          return
        }
        const data = await res.json()
        const post = data.post

        setTitle(post.title || '')
        setContent(post.content || '')
        setType(post.type || 'doubt')
        setVisibility(post.visibility || 'public')
        setTags(post.tags || [])
        setCommunitySlug(post.communities?.slug || '')

        // Parse existing images
        let parsedUrls: string[] = []
        if (post.image_url) {
          try {
            parsedUrls = typeof post.image_url === 'string' && post.image_url.startsWith('[')
              ? JSON.parse(post.image_url)
              : typeof post.image_url === 'string' ? [post.image_url] : post.image_url
          } catch {
            parsedUrls = [post.image_url]
          }
        }
        setExistingImageUrls(parsedUrls)
      } catch (err) {
        setError('Failed to load post')
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [postId])

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
      if (t && !tags.includes(t) && tags.length < 5) {
        setTags([...tags, t])
        setTagInput('')
      }
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  // Remove an existing image (mark for R2 deletion)
  const removeExistingImage = (index: number) => {
    const urlToRemove = existingImageUrls[index]
    setRemovedImageUrls(prev => [...prev, urlToRemove])
    setExistingImageUrls(prev => prev.filter((_, i) => i !== index))
  }

  // Remove a newly added image (not yet saved)
  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index))
    setNewUploadedUrls(prev => prev.filter((_, i) => i !== index))
    if (imageRef.current) imageRef.current.value = ''
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const totalImages = existingImageUrls.length + newImages.length + files.length
    if (totalImages > 5) {
      setError('Maximum 5 images allowed.')
      return
    }

    const validFiles: File[] = []
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image format.')
        return
      }
      if (file.size >= 2 * 1024 * 1024) {
        setError('Image size must be less than 2MB')
        return
      }
      validFiles.push(file)
    }

    const newPreviews = validFiles.map(f => URL.createObjectURL(f))
    setNewImages(prev => [...prev, ...validFiles])
    setNewImagePreviews(prev => [...prev, ...newPreviews])

    // Upload immediately
    setImageUploading(true)
    setError('')
    try {
      const uploadedUrls: string[] = []
      for (const file of validFiles) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'post_image')

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        const data = await res.json()

        if (res.ok && data.url) {
          uploadedUrls.push(data.url)
        } else {
          setError(data.error || 'Upload failed for some images')
        }
      }
      if (uploadedUrls.length > 0) {
        setNewUploadedUrls(prev => [...prev, ...uploadedUrls])
      }
    } catch {
      setError('Image upload failed')
    } finally {
      setImageUploading(false)
      if (imageRef.current) imageRef.current.value = ''
    }
  }

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return }
    if (!content.trim()) { setError('Content is required'); return }
    if (content.trim().length < 20) { setError('Content must be at least 20 characters'); return }

    setError('')
    setSuccess('')
    setSaving(true)

    try {
      // Final image URLs = kept existing + newly uploaded
      const finalImageUrls = [...existingImageUrls, ...newUploadedUrls]

      const bodyParams = {
        post_id: postId,
        title: title.trim(),
        content: content.trim(),
        type,
        visibility,
        tags,
        image_url: finalImageUrls.length > 0 ? JSON.stringify(finalImageUrls) : null,
        deleted_image_urls: removedImageUrls
      }

      const res = await fetch('/api/posts/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyParams)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to update post')
        return
      }

      setSuccess('Post updated successfully!')

      // Navigate back after a short delay
      setTimeout(() => {
        router.push('/dashboard/junior?activeTab=doubts')
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
          <p className="text-sm font-semibold text-gray-500">Loading post...</p>
        </div>
      </div>
    )
  }

  if (error && !title) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-200 max-w-md text-center">
          <AlertCircle size={40} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Cannot Load Post</h2>
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

  const totalImageCount = existingImageUrls.length + newImages.length

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Back to My Doubts</span>
          </button>
          <div className="flex items-center gap-3">
            {success && (
              <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                {success}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || imageUploading}
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

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Post Type */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
            Post Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {POST_TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className="flex items-center gap-2.5 p-3 rounded-xl border-[1.5px] transition-all text-left"
                style={{
                  borderColor: type === t.key ? t.border : '#F3F4F6',
                  background: type === t.key ? t.bg : 'white',
                }}
              >
                <span className="text-lg">{t.icon}</span>
                <div>
                  <div className="text-xs font-bold" style={{ color: type === t.key ? t.color : '#374151' }}>
                    {t.label}
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium mt-0.5">{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Give your post a clear title..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all placeholder:text-gray-300"
            maxLength={150}
          />
          <p className="text-[10px] text-gray-400 mt-1.5 text-right">{title.length}/150</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
            Content
          </label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your content here..."
            rows={8}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all placeholder:text-gray-300 resize-none"
          />
          <p className="text-[10px] text-gray-400 mt-1.5 text-right">{content.length} characters</p>
        </div>

        {/* Images */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider">
              Images ({totalImageCount}/5)
            </label>
            {totalImageCount < 5 && (
              <button
                onClick={() => imageRef.current?.click()}
                disabled={imageUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors disabled:opacity-50"
              >
                <ImagePlus size={14} />
                Add Image
              </button>
            )}
          </div>
          <input
            ref={imageRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />

          {imageUploading && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-blue-50 rounded-lg">
              <Loader2 size={14} className="animate-spin text-blue-600" />
              <span className="text-xs font-semibold text-blue-600">Uploading images...</span>
            </div>
          )}

          {/* Existing images */}
          {existingImageUrls.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Current Images</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {existingImageUrls.map((url, i) => (
                  <div key={`existing-${i}`} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square">
                    {url.endsWith('.gif') || url.includes('.gif') ? (
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={() => removeExistingImage(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X size={12} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[9px] text-white font-bold">Existing</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New images */}
          {newImagePreviews.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">New Images</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {newImagePreviews.map((url, i) => (
                  <div key={`new-${i}`} className="relative group rounded-xl overflow-hidden border border-green-200 aspect-square">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeNewImage(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X size={12} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-900/50 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[9px] text-white font-bold">New</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalImageCount === 0 && !imageUploading && (
            <button
              onClick={() => imageRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-10 flex flex-col items-center gap-2 hover:border-purple-300 hover:bg-purple-50/30 transition-all cursor-pointer"
            >
              <ImagePlus size={28} className="text-gray-300" />
              <span className="text-xs font-semibold text-gray-400">Click to add images (max 5, each less than 2MB)</span>
            </button>
          )}
        </div>

        {/* Tags */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
            Tags ({tags.length}/5)
          </label>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-600 text-xs font-bold px-2.5 py-1 rounded-lg"
                >
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
          {tags.length < 5 && (
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-gray-400" />
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder="Type a tag and press Enter"
                className="flex-1 border-none outline-none text-sm text-gray-700 placeholder:text-gray-300"
              />
            </div>
          )}
        </div>

        {/* Visibility */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
            Visibility
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setVisibility('public')}
              className={`flex-1 flex items-center gap-2.5 p-3 rounded-xl border-[1.5px] transition-all ${
                visibility === 'public'
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <Globe size={16} className={visibility === 'public' ? 'text-green-600' : 'text-gray-400'} />
              <div>
                <div className={`text-xs font-bold ${visibility === 'public' ? 'text-green-700' : 'text-gray-600'}`}>Public</div>
                <div className="text-[10px] text-gray-400 font-medium">Everyone can see</div>
              </div>
            </button>
            <button
              onClick={() => setVisibility('private')}
              className={`flex-1 flex items-center gap-2.5 p-3 rounded-xl border-[1.5px] transition-all ${
                visibility === 'private'
                  ? 'border-purple-300 bg-purple-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <Lock size={16} className={visibility === 'private' ? 'text-purple-600' : 'text-gray-400'} />
              <div>
                <div className={`text-xs font-bold ${visibility === 'private' ? 'text-purple-700' : 'text-gray-600'}`}>Private</div>
                <div className="text-[10px] text-gray-400 font-medium">Community only</div>
              </div>
            </button>
          </div>
        </div>

        {/* Bottom Save Button */}
        <div className="pt-4 pb-12">
          <button
            onClick={handleSave}
            disabled={saving || imageUploading}
            className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-2xl text-sm font-black hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <><Loader2 size={18} className="animate-spin" /> Updating Post...</>
            ) : (
              <><Save size={18} /> Save Changes</>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
