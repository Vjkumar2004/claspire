import { useState } from 'react'
import { X, ArrowRight, ArrowLeft, Globe, Lock, Check } from 'lucide-react'
import { PostData, PostModalContextType, POST_TYPES, PostType } from './types'
import RichEditor from './RichEditor'
import ImageUploadZone from './ImageUploadZone'
import SmartTags from './SmartTags'

interface MobileFlowProps {
  data: PostData
  setData: (data: PostData | ((prev: PostData) => PostData)) => void
  context: PostModalContextType
  onSubmit: () => void
  loading: boolean
}

export default function MobileFlow({ data, setData, context, onSubmit, loading }: MobileFlowProps) {
  const [step, setStep] = useState(1)

  const handleNext = () => setStep(s => Math.min(3, s + 1))
  const handleBack = () => setStep(s => Math.max(1, s - 1))

  const selectedTypeInfo = POST_TYPES.find(t => t.key === data.type)

  return (
    <div className="fixed inset-0 z-[1000] bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-white flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-xl z-10">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Create Post</h2>
          <div className="flex items-center gap-1 mt-1">
            <span className="h-1.5 w-6 rounded-full bg-purple-500"></span>
            <span className={`h-1.5 w-6 rounded-full ${step >= 2 ? 'bg-purple-500' : 'bg-slate-200 dark:bg-white/10'}`}></span>
            <span className={`h-1.5 w-6 rounded-full ${step >= 3 ? 'bg-purple-500' : 'bg-slate-200 dark:bg-white/10'}`}></span>
          </div>
        </div>
        <button onClick={context.onClose} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white">
          <X size={20} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative p-4 pb-24">
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-white/60 bg-clip-text text-transparent">What do you want to share?</h3>
              <p className="text-slate-500 dark:text-white/50 text-sm">Select a post type to get started</p>
            </div>
            
            <div className="space-y-3">
              {POST_TYPES.map(t => {
                const isSelected = data.type === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => setData({ ...data, type: t.key as PostType })}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                      isSelected 
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10 shadow-[0_0_30px_rgba(139,92,246,0.15)] scale-[1.02]' 
                        : 'border-slate-200 bg-slate-50 dark:border-white/5 dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="text-3xl bg-slate-100 dark:bg-white/5 p-3 rounded-xl">{t.icon}</div>
                    <div className="text-left flex-1">
                      <div className={`font-bold text-lg ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-slate-900 dark:text-white'}`}>{t.label}</div>
                      <div className="text-sm text-slate-500 dark:text-white/50">{t.desc}</div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white">
                        <Check size={14} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-white/80 ml-1">Title</label>
              <input
                type="text"
                placeholder={selectedTypeInfo?.label === 'Doubt' ? "What is your doubt?" : "What would you like to share?"}
                value={data.title}
                onChange={e => setData({ ...data, title: e.target.value })}
                maxLength={120}
                className="w-full bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-2xl px-4 py-4 text-lg font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 outline-none focus:border-purple-500/50 transition-colors"
              />
              <div className="text-right text-xs text-slate-400 dark:text-white/40">{data.title.length} / 120</div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-white/80 ml-1">Content</label>
              <RichEditor 
                value={data.content} 
                onChange={val => setData({ ...data, content: val })} 
              />
            </div>

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

            <SmartTags 
              tags={data.tags}
              onAddTag={tag => setData(prev => ({ ...prev, tags: [...prev.tags, tag] }))}
              onRemoveTag={tag => setData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <h3 className="text-xl font-bold mb-4">Post Settings</h3>
            
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-white/80 ml-1">Visibility</label>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setData({ ...data, visibility: 'public' })}
                  className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                    data.visibility === 'public'
                      ? 'border-cyan-500/50 bg-cyan-50 dark:bg-cyan-500/10'
                      : 'border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5'
                  }`}
                >
                  <Globe className={`mt-0.5 ${data.visibility === 'public' ? 'text-cyan-500 dark:text-cyan-400' : 'text-slate-400 dark:text-white/50'}`} size={20} />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Public</div>
                    <div className="text-sm text-slate-500 dark:text-white/50">Visible to everyone on Claspire</div>
                  </div>
                </button>
                <button
                  onClick={() => setData({ ...data, visibility: 'private' })}
                  className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                    data.visibility === 'private'
                      ? 'border-purple-500/50 bg-purple-50 dark:bg-purple-500/10'
                      : 'border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5'
                  }`}
                >
                  <Lock className={`mt-0.5 ${data.visibility === 'private' ? 'text-purple-500 dark:text-purple-400' : 'text-slate-400 dark:text-white/50'}`} size={20} />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Community Only</div>
                    <div className="text-sm text-slate-500 dark:text-white/50">Visible only to c/{context.communitySlug} members</div>
                  </div>
                </button>
              </div>
            </div>

            {context.canPostAsCollege && (
              <div className="space-y-3 mt-6">
                <label className="text-sm font-semibold text-slate-700 dark:text-white/80 ml-1">Post As</label>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500 flex items-center justify-center overflow-hidden">
                      {data.isCollegePost && context.collegeLogo ? (
                        <img src={context.collegeLogo} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span className="text-white font-bold">{context.user.name[0]}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{data.isCollegePost ? context.collegeName : context.user.name}</div>
                      <div className="text-xs text-slate-500 dark:text-white/50">{data.isCollegePost ? 'Official Account' : 'Personal Account'}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setData({ ...data, isCollegePost: !data.isCollegePost })}
                    className="text-purple-400 text-sm font-bold bg-purple-500/10 px-3 py-1.5 rounded-lg hover:bg-purple-500/20"
                  >
                    Switch
                  </button>
                </div>
              </div>
            )}
            
            <div className="mt-8 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <h4 className="text-sm font-bold text-slate-700 dark:text-white/80 mb-2">Preview Overview</h4>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{selectedTypeInfo?.icon}</span>
                <span className="font-bold text-slate-900 dark:text-white">{data.title || 'Untitled Post'}</span>
              </div>
              <div className="text-sm text-slate-500 dark:text-white/50 line-clamp-2 [&>blockquote]:border-l-4 [&>blockquote]:border-purple-500 [&>blockquote]:pl-4 [&>blockquote]:text-slate-500 dark:[&>blockquote]:text-white/70 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>a]:text-cyan-500 dark:[&>a]:text-cyan-400 [&>a]:underline">
                {data.content ? (
                  <div dangerouslySetInnerHTML={{ __html: data.content }} />
                ) : (
                  'No content written yet...'
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <span className="text-xs px-2 py-1 bg-slate-200 dark:bg-white/10 rounded-md text-slate-600 dark:text-white/70">
                  {data.images.length + data.imageUrls.length} images
                </span>
                <span className="text-xs px-2 py-1 bg-slate-200 dark:bg-white/10 rounded-md text-slate-600 dark:text-white/70">
                  {data.tags.length} tags
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 flex items-center justify-between z-20">
        {step > 1 ? (
          <button onClick={handleBack} className="flex items-center gap-2 px-4 py-3 rounded-xl text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors font-semibold">
            <ArrowLeft size={18} />
            Back
          </button>
        ) : (
          <div></div> // Spacer
        )}
        
        {step < 3 ? (
          <button 
            onClick={handleNext}
            disabled={step === 2 && (!data.title.trim() || !data.content.trim())}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white dark:bg-white dark:text-black rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ArrowRight size={18} />
          </button>
        ) : (
          <button 
            onClick={onSubmit}
            disabled={loading || !data.title.trim() || !data.content.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all disabled:opacity-50"
          >
            {loading ? 'Publishing...' : 'Publish Post 🚀'}
          </button>
        )}
      </div>
    </div>
  )
}
