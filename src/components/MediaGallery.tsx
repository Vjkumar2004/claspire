'use client'
import { useState } from 'react'
import ImageViewer from './ImageViewer'

interface MediaGalleryProps {
  imageUrls: string | null
}

export default function MediaGallery({ imageUrls }: MediaGalleryProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  if (!imageUrls) return null

  let urls: string[] = []
  try {
    urls = imageUrls.startsWith('[') ? JSON.parse(imageUrls) : [imageUrls]
  } catch {
    urls = [imageUrls]
  }

  if (urls.length === 0) return null

  const openViewer = (index: number) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }

  const remaining = urls.length > 5 ? urls.length - 5 : 0

  const renderGallery = () => {
    switch (urls.length) {
      case 1:
        return (
          <div
            onClick={() => openViewer(0)}
            className="relative overflow-hidden rounded-none cursor-pointer group"
          >
            <img
              src={urls[0]}
              alt="Post media"
              loading="lazy"
              className="w-full object-cover max-h-[600px] md:max-h-[450px] group-hover:scale-[1.01] transition-transform duration-300 rounded-none"
            />
          </div>
        )
      case 2:
        return (
          <div className="grid grid-cols-2 gap-1.5">
            {urls.slice(0, 2).map((url, i) => (
              <div
                key={i}
                onClick={() => openViewer(i)}
                className="relative overflow-hidden rounded-none cursor-pointer group aspect-[4/3]"
              >
                <img
                  src={url}
                  alt={`Post media ${i + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300 rounded-none"
                />
              </div>
            ))}
          </div>
        )
      case 3:
        return (
          <div className="flex gap-1.5 rounded-none overflow-hidden">
            <div
              onClick={() => openViewer(0)}
              className="w-[65%] aspect-[4/3] relative overflow-hidden cursor-pointer group rounded-none"
            >
              <img
                src={urls[0]}
                alt="Post media 1"
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300 rounded-none"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              {urls.slice(1, 3).map((url, i) => (
                <div
                  key={i}
                  onClick={() => openViewer(i + 1)}
                  className="flex-1 relative overflow-hidden cursor-pointer group rounded-none"
                >
                  <img
                    src={url}
                    alt={`Post media ${i + 2}`}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300 rounded-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )
      case 4:
        return (
          <div className="grid grid-cols-2 gap-1.5">
            {urls.slice(0, 4).map((url, i) => (
              <div
                key={i}
                onClick={() => openViewer(i)}
                className="relative overflow-hidden rounded-none cursor-pointer group aspect-[4/3]"
              >
                <img
                  src={url}
                  alt={`Post media ${i + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300 rounded-none"
                />
              </div>
            ))}
          </div>
        )
      default: {
        const displayUrls = urls.slice(0, 5)
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
            {displayUrls.map((url, i) => {
              const isLastOverlay = i === displayUrls.length - 1 && remaining > 0
              return (
                <div
                  key={i}
                  onClick={() => openViewer(i)}
                  className="relative overflow-hidden rounded-none cursor-pointer group aspect-[4/3]"
                >
                  <img
                    src={url}
                    alt={`Post media ${i + 1}`}
                    loading="lazy"
                    className={`w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300 rounded-none ${isLastOverlay ? 'opacity-80' : ''}`}
                  />
                  {isLastOverlay && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-none">
                      <span className="text-white text-base md:text-lg font-bold">+{remaining} more</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      }
    }
  }

  return (
    <>
      <div>{renderGallery()}</div>
      {viewerOpen && (
        <ImageViewer
          images={urls}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  )
}
