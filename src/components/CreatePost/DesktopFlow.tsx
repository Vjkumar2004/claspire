import { X, Globe, Lock, Check } from 'lucide-react'
import { PostData, PostModalContextType, POST_TYPES, PostType } from './types'
import RichEditor from './RichEditor'
import ImageUploadZone from './ImageUploadZone'
import SmartTags from './SmartTags'

interface DesktopFlowProps {
  data: PostData
  setData: (data: PostData | ((prev: PostData) => PostData)) => void
  context: PostModalContextType
  onSubmit: () => void
  loading: boolean
}

export default function DesktopFlow({ data, setData, context, onSubmit, loading }: DesktopFlowProps) {
  const selectedTypeInfo = POST_TYPES.find(t => t.key === data.type)

  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
      <div className="w-full max-w-[1200px] h-[90vh] bg-white dark:bg-[#0B0F19] rounded-[32px] border border-slate-200 dark:border-white/10 shadow-[0_0_80px_rgba(139,92,246,0.15)] flex overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Left Side: Editor Section (65%) */}
        <div className="w-[65%] h-full flex flex-col relative border-r border-slate-200 dark:border-white/10">
          
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02] backdrop-blur-xl">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{context.editData ? 'Edit Post' : 'Create Post'}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-slate-500 dark:text-white/50">Posting in:</span>
                <span className="bg-[#FFF3D6] dark:bg-purple-500/20 text-[#E09410] dark:text-purple-300 px-3 py-1 rounded-full text-xs font-bold border border-[#F4A01C]/30 dark:border-purple-500/30">
                  c/{context.communitySlug}
                </span>
              </div>
            </div>
            {context.canPostAsCollege && (
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
                <button
                  onClick={() => setData({ ...data, isCollegePost: false })}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${!data.isCollegePost ? 'bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white'}`}
                >
                  Personal
                </button>
                <button
                  onClick={() => setData({ ...data, isCollegePost: true })}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${data.isCollegePost ? 'bg-[#FFF3D6] text-[#E09410] dark:bg-purple-500/20 dark:text-purple-300' : 'text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white'}`}
                >
                  {context.collegeName || 'Official'}
                </button>
              </div>
            )}
          </div>

          {/* Editor Body */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
            
            {/* Post Type Selection */}
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-white/80 mb-3 block ml-1">Post Type</label>
              <div className="grid grid-cols-5 gap-3">
                {POST_TYPES.map(t => {
                  const isSelected = data.type === t.key
                  return (
                    <button
                      key={t.key}
                      onClick={() => setData({ ...data, type: t.key as PostType })}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 group ${
                        isSelected 
                          ? 'border-[#F4A01C] bg-[#FFF3D6] dark:bg-purple-500/10 shadow-[0_0_30px_rgba(139,92,246,0.15)] -translate-y-1' 
                          : 'border-slate-200 bg-slate-50 dark:border-white/5 dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20 hover:-translate-y-0.5'
                      }`}
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">{t.icon}</span>
                      <span className={`text-xs font-bold ${isSelected ? 'text-[#E09410] dark:text-purple-300' : 'text-slate-600 dark:text-white/70'}`}>{t.label}</span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#F4A01C] flex items-center justify-center text-white">
                          <Check size={10} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-2">
              <input
                type="text"
                placeholder={selectedTypeInfo?.label === 'Doubt' ? "What is your doubt?" : "What would you like to share today?"}
                value={data.title}
                onChange={e => setData({ ...data, title: e.target.value })}
                maxLength={120}
                className="w-full bg-transparent border-b-2 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 focus:border-[#F4A01C] py-4 text-3xl font-bold text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-white/20 outline-none transition-colors"
              />
              <div className="text-right text-xs text-slate-400 dark:text-white/40 font-medium">{data.title.length} / 120</div>
            </div>

            {/* Rich Editor */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-white/80 ml-1">Content</label>
              <RichEditor 
                value={data.content} 
                onChange={val => setData({ ...data, content: val })} 
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-white/80 ml-1">Images</label>
              <ImageUploadZone 
                images={data.images} 
                imageUrls={data.imageUrls} 
                onImagesSelected={files => setData(prev => ({ ...prev, images: [...prev.images, ...files].slice(0, 5) }))} 
                onRemoveImage={(idx, isExisting) => {
                  if (isExisting) {
                    const removed = data.imageUrls[idx]
                    setData(prev => ({ 
                      ...prev, 
                      imageUrls: prev.imageUrls.filter((_, i) => i !== idx),
                      removedImageUrls: [...prev.removedImageUrls, removed]
                    }))
                  } else {
                    setData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))
                  }
                }} 
              />
            </div>

            {/* Tags */}
            <SmartTags 
              tags={data.tags}
              onAddTag={tag => setData(prev => ({ ...prev, tags: [...prev.tags, tag] }))}
              onRemoveTag={tag => setData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}
            />

            {/* Visibility Settings */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-white/80 ml-1">Visibility</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setData({ ...data, visibility: 'public' })}
                  className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                    data.visibility === 'public'
                      ? 'border-cyan-500/50 bg-cyan-50 dark:bg-cyan-500/10'
                      : 'border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <Globe className={`mt-0.5 ${data.visibility === 'public' ? 'text-cyan-500 dark:text-cyan-400' : 'text-slate-400 dark:text-white/50'}`} size={20} />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Public</div>
                    <div className="text-xs text-slate-500 dark:text-white/50 mt-1">Visible to everyone in this community</div>
                  </div>
                </button>
                <button
                  onClick={() => setData({ ...data, visibility: 'private' })}
                  className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                    data.visibility === 'private'
                      ? 'border-[#F4A01C]/50 bg-[#FFF3D6] dark:bg-purple-500/10'
                      : 'border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <Lock className={`mt-0.5 ${data.visibility === 'private' ? 'text-[#F4A01C] dark:text-purple-400' : 'text-slate-400 dark:text-white/50'}`} size={20} />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Private</div>
                    <div className="text-xs text-slate-500 dark:text-white/50 mt-1">Visible only to community members</div>
                  </div>
                </button>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] backdrop-blur-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-white/50">
              {data.title && data.content && <><Check size={16} className="text-green-500 dark:text-green-400" /> Draft Saved</>}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={context.onClose} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button 
                onClick={onSubmit}
                disabled={loading || !data.title.trim() || !data.content.trim()}
                className="px-8 py-3 bg-gradient-to-r from-[#0A2540] to-cyan-600 hover:from-[#F4A01C] hover:to-cyan-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
              >
                {loading ? 'Publishing...' : 'Publish Post 🚀'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Live Preview (35%) */}
        <div className="w-[35%] h-full bg-slate-50 dark:bg-[#0F1423] flex flex-col relative">
          <div className="absolute top-4 right-4 z-10">
            <button onClick={context.onClose} className="p-2 bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 rounded-full text-slate-500 dark:text-white/50 dark:hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-8 border-b border-slate-200 dark:border-white/5">
            <h3 className="text-sm font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">Live Preview</h3>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-8">
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[24px] p-6 shadow-xl">
              {/* Post Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#F4A01C] to-cyan-500 flex items-center justify-center overflow-hidden shrink-0">
                  {data.isCollegePost && context.collegeLogo ? (
                    <img src={context.collegeLogo} className="w-full h-full object-cover" alt="" />
                  ) : context.user.avatarUrl ? (
                    <img src={context.user.avatarUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-white font-bold text-xl">{context.user.name[0]}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 dark:text-white">{data.isCollegePost ? context.collegeName : context.user.name}</span>
                    {(context.user.isVerified || data.isCollegePost) && (
                      <Check size={14} className="text-cyan-500 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-400/20 rounded-full p-0.5" />
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-white/50 mt-0.5">
                    {data.isCollegePost ? 'Official Account' : `${context.user.collegeName || 'College'} • ${context.user.role || 'Student'}`}
                  </div>
                </div>
              </div>

              {/* Post Title & Type */}
              <div className="mb-3 flex items-start gap-2">
                <span className="text-xl mt-0.5">{selectedTypeInfo?.icon}</span>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white leading-snug break-words">
                  {data.title || <span className="text-slate-300 dark:text-white/20">Post title will appear here...</span>}
                </h4>
              </div>

              {/* Content Preview */}
              <div className="text-sm text-slate-700 dark:text-white/70 break-words opacity-80 line-clamp-6 [&>blockquote]:border-l-4 [&>blockquote]:border-[#F4A01C] [&>blockquote]:pl-4 [&>blockquote]:text-slate-500 dark:[&>blockquote]:text-white/70 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>a]:text-cyan-500 dark:[&>a]:text-cyan-400 [&>a]:underline">
                {data.content ? (
                  <div dangerouslySetInnerHTML={{ __html: data.content }} />
                ) : (
                  <span className="text-slate-300 dark:text-white/20">Post content will appear here...</span>
                )}
              </div>

              {/* Tags Preview */}
              {data.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {data.tags.map(t => (
                    <span key={t} className="text-xs text-[#E09410] bg-[#FFF3D6] dark:text-purple-300 dark:bg-purple-500/10 px-2 py-1 rounded-md">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Images Preview */}
              {(data.images.length > 0 || data.imageUrls.length > 0) && (
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
                  {data.imageUrls.slice(0, 2).map((url, i) => (
                    <div key={i} className="aspect-video bg-slate-100 dark:bg-white/5">
                      <img src={url} className="w-full h-full object-cover" alt="" />
                    </div>
                  ))}
                  {data.images.slice(0, Math.max(0, 2 - data.imageUrls.length)).map((file, i) => (
                    <div key={i} className="aspect-video bg-slate-100 dark:bg-white/5">
                      <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="" />
                    </div>
                  ))}
                </div>
              )}

              {/* Fake Actions */}
              <div className="flex items-center gap-6 mt-6 pt-4 border-t border-slate-200 dark:border-white/5 text-slate-400 dark:text-white/40">
                <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full border border-slate-300 dark:border-white/20"></span> 0</div>
                <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full border border-slate-300 dark:border-white/20"></span> 0 Answers</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
