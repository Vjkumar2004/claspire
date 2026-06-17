'use client'
import { useState, useRef, useEffect } from 'react'

interface PostImageCarouselProps {
  imageUrls: string | null
  onImageClick?: (url: string) => void
}

export default function PostImageCarousel({ imageUrls, onImageClick }: PostImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  if (!imageUrls) return null

  let urls: string[] = []
  try {
    urls = imageUrls.startsWith('[') ? JSON.parse(imageUrls) : [imageUrls]
  } catch {
    urls = [imageUrls]
  }

  if (urls.length === 0) return null

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollLeft = containerRef.current.scrollLeft
      const width = containerRef.current.offsetWidth
      const index = Math.round(scrollLeft / width)
      setActiveIndex(index)
    }
  }

  return (
    <div className="relative mb-2.5 group">
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory rounded border border-surface bg-app"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`
          .hide-scroll::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {urls.map((url, index) => (
          <div 
            key={index} 
            className={`flex-none w-full flex items-center justify-center snap-center hide-scroll ${
              urls.length === 1 ? 'max-h-[600px]' : 'max-h-[350px]'
            }`}
          >
            <img
              src={url}
              alt={`Attached post media ${index + 1}`}
              onClick={() => onImageClick?.(url)}
              className={`w-full hover:opacity-95 transition-opacity cursor-zoom-in ${
                urls.length === 1 ? 'object-contain max-h-[600px]' : 'object-cover max-h-[350px]'
              }`}
            />
          </div>
        ))}
      </div>

      {urls.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
          {urls.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${
                index === activeIndex 
                  ? 'bg-surface w-4' 
                  : 'bg-surface/50 w-1.5'
              }`}
            />
          ))}
        </div>
      )}

      {/* Navigation Arrows (visible on hover for desktop) */}
      {urls.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (containerRef.current && activeIndex > 0) {
                containerRef.current.scrollTo({
                  left: containerRef.current.offsetWidth * (activeIndex - 1),
                  behavior: 'smooth'
                })
              }
            }}
            className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 ${activeIndex === 0 ? 'hidden' : ''}`}
          >
            ←
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (containerRef.current && activeIndex < urls.length - 1) {
                containerRef.current.scrollTo({
                  left: containerRef.current.offsetWidth * (activeIndex + 1),
                  behavior: 'smooth'
                })
              }
            }}
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 ${activeIndex === urls.length - 1 ? 'hidden' : ''}`}
          >
            →
          </button>
        </>
      )}
    </div>
  )
}
