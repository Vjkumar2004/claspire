import { useRef, useState, DragEvent, ChangeEvent } from 'react'
import { ImagePlus, X, UploadCloud } from 'lucide-react'

interface ImageUploadZoneProps {
  images: File[]
  imageUrls: string[]
  onImagesSelected: (files: File[]) => void
  onRemoveImage: (index: number, isExistingUrl: boolean) => void
}

export default function ImageUploadZone({ images, imageUrls, onImagesSelected, onRemoveImage }: ImageUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => file.type.startsWith('image/'))
    if (validFiles.length > 0) {
      onImagesSelected(validFiles)
    }
  }

  const totalImages = images.length + imageUrls.length

  return (
    <div className="space-y-4">
      {totalImages < 5 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
            isDragging 
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10' 
              : 'border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 hover:border-purple-500/50 hover:bg-slate-100 dark:hover:bg-white/10'
          }`}
        >
          <div className="px-6 py-10 flex flex-col items-center justify-center text-center">
            <div className={`p-4 rounded-full mb-4 transition-all duration-300 ${isDragging ? 'bg-purple-100 dark:bg-purple-500/20 scale-110' : 'bg-slate-200 dark:bg-white/5 group-hover:bg-purple-100 dark:group-hover:bg-purple-500/20 group-hover:scale-110'}`}>
              <UploadCloud size={32} className={isDragging ? 'text-purple-500 dark:text-purple-400' : 'text-slate-400 dark:text-white/60 group-hover:text-purple-500 dark:group-hover:text-purple-400'} />
            </div>
            <h3 className="text-slate-900 dark:text-white font-medium mb-1">Drag & Drop Images Here</h3>
            <p className="text-slate-500 dark:text-white/50 text-sm mb-4">or click to upload</p>
            <div className="flex gap-2 text-xs font-semibold text-slate-400 dark:text-white/40 tracking-wider">
              <span>PNG</span>
              <span>•</span>
              <span>JPG</span>
              <span>•</span>
              <span>WEBP</span>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            accept="image/png, image/jpeg, image/webp, image/gif"
            multiple
            className="hidden"
          />
        </div>
      )}

      {totalImages > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {imageUrls.map((url, index) => (
            <div key={`url-${index}`} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-200 dark:border-white/10">
              <img src={url} alt="Uploaded" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemoveImage(index, true) }}
                  className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full transform scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
          {images.map((file, index) => (
            <div key={`file-${index}`} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-200 dark:border-white/10">
              <img src={URL.createObjectURL(file)} alt="To upload" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemoveImage(index, false) }}
                  className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full transform scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
